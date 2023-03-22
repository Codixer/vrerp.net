import { h } from 'preact';
import Helmet from 'preact-helmet';
import Masonry from 'react-masonry-css'
import { useState, useMemo, useEffect, useCallback, useRef } from 'preact/hooks';
import { useStores } from 'pullstate';
import { fetchPost, fetchStore, updateAssets, updateFiles } from '../scripts/api.js';
import { Loading, SuspenseBar } from '../site/Elements.js';

import { ErrorBoundary, lazy } from 'preact-iso';

const AssetMasonryItem = lazy(() => import('./Assets/AssetMasonryItem.js'));

const breakpointColumnsObj = {
    default: 3,
    800: 2,
    500: 1
};

const toTtitleCase = (str) => str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();

const Assets = ({ url, params }) => {
    const [ loadingFullPage, setLoadingFullPage ] = useState(false);
    const [ loadingScroll, setLoadingScroll ] = useState(false);
    const { profileStore, assetStore } = useStores();
    const loadedQuery = assetStore.useState(s => s.loadedQuery);
    const [ hasMore, setHasMore ] = useState(true);
    const assetList = assetStore.useState(s => s.assetList);
    const assets = assetStore.useState(s => s.assets);
    const files = profileStore.useState(s => s.files);
    const pageBottom = useRef(null);
    const title = useMemo(() => loadedQuery ? loadedQuery.split('-').join(' ') : 'erp assets', [loadedQuery]);
    const fetchPage = useCallback(async(newQuery, lastId) => {
        let apiurl = `/api/assets?query=${ newQuery }`;
        if (lastId) {
            apiurl += `&lastId=${ lastId }`;
        }
        const data = await fetchStore(apiurl, null,  [[ profileStore, updateFiles ], [ assetStore, updateAssets ]]);
        if (data.list.length < 20) {
            setHasMore(false);
        }
    }, [ ]);
    // url updates
    useEffect(async () => {
        const newQuery = url.split('/')[1];
        if (newQuery === loadedQuery) {
            return false;
        }
        assetStore.update((s) => { s.assetList = [] });
        setLoadingFullPage(true);
        setHasMore(true);
        await fetchPage(newQuery, null);
        setLoadingFullPage(false);
        assetStore.update(s => { s.loadedQuery = newQuery; });
    }, [ url, loadedQuery ]);
    // scrolling
    const infiniteScroll = useCallback(async (event) => {
        if ((pageBottom.current.getBoundingClientRect().top <= window.innerHeight) && (!loadingScroll) && (!loadingFullPage) && (hasMore) && (assetList.length > 0)) {
            setLoadingScroll(true);
            await fetchPage(loadedQuery, assetList[assetList.length - 1]);
            setLoadingScroll(false);
        }
    }, [ loadingScroll, loadingFullPage, hasMore, assetList, fetchPage ]);

    useEffect(() => {
        window.addEventListener('scroll', infiniteScroll);
        return () => window.removeEventListener('scroll', infiniteScroll);
    }, [ infiniteScroll ]);

    return (<div>
        <Helmet 
            title={ `${ title } - vrerp.net` } 
            meta={[
                { name: 'description', content: 'ERP assets for vrchat, and chilloutvr' },
                { property: 'og:title', content: `${ title } - vrerp.net` },
                { property: 'og:description', content: 'ERP assets for vrchat, and chilloutvr' }
            ]}
        />

        <SuspenseBar height='30vh' finished={ !loadingFullPage }>
            <center><h1>{ title }</h1></center><br />
            <Masonry breakpointCols={breakpointColumnsObj} className="masonry-grid" columnClassName='masonry-grid_column'>
                {
                    assetList && assetList.map((item, index) => (
                        <AssetMasonryItem id={ item } key={ item } />
                    ))
                }
            </Masonry>
            <div ref={ pageBottom }>
                { loadingScroll && <center><Loading /></center> }
            </div>
        </SuspenseBar>
    </div>
    );
}

export default Assets;
