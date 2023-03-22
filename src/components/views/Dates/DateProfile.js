import { h } from 'preact';
import { useCallback, useMemo, useState } from 'preact/hooks';
import { useStores } from 'pullstate';
import { fetchData, fetchStore, updateAssets, updateProfile } from '../../scripts/api.js';
import { useLocation } from '../../scripts/router.js';
import { formatDate, formatTime } from '../../scripts/utils.js';
import { Button, Image, InputBox, outlinedButton, SuspenseBar } from '../../site/Elements.js';
import TimeZoneSelect from './TimeZoneSelect.js';

const lastSunday = () => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 7) % 7));
    console.log(d.toJSON().toString());
    return new Date(d.toJSON().substring(0,10));
}

const DateProfile = ({ url, username }) => {
    const { route } = useLocation();
    const [ loading, setLoading ] = useState(false);
    const { profileStore, assetStore, datesStore } = useStores();
    const [ profileAvailable, setProfileAvailable ] = useState([]);
    const [ profileTimezone, setProfileTimezone ] = useState([]);
    const timezones = datesStore.useState(s => s.timezones || []);
    const availableTimes = useMemo(() => profileAvailable.map((item, index) => item ? index : 0).filter(item => item), [profileAvailable]);
    const userTimezone = datesStore.useState(s => s.userTimezone) || 'default';
    const knonwProfiles = profileStore.useState(s => s.profiles);
    const urlprofiles = Object.values(knonwProfiles).filter(p => p.url === username);
    const profile = urlprofiles.length > 0 ? urlprofiles[0] : {};
    const files = profileStore.useState(s => s.files) || { };
    const avatar = profile ? files[profile.avatar] : null;
    const startDate = useMemo(() => lastSunday());
    const [ selectedTime, setSelectedTime ] = useState(null);
    const [ message, setMessage ] = useState('');
    const sendInvite = useCallback(async() => {
        setLoading(true);
        await fetchStore(`/api/dates/invite`, { startDate, message, invited: profile.userId });
        route('/dates');
    });
    console.log({ profileAvailable, availableTimes, timezones, profile, profileTimezone, startDate })
    return (
        <div>
            <SuspenseBar height='30vh' 
                finished={ (!!profile && timezones.length > 0) }
                load={ async() => Promise.all([
                    fetchStore(`/api/dates/available/${ username }`, null, [[ profileStore, updateProfile() ], [ assetStore, updateAssets ]] ).then((data) => {
                        setProfileAvailable(data.available);
                        setProfileTimezone(data.userTimezone);
                    }),
                    (timezones.length === 0) && fetchData(datesStore, '/api/dates/available')
                ]) }
            >
                <h1>Invite { profile && profile.username } to a date! 💕</h1>
                {
                    avatar && <Image file={ avatar } size={ 'thumbnail' } className='float-right' />
                }
                <div style={{ clear: 'both' }}></div>
                <br />
                {
                    !selectedTime && <div>
                        <b>What time works best for you?</b>
                        <TimeZoneSelect />
                        { profile.username } is available:<br />
                        {
                            availableTimes.map((item, index) => {
                                const d = new Date(startDate);
                                d.setMinutes(d.getMinutes() + (item * 30));
                                let isNewDay = false;
                                if (index > 0) {
                                    const prev = new Date(startDate);
                                    prev.setMinutes(prev.getMinutes() + (availableTimes[index - 1] * 30));
                                    if (prev.getDay() !== d.getDay()) {
                                        isNewDay = true;
                                    }
                                } else {
                                    isNewDay = true;
                                }
                                return <div key={ item }>
                                    { isNewDay && <div style={{ marginTop: '1em' }}><b>{ formatDate(d) }</b></div> }
                                    <Button className={ outlinedButton } onClick={ () => setSelectedTime(d) } >{ formatTime(d) }</Button>
                                </div>;
                            })
                        }
                        <div style={{ clear: 'both' }}></div>
                    </div>
                }
                {
                    selectedTime && <div>
                        { formatDate(selectedTime) } at { formatTime(selectedTime) }&nbsp;&nbsp;&nbsp;
                        <Button className={ outlinedButton } onClick={ () => setSelectedTime(null) } >Change Time</Button><br />
                        Include a message:<br />
                        <InputBox name="message" onChange={ (evt) => setMessage(evt.target.value) } placeholder="Cuddles? 💕" />
                        <br />
                        <Button className={ outlinedButton } onClick={ sendInvite } >Invite { profile.username }</Button>
                    </div>
                }
            </SuspenseBar>
        </div>);
};

export default DateProfile;
