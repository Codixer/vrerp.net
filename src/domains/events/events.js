import { EventEmitter } from "node:events";

import { generateSnowflake } from "../../helpers/utils.js";
import { UserEvent } from "./events.storage.js";
import { PROFILE_STATUS_CHANGED } from "./events.types.js";

export const NONSTORED_EVENTS = [PROFILE_STATUS_CHANGED];

export const ListenerType = {
  INSTANCE: "instance",
  GLOBAL: "global",
};

const EventHandler = new EventEmitter();

EventHandler.on("error", (args) => {
  console.error("Event handling error", args);
});

export const listen = (type, listenerType, callback) => {
  EventHandler.on(type, callback);
};

export const emit = async (type, userId, parameters = {}) => {
  console.log(`Event: ${userId} ${type} ${JSON.stringify(parameters)}`);
  if (!NONSTORED_EVENTS.includes(type)) {
    const event = new UserEvent({
      _id: generateSnowflake(),
      type,
      userId,
      parameters,
    });
    await event.save();
  }
  EventHandler.emit(type, userId, parameters);
};
