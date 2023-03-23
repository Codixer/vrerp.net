import { h } from "preact";
import { useState, useMemo, useEffect } from "preact/hooks";
import { useStores } from "pullstate";
import { fetchPost } from "../../scripts/api.js";
import { Heading } from "@dracula/dracula-ui";
import {
  Button,
  Error,
  InputBox,
  Modal,
  outlinedButton,
} from "../../site/Elements.js";

export const EmailAuth = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState("");
  const [modal, setModal] = useState(false);

  const { siteStore } = useStores();
  const user = siteStore.useState((s) => s.user);

  const handleSubmit = async () => {
    setLoading(true);
    const res = await fetchPost(`/api/users`, { email });
    setLoading(false);
    if (res && res.error) {
      setErrors(res.error);
      return;
    }
    setModal(true);
  };
  return (
    <div>
      <Heading size="md" p="sm">
        Sign up, or log in with email
      </Heading>
      <div className="login-email">
        <InputBox
          name="email"
          onChange={(evt) => setEmail(evt.target.value)}
          className="w240"
          placeholder="me@domain.com"
        />
        <div className="drac-p-sm">
          <Button disabled={!email || loading} onClick={handleSubmit}>
            Log in &raquo;
          </Button>
          <br />
        </div>
      </div>
      <Error>{errors}</Error>
      <Modal show={modal} onClose={() => setModal(false)}>
        <div className="modal-content">
          <br />
          Please click on the link we&apos;ve sent to your email address.
          <br />
          (Check your spam folder, if it&apos;s not in your inbox)
          <br />
          <center>
            <Button className={outlinedButton} onClick={() => setModal(false)}>
              Ok
            </Button>
          </center>
          <br />
        </div>
      </Modal>
    </div>
  );
};
