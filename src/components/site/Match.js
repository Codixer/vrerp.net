import { h, Component } from 'preact';
import { useLocation } from '../scripts/router.js';

export const Match = ({ test, children }) => {
    const { url } = useLocation();
    if (test(url)) {
        return <div>{ children }</div>;
    }
    return <div></div>;    
}

