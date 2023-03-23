import { h } from "preact";
import { Select, Switch } from "@dracula/dracula-ui";
import { useState } from "preact/hooks";
import { Link } from "../site/Elements.js";
import DateListing from "./Dates/DateListing.js";

const Dates = ({ url }) => {
  return (
    <div>
      <h1>💝 Dates</h1>
      <Link href="/dates-setup">Set up best times for dates...</Link>
      <DateListing />
    </div>
  );
};

export default Dates;
