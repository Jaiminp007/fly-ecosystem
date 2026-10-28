import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createGunzip} from 'node:zlib';
import {StringDecoder} from 'node:string_decoder';
import {resolve,join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {digest} from '../learning/intervention-study.mjs';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function instrumentConsumption(run,emit) {
  const world=run.world,step=world.step,seen=new Map();
  Object.defineProperty(world,'step',{configurable: true,enumerable: false,value: function(controller) {
    return step.call(this,(fly,raw,tick)=>{
      const result=controller(fly,raw,tick);
      const sensor={x: fly.x,y: fly.y,cue: [...fly.sensedCue],cueId: fly.sensedCueId,valence: fly.sensedValence,
        amounts: this.food.map(p=>p.amount)};
      const charge=result.afterEnergyCharge,after=result.afterStep;
      return {...result,afterEnergyCharge: receipt=>{
        charge?.(receipt);
        seen.set(fly.id,{amounts: this.food.map(p=>p.amount),sensor});
      },afterStep: receipt=>{
        after?.(receipt);
        const before=seen.get(fly.id); assert.ok(before); seen.delete(fly.id);
        const consumed=this.food.flatMap((patch,index)=>{
          const taken=before.amounts[index]-patch.amount;
          return taken>0 ? [{index,amount: taken,cueId: patch.cueId,valence: patch.valence,amountAtSensing: sensor.amounts[index],
            distanceAtSensing: distance(sensor,patch),distanceAtIntake: distance(fly,patch)}] : [];
        });
        const beneficial=consumed.filter(p=>p.valence>0).reduce((n,p)=>n+p.amount,0),harmful=consumed.filter(p=>p.valence<0).reduce((n,p)=>n+p.amount,0);
        assert.ok(Math.abs(beneficial-receipt.beneficialEaten)<1e-10 && Math.abs(harmful-receipt.harmfulEaten)<1e-10);
        if (consumed.length) emit({agentId: fly.id,tick,choice: [...fly.lastActions],sourceCueId: sensor.cueId,sourceValence: sensor.valence,
          before: {x: sensor.x,y: sensor.y},after: {x: fly.x,y: fly.y},consumed});
      }};
    });
  }});
  return ()=>{assert.equal(seen.size,0); delete world.step;};
}

export async function recordedCandidate(path) {
  const file=createReadStream(path),zip=createGunzip(); file.pipe(zip);
  let buffer='',initial=null,final=null;
  const decoder=new StringDecoder('utf8');
  const hash=createHash('sha256');
  try {
    outer: for await (const bytes of zip) {
      buffer+=decoder.write(bytes);
      let newline;
      while ((newline=buffer.indexOf('\n'))>=0) {
        const line=buffer.slice(0,newline); buffer=buffer.slice(newline+1);
        if (line.startsWith('{"type":"main-start","arm":"candidate",')) initial=JSON.parse(line).checkpoint;
        else if (line.startsWith('{"role":"main:candidate",')) hash.update(line+'\n');
        else if (line.startsWith('{"type":"main-end","arm":"candidate",')) {final=JSON.parse(line).checkpoint; break outer;}
      }
    }
  } finally {file.destroy(); zip.destroy();}
  assert.ok(initial && final);
  return {initial,final,eventsSha256: hash.digest('hex')};
}

export async function replayConsumptionProvenance(directory) {
  const p=JSON.parse(readFileSync(join(directory,'protocol.json'))),result=JSON.parse(readFileSync(join(directory,'development/results.json')));
  assert.equal(result.promising,false);
  for (const [name,sha] of Object.entries(p.sourceSha256)) assert.equal(digest(readFileSync(join(directory,'sources',name))),sha);
  const {TickCueExperiment}=await import(pathToFileURL(join(directory,'sources/learning/tick-cue-experiment.mjs')).href);
  const histories=[];
  for (const h of p.developmentHistories) {
    const row=JSON.parse(readFileSync(join(directory,'development/rows',`${h.seed}.json`)));
    assert.equal(row.protocolSha256,digest(readFileSync(join(directory,'protocol.json'))));
    const recorded=await recordedCandidate(join(directory,'development/numerics',`${h.seed}.jsonl.gz`));
    assert.equal(digest(recorded.final),row.arms.candidate.finalSha256);
    const hash=createHash('sha256'),run=TickCueExperiment.restore(recorded.initial,event=>hash.update(JSON.stringify({role: 'main:candidate',event})+'\n'));
    const records=[],remove=instrumentConsumption(run,event=>records.push(event));
    const start=performance.now(),cpu=process.cpuUsage();
    run.advance(1792); remove();
    assert.equal(digest(run.checkpoint()),row.arms.candidate.finalSha256,'Observer changed physical/learner continuation');
    assert.equal(hash.digest('hex'),recorded.eventsSha256,'Observer changed factual policy/physics events');
    const used=process.cpuUsage(cpu);
    histories.push({seed: h.seed,initialCheckpoint: recorded.initial,finalSha256: row.arms.candidate.finalSha256,
      eventsSha256: recorded.eventsSha256,records,runtime: {wallSeconds: (performance.now()-start)/1000,cpuMicroseconds: used.user+used.system}});
    console.log(JSON.stringify({seed: h.seed,foodReceipts: records.length,exactEventAndCheckpointReplay: true}));
  }
  return {schema: 1,kind: 'tick-consumption-provenance',protocolSha256: digest(readFileSync(join(directory,'protocol.json'))),
    resultsSha256: digest(readFileSync(join(directory,'development/results.json'))),frozenSourceSha256: p.sourceSha256,histories,
    scope: 'Post-hoc observer-only attribution of consumed patches on exact candidate replay. No new performance histories, policy input, independent physics, causal failure effect or qualified learner.'};
}
export async function replayProvenanceRecord(record,sources) {
  assert.equal(record.kind,'tick-consumption-provenance');
  for(const [name,sha]of Object.entries(record.frozenSourceSha256))assert.equal(digest(readFileSync(join(sources,name))),sha);
  const {TickCueExperiment}=await import(pathToFileURL(join(sources,'learning/tick-cue-experiment.mjs')).href);
  let receipts=0;
  for(const h of record.histories){
    const hash=createHash('sha256'),run=TickCueExperiment.restore(h.initialCheckpoint,event=>hash.update(JSON.stringify({role:'main:candidate',event})+'\n'));
    const records=[],remove=instrumentConsumption(run,row=>records.push(row));run.advance(1792);remove();
    assert.equal(digest(run.checkpoint()),h.finalSha256);assert.equal(hash.digest('hex'),h.eventsSha256);
    assert.equal(JSON.stringify(records),JSON.stringify(h.records),'Exact consumed-patch provenance replay mismatch');receipts+=records.length;
  }
  return {schema:1,passed:true,exactEventCheckpointAndProvenanceReplay:true,histories:record.histories.length,foodReceipts:receipts,
    node:process.version,platform:process.platform};
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2);
  if(args[0]==='--replay'){
    assert.equal(args.length,4);writeFileSync(args[3],JSON.stringify(await replayProvenanceRecord(JSON.parse(readFileSync(args[1])),resolve(args[2])),null,2)+'\n',{flag:'wx'});
  }else{assert.equal(args.length,2);writeFileSync(args[1],JSON.stringify(await replayConsumptionProvenance(resolve(args[0])))+'\n',{flag: 'wx'});}
}
