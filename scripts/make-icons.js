// Renders the PWA / favicon PNGs from the brand SVGs (public/brand). Run: node scripts/make-icons.js
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright")); }
const fs = require("fs");
const path = require("path");

const brand = (f) => fs.readFileSync(path.join(__dirname, "..", "public", "brand", f), "utf8");
// "any" icons keep the rounded tile on a transparent corner; maskable and Apple icons are full-bleed squares (the OS rounds them).
const jobs = [
  ["bidpower-icon.svg", "app-icon-192.png", 192, true], ["bidpower-icon.svg", "app-icon-512.png", 512, true],
  ["bidpower-icon-maskable.svg", "app-icon-maskable-192.png", 192, false], ["bidpower-icon-maskable.svg", "app-icon-maskable-512.png", 512, false],
  ["bidpower-icon-maskable.svg", "apple-touch-icon.png", 180, false], ["bidpower-icon-maskable.svg", "apple-touch-icon-152.png", 152, false],
  ["bidpower-icon-small.svg", "favicon-32.png", 32, true], ["bidpower-icon-small.svg", "favicon-48.png", 48, true], ["bidpower-icon-small.svg", "favicon-96.png", 96, true],
  ["bidpower-icon.svg", "icon-144.png", 144, true],
];

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
  for (const [src, out, size, transparent] of jobs) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    const svg = brand(src).replace("<svg ", `<svg width="${size}" height="${size}" `);
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await page.screenshot({ path: path.join(__dirname, "..", "public", "icons", out), omitBackground: transparent, clip: { x: 0, y: 0, width: size, height: size } });
    await page.close();
  }
  await browser.close();
})();
