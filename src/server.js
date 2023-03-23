import dotenv from "dotenv";
import { default as findConfig } from "find-config";
dotenv.config({ path: findConfig(".env") });

import cls from "cls-hooked";
const clsSession = cls.getNamespace("main") || cls.createNamespace("main");

import uuid from "uuid";
import { WebSocketServer } from "ws";
import compression from "compression";
import express from "express";
import http from "http";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";

import * as logger from "./helpers/logging.js";
import { connect } from "./helpers/connect.js";

import appRoute from "./routes/app.js";
import apiRoute from "./routes/api.js";
import { userHandler } from "./domains/users/users.js";
import { fileRouter } from "./domains/files/userFiles.js";
import { router as profileRouter } from "./domains/users/profiles.js";
import { router as adminRouter } from "./domains/admin/admin.js";
import { router as moderatorRouter } from "./domains/admin/adminModerator.js";
import { router as lobbyRouter } from "./domains/lobby/lobby.js";
import { router as authRouter } from "./domains/discord/auth.js";
import { router as emailRouter } from "./domains/email/auth.js";
import { router as pageRouter } from "./domains/pages/pages.js";
import { router as matchRouter } from "./domains/matching/matching.js";
import { router as assetRouter } from "./domains/assets/assets.js";
import { router as calendarRouter } from "./domains/calendar/calendar.js";
import { fantasyRouter } from "./domains/fantasies/fantasies.js";
import { router as verifyRouter } from "./domains/verification/verification.js";
import { router as reportRouter } from "./domains/reports/reports.js";
import { router as mediaRouter } from "./domains/media/media.js";
import { messageRouter } from "./domains/frontpage/messages.js";
import { router as searchRouter } from "./domains/search/search.js";
import { router as datesRouter } from "./domains/dates/dates.js";
import { initBot } from "./domains/discord/bot.js";
import { initEmail } from "./domains/email/email.events.js";
import { initWebSocket } from "./domains/websocket/websocket.js";

// display full stack trace on promise rejection
process.on("unhandledRejection", (r) => console.error(r));

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express(); // create the express app
app.use(compression()); // use gzip for all requests
app.use(bodyParser.json({ type: "*/*" }));
app.set("json spaces", 2);
app.use(cookieParser());

if (process.env.SERVER_NAME !== "localhost") {
  app.get("/static/client.js.map", (req, res) => {
    res.status(403).json("access denied");
  });
}

app.use("/static/", express.static(path.join(__dirname, "../dist")));

app.get("/checks", async (req, res) => {
  res.send("ok");
});

app.use((req, res, next) => {
  // redirect to naked
  if (req.hostname === "www.vrerp.net") {
    return res.redirect(`https://vrerp.net${req.url}`);
  }
  // attach cls session
  clsSession.bindEmitter(req);
  req.sid = uuid.v4();
  clsSession.run(() => {
    clsSession.set("req", req);
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    console.log(ip, req.method, req.url);
    next();
  });
});

if (process.env.SERVER_NAME === "beta.vrerp.net") {
  // basic auth
  app.use(async (req, res, next) => {
    // check for basic auth header
    if (
      !req.headers.authorization ||
      req.headers.authorization.indexOf("Basic ") === -1
    ) {
      res.setHeader("WWW-Authenticate", 'Basic realm="private area"');
      return res.status(401).json({ message: "Missing Authorization Header" });
    }
    // verify auth credentials
    const base64Credentials = req.headers.authorization.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "ascii"
    );
    const [username, password] = credentials.split(":");
    if (username !== "erp" || password !== "erp") {
      res.setHeader("WWW-Authenticate", 'Basic realm="private area"');
      return res
        .status(401)
        .json({ message: "Invalid Authentication Credentials" });
    }
    next();
  });
}

async function errorHandler(error, req, res, next) {
  console.error(error);
  res.status(500);
  if (
    req.headers &&
    req.headers.accept &&
    req.headers.accept.startsWith("application/json")
  ) {
    res.send({ error: "something went wrong" });
  } else {
    res.send("something went wrong");
  }
}

// starts the server
async function init() {
  console.log("init");
  await connect();
  initBot();
  initEmail();
  app.use(userHandler());
  app.use(profileRouter);
  app.use(fileRouter);
  app.use(adminRouter);
  app.use(moderatorRouter);
  app.use(lobbyRouter);
  app.use(authRouter);
  app.use(pageRouter);
  app.use(matchRouter);
  app.use(fantasyRouter);
  app.use(verifyRouter);
  app.use(emailRouter);
  app.use(assetRouter);
  app.use(calendarRouter);
  app.use(reportRouter);
  app.use(mediaRouter);
  app.use(messageRouter);
  app.use(searchRouter);
  app.use(datesRouter);
  app.use(apiRoute);
  app.use(appRoute);
  app.use(errorHandler);
  const server = http.createServer(app);
  initWebSocket(server);
  console.info(`starting server on port ${process.env.PORT}`);
  const listener = server.listen(process.env.PORT, () => {
    console.log(
      `Listening on port ${process.env.PORT} as ${process.env.DOMAIN}`
    );
  });
}

init();
