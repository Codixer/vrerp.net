import { h } from 'preact';
import { Link } from '../../site/Elements.js';
import { Paragraph, Heading, Avatar, Text, List, Button } from '@dracula/dracula-ui'

import style from './RegisterCTA.css';

export const RegisterCTA = () => (
    <div className='app bottom-box'>
        <Text><Link href='/'>Sign up for vr erp</Link>, and make your fantasies come true in virtual reality!</Text>
    </div>
);
