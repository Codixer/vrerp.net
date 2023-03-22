import { h } from 'preact';
import { useCallback } from 'preact/hooks';
import { useStores } from 'pullstate';
import { fetchPost } from '../../scripts/api.js';
import { Button, Modal } from '../../site/Elements.js';

export const AgeCheckBanner = () => {
    const { siteStore, profileStore } = useStores();
    const user = siteStore.useState(s => s.user);
    const ageCheck = user.ageCheck;
    const checkedAge = useCallback(async () => {
        await fetchPost(`/api/agecheck`, { ageCheck: true });
        siteStore.update(s => { s.user.ageCheck = true; });
    }, [ siteStore ]);
    if (ageCheck) {
        return <div></div>
    }
    return <Modal show={ !ageCheck } consent={ true } closable={ false }>
        <div className='modal-content'>
            <br />
            <center>
                <h2>You must be 18+ to view this community</h2>
                <p>You must be at least eighteen years old to view this content. Are you over eighteen and willing to see adult content?</p>
                <Button onClick={ checkedAge }>Yes</Button>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <Button onClick={ () => window.location = 'about:blank' }>No</Button>
            </center>
            <br />
        </div>
    </Modal>;
};
