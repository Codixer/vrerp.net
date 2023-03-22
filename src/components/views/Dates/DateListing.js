import { h } from 'preact';
import { useCallback, useMemo, useState } from 'preact/hooks';
import { useStores } from 'pullstate';
import { fetchStore, updateAssets, updateDates, updateProfile } from '../../scripts/api.js';
import { formatDate, formatTime } from '../../scripts/utils.js';
import { Button, Image, Link, outlinedButton, SuspenseBar } from '../../site/Elements.js';

const getProfileByUserId = (profiles, userId) => {
    const match = Object.values(profiles).filter((p) => p.userId === userId);
    if (match.length > 0) {
        return match[0];
    }
    return {};
}

const DateEntry = ({ date }) => {
    console.log('DateEntry', date);
    const { profileStore, siteStore } = useStores();
    const userId = siteStore.useState(s => s.user.userId);
    const otherUserId = date.inviter === userId ? date.invited : date.inviter;
    const profiles = profileStore.useState(s => s.profiles);
    const profile = useMemo(() => getProfileByUserId(profiles, otherUserId), [profiles, otherUserId]);
    const files = profileStore.useState(s => s.files) || { };
    const avatar = files[profile.avatar];
    const respondDate = useCallback(async(response) => {
        
    });
    return <div className='profile-view-thumbnail'>
        <Link href={ `/${ profile.url }`} className='profile-view-thumbnail-image'>
            <Image file={ avatar } size='thumbnail' className='mainimage-thumbnail' alt={ profile.username } />
        </Link>
        <div className='profile-view-thumbnail-info'>
            <Link href={ `/${ profile.url }`}>{ profile.username }</Link>&nbsp;
            invited you to a date on { formatDate(date.startDate) } at { formatTime(date.startDate) }<br />
            <br />
            <Button onClick={ () => respondDate('accept') } className={ outlinedButton } >Accept</Button>&nbsp;
            <Button onClick={ () => respondDate('decline') } className={ outlinedButton } >Decline</Button>&nbsp;
        </div>
    </div>;
};

const DateListing = () => {
    const { profileStore, assetStore, datesStore, siteStore } = useStores();
    const userId = siteStore.useState(s => s.user.userId);
    const dates = datesStore.useState(s => s.dates);
    console.log('dates', dates);
    return <div>
        <SuspenseBar height='30vh'
            finished={ (!!dates && dates.length) }
            load={ () => fetchStore(`/api/dates`, null, [[ profileStore, updateProfile() ], [ assetStore, updateAssets ], [ datesStore, updateDates ]])}
        >
            <h2>Invites</h2>
            {
                (dates && dates.length > 0) && dates.filter(d => d.status === 'invited' && d.inviter !== userId).map((date) => <DateEntry key={ date.id } date={ date } />)
            }

            <h2>Upcoming Dates</h2>
            {
                (dates && dates.length > 0) && dates.filter(d => d.status === 'accepted').map((date) => <DateEntry key={ date.id } date={ date } />)
            }
        </SuspenseBar>
    </div>
}

export default DateListing;
