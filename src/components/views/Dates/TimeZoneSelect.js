import { h } from 'preact';
import { useStores } from 'pullstate';
import { Select, Switch } from '@dracula/dracula-ui';
import { useCallback, useMemo, useState } from 'preact/hooks';
import { SuspenseBar } from '../../site/Elements.js';
import { fetchData, fetchPost } from '../../scripts/api.js';


const TimeZoneSelect = ({ onChange }) => {
    const { datesStore } = useStores();
    const timezones = datesStore.useState(s => s.timezones);
    const userTimezone = datesStore.useState(s => s.userTimezone) || 'default';
    const init = useCallback((data) => {
        let detectedTz = null;
        if (data.userTimezone === null) {
            const d = new Date();
            const offset = -1 * d.getTimezoneOffset();
            for (let i = 0; i < data.timezones.length; i++) {
                if (data.timezones[i].currentTimeOffsetInMinutes === offset) {
                    detectedTz = data.timezones[i].name;
                    fetchPost('/api/dates/timezones', { userTimezone: data.timezones[i].name, userTimezoneOffset: data.timezones[i].rawOffsetInMinutes });
                    break;
                }
            }
        }
        datesStore.update(s => { s.timezones = data.timezones; s.userTimezone = data.userTimezone || detectedTz; });
    }, []);
    const changeHandler = useCallback(async (evt) => {
        datesStore.update(s => { s.userTimezone = evt.target.value; } );
        const userTimezoneOffset = timezones.find(tz => tz.name === evt.target.value).rawOffsetInMinutes;
        await fetchPost('/api/dates/timezones', { userTimezone: evt.target.value, userTimezoneOffset });
        if (onChange) {
            onChange(evt.target.value);
        }
    }, [onChange, timezones]);
    return <div>
        <SuspenseBar height='20px'
            finished={ (timezones.length !== 0) }
            load={async() => fetchData(datesStore, '/api/dates/timezones').then((data) => init(data)) }
        >
            Your Time Zone is:
            <Select onChange={ changeHandler } value={ userTimezone } defaultValue={ userTimezone }>
                <option key='default' value='default' disabled={ true }>Please select your timezone</option>
                {
                    timezones && timezones.map((tz) => <option key={ tz.name } value={ tz.name } timezoneOffset={ tz.rawOffsetInMinutes } selected={ true }>{ tz.name }</option>)
                }
            </Select>
            <br /><br />
        </SuspenseBar>

    </div>
};

export default TimeZoneSelect;
