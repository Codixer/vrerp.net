import { h } from "preact";
import { Link } from "../../site/Elements.js";
import Helmet from "preact-helmet";
import { useState, useMemo, useEffect } from "preact/hooks";
import { useStores } from "pullstate";

import { InputBox, SuspenseBar } from "../../site/Elements.js";
import {
  fetchData,
  fetchProfile,
  fetchStore,
  updateAssets,
  updateProfile,
} from "../../scripts/api.js";
import MatchBox from "../Matchmaker/MatchBox.js";

import ProfileAvatar from "./ProfileAvatar.js";
import { ProfileViewTags } from "./ProfileViewTags.js";
import { ProfileControlReport, ProfileControls } from "./ProfileControls.js";
import Gallery from "../../site/Gallery.js";

import style from "./ProfileView.css";
import { ProfileViewCompliments } from "../Feedback/ProfileViewCompliments.js";
import { Heading } from "@dracula/dracula-ui";
import { FantasyView } from "../Fantasies/FantasyView.js";
import ProfileStatus from "./ProfileStatus.js";
import { getDescription } from "../../scripts/utils.js";
import { getImageURL } from "../../../shared.js";
import { lazy } from "preact-iso";
import { ProfileViewFlags } from "../Feedback/ProfileViewFlags.js";

const AssetMasonryItem = lazy(() => import("../Assets/AssetMasonryItem.js"));

const ProfileView = ({ id, controls, showMatchbox }) => {
  const [loading, setLoading] = useState(false);
  const { profileStore, siteStore, assetStore } = useStores();
  const currentProfileId = siteStore.useState((s) => s.user.profileId);
  const profile = profileStore.useState((s) => s.profiles[id], [id]) || {};
  const files = profileStore.useState((s) => s.files) || {};
  const invites = profileStore.useState((s) => s.invites) || [];
  const isInvited = invites.includes(id);
  const user = siteStore.useState((s) => s.user);
  const schema = profileStore.useState((s) => s.schema) || {};
  if (profile.profileVisibility && profile.profileVisibility === "banned") {
    return (
      <div>
        This user was banned.
        <br />
        <br />
        <Link href="/">Go back</Link>
      </div>
    );
  }

  return (
    <SuspenseBar
      height="30vh"
      finished={
        Object.keys(profile).length > 0 && Object.keys(schema).length > 0
      }
      load={async () =>
        Promise.all([
          fetchStore(`/api/profiles/${id}`, null, [
            [profileStore, updateProfile(id)],
            [assetStore, updateAssets],
          ]),
          Object.keys(schema).length === 0 &&
            fetchData(profileStore, `/api/profiles/schema`),
        ])
      }
    >
      <Helmet
        title={`${profile.username} on vrerp.net`}
        meta={[
          { name: "description", content: getDescription(profile.bio) },
          { property: "profile:username", content: profile.username },
          { property: "og:type", content: "profile" },
          { property: "og:title", content: `${profile.username} on vrerp.net` },
          {
            property: "og:image",
            content: getImageURL(files[profile.avatar], "thumbnail"),
          },
          { property: "og:description", content: getDescription(profile.bio) },
        ]}
      />
      {currentProfileId !== id && isInvited && showMatchbox !== false && (
        <MatchBox id={id} onNext={() => {}} />
      )}
      <ProfileAvatar id={id} size="banner" />
      <span
        className="float-right"
        id={`profile-status-display-${id}`}
        key={`profile-status-display-${id}`}
      >
        <center>
          <ProfileStatus status={profile.status} />
        </center>
        <br />
        {controls === true && <ProfileControls profile={profile} />}
        {controls !== true && profile.id !== user.profileId && (
          <ProfileControlReport profile={profile} />
        )}
      </span>
      <strong>{profile.username}</strong>
      <br />
      {profile.discord && (
        <div>
          <b>Discord: {profile.discord}</b>
          <br />
        </div>
      )}
      {profile.vrchat && (
        <div>
          <b>VRChat: {profile.vrchat}</b>
          <br />
        </div>
      )}
      {profile.chilloutvr && (
        <div>
          <b>ChilloutVR: {profile.chilloutvr}</b>
          <br />
        </div>
      )}
      {profile.link && (
        <div>
          <a href={profile.link} target="_blank" rel="noreferrer">
            {profile.link}
          </a>
          <br />
        </div>
      )}
      <br />
      Bio:
      <br />
      <ProfileViewTags profile={profile} />
      <br />
      <br />
      {profile.onlineTimes && (
        <div>
          <b>Usually online: </b>
          {profile.onlineTimes}
          <br />
        </div>
      )}
      <br />
      {profile.lookingFor && (
        <div>
          <b>Looking for: </b>
          <div className="user-text">{profile.lookingFor}</div>
          <br />
        </div>
      )}
      <div style={{ clear: "both" }}></div>
      <br />
      {profile.bio && (
        <div>
          <b>Bio: </b>
          <div className="user-text">{profile.bio}</div>
          <br />
        </div>
      )}
      <br />
      <ProfileViewCompliments profile={profile} />
      <br />
      {profile.flags && <ProfileViewFlags profile={profile} />}
      {profile.files && profile.files.length > 0 && (
        <div>
          <b>Media:</b>
          <br />
          <Gallery fileIds={profile.files} />
        </div>
      )}
      {profile.fantasies &&
        !profile.fantasies.trial &&
        !profile.fantasies.love &&
        profile.fantasies.count > 0 && (
          <div>
            <br />
            {profile.fantasies.count} fantasies shown to{" "}
            {profile.fantasiesVisibility} only.&nbsp;
            {!currentProfileId && (
              <span>
                <Link href="/">Sign up to see more!</Link>
              </span>
            )}
          </div>
        )}
      {profile.fantasies &&
        profile.fantasies.trial &&
        (profile.fantasies.trial.length > 0 ||
          profile.fantasies.love.length > 0) && (
          <div>
            <br />
            <br />
            <center>
              <Heading size="xl">✨ fantasies</Heading>
            </center>
          </div>
        )}
      {profile.fantasies &&
        profile.fantasies.love &&
        profile.fantasies.love.length > 0 && (
          <div>
            <br />
            <br />
            <Heading size="lg">💕 love:</Heading>
            {profile.fantasies.love.map((id) => (
              <div key={`love-${id}`}>
                <FantasyView key={`love-${id}`} id={id} />
                <br />
                <br />
              </div>
            ))}
          </div>
        )}
      {profile.fantasies &&
        profile.fantasies.trial &&
        profile.fantasies.trial.length > 0 && (
          <div>
            <br />
            <br />
            <Heading size="lg">💙 wanna try:</Heading>
            {profile.fantasies.trial.map((id) => (
              <div key={`trial-${id}`}>
                <FantasyView key={`trial-${id}`} id={id} />
                <br />
                <br />
              </div>
            ))}
          </div>
        )}
      {profile.wishlist && profile.wishlist.length > 0 && (
        <div>
          <br />
          <br />
          <center>
            <Heading size="lg">🎁 Wishlist:</Heading>
          </center>
          <br />
          {profile.wishlist.map((id) => (
            <AssetMasonryItem id={id} key={`asset-${id}`} />
          ))}
        </div>
      )}
      <br />
    </SuspenseBar>
  );
};

export default ProfileView;
