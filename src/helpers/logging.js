import dotenv from "dotenv";
import { default as findConfig } from "find-config";
dotenv.config({ path: findConfig(".env") });

import cls from "cls-hooked";
const clsSession = cls.getNamespace("main") || cls.createNamespace("main");

import winston from "winston";
import util from "util";
import LogDNATransport from "logdna-winston";

const { createLogger, format, transports } = winston;

const logger = new winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: format.combine(format.colorize(), format.simple()),
      level: "silly",
    }),
  ],
});

export const getReqSid = function () {
  // process.stdout.write(`clsSession${JSON.stringify(clsSession,0,4)}\n`);
  let req = clsSession.get("req");
  if (req && req.sid) {
    return req.sid;
  }
  const session = cls.getNamespace("main");
  if (session) {
    let req = clsSession.get("req");
    if (req && req.sid) {
      return req.sid;
    }
  }
  return null;
};

if (process.env.LOGDNA) {
  const transport = new LogDNATransport({
    key: process.env.LOGDNA,
    app: process.env.SERVER_NAME,
  });
  logger.add(transport);
}

function formatArgs(args) {
  let str = util.format.apply(util.format, Array.prototype.slice.call(args));
  const sid = getReqSid();
  if (sid) {
    str = `${sid} ${str}`;
  }
  return [str];
}

console.log = function (...args) {
  logger.info.apply(logger, formatArgs(args));
};
console.info = function (...args) {
  logger.info.apply(logger, formatArgs(args));
};
console.warn = function (...args) {
  logger.warn.apply(logger, formatArgs(args));
};
console.error = function (...args) {
  logger.error.apply(logger, formatArgs(args));
};
console.debug = function (...args) {
  logger.debug.apply(logger, formatArgs(args));
};
