FROM mhart/alpine-node:7.10.0
MAINTAINER Awe <hilongjw@gmail.com>

WORKDIR /data/src

COPY package.json package.json

RUN npm install --production

COPY . /data/src

## HEALTHCHECK

## install curl
# RUN apk add --update curl && \
#    rm -rf /var/cache/apk/*

# HEALTHCHECK --interval=5s --timeout=3s \
#   CMD curl -fs http://localhost:9999/_docker_healthcheck || exit 1

EXPOSE 9999

CMD npm start