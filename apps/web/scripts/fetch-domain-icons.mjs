import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Authoring utility only. The site serves these small, vendored SVGs locally.
const destination = fileURLToPath(new URL('../public/domains/logos/', import.meta.url));
await mkdir(destination, { recursive: true });
const sources = [
  { repo: 'devicons/devicon', branch: 'master', license: 'LICENSE', files: {
    react: 'react/react-original.svg', nextjs: 'nextjs/nextjs-original.svg',
    nodejs: 'nodejs/nodejs-original.svg', postgresql: 'postgresql/postgresql-original.svg',
    docker: 'docker/docker-original.svg', typescript: 'typescript/typescript-original.svg',
    python: 'python/python-original.svg', jupyter: 'jupyter/jupyter-original.svg',
    numpy: 'numpy/numpy-original.svg', latex: 'latex/latex-original.svg',
    pandas: 'pandas/pandas-original.svg', cpp: 'cplusplus/cplusplus-original.svg',
    figma: 'figma/figma-original.svg', blender: 'blender/blender-original.svg',
    photoshop: 'photoshop/photoshop-original.svg', illustrator: 'illustrator/illustrator-plain.svg',
    aftereffects: 'aftereffects/aftereffects-original.svg', notion: 'notion/notion-original.svg',
    trello: 'trello/trello-original.svg', slack: 'slack/slack-original.svg',
  } },
  { repo: 'simple-icons/simple-icons', branch: 'develop', license: 'LICENSE.md', files: {
    owasp: 'owasp.svg', leetcode: 'leetcode.svg', codeforces: 'codeforces.svg',
    arxiv: 'arxiv.svg', zotero: 'zotero.svg', sheets: 'googlesheets.svg', miro: 'miro.svg',
  } },
];
const credits = [];
for (const source of sources) {
  const response = await fetch(`https://api.github.com/repos/${source.repo}/commits/${source.branch}`);
  if (!response.ok) throw new Error(`Cannot resolve ${source.repo}: ${response.status}`);
  const { sha } = await response.json();
  const base = `https://raw.githubusercontent.com/${source.repo}/${sha}`;
  const results = await Promise.allSettled(Object.entries(source.files).map(async ([name, relative]) => {
    const url = `${base}/icons/${relative}`;
    const result = await fetch(url);
    if (!result.ok) throw new Error(`${name}: ${result.status} ${url}`);
    const svg = await result.text();
    if (!svg.includes('<svg') || /<script|<foreignObject|onload=|href=["']https?:/i.test(svg)) throw new Error(`Unsafe icon: ${name}`);
    await writeFile(path.join(destination, `${name}.svg`), svg);
    return { name, source: url };
  }));
  for (const result of results) {
    if (result.status === 'rejected') throw result.reason;
    credits.push(result.value);
  }
  const license = await fetch(`${base}/${source.license}`);
  if (!license.ok) throw new Error(`Missing license: ${source.repo}`);
  await writeFile(path.join(destination, `${source.repo.split('/')[1]}-LICENSE.txt`), await license.text());
}
await writeFile(path.join(destination, 'sources.json'), JSON.stringify(credits, null, 2) + '\n');
console.log(`Saved ${credits.length} SVG logos and licenses.`);
