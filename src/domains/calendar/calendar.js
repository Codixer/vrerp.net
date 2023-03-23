import _ from "lodash";
import express from "express";
import { CalendarEventTag } from "./calendar.storage.js";

export const router = express.Router();

async function getCalendarEvents(from) {}

export async function getCalendarTags() {
  const calendarTags = (await CalendarEventTag.find({}).lean().exec()).map(
    (k) => k.name
  );
  return { calendarTags };
}

router.get("/api/calendar/schema", async (req, res, next) => {
  res.send({ status: "ok", data: await getCalendarTags() });
});

router.post("/api/calendar/events", async (req, res) => {});
