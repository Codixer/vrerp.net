import { h } from 'preact';
import { useStores } from 'pullstate';

import { useCallback, useState, useMemo, useEffect } from 'preact/hooks';
import { Heading, Select, Text } from '@dracula/dracula-ui';
import { Button, Modal, outlinedButton } from '../../site/Elements.js';

import { fetchPost, updateFeed, deleteDataAndUpdateStore } from '../../scripts/api.js';

const MODAL_DELETE_PASSES = 'delete_passes';
const MODAL_DEACTIVATE_ACCOUNT = 'deactivate_account';

const DangerousSettings = ({ id }) => {
    const { profileStore, siteStore } = useStores();
    const [ visibleModal, setVisibleModal ] = useState(null);
    const [ loading, setLoading ] = useState(false);
    const resetPasses = useCallback(async () => {
        setLoading(true);
        await deleteDataAndUpdateStore(profileStore, '/api/match/passes', updateFeed);
        setLoading(false);
        setVisibleModal(null);
    });
    const deactivate = useCallback(async () => {
        setLoading(true);
        await fetchPost(`/api/users/deactivate`, {});
        setLoading(false);
        setVisibleModal(null);
        window.location = '/';
    });
    return (
        <div>
            <Heading>Danger zone</Heading><br />
            <Button className={ outlinedButton } onClick={ () => setVisibleModal(MODAL_DELETE_PASSES) } >Reset passes</Button><br /><br />
            <Button className={ outlinedButton } onClick={ () => setVisibleModal(MODAL_DEACTIVATE_ACCOUNT) } >Deactivate account</Button>
            <Modal show={ (visibleModal === MODAL_DELETE_PASSES) } onClose={ () => setVisibleModal(null) }>
                <div className='modal-content'>
                    <br />This will delete all your previous passes<br /><br />
                    <Button className={ outlinedButton } onClick={ resetPasses } disabled={ loading }>Yes, delete passes</Button>&nbsp;&nbsp;&nbsp;
                    <Button className={ outlinedButton } onClick={ () => setVisibleModal(null) }>Cancel</Button>
                </div>
            </Modal>
            <Modal show={ (visibleModal === MODAL_DEACTIVATE_ACCOUNT) } onClose={ () => setVisibleModal(null) }>
                <div className='modal-content'>
                    <br />This will deactivate your account. You can reactivate any time, by logging in, and clicking reactivate.<br /><br />
                    <Button className={ outlinedButton } onClick={ deactivate } disabled={ loading }>Yes, deactivate account</Button>&nbsp;&nbsp;&nbsp;
                    <Button className={ outlinedButton } onClick={ () => setVisibleModal(null) }>Cancel</Button>
                </div>
            </Modal>
        </div>
    );
};

export default DangerousSettings;
