import { h } from "preact";
import { useEffect } from "preact/hooks";
import { useStores } from "pullstate";
import { fetchData } from "../../scripts/api.js";
import { useLocation } from "../../scripts/router.js";

const Logout = () => {
  const { route } = useLocation();
  const { siteStore } = useStores();

  useEffect(async () => {
    const { error } = await fetchData(siteStore, `/api/users/logout`, {});
    route(`/`);
  }, []);
  return <div></div>;
};

export default Logout;
