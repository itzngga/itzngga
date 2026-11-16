// Keeps two things in README.md fresh, without editing it by hand:
//   - the latest blog posts, read from posts/*.md
//   - the "years of coding" number, counted from the year I started
// Run with: node scripts/update-readme.mjs
import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const SITE = "https://ranggash.my.id";
const STARTED = 2019;
const LATEST = 3;

const niceDate = (date) =>
  new Date(date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

// Replaces everything between two marker comments. Fails loudly if a marker is missing.
function fill(text, name, content) {
  const start = `<!-- ${name}:START -->`;
  const end = `<!-- ${name}:END -->`;
  const a = text.indexOf(start);
  const b = text.indexOf(end);
  if (a === -1 || b < a) throw new Error(`README.md is missing the ${start} ... ${end} markers`);
  return text.slice(0, a + start.length) + content + text.slice(b);
}

const posts = [];
for (const file of (await readdir("posts")).filter((f) => f.endsWith(".md") && !f.startsWith("_"))) {
  const m = (await readFile(join("posts", file), "utf8")).match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) continue;
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^(["'])(.*)\1$/, "$2");
  }
  if (meta.draft === "true" || !meta.title || !/^\d{4}-\d{2}-\d{2}$/.test(meta.date || "")) continue;
  posts.push({ slug: file.replace(/\.md$/, ""), title: meta.title, date: meta.date });
}
posts.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

const list = posts.length
  ? posts.slice(0, LATEST).map((p) => `- [${p.title}](${SITE}/blog/${p.slug}/) · ${niceDate(p.date)}`).join("\n")
  : "- Coming soon";

let readme = await readFile("README.md", "utf8");
const before = readme;
readme = fill(readme, "BLOG-POSTS", `\n${list}\n`);
readme = fill(readme, "YEARS", String(new Date().getUTCFullYear() - STARTED));

if (readme === before) {
  console.log("README.md is already up to date");
} else {
  await writeFile("README.md", readme);
  console.log("README.md updated");
}
