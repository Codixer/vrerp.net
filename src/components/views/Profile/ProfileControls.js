
import { h } from 'preact';
import { useCallback } from 'preact/hooks';
import { useStores } from 'pullstate';

import { Button, Modal } from '../../site/Elements.js';
import { fetchData, updateFeed } from '../../scripts/api.js';
import { useState } from 'react';
import Compliments from '../Feedback/Compliments.js';
import { useLocation } from '../../scripts/router.js';

export const ProfileControls = ({ profile }) => {
    const { route } = useLocation();
    const { profileStore, siteStore } = useStores();
    const roles = siteStore.useState(s => s.user && s.user.roles ? s.user.roles : []);
    const matches = profileStore.useState(s => s.matches) || [];
    const loves =  profileStore.useState(s => s.loves) || [];
    const invitePending =  profileStore.useState(s => s.invitePending) || [];
    const isMatch = matches.includes(profile.id);
    const isLoved = loves.includes(profile.id);
    const isInvitePending = invitePending.includes(profile.id);
    const [ showCompliments, setShowCompliments ] = useState(false);
    const openDiscord = useCallback((id) => window.open(`https://discord.com/users/${ id }`), [ profile ]);
    const handleMatch = useCallback((id, match) => fetchData(profileStore, '/api/match/set-match', { profileId: id, match }, updateFeed), [ profile ]);
    return (
        <div>
            <div>
                {
                    (!isMatch && !isInvitePending) && <Button onClick={ () => handleMatch(profile.id, 'love') } variant="outline" className="medium-size drac-btn drac-bg-purple drac-btn-outline drac-text-purple drac-p-sm">❤ Love</Button>
                }
                {
                    (!isMatch && isInvitePending) && <Button onClick={ () => handleMatch(profile.id, 'pass') } variant="outline" className="medium-size drac-btn drac-bg-purple drac-btn-outline drac-text-purple drac-p-sm">Cancel invite</Button>
                }
                {
                    (profile.discordId) && <div>
                        <Button onClick={ () => openDiscord(profile.discordId) } variant="outline" className="medium-size drac-btn drac-bg-purple drac-btn-outline drac-text-purple drac-p-sm">💌 Message</Button><br /><br />
                    </div>
                }
                {
                    isMatch && <div>
                        <Button onClick={ () => setShowCompliments(true) } variant="outline" className="medium-size drac-btn drac-bg-purple drac-btn-outline drac-text-purple drac-p-sm">🤗 Compliment</Button><br />
                    </div>
                }
                {
                    (profile.allowDates && (roles && roles.includes('dates'))) && <div><br />
                        <Button onClick={ () => route(`/dates/${ profile.url }`) } variant="outline" className="medium-size drac-btn drac-bg-purple drac-btn-outline drac-text-purple drac-p-sm">💝 Date</Button><br />
                    </div>
                }
                <br /><br />
                {
                    isMatch && <div>
                        <Button onClick={ () => handleMatch(profile.id, 'pass') } variant="outline" className="medium-size drac-btn drac-bg-purple drac-btn-outline drac-text-purple drac-p-sm">💔 Unmatch</Button><br /><br />
                    </div>
                }
                <Button onClick={ () => route(`/report/${ profile.url }`) } variant="outline" className="medium-size drac-btn drac-bg-purple drac-btn-outline drac-text-purple drac-p-sm">Report</Button><br /><br />
                {/* <Button onClick={ handleMatch } variant="outline" className="medium-size drac-btn drac-bg-purple drac-btn-outline drac-text-purple drac-p-sm">Block</Button><br /> */}
                {/* <Button onClick={ handleMatch } variant="outline" className="medium-size drac-btn drac-bg-purple drac-btn-outline drac-text-purple drac-p-sm">Report</Button> */}
            </div>
            {
                showCompliments && <Modal show={ showCompliments } onClose={ () => setShowCompliments(false) } >
                    <Compliments profile={ profile } onClose={ () => setShowCompliments(false) } />
                </Modal>
            }
        </div>
    )
};

export const ProfileControlReport = ({ profile }) => {
    const { route } = useLocation();
    return <Button onClick={ () => route(`/report/${ profile.url }`) } variant="outline" className="medium-size drac-btn drac-bg-purple drac-btn-outline drac-text-purple drac-p-sm">Report</Button>
}
