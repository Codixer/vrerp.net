import { h } from 'preact';
import { useStores } from 'pullstate';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { formatDate, hasRole } from '../../scripts/utils.js';
import ProfileList from '../Profile/ProfileList.js';
import ProfileStatus from '../Profile/ProfileStatus.js';
import { Link, InputBox, Button, SuspenseBar, DynamicLink, Image } from '../../site/Elements.js';
import { fetchData, fetchPost, fetchProfile, fetchStore, updateProfile } from '../../scripts/api.js';
import { getImageURL } from '../../../shared.js';
import { Select } from '@dracula/dracula-ui';
import { useLocation } from '../../scripts/router.js';
import ProfileEditBasic from '../Profile/ProfileEditBasic.js';
import ProfileEditTags from '../Profile/ProfileEditTags.js';
import ProfileEditBio from '../Profile/ProfileEditBio.js';
import { TagBubble } from '../Profile/TagBubble.js';

export const AdminProfileThumbView = ({ profile }) => (
    <span>
        <span className='float-right' id={ `profile-status-display-${ profile.id }` } key={ `profile-status-display-${ profile.id }` }>
            <ProfileStatus status={ profile.status } />
        </span>
        <b><Link href={ `/${profile.url}` }>{ profile.username }</Link></b>&nbsp;&nbsp;&nbsp;
        { profile.profileVisibility }&nbsp;&nbsp;&nbsp;{ formatDate(new Date(profile.lastActivity)) }
        <div className='admincontrols'><Link href={ `/moderator/profiles/${ profile.id }` }>edit</Link></div>
        <div style={{ clear: 'both' }}></div>
    </span>
);

export const AdminUserSearch = () => {
    const [ query, setQuery ] = useState('');
    return (<div>
        <InputBox onKeyUp={ (evt) => setQuery(evt.target.value) } className='w240' placeholder='search...' />
        <ProfileList apiurl={ `/api/moderator/search?q=${ query }`} >
            { ({ profile }) => <AdminProfileThumbView profile={ profile } /> }
        </ProfileList>
    </div>);
}

export const AdminVerification = () => {
    const { profileStore } = useStores();
    const files = profileStore.useState(s => s.files) || {};
    const [ pendingVerification, setPendingVerification ] = useState([]);
    const [ rejectionReason, setRejectionReason ] = useState({});
    const reloadList = async() => {
        const response = await fetch('/api/moderator/verifications');
        const data = await response.json();
        setPendingVerification(data.data.verifications);
        profileStore.update(s => {
            s.files = { ...s.files, ...data.data.files };
        });
    };
    useEffect(() => reloadList(), []);
    const setStatus = async(verificationId, status) => {
        const data = { status };
        if (rejectionReason[verificationId]) {
            data.rejectionReason = rejectionReason[verificationId];
        }
        await fetchPost(`/api/moderator/verifications/${ verificationId }`, data);
        reloadList();
    };
    const handleRejectionChanged = (key) => (evt) => {
        setRejectionReason({ ...rejectionReason, [key]: evt.target.value });       
    };
    return (
        <div>
            {
                pendingVerification.map((p) => (
                    <div key={ p.id }>
                        <div className='profile-view-thumbnail'>
                            <Link href={ getImageURL(files[p.image], 'original')} className='profile-view-thumbnail-image' target='_blank'>
                                <Image file={ files[p.image] } size='thumbnail' className='mainimage-thumbnail' alt={ p.discord } />
                            </Link>
                            <div className='profile-view-thumbnail-info'>
                                { p.discord || p.email }&nbsp;&nbsp;&nbsp;
                                {
                                    p.profileId && <span><Link href={ `/moderator/profiles/${ p.profileId }` }>{ p.url  }</Link></span>
                                }
                                {
                                    p.migrateVerification && <div>Migrating verification from: { p.migrateVerification }</div>
                                }
                                <br />
                                <br /><br />
                                <Select color="purple" onChange={ handleRejectionChanged(p.id) } defaultValue='none'>
                                    <option value="none">No reason</option>
                                    <option value="profilepic">Profile pic not avatar</option>
                                    <option value="discordmigration">Not approved discord verif</option>
                                    <option value="discordpaper">No discord on paper on verification</option>
                                    <option value="noeboys">No eboys</option>
                                    <option value="noprofile">No profile on site</option>
                                    <option value="novr">No VR headset</option>
                                </Select><br />
                                <Button onClick={ () => setStatus(p.id, 'verified') }>Approve</Button>
                                <Button onClick={ () => setStatus(p.id, 'failed') }>Reject</Button>
                                <span className='float-right'>
                                    <Button onClick={ () => setStatus(p.id, 'banned') }>Ban</Button>
                                </span>
                            </div>
                        </div>
                    </div>
                ))
            }
        </div>
    );
};

export const AdminProfileSetRoles = ({ id }) => {
    const [ roles, setRoles ] = useState([]);
    const [ allRoles, setAllRoles ] = useState([]);
    useEffect(async () => {
        const data = await fetchStore(`/api/admin/roles/${ id }`);
        setRoles(data.roles);
        setAllRoles(data.allRoles);
    }, [ setRoles, setAllRoles ]);
    const toggleRole = useCallback(async(evt) => {
        const roleToggle = evt.target.textContent;
        const newRoles = roles.includes(roleToggle) ? roles.filter(r => r !== roleToggle) : roles.concat([roleToggle]);
        const data = await fetchStore(`/api/admin/roles/${ id }`, { newRoles });
        setRoles(data.roles);
        setAllRoles(data.allRoles);
    }, [ roles, setRoles, setAllRoles ]);
    return (<div>
        {
            allRoles.map((r) => (
                <TagBubble key={ r } selected={ roles.includes(r) } value={ r } onClick={ (evt) => toggleRole(evt) } />
            ))
        }
    </div>)
}

export const AdminProfileEdit = ({ id }) => {
    const { siteStore, profileStore } = useStores();
    const user = siteStore.useState(s => s.user);    
    const profile = profileStore.useState(s => s.profiles[id], [id]) || { };
    return (
        <SuspenseBar height='30vh' 
            finished={ Object.keys(profile).length > 0 }
            load={ async() => fetchProfile(id, profileStore) }
        >
            <ProfileEditBasic id={ id } />
            <ProfileEditTags id={ id } />
            <ProfileEditBio id={ id } />
            <AdminProfileSetStatus id={ id } />
            { hasRole(user, 'admin') && <AdminProfileSetRoles id={ id } /> }            
        </SuspenseBar>
    );
};


export const AdminProfileList = ({ membersOnly = false }) => {
    const { route } = useLocation();
    const addProfile = useCallback(async() => {
        const username = prompt('username');
        if (username) {
            const data = await fetchPost(`/api/moderator/profiles`, { username });
            route(`/moderator/profiles/${ data.profileId }`);
        }
    });
    return <div>
        { !membersOnly && <Link href='/moderator/member-profiles' className='float-right'>members only</Link> }
        { membersOnly && <Link href='/moderator/profiles' className='float-right'>all profiles</Link> }        
        <DynamicLink onClick={ addProfile }>Add new profile...</DynamicLink>
        <ProfileList apiurl={ membersOnly ? '/api/moderator/member-profiles' : '/api/moderator/profiles'} >
            { ({ profile }) => <AdminProfileThumbView profile={ profile } /> }
        </ProfileList>
    </div>
}

export const AdminProfileSetStatus = ({ id }) => {
    const { route } = useLocation();
    const { profileStore } = useStores();
    const profile = profileStore.useState(s => s.profiles[id], [id]) || { };
    const updateStatus = profile.status === 'draft' ? 'published' : 'draft';
    const setStatus = async (status) => {
        await fetchProfile(id, profileStore, { status });
    };
    const moderateUser = async(status) => {
        let adminMessage = null;
        if (['banned', 'suspended'].includes(status)) {
            adminMessage = prompt('Admin message');
        }
        await fetchData(profileStore, `/api/moderator/moderate/${ id }/${ status }`, { adminMessage }, updateProfile(id));
        if (status === 'delete') {
            route('/moderator');
        }
    };

    return (<div>
        <br />User status: { profile.profileVisibility }<br />
        <Button onclick={ () => setStatus(updateStatus)  }>Set status to { updateStatus } &raquo;</Button><br /><br />
        <Button onclick={ () => moderateUser('suspended')  }>Suspend user</Button><br /><br />
        <Button onclick={ () => moderateUser('revoke')  }>Revoke verification</Button><br /><br />
        <Button onclick={ () => moderateUser('banned')  }>Ban user</Button><br /><br />
        <Button onclick={ () => moderateUser('delete')  }>Delete user</Button><br />
    </div>);
};

