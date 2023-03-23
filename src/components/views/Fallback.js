import { h } from "preact";
import { Link } from "../site/Elements.js";
import Helmet from "preact-helmet";
import { useState, useMemo, useEffect } from "preact/hooks";
import { useStores } from "pullstate";
import { fetchData } from "../scripts/api.js";
import Header from "../site/Header.js";
import PageRenderer from "./Pages/PageRenderer.js";

import ProfileView from "./Profile/ProfileView.js";
import { SuspenseBar } from "../site/Elements.js";
import { hasRole } from "../scripts/utils.js";
import { LoginFields } from "./Landing.js";

const Fallback = ({ url, header }) => {
  const { profileStore, siteStore } = useStores();
  const knonwProfiles = profileStore.useState((s) => s.profiles);
  const user = siteStore.useState((s) => s.user);
  const knownPages = siteStore.useState((s) => Object.keys(s.pages));
  const page = siteStore.useState((s) => s.pages)[url.substr(1)];
  return (
    <SuspenseBar
      height="30vh"
      finished={page && (page.type !== "page" || page.content)}
      load={async () =>
        fetchData(
          siteStore,
          `/api/pages/${url.substr(1)}`,
          null,
          (s, data) => (s.pages[url.substr(1)] = data.page)
        )
      }
    >
      {header && <Header />}
      {!page && <div></div>}
      {page && page.type === "page" && <PageRenderer {...page} />}
      {page && page.type === "profile" && knonwProfiles[page.id] !== null && (
        <ProfileView
          id={page.id}
          controls={
            user.profileId &&
            hasRole(user, "onboarded") &&
            user.profileId !== page.id
          }
        />
      )}
      {page && page.type === "profile" && knonwProfiles[page.id] === null && (
        <div className="drac-m-sm">
          <Helmet
            title={page.title}
            meta={[
              { name: "description", content: page.description },
              { property: "profile:username", content: page.username },
              { property: "og:type", content: "profile" },
              {
                property: "og:title",
                content: `${page.username} on vrerp.net`,
              },
              { property: "og:image", content: page.image },
              { property: "og:description", content: page.description },
            ]}
          />
          This profile is not public -you need to be a member to see it!
          <br />
          <br />
          <LoginFields redirectUrl={url} />
        </div>
      )}
      {page && page.type === "notfound" && (
        <div className="drac-m-sm">
          <Helmet title="Page not found - vrerp.net" />
          Page not found.
          <br />
          <Link href="/">Back to the main page</Link>
        </div>
      )}
    </SuspenseBar>
  );
};

export default Fallback;
