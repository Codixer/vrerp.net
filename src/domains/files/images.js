import sharp from "sharp";
import { getBucketFilename } from "../../shared.js";
import { Bucket, download, putFile } from "./userFiles.js";
import { UserFile } from "./userFiles.storage.js";

const thumbnailResize = { width: 375, height: 375 };
const bannerResize = { width: 628 };

export async function generateThumbnail(data, extension) {
  let res = sharp(data).resize(thumbnailResize.width);
  if (extension === "jpg") {
    res = res.jpeg({ mozjpeg: true });
  }
  return res.toBuffer();
}

export async function generateBanner(data, extension) {
  let res = sharp(data).resize(bannerResize.width);
  if (extension === "jpg") {
    res = res.jpeg({ mozjpeg: true });
  }
  return res.toBuffer();
}

export async function createThumbnails(fid, thumbnails) {
  const file = await UserFile.findOne({ _id: fid }).lean().exec();
  if (!file || !file.imageSizes) {
    return false;
  }
  const newSizes = thumbnails.filter((t) => !file.imageSizes.includes(t));
  if (newSizes.length === 0) {
    return false;
  }
  const link = `https://cdn.vrerp.net/${getBucketFilename(file, "original")}`;
  console.log(link);
  const { data } = await download(link);
  if (newSizes.includes("thumbnail")) {
    console.log(
      `creating thumbnail for ${getBucketFilename(file, "original")}`
    );
    const thumb = await generateThumbnail(data, file.extension);
    await putFile(file, thumb, "thumbnail");
  }
  if (newSizes.includes("banner")) {
    console.log(`creating banner for ${getBucketFilename(file, "original")}`);
    const thumb = await generateBanner(data, file.extension);
    await putFile(file, thumb, "banner");
  }
  return true;
}
