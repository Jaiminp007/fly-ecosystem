// Dev diagnostic: taste predictions on current good vs bad kinds, weights, around rule switches.
import { STRAINS } from './run.mjs';
import { Microverse } from './sim.mjs';
import { CONFIG } from './config.mjs';
const [seed = 105, from = 2800, to = 3700, every = 100, name = 'FIXED'] = process.argv.slice(2).map((x, i) => i < 4 ? +x : x);
const w = new Microverse(seed, { [name]: STRAINS[name] }, CONFIG), m = v => v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN;
const pred = (b, bits) => { const t = b.taste, n = t.masks.length; let z = Math.log(3); for (let i = 0; i < n; i++) { let v = 1; for (let k = 0; k < 8; k++) if (t.masks[i] >> k & 1) v *= bits[k]; z += t.w[i] * v / Math.sqrt(n); } return .05 + .9 / (1 + Math.exp(-z)); };
for (let t = 1; t <= to && w.flies.length; t++) { w.step();
  if (t >= from && t % every === 0) { const good = w.codes.filter((_, k) => w.kindValence[k] > 0), bad = w.codes.filter((_, k) => w.kindValence[k] < 0);
    const pg = m(w.flies.map(f => m(good.map(c => pred(f.brain, c))))), pb = m(w.flies.map(f => m(bad.map(c => pred(f.brain, c)))));
    const wabs = m(w.flies.map(f => m(f.brain.taste.w.map(Math.abs)))), bias = m(w.flies.map(f => f.brain.taste.w[0])), age = m(w.flies.map(f => f.age));
    console.log(t, w.rule.family, 'pop', w.flies.length, 'nGood', good.length, 'p(good)', pg.toFixed(2), 'p(bad)', pb.toFixed(2), '|w|', wabs.toFixed(2), 'bias', bias.toFixed(2), 'age', age.toFixed(0), 'E', m(w.flies.map(f => f.energy)).toFixed(1)); } }
