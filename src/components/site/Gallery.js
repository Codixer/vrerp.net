import { h } from "preact";
import classNames from "classnames";
import { useCallback, useState } from "preact/hooks";
import { useStores } from "pullstate";

import style from "./Gallery.css";
import { DynamicLink, Modal, Image } from "./Elements.js";
import { deleteData } from "../scripts/api.js";
import { getImageURL } from "../../shared.js";

const Gallery = ({ fileIds }) => {
  const { profileStore, siteStore } = useStores();
  const user = siteStore.useState((s) => s.user);
  const files = profileStore.useState((s) => s.files) || {};
  const [modalImage, setModalImage] = useState(null);
  const prevImage = useCallback(
    (e) => {
      e.stopPropagation();
      const cindex = fileIds.indexOf(modalImage);
      setModalImage(fileIds[cindex > 0 ? cindex - 1 : fileIds.length - 1]);
    },
    [modalImage]
  );
  const nextImage = useCallback(
    (e) => {
      e.stopPropagation();
      const cindex = fileIds.indexOf(modalImage);
      setModalImage(fileIds[cindex < fileIds.length - 1 ? cindex + 1 : 0]);
    },
    [modalImage]
  );
  const deleteImage = useCallback(
    async (e) => {
      // e.stopPropagation();
      const data = await deleteData(
        `/api/profiles/${user.profileId}/files/${modalImage}`
      );
      // console.log(data);
      profileStore.update((s) => {
        s.profiles[user.profileId] = data.data.profile;
      });
    },
    [modalImage]
  );
  return (
    <div>
      {fileIds.map((f) => (
        <Image
          key={f}
          file={files[f]}
          size="thumbnail"
          className="gallery-image"
          onClick={() => setModalImage(f)}
        />
      ))}
      {modalImage && (
        <Modal show={!!modalImage} onClose={() => setModalImage(null)}>
          <div className="gallery-modal-left" onClick={prevImage}>
            &laquo;
          </div>
          <div className="gallery-modal-right" onClick={nextImage}>
            &raquo;
          </div>
          <Image
            className="gallery-modal-content"
            file={files[modalImage]}
            size="original"
            onClick={() => setModalImage(null)}
          />
          <div className="gallery-modal-caption">
            {user &&
              user.id &&
              files[modalImage] &&
              files[modalImage].userId === user.id && (
                <DynamicLink
                  className="gallery-modal-delete"
                  onClick={deleteImage}
                >
                  Delete image
                </DynamicLink>
              )}
            <a
              href={getImageURL(files[modalImage], "original")}
              target="_blank"
              rel="noreferrer"
            >
              Open original
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Gallery;
