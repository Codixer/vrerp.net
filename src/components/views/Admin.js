import { h } from 'preact';
import { useState, useMemo, useEffect, useCallback } from 'preact/hooks';
import Helmet from 'preact-helmet';
import { useStores } from 'pullstate';

import { Link, InputBox, Button, SuspenseBar, DynamicLink, Image } from '../site/Elements.js';
import { fetchData, fetchPost, fetchProfile, fetchStore, updateAssets, updateFiles, updateProfile } from '../scripts/api.js';
import { addParameters, formatDate, get } from '../scripts/utils.js';
import ProfileViewThumbnail from './Profile/ProfileViewThumbnail.js';
import ProfileEditBio from './Profile/ProfileEditBio.js';
import ProfileEditTags from './Profile/ProfileEditTags.js';
import ProfileEditBasic from './Profile/ProfileEditBasic.js';
import { getImageURL } from '../../shared.js';
import { useLocation } from '../scripts/router.js';
import { AssetViewThumbnail } from './Assets/AssetViewThumbnail.js';
import AdminMediations from './Admin/AdminMediations.js';
import ProfileList from './Profile/ProfileList.js';
import { TagBubble } from './Profile/TagBubble.js';
import { DataList, ScrollList } from '../site/List.js';
import AdminMood from './Admin/AdminMood.js';
import { Select } from '@dracula/dracula-ui';
import { AdminImages } from './Admin/AdminImages.js';
import { AdminProfileSetStatus, AdminProfileThumbView, AdminUserSearch, AdminVerification } from './Admin/AdminTools.js';

const AdminMatchList = () => {
    const [ listData, setListData ] = useState([]);
    const { profileStore } = useStores();
    const profiles = profileStore.useState(s => s.profiles) || {};
    const files = profileStore.useState(s => s.files) || { };
    useEffect(async () => {
        await fetchData(profileStore, `/api/admin/matches`, null, (s, data) => {
            setListData(data.matches);
            s.profiles = { ...s.profiles, ...data.profiles };
            s.files = { ...s.files, ...data.files };
            s.fantasies = { ...s.fantasies, ...data.fantasies };
        });
    }, []);
    return <div>
        {
            listData.map(({ source, target, matchDate }, index) => {
                const avatar = files[profiles[target].avatar];
                if (!profiles[source] || !profiles[target]) {
                    return <div></div>;
                }
                return <ProfileViewThumbnail key={ `${ index }-${ source }` } id={ source } >
                    <b><Link href={ `/${profiles[source].url}` }>{ profiles[source].username }</Link></b>&nbsp;&nbsp;💕&nbsp;&nbsp;
                    <b><Link href={ `/${profiles[target].url}` }>{ profiles[target].username }</Link></b>&nbsp;&nbsp;{ formatDate(matchDate) }
                    <div className='float-right'>
                        <Link href={ `/${ profiles[target].url }`} className='profile-view-thumbnail-image'>
                            <Image file={ avatar } size='thumbnail' className='mainimage-thumbnail' alt={ profiles[target].username } />
                        </Link>
                    </div>
                    <div style={{ clear: 'both' }}></div>
                </ProfileViewThumbnail>
            })
        }
    </div>
}

const AdminTagsEdit = () => {
    const [ newKink, setNewKink ] = useState('');
    const [ newEventTag, setNewEventTag ] = useState('');
    const [ newAssetTag, setNewAssetTag ] = useState('');
    const { profileStore, calendarStore, assetStore } = useStores();
    const schema = profileStore.useState(s => s.schema) || { };
    const calendarTags = calendarStore.useState(s => s.calendarTags);
    const assetTags = assetStore.useState(s => s.tags);
    const addKink = useCallback(async() => {
        await fetchData(profileStore, `/api/admin/kinks`, { name: newKink });
    });
    const addEventTag = useCallback(async() => {
        await fetchData(calendarStore, '/api/admin/calendartags', { name: newEventTag });
    })
    const addAssetTag = useCallback(async() => {
        await fetchData(assetStore, '/api/admin/assettags', { name: newAssetTag });
    })

    return (
        <div>
            <SuspenseBar height='30vh' 
                finished={ Object.keys(schema).length > 0 }
                load={ async() => (Object.keys(schema).length === 0) && fetchData(profileStore, `/api/profiles/schema`) }
            >
                <b>Kinks:</b>
                <InputBox name='kink' value='' onBlur={ (evt) => setNewKink(evt.target.value) } >New kink: </InputBox><Button onClick={ addKink }>Add kink</Button>
                {
                    get(schema, 'kinks.values') && schema.kinks.values.map((k, index) => (
                        <div key={ index }>{ k }</div>
                    ))
                }
            </SuspenseBar>
            <br />
            <SuspenseBar height='30vh'
                finished={ calendarTags && calendarTags.length > 0 }
                load={ async() => (!calendarTags || calendarTags.length === 0) && fetchData(calendarStore, `/api/calendar/schema`) }
            >
                <b>Event tags:</b>
                <InputBox name='eventtag' value='' onBlur={ (evt) => setNewEventTag(evt.target.value) } >New event tag: </InputBox><Button onClick={ addEventTag }>Add event tag</Button>
                {
                    calendarTags.map((k, index) => (
                        <div key={ index }>{ k }</div>
                    ))
                }
            </SuspenseBar>
            <br />
            <SuspenseBar height='30vh'
                finished={ assetTags && assetTags.length > 0 }
                load={ async() => (!assetTags || assetTags.length === 0) && fetchData(assetStore, `/api/assets/schema`) }
            >
                <b>Asset tags:</b>
                <InputBox name='assettag' value='' onBlur={ (evt) => setNewAssetTag(evt.target.value) } >New asset tag: </InputBox><Button onClick={ addAssetTag }>Add asset tag</Button>
                {
                    assetTags.map((k, index) => (
                        <div key={ index }>{ k }</div>
                    ))
                }
            </SuspenseBar>
        </div>
    );
};

const AdminGuides = () => {
    const [ loading, setLoading ] = useState(0);
    const updateGuides = useCallback(async() => {
        setLoading(1);
        await fetchPost(`/api/admin/refresh-guides`, {  });
        setLoading(2);
    }, []);

    return <div>
        <Button onClick={ () => updateGuides() }>
            { (loading === 0) && <span>Update guides</span> }
            { (loading === 1) && <span>Updating guides...</span> }
            { (loading === 2) && <span>✔ Finished updating</span> }
        </Button><br /><br />
        <a href="https://www.google.com/ping?sitemap=https://vrerp.net/sitemap.xml" target='_blank' rel='noreferrer'>Submit sitemap to google</a>
    </div>
};

const AdminAssets = () => {
    const { profileStore, assetStore } = useStores();
    const [ newAsset, setNewAsset ] = useState('');
    const [ loading, setLoading ] = useState(0);
    const addAsset = useCallback(async() => {
        setLoading(1);
        await fetchPost(`/api/admin/assets`, { url: newAsset });
        // loadAssets();
        setLoading(2);
    }, [ newAsset ]);
    return <div>
        <InputBox name="title" onBlur={ (evt) => setNewAsset(evt.target.value) } className='w240' placeholder='https://'>Add new asset: </InputBox>
        <Button onClick={ () => addAsset() }>Add</Button>
        <DataList loader={ (lastId) => fetchStore(addParameters('/api/admin/assets?limit=32', { lastId }), null, [[ profileStore, updateFiles ], [ assetStore, updateAssets ]]) }>
            { ({ id }) => <AssetViewThumbnail key={ id } id={ id } /> }
        </DataList>
    </div>
}

const AdminBreak = () => {
    const { profileStore } = useStores();
    console.log(profileStore.asd.dsa);
    return <div>test break</div>
}

const Admin = ({ section, id }) => (
    <div>
        <Helmet title={ `admin - vrerp.net` } />
        <Link href="/admin">admin</Link><br />
        {
            section === undefined && <div>
                <AdminUserSearch /><br />
                <li><Link href="/moderator/profiles">list profiles scroller</Link></li>
                <li><Link href="/admin/tags">edit kinks &amp; tags</Link></li>
                <li><Link href="/moderator/verification">id verification</Link></li>
                <li><Link href="/moderator/verification-audit-log">verification audit log</Link></li>
                <li><Link href="/admin/matches">matches</Link></li>
                <li><Link href="/admin/guides">guides</Link></li>
                <li><Link href="/admin/assets">assets</Link></li>
                <li><Link href="/moderator/images">images</Link></li>
                <li><Link href="/moderator/mediations">mediations</Link></li>
                <li><Link href="/moderator/mood">mood tracker</Link></li>
                <br /><br />
                <li><Link href="/admin/break">break</Link></li>
            </div>
        }
        { (section === 'tags' && (!id)) && <AdminTagsEdit /> }
        { (section === 'matches') && <AdminMatchList /> }
        { (section === 'guides') && <AdminGuides /> }
        { (section === 'assets') && <AdminAssets /> }
        { (section === 'break') && <AdminBreak /> }
    </div>
);

export default Admin;
