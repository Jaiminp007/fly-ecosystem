import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname,relative,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {StallTransfer} from '../learning/stall-transfer.mjs';
import {runTasteProbe} from '../learning/taste-experiment.mjs';
import {billSarsaWork} from '../learning/sarsa-experiment.mjs';
import {digest} from '../learning/intervention-study.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),input=resolve(root,'evidence/taste-development/attempt-15-progress'),output=resolve(root,'evidence/speed-transfer/20261025-v1');assert.ok(!existsSync(output));
const read=p=>JSON.parse(readFileSync(p,'utf8')),write=(p,v)=>{mkdirSync(dirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
const sources={},visit=path=>{const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;
  const bytes=readFileSync(path);sources[name]=digest(bytes);if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(dirname(path),m[1]));};
for(const name of ['scripts/speed-transfer.mjs','docs/SPEED_TRANSFER_DESIGN.md','tests/stall-transfer.test.mjs'])visit(resolve(root,name));
const bank=read(join(input,'protocol.json')),inputs=bank.histories.map(history=>{const anchor=join(input,'anchors',`${history.seed}-C.json`);return {history,anchor:relative(root,anchor).split(sep).join('/'),sha256:digest(readFileSync(anchor))};});
const protocol={schema:1,kind:'adaptive-speed-authority-witness',createdAt:new Date().toISOString(),inputs,sourceSha256:sources,ticks:256,
  arms:['adaptive','shadow-half','shadow-full','bare-half','bare-full'],
  predicates:'raw[3]>0,raw[3]<.75,raw[0]>=.5,!contactPresent,raw[10]===0,raw[11]===0; full only if all true, else half',
  rule:'Positive mean over all4 references; >=6/8 positive over each shadow fixedspeed; nonnegative summed survivor differences against all4.',
  scope:'Reusable exploratory control witness. No learning, threshold sweep, new sensor, qualification or RSI.'};
write(join(output,'protocol.json'),protocol);
for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
const start=performance.now(),cpu=process.cpuUsage(),rows=[];
for(const source of inputs){
  const anchor=read(join(root,source.anchor)),history=source.history,arms={},traces={};let startHash;
  for(const[name,speedMode]of [['adaptive',2],['shadow-half',0],['shadow-full',1]]){
    const moves=[],run=new StallTransfer(anchor,history.probeSeeds.transfer,{speedMode,observer:r=>moves.push({id:r.id,decision:r.decision,forward:r.raw[0],proximity:r.raw[3],wallLeft:r.raw[10],wallRight:r.raw[11],contactPresent:r.contactPresent,requestedMove:r.requestedMove,executedMove:r.executedMove})});
    const hash=digest(run.run.world.checkpoint());if(!startHash)startHash=hash;else assert.equal(hash,startHash);
    const final=run.advanceTo(256);arms[name]={...final,startWorldSha256:hash,weightsUnchanged:true};traces[name]=moves;
    for(const m of moves){assert.equal(m.requestedMove,m.executedMove);const expected=speedMode===2?(m.proximity>0&&m.proximity<.75&&m.forward>=.5&&!m.contactPresent&&m.wallLeft===0&&m.wallRight===0?1:0):speedMode;assert.equal(m.executedMove,expected);}
  }
  for(const[name,speed]of [['bare-half',0],['bare-full',1]]){
    const cp=structuredClone(anchor);cp.state.cruiseSpeed=speed;
    for(const s of Object.values(cp.state.learners))billSarsaWork(s,cp.state.pricing);
    const probe=runTasteProbe(cp,{family:'transfer',version:'acceptCruise',seed:history.probeSeeds.transfer});assert.equal(probe.startWorldSha256,startHash);
    arms[name]={...probe,weightsUnchanged:null};
  }
  const value=a=>a.value??a.endpoint.budgetAdjustedEnergyPerFounder,survivors=a=>a.survivors??a.endpoint.survivors;
  const effects=Object.fromEntries(protocol.arms.filter(a=>a!=='adaptive').map(name=>[name,{energy:value(arms.adaptive)-value(arms[name]),survivors:survivors(arms.adaptive)-survivors(arms[name])}]));
  const row={history,arms,effects};write(join(output,'rows',`${history.seed}.json`),row);write(join(output,'movement-traces',`${history.seed}.json`),traces);rows.push(row);console.log(JSON.stringify({seed:history.seed,effects}));
}
for(const[name,hash]of Object.entries(sources))assert.equal(digest(readFileSync(join(root,name))),hash);
for(const source of inputs)assert.equal(digest(readFileSync(join(root,source.anchor))),source.sha256);
const comparisons=Object.fromEntries(protocol.arms.filter(a=>a!=='adaptive').map(name=>{
  const effects=rows.map(r=>r.effects[name]);return [name,{effects,meanEnergy:effects.reduce((n,e)=>n+e.energy,0)/8,positive:effects.filter(e=>e.energy>0).length,survivorDifference:effects.reduce((n,e)=>n+e.survivors,0)}];
}));
const used=process.cpuUsage(cpu),result={schema:1,kind:protocol.kind,qualified:false,histories:8,comparisons,
  promising:Object.values(comparisons).every(c=>c.meanEnergy>0&&c.survivorDifference>=0)&&['shadow-half','shadow-full'].every(k=>comparisons[k].positive>=6),
  runtime:{wallSeconds:(performance.now()-start)/1000,cpuSeconds:(used.user+used.system)/1e6},sourceSha256:sources,scope:protocol.scope};
write(join(output,'results.json'),result);console.log(JSON.stringify(result));
