
import { h } from 'preact';
import { useState, useMemo, useEffect } from 'preact/hooks';
import { useStores } from 'pullstate';
import { fetchData, fetchProfile } from '../../scripts/api.js';
import { InputArea, SuspenseBar } from '../../site/Elements.js';
import { tagIterator, TagBubble } from './TagBubble.js';

const ProfileEditTags = ({ id }) => {
    const [ loading, setLoading ] = useState(false);
    const { profileStore } = useStores();
    const profile = profileStore.useState(s => s.profiles[id], [id]) || { };
    const schema =  profileStore.useState(s => s.schema) || { };
    const schemaOrder =  profileStore.useState(s => s.schemaOrder) || { };

    const getKey = (value) => (!!value) && (value.constructor === Object) ? value.display : value;
    const hasKey = (arr, value) => (typeof arr === 'string' ? (arr === value) : (arr.includes(value)));
    const getSelected = (key, value) => (profile[key] && hasKey(profile[key], getKey(value)));
    const toggleSelected = async (key, value) => {
        let row = value;
        if (profile[key]) {
            if (Array.isArray(profile[key]) && profile[key].includes(value)) {
                row = profile[key].filter((k) => k !== value);
                row = row.length === 1 ? row[0] : row;
            } else if (Array.isArray(profile[key])) {
                row = profile[key].concat(value);
            } else if (profile[key] === value) {
                row = null;
            } else {
                row = [profile[key], value];
            }
        }
        
        await fetchProfile(id, profileStore,{ [key]: row });
    };
    return (
        <SuspenseBar height='30vh' 
            finished={ (Object.keys(profile).length > 0) && (Object.keys(schema).length > 0) }
            load={ async() => Promise.all([
                fetchProfile(id, profileStore),
                (Object.keys(schema).length === 0) && fetchData(profileStore, `/api/profiles/schema`)
            ]) }
        >
            <h3>Tags</h3>
            {
                schemaOrder.map((key) => (
                    <div key={ key }>
                        { schema[key].description ? schema[key].description : key }<br /><br />
                        {
                            schema[key].values.map((val) => (
                                <TagBubble key={ getKey(val) } selected={ getSelected(key, val) } value={ val } onClick={ () => toggleSelected(key, getKey(val)) } />
                            ))
                        }
                        <br /><br />
                    </div>
                ))
            }
        </SuspenseBar>
    );
};

export default ProfileEditTags;
