import { runWorld, STRAINS } from '../microverse/run.mjs';
import { TICKS, CONFIG } from '../microverse/config.mjs';
const spec = JSON.parse(process.argv[3] || '{}'), name = process.argv[2], base = STRAINS[name];
const strain = { ...base, ...(spec.set ?? {}), genes: { ...base.genes, ...(spec.genes ?? {}) } };
for (const seed of [101, 102, 103]) {
  const { world } = runWorld(seed, TICKS, ['X'], { every: 1000, config: CONFIG, strains: { X: strain } });
  const cnt = {}, wsum = {}; for (const f of world.flies) f.brain.move.masks.forEach((m, i) => { cnt[m] = (cnt[m] ?? 0) + 1; wsum[m] = (wsum[m] ?? 0) + f.brain.move.w[i]; });
  const n = world.flies.length; console.log(seed, 'flies', n, Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([m, c]) => `${(+m).toString(2)}:${(c / n).toFixed(2)}/w${(wsum[m] / c).toFixed(2)}`).join(' '));
}
