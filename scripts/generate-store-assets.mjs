#!/usr/bin/env node

/**
 * Builds the store graphics from the raw app screens.
 *
 * Input:  store-assets/raw/<lang>/<device>/<screen>.png
 *         (made by scripts/capture-store-screens.mjs) and assets/icon.png.
 * Output: store-assets/ios/iphone-6.9/<lang>/   1320 × 2868
 *         store-assets/ios/ipad-13/<lang>/      2064 × 2752
 *         store-assets/android/phone/<lang>/    1080 × 1920
 *         store-assets/android/feature-graphic.png  1024 × 500
 *         store-assets/android/icon-512.png         512 × 512
 *
 *     node scripts/generate-store-assets.mjs
 *
 * The text is SVG, rendered by sharp (librsvg). The Arabic lines need a
 * system font with Arabic glyphs (macOS has Geeza Pro).
 */

import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = join(ROOT, 'store-assets', 'raw');
const OUT = join(ROOT, 'store-assets');

/** Brand palette, from src/config/theme.ts. */
const PRUSSIAN = '#023055';
const PRUSSIAN_DARK = '#041A2E';
const TURQUOISE = '#44DED1';

const FONT = {
  en: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  ar: "'Geeza Pro', 'Noto Naskh Arabic', 'Noto Sans Arabic', Arial, sans-serif",
};

/** One headline and one sub-line per screen, in store order. */
const COPY = {
  en: {
    '01-home': ['Start your university search', 'Programs, universities and mentors in Lebanon'],
    '02-programs': ['Explore every program', 'Filter by degree, field, location and tuition'],
    '03-institution': ['Know each university', 'Overview, campus, tuition and reviews'],
    '04-offerings': ['Grow with a mentor', 'Mentoring, tutoring and career advice'],
  },
  ar: {
    '01-home': ['ابدأ البحث عن جامعتك', 'برامج وجامعات ومرشدون في لبنان'],
    '02-programs': ['استكشف كل البرامج', 'صفِّ حسب الشهادة والمجال والموقع والأقساط'],
    '03-institution': ['تعرّف على كل جامعة', 'نبذة وحرم وأقساط وتقييمات'],
    '04-offerings': ['تطوّر مع مرشد', 'إرشاد ودروس خصوصية ونصائح مهنية'],
  },
};

/** Each store size, and which raw device capture goes in it. */
const TARGETS = [
  { dir: 'ios/iphone-6.9', width: 1320, height: 2868, device: 'phone' },
  { dir: 'ios/ipad-13', width: 2064, height: 2752, device: 'tablet' },
  { dir: 'android/phone', width: 1080, height: 1920, device: 'phone' },
];

/** Composites first, then drops the alpha channel: the stores want opaque PNGs. */
async function save(base, layers, file) {
  const merged = await sharp(base).composite(layers).png().toBuffer();
  await sharp(merged).flatten({ background: PRUSSIAN }).png().toFile(file);
}

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function background(width, height) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${PRUSSIAN}"/>
      <stop offset="1" stop-color="${PRUSSIAN_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <circle cx="${width * 0.92}" cy="${height * 0.04}" r="${width * 0.42}" fill="${TURQUOISE}" fill-opacity="0.08"/>
  <circle cx="${width * 0.05}" cy="${height * 0.98}" r="${width * 0.35}" fill="${TURQUOISE}" fill-opacity="0.06"/>
</svg>`);
}

function headline(width, height, lang, title, sub) {
  const size = Math.round(Math.min(width * 0.068, height * 0.034));
  const subSize = Math.round(size * 0.52);
  const dir = lang === 'ar' ? ' direction="rtl"' : '';
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <text x="50%" y="${height * 0.075}" text-anchor="middle"${dir} font-family="${FONT[lang]}" font-weight="700" font-size="${size}" fill="#ffffff">${escape(title)}</text>
  <text x="50%" y="${height * 0.075 + size * 1.05}" text-anchor="middle"${dir} font-family="${FONT[lang]}" font-weight="500" font-size="${subSize}" fill="${TURQUOISE}">${escape(sub)}</text>
</svg>`);
}

/** The app screen with rounded corners, scaled to fit under the headline. */
async function framedScreen(file, width, height) {
  const meta = await sharp(file).metadata();
  const top = Math.round(height * 0.14);
  const scale = Math.min((width * 0.84) / meta.width, (height - top - height * 0.03) / meta.height);
  const w = Math.round(meta.width * scale);
  const h = Math.round(meta.height * scale);
  const radius = Math.round(Math.min(w, h) * 0.06);
  const border = Math.max(4, Math.round(w * 0.012));
  const mask = Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${radius}" fill="#fff"/></svg>`);
  const screen = await sharp(file)
    .resize(w, h)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
  const bw = w + border * 2;
  const bh = h + border * 2;
  const bezel = Buffer.from(`<svg width="${bw}" height="${bh}"><rect width="${bw}" height="${bh}" rx="${radius + border}" fill="#ffffff" fill-opacity="0.18"/></svg>`);
  return { bezel, screen, left: Math.round((width - bw) / 2), top, border };
}

async function screenshot(target, lang, name) {
  const { width, height, device } = target;
  const [title, sub] = COPY[lang][name];
  const f = await framedScreen(join(RAW, lang, device, `${name}.png`), width, height);
  const dir = join(OUT, target.dir, lang);
  mkdirSync(dir, { recursive: true });
  await save(background(width, height), [
    { input: headline(width, height, lang, title, sub), left: 0, top: 0 },
    { input: f.bezel, left: f.left, top: f.top },
    { input: f.screen, left: f.left + f.border, top: f.top + f.border },
  ], join(dir, `${name}.png`));
  console.log(`${target.dir}/${lang}/${name}.png`);
}

async function featureGraphic() {
  const width = 1024;
  const height = 500;
  const logo = await sharp(join(ROOT, 'assets/logos/unifind-logo-white.png')).resize({ width: 300 }).toBuffer();
  const text = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <text x="64" y="270" font-family="${FONT.en}" font-weight="700" font-size="40" fill="#ffffff">Find your university</text>
  <text x="64" y="318" font-family="${FONT.en}" font-weight="700" font-size="40" fill="#ffffff">and major in <tspan fill="${TURQUOISE}">Lebanon</tspan></text>
  <text x="64" y="370" font-family="${FONT.en}" font-weight="500" font-size="22" fill="#ffffff" fill-opacity="0.8">Programs · Institutions · Mentors</text>
</svg>`);
  // The top of the home screen, as a phone that runs off the bottom edge.
  const phoneW = 300;
  const phoneH = 440;
  const radius = 36;
  const mask = Buffer.from(`<svg width="${phoneW}" height="${phoneH}"><rect width="${phoneW}" height="${phoneH + radius}" rx="${radius}" fill="#fff"/></svg>`);
  const phone = await sharp(join(RAW, 'en', 'phone', '01-home.png'))
    .resize({ width: phoneW })
    .extract({ left: 0, top: 0, width: phoneW, height: phoneH })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
  const ring = Buffer.from(`<svg width="${phoneW + 16}" height="${phoneH + 8}"><rect width="${phoneW + 16}" height="${phoneH + 60}" rx="${radius + 8}" fill="#ffffff" fill-opacity="0.18"/></svg>`);
  mkdirSync(join(OUT, 'android'), { recursive: true });
  await save(background(width, height), [
    { input: logo, left: 64, top: 110 },
    { input: text, left: 0, top: 0 },
    { input: ring, left: 660, top: 52 },
    { input: phone, left: 668, top: 60 },
  ], join(OUT, 'android', 'feature-graphic.png'));
  console.log('android/feature-graphic.png');
}

async function playIcon() {
  await sharp(join(ROOT, 'assets/icon.png'))
    .resize(512, 512)
    .flatten({ background: PRUSSIAN })
    .png()
    .toFile(join(OUT, 'android', 'icon-512.png'));
  console.log('android/icon-512.png');
}

for (const target of TARGETS) {
  for (const lang of Object.keys(COPY)) {
    for (const name of Object.keys(COPY[lang])) {
      await screenshot(target, lang, name);
    }
  }
}
await featureGraphic();
await playIcon();
