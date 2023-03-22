import { h } from 'preact';
import { hydrate } from 'preact-iso'
import App from './components/App.js'
import { PullstateProvider } from "pullstate";
import { PullstateCore } from "./shared.js";

const hydrateSnapshot = JSON.parse(window.__PULLSTATE__);
const instance = PullstateCore.instantiate({ ssr: false, hydrateSnapshot });

hydrate(
    <PullstateProvider instance={instance}>
        <App url={ window.__STATE__.url } />
    </PullstateProvider>,
    document.getElementById('root'));
