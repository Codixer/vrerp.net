import { h } from 'preact';
import { useState, useMemo, useEffect } from 'preact/hooks';
import { useStores } from 'pullstate';

import { Button } from '../site/Elements.js';
import ProfileEditBasic from './Profile/ProfileEditBasic.js';
import ProfileEditTags from './Profile/ProfileEditTags.js';
import ProfileEditBio from './Profile/ProfileEditBio.js';
import ProfileEdit from './Profile/ProfileEdit.js';
import PrivacySettings from './Settings/Privacy.js';
import { fetchPost } from '../scripts/api.js';
import { useLocation } from '../scripts/router.js';

const Profile = ({ section }) => {
    const { route } = useLocation();
    const { siteStore } = useStores();
    const user = siteStore.useState(s => s.user);
    const syncTags = () => fetchPost('/api/users/sync', { });

    return (<div>
        {
            typeof section === 'undefined'
            && <div>
                <ProfileEdit id={ user.profileId } />
            </div>
        }
        {
            section === 'basicinfo' 
            && <div>
                <ProfileEditBasic id={ user.profileId } />
                <center><Button onclick={ () => route('/profile')  }>Save</Button></center>
            </div>
        }
        {
            section === 'tags'
            && <div>
                <ProfileEditTags id={ user.profileId } />
                <center><Button onclick={ () =>{ syncTags(); route('/profile'); } }>Save</Button></center>
            </div>
        }
        {
            section === 'bio'
            && <div>
                <ProfileEditBio id={ user.profileId } />
                <center><Button onclick={ () => route('/profile')  }>Save</Button></center>
            </div>
        }
        {
            section === 'privacy'
            && <div>
                <PrivacySettings id={ user.profileId } />
                <center><Button onclick={ () => route('/profile')  }>Save</Button></center>
            </div>
        }
    </div>)
};

export default Profile;

