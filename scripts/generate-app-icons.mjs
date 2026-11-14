// Builds the app icons from the official UniFind favicon (teal background,
// prussian cap, white U). Run: node scripts/generate-app-icons.mjs
import sharp from 'sharp';

const TEAL = '#44DED1';
const PRUSSIAN = '#023055';
const CAP = '7.32 7.27 16.16 3.5 24.68 7.27 16 11.12 7.32 7.27';
const U = 'm20.17,11.09v8.79c0,1.27-.4,2.32-1.19,3.16-.79.84-1.78,1.27-2.97,1.27s-2.21-.42-2.99-1.27c-.78-.84-1.17-1.9-1.17-3.16v-8.77l-4.55-2.01v10.94c0,1.21.18,2.34.55,3.38.37,1.04.92,1.94,1.64,2.69.72.75,1.63,1.34,2.73,1.76,1.09.42,2.35.63,3.78.63s2.68-.21,3.76-.63c1.08-.42,1.98-1.01,2.71-1.76.72-.75,1.27-1.65,1.64-2.69.37-1.04.55-2.17.55-3.38v-10.94l-4.51,2Z';

// The glyph spans y 3.5 to 28.5 in a 32-unit box; its centre is (16, 16).
const svg = ({ size, scale, bg, cap = PRUSSIAN, u = '#fff' }) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}
  <g transform="translate(${size / 2} ${size / 2}) scale(${scale}) translate(-16 -16)">
    <polygon points="${CAP}" fill="${cap}"/><path d="${U}" fill="${u}"/>
  </g>
</svg>`;

const out = (s, file, flatten) =>
  (flatten ? sharp(Buffer.from(s)).flatten({ background: TEAL }) : sharp(Buffer.from(s))).png().toFile(file);

await out(svg({ size: 1024, scale: 24, bg: TEAL }), 'assets/icon.png', true);
await out(svg({ size: 512, scale: 12, bg: TEAL }), 'store-assets/android/icon-512.png', true);
await out(svg({ size: 1024, scale: 19 }), 'assets/android-icon-foreground.png');
await out(svg({ size: 1024, scale: 19, cap: '#fff' }), 'assets/android-icon-monochrome.png');
await sharp({ create: { width: 1024, height: 1024, channels: 3, background: TEAL } }).png().toFile('assets/android-icon-background.png');
console.log('icons written');
