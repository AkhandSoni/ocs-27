import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Deterministic vector compositions with authentic vendored tool marks.
// No image-generation output, raster illustration or external runtime request.
const directory = fileURLToPath(new URL('../public/domains/', import.meta.url));
await mkdir(directory, { recursive: true });
const themes = {
  tech: { base: '#071641', light: '#154fbb', glow: '#438cfe', hero: 'react', support: ['nodejs', 'docker', 'postgresql'], motif: 'orbit' },
  research: { base: '#141530', light: '#534887', glow: '#b5a3e8', hero: 'jupyter', support: ['python', 'numpy', 'latex'], motif: 'orbit' },
  'competitive-coding': { base: '#071e27', light: '#12536a', glow: '#65c6c5', hero: 'cpp', support: ['leetcode', 'python', 'codeforces'], motif: 'track' },
  design: { base: '#241432', light: '#693e79', glow: '#f29ac8', hero: 'figma', support: ['photoshop', 'blender', 'illustrator'], motif: 'ribbon' },
  management: { base: '#092a2a', light: '#306565', glow: '#d4bf8d', hero: 'notion', support: ['trello', 'sheets', 'slack'], motif: 'board' },
};
const logos = new Map();
async function logo(name, x, y, size) {
  if (!logos.has(name)) logos.set(name, await readFile(path.join(directory, 'logos', `${name}.svg`), 'utf8'));
  const source = logos.get(name);
  const viewBox = source.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 128 128';
  const body = source.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '')
    .replace(/id="([^"]+)"/g, `id="${name}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${name}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${name}-$1"`);
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${viewBox}" fill="#152239">${body}</svg>`;
}
const defs = (theme) => `<defs>
  <linearGradient id="bg" x2="1" y2=".5"><stop stop-color="${theme.base}"/><stop offset="1" stop-color="${theme.light}"/></linearGradient>
  <radialGradient id="glow"><stop stop-color="${theme.glow}" stop-opacity=".4"/><stop offset="1" stop-color="${theme.glow}" stop-opacity="0"/></radialGradient>
  <linearGradient id="porcelain" x2=".7" y2="1"><stop stop-color="#ffffff"/><stop offset=".6" stop-color="#f2f5ff"/><stop offset="1" stop-color="#b6c5e0"/></linearGradient>
  <linearGradient id="edge" x2="0" y2="1"><stop stop-color="#ced9ed"/><stop offset="1" stop-color="#5b7197"/></linearGradient>
  <filter id="shadow" x="-50%" y="-50%" width="200%" height="230%"><feDropShadow dx="0" dy="20" stdDeviation="20" flood-color="#020515" flood-opacity=".32"/></filter>
</defs>`;
function backdrop(theme, simple = false) {
  let marks = '';
  for (let i = 0; i < 52; i++) {
    const x = (i * 347 + 23) % 1600, y = (i * 137 + 41) % 780;
    marks += `<circle cx="${x}" cy="${y}" r="${i % 7 === 0 ? 1.6 : .8}" fill="#fff" opacity="${i % 3 === 0 ? '.22' : '.1'}"/>`;
  }
  let motif = '<ellipse cx="1130" cy="435" rx="390" ry="172" transform="rotate(-28 1130 435)" fill="none" stroke="#c7dcff" stroke-opacity=".2" stroke-width="1.5"/>';
  if (theme.motif === 'track') motif = '<path d="M690 940 1110 470 1660 485 M810 940 1200 570 1660 585 M930 940 1290 670 1660 685" fill="none" stroke="#b6f1df" stroke-opacity=".14" stroke-width="3"/>';
  if (theme.motif === 'ribbon') motif = '<path d="M825 950C670 655 1610 655 1360 215S870 50 990 -80" fill="none" stroke="#e6b4ed" stroke-opacity=".1" stroke-width="95"/>';
  if (theme.motif === 'board') {
    motif = '<g transform="translate(1110 600) rotate(-22) scale(1 .54)" fill="none" stroke="#d6d4bb" stroke-opacity=".18" stroke-width="2">';
    for (let i = -2; i <= 2; i++) motif += `<path d="M${i * 150} -375V375 M-375 ${i * 150}H375"/>`;
    motif += '<rect x="-375" y="-375" width="750" height="750" rx="28"/></g>';
  }
  return `<rect width="1600" height="900" fill="url(#bg)"/><ellipse cx="1190" cy="425" rx="650" ry="580" fill="url(#glow)"/>${marks}${simple ? '' : motif}`;
}
async function token(name, x, y, size, angle = 0, circle = false) {
  const r = circle ? size / 2 : size * .22;
  return `<g transform="translate(${x} ${y}) rotate(${angle})" filter="url(#shadow)">
    <rect x="${-size / 2}" y="${-size / 2 + 9}" width="${size}" height="${size}" rx="${r}" fill="url(#edge)"/>
    <rect x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}" rx="${r}" fill="url(#porcelain)" stroke="#fff" stroke-opacity=".6"/>
    ${await logo(name, -size * .32, -size * .32, size * .64)}
  </g>`;
}
const wrap = (content, viewBox = '0 0 1600 900', width = 1600, height = 900) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">${content}</svg>`;
for (const [id, theme] of Object.entries(themes)) {
  const composition = defs(theme) + backdrop(theme) +
    await token(theme.support[0], 865, 415, 136, -12) +
    await token(theme.support[1], 1370, 280, 140, 12) +
    await token(theme.hero, 1135, 450, 310, -9, id !== 'design') +
    await token(theme.support[2], 1370, 650, 156, 13);
  await writeFile(path.join(directory, `${id}.svg`), wrap(composition));
  // Separate cover framing keeps the hero centered when the case is only a
  // few pixels wide on the shelf. Labels are painted separately in the scene.
  const cover = defs(theme) + backdrop(theme, true) + await token(theme.hero, 1120, 430, 365, -9, id !== 'design');
  await writeFile(path.join(directory, `${id}-cover.svg`), wrap(cover, '795 40 650 812.5', 512, 640));
}
const combined = { base: '#09142e', light: '#273763', glow: '#9ba6e9', motif: 'orbit' };
let collection = defs(combined) + backdrop(combined);
const arrangement = [
  ['jupyter', 420, 490, 190, -15], ['cpp', 1150, 370, 210, 13],
  ['notion', 1130, 630, 180, -10], ['react', 690, 380, 255, -12], ['figma', 860, 610, 230, 12],
];
for (const args of arrangement) collection += await token(...args);
await writeFile(path.join(directory, 'collection.svg'), wrap(collection));
console.log('Built six text-free vector posters and five matching disc covers.');
