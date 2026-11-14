#!/usr/bin/env node

/**
 * Captures the raw app screens for the store screenshots.
 *
 * It serves the web export of the app (react-native-web, the same screens as
 * on the phone) and opens each screen in headless Chromium. The Strapi catalog
 * and the Node API are answered with the DEMO data below, so the screenshots do
 * not depend on the CMS token or on staging content. The demo institutions are
 * fictional on purpose: a store screenshot must not state the tuition of a real
 * university.
 *
 * Output: store-assets/raw/<lang>/<device>/<screen>.png
 * Then run scripts/generate-store-assets.mjs to frame them.
 *
 *     npx expo export --platform web --output-dir dist
 *     npx playwright install chromium
 *     node scripts/capture-store-screens.mjs
 */

import { createReadStream, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import http from 'node:http';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'store-assets', 'raw');
const PORT = 4317;

/** Viewport in CSS pixels × scale = the pixel size the stores ask for. */
export const DEVICES = {
  phone: { width: 440, height: 956, scale: 3 }, // 1320 × 2868 (iPhone 6.9")
  tablet: { width: 1032, height: 1376, scale: 2 }, // 2064 × 2752 (iPad 13")
};

/** The screens, in store order. */
export const SCREENS = [
  { name: '01-home', route: '/home' },
  { name: '02-programs', route: '/find' },
  { name: '03-institution', route: '/institutions/cu' },
  { name: '04-offerings', route: '/find/offerings' },
];

// ─── Demo data ────────────────────────────────────────────────────────────────

function demoData(lang) {
  const ar = lang === 'ar';
  const t = (en, arText) => (ar ? arText : en);
  const blocks = (text) => [{ type: 'paragraph', children: [{ type: 'text', text }] }];
  const bachelor = t("Bachelor's", 'بكالوريوس');

  const institutions = [
    ['CU', 'Cedar University', 'جامعة الأرز', 'Beirut', 'بيروت', 1952],
    ['MLU', 'Mount Lebanon University', 'جامعة جبل لبنان', 'Jounieh', 'جونية', 1987],
    ['CIU', 'Coastline International University', 'جامعة الساحل الدولية', 'Saida', 'صيدا', 1994],
    ['NHU', 'Northern Hills University', 'جامعة التلال الشمالية', 'Tripoli', 'طرابلس', 1978],
    ['BVC', 'Bekaa Valley College', 'كلية البقاع', 'Zahle', 'زحلة', 2001],
    ['CDU', 'Chouf Digital University', 'جامعة الشوف الرقمية', 'Beiteddine', 'بيت الدين', 2010],
  ].map(([acronym, en, arName, city, cityAr, foundationYear], i) => ({
    id: i + 1,
    documentId: `inst${i}`,
    acronym,
    name: t(en, arName),
    slug: acronym.toLowerCase(),
    about: blocks(t(
      'A private university in Lebanon with bachelor, master and doctoral programs.',
      'جامعة خاصة في لبنان تقدّم برامج بكالوريوس وماجستير ودكتوراه.',
    )),
    foundationYear,
    featured: true,
    order: i,
    mainLocation: { street: '', city: { name: t(city, cityAr) }, country: { name: t('Lebanon', 'لبنان') } },
    tuition: [{ minTuition: 4000 + i * 1500, maxTuition: 9000 + i * 2000, tuitionType: 'yearly', degree: { title: bachelor } }],
    tags: [],
    ranking: [],
    institutionInfo: [],
  }));

  const fields = ar
    ? ['الهندسة', 'إدارة الأعمال', 'العلوم الصحية', 'علوم الحاسوب', 'الفنون والتصميم', 'العلوم الاجتماعية', 'القانون', 'التربية']
    : ['Engineering', 'Business', 'Health Sciences', 'Computer Science', 'Arts and Design', 'Social Sciences', 'Law', 'Education'];
  const icons = ['gears', 'briefcase', 'heart-pulse', 'laptop-code', 'palette', 'users', 'scale-balanced', 'book-open'];

  const programNames = ar
    ? ['علوم الحاسوب', 'هندسة مدنية', 'إدارة أعمال', 'صيدلة', 'علم النفس', 'تصميم غرافيكي']
    : ['Computer Science', 'Civil Engineering', 'Business Administration', 'Pharmacy', 'Psychology', 'Graphic Design'];
  const programs = programNames.map((name, i) => {
    const inst = institutions[i];
    return {
      id: 100 + i,
      documentId: `prog${i}`,
      name,
      slug: `program-${i}`,
      about: blocks(t(
        'An accredited university program that prepares you for the job market.',
        'برنامج جامعي معتمد يعدّك لسوق العمل.',
      )),
      degree: { id: 1, title: bachelor },
      institution: { id: inst.id, name: inst.name, acronym: inst.acronym, slug: inst.slug, tuition: inst.tuition },
      campus: [{ id: i, name: inst.name, location: inst.mainLocation }],
      nbOfYears: { min: i % 2 ? 4 : 3, max: i % 2 ? 4 : 3 },
      nbOfCredits: { min: 90 + i * 3, max: 90 + i * 3 },
      languages: [{ id: 1, language: t('English', 'الإنكليزية') }],
      specialisations: [{ name, studyField: { name: fields[i % fields.length] } }],
      tags: [],
      programInfo: [],
      requirements: [],
    };
  });

  const offeringTitles = ar
    ? ['إرشاد مهني', 'تحضير لامتحان SAT', 'مراجعة السيرة الذاتية', 'توجيه لاختيار الاختصاص']
    : ['Career Mentoring', 'SAT Preparation', 'CV Review', 'Choose Your Major'];
  const offerings = offeringTitles.map((title, i) => ({
    id: 200 + i,
    documentId: `off${i}`,
    title,
    slug: `offering-${i}`,
    featured: true,
    availableOnline: true,
    description: blocks(t('A one-to-one session with an experienced specialist.', 'جلسة فردية مع اختصاصي ذي خبرة.')),
    category: { name: t('Mentoring', 'إرشاد') },
    degreeLevel: { title: t('High school', 'ثانوي') },
  }));
  const nodeOfferings = offerings.map((o, i) => ({
    _id: `node${i}`,
    offeringContentId: String(o.id),
    slug: o.slug,
    sessionDuration: 45 + (i % 2) * 15,
    minPrice: 25 + i * 10,
    maxPrice: 40 + i * 15,
    eventTypes: [{ mode: 'online', effectivePrice: 25 + i * 10, specialistName: 'Specialist', specialistPhoto: null }],
  }));

  const page = (data) => ({ data, meta: { pagination: { page: 1, pageSize: data.length, pageCount: 1, total: data.length } } });
  const degrees = [bachelor, t("Master's", 'ماجستير'), t('Doctorate', 'دكتوراه'), t('Diploma', 'دبلوم')];

  return {
    strapi(path) {
      if (path.includes('fields-program-icons')) {
        return fields.map((name, i) => ({ fieldOfStudy: { id: i + 1, name, icon: icons[i], iconPrefix: 'fas' }, count: 12 + i * 7 }));
      }
      if (path.includes('distinct-degrees')) return degrees.map((title, i) => ({ degree: { id: i + 1, title }, count: 40 - i * 8 }));
      if (path.includes('fields-program-ids')) return fields.map((name) => ({ fieldOfStudy: { name } }));
      if (path.includes('/instituitions')) return page(institutions);
      if (path.includes('/programs')) return page(programs);
      if (path.includes('/offerings')) return page(offerings);
      return page([]);
    },
    node(path) {
      if (path.includes('/offering')) {
        return { success: true, page: 1, limit: 10, totalCount: nodeOfferings.length, totalPages: 1, data: nodeOfferings };
      }
      return { success: true, data: [] };
    },
  };
}

// ─── Static server for the web export ─────────────────────────────────────────

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf', '.json': 'application/json', '.ico': 'image/x-icon' };

function serve() {
  const server = http.createServer((req, res) => {
    const file = join(DIST, decodeURIComponent(req.url.split('?')[0]));
    let hit = [file, `${file}.html`, join(file, 'index.html')].find((f) => existsSync(f) && statSync(f).isFile());
    if (!hit && existsSync(dirname(file))) {
      // A dynamic route such as /institutions/cu is exported as institutions/[slug].html.
      const dynamic = readdirSync(dirname(file)).find((n) => /^\[.*\]\.html$/.test(n));
      if (dynamic) hit = join(dirname(file), dynamic);
    }
    hit ??= join(DIST, 'index.html');
    res.writeHead(200, { 'content-type': TYPES[extname(hit)] ?? 'application/octet-stream' });
    createReadStream(hit).pipe(res);
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

// ─── Capture ──────────────────────────────────────────────────────────────────

async function main() {
  if (!existsSync(join(DIST, 'index.html'))) {
    throw new Error('No web export in dist/. Run: npx expo export --platform web --output-dir dist');
  }
  const server = await serve();
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const json = (route, body) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

  for (const lang of ['en', 'ar']) {
    const data = demoData(lang);
    for (const [device, vp] of Object.entries(DEVICES)) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.scale,
        locale: lang === 'ar' ? 'ar-LB' : 'en-US',
      });
      await ctx.route(/cms\.unifind\.online/, (r) => json(r, data.strapi(new URL(r.request().url()).pathname)));
      await ctx.route(/unifind-lb\.org/, (r) => json(r, data.node(new URL(r.request().url()).pathname)));
      // Language choice, and the one-time welcome dialog marked as seen.
      await ctx.addInitScript((l) => {
        localStorage.setItem('uf.lang', l);
        localStorage.setItem('revamp_2026_seen_v3', 'true');
      }, lang);

      const dir = join(OUT, lang, device);
      mkdirSync(dir, { recursive: true });
      for (const screen of SCREENS) {
        const page = await ctx.newPage();
        await page.goto(`http://localhost:${PORT}${screen.route}`, { waitUntil: 'networkidle', timeout: 60_000 });
        await page.waitForTimeout(3000);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: join(dir, `${screen.name}.png`) });
        console.log(`raw ${lang}/${device}/${screen.name}.png`);
        await page.close();
      }
      await ctx.close();
    }
  }
  await browser.close();
  server.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
