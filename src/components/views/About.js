import { h } from 'preact';
import { Link } from '../site/Elements.js';
import Helmet from 'preact-helmet';

import { Paragraph, Heading, Avatar, Text, List, Button } from '@dracula/dracula-ui'


const About = () => (
    <div>
        <Helmet title={ `about vrerp.net` } />
        <Heading>
            <Link href={ '/' }>
                <div className="titleContainer">
                    <Avatar title="VR ERP.net" src="https://cdn.vrerp.net/logo.jpg" displayName="logoAvatar" />
                    <div className='titleMain'>About vrerp.net</div>
                </div>
            </Link>
        </Heading>
        <div className="drac-p-sm">
            <Text>
                vrerp.net is founded, and ran by (people), you can contact her via Codixer#2936 on Discord, 
                or <a href='mailto:vrerp@protonmail.com'>vrerp@protonmail.com</a>.
            </Text>
        </div>
    </div>
)

export default About;
