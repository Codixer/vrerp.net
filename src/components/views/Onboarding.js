import { h } from "preact";
import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "preact/hooks";
import { useStores } from "pullstate";
import Helmet from "preact-helmet";

import { fetchData, fetchPost } from "../scripts/api.js";
import { Button } from "../site/Elements.js";
import ProfileEditBasic from "./Profile/ProfileEditBasic.js";
import ProfileEditTags from "./Profile/ProfileEditTags.js";
import ProfileEditBio from "./Profile/ProfileEditBio.js";
import ProfileView from "./Profile/ProfileView.js";
import { Checkbox, Heading, Text } from "@dracula/dracula-ui";
import PrivacySettings from "./Settings/Privacy.js";
import NotificationSettings from "./Settings/Notifications.js";
import { Rules, RulesUpdates } from "./Rules.js";
import FileUpload from "../site/FileUpload.js";
import { UserVerification, Verification } from "./Verification.js";
import { useLocation } from "../scripts/router.js";

const Onboarding = ({ section, url }) => {
  const { route } = useLocation();
  const { siteStore } = useStores();
  const user = siteStore.useState((s) => s.user);
  const { profileStore } = useStores();
  const profile =
    profileStore.useState((s) => s.profiles[user.profileId]) || {};
  const [rulesAccept, setRulesAccept] = useState(false);

  const publish = async () => {
    await fetchData(siteStore, `/api/users/activate`, {});
    route("/");
  };
  const onUpload = useCallback(async (fid) => {
    await fetchData(
      profileStore,
      `/api/profiles/${user.profileId}/files`,
      { id: fid },
      (s, data) => {
        s.profiles[user.profileId] = data.profile;
        s.files = { ...s.files, ...data.files };
      }
    );
  }, []);
  const syncTags = () => fetchPost("/api/users/sync", {});

  return (
    <div>
      <Helmet title={`Welcome to vrerp.net - find new lewdies!`} />
      {section === "welcome" && (
        <div>
          <Heading>Hi-hi! 👋 welcome to vr erp!</Heading>
          <Text>Let&#39;s create your profile for your lewdies!</Text>
          <Rules />
          <br />
          <br />
          <RulesUpdates />
          <br />
          <br />
          <Checkbox
            id="agreeRules"
            color="purple"
            checked={rulesAccept}
            onClick={() => setRulesAccept(!rulesAccept)}
          />
          <label htmlFor="agreeRules" className="drac-text">
            {" "}
            I accept the rules, and am over 18 years old
          </label>
          <br />
          <br />
          <center>
            <Button
              p="sm"
              onclick={() => route("/onboarding/basicinfo")}
              disabled={!rulesAccept}
            >
              Next &raquo;
            </Button>
          </center>
        </div>
      )}
      {section === "basicinfo" && (
        <div>
          <ProfileEditBasic id={user.profileId} url={url} />
          {!(
            profile.avatar &&
            profile.username &&
            profile.url &&
            profile.vrchat
          ) && (
            <div>
              Upload a pic of your avatar, and set your username, and vrchat to
              continue!
            </div>
          )}
          <center>
            <Button
              onclick={() => route("/onboarding/tags")}
              disabled={
                !(
                  profile.avatar &&
                  profile.username &&
                  profile.url &&
                  profile.vrchat
                )
              }
            >
              Next &raquo;
            </Button>
          </center>
        </div>
      )}
      {section === "tags" && (
        <div>
          <ProfileEditTags id={user.profileId} />
          <center>
            <Button
              onclick={() => {
                syncTags();
                route("/onboarding/bio");
              }}
            >
              Next &raquo;
            </Button>
          </center>
        </div>
      )}
      {section === "bio" && (
        <div>
          <ProfileEditBio id={user.profileId} />
          <br />
          {(!profile.onlineTimes ||
            !profile.lookingFor ||
            profile.lookingFor.length < 10 ||
            !profile.bio ||
            profile.bio.length < 10) && (
            <div>
              Please write a bit about yourself!
              <br />
              All fields are required.
            </div>
          )}
          <br />
          <center>
            <Button
              onclick={() => route("/onboarding/verification")}
              disabled={
                !profile.onlineTimes ||
                !profile.lookingFor ||
                profile.lookingFor.length < 10 ||
                !profile.bio ||
                profile.bio.length < 10
              }
            >
              Next &raquo;
            </Button>
          </center>
        </div>
      )}
      {section === "verification" && (
        <UserVerification
          userId={user.id}
          onFinished={() => route("/onboarding/settings")}
        />
      )}
      {section === "settings" && (
        <div>
          <PrivacySettings id={user.profileId} />
          <NotificationSettings id={user.profileId} />
          <center>
            <Button onclick={() => route("/onboarding/profile")}>
              Next &raquo;
            </Button>
          </center>
        </div>
      )}
      {section === "profile" && (
        <div>
          <ProfileView id={user.profileId} />
          <br />
          {
            <FileUpload
              className={``}
              onUpload={onUpload}
              parentId={user.profileId}
            >
              {<center className="fileUpload">+ upload more images</center>}
            </FileUpload>
          }
          <center>
            <Button onclick={() => publish()}>Finish &raquo;</Button>
          </center>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
