import { h } from "preact";
import { useEffect } from "preact/hooks";
import { useStores } from "pullstate";
import { clientSide } from "../scripts/utils.js";

const WebSocketClient = () => {
  const { siteStore, profileStore } = useStores();
  const mode = siteStore.useState((s) => s.mode);
  const user = siteStore.useState((s) => s.user);

  const onSocketMessage = (evt) => {
    const msgData = JSON.parse(evt.data);
    if (msgData.type === "status-update") {
      profileStore.update((s) => {
        if (s.profiles[msgData.data.profileId]) {
          s.profiles[msgData.data.profileId].status = msgData.data.status;
        }
      });
      if (user && msgData.data.profileId === user.profileId) {
        siteStore.update((s) => {
          s.user.status = msgData.data.hornyStatus;
        });
      }
    }
  };
  useEffect(() => {
    if (!clientSide) {
      return;
    }
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const client = new WebSocket(`${protocol}://${window.location.host}/`);
    client.onmessage = onSocketMessage;
    client.onclose = (evt) => {
      if (mode === "development") {
        const cid = setInterval(async () => {
          const response = await fetch(`/api/ping`);
          const data = await response.json();
          clearInterval(cid);
          window.location.reload();
        }, 1000);
      }
    };
  }, []);
  return;
};

export default WebSocketClient;
