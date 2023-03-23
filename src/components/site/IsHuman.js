// human detection
import { h } from "preact";
import { useEffect } from "preact/hooks";
import { useStores } from "pullstate";

const IsHuman = () => {
  const { siteStore } = useStores();
  const user = siteStore.useState((s) => s.user);
  useEffect(async () => {
    if (!user || !user.isHuman) {
      const response = await fetch(`/api/ishuman`, {
        method: "POST",
        body: JSON.stringify({ status: "ok" }),
      });
    }
  }, [user]);
  return <div></div>;
};

export default IsHuman;
