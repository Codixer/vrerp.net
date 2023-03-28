import { h } from "preact";
import { Link, outlinedButton } from "../site/Elements.js";
import { useState, useMemo, useEffect, useCallback } from "preact/hooks";
import { useStores } from "pullstate";

import { Button, InputBox } from "../site/Elements.js";
import { NextAction } from "./Flow/NextAction.js";
import { siteUrl, hasRole, plural } from "../scripts/utils.js";
import { useLocation } from "../scripts/router.js";
import { fetchPost } from "../scripts/api.js";

const HomeMessage = ({ msg }) => {
  const { siteStore } = useStores();
  const [loading, setLoading] = useState(false);
  const [endMessage, setEndMessage] = useState(null);
  const messages = siteStore.useState((s) =>
    s.user && s.user.messages ? s.user.messages : []
  );
  const onClick = useCallback(
    async (evt) => {
      setLoading(true);
      const data = await fetchPost("/api/messsages/replies", {
        type: evt.target.name,
        value: evt.target.value,
      });
      siteStore.update((s) => {
        s.user.messages = s.user.messages.filter((m) => m.type !== msg.type);
      });
      setEndMessage(data.text);
      setLoading(false);
    },
    [setLoading, setEndMessage, siteStore]
  );
  if (endMessage) {
    return <div>{endMessage}</div>;
  }
  return (
    <div>
      {msg.message.map((m, key) => (
        <div key={`${msg.type}-${key}`}>{m}</div>
      ))}
      <br />
      {msg.replies.map((r, key) => (
        <Button
          key={`${msg.type}-${r.text}`}
          className={`${outlinedButton} ml2`}
          name={msg.type}
          value={r.value}
          onClick={onClick}
          disabled={loading}
        >
          {r.text}
        </Button>
      ))}
      <br />
      <br />
    </div>
  );
};

const Home = () => {
  const { route } = useLocation();
  const { siteStore, profileStore } = useStores();
  const invites = profileStore.useState((s) => s.invites);
  const user = siteStore.useState((s) => s.user);
  const messages = siteStore.useState((s) =>
    s.user && s.user.messages ? s.user.messages : []
  );
  return (
    <div className="drac-m-sm">
      <h1>Welcome to vr erp! 🤗</h1>
      <br />
      {!hasRole(user, "onboarded") && (
        <div>
          Let&apos;s create your profile!
          <br />
          <br />
          <Button onclick={() => route("/onboarding/welcome")}>
            Create profile &raquo;
          </Button>
        </div>
      )}
      {hasRole(user, "onboarded") && (
        <div>
          <Link href="/browse">Browse around</Link> to make some friends
          <br />
          <Link href="/fantasies">browse fantasies</Link> to find your vibe
          <br />
          <br />
          Due to the safety of our website and community, inviting members has been removed as a feature from the website. We apoligise for any inconvenience this may cause.
          <br />
          <br />
          <NextAction />
          <br />
          {messages && messages.length > 0 && (
            <div>
              <h2>📧 Messages:</h2>
              <br />
              {messages.map((m) => (
                <HomeMessage key={m.type} msg={m} />
              ))}
            </div>
          )}
          <br />
          <br />
        </div>
      )}
    </div>
  );
};

export default Home;
