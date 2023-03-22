import { h } from 'preact';
import { useState, useMemo, useEffect, useCallback } from 'preact/hooks';
import { fetchData, fetchStore, updateAssets, updateProfile } from '../scripts/api.js';
import { useStores } from 'pullstate';
import ProfileView from './Profile/ProfileView.js';
import MatchBox from './Matchmaker/MatchBox.js';
import { Heading, Text } from '@dracula/dracula-ui';
import { NextAction } from './Flow/NextAction.js';
import { useLocation } from '../scripts/router.js';
import { Link } from '../site/Elements.js';
import { clientSide } from '../scripts/utils.js';


const Browse = ({ username }) => {
    const { route } = useLocation();
    const { profileStore, assetStore } = useStores();
    const browseHistory = profileStore.useState(s => s.browseHistory);
    const [ moreMatch, setMoreMatch ] = useState(true);
    const navigatePrev = useCallback(() => {
        const prevUsername = browseHistory[browseHistory.length - 1];
        profileStore.update(s => { s.browseHistory.pop() });
        route(`/browse/${ prevUsername }`);
    }, [ browseHistory, profileStore ]);
    const navigateNext = useCallback(async(prevUsernameUrl) => {
        if (prevUsernameUrl) {
            profileStore.update(s => { s.browseHistory.push(prevUsernameUrl); });
        }
        const res = await fetchStore(`/api/match/next`, null, [[ profileStore, updateProfile() ], [ assetStore, updateAssets ]]);
        if (Object.keys(res).length === 0) {
            route(`/browse`);
            setMoreMatch(false);
            return;
        }
        setMoreMatch(true);
        const profile = Object.values(res.profiles)[0];
        route(`/browse/${ profile.url }`);
    }, [ username, profileStore, browseHistory ]);
    useEffect(() => {
        if (clientSide && (!username) && (window.location.pathname.startsWith('/browse'))) {
            profileStore.update(s => { s.browseHistory = []; });
            navigateNext();
        }
    }, [ username ]);
    return (<div>
        {
            moreMatch && username && <BrowseByURL usernameUrl={ username } onNext={ navigateNext } onPrev={ browseHistory.length === 0 ? null : navigatePrev } />
        }
        {
            !moreMatch && <div className='drac-m-sm'>
                <br /><br />
                <Heading>No more matches for today</Heading>
                <Text>Check out the <Link href='/lobby'>lobby</Link>, flirt on&nbsp;
                    <a href="https://discord.gg/HDZQP6Wb6f" target="_blank" rel="noreferrer">Discord</a>
                , or check back tomorrow! 😊</Text>
                <br /><br />
                <NextAction />
            </div>
        }
    </div>)
}

const BrowseByURL = ({ usernameUrl, onNext, onPrev }) => {
    const { siteStore } = useStores();
    const knownPages = siteStore.useState(s => Object.keys(s.pages));
    const allpages = siteStore.useState(s => s.pages);
    const page = allpages[usernameUrl];
    const profileId = (page && page.id) ? page.id : null;
    useEffect(async () => {
        if (!knownPages.includes(usernameUrl)) {
            await fetchData(siteStore, `/api/pages/${ usernameUrl }`, null, (s, data) => s.pages[usernameUrl] = data.page);
        }
    }, [ usernameUrl, page ]);
    return (<div>
        {
            profileId && <div>
                <MatchBox id={ profileId } onNext={ onNext } onPrev={ onPrev } usernameUrl={ usernameUrl } />
                <ProfileView id={ profileId } showMatchbox={ false } />
            </div>
        }
    </div>        
    )
};

export default Browse;
