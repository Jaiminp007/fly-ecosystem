import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const directory=resolve(process.argv[2]||''),load=async name=>JSON.parse(await readFile(join(directory,name),'utf8'));
const p=await load('protocol.json'),r=await load('results.json'),development=await load('development.json'),heldout=await load('heldout.json'),developmentMemory=await load('development-memory.json'),memory=await load('memory.json'),reference=await load('reference-study.json');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.deepEqual(r.protocol,p);assert.equal(p.experiment,'pooled-local-return-prior');assert.equal(p.developmentSeeds.length,12);assert.equal(p.heldoutSeeds.length,30);
assert.equal(new Set([...p.developmentSeeds,...p.heldoutSeeds]).size,p.developmentSeeds.length+p.heldoutSeeds.length);
assert.deepEqual(development.map(row=>row.seed),p.developmentSeeds);assert.deepEqual(heldout.map(row=>row.seed),p.heldoutSeeds);
assert.deepEqual(p.candidates,[1,4].map(priorStrength=>({id:'prior-'+priorStrength,parameters:{...reference.protocol.parameters,priorStrength}})));
assert.deepEqual(p.incumbent,reference.protocol.parameters);assert.deepEqual(p.actorParameters,reference.protocol.actorParameters);
assert.equal(p.founders,reference.protocol.founders);assert.equal(p.horizonTicks,reference.protocol.horizonTicks);assert.ok(reference.passed);
assert.deepEqual(p.environments.stable,reference.protocol.environment);assert.deepEqual(p.environments.relocation,{...reference.protocol.environment,ecology:'relocation'});
for(const [file,sha]of Object.entries(p.sourceSha256))assert.equal(hash(await readFile(join(directory,'sources',file))),sha,'Archived source mismatch: '+file);
assert.equal(hash(await readFile(join(directory,'reference-study.json'))),p.referenceSha256);
for(const [index,[,sha]]of Object.entries(p.diagnosisSha256).entries())assert.equal(hash(await readFile(join(directory,'diagnosis-'+index+'.json'))),sha);
for(const registry of p.seedRegistries){const bytes=await readFile(registry.path);assert.equal(hash(bytes),registry.sha256);const old=JSON.parse(bytes);for(const key of ['seeds','developmentSeeds','heldoutSeeds','probeSeeds'])for(const seed of old[key]||[])assert.ok(!p.developmentSeeds.includes(seed)&&!p.heldoutSeeds.includes(seed));if(Number.isInteger(old.seed))assert.ok(!p.developmentSeeds.includes(old.seed)&&!p.heldoutSeeds.includes(old.seed));}

function interval(values){const n=values.length,mean=values.reduce((a,b)=>a+b,0)/n;if(n<2)return{mean,ci95:[null,null],n};const sd=Math.sqrt(values.reduce((sum,x)=>sum+(x-mean)**2,0)/(n-1)),t=n>=30?2.045:n>=20?2.093:n>=10?2.262:3.182,half=t*sd/Math.sqrt(n);return{mean,ci95:[mean-half,mean+half],n};}
const compare=(rows,a,b)=>Object.fromEntries(Object.keys(p.environments).map(env=>[env,Object.fromEntries(['energy','population'].map(key=>[key,interval(rows.map(row=>row.environments[env][a][key]-row.environments[env][b][key]))]))]));
const memorySummary=m=>{const rows=m.rows;return{aBeforeB:interval(rows.map(row=>row.arms.learned.beforeB.a)),aAfterB:interval(rows.map(row=>row.arms.learned.afterB.a)),bAfterB:interval(rows.map(row=>row.arms.learned.afterB.b)),aRetentionChange:interval(rows.map(row=>row.arms.learned.afterB.a-row.arms.learned.beforeB.a)),afterMixed:interval(rows.map(row=>row.arms.learned.afterMixed.combined)),controls:Object.fromEntries(['frozen','reset','memoryReset','contextReset'].map(arm=>[arm,interval(rows.map(row=>row.arms.learned.afterMixed.combined-row.arms[arm].afterMixed.combined))]))};};
const memoryPass=m=>{const s=memorySummary(m),g=p.gates;assert.deepEqual(s,m.summary);return s.aAfterB.ci95[0]>=g.memoryAccuracyLowerBound&&s.bAfterB.ci95[0]>=g.memoryAccuracyLowerBound&&s.aRetentionChange.ci95[0]>=g.retentionChangeLowerBound;};
const expectedDevelopmentArms=['incumbent','neural',...p.candidates.flatMap(c=>[c.id,c.id+'-frozen',c.id+'-noMemory'])],expectedHeldoutArms=['learned','frozen','noMemory','incumbent','neural','fullRange'];let worlds=0,maxAccountingResidual=0;
for(const [rows,arms]of [[development,expectedDevelopmentArms],[heldout,expectedHeldoutArms]])for(const row of rows){assert.deepEqual(Object.keys(row.environments),Object.keys(p.environments));for(const outcomes of Object.values(row.environments)){
  assert.deepEqual(Object.keys(outcomes),arms);assert.equal(new Set(Object.values(outcomes).map(o=>o.founderHash)).size,1);
  for(const o of Object.values(outcomes)){
    worlds++;assert.equal(o.seed,row.seed);assert.ok(o.ticks===p.horizonTicks||o.population===0);assert.ok(o.ticks<=p.horizonTicks);
    assert.ok(Number.isInteger(o.population)&&o.population>=0&&o.population<=p.founders);
    for(const key of ['energy','food','expenditure','accountingResidual'])assert.ok(Number.isFinite(o[key]));
    maxAccountingResidual=Math.max(maxAccountingResidual,Math.abs(o.accountingResidual));assert.ok(Math.abs(o.accountingResidual)<1e-6);
    assert.ok(Math.abs(o.energy-(o.food-o.expenditure)/p.founders)<1e-7);
    const b=o.behavior;for(const key of Object.keys(b))assert.ok(Number.isSafeInteger(b[key])&&b[key]>=0);assert.ok(b.oneSupported+b.neitherSupported<=b.decisions);assert.ok(b.zeroMissingPreferred<=b.oneSupported);assert.ok(b.priorChangedGreedy<=b.decisions);
  }
  for(const [arm,o]of Object.entries(outcomes))if(!['incumbent','neural'].includes(arm))assert.equal(o.behavior.zeroMissingPreferred,0,'Pooled prior assigned an unsupported-zero preference');
}}
for(const c of p.candidates){assert.deepEqual(developmentMemory[c.id].rows.map(row=>row.seed),p.developmentSeeds);memoryPass(developmentMemory[c.id]);}
const rankings=p.candidates.map(c=>{const comparisons={frozen:compare(development,c.id,c.id+'-frozen'),noMemory:compare(development,c.id,c.id+'-noMemory'),incumbent:compare(development,c.id,'incumbent'),neural:compare(development,c.id,'neural')},metrics=Object.values(comparisons).flatMap(v=>Object.values(v)),ranked=[...['frozen','noMemory','neural'].flatMap(k=>Object.values(comparisons[k])),comparisons.incumbent.relocation],mp=memoryPass(developmentMemory[c.id]);return{...c,memoryPassed:mp,eligible:mp&&metrics.every(m=>m.population.mean>=0)&&comparisons.incumbent.stable.energy.mean>=p.gates.stableIncumbentEnergyLowerBound&&comparisons.incumbent.relocation.energy.mean>0,score:Math.min(...ranked.map(v=>v.energy.mean)),comparisons};});
rankings.sort((a,b)=>Number(b.eligible)-Number(a.eligible)||b.score-a.score||a.id.localeCompare(b.id));
assert.deepEqual(r.locked.rankings,rankings);const {rankings:ignoredRankings,lockedAt,...locked}=r.locked;assert.deepEqual(locked,rankings[0]);assert.ok(Date.parse(lockedAt)<Date.parse(r.completedAt));
assert.deepEqual(r.locked,await load('locked-selection.json'));
assert.deepEqual(memory.rows.map(row=>row.seed),p.heldoutSeeds);const memoryPassed=memoryPass(memory);
const comparisons=Object.fromEntries(expectedHeldoutArms.filter(k=>k!=='learned').map(k=>[k,compare(heldout,'learned',k)]));assert.deepEqual(comparisons,r.comparisons);
const g=p.gates,habitatPassed=p.requiredControls.every(c=>Object.values(comparisons[c]).every(v=>v.energy.ci95[0]>g.energyDifferenceLowerBound&&v.population.mean>=g.populationDifferenceMeanMinimum)),incumbentPassed=comparisons.incumbent.stable.energy.ci95[0]>g.stableIncumbentEnergyLowerBound&&comparisons.incumbent.stable.population.mean>=0&&comparisons.incumbent.relocation.energy.ci95[0]>g.relocationIncumbentEnergyLowerBound&&comparisons.incumbent.relocation.population.mean>=0;
assert.equal(r.memoryPassed,memoryPassed);assert.equal(r.habitatPassed,habitatPassed);assert.equal(r.incumbentPassed,incumbentPassed);assert.equal(r.passed,locked.eligible&&memoryPassed&&habitatPassed&&incumbentPassed);

const {World}=await import(pathToFileURL(join(directory,'sources/engine.mjs')).href),body=(parameters,learning=true)=>({controller:'episodic-actor',parameters,learning}),profiles={learned:body(locked.parameters),frozen:body(locked.parameters,false),noMemory:body({...locked.parameters,memoryLearning:false}),incumbent:body(p.incumbent),neural:{controller:'trace-actor',learning:true},fullRange:body({...locked.parameters,moveMode:'residual',moveGain:2})},replays=[];
for(const row of [heldout[0],heldout.at(-1)])for(const [env,environment]of Object.entries(p.environments))for(const [arm,profile]of Object.entries(profiles)){
  const world=new World({seed:row.seed,founders:p.founders,capacity:240,controller:profile.controller,learning:profile.learning,actorParameters:p.actorParameters,reproduction:false,mutation:false,...environment,...(profile.parameters?{episodicParameters:profile.parameters}:{})});
  world.advance(p.horizonTicks);const sha256=hash(JSON.stringify(world.checkpoint()));assert.equal(sha256,row.environments[env][arm].fullStateSha256,'Whole replay differs: '+row.seed+' '+env+' '+arm);
  replays.push({seed:row.seed,environment:env,arm,exactCompleteWorld:true,sha256});
}
const compatibility=await load('compatibility.json'),oldOutcomes=await load('diagnosis-2.json');
for(const check of compatibility){const row=oldOutcomes.find(row=>row.seed===check.seed),environment=p.environments[check.environment];assert.ok(row);assert.equal(check.sha256,row.environments[check.environment].incumbent.fullStateSha256);const world=new World({seed:row.seed,founders:p.founders,capacity:240,reproduction:false,mutation:false,...environment,controller:'episodic-actor',learning:true,actorParameters:{...p.actorParameters},episodicParameters:{...p.incumbent,memoryLearning:true,neuralLearning:true}});world.advance(p.horizonTicks);assert.equal(hash(JSON.stringify(world.checkpoint())),check.sha256);}
const auditor=await readFile(new URL(import.meta.url));await writeFile(join(directory,'audit-source.mjs'),auditor);
const audit={at:new Date().toISOString(),auditorSha256:hash(auditor),worlds,developmentSeedPairs:development.length,heldoutSeedPairs:heldout.length,maxAccountingResidual,locked:locked.id,eligible:locked.eligible,memoryPassed,habitatPassed,incumbentPassed,passed:r.passed,replays,checks:['fixed seed separation and prior seed registry hashes','complete paired arm/environment outcomes and matched founder hashes','energy ledgers and behavior count invariants','archived source/reference/diagnosis hashes','all development/held-out comparisons independently recomputed','cue component intervals recomputed from raw scores','candidate ranking, lock and qualification gates recomputed','complete archived-state replay of first/last held-out seed for every arm/environment','complete old-default checkpoint compatibility'],limitations:['Only the specified complete-world subset was replayed.','The separate cue task does not establish habitat TD bootstrapping or continual whole-body retention.','An ineligible development fallback cannot qualify. No sample extension or environmental promotion is authorized by a failed gate.']};
await writeFile(join(directory,'audit.json'),JSON.stringify(audit,null,2)+'\n');console.log(JSON.stringify({...audit,replays:{count:replays.length,allExact:replays.every(row=>row.exactCompleteWorld)}},null,2));
