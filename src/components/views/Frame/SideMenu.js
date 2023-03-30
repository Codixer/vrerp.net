import { h } from "preact";
import { DynamicLink, Link } from "../../site/Elements.js";
import { useStores } from "pullstate";
import { Avatar, Select, Text } from "@dracula/dracula-ui";
import ProfileAvatar from "../Profile/ProfileAvatar.js";
import style from "./SideMenu.css";

import { hasRole } from "../../scripts/utils.js";
import { fetchData } from "../../scripts/api.js";

export const MenuLink = ({ href, children }) => (
  <div className="sidemenu-item" key={`menu${href}`}>
    <Link href={href}>{children}</Link>
  </div>
);

export const SupportLink = ({ href, children }) => (
  <div className="sidemenu-item" key={`menu${href}`}>
    <Link style="color: #ffe100; text-decoration: none; margin: 10px;" href={href}>{children}</Link>
  </div>
);

export const LovenseLink = ({ href, children }) => (
  <div className="sidemenu-item" key={`menu${href}`}>
    <Link style="color: #d70072; text-decoration: none; margin: 10px;" href={href}>{children}</Link>
  </div>
);

export const DynamicMenuLink = ({ key, children, onClick }) => (
  <div className="sidemenu-item" key={`menu${key}`}>
    <DynamicLink className="nodecoration" onClick={onClick}>
      {children}
    </DynamicLink>
  </div>
);

export const MainMenu = () => {
  const { siteStore, profileStore } = useStores();
  const user = siteStore.useState((s) => s.user);
  const roles = siteStore.useState((s) =>
    s.user && s.user.roles ? s.user.roles : []
  );
  const status = user.status;
  const profile = profileStore.useState((s) => s.profiles[user.profileId]);
  const files = profileStore.useState((s) => s.files) || {};
  const setStatus = (evt) =>
    fetchData(siteStore, `/api/users/status`, { status: evt.target.value });
  return (
    <div className="sidemenu-bar">
      {hasRole(user, "onboarded") && (
        <div className="sidemenu-menu">
          <MenuLink href="/">💕 VR ERP</MenuLink>

          {/* <div className="titleContainer">
                        <Avatar title={ profile.username } src={ getImageURL(files[profile.avatar], 'thumbnail') } displayName={ profile.username } />
                        <div className='titleMain'>{ profile.username }<br/>
                            <Text size='xs'>Profile - Settings</Text>
                        </div>
                    </div> */}
          <Select defaultValue={status} onChange={setStatus}>
            <option value="horny">🔵 Horny</option>
            <option value="available">🟢 Available</option>
            <option value="online">🟢 Online</option>
            <option value="unavailable">🔴 Unavailable</option>
          </Select>
          <MenuLink href={`/${profile.url}`}>@{profile.username}</MenuLink>
          <div className="sidemenu-item">
            <li>
              <Link href="/profile">edit bio</Link>
            </li>
            <li>
              <Link href="/settings">settings</Link>
            </li>
          </div>
          <MenuLink href="/browse">🌎 Browse</MenuLink>
          <MenuLink href="/search">🔍 Search</MenuLink>
          <MenuLink href="/lobby">🐱 Lobby</MenuLink>
          <MenuLink href="/new-arrivals">🎉 New Arrivals</MenuLink>
          <MenuLink href="/fresh-souls">🌱 Fresh&nbsp;Souls</MenuLink>
          <MenuLink href="/invites">📨 Invites</MenuLink>
          <MenuLink href="/matches">💕 Matches</MenuLink>
          {roles && roles.includes("dates") && (
            <MenuLink href="/dates">💝 Dates</MenuLink>
          )}
          <MenuLink href="/fantasies">✨ Fantasies</MenuLink>
          <MenuLink href="/media">📷 Media</MenuLink>
          <MenuLink href="/vrchat-avatar-assets">🌸 Avatars</MenuLink>
          <MenuLink href="/guides">📕 Guides</MenuLink>
          {roles && roles.includes("events") && (
            <MenuLink href="/events">📅 Events</MenuLink>
          )}
          <div className="sidemenu-admin">
            <LovenseLink href="https://www.lovense.com/r/ocnexm">💕 Buy Lovense</LovenseLink>
          </div>

        </div>
      )} {
        // #d70072
      }
      <div className="sidemenu-admin">
        <SupportLink href="https://www.patreon.com/vrerp">💰 Support us!</SupportLink>
      </div>

      {hasRole(user, "admin") && (
        <div className="sidemenu-admin">
          <MenuLink href="/admin">🔔 Admin</MenuLink>
        </div>
      )}
      {hasRole(user, "mod") && (
        <div className="sidemenu-admin">
          <MenuLink href="/moderator">🔔 Moderator</MenuLink>
        </div>
      )}
    </div>
  );
};

export const SideMenu = ({ url, children, Menu = MainMenu }) => {
  return (
    <div className="sidemenu">
      <Menu />
    </div>
  );
};
