// Captures real screens of the running Cradle app for the thesis.
// 1. Start the app:   pnpm exec next dev --port 3123
// 2. Run:             node docs/report/screenshots.mjs
// Uses a separate headless Chrome (its own temporary profile) driven over the
// DevTools protocol; Node's built-in fetch and WebSocket, no packages needed.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "screens");
const BASE = process.env.APP_URL || "http://localhost:3123";
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9333;
const W = 1440, H = 900;
const only = process.argv.slice(2);

fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cradle-shots-"));
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });

async function pageSocket() {
  for (let i = 0; i < 100; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(200);
  }
  throw new Error("Chrome did not open a debugging port");
}

const ws = new WebSocket(await pageSocket());
await new Promise((res, rej) => {
  ws.addEventListener("open", res, { once: true });
  ws.addEventListener("error", () => rej(new Error("Could not connect to Chrome's DevTools socket")), { once: true });
});
console.log("connected to headless Chrome");
let nextId = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const { res, rej } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? rej(new Error(m.error.message)) : res(m.result);
  }
});
const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const id = ++nextId;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });
const js = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(`${r.exceptionDetails.text}: ${expression.slice(0, 80)}`);
  return r.result.value;
};
async function waitFor(expression, timeout = 60000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await js(`!!(${expression})`)) return;
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${expression}`);
}

// Hide the Next.js dev badge and the text caret; animations off via reduced motion.
const CLEAN = `(() => { if (document.getElementById('shot-css')) return; const s = document.createElement('style'); s.id = 'shot-css'; s.textContent = 'nextjs-portal{display:none!important} *{caret-color:transparent!important}'; document.head.appendChild(s); })()`;

async function goto(route, ready) {
  await send("Page.navigate", { url: BASE + route });
  await waitFor(`document.readyState === 'complete'`);
  await waitFor(ready, 90000);
  await js(CLEAN);
  await sleep(1200);
}
const clickText = (selector, text) =>
  js(`(() => { const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find((e) => e.textContent.replace(/\\s+/g, ' ').trim().includes(${JSON.stringify(text)})); if (!el) return false; el.scrollIntoView({ block: 'center' }); el.click(); return true; })()`);

// `until`: end the capture 32 px below the last element whose text includes these words.
async function shot(name, { height = H, top = 0, selector, until } = {}) {
  if (only.length && !only.includes(name)) return;
  let y = top;
  if (selector) y = await js(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return Math.max(0, r.top + window.scrollY - 24); })()`);
  await js(`window.scrollTo(0, 0)`);
  if (until) {
    const bottom = await js(`(() => { const hits = [...document.querySelectorAll('button, a, li, p, h2, h3, span')].filter((e) => e.textContent.includes(${JSON.stringify(until)})); const el = hits.at(-1); return el ? el.getBoundingClientRect().bottom + window.scrollY : null; })()`);
    if (bottom == null) throw new Error(`${name}: no element with "${until}"`);
    height = Math.ceil(bottom + 32 - y);
  }
  await sleep(300);
  const { data } = await send("Page.captureScreenshot", { format: "jpeg", quality: 90, captureBeyondViewport: true, clip: { x: 0, y, width: W, height, scale: 1 } });
  fs.writeFileSync(path.join(OUT, `${name}.jpg`), Buffer.from(data, "base64"));
  console.log(`saved ${name}.jpg (${W}×${height} at y=${Math.round(y)})`);
}

try {
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: false });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }, { name: "prefers-color-scheme", value: "light" }] });

  // Three wall templates become three saved projects, for the Compare tab.
  for (const title of ["1 m³ fly ash–lime brick masonry", "1 m³ AAC block masonry", "1 m³ clay brick masonry"]) {
    await goto("/", `[...document.querySelectorAll('button')].some((b) => b.textContent.includes(${JSON.stringify(title)}))`);
    await clickText("button", title);
    await waitFor(`location.pathname.startsWith('/project/') && [...document.querySelectorAll('[role=tab]')].length > 0`);
  }
  await sleep(800);
  await js(CLEAN);
  await clickText("[role=tab]", "Compare");
  await sleep(800);
  await clickText("label", "Fly ash");
  await clickText("label", "AAC");
  await sleep(1200);
  await shot("compare", { height: 440 });

  // The validated building: ledger and results.
  await goto("/", `[...document.querySelectorAll('button')].some((b) => b.textContent.includes('Residential quarters'))`);
  await clickText("button", "Residential quarters");
  await waitFor(`location.pathname.startsWith('/project/') && [...document.querySelectorAll('[role=tab]')].length > 0`);
  await sleep(1500);
  await js(CLEAN);
  await shot("ledger", { height: 1000 });
  await clickText("[role=tab]", "Results");
  await sleep(2500);
  await shot("results", { height: 1150 });
  await clickText("[role=tab]", "Report");
  await sleep(2000);
  await shot("report", { height: 1100 });

  // Library and method pages.
  await goto("/library", `document.querySelector('h1')`);
  await shot("library", { height: 1000 });
  await goto("/method", `document.querySelector('h1')`);
  await shot("method", { height: 1000 });

  // AI draft: the model sizes the work item; cited CPWD coefficients give the materials.
  if (!only.length || only.includes("ai-draft")) {
    await goto("/import", `document.querySelector('textarea')`);
    await js(`(() => { const t = document.querySelector('textarea'); const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; set.call(t, '230 mm thick clay brick wall in cement mortar 1:6, 3 m high and 4 m long'); t.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await sleep(400);
    await js(`document.querySelector('textarea').closest('form').requestSubmit()`);
    await waitFor(`document.querySelector('table')`, 90000);
    await sleep(1500);
    await js(CLEAN);
    await shot("ai-draft", { until: "to the ledger" });
  }
  // Home page last, so "Your projects" lists the saved projects.
  await goto("/", `document.querySelector('h1')`);
  await shot("home", { until: "Fly ash–lime (FaL-G) brickwork" });
} finally {
  ws.close();
  chrome.kill();
}
