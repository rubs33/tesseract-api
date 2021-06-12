const bodyParser          = require('body-parser');
const childProcess        = require('child_process')
const express             = require('express');
const fetch               = require('node-fetch');
const { asyncMiddleware } = require('middleware-async');
const multer              = require('multer');
const util                = require('util');
const fs                  = require('fs');

const readFile = util.promisify(fs.readFile);
const spawn    = childProcess.spawn;
const unlink   = util.promisify(fs.unlink);

// Parse config from env vars
const config = {
  port: parseInt(process.env.APP_PORT, 10) || 3000,
  uploadLimit: process.env.UPLOAD_LIMIT || '100kb',
};


// Prepare app
const app = express();

const upload = multer({ dest: __dirname + '/uploads/' });

app.use(bodyParser.raw({ inflate: true, limit: config.uploadLimit, type: 'image/*' }));
app.use(bodyParser.json({ type: 'application/json' }));

/**
 * Get tesseract version
 */
app.get('/', (req, res, next) => {
  const tesseract = spawn('tesseract', ['--version']);

  let out = '';
  let err = '';
  tesseract.stdout.on('data', (partialData) => {
    out += partialData;
  });
  tesseract.stderr.on('data', (partialData) => {
    err += partialData;
  });

  tesseract.on('close', (code) => {
    if (code !== 0) {
      res.status(500).json({ message: err });
      console.log(`Error: ${err}`);
    } else {
      const version = out.trim().split("\n");

      res.status(200).json({
        tesserat: {
          version: version[0].replace(/^tesseract\s+(.*)$/, '$1'),
          options: version.slice(1).map(s => s.trim()),
        },
        _links: {
          self: {
            href: '/',
          },
          languages: {
            href: '/languages',
          },
          'extract-text': {
            href: '/extract-text{?lang}',
            templated: true,
          },
        },
      });
    }
    next();
  });
});


/**
 * Get available languages from tesseract
 */
app.get('/languages', (req, res, next) => {
  const tesseract = spawn('tesseract', ['--list-langs']);

  let out = '';
  let err = '';
  tesseract.stdout.on('data', (partialData) => {
    out += partialData;
  });
  tesseract.stderr.on('data', (partialData) => {
    err += partialData;
  });

  tesseract.on('close', (code) => {
    if (code !== 0) {
      res.status(500).json({ message: err });
      console.log(`Error: ${err}`);
    } else {
      res.status(200).json({ languages: out.trim().split("\n").slice(1) });
    }
    next();
  });
});


/**
 * Extract the text from an image
 *
 * It is possible to call this route in different ways:
 * - sending a JSON with field "content" with the base64-encoded file
 * - sending a JSON with field "url" with the URL of an image file
 * - sending a multi-part HTTP request with the field "file"
 * - sending a single HTTP request with the image file as body
 */
app.post('/extract-text', upload.single('file'), asyncMiddleware(async (req, res, next) => {
  const data = { text: null };

  let buff = null;

  // File received from JSON on field "content" with a base64-encoded file
  if (req.is('application/json') && req.body.content) {
    buff = new Buffer(req.body.content, 'base64');
  }

  // File received from JSON on field "url" with a string
  if (req.is('application/json') && req.body.url) {
    try {
      const resFetch = await fetch(req.body.url);
      buff = await resFetch.buffer();
    } catch (e) {
      res.status(500).json({ message: e.message });
      console.log(`Error: ${e.message}`);
      next();
      return;
    }
  }

  // File received from single part HTTP request
  if (req.is('image/*') && req.body) {
    buff = req.body;
  }

  // File received from multi-part HTTP request
  if (req.file) {
    try {
      buff = await readFile(req.file.path);
    } catch (e) {
      res.status(500).json({ message: e.message });
      console.log(`Error: ${e.message}`);
      next();
      return;
    } finally {
      unlink(req.file.path);
    }
  }

  if (!buff) {
    res.status(400).json({ message: 'Invalid request' });
    next();
    return;
  }

  const tesseract = spawn('tesseract', ['stdin', 'stdout', '-l', req.query.lang || 'eng', 'txt']);

  let out = '';
  let err = '';
  tesseract.stdout.on('data', (partialData) => {
    out += partialData;
  });
  tesseract.stderr.on('data', (partialData) => {
    err += partialData;
  });

  tesseract.stdin.write(buff);
  tesseract.stdin.end();

  tesseract.on('close', (code) => {
    if (code !== 0) {
      res.status(500).json({ message: err });
      console.log(`Error: ${err}`);
    } else {
      data.text = out.trim();
      res.status(200).json(data);
    }
    next();
  });
}));

app.listen(config.port, () => {
  console.log(`App running at port ${config.port}`);
  console.log('You can access the route POST /extract-text');
});
