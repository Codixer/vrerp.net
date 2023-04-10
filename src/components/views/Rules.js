import { h } from "preact";
import { Link } from "../site/Elements.js";
import Helmet from "preact-helmet";

import {
  Paragraph,
  Heading,
  Avatar,
  Text,
  List,
  Button,
} from "@dracula/dracula-ui";

export const Rules = () => (
  <div>
    <h3>Community rules</h3>
    <li>You must be over 18 to participate on this server</li>
    <li>
      If you&apos;re new to ERPing,{" "}
      <a href="/VRC-Kama-Sutra-or-kittens-guide-to-cuddles" target="_blank">
        read our guide here
      </a>
    </li>
    <li>No underage nudity of any kind</li>
    <li>No IRL selfies, or IRL pics of any kind on the site</li>
    <li>No paid-for ERP services, this is a bannable offense</li>
    <li>No drama, or venting, only good vibes</li>
    <li>Be kind, and lewd💕 to each other!</li>
    <br />
    <h3>In-VR ERP rules</h3>
    Unless you&apos;ve agreed with your partner otherwise, default rules for
    in-VR ERP are:
    <br />
    <br />
    <li>
      Always make sure your partner is safe, comfortable, and happy, and
      everything is consensual.
    </li>
    <li>
      Do not create drama. If a situation has drama-potential, do not pull peeps
      from vrerp.net into it
    </li>
    <li>
      Have your attention focus on your partner, and the act. Discording while
      your partner is riding on top of you is super impolite.
    </li>
    <li>No photography without consent</li>
    <li>Please be kind, attentive, and lewd to each other! 💕</li>
    <br />
    You can report violations on the site{" "}
    <a href="https://vrerp.net/report">https://vrerp.net/report</a>, directly on
    the person&apos;s profile, or by DMing any admin on discord.
    <br />
  </div>
);

export const RulesUpdates = () => (
  <div>
    <h3>👉 2023 update</h3>
    We have super good vibes on the server 💕 To maintain good vibes:
    <br />
    <br />
    <li>All registrations undergo approval</li>
    <li>
      You must undergo 18+ verification, either via ID, or being verified at a
      large other ERP server
    </li>
    <li>
      Your profile <b>must</b> contain a profile pic that is your main ERP
      avatar. If you don&apos;t have an ERP avatar yet,{" "}
      <a href="/vrchat-avatar-assets">feel free to browse around here</a>,
      upload the AVI, take a pic of it in VR, then come back.
    </li>
    <li>Your main avi must not be an e-boy</li>
    <li>
      On the other hand, we have a <i>lot</i> of cute subs, but not enough vibe
      doms 💕 Futa, or furry doms are super welcome 🥰
    </li>
  </div>
);

export const RulesPage = () => (
  <div>
    <Helmet
      title={`Rules on vrerp.net and the vrerp discord`}
      meta={[
        { name: "description", content: "Be kind, and lewd 💕 to each other!" },
        {
          property: "og:title",
          content: "Rules on vrerp.net and the vr erp discord",
        },
        {
          property: "og:description",
          content: "Be kind, and lewd 💕 to each other!",
        },
        { property: "og:site_name", content: "vrerp.net" },
      ]}
    />

    <Heading>
      <Link href={"/"}>
        <div className="titleContainer">
          <Avatar
            title="VR ERP.net"
            src="https://cdn.vrerp.net/logo.jpg"
            displayName="logoAvatar"
          />
          <div className="titleMain">Rules</div>
        </div>
      </Link>
    </Heading>
    <div className="drac-p-sm">
      <Rules />
    </div>
  </div>
);
