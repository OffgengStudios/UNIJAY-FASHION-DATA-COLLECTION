import { cp, mkdir, writeFile } from "node:fs/promises";
const raw = process.env.HAPPY_API_BASE_URL;
if (!raw) throw new Error("HAPPY_API_BASE_URL is required");
const url = new URL(raw);
if (
  url.username ||
  url.password ||
  url.pathname !== "/" ||
  url.search ||
  url.hash ||
  (url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    ))
)
  throw new Error("Use an HTTPS API origin, or loopback HTTP for local tests");
await mkdir("dist", { recursive: true });
for (const name of [
  "index.html",
  "app.js",
  "intake-contract.js",
  "style.css",
  "favicon.svg",
  "favicon.ico",
  "favicon-96x96.png",
  "apple-touch-icon.png",
  "site.webmanifest",
  "web-app-manifest-192x192.png",
  "web-app-manifest-512x512.png",
])
  await cp("data-collection-tool/" + name, "dist/" + name);
await writeFile(
  "dist/config.js",
  "window.UNIJAY_CONFIG = " +
    JSON.stringify({ apiBaseUrl: url.origin }) +
    ";\n",
);
console.log("Built static UNIJAY collector. Legacy Apps Script is excluded.");
