import { access, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { GAMES } from '../src/lib/game-catalog.ts';

const directory = new URL('../public/games/', import.meta.url);
const jobs = GAMES.filter(game => game.steamAppId).flatMap(game => [
  { game, kind: 'cover', remote: 'library_600x900.jpg' },
  { game, kind: 'hero', remote: 'library_hero.jpg' },
]);
async function download({ game, kind, remote }) {
  const destination = new URL(`${game.id}-${kind}.jpg`, directory);
  try { await access(destination); return; } catch { /* Fetch missing files only. */ }
  const url = `https://cdn.akamai.steamstatic.com/steam/apps/${game.steamAppId}/${remote}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${game.id} ${kind}: HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 2000 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error(`${url}: expected JPEG artwork`);
  await writeFile(destination, bytes);
  console.log(`${game.id} ${kind}: ${bytes.length} bytes`);
}
for (let i = 0; i < jobs.length; i += 4) await Promise.all(jobs.slice(i, i + 4).map(download));
console.log(`Game artwork ready in ${fileURLToPath(directory)}`);
