#!/bin/bash
cd /app
/app/node_modules/.bin/nodemon --exec node -r source-map-support/register dist-server/server.js
