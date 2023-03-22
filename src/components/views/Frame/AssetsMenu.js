import { h } from 'preact';
import { useCallback, useMemo, useState } from 'preact/hooks';
import { Link, Modal } from '../../site/Elements.js';
import { useStores } from 'pullstate';
import { DynamicMenuLink, MenuLink } from './SideMenu.js';
import { useLocation } from '../../scripts/router.js';
import { Text, Switch } from '@dracula/dracula-ui';

import style from './SideMenu.css';
import { AssetPublish } from '../Assets/AssetPublish.js';

export const AssetsMenu = () => {
    const { url, route } = useLocation();
    const [ free, setFree ] = useState(url.includes('free-'));
    const [ showPublish, setShowPublish ] = useState(false);
    useState(() => {
        setFree(url.includes('free-'));
    }, [ url ]);
    const freePrefix = useMemo(() => free ? 'free-' : '', [ free ]);
    const { siteStore, profileStore } = useStores();
    const user = siteStore.useState(s => s.user);
    const toggleFreeState = useCallback(() => {
        const newState = !free;
        const urlpieces = url.split('/');
        let current = urlpieces[1].split('-');
        if (newState) {
            current = ['free'].concat(current);
        } else {
            current = current.filter((c) => c !== 'free');
        }
        setFree(newState);
        route(`/${ current.join('-') }`);
    }, [ free, url ]);
    return (
        <div>
            <MenuLink href='/'>💕 VR ERP</MenuLink>
            <MenuLink href={ `/${ freePrefix }vrchat-erp-assets` }>All items</MenuLink>
            <MenuLink href={ `/${ freePrefix }vrchat-avatar-assets` }>Avatars</MenuLink>
            <div className='sidemenu-item'>
                <li><Link href={ `/${ freePrefix }vrchat-quest-avatar-assets` }>Quest only</Link></li>
            </div>
            <MenuLink href={ `/${ freePrefix }vrchat-accessory-assets` }>Accessories</MenuLink>
            <br />
            <Text p="sm" size="md">
                <Switch id='onInvite' color='purple' 
                    checked={ free } 
                    onClick={ () => toggleFreeState() }
                />
                <label htmlFor='onInvite' className='drac-text'> Free only</label>
            </Text><br /><br />
            <DynamicMenuLink onClick={ () => setShowPublish(true) }>⚓ Publish items</DynamicMenuLink>
            {
                showPublish && <Modal show={ showPublish } onClose={ () => setShowPublish(false) }>
                    <AssetPublish />
                </Modal>
            }
        </div>
    );
};


