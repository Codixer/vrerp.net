import { h } from "preact";
import { Link } from "../../site/Elements.js";
import { useStores } from "pullstate";

export const NextAction = () => {
  const { profileStore, siteStore } = useStores();
  const user = siteStore.useState((s) => s.user);
  const profile = profileStore.useState((s) => s.profiles[user.profileId]);
  const bioEmpty = !(
    profile &&
    profile.onlineTimes &&
    profile.bio &&
    profile.lookingFor
  );
  const noPics = !(profile && profile.files && profile.files.length > 0);
  const noDiscordPresence = !(user && user.discordPresence);
  return (
    <div>
      {(bioEmpty || noPics) && (
        <div>Improve your profile to a have better chance of matching:</div>
      )}
      {bioEmpty && (
        <li>
          <Link href="/profile/bio">Fill out your bio</Link> so your lewdies
          know what you like 😊
        </li>
      )}
      {noPics && (
        <li>
          <Link href="/profile">Upload more pics</Link>, like results of{" "}
          <a href="https://bdsmtest.org/" target="_blank" rel="noreferrer">
            BDSM test
          </a>
          , or lewds 💕
        </li>
      )}
      {noDiscordPresence && (
        <li>
          <a
            href={"https://discord.gg/HDZQP6Wb6f"}
            target="_blank"
            rel="noreferrer"
          >
            Join the discord server
          </a>
          , and <a href="/profile/basicinfo">link your discord account</a> to
          flirt &amp; DM with your matches!
        </li>
      )}
    </div>
  );
};
