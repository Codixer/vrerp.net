import { h } from "preact";
import { Link } from "../../site/Elements.js";
import { useStores } from "pullstate";
import { useCallback, useState } from "preact/hooks";
import { Paragraph, Heading, Avatar } from "@dracula/dracula-ui";

import style from "./MobileHeader.css";
import { MainMenu } from "./SideMenu.js";

const MobileHeader = ({ Menu = MainMenu }) => {
  const { siteStore } = useStores();
  const [menuShown, setMenuShown] = useState(false);
  return (
    <div className="mobile-header">
      <Heading>
        <div
          className="mobile-header-hamburger"
          onClick={() => setMenuShown(!menuShown)}
        >
          ☰
        </div>
        <Link href={"/"} className="title">
          💕 VR ERP
        </Link>
      </Heading>
      {menuShown && <Menu />}
    </div>
  );
};

export default MobileHeader;
