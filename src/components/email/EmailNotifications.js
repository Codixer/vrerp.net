import { h } from 'preact';
import { EmailFrame, EmailKinkList, EmailProfileView } from './EmailElements.js';

export const EmailInvite = ({ server, code, profile, avatar }) => (
    <EmailFrame server={ server }>
        <h3>{ profile.username }  wants to be your lewdie 💕 </h3><br />
        <a href={`${ server }api/users/auth?code=${ code }&url=/browse/${ profile.url }` }>Click here to log in, and view profile</a><br /><br />
        <EmailProfileView server={ server } profile={ profile } avatar={ avatar } >
            <a href={ `${ server }${ profile.url }` }>{ profile.username }</a><br />
            <EmailKinkList profile={ profile } />
        </EmailProfileView>
    </EmailFrame>
);

export const EmailMatch = ({ server, code, profile, avatar }) => (
    <EmailFrame server={ server }>
        <h3>Matched with { profile.username } 💕 </h3><br />
        <a href={`${ server }api/users/auth?code=${ code }&url=/${ profile.url }` }>Click here to log in, and view profile</a><br /><br />
        <EmailProfileView server={ server } profile={ profile } avatar={ avatar } >
            <a href={ `${ server }${ profile.url }` }>{ profile.username }</a><br />
            <EmailKinkList profile={ profile } />
        </EmailProfileView>
    </EmailFrame>
);

export const EmailVerificationApproved = ({ server, code, username }) => (
    <EmailFrame server={ server }>
        <h3>Your verification has been approved!</h3><br />
        <a href={`${ server }api/users/auth?code=${ code }&url=/onboarding/settings` }>Click here to log in, and finish your profile</a><br /><br />
    </EmailFrame>
);

export const EmailVerificationDenied = ({ server, code, message }) => (
    <EmailFrame server={ server }>
        <h3>Your verification has been rejected. </h3><br />
        { message }<br />
        You can try again by submitting better ID by <a href={`${ server }api/users/auth?code=${ code }&url=/onboarding/verification` }>clicking here.</a>
    </EmailFrame>
);
