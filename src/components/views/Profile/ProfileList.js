// expanding profile listing
import { h } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { useStores } from 'pullstate';
import { fetchStore, updateAssets, updateFiles, updateProfile } from '../../scripts/api.js';
import { Link, Loading, SuspenseBar } from '../../site/Elements.js';
import { ScrollList } from '../../site/List.js';
import { KinkList } from '../Matches.js';
import ProfileStatus from './ProfileStatus.js';
import ProfileViewThumbnail from './ProfileViewThumbnail.js';

const ProfileList = ({ apiurl, children, defaultList }) => {
    const { profileStore, assetStore } = useStores();
    const [ listData, setListData ] = useState(defaultList || []);
    const [ hasMore, setHasMore ] = useState(true);
    
    const profiles = profileStore.useState(s => s.profiles) || {};
    const ElementRender = children;

    const fetchPage = useCallback(async(lastId) => {
        let api = apiurl;
        if (lastId) {
            api += ((api.indexOf('?') === -1) ? '?' : '&') + `lastId=${ lastId }`;
        }
        const data = await fetchStore(api, null,  [[ profileStore, updateProfile() ], [ assetStore, updateAssets ]]);
        if (data.list) {
            let resListData = [];
            if (lastId) {
                resListData = listData.concat(data.list);
            } else {
                resListData = data.list;
            }
            resListData = resListData.filter((x, i) => i === resListData.indexOf(x));
            setListData(resListData);
            if (data.list.length < 10) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }
            return resListData;
        }
        return [];
    }, [listData, setListData, setHasMore, apiurl ]);

    useEffect(async () => { setListData(await fetchPage()); }, [ apiurl ]);

    return <div>
        <ScrollList fetchPage={ fetchPage } listData={ listData} hasMore={ hasMore } >
            {({ id }) => (<ProfileViewThumbnail key={ id } id={ id }>
                {
                    !ElementRender && <span>
                        <span className='float-right' id={ `profile-status-display-${ id }` } key={ `profile-status-display-${ id }` }>
                            <ProfileStatus status={ profiles[id].status } />
                        </span>
                        <Link href={ `/${ profiles[id].url }` } >{ profiles[id].username }</Link>
                        <KinkList profile={ profiles[id] } />
                    </span>
                }
                {
                    ElementRender && <ElementRender profile={ profiles[id] } id={ id } />
                }
            </ProfileViewThumbnail>
            )}
        </ScrollList>
        <br />
    </div>
};

export default ProfileList;
