import { h } from "preact";
import { Link } from "../site/Elements.js";

const Footer = () => (
  <div>
    <br />
    <center>
      vrerp.net&nbsp;&copy;&nbsp;2022-2023&nbsp; 
      <wbr />
      - 
      
      <Link href="/rules">Rules</Link>&nbsp;&nbsp;
      <Link href="/report">Report</Link>&nbsp;&nbsp;
      <Link href="/about">About</Link>
    </center>
    <br />
  </div>
);

export default Footer;
