import { h } from "preact";
import { Link } from "../site/Elements.js";
import {
  Paragraph,
  Heading,
  Avatar,
  Text,
  List,
  Checkbox,
} from "@dracula/dracula-ui";
import { useStores } from "pullstate";
import Helmet from "preact-helmet";

import style from "./Landing.css";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import FileUpload from "../site/FileUpload.js";
import { fetchPost } from "../scripts/api.js";
import { SuspenseBar, Button, InputBox, Image } from "../site/Elements.js";
import Header from "../site/Header.js";

export const Verification = ({ id, onFinished, header = false }) => {
  const [verificationId, setVerificationId] = useState(id);
  const { profileStore, siteStore } = useStores();
  const user = siteStore.useState((s) => s.user);
  const [status, setStatus] = useState(null);
  const [migrate, setMigrate] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const files = profileStore.useState((s) => s.files) || {};
  const updateVerification = useCallback(
    async (data) => {
      setStatus(data.verification.status);
      if (data.verification.image) {
        setUploadedImage(data.verification.image);
        profileStore.update((s) => {
          s.files = { ...s.files, ...data.files };
        });
      }
      if (onFinished && data.verification.status === "verified") {
        onFinished();
      }
    },
    [id]
  );
  const loadVerification = useCallback(async () => {
    const response = await fetch(`/api/verification/${verificationId}`);
    const data = await response.json();
    return updateVerification(data.data);
  }, [verificationId]);
  const submitImage = useCallback(
    async (fid) => {
      const response = await fetchPost(`/api/verification/${verificationId}`, {
        image: fid[0],
      });
      return updateVerification(response);
    },
    [verificationId]
  );
  const submit = useCallback(async () => {
    const response = await fetchPost(`/api/verification/${verificationId}`, {
      status: "submit",
      migrate,
    });
    return updateVerification(response);
  }, [verificationId, migrate]);
  const regenerateVerification = useCallback(async () => {
    const response = await fetchPost(`/api/verification`, {});
    setUploadedImage(null);
    setVerificationId(response.verification.id);
    return updateVerification(response);
  }, [verificationId]);
  return (
    <div>
      {header && <Header />}
      <Helmet
        title={`Age verification - vrerp.net`}
        meta={[
          {
            name: "description",
            content: `Let's make sure everyone is comfy to play with 😊`,
          },
          { property: "og:title", content: "Age verification - vrerp.net" },
          {
            property: "og:description",
            content: `Let's make sure everyone is comfy to play with 😊`,
          },
          { property: "og:site_name", content: "vrerp.net" },
        ]}
      />
      <SuspenseBar finished={!!status} load={loadVerification}>
        {status === "draft" && (
          <div>
            <Heading>18+ verification</Heading>
            <br />
            We want to make sure everyone on the discord, and the site is comfy
            to play with😊 To verify, you need to do one of the following:
            <br />
            <br />
            <li>
              upload one photo with your ID, and your discord name written on a
              piece of paper.
            </li>{" "}
            <br />
            The ID should contain your date of birth, and ID expiration date;
            everything else can be marked out. <br />
            <img
              src="https://cdn.vrerp.net/id-verification.jpg"
              alt="ID verification"
              className="float-right avatarMainimage"
            />
            <br />
            <FileUpload
              className={`avatar avatarUpload`}
              onUpload={submitImage}
              parentId={verificationId}
              category="verification"
            >
              {uploadedImage && files[uploadedImage] && (
                <Image
                  file={files[uploadedImage]}
                  size="thumbnail"
                  className="avatarMainimage"
                />
              )}
              {!uploadedImage && (
                <center className="fileUpload">
                  click here to upload photo
                </center>
              )}
            </FileUpload>
            <br />
            Secure upload: All images are automatically deleted after approval.
            <br />
            <br />
            <br />
            <br />
            <li>
              For the safety of our community,{" "}
              <b>
                we&apos;re not allowing any migrations from the old server, or
                any outside servers as of this moment.
              </b>{" "}
              If you want to verify, you will have to follow the above steps.
              {/* If you already have a 18+ ID verification in another server with
              this discord account, skip the above, and type the server&apos;s
              name here:
              <InputBox
                name="migrateVerfication"
                onChange={(evt) => setMigrate(evt.target.value)}
              /> */}
            </li>
            <br />
            <br />
            Thanks! 💕
            <br />
            -The lewd admins
            <br />
            <center>
              <Button onclick={submit} disabled={!migrate && !uploadedImage}>
                Verify
              </Button>
            </center>
            <br />
            <br />
          </div>
        )}
        {status === "pending" && (
          <div>
            <Heading>18+ verification pending</Heading>
            <br />
            We&apos;re reviewing your verification, and will get back to you
            shortly.
            <br />
            {!user.roles && (
              <div>
                <br />
                You can <Link href="/">create your profile</Link> while waiting
                for verification!
                <br />
              </div>
            )}
            <br />
          </div>
        )}
        {status === "verified" && (
          <div>
            <Heading>Verification complete</Heading>
            <br />
            We&apos;ll redirect you shortly.
          </div>
        )}
        {status === "failed" && (
          <div>
            <Heading>Verification failed</Heading>
            <br />
            Please upload a better photo with correct items!
            <br />
            <Button onClick={regenerateVerification}>Verify again</Button>
          </div>
        )}
      </SuspenseBar>
    </div>
  );
};

export const UserVerification = ({ userId, onFinished }) => {
  const [verificationId, setVerificationId] = useState(null);
  const fetchVerification = async () => {
    const response = await fetch(`/api/verification`);
    const data = await response.json();
    setVerificationId(data.data.id);
  };
  return (
    <SuspenseBar
      height="30vh"
      finished={!!verificationId}
      load={() => fetchVerification()}
    >
      <Verification id={verificationId} onFinished={onFinished} />
    </SuspenseBar>
  );
};

export default Verification;
