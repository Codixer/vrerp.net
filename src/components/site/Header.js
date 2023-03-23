import { h } from "preact";
import { Link } from "../site/Elements.js";
import { Paragraph, Heading, Avatar } from "@dracula/dracula-ui";
import style from "./Header.css";

const Header = () => {
  return (
    <div>
      <Heading>
        <Link href={"/"} className="title">
          💕 VR ERP
        </Link>
      </Heading>
    </div>
  );
};

export default Header;
