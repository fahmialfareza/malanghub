import xss from "xss";

// xss is CommonJS and attaches these helpers dynamically, so read them off the
// default export (works under Node ESM, webpack/Turbopack and Vite alike).
const {
  FilterXSS,
  friendlyAttrValue,
  safeAttrValue: defaultSafeAttrValue,
} = xss as unknown as typeof import("xss");

/**
 * Sanitizer for stored rich HTML (TinyMCE article/draft content, user bios).
 * Uses js-xss: pure JS with no DOM/jsdom dependency, so the same config runs
 * in Cloudflare workerd SSR, the browser, and the Tauri webview.
 */

const blockAttrs = ["style", "dir", "title"];
const cellAttrs = [...blockAttrs, "colspan", "rowspan", "width", "height", "scope"];

const allowedTags = {
  ...Object.fromEntries(
    [
      "p", "br", "hr", "span", "div", "strong", "b", "em", "i", "u", "s",
      "strike", "del", "ins", "sub", "sup", "small", "mark", "code", "pre",
      "kbd", "blockquote", "q", "cite", "abbr", "address", "h1", "h2", "h3",
      "h4", "h5", "h6", "ul", "li", "dl", "dt", "dd", "figcaption", "caption",
      "thead", "tbody", "tfoot", "tr",
    ].map((tag) => [tag, blockAttrs]),
  ),
  ol: [...blockAttrs, "start", "type"],
  a: [...blockAttrs, "href", "target", "rel", "id"],
  img: [...blockAttrs, "src", "alt", "width", "height", "class", "loading"],
  figure: [...blockAttrs, "class"],
  table: [...blockAttrs, "border", "cellpadding", "cellspacing", "width", "height"],
  colgroup: [...blockAttrs, "span"],
  col: [...blockAttrs, "span", "width"],
  th: cellAttrs,
  td: cellAttrs,
  // TinyMCE media plugin output. iframe src is limited to embedHosts below.
  iframe: ["src", "width", "height", "title", "allow", "allowfullscreen", "frameborder"],
  video: [...blockAttrs, "src", "poster", "controls", "width", "height", "preload"],
  audio: [...blockAttrs, "src", "controls", "preload"],
  source: ["src", "type"],
};

const embedHosts = new Set([
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
]);

// http(s), mailto, or relative (no scheme before the first / ? #).
const isSafeUrl = (value: string) =>
  /^(https?:|mailto:)/i.test(value) || !/^[^/?#]*:/.test(value);

const isAllowedEmbed = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && embedHosts.has(url.hostname);
  } catch {
    return false;
  }
};

const filter = new FilterXSS({
  whiteList: allowedTags,
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style", "noscript", "template", "textarea", "select", "title"],
  safeAttrValue(tag, name, value, cssFilter) {
    // Decodes entities and filters style via the default implementation.
    const cleaned = defaultSafeAttrValue(tag, name, value, cssFilter);
    if (name !== "href" && name !== "src" && name !== "poster") return cleaned;

    const url = friendlyAttrValue(value).trim();
    if (tag === "iframe") return isAllowedEmbed(url) ? cleaned : "";
    // Pasted images may be inlined as raster data URLs.
    if (tag === "img" && /^data:image\/(png|jpe?g|gif|webp);/i.test(url)) {
      return cleaned;
    }
    return cleaned && isSafeUrl(url) ? cleaned : "";
  },
});

export const sanitizeHtml = (html: string = "") => filter.process(html);
