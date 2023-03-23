import _ from "lodash";
import express from "express";

const router = express.Router();

router.get("/api/ping", async (req, res) => {
  console.log("ping");
  res.send({ status: "ok" });
});

router.post("/api/ishuman", async (req, res) => {
  req.session.isHuman = true;
  res.send({ status: "ok" });
});

router.post("/api/agecheck", async (req, res) => {
  req.session.ageCheck = true;
  res.send({ status: "ok" });
});

router.post("/api/log", async (req, res) => {
  if (!req.body) {
    return res.status(400).send({ error: "body not found" });
  }
  if (req.user) {
    console.error("js crashing user:", JSON.stringify(req.user));
  }
  if (req.userProfile) {
    console.error("js crashing user:", _.get(req.userProfile, "url"));
  }
  if (req.body.error && req.body.stack) {
    console.error(`js error at ${req.body.url}`);
    console.error(req.body.error);
    console.error(req.body.stack);
  } else {
    console.error(JSON.stringify(req.body, null, 4));
  }
  res.send({ status: "ok" });
});

router.get("/api/*", async (req, res) => {
  res.status(404);
  res.send({ error: "not found" });
});

export default router;
