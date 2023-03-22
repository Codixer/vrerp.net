import { h } from 'preact';
import { Link } from '../../site/Elements.js';
import { useStores } from 'pullstate';
import Helmet from 'preact-helmet';
import { useEffect } from 'preact/hooks';
import { fetchData, fetchStore } from '../../scripts/api.js';
import { Avatar, Heading, Text } from '@dracula/dracula-ui';

const Guides = ({ url }) => {
    const { siteStore } = useStores();
    const knownPages = siteStore.useState(s => Object.values(s.pages).filter(p => p.type === 'page'));
    useEffect(async () => {
        await fetchStore(`/api/pages`, null, [[ siteStore, (s, data) => s.pages = { ...s.pages, ...data }]]);
    }, [ url ]);

    return (<div>
        <Helmet title='Guides on vrerp.net' />
        <Heading>
            <Link href={ '/guides' }>
                <div className="titleContainer">
                    <Avatar title="VR ERP.net" src="https://cdn.vrerp.net/logo.jpg" displayName="logoAvatar" />
                    <div className='titleMain'>Guides</div>
                </div>
            </Link>
        </Heading>
        
        {
            knownPages.map((page) => (<div key={ page.url }>
                <h3><Link href={ `/${ page.url }` }>{ page.title }</Link><br />
                    <Text size="sm" className='graywhite'>{ page.subtitle }</Text><br />
                </h3>
                { page.description }<br /><br />
            </div>))
        }
    </div>)
};

export default Guides;
