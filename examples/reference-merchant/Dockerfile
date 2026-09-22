# Reference merchant image. Build from the repository root:
#   docker build -f examples/reference-merchant/Dockerfile -t wathiqpay-merchant .
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json tsconfig.json tsconfig.build.json ./
RUN npm ci --no-audit --no-fund
COPY src ./src
COPY test ./test
COPY examples ./examples
RUN npm run build:test

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production MERCHANT_HOST=0.0.0.0 MERCHANT_PORT=3000 \
    MERCHANT_DB=/data/merchant.sqlite MERCHANT_OUTBOX=/data/outbox
COPY --from=build /app/build ./build
COPY --from=build /app/examples/reference-merchant/public ./examples/reference-merchant/public
COPY package.json ./
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1
CMD ["node", "--experimental-sqlite", "--no-warnings=ExperimentalWarning", "build/examples/reference-merchant/src/server.js"]
