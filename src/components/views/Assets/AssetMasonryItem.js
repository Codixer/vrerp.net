import { h } from "preact";
import { useState, useCallback } from "preact/hooks";
import { fetchPost, fetchStore, updateProfile } from "../../scripts/api.js";
import { useStores } from "pullstate";

import style from "./AssetMasonryItem.css";
import { Image } from "../../site/Elements.js";

const mapCurrency = {
  USD: "$",
  EUR: "€",
  JPY: "¥",
};
const getPrice = (asset) => {
  if (asset.price === "0.00" || asset.price === "0.0" || asset.price === "0") {
    return "free";
  } else {
    return `${
      asset.currency && asset.currency.length === "1"
        ? asset.currency
        : mapCurrency[asset.currency]
        ? mapCurrency[asset.currency]
        : asset.currency
    }${asset.price}`;
  }
};

const AssetItem = ({ id }) => {
  const { profileStore, siteStore, assetStore } = useStores();
  const user = siteStore.useState((s) => s.user);
  const profile =
    user && user.profileId
      ? profileStore.useState((s) => s.profiles[user.profileId], [id])
      : null;
  const asset = assetStore.useState((s) => s.assets[id]);
  const file =
    asset && asset.image
      ? profileStore.useState((s) => s.files[asset.image])
      : null;
  const [addedToWishlist, setAddedToWishlist] = useState(
    profile && profile.wishlist && profile.wishlist.includes(id)
  );
  const toggleWishlist = useCallback(async () => {
    setAddedToWishlist(!addedToWishlist);
    await fetchStore(`/api/profiles/${user.profileId}/wishlist`, { id }, [
      [profileStore, updateProfile(profile.id)],
    ]);
  }, [id, user, addedToWishlist]);
  const triggerClick = useCallback(
    () => fetchPost(`/api/assets/${id}/click`, {}),
    [id]
  );
  if (!asset) {
    return <div className="masonry-item"></div>;
  }

  const affiliateLink = (url) => {
    if (url.match(/.gumroad.com/)) {
        return `${ url }?a=573336883`;   /// your affiliate number here
    }

    if (url.match(/.payhip.com/)) {
      return `${ url }?fp_ref=stefano87`;   /// your affiliate number here
  }
    return url;
};

  return (
    <div className="masonry-item">
      <a
        href={affiliateLink(asset.url)}
        target="_blank"
        rel="noreferrer"
        onClick={triggerClick}
        onAuxClick={triggerClick}
        className="masonry-item"
      >
        <div>
          {file && (
            <Image file={file} size="thumbnail" className="masonry-image" />
          )}
          <br />
          {asset.title}
          <br />
        </div>
      </a>
      <span className="asset-price">{getPrice(asset)}</span>
      {profile && (
        <span className="asset-wishlist dynamiclink" onClick={toggleWishlist}>
          {addedToWishlist && `❤️`}
          {!addedToWishlist && `+`}
          &nbsp;Wishlist
        </span>
      )}
      <div style={{ clear: "both" }}></div>
    </div>
  );
};

export default AssetItem;
