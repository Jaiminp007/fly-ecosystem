import {readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {interval95} from '../learning/tasks.mjs';

const directory=resolve(process.argv[2]||''),read=async name=>JSON.parse(await readFile(join(directory,name)));
const result=await read('results.json'),p=await read('protocol.json'),development=await read('development.json'),heldout=await read('heldout.json'),memory=await read('memory.json'),developmentMemory=await read('development-memory.json');
assert.deepEqual(result.protocol,p);assert.deepEqual(result.locked,await read('locked-selection.json'));
assert.deepEqual(development.map(r=>r.seed),p.developmentSeeds);assert.deepEqual(heldout.map(r=>r.seed),p.heldoutSeeds);
assert.equal(new Set([...p.developmentSeeds,...p.heldoutSeeds]).size,development.length+heldout.length);
let worlds=0,maxAccountingResidual=0;
for(const row of [...development,...heldout])for(const arms of Object.values(row.environments)){
 assert.equal(new Set(Object.values(arms).map(a=>a.founderHash)).size,1);
 for(const a of Object.values(arms)){worlds++;maxAccountingResidual=Math.max(maxAccountingResidual,Math.abs(a.accountingResidual));assert.ok(Math.abs(a.accountingResidual)<1e-6);assert.equal(a.ticks,p.horizonTicks);}
}
const comparison=(rows,a,b)=>Object.fromEntries(Object.keys(p.environments).map(e=>[e,Object.fromEntries(['energy','population'].map(k=>[k,interval95(rows.map(r=>r.environments[e][a][k]-r.environments[e][b][k]))]))]));
for(const control of Object.keys(result.comparisons))assert.deepEqual(comparison(heldout,'learned',control),result.comparisons[control]);
const memoryPass=m=>{const s=m.summary,g=p.gates;return s.aAfterB.ci95[0]>=g.memoryAccuracyLowerBound&&s.bAfterB.ci95[0]>=g.memoryAccuracyLowerBound&&s.aRetentionChange.ci95[0]>=g.retentionChangeLowerBound;};
for(const m of [memory,...Object.values(developmentMemory)]){
 assert.deepEqual(interval95(m.rows.map(r=>r.arms.learned.afterB.a)),m.summary.aAfterB);
 assert.deepEqual(interval95(m.rows.map(r=>r.arms.learned.afterB.b)),m.summary.bAfterB);
 assert.deepEqual(interval95(m.rows.map(r=>r.arms.learned.afterB.a-r.arms.learned.beforeB.a)),m.summary.aRetentionChange);
}
for(const rank of result.locked.rankings){
 for(const control of Object.keys(rank.comparisons))assert.deepEqual(comparison(development,rank.id,control),rank.comparisons[control]);
 const c=rank.comparisons,metrics=Object.values(c).flatMap(v=>Object.values(v)),energyMetrics=[...['frozen','noMemory','neural'].flatMap(k=>Object.values(c[k])),c.incumbent.relocation];
 const eligible=memoryPass(developmentMemory[rank.id])&&metrics.every(v=>v.population.mean>=0)&&c.incumbent.stable.energy.mean>=p.gates.stableIncumbentEnergyLowerBound&&c.incumbent.relocation.energy.mean>0;
 assert.equal(eligible,rank.eligible);assert.equal(memoryPass(developmentMemory[rank.id]),rank.memoryPassed);assert.equal(Math.min(...energyMetrics.map(v=>v.energy.mean)),rank.score);
}
const sorted=[...result.locked.rankings].sort((a,b)=>Number(b.eligible)-Number(a.eligible)||b.score-a.score||a.id.localeCompare(b.id));assert.equal(sorted[0].id,result.locked.id);
const c=result.comparisons,g=p.gates,habitatPassed=p.requiredControls.every(k=>Object.values(c[k]).every(v=>v.energy.ci95[0]>g.energyDifferenceLowerBound&&v.population.mean>=g.populationDifferenceMeanMinimum));
const incumbentPassed=c.incumbent.stable.energy.ci95[0]>g.stableIncumbentEnergyLowerBound&&c.incumbent.stable.population.mean>=0&&c.incumbent.relocation.energy.ci95[0]>g.relocationIncumbentEnergyLowerBound&&c.incumbent.relocation.population.mean>=0;
assert.equal(habitatPassed,result.habitatPassed);assert.equal(incumbentPassed,result.incumbentPassed);assert.equal(memoryPass(memory),result.memoryPassed);assert.equal(habitatPassed&&incumbentPassed&&memoryPass(memory),result.passed);
for(const[file,hash]of Object.entries(p.diagnosisSha256)){const path=join(directory,'diagnoses',file.split('/').at(-2)+'-'+file.split('/').at(-1));assert.equal(createHash('sha256').update(await readFile(path)).digest('hex'),hash);}
for(const[file,hash]of Object.entries(p.sourceSha256))assert.equal(createHash('sha256').update(await readFile(join(directory,'sources',file))).digest('hex'),hash);
assert.equal(createHash('sha256').update(await readFile(join(directory,'reference-study.json'))).digest('hex'),p.referenceSha256);
const report={at:new Date().toISOString(),worlds,developmentSeedPairs:development.length,heldoutSeedPairs:heldout.length,maxAccountingResidual,passed:result.passed,checks:['seed separation and complete paired outcomes','matched founder hashes and energy ledgers','all development/held-out comparisons recomputed','development eligibility, ranking and frozen selection recomputed','memory-component intervals recomputed from raw trial scores','all qualification gates recomputed','archived causal-fork and retrieval diagnosis hashes','archived algorithm and reference hashes'],limitations:['Audit does not replay all worlds','Cue task exercises the retrieval representation but not TD bootstrapping','No same-body retention qualification or RSI claim']};
await writeFile(join(directory,'audit.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
