// CODEBOOK_PHYLOGENY_V1 helper: dump canonical codebook fingerprints per cueSeed.
// Usage: node scripts/dump-codebooks.mjs < seeds.txt > codebooks.json
// Zero worlds: pure RNG/shuffle code path, no agents, no ticks.
import {makeCueCodebook} from '../learning/cue-foraging.mjs';
import fs from 'node:fs';
const seeds = fs.readFileSync(0, 'utf8').split(/\s+/).filter(Boolean).map(Number);
const out = {};
for (const s of seeds) {
  const cb = makeCueCodebook(s);
  const byId = {};
  for (const fam of ['A', 'B', 'C'])
    for (const c of cb[fam]) byId[c.id] = [fam, c.valence];
  out[s] = byId;
}
console.log(JSON.stringify(out));
