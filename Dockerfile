FROM node:10.19.0-jessie-slim AS builder
ENV CHROME_BIN="/usr/bin/chromium-browser" \
    NODE_ENV="development"
WORKDIR /usr/app

COPY package.json package-lock.json ./.
RUN npm ci

FROM node:10.19.0-alpine3.10
ENV CHROME_BIN="/usr/bin/chromium-browser" \
    NODE_ENV="development"

WORKDIR /usr/app
COPY --from=builder /usr/app .
COPY . .
RUN apk add --no-cache make
RUN set -x \
    && apk add --no-cache \
    udev \
    ttf-freefont \
    chromium \
    && npm install puppeteer-core --silent \
      \
      # Do some cleanup
      && apk del --no-cache make gcc g++ python binutils-gold gnupg libstdc++ \
      && rm -rf /usr/include \
      && echo
RUN echo "DATABASE_URL=postgres://sidekick:sidekick@db:5432/sidekick" > .env
RUN echo "LOG_LEVEL=debug" >> .env
RUN echo "NODE_ENV=development" >> .env
RUN echo "PORT=8080" >> .env
RUN echo "SESSION_SECRET=development" >> .env
EXPOSE 8080
#WORKDIR /app
#ENTRYPOINT ["/usr/bin/dumb-init"]
CMD [ "node", "index.js" ]
