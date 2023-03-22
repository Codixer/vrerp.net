import { h } from 'preact';
import { Image } from '../site/Elements.js';
import { tagIterator } from '../views/Profile/TagBubble.js';
import { EmailBubbleStyle, EmailHeaderStyle, EmailProfileViewThumbnailStyle } from './EmailStyles.js';

export const EmailFrame = ({ server, children }) => (
    <div>
        <h2><a href={ server } style={ EmailHeaderStyle }>💕 VR ERP</a></h2><br />
        { children }
        <hr size='1' />
        <center>
            vrerp.net &copy; 2022-2023&nbsp;&nbsp;
            <a href={ 'https://discord.gg/HDZQP6Wb6f' } target='_blank' rel='noreferrer'>Discord</a>&nbsp;&nbsp;
            <a href={ 'mailto:vrerp@pm.me' }>Contact</a>
        </center>
    </div>
)

export const EmailProfileView = ({ server, profile, avatar, children }) => (
    <div style={ EmailProfileViewThumbnailStyle }>
        <a href={ `${ server }${ profile.url }`} >
            <Image file={ avatar } size='thumbnail' style={ EmailProfileViewThumbnailStyle } alt={ profile.username } />
        </a>
        <div>
            { children }
        </div>
    </div>
)

export const EmailTagBubble = ({ value }) => {
    const text = (!!value) && (value.constructor === Object) ? value.display : value;
    return (<div style={ EmailBubbleStyle } >{ text }</div>);
}


export const EmailKinkList = ({ profile }) => {
    return (
        <div>
            {
                tagIterator(profile.kinks).map((kink) => (
                    <EmailTagBubble key={ kink } selected={ true } value={ kink } />
                ))
            }
        </div>
    )
}
