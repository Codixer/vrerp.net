import { h } from "preact";
import { useStores } from "pullstate";
import { DynamicLink, Link, SuspenseBar, Image } from "../../site/Elements.js";
import { useState, useMemo, useEffect, useCallback } from "preact/hooks";
import { TagBubble } from "../Profile/TagBubble.js";

import style from "./AssetViewThumbnail.css";
import { Switch } from "@dracula/dracula-ui";
import { fetchStore, updateAssets, updateFiles } from "../../scripts/api.js";

export const TagList = ({ list }) => (
  <div>
    {list &&
      list.map((item) => <TagBubble key={item} selected={true} value={item} />)}
  </div>
);

export const AssetViewThumbnail = ({ id }) => {
  const [loading, setLoading] = useState(false);
  console.log("AssetViewThumbnail", id);
  const { assetStore, profileStore } = useStores();
  const asset = assetStore.useState((s) => s.assets[id], [id]) || {};
  console.log("asset", asset);
  const files = profileStore.useState((s) => s.files) || {};
  console.log("files", files);
  const assetImage = files[asset.image];
  const published = asset.status === "published";
  const switchStatus = useCallback(
    async (value) => {
      setLoading(true);
      await fetchStore(
        `/api/assets/${id}`,
        { status: value ? "published" : "private" },
        [
          [profileStore, updateFiles],
          [assetStore, updateAssets],
        ]
      );
      setLoading(false);
    },
    [id]
  );
  const refreshAsset = useCallback(async () => {
    setLoading(true);
    await fetchStore(`/api/assets/${id}/refresh`, {}, [
      [profileStore, updateFiles],
      [assetStore, updateAssets],
    ]);
    setLoading(false);
  }, [id]);
  return (
    <div className="thumbnail-view">
      <Link href={`/assets/${id}/edit`} className="thumbnail-view-image">
        <Image
          file={assetImage}
          size="thumbnail"
          className="thumbnail-image"
          alt={asset.title}
        />
      </Link>
      <div className="thumbnail-view-info">
        <Link href={`/assets/${id}/edit`}>{asset.title}</Link>
        <TagList list={asset.tags} />
        <br />
        <br />
        <span className="float-right">
          <DynamicLink onClick={refreshAsset}>refresh</DynamicLink>
          &nbsp;&nbsp;&nbsp;
          <Switch
            color="purple"
            checked={published}
            onClick={() => switchStatus(!published)}
          />
        </span>
        {asset.currency}
        {asset.price}
        <br />
      </div>
    </div>
  );
};
