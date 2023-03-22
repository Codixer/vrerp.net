import { h } from 'preact';
import { useState, useMemo, useEffect, useCallback } from 'preact/hooks';
import { Link } from '../site/Elements.js';
import Helmet from 'preact-helmet';

import { useStores } from 'pullstate';
import ProfileViewThumbnail from './Profile/ProfileViewThumbnail.js';

import { Button, SuspenseBar } from '../site/Elements.js';
import { fetchData, fetchProfileList, updateFeed } from '../scripts/api.js';
import { NextAction } from './Flow/NextAction.js';

export const Invites = () => {
    const { profileStore, assetStore } = useStores();
    const invites = profileStore.useState(s => s.invites) || [];
    const profiles = profileStore.useState(s => s.profiles) || {};
    const profileList = profileStore.useState(s => Object.keys(s.profiles)) || [];
    const shownInvites = useMemo(() => invites.filter((profileId) => profiles[profileId] && profiles[profileId].profileVisibility !== 'disabled'), [ invites, profiles ]);
    const missingProfiles = useMemo(() => invites.filter((profileId) => !profileList.includes(profileId) ), [ invites, profileList ]);
    const handleMatch = (id, match) => async() => {
        await fetchData(profileStore, '/api/match/set-match', { profileId: id, match }, updateFeed);
    };
    return (
        <SuspenseBar height='30vh' 
            finished={ (missingProfiles.length === 0) }
            load={ async() => fetchProfileList(missingProfiles, profileStore, assetStore) }
        >
            <Helmet title={ `invites - vrerp.net` } />
            {
                (missingProfiles.length === 0) && shownInvites.map((id) => (
                    <ProfileViewThumbnail key={ id } id={ id }>
                        { profiles[id].username } wants to be your lewdie 💕<br />
                        <Button onClick={ handleMatch(id, 'love') } variant="outline" className="medium-size drac-btn drac-bg-purple drac-btn-outline drac-text-purple drac-p-sm">❤ Love</Button><br />
                        <Button onClick={ handleMatch(id, 'pass') } variant="outline" className="medium-size drac-btn drac-bg-purple drac-btn-outline drac-text-purple drac-p-sm">Pass</Button><br />

                    </ProfileViewThumbnail>
                ))
            }
            {
                (missingProfiles.length === 0 && shownInvites.length === 0) && <div className='drac-m-sm'>
                    No invites for now. <Link href='/browse'>Make some friends!</Link><br />
                </div>
            }
            <br /><br />
            <NextAction />
            <br />
        </SuspenseBar>
    );
};
