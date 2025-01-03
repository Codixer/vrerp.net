import { Select } from "@dracula/dracula-ui";
import { h } from "preact";
import { useLocation } from "preact-iso";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { useStores } from "pullstate";
import { clientSide } from "../scripts/utils.js";
import MultipleComboBox from "../site/MultipleComboBox.js";
import ProfileList from "./Profile/ProfileList.js";

const Search = () => {
  // const { route, url, query, path } = useLocation();
  const { profileStore } = useStores();
  const search = clientSide ? document.location.search : null;
  const schema = profileStore.useState((s) => s.schema);
  // const [ query, setQuery ] = useState('');
  const [sort, setSort] = useState("availability");
  // console.log('url', url);
  // console.log('query', query);

  // useEffect(() => {
  //     if (search) {
  //         const params = new URLSearchParams(search);
  //         const q = params.get('q');
  //         if (q) {
  //             setQuery(q);
  //         }
  //     }
  // }, [search, setQuery]);
  // const updatedItems = useCallback((items) => {
  //     const searchLink = items.length ? `?q=${ items.map(s => encodeURIComponent(s.split(' ').join('-'))).join('+') }` : '';
  //     if (clientSide) {
  //         route('/search' + searchLink);
  //     }
  // }, [ route ]);
  const schemaTags = useMemo(
    () =>
      Object.values(schema).reduce(
        (arr, val) =>
          arr
            .concat(
              val.values.map((val) =>
                typeof val === "string" ? val : val.display
              )
            ),
        []
      ),
    [schema]
  );
  return (
    <div>
      <div className="float-right">
        Sort by:
        <br />
        <Select onChange={(evt) => setSort(evt.target.value)}>
          <option value="availability">availability</option>
          <option value="lastActivity">last activity</option>
        </Select>
      </div>
      <MultipleComboBox items={schemaTags}>
        {({ selectedItems }) => {
          return (
            <div>
              Results: {selectedItems.join(" ")}
              <ProfileList
                apiurl={
                  `/api/search?q=${selectedItems
                    .map((s) =>
                      encodeURIComponent(
                        s.replace(/-/g, "_").split(" ").join("-")
                      )
                    )
                    .join("+")}` + (sort ? `&sort=${sort}` : "")
                }
              />
            </div>
          );
        }}
      </MultipleComboBox>
    </div>
  );
};

export default Search;
