import { h } from "preact";

import { Switch } from "@dracula/dracula-ui";
import { useCallback, useState } from "preact/hooks";
import { useStores } from "pullstate";
import {
  fetchData,
  fetchStore,
  updateAssets,
  updateFiles,
} from "../../scripts/api.js";
import { DynamicLink, Link, SuspenseBar, Image } from "../../site/Elements.js";
import { TagBubble } from "../Profile/TagBubble.js";
import { TagList } from "./AssetViewThumbnail.js";

const AssetEditTags = ({ id }) => {
  const { assetStore, profileStore } = useStores();
  const alltags = assetStore.useState((s) => s.tags) || [];
  const asset = assetStore.useState((s) => s.assets[id], [id]) || {};
  const toggleSelected = useCallback(
    async (key) => {
      let newtaglist = Array.from(asset.tags);
      if (newtaglist.includes(key)) {
        newtaglist = newtaglist.filter((k) => k !== key);
      } else {
        newtaglist.push(key);
      }
      await fetchStore(`/api/assets/${id}`, { tags: newtaglist }, [
        [profileStore, updateFiles],
        [assetStore, updateAssets],
      ]);
    },
    [asset]
  );
  return (
    <SuspenseBar
      height="30vh"
      finished={alltags && alltags.length > 0}
      load={() => fetchData(assetStore, `/api/assets/schema`)}
    >
      <h3>Tags</h3>
      {alltags &&
        alltags.map((tag, index) => (
          <TagBubble
            key={index}
            selected={asset.tags.includes(tag)}
            value={tag}
            onClick={() => toggleSelected(tag)}
          />
        ))}
    </SuspenseBar>
  );
};

const AssetEdit = ({ id }) => {
  const [loading, setLoading] = useState(false);
  const { assetStore, profileStore } = useStores();
  const asset = assetStore.useState((s) => s.assets[id], [id]) || {};
  const files = profileStore.useState((s) => s.files) || {};
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
    <SuspenseBar
      height="30vh"
      finished={asset && Object.keys(asset).length > 0}
      load={() =>
        fetchStore(`/api/assets/${id}`, null, [
          [profileStore, updateFiles],
          [assetStore, updateAssets],
        ])
      }
    >
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
          <br />
          Link:{" "}
          <a href={asset.url} target="_blank" rel="noreferrer">
            {asset.url}
          </a>
          <br />
          <br />
          <AssetEditTags id={id} />
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
    </SuspenseBar>
  );
};

export default AssetEdit;
