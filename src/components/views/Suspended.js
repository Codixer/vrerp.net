import { h } from 'preact';
import { Heading } from '@dracula/dracula-ui';
import { Button } from '../site/Elements.js';
import { useStores } from 'pullstate';
import { fetchPost } from '../scripts/api.js';

export const Suspended = ({ id }) => {
    const { siteStore } = useStores();
    const adminMessage = siteStore.useState(s => s.user.adminMessage);
    const reactivate = async() => {
        await fetchPost(`/api/users/reactivate`, {});
        window.location.reload();
    };
    return (<div className='appbody'>
        <div className='app landing'>

            <Heading>Account suspended</Heading>
            <br />
            This account is currently suspended. <br />
            {
                adminMessage && <div><br /><br />Suspension reason: { adminMessage }</div>
            }
            <br />
            <br />
            <center><Button p="sm" onclick={ reactivate  } >Click here to reactivate</Button></center>
        </div>
    </div>)
};
