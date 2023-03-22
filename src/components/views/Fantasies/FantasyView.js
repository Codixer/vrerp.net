import { h } from 'preact';
import { Link } from '../../site/Elements.js';
import { useStores } from 'pullstate';
import Helmet from 'preact-helmet';

import { Button, Image, SuspenseBar } from '../../site/Elements.js';
import { deleteDataAndUpdateStore, fetchData, updateFantasyData, updateProfile } from '../../scripts/api.js';

import style from './FantasyView.css';
import { useMemo } from 'preact/hooks';
import { getDescription, hasRole } from '../../scripts/utils.js';
import { getImageURL } from '../../../shared.js';

export const FantasyView = ({ id }) => {
    const { siteStore, profileStore } = useStores();
    const user = siteStore.useState(s => s.user);
    const onboarded = hasRole(user, 'onboarded');
    const profileId = siteStore.useState(s => s.user.profileId);
    const profile = profileStore.useState(s => s.profiles[profileId], [profileId]) || {};
    const fantasy = profileStore.useState(s => s.fantasies[id], [id]) || {};
    const hasLoved = profile.fantasies && profile.fantasies.love && profile.fantasies.love.includes(id);
    const hasTrial = profile.fantasies && profile.fantasies.love && profile.fantasies.trial.includes(id);
    const files = profileStore.useState(s => s.files);
    const image = useMemo(() => files[fantasy.image], [fantasy]);
    const fantasyProfileSet = (type) => fetchData(profileStore, `/api/fantasy-profile/${ id }/${ type }`, {}, updateProfile(profileId));
    const fantasyProfileUnset = (type) => deleteDataAndUpdateStore(profileStore, `/api/fantasy-profile/${ id }/${ type }`, updateProfile(profileId));
    return (<div className='static-page static-page-linebreaks'>
        {
            <div className="float-right">
                <Link href={ `/fantasies/${ id }` } className='fantasy-link'>🔗 link</Link><br />
                {
                    (onboarded && !hasLoved) && <div><Button onClick={ () => fantasyProfileSet('love') } className='medium-size drac-btn drac-bg-purple drac-btn-outline drac-text-purple drac-p-sm'>💕 love</Button><br /></div>
                }
                {
                    (onboarded && hasLoved) && <div><Button onClick={ () => fantasyProfileUnset('love') } className='medium-size drac-btn drac-bg-purple drac-btn-outline drac-text-purple drac-p-sm'>unlove</Button><br /></div>
                }
                {
                    (onboarded && !hasTrial) && <div><Button onClick={ () => fantasyProfileSet('trial') } className='medium-size drac-btn drac-bg-purple drac-btn-outline drac-text-purple drac-p-sm'>💙 wanna try</Button><br /></div>
                }
                {
                    (onboarded && hasTrial) && <div><Button onClick={ () => fantasyProfileUnset('trial') } className='medium-size drac-btn drac-bg-purple drac-btn-outline drac-text-purple drac-p-sm'>remove try</Button><br /></div>
                }
            </div>
        }
        {
            image && <Image file={ image } size='thumbnail' className='fantasy-image' />
        }
        <br />
        {
            fantasy.text
        }
        <br />
        {
            fantasy.link && <a href={ fantasy.link } target='_blank' rel='noreferrer'>source</a>
        }
        <br />
    </div>
    );
};

export const FantasyMeta = ({ id }) => {
    const { profileStore } = useStores();
    const fantasy = profileStore.useState(s => s.fantasies[id], [id]);
    const fantasyLikes = profileStore.useState(s => s.fantasyLikes[id], [id]);
    return (
        <SuspenseBar height='30vh' 
            finished={ Array.isArray(fantasyLikes) }
            load={ async() => fetchData(profileStore, `/api/fantasies/${ id }`, null, updateFantasyData(id)) }
        >
            {
                fantasy.author && <div>Posted by: <Link href={ `/${ fantasy.author }` }>{ fantasy.author }</Link><br /><br /></div>
            }
            {
                (fantasyLikes && fantasyLikes.length > 0) && <div>
                💕 liked by: {
                        fantasyLikes && fantasyLikes.map((url, index) => (
                            <span key={ index }><Link href={ `/${ url }` }>{ url }</Link>&nbsp;&nbsp;<wbr /></span>
                        ))
                    }
                </div>
            }
        </SuspenseBar>
    )
}

export const FantasyViewPage = ({ id }) => {
    const { siteStore, profileStore } = useStores();
    const profileId = siteStore.useState(s => s.user.profileId);
    const fantasy = profileStore.useState(s => s.fantasies[id], [id]) || { };
    const files = profileStore.useState(s => s.files) || { };
    const image = useMemo(() => files[fantasy.image], [fantasy]);
    return (
        <div>
            <Helmet 
                title={ `fantasies on vrerp.net` }
                meta={ [
                    { name: 'description', content: getDescription(fantasy.text) },
                    { property: 'og:type', content: 'article' },
                    { property: 'og:title', content: 'fantasies on vrerp.net' },
                    { property: 'og:description', content: getDescription(fantasy.text) },
                    { property: 'og:image', content: getImageURL(image, 'thumbnail') },
                    { name: 'twitter:card', content: 'summary_large_image' }
                ] }
            />

            <Helmet title='fantasies on vrerp.net' />
            {
                profileId && <div><Link href='/fantasies'>&laquo; fantasies</Link><br /><br /></div>
            }
            <SuspenseBar height='30vh' 
                finished={ Object.keys(fantasy).length > 0 }
                load={ async() => fetchData(profileStore, `/api/fantasies/${ id }`, null, updateFantasyData(id)) }
            >
                <FantasyView id={ id } />
                <FantasyMeta id={ id } />
                <br /><br />
            </SuspenseBar>
        </div>
    );
}

