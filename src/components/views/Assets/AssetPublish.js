import { h } from 'preact';
import { useCallback } from 'preact/hooks';
import { useState } from 'react';
import { fetchPost } from '../../scripts/api.js';
import { Button, InputBox } from '../../site/Elements.js';


export const AssetPublish = () => {
    const [ loading, setLoading ] = useState(false);
    const [ url, setUrl ] = useState('');
    const [ isPosted, setIsPosted] = useState(false);
    const publishAsset = useCallback(async() => {
        setLoading(true);
        await fetchPost('/api/assets', { url });
        setLoading(false);
        setIsPosted(true);
        setUrl('');
    }, [ setIsPosted, setLoading, url, setUrl ]);
    return <div className='modal-content'>
        {
            !isPosted && <div>
                <br />
                Recommend, or promote your avis, and vibe ERP-related assets 😊
                <br /><br />
                We welcome any ERP-related item suggestions (self-promotion, or otherwise); we&apos;d especially love to feature, and promote
                more BDSM, and kink-related stuff: gags, cuffs, armbinders 💕, in avatar, or accessory form 🥰
                <br /><br />
                All items undergo mod review before publishing.
                <br /><br />
                <InputBox placeholder='https://mystore.gumroad.com/...' value={ url } onBlur={ (evt) => setUrl(evt.target.value) } /><br />
                <center><Button onClick={ publishAsset } disabled={ loading }>Publish</Button></center>
                <br />
            </div>
        }
        {
            isPosted && <div>
                <br />
                <center>
                    Asset posted 👍 will publish it once reviewed.
                    <br /><br />
                    <Button onClick={ () => setIsPosted(false) } disabled={ loading }>Publish another one</Button>
                </center>
                <br />
            </div>
        }
    </div>
};
