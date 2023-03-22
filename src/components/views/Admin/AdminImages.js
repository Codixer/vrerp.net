import { h } from 'preact';
import { useState, useMemo, useEffect, useCallback } from 'preact/hooks';
import { fetchStore, updateAssets, updateFiles, updateProfile } from '../../scripts/api.js';
import { Image } from '../../site/Elements.js';
import { useStores } from 'pullstate';
import { DataList, ScrollList } from '../../site/List.js';
import Masonry from 'react-masonry-css'
import { getImageURL } from '../../../shared.js';

const breakpointColumnsObj = {
    default: 3,
    // 800: 2,
    // 500: 1
};

export const AdminImages = () => {
    const { profileStore } = useStores();
    const files = profileStore.useState(s => s.files);
    const [ listData, setListData ] = useState([]);
    const [ hasMore, setHasMore ] = useState(true);
    const fetchPage = useCallback(async(lastId) => {
        let api = '/api/moderator/images';
        if (lastId) {
            api += ((api.indexOf('?') === -1) ? '?' : '&') + `lastId=${ lastId }`;
        }
        const data = await fetchStore(api, null,  [[ profileStore, updateProfile() ]]);
        console.log(data);
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
    }, [listData, setListData, setHasMore ]);

    useEffect(async () => { await fetchPage(); }, [ ]);

    return <div>        
        <ScrollList fetchPage={ fetchPage } listData={ listData} hasMore={ hasMore } masonry={ true }>
            {({ id }) => (
                <div key={ id } className='masonry-item' id={ id }>
                    <a href={ getImageURL(files[id], 'original') }>
                        <Image file={ files[id] } size='thumbnail' className='masonry-image' />
                        {
                            files[id].username && <center><a href={ `/${ files[id].url }` }>{ files[id].username }</a><br /></center>
                        }
                    </a>
                </div>
            )}
        </ScrollList>
        <br />
    </div>;
}
