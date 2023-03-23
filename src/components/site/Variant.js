import { h } from "preact";
import { useEffect } from "preact/hooks";
import { useStores } from "pullstate";

export const Variant = ({ name, value, children }) => {
  const { variantStore } = useStores();
  const variantSet = variantStore.useState((s) => s.variantSet);
  const enrolledAt = variantStore.useState((s) => s.enrolledAt);
  useEffect(async () => {
    // if ((!enrolledAt) || (!enrolledAt[name])) {
    // }
  });
  if (!variantSet || !variantSet[name] || variantSet[name] !== value) {
    return <div></div>;
  }
  return <div>{children}</div>;
};
