import { h } from "preact";
import Helmet from "preact-helmet";

import {
  Paragraph,
  Heading,
  Avatar,
  Text,
  List,
  Button,
} from "@dracula/dracula-ui";
import { CalendarView } from "./Calendar/CalendarView.js";
import { CalendarEventEdit } from "./Calendar/CalendarEventEdit.js";

const CalendarEvents = () => (
  <div>
    <CalendarView />
    <CalendarEventEdit />
  </div>
);

export default CalendarEvents;
