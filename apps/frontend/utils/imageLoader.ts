// Custom next/image loader for Cloudflare Workers (no built-in optimizer there).
// Cloudinary images are resized by Cloudinary's URL transformations; other
// sources (local assets, Google avatars) are served as-is.
interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/;
// A transformation segment looks like "w_400,c_fill" (comma-separated key_value pairs).
const TRANSFORM_SEGMENT = /^[a-z]{1,3}_[^/]+(,[a-z]{1,3}_[^/]+)*\//;

export default function imageLoader({ src, width, quality }: ImageLoaderParams) {
  const match = src.match(CLOUDINARY_UPLOAD);
  if (!match) return src;

  const [, prefix, rest] = match;
  if (TRANSFORM_SEGMENT.test(rest)) return src;

  return `${prefix}f_auto,q_${quality ?? "auto"},w_${width},c_limit/${rest}`;
}
