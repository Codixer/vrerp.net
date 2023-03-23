import { h } from "preact";
import { useState, useMemo, useEffect, useCallback } from "preact/hooks";
import Helmet from "preact-helmet";

import { Link } from "../site/Elements.js";
import { useStores } from "pullstate";
import ProfileViewThumbnail from "./Profile/ProfileViewThumbnail.js";

import { Button, InputBox, SuspenseBar } from "../site/Elements.js";
import { fetchData, fetchProfileList, updateFeed } from "../scripts/api.js";
import { ProfileViewTags } from "./Profile/ProfileViewTags.js";

import { NextAction } from "./Flow/NextAction.js";
import { tagIterator, TagBubble } from "./Profile/TagBubble.js";
import ProfileStatus from "./Profile/ProfileStatus.js";

export const KinkList = ({ profile }) => {
  return (
    <div>
      {tagIterator(profile.kinks).map((kink) => (
        <TagBubble key={kink} selected={true} value={kink} />
      ))}
    </div>
  );
};

export const Matches = () => {
  const { profileStore, assetStore } = useStores();
  const matches = profileStore.useState((s) => s.matches) || [];
  const profiles = profileStore.useState((s) => s.profiles) || {};
  const profileList =
    profileStore.useState((s) => Object.keys(s.profiles)) || [];
  const missingProfiles = useMemo(
    () => matches.filter((profileId) => !profileList.includes(profileId)),
    [matches, profileList]
  );
  return (
    <div>
      <Helmet title={`matches - vrerp.net`} />
      <SuspenseBar
        height="30vh"
        finished={missingProfiles.length === 0}
        load={async () =>
          fetchProfileList(missingProfiles, profileStore, assetStore)
        }
      >
        {missingProfiles.length === 0 &&
          matches.map((id) => (
            <ProfileViewThumbnail key={id} id={id}>
              <span
                className="float-right"
                id={`profile-status-display-${id}`}
                key={`profile-status-display-${id}`}
              >
                <ProfileStatus status={profiles[id].status} />
              </span>
              <Link href={`/${profiles[id].url}`}>{profiles[id].username}</Link>
              <KinkList profile={profiles[id]} />
            </ProfileViewThumbnail>
          ))}
        {missingProfiles.length === 0 && matches.length === 0 && (
          <div className="drac-m-sm">
            No matches yet. <Link href="/browse">Make some friends!</Link>
          </div>
        )}
        <br />
        <br />
        <NextAction />
        <br />
      </SuspenseBar>
    </div>
  );
};
