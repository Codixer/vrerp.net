import { h } from 'preact';
import { useStores } from 'pullstate';
import { useCallback, useState } from 'react';
import { fetchData, updateFantasyData } from '../../scripts/api.js';
import { useLocation } from '../../scripts/router.js';

import { InputArea, SuspenseBar, InputBox, Button, Image } from '../../site/Elements.js';

import FileUpload from '../../site/FileUpload.js';

import style from './FantasyEdit.css';

const FantasyEdit = ({ id }) => {
    const { route } = useLocation();
    const [ loading, setLoading ] = useState(false);
    const { profileStore } = useStores();
    const fantasy = profileStore.useState(s => s.fantasies[id], [id]) || { };
    const files = profileStore.useState(s => s.files);
    const image = files[fantasy.image];
    const handleChange = (key) => (evt) => fetchData(profileStore, `/api/fantasies/${ id }`, { [key]: evt.target.value }, updateFantasyData(id));
    const onUpload = useCallback((fid) => fetchData(profileStore, `/api/fantasies/${ id }`, { image: fid[0] }, updateFantasyData(id)), []);
    const onSubmit = useCallback(async () => {
        setLoading(true);
        await fetchData(profileStore, `/api/fantasies/${ id }`, { status: 'published' }, updateFantasyData(id));
        await fetchData(profileStore, '/api/fantasies', null, updateFantasyData());
        route('/fantasies');
        setLoading(false);
    }, []);
    return (
        <SuspenseBar height='30vh' 
            finished={ Object.keys(fantasy).length > 0 }
            load={ async() => fetchData(profileStore, `/api/fantasies/${ id }`, null, updateFantasyData(id)) }
        >
            <div>
                <b>What makes your heart flutter? 💕</b><br /><br />
                <InputArea name='text' onBlur={ handleChange('text') } value={ fantasy.text } className='fantasy-edit-box' placeholder="other lewdies with..." />
                <br /><br />
                <b>(optional) source: (if pasted, respect the artist with a link to the original)</b>
                <InputBox name='link' onBlur={ handleChange('link') } value={ fantasy.link } placeholder="https://..." />
                <br /><br/>
                <FileUpload className={ `` } onUpload={ onUpload } category='fantasy' parentId={ id } >
                    {
                        image && <Image file={ image } size='thumbnail' />
                    }
                    {
                        !image && <center className="fileUpload">+ add an image</center>
                    }
                </FileUpload>
                <br /><br/>
                <Button onClick={ onSubmit } disabled={ loading } className='drac-btn drac-bg-purple drac-btn-outline drac-text-purple drac-p-sm'>Post fantasy 🦋</Button>
            </div>
        </SuspenseBar>
    );
};

export default FantasyEdit;
