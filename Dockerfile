FROM node:16.10-buster-slim
ENV DEBIAN_FRONTEND noninteractive
ENV TERM linux
ARG NPM_TOKEN
ENV NPM_TOKEN=$NPM_TOKEN

ARG NODE_ENV=production
RUN mkdir /app
COPY package.json /app/package.json
COPY .npmrc /app/.npmrc
WORKDIR /app
RUN npm install --production

ADD . /app

# RUN /app/node_modules/.bin/webpack --mode=production
RUN /app/node_modules/.bin/webpack --mode=production
RUN echo {} >dist-server/package.json
COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod 0777 /entrypoint.sh
CMD ["/entrypoint.sh"]
