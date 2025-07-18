import { h } from "preact";
import { useState, useMemo, useEffect, useCallback } from "preact/hooks";
import Helmet from "preact-helmet";
import { SuspenseBar } from "../site/Elements.js";
import { useStores } from "pullstate";
import { fetchProfileList } from "../scripts/api.js";
import ProfileViewThumbnail from "./Profile/ProfileViewThumbnail.js";
import ProfileStatus from "./Profile/ProfileStatus.js";
import { Link } from "../site/Elements.js";
import { KinkList } from "./Matches.js";

const NewArrivals = () => {
  const [loading, setLoading] = useState(true);
  const [listData, setListData] = useState([]);
  const { profileStore, assetStore } = useStores();
  const profiles = profileStore.useState((s) => s.profiles) || {};
  const profileList =
    profileStore.useState((s) => Object.keys(s.profiles)) || [];
  const loadProfiles = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/new-to-site");
    const data = await response.json();
    const missingProfiles = data.data.filter(
      (profileId) => !profileList.includes(profileId)
    );
    await fetchProfileList(missingProfiles, profileStore, assetStore);
    setListData(data.data);
    setLoading(false);
  }, [profileList]);
  return (
    <div>
      <Helmet title={`New Arrivals - vrerp.net`} />
      <SuspenseBar height="30vh" finished={!loading} load={loadProfiles}>
        <br />
        Peeps who <i>🎉recently signed up🎉</i>: <br />
        <br />
        <br />
        {listData &&
          listData.length > 0 &&
          listData.map((id) => (
            <ProfileViewThumbnail key={id} id={id}>
              <span
                className="float-right"
                id={`profile-status-display-${id}`}
                key={`profile-status-display-${id}`}
              ></span>
              <Link href={`/${profiles[id].url}`}>{profiles[id].username}</Link>
              <KinkList profile={profiles[id]} />
            </ProfileViewThumbnail>
          ))}
        <br />
        <br />
      </SuspenseBar>
    </div>
  );
};

export default NewArrivals;
