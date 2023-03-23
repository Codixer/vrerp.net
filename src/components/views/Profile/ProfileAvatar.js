import { h } from "preact";
import { useState, useMemo, useEffect, useCallback } from "preact/hooks";
import { useStores } from "pullstate";

import { fetchProfile } from "../../scripts/api.js";
import FileUpload from "../../site/FileUpload.js";
import { Image } from "../../site/Elements.js";

import style from "./ProfileAvatar.css";

const ProfileAvatar = ({ id, edit, size }) => {
  const { profileStore, siteStore } = useStores();
  const profile = profileStore.useState((s) => s.profiles[id], [id]) || {};
  const user = siteStore.useState((s) => s.user);
  const files = profileStore.useState((s) => s.files) || {};
  const avatar = files[profile.avatar];
  const onUpload = useCallback(async (fid) => {
    await fetchProfile(id, profileStore, { avatar: fid[0] });
  }, []);
  if (edit === true) {
    return (
      <FileUpload
        className={`avatar avatarUpload`}
        onUpload={onUpload}
        parentId={user.profileId}
      >
        {profile.avatar && (
          <Image
            file={avatar}
            size="thumbnail"
            className="avatarMainimage"
            alt={profile.username}
          />
        )}
        {!profile.avatar && (
          <center className="fileUpload">
            No avatar, click here to upload one
          </center>
        )}
      </FileUpload>
    );
  }
  return (
    <div className="avatar">
      {profile.avatar && (
        <Image
          file={avatar}
          size={size || "thumbnail"}
          className="mainimage"
          alt={profile.username}
        />
      )}
      {!profile.avatar && <center>no avatar</center>}
    </div>
  );
};

export default ProfileAvatar;
