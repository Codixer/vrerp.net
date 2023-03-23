import { h } from "preact";
import { useCallback, useState } from "preact/hooks";
import { useStores } from "pullstate";
import { fetchPost } from "../../scripts/api.js";
import { useLocation } from "../../scripts/router.js";
import { clientSide, plural } from "../../scripts/utils.js";
import { Button, InputArea, outlinedButton } from "../../site/Elements.js";

const ReportMediation = () => {
  const { route, url } = useLocation();
  const { siteStore } = useStores();
  const reported = siteStore.useState((s) =>
    s.user && s.user.reported ? s.user.reported : null
  );
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [redirecturl, setRedirectUrl] = useState(
    clientSide ? new URLSearchParams(window.location.search).get("url") : ""
  );
  // console.log('redirecturl', redirecturl);
  const onAcknoledged = async () => {
    setLoading(true);
    await fetchPost("/api/reports/acknowledge", { id: reported.id });
    // console.log(response);
    setLoading(false);
    route(redirecturl || "/");
  };
  if (!reported) {
    return <div></div>;
  }
  return (
    <div>
      <h1>Mediation</h1>
      You&apos;ve been reported for violating server rules by the following
      conduct:
      <br />
      <br />
      {reported.tags.map((t) => (
        <li key={t}>{t}</li>
      ))}
      <br />
      {reported.reportDetails && (
        <div>
          Accuser has this to say:
          <br />
          {reported.reportDetails}
        </div>
      )}
      <br />
      <br />
      This is not vibe 🥺 please don&apos;t do it again.
      <br />
      <br />
      {reported.adminDecision === "warn" && (
        <div>
          Repeated violation will lead to flagging 🚩 your profile, up to ban.
        </div>
      )}
      {reported.adminDecision === "flag" && (
        <div>
          We have added {reported.adminDecisionDays}{" "}
          {plural(reported.adminDecisionDays, "day")} of 🚩 red flag on your
          profile.
        </div>
      )}
      <br />
      <br />
      To appeal this decision, DM Codixer#2936
      <br />
      <br />
      <br />
      <center>
        <Button
          onClick={onAcknoledged}
          disabled={loading}
          className={`${outlinedButton}`}
        >
          Understood
        </Button>
      </center>
    </div>
  );
};

export default ReportMediation;
