import { h } from "preact";
import { Link } from "../site/Elements.js";
import Helmet from "preact-helmet";
import Header from "../site/Header.js";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { useStores } from "pullstate";
import ProfileViewThumbnail from "./Profile/ProfileViewThumbnail.js";
import { KinkList } from "./Matches.js";
import { LoginFields } from "./Landing.js";

export const InvitePage = ({ url, header }) => {
  const { siteStore, profileStore } = useStores();
  const inviterId = siteStore.useState((s) => s.view.inviterId);
  const profile = profileStore.useState((s) => s.profiles[inviterId]) || {};
  if (!inviterId) {
    return (
      <div>
        <Helmet title="Page not found - vrerp.net" />
        Invite code not found.
        <br />
        <Link href="/">Back to the main page</Link>
      </div>
    );
  }
  return (
    <div>
      {header && <Header />}
      <Helmet
        title={`${profile.username} has invited you to vrerp.net!`}
        meta={[
          {
            name: "description",
            content: `${profile.username} has invited you to vrerp.net!`,
          },
        ]}
      />
      {profile.username} has invited you to vrerp.net!
      <br />
      <br />
      <ProfileViewThumbnail key={inviterId} id={inviterId}>
        {profile.username}
        <KinkList profile={profile} />
      </ProfileViewThumbnail>
      <br />
      <br />
      <br />
      vrerp.net is the first erp-specific matchmaking site for finding new
      partners for vr erp, and keeping in touch with your lewdies 😊
      <br />
      <br />
      Click below to accept their invite and join the site:
      <br />
      <LoginFields />
    </div>
  );
};
