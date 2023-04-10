import cheerio from "cheerio";
import axios from "axios";
import he from "he";
import { connect } from "../../helpers/connect.js";
import { generateSnowflake, isMainEntry } from "../../helpers/utils.js";
import { Asset } from "./assets.storage.js";
import { deleteFiles, saveFile } from "../files/userFiles.js";
import { createThumbnails } from "../files/images.js";

async function scrapeMetaInfo(url) {
  const metaInfo = {};
  let headers = {};
  if (url.match(/booth\.pm/)) {
    headers = { Cookie: "adult=t" };
  }
  const result = await axios.request({ url, method: "get", headers });
  const body = result.data;
  const $ = cheerio.load(body);
  $("meta").each((index, meta) => {
    if (!meta.attribs || (!meta.attribs.property && !meta.attribs.name)) return;
    const property = meta.attribs.property || meta.attribs.name;
    const content = meta.attribs.content || meta.attribs.value;
    metaInfo[property] = content;
  });
  return [metaInfo, $];
}

export async function refreshExternalAsset(id) {
  console.log(id);
  const asset = await Asset.findOne({ _id: id }).lean().exec();
  console.log(asset);
  const [meta, $] = await scrapeMetaInfo(asset.url);
  const isNumeric = (value) => /^-?\d+$/.test(value);
  console.log("meta", meta);
  let update = {};
  if (asset.url.match(/\.gumroad\.com/)) {
    update = {
      title: meta["og:title"],
      description: meta["og:description"],
      price: meta["product:price:amount"],
      currency: meta["product:price:currency"],
      originalImageUrl: meta["og:image"],
    };
    // const priceElement = $('div[class="price"]').text()
  } else if (asset.url.match(/payhip\.com/)) {
    update = {
      title: he.decode(meta["og:title"]),
      description: he.decode(meta["og:description"]),
      price: meta["og:price:amount"],
      currency: he.decode(meta["og:price:currency"]),
      originalImageUrl: meta["og:image"],
    };
  } else if (asset.url.match(/booth\.pm/)) {
    update = {
      title: meta["og:title"],
      description: meta["og:description"],
      originalImageUrl: meta["og:image"],
    };
    const priceElement = $('div[class*="variation-price"]');
    console.log("priceElement", priceElement);
    if (priceElement && priceElement.length > 0) {
      const pl = priceElement.first();
      const pltext = pl.text();
      const pieces = pltext.split(" ");
      console.log("pieces", pieces);
      if (pieces.length > 1 && isNumeric(pieces[0].replace(/,/g, ""))) {
        update.price = pieces[0].replace(/,/g, "");
        update.currency = pieces[1];
      } else if (pieces.length > 1 && isNumeric(pieces[1].replace(/,/g, ""))) {
        update.currency = pieces[0];
        update.price = pieces[1].replace(/,/g, "");
      }
    }
  }
  console.log("update", update);
  if (asset.originalImageUrl !== update.originalImageUrl) {
    await deleteFiles([asset.image]);
    console.log("image saving", update.originalImageUrl);
    const image = await saveFile(update.originalImageUrl, {
      _id: generateSnowflake(),
      category: "assetimage",
      parentId: id,
      filename: "image.jpg",
      extension: "jpg",
    });
    console.log("image", image);
    await createThumbnails(image._id, ["thumbnail"]);
    update.image = image._id;
  }
  const res = await Asset.findOneAndUpdate({ _id: id }, update, { new: true });
  return res;
}

export async function createAsset(params) {
  const checkAsset = await Asset.findOne({ url: params.url }).lean().exec();
  if (checkAsset) {
    return false;
  }
  const newAsset = await Asset.create({ _id: generateSnowflake(), ...params });
  await refreshExternalAsset(newAsset._id);
  return newAsset._id;
}

if (isMainEntry(import.meta.url)) {
  (async () => {
    await connect();
    // console.log(await scrapeMetaInfo('https://nachoo.gumroad.com/l/SkylarNacho'));
    console.log(await refreshExternalAsset("1016579919813136384"));
    process.exit(0);
  })();
}
