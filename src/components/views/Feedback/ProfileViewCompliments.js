import { h } from "preact";
import { useState, useMemo } from "preact/hooks";
import { useStores } from "pullstate";
import { tagIterator, TagBubble } from "../Profile/TagBubble.js";

export const ProfileViewCompliments = ({ profile }) => {
  const complimentCount = Object.keys(profile.compliments || {}).reduce(
    (count, val) => count + profile.compliments[val].length,
    0
  );
  return (
    <div>
      {complimentCount > 0 && (
        <div>
          Complimented for:{" "}
          {Object.keys(profile.compliments).map((c) => (
            <span key={c}>
              {profile.compliments[c].length > 0 && (
                <span>
                  <TagBubble
                    key={c}
                    selected={true}
                    value={`${c} ${
                      profile.compliments[c].length > 1
                        ? `x${profile.compliments[c].length}`
                        : ""
                    }`}
                  />
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
