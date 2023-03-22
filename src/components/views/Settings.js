import { h } from 'preact';
import { useCallback, useState, useMemo, useEffect } from 'preact/hooks';
import { useStores } from 'pullstate';

import NotificationSettings from './Settings/Notifications.js';
import { Button, DynamicLink } from '../site/Elements.js';
import { fetchData } from '../scripts/api.js';
import PrivacySettings from './Settings/Privacy.js';
import DangerousSettings from './Settings/Dangerous.js';
import { useLocation } from '../scripts/router.js';
import TimeZoneSelect from './Dates/TimeZoneSelect.js';


const Settings = () => {
    const { route } = useLocation();
    const { siteStore } = useStores();
    const user = siteStore.useState(s => s.user);
    const logout = useCallback(async() => {
        const { error } = await fetchData(siteStore, `/api/users/logout`, {});
        route(`/`);
    }, []);

    return (
        <div>
            <PrivacySettings id={ user.profileId } />
            <TimeZoneSelect />
            <NotificationSettings id={ user.profileId } />
            <br /><br />
            <div className='float-right'><DynamicLink onClick={ () => logout() }>Log out</DynamicLink></div>
            <center><Button onclick={ () => route('/profile')  }>Save</Button></center>
            <br /><br />
            <DangerousSettings id={ user.profileId } />
        </div>
    )
};

export default Settings;
