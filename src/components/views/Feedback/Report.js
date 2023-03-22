import { h } from 'preact';
import { Checkbox } from '@dracula/dracula-ui';
import { useCallback, useMemo, useState } from 'preact/hooks';
import Helmet from 'preact-helmet';
import { fetchData, fetchPost } from '../../scripts/api.js';
import { useLocation } from '../../scripts/router.js';
import { Button, InputArea, InputBox, Image, outlinedButton } from '../../site/Elements.js';
import FileUpload from '../../site/FileUpload.js';
import { REPORT_TAGS } from '../../../shared.js';
import { useEffect } from 'react';

const ReportBox = ({ name, checked, onToggle, children }) => (
    <div>
        <Checkbox checked={ checked } id={ name } name={ name } color="purple" onChange={ onToggle } /><label htmlFor={ name }>{ children }</label><br /><br />
    </div>
);

const Report = ({ url, username }) => {
    const { route } = useLocation();
    const [ tags, setTags ] = useState([]);
    const [ details, setDetails ] = useState('');
    const [ loading, setLoading ] = useState(false);
    const [ image, setImage ] = useState(null);
    const [ user, setUser ] = useState('');
    const disabled = useMemo(() => !(details && details.length > 5 && tags.length > 0 && user && user.length > 1), [ user, details, tags ]);
    useEffect(() => { setUser(username); window.scrollTo(0,0); }, [ username ]);
    const toggleTag = useCallback((evt, tagname) => {
        console.log(evt);
        if (evt.target.checked) {
            setTags(tags.concat([ tagname ]));
        } else {
            setTags(tags.filter((t) => t !== tagname));
        }
    }, [ tags ]);
    const onImageUpload = useCallback(async (fid) => {
        setLoading(true);
        const data = await fetchPost(`/api/reports/images/${ fid }`, { });
        console.log(data);
        setImage(data);
        setLoading(false);
    }, [ image, setImage, setLoading ]);
    const onSubmit = useCallback(async () => {
        setLoading(true);
        await fetchPost('/api/reports', { user, tags, details, image: image ? image.id : null });
        route('/report/thanks');
        setLoading(false);
    }, [ user, tags, details, image ]);
    if (username === 'thanks') {
        return (<div>
            <h1>Report received, thanks!</h1>
            <br />
            We&apos;ll follow up with this shortly.
            <br /><br />
            <Button onClick={ () => route('/') } className={ `${ outlinedButton } drac-btn-lg` }>Back to fun 😊</Button>
        </div>);
    }
    return (<div>
        <Helmet title={ `Report misbehavior - vrerp.net` }
            meta={[
                { name: 'description', content: 'Report misbehavior in-game, or the vr erp discord' },
                { property: 'og:title', content: 'Report misbehavior -vrerp.net' },
                { property: 'og:description', content: 'Report misbehavior in-game, or the vr erp discord' },
                { property: 'og:site_name', content: 'vrerp.net' },
            ]}
        />

        <h1>Report misbehavior</h1>
        <br />
        Person to report (username, url, or discord):
        {
            username && <span>&nbsp;<b>{ username }</b></span>
        }
        {
            !username && <InputBox value={ user } onChange={ (evt) => setUser(evt.target.value) } />
        }
        <br />
        Reason for report:<br />
        <h3>⚒️ Major violations:</h3>
        {
            REPORT_TAGS.major.map(({ name, value }) => <ReportBox key={ name } name={ name } checked={ tags.includes(name) } onToggle={ (evt) => toggleTag(evt, name) } >{ value }</ReportBox>)
        }
        <br /><br />
        <h3> 🚩 Red flag violations:</h3>
        {
            REPORT_TAGS.redflag.map(({ name, value }) => <ReportBox key={ name } name={ name } checked={ tags.includes(name) } onToggle={ (evt) => toggleTag(evt, name) } >{ value }</ReportBox>)
        }
        <br /><br />
        <h3> 🟡 Yellow dot violations:</h3>
        {
            REPORT_TAGS.yellowdot.map(({ name, value }) => <ReportBox key={ name } name={ name } checked={ tags.includes(name) } onToggle={ (evt) => toggleTag(evt, name) } >{ value }</ReportBox>)
        }
        <br /><br />
        {
            (tags.length > 0) && <div>
                Please provide details, and screenshot if possible:<br />
                <InputArea name='details' onChange={ (evt) => setDetails(evt.target.value) } placeholder="please be specific" /><br />
                <FileUpload className={ `` } onUpload={ onImageUpload } category='report' >
                    {
                        image && <Image file={ image } size='thumbnail' />
                    }
                    {
                        !image && <center className="fileUpload">+ add an image</center>
                    }
                </FileUpload><br /><br />
                <Button onClick={ onSubmit } disabled={ disabled || loading } className={ `${ outlinedButton } drac-btn-lg` }>Report</Button>
                <br /><br />
                All reports undergo moderation review. <br />
                {/* Accused will have the opportunity to appeal. False accusation is a bannable offense. */}
                <br />
            </div>
        }
        

    </div>)
}

export default Report;

