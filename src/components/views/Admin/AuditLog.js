import { h } from "preact";
import { useStores } from "pullstate";
import { useCallback, useEffect, useState } from "preact/hooks";
import { formatDate, hasRole } from "../../scripts/utils.js";
import { Image, Link } from "../../site/Elements.js";
import { getImageURL } from "../../../shared.js";
import { fetchPost } from "../../scripts/api.js";

export const AdminVerificationAuditLog = () => {
  const { profileStore } = useStores();
  const files = profileStore.useState((s) => s.files) || {};
  const [pendingVerification, setPendingVerification] = useState([]);
  const [rejectionReason, setRejectionReason] = useState({});
  const reloadList = async () => {
    const response = await fetch("/api/moderator/verifications-audit-log");
    const data = await response.json();
    setPendingVerification(data.data.verifications);
    profileStore.update((s) => {
      s.files = { ...s.files, ...data.data.files };
    });
  };
  useEffect(() => reloadList(), []);
  const setStatus = async (verificationId, status) => {
    const data = { status };
    if (rejectionReason[verificationId]) {
      data.rejectionReason = rejectionReason[verificationId];
    }
    await fetchPost(`/api/moderator/verifications/${verificationId}`, data);
    reloadList();
  };
  const handleRejectionChanged = (key) => (evt) => {
    setRejectionReason({ ...rejectionReason, [key]: evt.target.value });
  };
  // console.log(rejectionReason);
  return (
    <div>
      {pendingVerification.map((p) => (
        <div key={p.id}>
          <div className="profile-view-thumbnail">
            <Link
              href={getImageURL(files[p.image], "original")}
              className="profile-view-thumbnail-image"
              target="_blank"
            >
              <Image
                file={files[p.image]}
                size="thumbnail"
                className="mainimage-thumbnail"
                alt={p.discord}
              />
            </Link>
            <div className="profile-view-thumbnail-info">
              {p.discord || p.email}&nbsp;&nbsp;&nbsp;
              {p.profileId && (
                <span>
                  <Link href={`/moderator/profiles/${p.profileId}`}>
                    {p.url}
                  </Link>
                </span>
              )}
              {p.migrateVerification && (
                <div>Migrating verification from: {p.migrateVerification}</div>
              )}
              <br />
              {p.status}
              {p.status === "failed" && p.rejectionReason && (
                <span>: {p.rejectionReason}</span>
              )}
              <br />
              <br />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
