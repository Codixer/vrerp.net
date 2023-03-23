import { WebSocketServer } from "ws";

import * as Events from "../events/events.js";
import * as EventTypes from "../events/events.types.js";
import { getMatchDB } from "../matching/matching.js";
import {
  addWebClientToUserStatus,
  removeWebClientFromUserStatus,
} from "../status/status.js";
import { getSessionParser } from "../users/users.js";
import { User } from "../users/users.storage.js";

const clientsByUserId = {};
const clientsByProfileId = {};

async function addClient(client) {
  console.log("addclient", client.profileId);
  clientsByUserId[client.userId] = clientsByUserId[client.userId] || [];
  clientsByUserId[client.userId].push(client);
  clientsByProfileId[client.profileId] =
    clientsByProfileId[client.profileId] || [];
  clientsByProfileId[client.profileId].push(client);
  if (clientsByUserId[client.userId].length === 1) {
    await addWebClientToUserStatus(
      { userId: client.userId },
      process.env.WORKERID
    );
  }
}

async function removeClient(client) {
  console.log("removeclient", client.profileId);
  clientsByUserId[client.userId] = clientsByUserId[client.userId].filter(
    (c) => c !== client
  );
  clientsByProfileId[client.profileId] = clientsByProfileId[
    client.profileId
  ].filter((c) => c !== client);
  if (clientsByUserId[client.userId].length === 0) {
    await removeWebClientFromUserStatus(
      { userId: client.userId },
      process.env.WORKERID
    );
  }
}

class SocketClient {
  constructor(socket, req) {
    getSessionParser()(req, {}, async () => {
      if (!req.session.userId) {
        return;
      }
      const user = await User.findOne({ _id: req.session.userId })
        .lean()
        .exec();
      this.userId = user._id;
      this.profileId = user.profileId;
      this.socket = socket;
      await addClient(this);
      socket.on("message", (msg) => console.log("socket message", msg));
      socket.on("error", (error) => console.error("socket error", error));
      socket.once("close", () => removeClient(this));
    });
  }
}

async function broadcastMessage(profileIds, message) {
  if (profileIds.length === 0) {
    return;
  }
  profileIds = profileIds.filter((x, i) => i === profileIds.indexOf(x));
  const allClients = profileIds.reduce(
    (acc, val) => acc.concat(clientsByProfileId[val] || []),
    []
  );
  allClients.map((c) => {
    c.socket.send(JSON.stringify(message));
  });
}

async function userStatusChanged(userId, parameters) {
  const user = await User.findOne({ _id: userId }).lean().exec();
  if (!user) {
    return;
  }
  const matches = await getMatchDB(user.profileId, "matches");
  const broadcastList = matches.concat([user.profileId]);
  await broadcastMessage(broadcastList, {
    type: "status-update",
    data: {
      profileId: user.profileId,
      status: parameters.displayStatus,
      hornyStatus: parameters.hornyStatus,
    },
  });
}

export async function initWebSocket(server) {
  console.log("init websocket");
  const socketServer = new WebSocketServer({ server, clientTracking: true });
  socketServer.on("connection", (socket, req) => new SocketClient(socket, req));
  Events.listen(
    EventTypes.PROFILE_STATUS_CHANGED,
    Events.ListenerType.INSTANCE,
    userStatusChanged
  );
}
