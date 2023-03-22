import { h } from 'preact';
import { Select, Switch } from '@dracula/dracula-ui';
import { useCallback, useMemo, useState } from 'preact/hooks';
import { Button, InputBox, SuspenseBar } from '../../site/Elements.js';
import Helmet from 'preact-helmet';

import style from './DateAvailability.css';
import classNames from 'classnames';
import { fetchData, fetchPost } from '../../scripts/api.js';
import { useStores } from 'pullstate';
import { useEffect } from 'react';
import TimeZoneSelect from './TimeZoneSelect.js';
import { useLocation } from '../../scripts/router.js';

// export const DateAvailabilityDayControl = ({ day, onChange }) => {
//     const [ loading, setLoading ] = useState();
//     const [ enabled, setEnabled ] = useState();
//     const func = () => {};
//     return (<div>
//         <Switch id='enabled' color='purple' 
//             checked={ enabled } 
//             onClick={ () => func() }
//             disabled={ loading }
//         />
//         <InputBox name='fromTime' value='' onBlur={ (evt) => func(evt.target.value) } />
//         <InputBox name='fromTime' value='' onBlur={ (evt) => func(evt.target.value) } />
//         <Button onClick={ func }>🗑️</Button>
//         <Button onClick={ func }>+</Button>
//         <Button onClick={ func }>Copy</Button>
//     </div>)
// }

const DateAvailabilityBox = ({ selection, x, y, setSelection, isSelecting, isAvailable, onFinished }) => {
    const mouseDown = (evt) => {
        if(evt.stopPropagation) evt.stopPropagation();
        if(evt.preventDefault) evt.preventDefault();
        setSelection([(isAvailable ? -1 : 1), x, y, x, y]);
    };
    const mouseOver = useCallback((evt) => {
        if(evt.stopPropagation) evt.stopPropagation();
        if(evt.preventDefault) evt.preventDefault();
        if (selection[0]) {
            setSelection([selection[0], selection[1], selection[2], x, y]);
        }
    }, [selection, setSelection]);
    // console.log(x,y, selection, isSelected);
    // const isSelected = false;
    return <td onMouseDown={ mouseDown } onMouseOver={ mouseOver } onMouseUp={ onFinished } 
        className={ classNames({ 
            'date-availability-box-unavailable': (!isSelecting && !isAvailable),
            'date-availability-box-available': (!isSelecting && isAvailable), 
            'date-availability-box-selecting': isSelecting 
        }) }
    >&nbsp;&nbsp;&nbsp;&nbsp;</td>
}

const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DateAvailability = () => {
    const { route } = useLocation();
    const { siteStore, profileStore, datesStore } = useStores();
    const timezones = datesStore.useState(s => s.timezones);
    const cacheAvailable = datesStore.useState(s => s.available);
    const [ available, setAvailable ] = useState(cacheAvailable);
    const [ selection, setSelection ] = useState([0, 0,0, 0,0]);
    const [ loading, setLoading ] = useState(false);
    const saveDates = useCallback(async () => {
        setLoading(true);
        await fetchPost('/api/dates/available', { available });
        setLoading(false);
        route('/dates');
    }, [ available, setLoading ]);
    const isSelecting = useCallback((x, y) => {
        if (selection[0] === 0) {
            return false;
        }
        if ((selection[1] >= selection[3]) && ((selection[3] > x) || (selection[1] < x))) {
            return false;
        }
        if ((selection[1] <= selection[3]) && ((selection[1] > x) || (selection[3] < x))) {
            return false;
        }
        if ((selection[2] >= selection[4]) && ((selection[4] > y) || (selection[2] < y))) {
            return false;
        }
        if ((selection[2] <= selection[4]) && ((selection[2] > y) || (selection[4] < y))) {
            return false;
        }
        return true;
    }, [ selection ]);
    const setAvailabilityFromSelection = useCallback(() => {
        console.log(selection);
        const updatedAvailable = Array.from(available);
        const minx = Math.min(selection[1], selection[3]);
        const maxx = Math.max(selection[1], selection[3]);
        const miny = Math.min(selection[2], selection[4]);
        const maxy = Math.max(selection[2], selection[4]);
        console.log(minx, maxx, miny, maxy);
        const av = (selection[0] === 1) ? 1 : 0;
        for (let i = miny; i <= maxy; i++) {
            for (let j = minx; j <= maxx; j++) {
                updatedAvailable[j * 48 + i] = av;
            }
        }
        console.log(updatedAvailable);
        datesStore.update(s => { s.available = updatedAvailable; });
        setAvailable(updatedAvailable);
        setSelection([0, 0,0, 0,0]);
    }, [ selection, setSelection, available, datesStore, setAvailable ]);
    const init = useCallback((data) => {
        console.log('data', data);
        if (data.available) {
            setAvailable(data.available);
            datesStore.update(s => { s.available = data.available; });
        }
    }, [ setAvailable, datesStore ]);
    console.log('available', available);
    return (<div>
        <Helmet title={ `ERP 💝 Dates - vrerp.net` } />
        <SuspenseBar height='30vh'
            finished={ ((available.length !== 0) && (timezones && timezones.length !== 0)) }
            load={async() => fetchData(datesStore, '/api/dates/available').then((data) => init(data)) }
        >
            <h1>💝 Dates</h1>
            <b>When are you available for erp dates? 😊</b><br />
            <TimeZoneSelect />
            When are you usually available?<br />
            <small>Desktop: Click and drag to toggle;  Mobile: tap to toggle</small><br />
            <table border='1'>
                <thead>
                    {
                        [' '].concat(dayHeaders).map((day) => <th key={ day }>{ day }</th>)
                    }
                </thead>
                <tbody>
                    {
                        Array.from(Array(48).keys()).map((hourno) => (
                            <tr key={ hourno }>
                                <td>{ `${ Math.floor(hourno / 2) }:${ (hourno % 2 === 0)?'00':'30' }-`}</td>
                                {
                                    Array.from(Array(7).keys()).map((dayno) => 
                                        <DateAvailabilityBox
                                            key={ `box_${ dayno }_${ hourno }` }
                                            selection={ selection }
                                            x={ dayno }
                                            y={ hourno }
                                            setSelection={ setSelection } 
                                            isSelecting={ isSelecting(dayno, hourno) }
                                            isAvailable={ available[dayno * 48 + hourno] }
                                            onFinished={ setAvailabilityFromSelection }
                                        />)
                                }
                            </tr>
                        ))
                    }
                </tbody>
            </table>
            <br />
            <Button onClick={ saveDates }>Save</Button>
        </SuspenseBar>
    </div>)
};

export default DateAvailability;
