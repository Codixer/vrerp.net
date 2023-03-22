import { h } from 'preact';
import { useStores } from 'pullstate';
import { tagIterator, TagBubble } from './TagBubble.js';


export const ProfileViewTags = ({ profile }) => {
    const { profileStore } = useStores();    
    const schemaOrder =  profileStore.useState(s => s.schemaOrder) || { };

    return (<div>
        {
            schemaOrder.filter(key => (!['discordcolor', 'discordpings', 'kinks'].includes(key))).map((key) => (
                <span key={ key } >
                    {
                        tagIterator(profile[key]).map((val) => (
                            <TagBubble key={ val } selected={ true } value={ val } />
                        ))
                    }
                    {
                        (['age', 'setup', 'toys', 'directmessages'].includes(key)) && <br />
                    }
                </span>
            ))
        }
        {
            (profile.kinks) && <div><br />Kinks:<br /><br /> 
                <span key='kinks'>
                    {
                        tagIterator(profile.kinks).map((val) => (
                            <TagBubble key={ val } selected={ true } value={ val } />
                        ))
                    }
                </span>
            </div>

        }
    </div>)
}
