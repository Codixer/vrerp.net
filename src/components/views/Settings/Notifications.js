import { h } from "preact";
import { useCallback, useState, useMemo, useEffect } from "preact/hooks";
import { Checkbox, Heading, Select, Text, Switch } from "@dracula/dracula-ui";
import { useStores } from "pullstate";
import { fetchProfile } from "../../scripts/api.js";
import { NOTIFICATION_INVITE, NOTIFICATION_MATCH } from "../../../shared.js";

const NotificationSettings = ({ id }) => {
  const [loading, setLoading] = useState(false);
  const { profileStore } = useStores();
  const profile = profileStore.useState((s) => s.profiles[id], [id]) || {};
  const { discordNotifications } = profile;
  const switchNotifications = useCallback(
    async (bitValue) => {
      setLoading(true);
      let result =
        discordNotifications & bitValue
          ? discordNotifications ^ bitValue
          : discordNotifications | bitValue;
      await fetchProfile(id, profileStore, { discordNotifications: result });
      setLoading(false);
    },
    [discordNotifications]
  );
  return (
    <div>
      <Heading>Notifications</Heading>
      <br />
      <br />
      Send notifications:
      <br />
      <br />
      <Text p="md" size="md">
        <Switch
          id="onInvite"
          color="purple"
          checked={!!(discordNotifications & NOTIFICATION_INVITE)}
          onClick={() => switchNotifications(NOTIFICATION_INVITE)}
          disabled={loading}
        />
        <label htmlFor="onInvite" className="drac-text">
          {" "}
          On invites
        </label>
      </Text>
      <br />
      <br />
      <Text p="md" size="md">
        <Switch
          id="onMatch"
          color="purple"
          checked={!!(discordNotifications & NOTIFICATION_MATCH)}
          onClick={() => switchNotifications(NOTIFICATION_MATCH)}
          disabled={loading}
        />
        <label htmlFor="onMatch" className="drac-text">
          {" "}
          On matching
        </label>
      </Text>
      <br />
      <br />
      In order to get Discord notifications, you need to{" "}
      <a
        href={"https://discord.gg/HDZQP6Wb6f"}
        target="_blank"
        rel="noreferrer"
      >
        join our discord server
      </a>
      .
      <br />
    </div>
  );
};

export default NotificationSettings;
