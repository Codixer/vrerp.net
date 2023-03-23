import { Badge } from "@dracula/dracula-ui";
import { h } from "preact";
import { useState, useMemo, useEffect, useCallback } from "preact/hooks";
import { useStores } from "pullstate";
import { fetchPost, fetchData, updateFeed } from "../../scripts/api.js";
import { Button } from "../../site/Elements.js";

import style from "./MatchBox.css";

const MatchBox = ({ id, onMatch, onNext, onPrev, usernameUrl }) => {
  const [matchBoxState, setMatchBoxState] = useState(0);
  const { profileStore } = useStores();
  const profile = profileStore.useState((s) => s.profiles[id], [id]) || {};
  const invites = profileStore.useState((s) => s.invites) || [];
  const isInvited = invites.includes(id);

  const handleMatch = useCallback(
    async (id, match) => {
      const result = await fetchData(
        profileStore,
        "/api/match/set-match",
        { profileId: id, match },
        updateFeed
      );
      if (result.matches && result.matches.includes(id)) {
        setMatchBoxState(1);
        return;
      }
      onNext(usernameUrl);
    },
    [usernameUrl, id, onNext, onPrev]
  );
  return (
    <div className="box">
      {matchBoxState === 0 && (
        <center>
          <br />
          {isInvited && (
            <div>{profile.username} wants to be your lewdie! 💕</div>
          )}
          {onPrev && (
            <Button m="sm" onClick={onPrev} variant="outline">
              ↶ Undo
            </Button>
          )}
          <Button
            m="sm"
            onClick={() => handleMatch(id, "love")}
            variant="outline"
          >
            ❤ Love
          </Button>
          <Button
            m="sm"
            onClick={() => handleMatch(id, "pass")}
            variant="outline"
          >
            Pass &raquo;
          </Button>
        </center>
      )}
      {matchBoxState === 1 && (
        <center>
          <br />
          It&apos;s a match! 💕
          <br />
          <Button m="sm" onClick={() => onNext(usernameUrl)} variant="outline">
            Next &raquo;
          </Button>
        </center>
      )}
      <br />
    </div>
  );
};

export default MatchBox;
