import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
const referenceDirectory=resolve(process.argv[2]||'evidence/option-outcome/ae62a9d3-1415-4234-bd99-210ad26e4caf'),directory=resolve(process.argv[3]||`evidence/food-aliasing/${randomUUID()}`),hash=x=>createHash('sha256').update(x).digest('hex');
const bytes=await readFile(join(referenceDirectory,'results.json')),original=JSON.parse(bytes),p=original.protocol,ref=JSON.parse(await readFile(join(referenceDirectory,'reference-protocol.json')));
for(const[file,sha]of Object.entries(p.worldSourceSha256))assert.equal(hash(await readFile(join(p.worldSources,file))),sha);
const {World}=await import(pathToFileURL(join(p.worldSources,'engine.mjs')).href),source=await readFile(new URL(import.meta.url));await mkdir(dirname(directory),{recursive:true});await mkdir(directory);
const protocol={at:new Date().toISOString(),experiment:'constructed-food-availability-sensory-aliases',referenceDirectory,referenceSha256:hash(bytes),sourceSha256:hash(source),worldSources:p.worldSources,worldSourceSha256:p.worldSourceSha256,seeds:p.seeds,environments:p.environments,scales:[.5,1,2],horizon:p.modelConfig.horizon,interpretation:'Controlled copies of reused failed cases, not naturally encountered independent evidence or policy qualification. Before the first step, multiply every food amount, capacity and regrowth by a fixed factor. Enter the signed energy addition/removal in externalEnergy; preserve target body, position, all acquired internal state and RNG. Retain every case and report which interventions preserve the complete initial 17-channel target observation and non-speed motor outputs exactly. Only such cases can demonstrate initial sensory aliasing. Other agents may sense different food; later target observations can diverge. A preference flip on these constructed copies is not an irreducible-error bound for natural history, a proposed sensor benefit, or a reason to change ecological difficulty. No outcomes train models.'};
await writeFile(join(directory,'protocol.json'),JSON.stringify(protocol,null,2)+'\n');await writeFile(join(directory,'diagnose-source.mjs'),source);await writeFile(join(directory,'runner.json'),JSON.stringify({pid:process.pid,status:'running'})+'\n');console.log(JSON.stringify({directory,phase:'start'}));
const advance=s=>{let x=s;x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0;},forced={};for(let s=1;s<1_000_000&&Object.keys(forced).length<2;s++){const a=advance(s),b=advance(a);if(a/4294967296<ref.parameters.exploration)forced[b/4294967296<.5?-1:1]??=s;}
const sign=x=>Math.abs(x)<1e-9?0:Math.sign(x),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`Mismatch ${a} / ${b}`),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
const rows=[];
for(const recorded of original.rows){
  const world=new World({seed:recorded.seed,founders:ref.founders,capacity:240,reproduction:false,mutation:false,...p.environments[recorded.environment],controller:'episodic-actor',learning:true,actorParameters:{...ref.actorParameters},episodicParameters:{...ref.parameters,memoryLearning:true,neuralLearning:true}}),cases=[];
  for(let tick=0;tick<p.horizonTicks;tick++){
    if(!world.step())break;
    for(const c of recorded.plans.filter(c=>c.tick===world.tick)){
      const checkpoint=world.checkpoint(),initialTarget=world.flies.find(f=>f.id===c.agentId),natural=World.restore(checkpoint),target=natural.flies.find(f=>f.id===c.agentId);natural.step();assert.deepEqual(target.lastInputs,c.query);const variants=[];
      for(const scale of protocol.scales){
        const modified=World.restore(checkpoint),beforeEnergy=modified.energy();let added=0;
        for(const patch of modified.food){const old=patch.amount;patch.amount*=scale;patch.capacity*=scale;patch.regrowth*=scale;added+=patch.amount-old;}
        modified.totals.externalEnergy+=added;near(modified.energy()-beforeEnergy,added);
        assert.deepEqual(modified.flies,world.flies);assert.deepEqual(modified.rng,world.rng);assert.deepEqual(modified.ecologyRng,world.ecologyRng);
        const changed=modified.checkpoint(),effects={};
        for(const choice of [-1,1]){
          const fork=World.restore(changed),f=fork.flies.find(f=>f.id===c.agentId);f.brain.episodic.memory.rngState=forced[choice];fork.step();assert.equal(f.brain.episodic.lastDecision.choice,choice);
          const firstObservation=[...f.lastInputs],firstActions=[...f.lastActions],sameObservation=same(firstObservation,c.query),sameOtherMotors=firstActions.every((v,i)=>i===1||v===target.lastActions[i]);
          f.brain.episodic.memory.rngState=target.brain.episodic.memory.rngState;fork.advance(protocol.horizon-1);
          const id=choice<0?'slow':'fast';effects[id]={energyChange:(fork.flies.find(g=>g.id===c.agentId)?.energy||0)-initialTarget.energy,alive:fork.flies.includes(f),firstObservation,firstActions,sameObservation,sameOtherMotors,endingSha256:hash(JSON.stringify(fork.checkpoint())),accountingResidual:fork.energy()+fork.totals.dissipated-fork.initialEnergy-fork.totals.externalEnergy};near(effects[id].accountingResidual,0);
          if(scale===1){near(effects[id].energyChange,c.effects[id].energyChange);assert.ok(sameObservation&&sameOtherMotors);if(choice===target.brain.episodic.lastDecision.choice)assert.equal(effects[id].endingSha256,c.rawFactualSha256);}
        }
        variants.push({scale,addedEnergy:added,initialEnergyBefore:beforeEnergy,initialEnergyAfter:modified.energy(),effects,difference:effects.fast.energyChange-effects.slow.energyChange,sameInitialTargetObservationAndMotors:Object.values(effects).every(e=>e.sameObservation&&e.sameOtherMotors)});
      }
      const low=variants.find(v=>v.scale===.5),high=variants.find(v=>v.scale===2),bothPreserved=low.sameInitialTargetObservationAndMotors&&high.sameInitialTargetObservationAndMotors;
      cases.push({tick:c.tick,agentId:c.agentId,query:c.query,internalStateSha256:hash(JSON.stringify(initialTarget)),variants,bothPreserved,oppositePreferences:bothPreserved&&sign(low.difference)*sign(high.difference)===-1,usedForControl:false,usedForTraining:false});
    }
  }
  assert.equal(hash(JSON.stringify(world.checkpoint())),recorded.worldSha256);rows.push({seed:recorded.seed,environment:recorded.environment,exactBaseline:true,cases});await writeFile(join(directory,'progress.json'),JSON.stringify({protocol,rows})+'\n');console.log(JSON.stringify({directory,completed:rows.length,total:original.rows.length}));
}
const summaries=Object.fromEntries(Object.keys(p.environments).map(env=>{const cases=rows.filter(row=>row.environment===env).flatMap(row=>row.cases),preserved=cases.filter(c=>c.bothPreserved),flips=preserved.filter(c=>c.oppositePreferences);return[env,{cases:cases.length,preserved:preserved.length,oppositePreferences:flips.length,oppositeFractionAmongPreserved:preserved.length?flips.length/preserved.length:null,meanEffectChangeAmongPreserved:preserved.length?mean(preserved.map(c=>c.variants.find(v=>v.scale===2).difference-c.variants.find(v=>v.scale===.5).difference)):null,maxAbsoluteAccountingResidual:Math.max(...cases.flatMap(c=>c.variants.flatMap(v=>Object.values(v.effects).map(e=>Math.abs(e.accountingResidual)))))}];}));
const result={protocol,rows,summaries,qualificationRecomputed:false,integrationSupported:false,ecologicalQualification:false,completedAt:new Date().toISOString()};await writeFile(join(directory,'results.json'),JSON.stringify(result)+'\n');await writeFile(join(directory,'runner.json'),JSON.stringify({pid:process.pid,status:'complete'})+'\n');console.log(JSON.stringify({directory,summaries},null,2));
