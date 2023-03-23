import { h } from "preact";
import Helmet from "preact-helmet";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import { useStores } from "pullstate";
import Masonry from "react-masonry-css";
import { getImageURL } from "../../shared.js";
import {
  deleteData,
  fetchData,
  fetchStore,
  updateFiles,
  updateMedia,
} from "../scripts/api.js";
import { useLocation } from "../scripts/router.js";
import { hasRole } from "../scripts/utils.js";
import {
  Loading,
  SuspenseBar,
  Image,
  Modal,
  DynamicLink,
} from "../site/Elements.js";
import FileUpload from "../site/FileUpload.js";

import style from "../site/Gallery.css";

const breakpointColumnsObj = {
  default: 3,
  800: 2,
  500: 1,
};

const Media = ({ url, id }) => {
  const { route } = useLocation();
  const { siteStore, profileStore, mediaStore } = useStores();
  const user = siteStore.useState((s) => s.user);
  const [firstLoading, setFirstLoading] = useState(false);
  const [loadingScroll, setLoadingScroll] = useState(false);
  const imageList = mediaStore.useState((s) => s.imageList);
  const [hasMore, setHasMore] = useState(true);
  const files = profileStore.useState((s) => s.files);
  const pageBottom = useRef(null);
  const fetchPage = useCallback(async (lastId) => {
    let apiurl = `/api/mediawall`;
    if (lastId) {
      apiurl += `?lastId=${lastId}`;
    }
    const data = await fetchStore(apiurl, null, [
      [profileStore, updateFiles],
      [mediaStore, updateMedia],
    ]);
    if (data.list.length < 20) {
      setHasMore(false);
    }
  }, []);
  // scrolling
  const infiniteScroll = useCallback(
    async (event) => {
      if (
        pageBottom.current.getBoundingClientRect().top <= window.innerHeight &&
        !loadingScroll &&
        hasMore &&
        imageList.length > 0
      ) {
        setLoadingScroll(true);
        await fetchPage(imageList[imageList.length - 1]);
        setLoadingScroll(false);
      }
    },
    [loadingScroll, hasMore, imageList, fetchPage]
  );
  useEffect(async () => {
    if (imageList.length === 0) {
      setLoadingScroll(true);
      await fetchPage();
      setLoadingScroll(false);
    }
  }, []);
  useEffect(() => {
    window.addEventListener("scroll", infiniteScroll);
    return () => window.removeEventListener("scroll", infiniteScroll);
  }, [infiniteScroll]);
  const deleteImage = useCallback(
    async (e) => {
      // e.stopPropagation();
      const data = await deleteData(`/api/mediawall/${id}`);
      // console.log(data);
      mediaStore.update((s) => {
        s.imageList = s.imageList.filter((d) => d !== id);
      });
      route("/media");
    },
    [id]
  );
  const onUpload = useCallback(async (fid) => {
    await fetchStore(`/api/mediawall/files`, { id: fid }, [
      [profileStore, updateFiles],
      [
        mediaStore,
        (s, data) => {
          s.imageList = (data.list || []).concat(s.imageList);
        },
      ],
    ]);
  }, []);

  const imageMetaTags = useMemo(
    () =>
      id
        ? [
            {
              property: "og:image",
              content: getImageURL(files[id], "thumbnail"),
            },
            { name: "twitter:card", content: "summary_large_image" },
          ]
        : [],
    [id]
  );

  return (
    <div>
      <Helmet
        title={`vibe pics 💕 - vrerp.net`}
        meta={[
          { name: "description", content: "pics & media" },
          { property: "og:title", content: `vibe pics 💕 - vrerp.net` },
          { property: "og:description", content: "pics & media" },
          ...imageMetaTags,
        ]}
      />
      <SuspenseBar height="30vh" finished={!firstLoading}>
        <center>
          <h1>vibe pics 💕</h1>
        </center>
        <br />
        <div style={{ clear: "both" }}></div>
        <span className="float-right">
          VR selfies, or pics taken with consent from all parties.
          <br />
          {
            <FileUpload className={``} onUpload={onUpload} category="media">
              {<center className="fileUpload">+ upload images</center>}
            </FileUpload>
          }
        </span>
        <div style={{ clear: "both" }}></div>
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="masonry-grid"
          columnClassName="masonry-grid_column"
        >
          {imageList &&
            imageList.map((item, index) => (
              <div key={item} className="masonry-item">
                <a href={`/media/${item}`}>
                  <Image
                    file={files[item]}
                    size="thumbnail"
                    className="masonry-image"
                  />
                </a>
                <br />
                {files[item].username && (
                  <center>
                    <a href={`/${files[item].url}`}>{files[item].username}</a>
                    <br />
                  </center>
                )}
              </div>
            ))}
        </Masonry>
        {id && (
          <Modal show={true} onClose={() => route("/media")}>
            <Image
              className="gallery-modal-content"
              file={files[id]}
              size="original"
              onClick={() => route("/media")}
            />
            <div className="gallery-modal-caption">
              {files[id].username && (
                <span>
                  <a href={`/${files[id].url}`}>{files[id].username}</a>
                  <br />
                </span>
              )}
              <a
                href={getImageURL(files[id], "original")}
                target="_blank"
                rel="noreferrer"
              >
                Open original
              </a>
              <br />
              {user &&
                user.id &&
                files[id] &&
                (files[id].userId === user.id || hasRole(user, "admin")) && (
                  <DynamicLink
                    className="gallery-modal-delete"
                    onClick={deleteImage}
                  >
                    Delete image
                  </DynamicLink>
                )}
            </div>
          </Modal>
        )}
        <div ref={pageBottom}>{loadingScroll && <Loading />}</div>
      </SuspenseBar>
    </div>
  );
};

export default Media;
