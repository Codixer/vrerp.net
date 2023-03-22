import { h } from 'preact';
import Helmet from 'preact-helmet';
import { Text } from '@dracula/dracula-ui';

import Header from '../../site/Header.js';

import style from './PageRenderer.css';
import { Image, Link } from '../../site/Elements.js';

const rewriteAttrs = (tag, attrs) => {
    const res = { ...attrs };
    if (tag === 'img') {
        res.src = `https://telegra.ph${ attrs.src }`;
    }
    return res;
};

const ElementRenderer = ({ tag, attrs, children, ...props }) => {
    const ElementTag = tag;
    if ((tag === 'img') && (props.imageId)) {
        return <Image file={{ category: 'guide', extension: 'jpg', id: props.imageId }} size='banner' />
    }
    return (
        <ElementTag { ...rewriteAttrs(tag, attrs) }>
            {
                children && <ChildRenderer data={ children } />
            }
        </ElementTag>
    );
}

const ChildRenderer = ({ data }) => data.map((d, index) => (typeof d === 'string' ? <span>{ d }</span> : <ElementRenderer key={ index } { ...d } />));

const PageRenderer = ({ content, description, title, subtitle }) => {
    return (
        <div className="static-page">
            <Helmet 
                title={ `${ title } - vrerp.net` }
                meta={ [
                    { name: 'description', content: description },
                    { property: 'og:type', content: 'article' },
                    { property: 'og:title', content: title },
                    { property: 'og:description', content: description },
                ] }
            />
            <Link href='/'>vrerp.net</Link>&nbsp;&nbsp;&raquo;&nbsp;&nbsp;<Link href='/guides'>Guides</Link>
            <h1>{ title }</h1>
            <Text size="sm">{ subtitle }</Text>
            {
                content && content.map((d, index) => <ElementRenderer key={ index } { ...d } />)
            }
        </div>
    );
};

export default PageRenderer;
