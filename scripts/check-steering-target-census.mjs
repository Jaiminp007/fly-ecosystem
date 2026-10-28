import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/taste-steering-crossover/20261026-v1'),base=join(root,'evidence/steering-target-census/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),result=read(join(base,'results.json')),protocol=read(join(base,'protocol.json')),original=read(join(source,'protocol.json'));
assert.equal(hash(readFileSync(join(source,'protocol.json'))),protocol.sourceProtocolSha256);assert.equal(hash(readFileSync(join(root,'scripts/steering-target-census.mjs'))),protocol.scriptSha256);
assert.equal(hash(readFileSync(join(root,'docs/STEERING_TARGET_CENSUS_PLAN.md'))),protocol.planSha256);
const {OdorRoutedExperiment}=await import(pathToFileURL(join(source,'sources/learning/odor-routed-experiment.mjs')).href);let replays=0,available=0,decisions=0;
for(const record of result.rows){
  const label=record.seed+'-'+record.phase+'-'+record.arm,run=OdorRoutedExperiment.restore(read(join(source,'starts',label+'.json'))),row=read(join(source,'rows',record.seed+'.json')),seen={},categories={good:{native:0,midpoint:0},mixed:{native:0,midpoint:0},bad:{native:0,midpoint:0}};
  let observed=0,different=0,goodCount=0,badCount=0,goodSum=0,badSum=0;const originalSensors=run.world.sensors.bind(run.world);
  Object.defineProperty(run.world,'sensors',{enumerable:false,configurable:true,value:(fly,index,agents,challenge)=>originalSensors(fly,{nearby:(body,radius)=>{const items=index.nearby(body,radius);seen[fly.id]=items;return items;}},agents,challenge)});
  const digest=createHash('sha256');run.attach(event=>{
    digest.update(JSON.stringify(event)+'\n');if(event.type!=='decision')return;decisions++;if(!event.available)return;observed++;available++;
    const visible=seen[event.id].filter(patch=>patch.amount>.06),selected=event.recommendation.pair.map(index=>visible[index]);assert.ok(selected.every(Boolean));let positive=0;
    for(const patch of selected){const item=run.codebook[record.phase].find(candidate=>candidate.bits.every((bit,index)=>bit===patch.cue[index]));assert.ok(item);const good=item.valence>0;positive+=Number(good);
      const bits=patch.cue,vector=[1,...bits,bits[0]*bits[1],bits[0]*bits[2],bits[0]*bits[3],bits[1]*bits[2],bits[1]*bits[3],bits[2]*bits[3]],weights=run.learners[event.id].taste.weights;
      let score=0;for(let index=0;index<11;index++)score+=weights[index]*vector[index];const probability=.05+.9/(1+Math.exp(-Math.log(3)-score/Math.sqrt(11)));
      if(good){goodCount++;goodSum+=probability;}else{badCount++;badSum+=probability;}
    }
    const category=positive===2?'good':positive===1?'mixed':'bad';categories[category][event.steering.action===1?'midpoint':'native']++;
    if(selected.some(patch=>patch.cue.some((bit,index)=>bit!==event.own.cue[index])))different++;
  });
  const endpoint=run.advance(original.ticks);run.attach(null);assert.deepEqual(endpoint,row.phases[record.phase].arms[record.arm].endpoint);assert.deepEqual(run.checkpoint(false),read(join(source,'finals',label+'.json')));
  assert.equal(digest.digest('hex'),row.phases[record.phase].arms[record.arm].trace.sha256);assert.equal(observed,record.available);assert.deepEqual(categories,record.classes);assert.equal(different,record.cueDiffersFromOwn);
  assert.equal(goodCount,record.predictor.goodCount);assert.equal(badCount,record.predictor.badCount);assert.ok(Math.abs(goodSum-record.predictor.goodAcceptanceSum)<1e-8);assert.ok(Math.abs(badSum-record.predictor.badAcceptanceSum)<1e-8);replays++;
}
for(const phase of ['A','B'])for(const arm of ['AA','AB']){const entries=result.rows.filter(row=>row.phase===phase&&row.arm===arm),summary=result.summary[phase][arm];
  for(const key of ['decisions','available','cueDiffersFromOwn'])assert.equal(summary[key],entries.reduce((sum,row)=>sum+row[key],0));
  for(const category of ['good','mixed','bad'])for(const action of ['native','midpoint'])assert.equal(summary.classes[category][action],entries.reduce((sum,row)=>sum+row.classes[category][action],0));
  for(const key of Object.keys(summary.predictor))assert.ok(Math.abs(summary.predictor[key]-entries.reduce((sum,row)=>sum+row.predictor[key],0))<1e-8);
}
const report={schema:1,passed:true,replays,decisions,available,scope:'Independent target category and taste-propensity reconstruction with exact source replays; no independent physics or cost audit.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
