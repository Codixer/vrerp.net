import { h } from "preact";
import classNames from "classnames";
import { tagIterator, TagBubble } from "../Profile/TagBubble.js";
import { Button } from "../../site/Elements.js";
import { useStores } from "pullstate";

import { complimentTags } from "../../../shared.js";

import { useCallback, useState } from "preact/hooks";
import { fetchData } from "../../scripts/api.js";

const Compliments = ({ profile, onClose }) => {
  const { siteStore, profileStore } = useStores();
  const [loading, setLoading] = useState(false);
  const currentProfileId = siteStore.useState((s) => s.user.profileId);
  const [selectedTags, setSelectedTags] = useState(
    Object.keys(profile.compliments || {}).filter((key) =>
      profile.compliments[key].includes(currentProfileId)
    )
  );
  const toggleCompliment = useCallback(
    async (key) => {
      if (selectedTags.includes(key)) {
        setSelectedTags(selectedTags.filter((tag) => tag !== key));
      } else {
        setSelectedTags(selectedTags.concat(key));
      }
    },
    [selectedTags]
  );
  const sendCompliments = useCallback(async () => {
    setLoading(true);
    await fetchData(
      profileStore,
      `/api/profiles/${profile.id}/compliments`,
      { tags: selectedTags },
      (s, data) => {
        s.profiles[profile.id] = data.profile;
        s.files = { ...s.files, ...data.files };
      }
    );
    setLoading(false);
    onClose();
  }, [profile, selectedTags]);
  return (
    <div className="modal-content">
      Once you met {profile.username} in VR, compliment them:
      <br />
      <br />
      {complimentTags.map((key) => (
        <TagBubble
          key={key}
          selected={selectedTags.includes(key)}
          value={key}
          onClick={() => toggleCompliment(key)}
        ></TagBubble>
      ))}
      <br />
      <TagBubble
        key={"Succubus"}
        selected={selectedTags.includes("Succubus")}
        value={"Succubus"}
        onClick={() => toggleCompliment("Succubus")}
      ></TagBubble>
      (
      <a href="/The-Succubus-Role" target="_blank" rel="noreferrer">
        uwu what&apos;s this?
      </a>{" "}
      )
      <br />
      <br />
      <center>
        <Button onClick={sendCompliments} disabled={loading}>
          🤗 compliment
        </Button>
      </center>
    </div>
  );
};

export default Compliments;
