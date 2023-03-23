import { h } from "preact";
import { EmailFrame } from "./EmailElements.js";

export const EmailWelcome = ({ server, code }) => (
  <EmailFrame server={server}>
    Hi-hi! Welcome to vrerp.net!
    <br />
    We hope you&apos;ll find things here that will make your heart flutter 💕
    <br />
    <br />
    <a href={`${server}api/users/auth?code=${code}`}>Click here to log in</a>
    <br />
    <br />
    To get started: <br />
    <li>
      If you haven&apos;t already,{" "}
      <a href="https://vrerp.net/VRC-Kama-Sutra-or-kittens-guide-to-cuddles">
        read Kitten&apos;s guide to cuddles
      </a>{" "}
      for introduction to erp
    </li>
    <li>
      Finish your profile at{" "}
      <a href={`${server}api/users/auth?code=${code}`}>vrerp.net</a>
    </li>
    <li>
      <a href="https://discord.gg/HDZQP6Wb6f">Join us on discord!</a> For
      meeting other peeps, and more 😊
    </li>
    <br />
    💕 love,
    <br />
    Your lewd admins
    <br />
  </EmailFrame>
);
