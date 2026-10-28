import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname,relative,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {StallTransfer} from '../learning/stall-transfer.mjs';
import {runTasteProbe} from '../learning/taste-experiment.mjs';
import {billSarsaWork} from '../learning/sarsa-experiment.mjs';
import {digest} from '../learning/intervention-study.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),input=join(root,'evidence/taste-development/attempt-15-progress');
const output=join(root,'evidence/escape-commitment/20261025-v1');assert.ok(!existsSync(output));
const read=name=>JSON.parse(readFileSync(name,'utf8'));
const write=(name,value)=>{mkdirSync(dirname(name),{recursive:true});writeFileSync(name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const sources={},visit=name=>{
  const relativeName=relative(root,name).split(sep).join('/');assert.ok(!relativeName.startsWith('../'));
  if(Object.hasOwn(sources,relativeName))return;
  const bytes=readFileSync(name);sources[relativeName]=digest(bytes);
  if(/\.m?js$/.test(name))for(const match of bytes.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(name),match[1]));
};
for(const name of ['scripts/escape-commitment.mjs','tests/escape-commitment.test.mjs','tests/stall-transfer.test.mjs','docs/ESCAPE_COMMITMENT_DESIGN.md'])visit(join(root,name));
const bank=read(join(input,'protocol.json')),inputs=bank.histories.map(history=>{
  const anchor=join(input,'anchors',history.seed+'-C.json');return {history,anchor:relative(root,anchor).split(sep).join('/'),sha256:digest(readFileSync(anchor))};
});
assert.equal(inputs.length,8);
const protocol={schema:1,kind:'frozen-half-turn-commitment',createdAt:new Date().toISOString(),sourceSha256:sources,inputs,
  window:[17,112],priorNoIntake:16,priorWallWindow:4,turn:1,commitmentTicks:Math.ceil(Math.PI/(2.8*.1)),ticks:256,
  arms:['commitment','matched-full','bare-full'],rule:'Positive mean energy over both; >=6/8 positive over each; nonnegative survivor sums over both.',
  scope:'Fixed exploratory single-event option witness. No acquired skill, target/collision-based selection, outcome sweep, qualification or RSI.'};
write(join(output,'protocol.json'),protocol);
for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
const start=performance.now(),cpu=process.cpuUsage(),rows=[];
const contrast=(active,control,id)=>{
  const energy=active.endpoint.budgetAdjustedEnergyPerFounder-control.endpoint.budgetAdjustedEnergyPerFounder;
  const focal=id===null?0:active.bodyBudgets[id].budget-control.bodyBudgets[id].budget;
  return {energy,focalBudget:focal,otherBodiesBudget:energy*active.endpoint.founders-focal,
    survivors:active.endpoint.survivors-control.endpoint.survivors,debt:active.endpoint.outstandingEnergy-control.endpoint.outstandingEnergy,
    intake:active.statistics.intake-control.statistics.intake,chargedPhysicalCosts:active.statistics.chargedPhysicalCosts-control.statistics.chargedPhysicalCosts};
};
for(const source of inputs){
  const anchor=read(join(root,source.anchor)),history=source.history,referenceTrace=[],snapshots={};let event=null;
  const reference=new StallTransfer(anchor,history.probeSeeds.transfer,{speedMode:1,escapeMode:0,observer:record=>{
    referenceTrace.push(record);
  }});
  const startWorldSha256=digest(reference.run.world.checkpoint());
  while(reference.elapsed<256&&reference.run.world.flies.length){
    const decision=reference.elapsed+1;
    if(event===null&&decision>=17&&decision<=112){
      const eligible=reference.run.world.flies.map(fly=>fly.id).filter(id=>reference.controls[id].escapeNoIntake>=16&&reference.controls[id].escapeWallBits>0).sort((first,second)=>first-second);
      if(eligible.length){event={id:eligible[0],decision,checkpoint:reference.checkpoint()};reference.commitEscape(event.id);write(join(output,'checkpoints',history.seed+'.json'),event);}
    }
    reference.step();snapshots[reference.elapsed]=reference.snapshot();
  }
  const matched=reference.snapshot(),finalCheckpoint=reference.checkpoint(),branchTrace=[];let commitment=matched,horizons={};
  if(event){
    const replay=StallTransfer.restore(event.checkpoint);replay.commitEscape(event.id);replay.advanceTo(256);assert.deepEqual(replay.checkpoint(),finalCheckpoint);
    const branch=StallTransfer.restore(event.checkpoint,{observer:record=>branchTrace.push(record)});
    for(const control of Object.values(branch.controls))control.escapeMode=1;
    branch.commitEscape(event.id);
    for(const [name,delay]of [['option',12],['later',64],['endpoint',256]]){
      const target=name==='endpoint'?256:Math.min(256,event.decision-1+delay),snapshot=branch.advanceTo(target);
      horizons[name]={elapsed:snapshot.elapsed,delay:snapshot.elapsed-(event.decision-1),snapshot,effect:contrast(snapshot,snapshots[target]??matched,event.id)};
    }
    commitment=branch.snapshot();
    const focal=branchTrace.filter(record=>record.id===event.id);
    assert.ok(focal.slice(0,12).every(record=>record.escape.active&&record.escape.executedTurn===1&&record.escape.eat===1&&record.executedMove===1));
    assert.ok(focal.slice(12).every(record=>!record.escape.active));
  }
  for(const record of referenceTrace)assert.equal(record.escape.executedTurn,Math.tanh(2*(record.raw[2]-record.raw[1])+1.8*(record.raw[10]-record.raw[11])));
  const bareAnchor=structuredClone(anchor);bareAnchor.state.cruiseSpeed=1;
  for(const state of Object.values(bareAnchor.state.learners))billSarsaWork(state,bareAnchor.state.pricing);
  const bare=runTasteProbe(bareAnchor,{family:'transfer',version:'acceptCruise',seed:history.probeSeeds.transfer});assert.equal(bare.startWorldSha256,startWorldSha256);
  const effects={'matched-full':contrast(commitment,matched,event?.id??null),'bare-full':{energy:commitment.endpoint.budgetAdjustedEnergyPerFounder-bare.value,survivors:commitment.endpoint.survivors-bare.survivors}};
  const prior=event?referenceTrace.filter(record=>record.id===event.id&&record.decision<event.decision).slice(-16):[];
  const at=event?referenceTrace.find(record=>record.id===event.id&&record.decision===event.decision):null;
  const selection=event?{id:event.id,decision:event.decision,precedingCollisions:prior.filter(record=>record.collision).length,deepInteriorTarget:at.target?.deepInterior??false}:null;
  const row={history,startWorldSha256,selection,arms:{commitment,'matched-full':matched,'bare-full':bare},effects,horizons};
  write(join(output,'rows',history.seed+'.json'),row);write(join(output,'traces',history.seed+'.json'),{reference:referenceTrace,commitment:branchTrace});rows.push(row);
  console.log(JSON.stringify({seed:history.seed,selection,effects}));
}
for(const [name,hash]of Object.entries(sources))assert.equal(digest(readFileSync(join(root,name))),hash);
for(const source of inputs)assert.equal(digest(readFileSync(join(root,source.anchor))),source.sha256);
const comparisons=Object.fromEntries(['matched-full','bare-full'].map(name=>{
  const effects=rows.map(row=>row.effects[name]);return [name,{meanEnergy:effects.reduce((sum,effect)=>sum+effect.energy,0)/8,positive:effects.filter(effect=>effect.energy>0).length,survivorDifference:effects.reduce((sum,effect)=>sum+effect.survivors,0)}];
}));
const used=process.cpuUsage(cpu),result={schema:1,kind:protocol.kind,histories:8,events:rows.filter(row=>row.selection).length,qualified:false,comparisons,
  promising:Object.values(comparisons).every(comparison=>comparison.meanEnergy>0&&comparison.survivorDifference>=0&&comparison.positive>=6),
  runtime:{wallSeconds:(performance.now()-start)/1000,cpuSeconds:(used.user+used.system)/1e6},sourceSha256:sources,scope:protocol.scope};
write(join(output,'results.json'),result);console.log(JSON.stringify(result));
