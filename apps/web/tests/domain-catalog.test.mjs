import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { DOMAINS, CUES, DomainSequence } from '../src/lib/domain-sequence.ts';
import { COLLECTION_POSTER, DOMAIN_CATALOG, domainPoster, domainCover, toolLogo, isDomainBootVisible } from '../src/lib/domain-catalog.ts';

test('every domain has real local artwork and every named tool logo resolves', async () => {
  assert.deepEqual(Object.keys(DOMAIN_CATALOG), DOMAINS.map(domain => domain.id));
  const files = new Set([COLLECTION_POSTER]);
  for (const domain of DOMAINS) {
    const entry = DOMAIN_CATALOG[domain.id];
    assert.equal(entry.disciplines.length, 5);
    files.add(domainPoster(domain.id)); files.add(domainCover(domain.id));
    for (const discipline of entry.disciplines) for (const tool of discipline.tools) {
      assert.ok(tool.name.length > 0);
      if (tool.logo) files.add(toolLogo(tool.logo));
    }
  }
  let size = 0;
  for (const file of files) {
    const url = new URL(`../public${file}`, import.meta.url);
    if (file.endsWith('.png')) {
      const data = await readFile(url);
      assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      assert.equal(data.readUInt32BE(16), 757); assert.equal(data.readUInt32BE(20), 690);
      assert.ok(data.length < 1_000_000, file);
      continue;
    }
    const svg = await readFile(url, 'utf8');
    const dom = new JSDOM(svg, { contentType: 'image/svg+xml' });
    try {
      assert.equal(dom.window.document.documentElement.localName, 'svg', file);
      assert.equal(dom.window.document.querySelector('script, foreignObject, image'), null, `${file}: self-contained vector artwork only`);
      assert.doesNotMatch(svg, /(?:href|src)=["']https?:/i, file);
      size += (await stat(url)).size;
      if (!file.includes('/logos/')) assert.equal(dom.window.document.querySelector('text'), null, `${file}: names belong in native UI, not artwork`);
    } finally { dom.window.close(); }
  }
  assert.ok(size < 450_000, `Entire local art and tool set stays below 450 KB (actual ${size})`);
});

test('the collection remains on screen until the drive closes and boot begins', () => {
  const sequence = new DomainSequence();
  sequence.open();
  for (let time = 0; time < 2; time += .02) sequence.update(.02);
  sequence.select(0);
  for (let time = 0; time < CUES.end + 1; time += .02) {
    sequence.update(.02);
    if (sequence.load < CUES.bootStart) assert.equal(isDomainBootVisible(sequence.state.phase), false);
    if (sequence.state.phase === 'active') assert.equal(isDomainBootVisible(sequence.state.phase), true);
  }
  assert.equal(sequence.state.phase, 'active');
});
