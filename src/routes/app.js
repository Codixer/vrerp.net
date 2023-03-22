import _ from 'lodash';
import { h } from 'preact';
import render from 'preact-render-to-string'
import Helmet from 'preact-helmet';
import express from 'express';
import fs from 'fs';
import parseurl from 'parseurl';

import App from '../components/App.js'

import { PullstateCore } from "../shared.js";
import { PullstateProvider, Store  } from 'pullstate'; 

import { hydrateUser } from '../domains/users/users.js';
import { getProfile, getSchema, getProfileFiles, profileSchema, ownProfile, getProfileData, getProfileList } from '../domains/users/profiles.js';
import { getGuides, getPage } from '../domains/pages/pages.js';
import { getMatchData, getMatchDB } from '../domains/matching/matching.js';
import { Page } from '../domains/pages/pages.storage.js';
import { getFantasies, getFantasyLikes, getFantasyList } from '../domains/fantasies/fantasies.js';
import { Profile, User } from '../domains/users/users.storage.js';
import { fullAccess } from '../helpers/utils.js';
import { prerender } from '../helpers/prerender.js';
import { getAssetList } from '../domains/assets/assets.js';
import { Asset } from '../domains/assets/assets.storage.js';
import { getMediaList } from '../domains/media/media.js';

const version = process.env['GIT_REV'];

const router = express.Router();

router.use((req, res, next) => {
    req.stores = PullstateCore.instantiate({ ssr: true });
    return next();
});

const isObject = (src) => (!!src) && (src.constructor === Object);

const mergeDeep = (trg, src) => {
    Object.keys(src).map((key) => {
        trg[key] = (trg[key] && isObject(trg[key]) && isObject(src[key])) ? mergeDeep(trg[key], src[key]) : src[key];
    });
    return trg;
} 

const mergeData = (req, storeName, data) => {
    req.stores.stores[storeName].update(s => {
        s = mergeDeep(s, data);
    });
}

const assetPages = ['vrchat-avatar-assets', 'vrchat-quest-avatar-assets', 'vrchat-accessory-assets', 'vrchat-erp-assets'];

router.get('/robots.txt', async(req, res) => {
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    const pages = await Page.find({ }).lean().exec();
    res.send(`User-agent: *
Allow: /$
Allow: /robots.txt$
Allow: /sitemap.xml$
Allow: /guides$
Allow: /about$
Allow: /rules$
Allow: /static/*
${ pages.map((p) => `Allow: /${ p.url }$`).join('\n') }
${ assetPages.map((p) => `Allow: /${ p }$`).join('\n') }
Disallow: /`);
});

router.get('/sitemap.xml', async(req, res) => {
    const lastDeployed = fs.statSync(process.argv[1]).mtime.toISOString().substring(0,10);
    res.setHeader('content-type', 'application/xhtml+xml; charset=UTF-8');
    const pages = await Page.find({ }).lean().exec();
    const lastAsset = await Asset.findOne({ }).sort({ createdAt: -1 }).lean().exec();
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
             http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
             xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        
        <url>
            <loc>https://vrerp.net/</loc>
            <changefreq>daily</changefreq>
            <priority>1.0</priority>
            <lastmod>${ lastDeployed }</lastmod>
        </url>
        <url>
            <loc>https://vrerp.net/guides</loc>
            <changefreq>daily</changefreq>
            <priority>1.0</priority>
            <lastmod>${ lastDeployed }</lastmod>
        </url>
        ${ pages.map((p) => `
        <url>
            <loc>https://vrerp.net/${ p.url }</loc>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
            <lastmod>${ p.updatedAt.toISOString().substr(0, 10) }</lastmod>
        </url>

        `).join('\n') }
        ${ assetPages.map((p) => `
        <url>
            <loc>https://vrerp.net/${ p }</loc>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
            <lastmod>${ lastAsset.createdAt.toISOString().substr(0, 10) }</lastmod>
        </url>
        `).join('\n') }
        <url>
            <loc>https://vrerp.net/about</loc>
            <changefreq>daily</changefreq>
            <priority>0.7</priority>
            <lastmod>${ lastDeployed }</lastmod>
        </url>
        <url>
            <loc>https://vrerp.net/rules</loc>
            <changefreq>monthly</changefreq>
            <priority>0.4</priority>
            <lastmod>${ lastDeployed }</lastmod>
        </url>
</urlset>`);    
});

const getLayout = async (req, res) => {
    const url = parseurl(req).pathname;
    const ssrApp = <div>
        <div id="root">
            <PullstateProvider instance={ req.stores }>
                <App url={ url } />
            </PullstateProvider>
        </div>
    </div>;
    const { html, links } = await prerender(ssrApp, { renderOpts: { pretty: (process.env.MODE === 'development') } });
    // const body = render(ssrApp, {}, { pretty: (process.env.MODE === 'development') } );
    const body = html;
    const head = Helmet.rewind();
    if (head.title.toString().indexOf('Page not found') !== -1) {
        res.status(404);
    }
    if (head.title.toString().indexOf('Sign up to view this page') !== -1) {
        res.status(403);
    }

    // main html frame
    const layout =`<!DOCTYPE html>
<html lang="en">
<head>
    ${ head.title.toString().replace(/ data-preact-helmet/g, '') }
    <meta charset="UTF-8">
    ${ head.meta.toString().replace(/ data-preact-helmet/g, '') }
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/static/main.css?v=${ version }" async defer />
    <link rel="canonical" href="https://vrerp.net${ url }" />
    <link rel="dns-prefetch" href="https://cdn.vrerp.net/" >
</head>
<body>
    ${body}
    <script>window.__STATE__=${JSON.stringify({ url }).replace(/<|>/g, '')}</script>
    <script>window.__PULLSTATE__ = '${JSON.stringify(req.stores.getPullstateSnapshot()).replace(/\\/g, `\\\\`).replace(/"/g, `\\"`).replace(/'/g, `\\'`)}'</script>
    <script type="module" src="/static/client.js?v=${ version }" async defer></script>
</body>
${ (process.env.MODE === 'development') ? `<!-- ${ JSON.stringify(req.stores.getPullstateSnapshot().allState,null,4) } -->` : '' }
</html>`;
    return layout;
};

router.get('/favicon.ico', async (req, res) => {
    res.status(404).send({ 'error': 'not found' });
});

router.get('/invite/:code', async (req, res, next) => {
    const user = await User.findOne({ inviteCode: req.params.code  }).lean().exec();
    if ((!user) || (!fullAccess(user))) {
        return next();
    }
    const profileData = await getProfileList(req, [user.profileId], ['profile']);
    let expireDate = new Date();
    expireDate.setMonth(expireDate.getMonth() + 1);
    res.setHeader('Set-Cookie', `invite-code=${ req.params.code }; Expires=${ expireDate.toUTCString() }; Path=/`);
    mergeData(req, 'profileStore', JSON.parse(JSON.stringify({ ...profileData })));
    mergeData(req, 'siteStore', { view: { inviterId: user.profileId } });
    next();
});

router.get('/media/:id', async (req, res, next) => {
    const { files } = await getMediaList({ _id: req.params.id, category: 'media' });
    mergeData(req, 'profileStore', JSON.parse(JSON.stringify({ files })));
    next();
});

router.get('/fantasies', async (req, res, next) => {
    if ((!req.user) || (!fullAccess(req.user))) {
        return next();
    }
    mergeData(req, 'profileStore', JSON.parse(JSON.stringify(await getFantasyList())));
    next();
});

router.get(['/', '/:page', '/:page/:subpage', '/:page/:subpage/:subsubpage'], async (req, res, next) => {
    const url = parseurl(req).pathname;
    const urlparts = url.split('/');
    const page = await getPage(url);
    let profileIds = [];
    let matchData = { };
    if (req.user && req.user.profileId) {
        profileIds.push(req.user.profileId);
        matchData = await getMatchData(req.user.profileId.toString());
    }
    if (page.type !== 'notfound') {
        if (page.type === 'profile') {
            profileIds.push(page.id);
        }
    }
    mergeData(req, 'siteStore', { pages: { [url.substring(1)]: page } });
    if (url === '/guides') {
        mergeData(req, 'siteStore', { pages: await getGuides() });
    }
    if (url === '/fantasies/') {
        return res.redirect('/fantasies');
    }
    if (url.startsWith('/fantasies/')) {
        const fid = url.split('/')[2];
        const fantasyData = await getFantasies([fid]);
        mergeData(req, 'profileStore', JSON.parse(JSON.stringify({
            ...fantasyData,
            ...{ fantasyLikes: await getFantasyLikes([ fid ]) },
        })));
    }
    if ((urlparts.length > 1) && (urlparts[1].endsWith('-assets'))) {
        const data = await getAssetList(null, urlparts[1]);
        mergeData(req, 'profileStore', JSON.parse(JSON.stringify({
            files: data.files,
        })));
        mergeData(req, 'assetStore',  JSON.parse(JSON.stringify({
            loadedQuery: urlparts[1],
            assets: data.assets,
            assetList: data.list,
        })));
    }
    if (profileIds.length > 0) {
        const { profiles, files, fantasies, assets } = await getProfileList(req, profileIds);
        mergeData(req, 'profileStore', JSON.parse(JSON.stringify({
            ...await getSchema(),
            ...{ profiles, files, fantasies },
            ...matchData
        })));
        mergeData(req, 'assetStore', JSON.parse(JSON.stringify({
            assets
        })));
    }
    mergeData(req, 'siteStore', { ...await hydrateUser(req), url: process.env.SERVER_URL, mode: process.env.MODE });
    res.send(await getLayout(req, res));
});

router.use(async (req, res) => {
    res.status(404);
    res.send('not found');
});

export default router; 

