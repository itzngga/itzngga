// Builds the blog from posts/*.md into public/blog, plus the RSS feed, the sitemap
// and the "latest posts" list on the home page.
import { readFile, writeFile, readdir, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";

const SITE = "https://ranggash.my.id";
const AUTHOR = "Rangga Septian";
const BLOG_TITLE = "Rangga Septian's blog";
const BLOG_INTRO = "Notes on Go, Rust, servers and the web.";
const AVATAR = "https://avatars.githubusercontent.com/u/29621457?v=4&s=460";
const POSTS_DIR = "posts";
const PUBLIC_DIR = "public";
const BLOG_DIR = join(PUBLIC_DIR, "blog");
const IMG_DIR = "img/blog"; // inside public/: <slug>-640.webp, <slug>-1280.webp, <slug>.jpg
const HOME_LATEST = 3;

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const jsonLd = (data) => JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
const utc = (date) => new Date(date + "T00:00:00Z");
const niceDate = (date) =>
  utc(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

// Front matter is simple "key: value" lines between two "---" lines.
function parsePost(file, raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing front matter`);
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i < 1) continue;
    let value = line.slice(i + 1).trim();
    if (/^(".*"|'.*')$/.test(value)) value = value.slice(1, -1);
    meta[line.slice(0, i).trim()] = value;
  }
  for (const key of ["title", "date", "description"]) {
    if (!meta[key]) throw new Error(`${file}: missing "${key}"`);
  }
  for (const key of ["date", "updated"]) {
    if (meta[key] && !/^\d{4}-\d{2}-\d{2}$/.test(meta[key])) throw new Error(`${file}: ${key} must be YYYY-MM-DD`);
  }
  const slug = file.replace(/\.md$/, "");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error(`${file}: use lowercase letters, numbers and dashes in the file name`);

  const hasImage = existsSync(join(PUBLIC_DIR, IMG_DIR, `${slug}-1280.webp`));
  if (hasImage && !meta.image_alt) throw new Error(`${file}: has a cover image, so it needs "image_alt"`);
  const words = m[2].split(/\s+/).filter(Boolean).length;
  return {
    slug,
    title: meta.title,
    description: meta.description,
    date: meta.date,
    updated: meta.updated || meta.date,
    draft: meta.draft === "true",
    tags: (meta.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
    minutes: Math.max(1, Math.round(words / 200)),
    url: `${SITE}/blog/${slug}/`,
    image: hasImage
      ? {
          small: `/${IMG_DIR}/${slug}-640.webp`,
          large: `/${IMG_DIR}/${slug}-1280.webp`,
          share: `${SITE}/${IMG_DIR}/${slug}.jpg`,
          alt: meta.image_alt,
          credit: meta.image_credit,
          creditUrl: meta.image_url,
        }
      : null,
    html: marked.parse(m[2]),
  };
}

const tagList = (tags) =>
  tags.length ? `<ul class="tags" aria-label="Topics">${tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "";
const metaLine = (p) => `<time datetime="${p.date}">${niceDate(p.date)}</time> · ${p.minutes} min read`;

// sizes: how wide the image shows on screen, so the browser picks the right file.
const img = (image, { alt, sizes, eager = false }) =>
  `<img src="${image.large}" srcset="${image.small} 640w, ${image.large} 1280w" sizes="${sizes}" ` +
  `width="1280" height="672" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;

function page({ title, description, url, ogType, image, extraHead = "", crumbs, body }) {
  const share = image
    ? `<meta property="og:image" content="${image.share}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(image.alt)}">
<meta name="twitter:card" content="summary_large_image">`
    : `<meta property="og:image" content="${esc(AVATAR)}">
<meta name="twitter:card" content="summary">`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="${AUTHOR}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#f6f4ef" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#141513" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="${ogType}">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:site_name" content="${AUTHOR}">
<meta property="og:locale" content="en_US">
${share}
${extraHead}<link rel="icon" href="https://avatars.githubusercontent.com/u/29621457?v=4&amp;s=64">
<link rel="alternate" type="application/rss+xml" title="${esc(BLOG_TITLE)}" href="/blog/rss.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<script>
  try {
    var t = localStorage.getItem("theme");
    if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
  } catch (e) {}
</script>
<link rel="stylesheet" href="/site.css">
<script src="/theme.js" defer></script>
</head>
<body>
<div class="wrap">
  <header class="bar">
    <nav class="mono crumbs" aria-label="Breadcrumb">${crumbs}</nav>
    <button class="theme-btn" id="theme-btn" type="button" aria-label="Switch to dark theme">Dark</button>
  </header>

  <main>
${body}
  </main>

  <footer>© <span id="year">${new Date().getUTCFullYear()}</span> ${AUTHOR} · <a href="/blog/rss.xml">RSS</a></footer>
</div>
</body>
</html>
`;
}

function postPage(post) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated,
    inLanguage: "en",
    url: post.url,
    mainEntityOfPage: post.url,
    image: post.image ? post.image.share : AVATAR,
    keywords: post.tags.join(", ") || undefined,
    author: { "@type": "Person", "@id": `${SITE}/#person`, name: AUTHOR, url: `${SITE}/` },
  };
  const cover = post.image
    ? `      <figure class="cover">
        ${img(post.image, { alt: post.image.alt, sizes: "(max-width: 720px) 100vw, 680px", eager: true })}
${post.image.credit ? `        <figcaption>Photo by <a href="${esc(post.image.creditUrl)}">${esc(post.image.credit)}</a> on Unsplash</figcaption>\n` : ""}      </figure>
`
    : "";
  return page({
    title: `${post.title} · ${AUTHOR}`,
    description: post.description,
    url: post.url,
    ogType: "article",
    image: post.image,
    extraHead:
      `<meta property="article:published_time" content="${post.date}">\n` +
      `<meta property="article:modified_time" content="${post.updated}">\n` +
      `<script type="application/ld+json">\n${jsonLd(ld)}\n</script>\n`,
    crumbs: `<a href="/">${AUTHOR}</a><span aria-hidden="true">/</span><a href="/blog/">blog</a>`,
    body: `    <article class="post">
      <header class="post-head">
        <h1>${esc(post.title)}</h1>
        <p class="meta">${metaLine(post)}</p>
        ${tagList(post.tags)}
      </header>
${cover}      <div class="prose">
${post.html}      </div>
    </article>
    <nav class="post-foot" aria-label="More posts"><a href="/blog/">All posts</a></nav>`,
  });
}

// The image link repeats the title link, so it is hidden from screen readers and the tab order.
const thumb = (p, sizes, eager) =>
  p.image
    ? `<a class="thumb" href="/blog/${p.slug}/" tabindex="-1" aria-hidden="true">${img(p.image, { alt: "", sizes, eager })}</a>`
    : "";

function listPage(posts) {
  const url = `${SITE}/blog/`;
  const [first, ...rest] = posts;
  const featured = first
    ? `    <article class="featured">
      ${thumb(first, "(max-width: 640px) 100vw, 440px", true)}
      <div>
        <p class="meta">${metaLine(first)}</p>
        <h2><a href="/blog/${first.slug}/">${esc(first.title)}</a></h2>
        <p>${esc(first.description)}</p>
        ${tagList(first.tags)}
      </div>
    </article>`
    : `    <p class="empty">No posts yet.</p>`;
  const items = rest
    .map(
      (p) => `      <li>
        ${thumb(p, "(max-width: 640px) 100vw, 220px", false)}
        <div>
          <p class="meta">${metaLine(p)}</p>
          <h2><a href="/blog/${p.slug}/">${esc(p.title)}</a></h2>
          <p>${esc(p.description)}</p>
          ${tagList(p.tags)}
        </div>
      </li>`
    )
    .join("\n");
  const ld = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: BLOG_TITLE,
    description: BLOG_INTRO,
    url,
    inLanguage: "en",
    author: { "@type": "Person", "@id": `${SITE}/#person`, name: AUTHOR, url: `${SITE}/` },
    blogPost: posts.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: p.url, datePublished: p.date })),
  };
  return page({
    title: `Blog · ${AUTHOR}`,
    description: BLOG_INTRO,
    url,
    ogType: "website",
    image: first ? first.image : null,
    extraHead: `<script type="application/ld+json">\n${jsonLd(ld)}\n</script>\n`,
    crumbs: `<a href="/">${AUTHOR}</a><span aria-hidden="true">/</span><span>blog</span>`,
    body: `    <div class="blog-head">
      <h1>Blog</h1>
      <p>${esc(BLOG_INTRO)}</p>
    </div>
${featured}
${rest.length ? `    <ol class="post-list">\n${items}\n    </ol>` : ""}`,
  });
}

function rss(posts) {
  const items = posts
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${p.url}</link>
      <guid>${p.url}</guid>
      <pubDate>${utc(p.date).toUTCString()}</pubDate>
      <description>${esc(p.description)}</description>
    </item>`
    )
    .join("\n");
  const built = posts.length ? utc(posts[0].date).toUTCString() : new Date().toUTCString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(BLOG_TITLE)}</title>
    <link>${SITE}/blog/</link>
    <description>${esc(BLOG_INTRO)}</description>
    <language>en</language>
    <lastBuildDate>${built}</lastBuildDate>
    <atom:link href="${SITE}/blog/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}

function sitemap(posts) {
  const urls = [
    { loc: `${SITE}/` },
    { loc: `${SITE}/blog/`, lastmod: posts[0]?.updated },
    ...posts.map((p) => ({ loc: p.url, lastmod: p.updated })),
  ];
  const rows = urls
    .map((u) => `  <url>\n    <loc>${u.loc}</loc>\n${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ""}  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows}
</urlset>
`;
}

// Fills the space between the two markers in public/index.html. Same input, same output.
async function updateHome(posts) {
  const file = join(PUBLIC_DIR, "index.html");
  const START = "<!-- latest-posts -->";
  const END = "<!-- /latest-posts -->";
  const html = await readFile(file, "utf8");
  const a = html.indexOf(START);
  const b = html.indexOf(END);
  if (a === -1 || b < a) return;
  const indent = html.slice(html.lastIndexOf("\n", a) + 1, a);
  const rows = posts
    .slice(0, HOME_LATEST)
    .map((p) => `${indent}  <li><a href="/blog/${p.slug}/">${esc(p.title)}</a><time datetime="${p.date}">${niceDate(p.date)}</time></li>`)
    .join("\n");
  const list = posts.length ? `${indent}<ul class="latest">\n${rows}\n${indent}</ul>` : `${indent}<p class="note">No posts yet.</p>`;
  await writeFile(file, `${html.slice(0, a)}${START}\n${list}\n${indent}${END}${html.slice(b + END.length)}`);
}

// Files starting with "_" (like _template.md) are skipped, and so are posts with "draft: true".
const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
const posts = [];
for (const file of files) {
  const post = parsePost(file, await readFile(join(POSTS_DIR, file), "utf8"));
  if (!post.draft) posts.push(post);
}
posts.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

await rm(BLOG_DIR, { recursive: true, force: true });
for (const post of posts) {
  await mkdir(join(BLOG_DIR, post.slug), { recursive: true });
  await writeFile(join(BLOG_DIR, post.slug, "index.html"), postPage(post));
}
await mkdir(BLOG_DIR, { recursive: true });
await writeFile(join(BLOG_DIR, "index.html"), listPage(posts));
await writeFile(join(BLOG_DIR, "rss.xml"), rss(posts));
await writeFile(join(PUBLIC_DIR, "sitemap.xml"), sitemap(posts));
await updateHome(posts);

console.log(`Built ${posts.length} post(s) into ${BLOG_DIR}`);
