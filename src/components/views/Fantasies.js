import { h } from 'preact';
import { useState, useMemo, useEffect, useCallback, useRef } from 'preact/hooks';
import { useStores } from 'pullstate';
import Helmet from 'preact-helmet';

import { Button, InputBox, Loading, SuspenseBar } from '../site/Elements.js';
import { fetchData, updateFantasyData } from '../scripts/api.js';
import { FantasyMeta, FantasyView } from './Fantasies/FantasyView.js';
import { useLocation } from '../scripts/router.js';

const Fantasies = ({ url, header }) => {
    const { route } = useLocation();
    const { profileStore } = useStores();
    const list = profileStore.useState(s => s.fantasyList) || [];
    const fantasies = profileStore.useState(s => s.fantasies) || {};
    const [ hasMore, setHasMore ] = useState(true);
    const missingFantasies = useMemo(() => list.filter((id) => !fantasies[id]), [ list, fantasies ]);
    const pageBottom = useRef(null);
    const [ loading, setLoading ] = useState(false);
    const infiniteScroll = useCallback((event) => {
        if ((pageBottom.current.getBoundingClientRect().top <= window.innerHeight) && (!loading) && (hasMore) && (list.length > 0)) {
            setLoading(true);
            fetchFantasyFeed();
        }
    }, [ loading, hasMore, list, fetchFantasyFeed ]);
    useEffect(() => {
        window.addEventListener('scroll', infiniteScroll);
        return () => window.removeEventListener('scroll', infiniteScroll);
    }, [ infiniteScroll ]);
    const fetchFantasyFeed = useCallback(async() => {
        setLoading(true);
        let param = '';
        if (list.length > 0) {
            param = `?lastId=${ list[list.length - 1] }`;
        }
        const data = await fetchData(profileStore, `/api/fantasies${ param }`, null, updateFantasyData());
        if (data.fantasyList.length === 0) {
            setHasMore(false);
        }
        setLoading(false);
    }, [ setLoading, setHasMore, list, loading ]);
    const createFantasy = async() => {
        setLoading(true);
        const res = await fetchData(profileStore, '/api/fantasies', {}, (s, data) => {
            s.fantasies[data.fantasy.id] = data.fantasy;
        });
        route(`/fantasies/${ res.fantasy.id }/edit`);
        setLoading(false);
    };

    return (
        <div>
            <Helmet title={ `fantasies - vrerp.net` } />
            <SuspenseBar height='30vh' 
                finished={ ((list.length > 0) && (missingFantasies.length === 0)) }
                load={ async() => fetchFantasyFeed(missingFantasies, profileStore) }
            >
                <h2>What makes your heart flutter? 💕</h2>
                share your sexual fantasies, and desires; situations and scenarios you find vibe 💕 makes you horny 😊 and find peeps who shares those desires<br />
                <br />
                <Button onClick={ createFantasy } disabled={ loading }>+ Post a vibe fantasy</Button><br /><br /><br />
                {
                    list.map((id) => (
                        <div key={ id }>
                            <FantasyView id={ id } preview={ true } />
                            <FantasyMeta id={ id } />
                            <br /><br />
                        </div>
                    ))
                }
                <div ref={ pageBottom }>
                    { loading && <Loading /> }
                    { !hasMore && <Button onClick={ createFantasy } disabled={ loading }>+ Post a vibe fantasy</Button> }
                </div>
            </SuspenseBar>
        </div>
    );
};

export default Fantasies;

