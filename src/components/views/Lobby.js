import { h } from 'preact';
import { useState, useMemo, useEffect, useCallback } from 'preact/hooks';
import Helmet from 'preact-helmet';
import { SuspenseBar } from '../site/Elements.js';
import { useStores } from 'pullstate';
import { fetchStore, updateAssets, updateProfile } from '../scripts/api.js';
import ProfileViewThumbnail from './Profile/ProfileViewThumbnail.js';
import ProfileStatus from './Profile/ProfileStatus.js';
import { Link } from '../site/Elements.js';
import { KinkList } from './Matches.js';


const Lobby = () => {
    const [ loading, setLoading ] = useState(true);
    const [ listData, setListData ] = useState([]);
    const { profileStore, assetStore } = useStores();
    const profiles = profileStore.useState(s => s.profiles) || {};
    const profileList = profileStore.useState(s => Object.keys(s.profiles)) || [];
    const loadProfiles = useCallback(async () => {
        setLoading(true);
        const data = await fetchStore('/api/lobby', null, [[ profileStore, updateProfile() ], [ assetStore, updateAssets ]]);
        setListData(data.lobby);
        setLoading(false);
    }, [ profileList ]);
    return (
        <div>
            <Helmet title={ `ERP Lobby - vrerp.net` } />
            <SuspenseBar height='30vh' 
                finished={ !loading }
                load={ loadProfiles }
            >
                <br />
                Lewdies who are available right now: <br />
                <br />
                {
                    (listData && listData.length > 0) && listData.map((id) => (
                        <ProfileViewThumbnail key={ id } id={ id }>
                            <span className='float-right' id={ `profile-status-display-${ id }` } key={ `profile-status-display-${ id }` }><ProfileStatus status={ profiles[id].status } /></span>
                            <Link href={ `/${ profiles[id].url }` } >{ profiles[id].username }</Link>
                            <KinkList profile={ profiles[id] } />
                        </ProfileViewThumbnail>
                    ))
                }
                <br /><br />
            </SuspenseBar>
        </div>
    );
};


export default Lobby;
