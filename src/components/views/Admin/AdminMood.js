import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Link } from "../../site/Elements.js";
import { ScrollList } from "../../site/List.js";

const AdminMood = () => {
  const [moods, setMoods] = useState([]);
  const [users, setUsers] = useState({});

  const reloadList = async () => {
    const response = await fetch("/api/moderator/mood");
    const data = await response.json();
    setMoods(data.data.moods);
    setUsers(data.data.users);
  };
  useEffect(() => reloadList(), []);
  // console.log(users);
  // console.log(moods);
  return (
    <div>
      <h1>Mood</h1>
      <table>
        {Object.keys(moods).map((id) => {
          console.log(moods[id][0].userId);
          let user = users[moods[id][0].userId] || {
            username: `unknown ${moods[id][0].userId}`,
            url: "unknown",
          };
          const replies = moods[id].reduce((arr, val) => {
            arr[val.parameters.messageType] = val.parameters.response;
            return arr;
          }, {});
          console.log(replies);
          return (
            <tr key={id}>
              <td>{moods[id][0].createdAt.substr(0, 10)}</td>
              <td>
                <Link href={`/${user.url}`}>{user.username}</Link>
              </td>
              <td>
                {replies["checkin-erp-anyone"] === "0" && "none"}
                {replies["checkin-erp-anyone"] === "1" && "1-2"}
                {replies["checkin-erp-anyone"] === "3" && "3-10"}
                {replies["checkin-erp-anyone"] === "10" && "10+"}
              </td>
              <td className="fs4">
                {replies["checkin-community"] === "-2" && "👎"}
                {replies["checkin-community"] === "-1" && "😞"}
                {replies["checkin-community"] === "1" && "😊"}
                {replies["checkin-community"] === "2" && "🥰"}
              </td>
              <td>
                {replies["checkin-erp-amount"] === "-1" && "too little"}
                {replies["checkin-erp-amount"] === "0" && "just right"}
                {replies["checkin-erp-amount"] === "1" && "too much"}
              </td>
            </tr>
          );
        })}
      </table>
    </div>
  );
};

export default AdminMood;
