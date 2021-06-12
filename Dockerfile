FROM ubuntu:20.04

RUN apt-get update && \
    apt-get install -y software-properties-common && \
    add-apt-repository -y ppa:alex-p/tesseract-ocr && \
    apt-get update && \
    apt-get install -y tesseract-ocr-all nodejs npm

WORKDIR /app

COPY ./package* /app/

RUN npm ci

COPY . /app/

EXPOSE ${APP_PORT}

CMD ["node", "app"]
