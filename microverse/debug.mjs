// Dev diagnostic: energy flow per window (per fly-tick): on-food rate, accept rate, intake, toxin, costs.
import { STRAINS } from './run.mjs';
import { Microverse } from './sim.mjs';
import { CONFIG } from './config.mjs';
const [seed = 1, ticks = 300, every = 50, name = 'FIXED'] = process.argv.slice(2);
const w = new Microverse(+seed, { [name]: STRAINS[name] }, CONFIG), sum = (v, fn) => v.reduce((a, x) => a + fn(x), 0);
let acc = { ft: 0, onFood: 0, bites: 0, good: 0, bad: 0, moved: 0, ageDeaths: 0, starve: 0 };
const s0 = { ...w.stats };
for (let t = 1; t <= +ticks && w.flies.length; t++) {
  const before = new Map(w.flies.map(f => [f.id, { x: f.x, y: f.y, g: f.eaten.good, b: f.eaten.bad }]));
  w.step();
  for (const f of w.flies) { const b = before.get(f.id); if (!b) continue; acc.ft++; const p = w.plant[w.cell(f.x, f.y)];
    if (p && p.amount > .2) acc.onFood++; acc.good += f.eaten.good - b.g; acc.bad += f.eaten.bad - b.b; if (f.x !== b.x || f.y !== b.y) acc.moved++; }
  if (t % +every === 0) {
    const f = w.flies, live = w.plant.filter(Boolean), n = acc.ft || 1;
    console.log(t, 'pop', f.length, 'E', (sum(f, x => x.energy) / (f.length || 1)).toFixed(1), 'onFood/ft', (acc.onFood / n).toFixed(3), 'good/ft', (acc.good / n).toFixed(3), 'bad/ft', (acc.bad / n).toFixed(3), 'moved', (acc.moved / n).toFixed(2),
      'food', sum(live, p => p.amount).toFixed(0), 'full plants', live.filter(p => p.amount > 3.9).length + '/' + live.length, 'births', w.stats.births, 'starved', w.stats.starved, 'aged', w.stats.aged);
    acc = { ft: 0, onFood: 0, bites: 0, good: 0, bad: 0, moved: 0 };
  }
}
