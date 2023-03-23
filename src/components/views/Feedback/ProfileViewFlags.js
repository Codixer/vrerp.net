import { h } from "preact";
import { formatDate } from "../../scripts/utils.js";
import { TagBubble } from "../Profile/TagBubble.js";

export const ProfileViewFlags = ({ profile }) => {
  const flagsCount = profile.flags ? profile.flags.length : 0;
  return (
    <div>
      {flagsCount > 0 && (
        <div>
          🚩 Red flags:
          {profile.flags.map((key) => (
            <span key={key}>
              <TagBubble key={key} selected={true} value={`${key}`} />
            </span>
          ))}
          <br />
          Flags expire: {formatDate(profile.flagsExpire)}
          <br />
          <br />
        </div>
      )}
    </div>
  );
};
