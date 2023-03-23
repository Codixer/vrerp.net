import { h } from "preact";

const ProfileStatus = ({ status }) => (
  <span>
    {status === "horny" && <span>🔵 Horny</span>}
    {status === "available" && <span>🟢 Available</span>}
    {status === "online" && <span>🟢 Online</span>}
    {status === "idle" && <span>🌙 Idle</span>}
    {status === "offline" && <span>⚫ Offline</span>}
    {status === "unavailable" && <span>🔴 Unavailable</span>}
    {status === "dnd" && <span>🔴 Do Not Disturb</span>}
    {!status && <span>&nbsp;</span>}
  </span>
);

export default ProfileStatus;
