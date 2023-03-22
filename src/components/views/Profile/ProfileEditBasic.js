
import { h } from 'preact';
import { useState, useMemo, useEffect } from 'preact/hooks';
import { useStores } from 'pullstate';

import { InputBox, SuspenseBar } from '../../site/Elements.js';
import { fetchData, fetchProfile } from '../../scripts/api.js';
import ProfileAvatar from './ProfileAvatar.js';
import { Heading, Text } from '@dracula/dracula-ui';
import { getDiscordRedirectUrl } from '../../scripts/utils.js';

const ProfileEditBasic = ({ id, url }) => {
    const [ loading, setLoading ] = useState(false);
    const { profileStore, siteStore } = useStores();
    const profile = profileStore.useState(s => s.profiles[id], [id]) || { };
    const user = siteStore.useState(s => s.user);
    const [ errors, setErrors ] = useState({ });
    const handleChange = (key) => (evt) => {
        setErrors({ ...errors, [key]: null });
        fetchProfile(id, profileStore, { [key]: evt.target.value }, (data) => setErrors({ ...errors, [key]: data.error }));
    };
    return (
        <SuspenseBar height='30vh' 
            finished={ Object.keys(profile).length > 0 }
            load={ async() => fetchProfile(id, profileStore) }
        >
            <Heading m="sm">Basic info</Heading>
            <br /><b>Profile pic:</b><br />
            <ProfileAvatar id={ id } edit={ true } />
            <br />
            <li>Your profile pic will be the first thing peeps see -try to make it a good one!</li> 
            <li>Use your main ERP avatar, see <a href='/kitten' target='_blank'>Kitten&apos;s bio for example here</a> 😸</li>
            <li>Pics: use lewds, not nudes! Lewds (pics without explicit bits) are much more enticing, and makes other peeps want to know more 😊</li><br />
            <br />
            <b>Info:</b>
            { user.discordId && <div className="drac-p-sm"><div>Discord: { profile.discord } </div></div> }
            { !user.discordId && <div>
                <InputBox name="discord" onBlur={ handleChange('discord') } value={ profile.discord } error={ errors.discord } className='w240' placeholder='me#1234'>Discord: </InputBox>
                <a href={ getDiscordRedirectUrl('link', url ) }>Link your discord account</a> to get your roles, and verification on the discord server.
            </div>}
            <InputBox name="username" onBlur={ handleChange('username') } value={ profile.username } error={ errors.username } className='w240'>Username (vrerp.net/username): </InputBox>
            <InputBox name="vrchat" onBlur={ handleChange('vrchat') } value={ profile.vrchat } error={ errors.vrchat } className='w240'>vrchat: </InputBox>
            <InputBox name="chilloutvr" onBlur={ handleChange('chilloutvr') } value={ profile.chilloutvr } error={ errors.chilloutvr } className='w240'>chilloutvr (optional): </InputBox>
            <InputBox name="link" onBlur={ handleChange('link') } value={ profile.link } error={ errors.link } className='w240' placeholder='https://...'>Website (linktree, etc):</InputBox>
            <br />
        </SuspenseBar>
    )
};

export default ProfileEditBasic;
