
import { h } from 'preact';
import { Link, Image } from '../../site/Elements.js';
import { useState, useMemo, useEffect } from 'preact/hooks';
import { useStores } from 'pullstate';

import style from './ProfileViewThumbnail.css';

const ProfileViewThumbnail = ({ id, children }) => {
    const { profileStore, siteStore } = useStores();
    const profile = profileStore.useState(s => s.profiles[id], [id]) || { };
    const files = profileStore.useState(s => s.files) || { };
    const avatar = files[profile.avatar];
    if (profile.profileVisibility === 'disabled') {
        return <div></div>;
    }
    return <div className='profile-view-thumbnail' id={ id }>
        <Link href={ `/${ profile.url }`} className='profile-view-thumbnail-image'>
            <Image file={ avatar } size='thumbnail' className='mainimage-thumbnail' alt={ profile.username } />
        </Link>
        <div className='profile-view-thumbnail-info'>
            { children }
        </div>
    </div>;
};

export default ProfileViewThumbnail;
