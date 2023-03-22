import { h } from 'preact';
import { Heading } from '@dracula/dracula-ui';
import Helmet from 'preact-helmet';
import { useCallback } from 'preact/hooks';
import { Link } from '../site/Elements.js';

import { useStores } from 'pullstate';

import { deleteData, fetchPost } from '../scripts/api.js';
import { Button } from '../site/Elements.js';

const DeleteProfile = () => {
    const { profileStore, siteStore } = useStores();
    const user = siteStore.useState(s => s.user);
    const profile = profileStore.useState(s => s.profiles[user.profileId]);

    const deleteProfile = useCallback(async () => {
        await deleteData('/api/users/me', { sure: 'yes' });
        window.location = '/';
    }, []);
    return (<div>
        <Helmet title={ `delete my data - vrerp.net` } />
        <Heading>Delete my data</Heading><br />
        WARNING: This will delete all your data, images, connections, and profiles associated with your account.<br />
        For privacy reasons, this function is 100% ruthless; there is no undo button.<br />
        Please double-check, that you want to delete:<br /><br />
        username: { profile.username }<br />
        {
            profile.discord && <div>discord: { profile.discord }<br /></div>
        }
        {
            user.email && <div>email: { user.email }<br /></div>
        }
        <br />
        before proceeding below.<br />
        <br />
        <Button onClick={ deleteProfile } >Yes, DELETE ALL MY DATA</Button>&nbsp;&nbsp;&nbsp;
        <Link href='/'>Cancel, and go back</Link>
    </div>);
};


export default DeleteProfile;
