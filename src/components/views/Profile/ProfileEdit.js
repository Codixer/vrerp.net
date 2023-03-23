import { h } from "preact";
import { Link } from "../../site/Elements.js";
import Helmet from "preact-helmet";

import { useState, useMemo, useEffect, useCallback } from "preact/hooks";
import { useStores } from "pullstate";

import { InputBox, SuspenseBar } from "../../site/Elements.js";
import { fetchData, fetchProfile } from "../../scripts/api.js";
import FileUpload from "../../site/FileUpload.js";

import ProfileAvatar from "./ProfileAvatar.js";
import { ProfileViewTags } from "./ProfileViewTags.js";
import Gallery from "../../site/Gallery.js";

const ProfileEdit = ({ id }) => {
  const [loading, setLoading] = useState(false);
  const { profileStore, siteStore } = useStores();
  const profile = profileStore.useState((s) => s.profiles[id], [id]) || {};

  const user = siteStore.useState((s) => s.user);
  const schema = profileStore.useState((s) => s.schema) || {};
  const onUpload = useCallback(async (fid) => {
    await fetchData(
      profileStore,
      `/api/profiles/${id}/files`,
      { id: fid },
      (s, data) => {
        s.profiles[id] = data.profile;
        s.files = { ...s.files, ...data.files };
      }
    );
  }, []);

  return (
    <SuspenseBar
      height="30vh"
      finished={
        Object.keys(profile).length > 0 && Object.keys(schema).length > 0
      }
      load={async () =>
        Promise.all([
          fetchProfile(id, profileStore),
          Object.keys(schema).length === 0 &&
            fetchData(profileStore, `/api/profiles/schema`),
        ])
      }
    >
      <Helmet title={`${profile.username} - vrerp.net`} />
      <ProfileAvatar id={id} edit={true} />
      <br />
      <b>
        <Link href={`/${profile.url}`}>vrerp.net/{profile.username}</Link>
      </b>
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
          {profile.link}
          <br />
        </div>
      )}
      {user.profileId === id && (
        <div key="editbasicinfo">
          <Link href="/profile/basicinfo">Edit Basic Info</Link>
        </div>
      )}
      <br />
      Bio:
      <br />
      <ProfileViewTags profile={profile} />
      {user.profileId === id && (
        <div>
          <Link href="/profile/tags">Edit Tags</Link>
        </div>
      )}
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
      {user.profileId === id && (
        <div>
          <Link href="/profile/bio">Edit Bio</Link>
        </div>
      )}
      <br />
      <br />
      {profile.files && profile.files.length > 0 && (
        <div>
          <Gallery fileIds={profile.files} />
        </div>
      )}
      {
        <FileUpload
          className={``}
          onUpload={onUpload}
          parentId={user.profileId}
        >
          {<center className="fileUpload">+ upload more images</center>}
        </FileUpload>
      }
      {user.profileId === id && (
        <div>
          <Link href="/profile/privacy">Edit Privacy settings</Link>
        </div>
      )}
    </SuspenseBar>
  );
};

export default ProfileEdit;
