import _ from 'lodash';
import express from 'express';
import axios from 'axios';

import { connect } from '../../helpers/connect.js';
import { generateSnowflake, isMainEntry } from '../../helpers/utils.js';
import { Profile } from '../users/users.storage.js';
import { Page } from './pages.storage.js';
import { getDescription } from '../../components/scripts/utils.js';
import { UserFile } from '../files/userFiles.storage.js';
import { getImageURL } from '../../shared.js';
import { saveFile } from '../files/userFiles.js';
import { createThumbnails } from '../files/images.js';

export const router = express.Router();

export const getPage = async(url) => {
    if (url.startsWith('/')) {
        url = url.substr(1);
    }
    url = decodeURI(url);
    const ps = url.split('/');
    const username = (ps[0] === 'browse' && ps.length > 1) ? (ps[1]) : ps[0];
    const profile = await Profile.findOne({ url: username.toLowerCase() }).lean().exec();
    if (profile) {
        const image = profile.avatar ? await UserFile.findOne({ _id: profile.avatar }).lean().exec() : null;
        // https://old.reddit.com/r/discordapp/comments/82p8i6/a_basic_tutorial_on_how_to_get_the_most_out_of/
        return {
            type: 'profile',
            id: profile._id,
            description: getDescription(profile.bio),
            title: `${ profile.username } on vrerp.net`,
            username: profile.username,
            image: profile.avatar ? getImageURL(image, 'thumbnail'): null,
        };
    }
    const page = await Page.findOne({ url: ps[0] }).lean().exec();
    if (page) {
        return { type: 'page', id: page._id, ..._.pick(page, ['description', 'content', 'title', 'url', 'subtitle']) };
    }
    return { type: 'notfound' };
};

router.get('/api/pages/:url', async (req, res, next) => {
    res.send({ status: 'ok', data: { page: await getPage(req.params.url) } });
});

export const getGuides = async() => _.keyBy(
    (await Page.find({ }).lean().exec()).map((p) => { return { type: 'page', ..._.pick(p, ['url', 'title', 'subtitle', 'description'] ) }}),
    'url');

router.get('/api/pages', async (req, res, next) => {
    res.send({ status: 'ok', data: await getGuides() });
});

async function scrapePageImage(id, url) {
    const image = await saveFile(url, {
        _id: generateSnowflake(),
        category: 'guide',
        parentId: id,
        filename: url.substring(url.lastIndexOf('/')+1),
        extension: 'jpg',
        originalUrl: url,
    });
    console.log('image', image);
    await createThumbnails(image._id, ['banner']);
    return image._id;
}

async function getPageImages(id, content) {
    const getTelegraphUrl = (url) => `https://telegra.ph${ url }`;
    const images = await UserFile.find({ parentId: id }).lean().exec();
    const knownImages = images.map((f) => f.originalUrl);
    const imgels = [];
    const recursiveWalk = (el) => {
        if (typeof el === 'string') {
            return;
        }
        if (el.tag === 'img') {
            const url = getTelegraphUrl(_.get(el, ['attrs', 'src']));
            console.log('url', url);
            imgels.push([ el, url ]);
        }
        if (el.children) {
            el.children.forEach((ch) => recursiveWalk(ch));
        }
    }
    content.forEach(c => recursiveWalk(c));
    if (imgels.length > 0) {
        await Promise.all(imgels.map(async ([ el, url ]) => {
            console.log(el, url);
            let imageId = null;
            if (!knownImages.includes(url)) {
                imageId = await scrapePageImage(id, url);
            } else {
                imageId = images.filter((f) => f.originalUrl === url)[0]._id;
            }
            el.imageId = imageId;
        }));
    }
    // console.log(imgels);
    return content;
}

export const refreshPage = async(page) => {
    const result = await axios.get(`https://api.telegra.ph/getPage/${ page.telegraphPage }?access_token=${ process.env.TELEGRAPH_TOKEN }&return_content=true`);

    if (!result.data.ok) {
        throw new Error('Download error', result.data);
    }
    let content = _.get(result, 'data.result.content');
    content = await getPageImages(page._id, content);
    console.log(JSON.stringify(content));
    await Page.findOneAndUpdate({ _id: page._id }, {
        title: _.get(result, 'data.result.title'),
        subtitle: _.get(result, 'data.result.author_name'),
        description: _.get(result, 'data.result.description').split('\n')[0],
        content,
    });
    console.log(`page ${ page.url } updated`);
    return true;
};

if (isMainEntry(import.meta.url)) {
    (async () => {
        console.log('connecting');
        await connect();
        // const newpage = new Page({ _id: generateSnowflake(), url: 'The-Succubus-Role', telegraphPage: 'The-Succubus-Role-09-01' });
        // await newpage.save();
        // let p = await Page.findOne({ url:'VRChat-ERP-Avatars-quick-guide' }).lean().exec();
        // await refreshPage(p);
        // p = await Page.findOne({ url:'VRC-Kama-Sutra-or-kittens-guide-to-cuddles' }).lean().exec();
        // await refreshPage(p);
        // p = await Page.findOne({ url:'The-Succubus-Role' }).lean().exec();
        // await refreshPage(p);
    })();
}
