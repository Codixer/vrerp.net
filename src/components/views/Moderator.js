import { h } from "preact";
import { useState, useMemo, useEffect, useCallback } from "preact/hooks";
import Helmet from "preact-helmet";
import { useStores } from "pullstate";

import {
  Link,
  InputBox,
  Button,
  SuspenseBar,
  DynamicLink,
  Image,
} from "../site/Elements.js";
import {
  AdminProfileEdit,
  AdminProfileList,
  AdminUserSearch,
  AdminVerification,
} from "./Admin/AdminTools.js";
import { AdminImages } from "./Admin/AdminImages.js";
import AdminMediations from "./Admin/AdminMediations.js";
import AdminMood from "./Admin/AdminMood.js";
import { AdminVerificationAuditLog } from "./Admin/AuditLog.js";

const Moderator = ({ section, id }) => (
  <div>
    <Helmet title={`Moderator - vrerp.net`} />
    <Link href="/moderator">Moderator</Link>
    <br />
    {section === undefined && (
      <div>
        <AdminUserSearch />
        <br />
        <li>
          <Link href="/moderator/verification">id verification</Link>
        </li>
        <li>
          <Link href="/moderator/images">images</Link>
        </li>
        <li>
          <Link href="/moderator/mediations">mediations</Link>
        </li>
        <li>
          <Link href="/moderator/mood">mood tracker</Link>
        </li>
        <br />
      </div>
    )}
    {section === "member-profiles" && <AdminProfileList membersOnly={true} />}
    {section === "profiles" && !id && <AdminProfileList membersOnly={false} />}
    {section === "verification" && <AdminVerification />}
    {section === "images" && <AdminImages />}
    {section === "mediations" && <AdminMediations />}
    {section === "mood" && <AdminMood />}
    {section === "profiles" && id && <AdminProfileEdit id={id} />}
    {section === "verification-audit-log" && <AdminVerificationAuditLog />}
  </div>
);

export default Moderator;
