import { h } from "preact";
import { Radio } from "@dracula/dracula-ui";
import { useCallback, useEffect, useState } from "preact/hooks";
import { useStores } from "pullstate";
import { getImageURL } from "../../../shared.js";
import { fetchPost } from "../../scripts/api.js";
import { formatDate } from "../../scripts/utils.js";
import {
  Button,
  InputBox,
  Link,
  Image,
  outlinedButton,
} from "../../site/Elements.js";
import { TagBubble } from "../Profile/TagBubble.js";

const AdminMediationRulingRadio = ({ report, type, children, onClick }) => (
  <div>
    <Radio
      name={`ruling-${report.id}`}
      id={`ruling-${report.id}-${type}`}
      color="purple"
      defaultChecked={false}
      onClick={onClick}
    />
    <label htmlFor={`ruling-${report.id}-${type}`}>{children}</label>
  </div>
);

const AdminMediationRulings = ({ report, onFinish }) => {
  const [decision, setDecision] = useState("");
  const [days, setDays] = useState(null);
  const [loading, setLoading] = useState(false);
  const onSubmit = useCallback(async () => {
    setLoading(true);
    await fetchPost(`/api/moderator/reports/${report.id}`, {
      result: decision,
      days,
    });
    if (onFinish) {
      onFinish();
    }
    setLoading(false);
  }, [decision, setLoading, days]);
  console.log("decision", decision);
  return (
    <div>
      Ruling:
      <br />
      <AdminMediationRulingRadio
        report={report}
        type={"none"}
        onClick={() => setDecision("none")}
      >
        No action, disregard report
      </AdminMediationRulingRadio>
      <AdminMediationRulingRadio
        report={report}
        type={"warn"}
        onClick={() => setDecision("warn")}
      >
        Warn person, no punishment
      </AdminMediationRulingRadio>
      <AdminMediationRulingRadio
        report={report}
        type={"flag"}
        onClick={() => setDecision("flag")}
      >
        Flag on profile for{" "}
        <InputBox
          name={`report-${report.id}-days`}
          onChange={(evt) => setDays(evt.target.value)}
        />{" "}
        days
      </AdminMediationRulingRadio>
      <AdminMediationRulingRadio
        report={report}
        type={"ban"}
        onClick={() => setDecision("ban")}
      >
        Ban person
      </AdminMediationRulingRadio>
      <br />
      <Button
        onClick={onSubmit}
        className={`${outlinedButton} drac-btn-lg`}
        disabled={loading}
      >
        Moderate
      </Button>
    </div>
  );
};

const AdminReportView = ({ report }) => {
  const { profileStore } = useStores();
  const files = profileStore.useState((s) => s.files) || {};
  return (
    <div>
      Report date: {formatDate(report.createdAt)}
      <br />
      by:&nbsp;&nbsp;
      {report.victimUrl && (
        <a href={`/${report.victimUrl}`} target="_blank" rel="noreferrer">
          {report.victimUrl}
        </a>
      )}
      {!report.victimUrl && <span> report.victimId</span>}
      &nbsp;&nbsp;against: &nbsp;
      {report.accusedUrl && (
        <a href={`/${report.accusedUrl}`} target="_blank" rel="noreferrer">
          {report.accusedUsername}
        </a>
      )}
      {!report.accusedUrl && <span>{report.accusedUsername}</span>}
      <br />
      {report.tags &&
        report.tags.map((tag, index) => (
          <TagBubble key={index} selected={true} value={tag} />
        ))}
      <br />
      Details:
      <br />
      {report.reportDetails}
      <br />
      <br />
      {report.reportImage && (
        <Link
          href={getImageURL(files[report.reportImage], "original")}
          className="profile-view-thumbnail-image"
          target="_blank"
        >
          <Image
            file={files[report.reportImage]}
            size="thumbnail"
            className="mainimage-thumbnail"
          />
        </Link>
      )}
    </div>
  );
};

const AdminMediations = () => {
  const { profileStore } = useStores();
  const [reports, setReports] = useState([]);

  const reloadList = async () => {
    const response = await fetch("/api/moderator/reports");
    const data = await response.json();
    setReports(data.data.reports);
    profileStore.update((s) => {
      s.files = { ...s.files, ...data.data.files };
    });
  };
  useEffect(() => reloadList(), []);
  return (
    <div>
      <h1>Pending Reports</h1>
      {reports.map((r) => (
        <div key={r.id}>
          <AdminReportView report={r} />
          <br />
          <AdminMediationRulings report={r} onFinish={reloadList} />
          <br />
          <br />
          <br />
        </div>
      ))}
    </div>
  );
};

export default AdminMediations;
