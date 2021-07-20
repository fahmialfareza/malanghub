FROM node:14-alpine as base
LABEL org.opencontainers.image.authors=fahmialfareza@icloud.com
LABEL org.opencontainers.image.title="Malanghub"
LABEL org.opencontainers.image.licenses=MIT
LABEL com.malanghub.nodeversion=$NODE_VERSION
ENV NODE_ENV=production
EXPOSE 3000
WORKDIR /app
COPY package.json ./
RUN yarn install --production=true && yarn cache clean --force
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["yarn", "run", "start"]


FROM base as dev
ENV NODE_ENV=development
RUN yarn install && yarn cache clean --force
USER node
CMD ["yarn", "run", "dev"]


FROM base as prod
RUN yarn run build
USER node
CMD ["yarn", "run", "start"]
