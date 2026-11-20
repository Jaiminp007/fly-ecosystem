// L3-I birth audit: with mutation off, a child of a parked parent must hold active+parked masks and the full package.
import { Microverse } from '../microverse/sim.mjs';
import { STRAINS } from '../microverse/strains.mjs';
import { L3I_WORLD } from '../microverse/l3i.mjs';
let checked = 0, missing = 0, genesBad = 0;
for (const name of ['L3I_META', 'L3I_SHAM', 'L3I_METAOFF']) for (const seed of [101, 102]) {
  const w = new Microverse(seed, { X: STRAINS[name] }, { ...L3I_WORLD, mutation: 0 });
  for (let t = 0; t < 6000 && w.flies.length; t++) { w.step();
    if (t % 250) continue;
    for (const p of w.flies.filter(f => f.parked && (f.parked.taste.length || f.parked.move.length)).slice(0, 3)) {
      const want = { taste: [...p.brain.taste.masks, ...p.parked.taste.map(x => x[0])], move: [...p.brain.move.masks, ...p.parked.move.map(x => x[0])] };
      const c = w.spawn('X', null, p, p.x, p.y, 1, p.gen + 1); w.flies.pop(); checked++;
      const ct = c.brain.program.tasteMasks, cm = c.brain.program.moveMasks;
      missing += want.taste.filter(m => !ct.includes(m)).length + want.move.filter(m => !cm.includes(m)).length;
      if (c.brain.program.genes.tasteCap !== STRAINS[name].fullGenes.tasteCap || c.brain.program.genes.moveZ !== STRAINS[name].fullGenes.moveZ) genesBad++;
    } } }
console.log(JSON.stringify({ checked, missingMasks: missing, childrenWithTemporaryPackage: genesBad }));
