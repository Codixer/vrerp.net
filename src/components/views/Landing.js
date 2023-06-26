import { h } from "preact";
import Helmet from "preact-helmet";
import { DynamicLink, Image, Link } from "../site/Elements.js";
import {
  Paragraph,
  Heading,
  Avatar,
  Text,
  List,
  Button,
} from "@dracula/dracula-ui";
import { useStores } from "pullstate";

import style from "./Landing.css";
import { useMemo } from "preact/hooks";
import { EmailAuth } from "./User/EmailAuth.js";
import Header from "../site/Header.js";
import { useLocation } from "../scripts/router.js";
import { getImageURL } from "../../shared.js";
import ProfileViewThumbnail from "./Profile/ProfileViewThumbnail.js";
import { KinkList } from "./Matches.js";

export const LoginFields = ({ redirectUrl }) => {
  const { siteStore } = useStores();
  const url = siteStore.useState((s) => s.url);
  const discordLogin = useMemo(
    () => `${url}api/discord/auth`.replace(/\//g, "%2F"),
    [url]
  );
  const state = redirectUrl ? `&state=${encodeURI(redirectUrl)}` : "";
  return (
    <div>
      <Heading size="md" p="sm">
        Sign up, or log in with discord
      </Heading>
      <center>
        <a
          href={`https://discord.com/api/oauth2/authorize?client_id=1087160580990832741&redirect_uri=${discordLogin}&response_type=code&scope=guilds guilds.join identify${state}`}
        >
          <img
            src="https://cdn.vrerp.net/login-with-discord.png"
            alt="log in with discord"
            className="landing-login-btn track-login-btn"
          />
        </a>
        <br />
        <Text size="sm">
          (We use your Discord account to join our server and link you to our
          website, all communication happens through our server and your roles
          get synced. We don't do anything else with this data)
        </Text>
      </center>
    </div>
  );
};

export const NotPublic = ({ url, ...metaprops }) => (
  <div className="drac-m-sm">
    {!metaprops && <Helmet title={"Sign up to view this page - vrerp.net"} />}
    {metaprops && <Helmet {...metaprops} />}
    <Header />
    <br />
    You need to be a member to see this page.
    <br />
    <br />
    <LoginFields redirectUrl={url} />
  </div>
);

export const NotPublicMedia = ({ url, id }) => {
  const { profileStore } = useStores();
  const files = profileStore.useState((s) => s.files);
  const imageMetaTags = useMemo(
    () =>
      id
        ? [
            {
              property: "og:image",
              content: getImageURL(files[id], "thumbnail"),
            },
            { name: "twitter:card", content: "summary_large_image" },
          ]
        : [],
    [id]
  );
  return (
    <NotPublic
      url={url}
      title={`vibe pics 💕 - vrerp.net`}
      meta={[
        { name: "description", content: "pics & media" },
        { property: "og:title", content: `vibe pics 💕 - vrerp.net` },
        { property: "og:description", content: "pics & media" },
        ...imageMetaTags,
      ]}
    />
  );
};

export const LandingPics = () => {
  return (
    <center className="landing-image-container">
      <img
        src="https://cdn.vrerp.net/frontpage/pic-1-alaenoor.png"
        className="landing-image"
      />
      <img
        src="https://cdn.vrerp.net/frontpage/pic-1-succy.png"
        className="landing-image"
      />
      <img
        src="https://cdn.vrerp.net/frontpage/pic-2-comfiecake.png"
        className="landing-image"
      />
      <img
        src="https://cdn.vrerp.net/frontpage/pic-3-hoodie.png"
        className="landing-image"
      />
    </center>
  );
};

export const LandingPage = () => {
  return (
    <div>
      <Heading>
        <Link href={"/"}>
          <div className="titleContainer">
            <Avatar
              title="VR ERP.net"
              src="https://cdn.vrerp.net/logo.jpg"
              displayName="logoAvatar"
            />
            <div className="titleMain">A safe haven for your kinky side</div>
          </div>
        </Link>
      </Heading>
      <div className="drac-p-sm">
        <Text>
          Find new VR lewdies, and make your sexual fantasies come true in
          virtual reality 😊
          <br />
          <br />
        </Text>
        <Text>
          The admins love playing with strangers, so we&apos;re building a
          community where we can be horny together 😊
          <br />
          <br />
          Our community is centered around social VR (where all the lewding
          happens), this site dedicated to erp matchmaking, and a discord for
          flirting, meeting new lewdies💕, events, and more!
          <br />
          <br />
          <br />
          We have a bunch of goodies inside:
          <li>a super active &amp; lewd community 💕</li>
          <li>dedicated matchmaking (for finding new lewdies 😊)</li>
          <li>lobby (for finding peeps available right now)</li>
          <li>
            <Link href="/codixer">build your own detailed erp profile</Link> you
            can share with others on discord
          </li>
          <li>
            <Link href="/guides">guides</Link> for{" "}
            <Link href="/VRC-Kama-Sutra-or-kittens-guide-to-cuddles">
              leveling up your erp skills
            </Link>
          </li>
          <li>
            <Link href="/vrchat-avatar-assets">ERP avatars</Link>, and{" "}
            <Link href="/vrchat-accessory-assets">accessories</Link>
          </li>
          and more 😊
          <br />
          Come on in! 🤗
          <br />
        </Text>
      </div>
      <LandingPics />
      <Heading size="md" p="sm">
        How do I join?
      </Heading>
      <LoginFields />
      {/* <center>
        <a
          href={"https://discord.gg/HDZQP6Wb6f"}
          target="_blank"
          rel="noreferrer"
        >
          <img
            src="https://cdn.vrerp.net/join-discord.png"
            alt="join our discord server"
            className="landing-login-btn"
          />
        </a>
      </center> */}
      💕love,
      <br />- The lewd admins
    </div>
  );
};
