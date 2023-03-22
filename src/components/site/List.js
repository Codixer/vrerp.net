import { h } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { useStores } from 'pullstate';
import { fetchData } from '../scripts/api.js';
import Masonry from 'react-masonry-css'

import { Loading, SuspenseBar } from './Elements.js';

const breakpointColumnsObj = {
    default: 3,
    800: 2,
    500: 1
};

export const ScrollList = ({ fetchPage, hasMore, listData, children, loading, masonry=false }) => {
    const pageBottom = useRef(null);
    const [ loadingScroll, setLoadingScroll ] = useState(false);
    const [ loadingScrollItem, setLoadingScrollItem ] = useState(0);
    const [ firstLoading, setFirstLoading ] = useState(false);

    const ElementRender = children;

    const infiniteScroll = useCallback(async (event) => {
        if ((pageBottom.current.getBoundingClientRect().top <= window.innerHeight) && (!loadingScroll) && (hasMore) && (listData.length > 0)) {
            setLoadingScroll(true);
            setLoadingScrollItem(listData[listData.length - 1]);
            await fetchPage(listData[listData.length - 1]);
            setLoadingScroll(false);
        }
    }, [ loadingScroll, hasMore, listData, fetchPage ]);
    useEffect(() => {
        window.addEventListener('scroll', infiniteScroll);
        return () => window.removeEventListener('scroll', infiniteScroll);
    }, [ infiniteScroll ]);
    useEffect(async () => {
        if (loading) {
            return false;
        }
        if (listData.length === 0) {
            setLoadingScroll(true);
            await fetchPage();
            setLoadingScroll(false);
        }
    }, [ ]);
    // reset scroll position after loading
    useEffect(() => {
        if ((loadingScrollItem > 0) && (!loadingScroll)) {
            const element = document.getElementById(loadingScrollItem);
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [ loadingScrollItem, loadingScroll ]);
    if (loading) {
        return <SuspenseBar height='30vh' finished={ false }></SuspenseBar>;
    }
    if (masonry) {
        return (<SuspenseBar height='30vh' finished={ !firstLoading }>
            <Masonry breakpointCols={breakpointColumnsObj} className="masonry-grid" columnClassName='masonry-grid_column'>
                {
                    (listData && listData.length > 0) && listData.map((id) => (
                        <ElementRender key={ id } id={ id } data={ id } />
                    ))
                }
            </Masonry>
            <div ref={ pageBottom }>
                { loadingScroll && <Loading /> }
            </div>
        </SuspenseBar>);
    }
    return (<SuspenseBar height='30vh' finished={ !firstLoading }>
        {
            (listData && listData.length > 0) && listData.map((id) => (
                <ElementRender key={ id } id={ id } data={ id } />
            ))
        }
        <div ref={ pageBottom }>
            { loadingScroll && <Loading /> }
        </div>
    </SuspenseBar>);
};

export const DataList = ({ loader, children, defaultList }) => {
    const [ listData, setListData ] = useState(defaultList || []);
    const [ hasMore, setHasMore ] = useState(true);
    const ElementRender = children;

    const fetchPage = useCallback(async(lastId) => {
        const data = await loader(lastId);
        if (data.list) {
            let resListData = [];
            if (lastId) {
                resListData = listData.concat(data.list);
            } else {
                resListData = data.list;
            }
            resListData = resListData.filter((x, i) => i === resListData.indexOf(x));
            setListData(resListData);
        }
        if (data.list.length < 10) {
            setHasMore(false);
        }
    }, [listData, setListData, setHasMore, loader ]);

    // useEffect(() => { if (!defaultList) fetchPage() }, [ loader, defaultList ]);
    return <ScrollList fetchPage={ fetchPage } listData={ listData} hasMore={ hasMore } >
        {({ id, data }) => <ElementRender key={ id } id={ id } data={ data } /> }
    </ScrollList> 
};
