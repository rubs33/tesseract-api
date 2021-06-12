# Tesseract API

Tesseract API is an opensource app that provides a web API to convert images into texts using the project [Tesseract OCR](https://tesseract-ocr.github.io/).

## Instalation

It requires:
- Docker >= 20.0
- Docker Compose >= 1.27

Steps:
- Copy `.env.example` to `.env` (modify if needed)
- Run `docker-compose up`

The API will be available at port 3000 by default.

## API routes

### GET /

Returns basic information about Tesseract.

Example:

```sh
curl -v 'http://localhost:3000/'
```

+ Response 200 (application/json)
        {
          "tesserat": {
            "version": "4.1.1-rc2-25-g9707",
            "options": [
              "leptonica-1.79.0",
              "libgif 5.1.4 : libjpeg 8d (libjpeg-turbo 2.0.3) : libpng 1.6.37 : libtiff 4.1.0 : zlib 1.2.11 : libwebp 0.6.1 : libopenjp2 2.3.1",
              "Found AVX2",
              "Found AVX",
              "Found FMA",
              "Found SSE",
              "Found libarchive 3.4.0 zlib/1.2.11 liblzma/5.2.4 bz2lib/1.0.8 liblz4/1.9.2 libzstd/1.4.4"
            ]
          },
          "_links": {
            "self": {
              "href": "/"
            },
            "languages": {
              "href": "/languages"
            },
            "extract-text": {
              "href": "/extract-text{?lang}",
              "templated": true
            }
          }
        }

### GET /languages

Returns the list of languages available on Tesseract.

Example:

```sh
curl -v 'http://localhost:3000/languages'
```

+ Response 200 (application/json)
        {
          "languages": [
            "Arabic",
            "Armenian",
            "Bengali",
            "Canadian_Aboriginal",
            "Cherokee",
            "Cyrillic",
            "Devanagari",
            "Ethiopic",
            "Fraktur",
            ...
          ]
        }

### POST /extract-text{?lang}

Sends an image and returns the extracted text.

+ Parameters:
    + lang (string) - The language to detect the text in the image.
        + Default: `eng`

There are 4 ways to send the image:

1 - Sending a JSON with the field "content" with a base64-encoded file

```sh
curl -v -X POST \
  -H 'Content-Type: application/json' \
  -d '@examples/example-content.json' \
  'http://localhost:3000/extract-text'
```

2 - Sending a JSON with the field "url" with the URL of an image

```sh
curl -kv -X POST \
  -H 'Content-Type: application/json' \
  -d '@examples/example-content.json' \
  'http://localhost:3000/extract-text'
```

3 - Sending a multi-part HTTP request with the field "file"

```sh
curl -v -X POST \
  -F 'file=@examples/example.jpg' \
  'http://localhost:3000/extract-text'
```

4 - Sending a single HTTP request with the image file as body

```sh
curl -v -X POST \
  -H 'Content-Type: image/jpeg' \
  --data-binary '@examples/example.jpg' \
  'http://localhost:3000/extract-text'
```

+ Response 200 (application/json)
        {
          "text": "An example of extracted text"
        }

## License

[GPLv3](https://www.gnu.org/licenses/gpl-3.0.en.html) or later
