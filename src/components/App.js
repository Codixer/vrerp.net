// main app
import { h } from 'preact';
import { useCallback, useEffect, useMemo } from 'preact/hooks';
import { useStores } from 'pullstate';
import Helmet from 'preact-helmet';
import { ErrorBoundary, lazy } from 'preact-iso';

import { LocationProvider, Router, useLocation, useRoute } from './scripts/router.js';

import { Match } from './site/Match.js';

// import '@dracula/dracula-ui/styles/dracula-ui.css'
// import draculaUIStyle from '../../node_modules/@dracula/dracula-ui/styles/dracula-ui.css';

import '../../node_modules/@dracula/dracula-ui/styles/dracula-ui.css';

import Header from './site/Header.js';
import Footer from './site/Footer.js';

import { LandingPage, NotPublic, NotPublicMedia } from './views/Landing.js';

import IsHuman from './site/IsHuman.js';

import style from './App.css';
import Home from './views/Home.js';

import About from './views/About.js';
import { Invites } from './views/Invites.js';
import { Matches } from './views/Matches.js';
import { SideMenu } from './views/Frame/SideMenu.js';
import Guides from './views/Pages/Guides.js';
import MobileHeader from './views/Frame/MobileHeader.js';
import { RulesPage } from './views/Rules.js';
import { RegisterCTA } from './views/Flow/RegisterCTA.js';
import { clientSide, hasRole } from './scripts/utils.js';
import Fantasies from './views/Fantasies.js';
import { FantasyViewPage } from './views/Fantasies/FantasyView.js';
import { Suspended } from './views/Suspended.js';
import { InvitePage } from './views/InvitePage.js';
import WebSocketClient from './site/WebSocket.js';
import { AssetsMenu } from './views/Frame/AssetsMenu.js';
import { fetchPost } from './scripts/api.js';
import Logout from './views/Flow/Logout.js';
import { AgeCheckBanner } from './views/Frame/AgeCheckBanner.js';

const DeleteProfile = lazy(() => import('./views/DeleteProfile.js'));
const Assets = lazy(() => import('./views/Assets.js'));
const AssetEdit = lazy(() => import('./views/Assets/AssetEdit.js'));
const Profile = lazy(() => import('./views/Profile.js'));
const Verification = lazy(() => import('./views/Verification.js'));
const CalendarEvents = lazy(() => import('./views/CalendarEvents.js'));
const Admin = lazy(() => import('./views/Admin.js'));
const Moderator = lazy(() => import('./views/Moderator.js'));
const Onboarding = lazy(() => import('./views/Onboarding.js'));
const Fallback = lazy(() => import('./views/Fallback.js'));
const Browse = lazy(() => import('./views/Browse.js'));
const Report = lazy(() => import('./views/Feedback/Report.js'));
const Mediation = lazy(() => import('./views/Feedback/Mediation.js'));
const Lobby = lazy(() => import('./views/Lobby.js'));
const Settings = lazy(() => import('./views/Settings.js'));
const FreshSouls = lazy(() => import('./views/FreshSouls.js'));
const NewArrivals = lazy(() => import('./views/NewArrivals.js'));
const Media = lazy(() => import('./views/Media.js'));
const Dates = lazy(() => import('./views/Dates.js'));
const FantasyEdit = lazy(() => import('./views/Fantasies/FantasyEdit.js'));
const Search = lazy(() => import('./views/Search.js'));
// const DateAvailability = lazy(() => import('./views/Dates/DateAvailability.js'));
// const DateProfile = lazy(() => import('./views/Dates/DateProfile.js'));

const AppRouter = ({ user }) => {
    const { siteStore } = useStores();
    const reported = siteStore.useState(s => s.user && s.user.reported ? s.user.reported : null);
    const { route, url } = useLocation();
    const urlparts = url.split('/');
    useEffect(() => {
        if (reported && !url.startsWith('/mediation')) {
            route(`/mediation?url=${ url }`);
            return;
        }
        if ((url === '/') && (!!user.roles) && (!hasRole(user, 'verified'))) {
            route('/onboarding/welcome');
        }
    }, []);
    const onError = (err) => { fetchPost('/api/log', { error: err.toString(), stack: err.stack.toString(), url: window.location.href }); };
    const appClass = useMemo(() => ((urlparts.length > 1 && urlparts[1] === 'media') || (url === '/moderator/images')) ? 'app assets' : 'app', [ url ]);

    if ((urlparts.length > 1) && (urlparts[1].endsWith('-assets'))) {
        return (
            <div className='appbody'>
                <SideMenu Menu={ AssetsMenu } />
                <div className='app assets'>
                    <MobileHeader Menu={ AssetsMenu } />
                    <ErrorBoundary>
                        <Router url={ url } >
                            <Assets default />
                        </Router>
                    </ErrorBoundary>
                </div>
            </div>
        );
    }
    if (!user.roles) {
        return (
            <div className='appbody'>
                <div className='app landing'>
                    <ErrorBoundary onError={ onError }>
                        <Router url={ url } >
                            <LandingPage path="/" />
                            <Verification path="/verify/:id" header={ true } />
                            <About path="/about" />
                            <Guides path="/guides" />
                            <RulesPage path="/rules" />
                            <FantasyViewPage path="/fantasies/:id" />
                            <InvitePage path="/invite/:code" header={ true } />
                            <CalendarEvents path="/events" />
                            <NotPublic path="/lobby" />
                            <NotPublic path="/fantasies" />
                            <NotPublic path="/fresh-souls" />
                            <NotPublicMedia path="/media" />
                            <NotPublicMedia path="/media/:id" />
                            <Report path="/report" />
                            <Report path="/report/:username" />
                            <Fallback header={ true } default />
                        </Router>
                    </ErrorBoundary>
                </div>
                <Match test={ (url) => (url !== '/') && (!url.startsWith('/verify')) } >
                    <RegisterCTA />
                </Match>
            </div>
        );
    }
    if (hasRole(user, 'suspended')) {
        return <Suspended />;
    }
    if (!hasRole(user, 'onboarded')) {
        return <div className='appbody'>
            <div className='app'>
                <Header />
                <ErrorBoundary onError={ onError }>
                    <Router url={ url } >
                        <Home path="/" />
                        <Onboarding path="/onboarding/:section" />
                        <InvitePage path="/invite/:code" header={ true } />
                        <CalendarEvents path="/events" />
                        <Verification path="/verify/:id" />
                        <DeleteProfile path='/delete-me' />
                        <About path="/about" />
                        <RulesPage path="/rules" />
                        <Mediation path="/mediation" />
                        <Logout path="/logout" />
                        <Fallback default />
                    </Router>
                </ErrorBoundary>
            </div>
        </div>;
    }
    return (
        <div className='appbody'>
            <SideMenu />
            <div className={ appClass }>
                <MobileHeader />
                <ErrorBoundary onError={ onError }>
                    <Router url={ url }>
                        <Home path="/" />
                        <Onboarding path="/onboarding/:section" />
                        <Guides path="/guides" />
                        <Profile path="/profile" />
                        <Profile path="/profile/:section" />
                        <Browse path="/browse" />
                        <Browse path="/browse/:username" />
                        <Lobby path="/lobby" />
                        <Invites path="/invites" />
                        <Matches path="/matches" />
                        <Fantasies path="/fantasies" />
                        <FantasyViewPage path="/fantasies/:id" />
                        <FantasyEdit path="/fantasies/:id/edit" />
                        <Settings path="/settings" />
                        <RulesPage path="/rules" />
                        <FreshSouls path="/fresh-souls" />
                        <NewArrivals path="/new-arrivals" />
                        <Assets path="/(.*)-assets" />
                        <AssetEdit path="/assets/:id/edit" />
                        <CalendarEvents path="/events" />
                        <DeleteProfile path='/delete-me' />
                        <Report path="/report" />
                        <Report path="/report/:username" />
                        <Media path="/media" />
                        <Media path="/media/:id" />
                        <Mediation path='/mediation' />
                        <Logout path="/logout" />
                        <Dates path='/dates' />
                        {/* <DateProfile path='/dates/:username' />
                        <DateAvailability path='/dates-setup' />*/}
                        <Search path="/search" />
                        { hasRole(user, 'admin') && <Admin path="/admin" /> }
                        { hasRole(user, 'admin') && <Admin path="/admin/:section" /> }
                        { hasRole(user, 'admin') && <Admin path="/admin/:section/:id" /> }
                        { (hasRole(user, 'admin') || hasRole(user, 'mod')) && <Moderator path="/moderator" /> }
                        { (hasRole(user, 'admin') || hasRole(user, 'mod')) && <Moderator path="/moderator/:section" /> }
                        { (hasRole(user, 'admin') || hasRole(user, 'mod')) && <Moderator path="/moderator/:section/:id" /> }
                        <About path="/about" />
                        <Fallback default />
                    </Router>
                </ErrorBoundary>
            </div>
        </div>
    );
};

const App = ({ url }) => {
    const { siteStore, profileStore } = useStores();
    const mode = siteStore.useState(s => s.mode);
    const user = siteStore.useState(s => s.user);
    const currentProfile = profileStore.useState(s => s.profiles[user.profileId]);
    const allStores = useStores();
    useEffect(() => {
        if ((typeof(window) !== 'undefined') && (mode === 'development')) {
            window['store'] = allStores;
        }
    }, []);
    return (
        <div>
            <Helmet 
                title='vrerp.net: Find partners for VR ERP, keep in touch with your lewdies' 
                meta={[
                    { name: 'description', content: 'Find new VR lewdies, and make your sexual fantasies come true in virtual reality 😊' },
                    { name: 'keywords', content: 'vrchat, chilloutvr, erp, lewd, erp events, virtual reality, erotic role play' },
                    { property: 'og:title', content: 'vrerp.net: Find partners for VR ERP, keep in touch with your lewdies' },
                    { property: 'og:description', content: 'Find new VR lewdies, and make your sexual fantasies come true in virtual reality 😊' },
                    { property: 'og:site_name', content: 'vrerp.net' },
                ]}
            />
            <LocationProvider url={ url }>
                <AppRouter url={ url } user={ user } />
            </LocationProvider>
            <Footer />
            { (mode === 'development' || hasRole(user, 'onboarded'))  && (
                <div>
                    <WebSocketClient />
                </div>
            )  }
            <IsHuman />
            <AgeCheckBanner />
        </div>
    );
}

export default App;
