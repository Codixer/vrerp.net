
import { h } from 'preact';
import { Heading, Select, Switch, Text } from '@dracula/dracula-ui';
import { useState, useMemo, useEffect, useCallback } from 'preact/hooks';
import { useStores } from 'pullstate';
import { fetchProfile } from '../../scripts/api.js';
import { hasRole } from '../../scripts/utils.js';


const PrivacySettings = ({ id }) => {
    const { siteStore, profileStore } = useStores();
    const profile = profileStore.useState(s => s.profiles[id], [id]) || { };
    const user = siteStore.useState(s => s.user);
    const roles = siteStore.useState(s => s.user && s.user.roles ? s.user.roles : []);
    const handleChange = (key) => (evt) => {
        fetchProfile(id, profileStore, { [key]: evt.target.value });
    };
    useEffect(() => {
        if (profile.profileVisibility === 'draft') {
            fetchProfile(id, profileStore, { profileVisibility: 'members' });
        }
    });
    const handleSwitch = useCallback((key, value) => fetchProfile(id, profileStore, { [key]: value }), [ profileStore, id ]);
    return (
        <div>
            <Heading>Privacy settings</Heading>
            <br /><br />
            Profile visible to:
            <Select color="purple" onChange={ handleChange('profileVisibility') } defaultValue={ profile.profileVisibility }>
                {
                    hasRole(user, 'hidden') && <option value="hidden">hidden</option>
                }
                <option value="public">public</option>
                <option value="members">members only</option>
            </Select>
            <br />
            Public means visible without logging in (but not to search engines). This allows you to direct
            link your profile (vrerp.net/{ profile.username }) in lewd discord servers for detailed bio and availability 😊<br />
            <br />
            Discord &amp; vrchat username visible to:
            <Select color="purple" onChange={ handleChange('discordVisibility') } defaultValue={ profile.discordVisibility }>
                <option value="public">public</option>
                <option value="members" >members only</option>
                <option value="matches" >matches only</option>
            </Select>
            <br /><br />
            Fantasies visible to:
            <Select color="purple" onChange={ handleChange('fantasiesVisibility') } defaultValue={ profile.fantasiesVisibility }>
                <option value="public">public</option>
                <option value="members" >members only</option>
                <option value="matches" >matches only</option>
            </Select>
            <br />
            {
                (roles && roles.includes('dates')) && <div><br />
                    Allow date invitations from:
                    <Select color="purple" onChange={ handleChange('datesVisibility') } defaultValue={ profile.datesVisibility }>
                        <option value="members" >members</option>
                        <option value="matches" >matches only</option>
                    </Select>
                    <br />
                </div>
            }
            <br />
            {
                hasRole(user, 'featured') && <Text p="md" size="md">
                    <br />
                    <Switch id='featured' color='purple' 
                        checked={ profile.featured } 
                        onClick={ () => handleSwitch('featured', !profile.featured) }
                    />
                    <label htmlFor='featured' className='drac-text'>Feature me on the front page</label>
                    <br />
                    <br /><br />
                </Text>
            }
        </div>
    )
};


export default PrivacySettings;
