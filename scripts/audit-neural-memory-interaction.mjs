import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const directory=resolve(process.argv[2]||''),load=async name=>JSON.parse(await readFile(join(directory,name),'utf8'));
const protocol=await load('protocol.json'),result=await load('results.json'),rows=await load('outcomes.json'),reference=await load('reference-study.json');
assert.deepEqual(result.protocol,protocol);assert.equal(protocol.experiment,'neural-memory-factorial-diagnostic');
assert.deepEqual(rows.map(row=>row.seed),protocol.seeds);assert.equal(new Set(protocol.seeds).size,protocol.seedCount);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),hash=value=>sha(JSON.stringify(value));
for(const[file,digest]of Object.entries(protocol.sourceSha256))assert.equal(sha(await readFile(join(directory,'sources',file))),digest,'Archived source differs: '+file);
assert.equal(sha(await readFile(join(directory,'reference-study.json'))),protocol.referenceSha256);
assert.equal(sha(await readFile(join(directory,'joint-diagnosis.json'))),protocol.diagnosticSha256);
assert.ok(reference.passed);assert.deepEqual(protocol.parameters,reference.protocol.parameters);assert.deepEqual(protocol.actorParameters,reference.protocol.actorParameters);
assert.equal(protocol.founders,reference.protocol.founders);assert.equal(protocol.horizonTicks,reference.protocol.horizonTicks);
assert.deepEqual(protocol.environments.stable,reference.protocol.environment);
assert.deepEqual(protocol.environments.relocation,{...reference.protocol.environment,ecology:'relocation'});
assert.deepEqual(protocol.arms,{incumbent:{memoryLearning:true,neuralLearning:true},memoryOnly:{memoryLearning:true,neuralLearning:false},neuralOnly:{memoryLearning:false,neuralLearning:true},neither:{memoryLearning:false,neuralLearning:false},frozen:{memoryLearning:true,neuralLearning:false,learning:false},eatOnly:{memoryLearning:true,neuralLearning:true,plasticOutputs:4},signalOnly:{memoryLearning:true,neuralLearning:true,plasticOutputs:16},fullRange:{memoryLearning:true,neuralLearning:false,moveMode:'residual',moveGain:2},neural:{controller:'trace-actor'}});
const used=new Set();
for(const registry of protocol.seedRegistries) {
  const bytes=await readFile(registry.path);assert.equal(sha(bytes),registry.sha256,'Registered protocol differs: '+registry.path);
  const p=JSON.parse(bytes);for(const key of ['seeds','developmentSeeds','heldoutSeeds','probeSeeds'])for(const seed of p[key]||[])used.add(seed);if(Number.isInteger(p.seed))used.add(p.seed);
}
assert.equal(used.size,protocol.previouslyRegisteredSeeds);assert.ok(protocol.seeds.every(seed=>!used.has(seed)));
// Independently reproduce the declared interval arithmetic rather than import
// the study's summary helper. This verifies computation, not model assumptions.
function interval(values) {
  const n=values.length,mean=values.reduce((sum,value)=>sum+value,0)/n;
  if(n<2)return{mean,ci95:[null,null],n};
  const sd=Math.sqrt(values.reduce((sum,value)=>sum+(value-mean)**2,0)/(n-1)),t=n>=30?2.045:n>=20?2.093:n>=10?2.262:3.182,half=t*sd/Math.sqrt(n);
  return{mean,ci95:[mean-half,mean+half],n};
}
const arms=Object.keys(protocol.arms),environments=Object.keys(protocol.environments);let worlds=0,maxAccountingResidual=0;
for(const row of rows) {
  assert.deepEqual(Object.keys(row.environments),environments);
  for(const environment of environments) {
    const outcomes=row.environments[environment];assert.deepEqual(Object.keys(outcomes),arms);
    assert.equal(new Set(arms.map(arm=>outcomes[arm].founderHash)).size,1);
    assert.equal(new Set(arms.map(arm=>outcomes[arm].initialActorRngHash)).size,1);
    assert.equal(outcomes.neither.nonConfigStateSha256,outcomes.frozen.nonConfigStateSha256);
    for(const arm of arms) {
      worlds++;const o=outcomes[arm];assert.equal(o.seed,row.seed);assert.ok(o.ticks<=protocol.horizonTicks);
      assert.ok(o.ticks===protocol.horizonTicks||o.population===0);
      assert.ok(Number.isInteger(o.population)&&o.population>=0&&o.population<=protocol.founders);
      assert.ok(protocol.endpointKeys.every(key=>Number.isFinite(o[key])));
      maxAccountingResidual=Math.max(maxAccountingResidual,Math.abs(o.accountingResidual));assert.ok(Math.abs(o.accountingResidual)<1e-6);
      assert.ok(Math.abs(o.energy-(o.food-o.expenditure)/protocol.founders)<1e-7);
      assert.equal(o.foodPerFounder,o.food/protocol.founders);assert.equal(o.spentPerFounder,o.expenditure/protocol.founders);
      assert.equal(o.deathCauses.energy+o.deathCauses.age,protocol.founders-o.population);
      assert.equal(o.plasticByOutput.length,5);
      for(const [index,plastic]of o.plasticByOutput.entries()) {
        assert.ok(Number.isInteger(plastic.count)&&Number.isInteger(plastic.nonzero)&&plastic.nonzero>=0&&plastic.nonzero<=plastic.count);
        assert.ok(plastic.absolute>=0&&plastic.absolute<=3*plastic.count+1e-9);
        assert.equal(plastic.meanAbsolute,plastic.absolute/Math.max(1,plastic.count));
        if(arm!=='neural'&&index<2||['memoryOnly','neither','frozen','fullRange'].includes(arm)||arm==='eatOnly'&&index!==2||arm==='signalOnly'&&index!==4)assert.equal(plastic.nonzero,0);
      }
      const b=o.behavior;assert.ok(b.agentSteps>0&&b.agentSteps<=protocol.founders*protocol.horizonTicks);
      assert.equal(b.eatPositiveFraction,b.eatPositive/b.agentSteps);assert.equal(b.eatExtremeFraction,b.eatExtreme/b.agentSteps);assert.equal(b.meanSignal,b.signal/b.agentSteps);
      for(const key of ['eatPositiveFraction','eatExtremeFraction','meanSignal'])assert.ok(b[key]>=0&&b[key]<=1);
      if(environment==='stable')assert.equal(o.relocations.length,0);
      else if(o.ticks===protocol.horizonTicks)assert.ok(o.relocations.length>0);
      assert.deepEqual(o.relocations,outcomes.incumbent.relocations);
    }
  }
}
const paired=(left,right)=>Object.fromEntries(environments.map(environment=>[environment,Object.fromEntries(protocol.endpointKeys.map(key=>[key,interval(rows.map(row=>row.environments[environment][left][key]-row.environments[environment][right][key]))]))]));
const comparisons=Object.fromEntries(Object.entries({...protocol.primaryContrasts,...protocol.secondaryContrasts}).map(([name,[left,right]])=>[name,paired(left,right)]));assert.deepEqual(comparisons,result.comparisons);
const interaction=Object.fromEntries(environments.map(environment=>[environment,Object.fromEntries(protocol.endpointKeys.map(key=>[key,interval(rows.map(row=>{const a=row.environments[environment];return(a.memoryOnly[key]-a.neither[key])-(a.incumbent[key]-a.neuralOnly[key]);}))]))]));assert.deepEqual(interaction,result.interaction);
const removal=comparisons.removeNeuralWithMemory,interferenceSignal=removal.relocation.energy.ci95[0]>0&&interaction.relocation.energy.ci95[0]>0&&removal.relocation.population.mean>=0&&removal.stable.energy.ci95[0]>-.5&&removal.stable.population.mean>=0;
assert.equal(result.interferenceSignal,interferenceSignal);assert.equal(result.qualificationPassed,false);

// Replay the first and last fixed seed, every arm and environment, through
// archived algorithm sources. Complete final checkpoint hashes must match.
const {World}=await import(pathToFileURL(join(directory,'sources/engine.mjs')).href),replays=[];
for(const row of [rows[0],rows.at(-1)])for(const environment of environments)for(const arm of arms) {
  const profile=protocol.arms[arm],world=new World({seed:row.seed,founders:protocol.founders,capacity:240,reproduction:false,mutation:false,...protocol.environments[environment],controller:profile.controller||'episodic-actor',learning:profile.learning??true,actorParameters:{...protocol.actorParameters,...(profile.plasticOutputs?{plasticOutputs:profile.plasticOutputs}:{})},...(profile.controller?{}:{episodicParameters:{...protocol.parameters,...Object.fromEntries(Object.entries(profile).filter(([key])=>!['controller','learning','plasticOutputs'].includes(key)))}})});
  assert.equal(hash(world.flies.map(({brain,...fly})=>fly)),row.environments[environment][arm].founderHash);
  if(arm==='memoryOnly') {
    const split=Math.floor(protocol.horizonTicks/2)+1;world.advance(split);
    const restored=World.restore(JSON.parse(JSON.stringify(world.checkpoint())));world.advance(protocol.horizonTicks-split);restored.advance(protocol.horizonTicks-split);
    assert.deepEqual(restored.checkpoint(),world.checkpoint());
  } else world.advance(protocol.horizonTicks);
  const digest=hash(world.checkpoint());assert.equal(digest,row.environments[environment][arm].fullStateSha256,'Complete replay differs: '+row.seed+' '+environment+' '+arm);
  replays.push({seed:row.seed,environment,arm,exactCompleteWorld:true,sha256:digest});
}
const parentRows=await load('reference-heldout.json'),compatibility=await load('compatibility.json');
assert.deepEqual(parentRows.map(row=>row.seed),reference.protocol.seeds);
for(const control of reference.protocol.requiredControls)for(const key of ['energy','population'])assert.deepEqual(interval(parentRows.map(row=>row.arms.learned[key]-row.arms[control][key])),reference.comparisons[control][key]);
for(const replay of compatibility.filter(row=>row.exactRecordedEndpoints)) {
  const row=parentRows.find(row=>row.seed===replay.seed);assert.ok(row);
  const world=new World({seed:row.seed,founders:protocol.founders,capacity:240,reproduction:false,mutation:false,...protocol.environments.stable,controller:'episodic-actor',learning:true,actorParameters:protocol.actorParameters,episodicParameters:protocol.parameters}),initial=world.flies.reduce((s,f)=>s+f.energy,0);world.advance(protocol.horizonTicks);
  assert.equal(world.tick,row.arms.learned.ticks);assert.equal(world.flies.length,row.arms.learned.population);assert.equal((world.flies.reduce((s,f)=>s+f.energy,0)-initial)/protocol.founders,row.arms.learned.energy);
  assert.equal(world.totals.foodEaten,row.arms.learned.food);assert.equal(world.totals.dissipated,row.arms.learned.expenditure);
}
const auditorBytes=await readFile(new URL(import.meta.url));await writeFile(join(directory,'audit-source.mjs'),auditorBytes);
const audit={at:new Date().toISOString(),auditorSha256:sha(auditorBytes),worlds,seeds:rows.length,environments:environments.length,arms:arms.length,maxAccountingResidual,interferenceSignal,qualificationPassed:false,replays,checks:['complete fixed seed/arm/environment outcomes','registered seed exclusion and registry hashes','matched inherited founders and initial actor RNG states','frozen/both-off full non-config state equality','energy and population ledger reconciliation','plastic-output routing and behavior summaries','source and reference hashes','independent recomputation of all contrasts and interaction intervals','declared diagnostic decision rule','complete archived-source replay of first and last seed in every arm/environment','memory-only JSON checkpoint continuation in replayed worlds','historical raw-result comparisons and recorded endpoint replay'],limitations:['Only the specified subset of complete worlds was replayed; other worlds were audited from recorded outcomes.','Intervals use the declared seed-level method and are not multiplicity-adjusted.','This fixed mechanistic diagnostic cannot qualify a policy, continual retention, environmental promotion or RSI.']};
await writeFile(join(directory,'audit.json'),JSON.stringify(audit,null,2)+'\n');console.log(JSON.stringify({...audit,replays:{count:replays.length,allExact:replays.every(row=>row.exactCompleteWorld)}},null,2));
