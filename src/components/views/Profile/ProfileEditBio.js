import { h } from "preact";
import { useState, useMemo, useEffect } from "preact/hooks";
import { useStores } from "pullstate";

import { InputArea, SuspenseBar, InputBox } from "../../site/Elements.js";
import { fetchProfile } from "../../scripts/api.js";
import { Text } from "@dracula/dracula-ui";
import TimeZoneSelect from "../Dates/TimeZoneSelect.js";

const ProfileEditBio = ({ id }) => {
  const [loading, setLoading] = useState(false);
  const { profileStore } = useStores();
  const profile = profileStore.useState((s) => s.profiles[id], [id]) || {};
  const handleSave = (key) => (evt) =>
    fetchProfile(id, profileStore, { [key]: evt.target.value });
  const handleChange = (key) => (evt) => {
    if (
      typeof profile[key] === "string" &&
      ((profile[key].length < 10 && evt.target.value.length >= 10) ||
        (profile[key].length >= 10 && evt.target.value.length < 10))
    ) {
      fetchProfile(id, profileStore, { [key]: evt.target.value });
    }
  };

  return (
    <SuspenseBar
      height="30vh"
      finished={Object.keys(profile).length > 0}
      load={async () => fetchProfile(id, profileStore)}
    >
      <Text>When are you usually online?</Text>
      <InputBox
        name="onlineTimes"
        onBlur={handleSave("onlineTimes")}
        value={profile.onlineTimes}
        placeholder="6-10pm PST weekdays"
      ></InputBox>
      <br />
      <br />
      <TimeZoneSelect />
      <b>What are you looking for?</b>
      <br />
      <InputArea
        name="lookingFor"
        onBlur={handleSave("lookingFor")}
        onChange={handleChange("lookingFor")}
        value={profile.lookingFor}
        placeholder="other lewdies with..."
      />
      <br />
      <br />
      <b>About yourself:</b>
      <InputArea
        name="bio"
        onBlur={handleSave("bio")}
        onChange={handleChange("bio")}
        value={profile.bio}
        placeholder="catgirl looking for fun"
      />
    </SuspenseBar>
  );
};

export default ProfileEditBio;
