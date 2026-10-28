import assert from 'node:assert/strict';
import {createReadStream,existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createGunzip,gunzipSync} from 'node:zlib';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/steering-projection-development/20261026-v1'),output=join(root,'evidence/steering-projection-drift/20261026-v1');
assert.ok(!existsSync(output));mkdirSync(output,{recursive:true});
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),original=read(join(source,'protocol.json'));
const files=['scripts/steering-projection-drift.mjs','docs/STEERING_PROJECTION_DRIFT_PLAN.md'];
const protocol={schema:1,sourceProtocol:hash(readFileSync(join(source,'protocol.json'))),files:Object.fromEntries(files.map(path=>[path,hash(readFileSync(join(root,path)))])),scope:'Outcome-informed factual feature census; not a causal intervention or qualification.'};
writeFileSync(join(output,'protocol.json'),JSON.stringify(protocol,null,2)+'\n',{flag:'wx'});
const values=(model,features)=>model.weights.map((row,action)=>row.reduce((sum,value,index)=>sum+(value+model.contextWeights[0][action][index])*features[index],0));
const close=(left,right)=>assert.ok(Math.abs(left-right)<1e-10+1e-10*Math.max(Math.abs(left),Math.abs(right)));
const rows=[];
for(const history of original.histories){
  const rowPath=join(source,'rows',history.seed+'.json'),row=read(rowPath),result={seed:history.seed,rowSha256:hash(readFileSync(rowPath)),arms:{}};
  for(const arm of original.arms){
    const anchors={},anchorHashes={};for(const phase of ['B','C','D']){const data=readFileSync(join(source,'anchors',history.seed+'-'+arm+'-'+phase+'.json.gz'));anchorHashes[phase]=hash(data);anchors[phase]=JSON.parse(gunzipSync(data).toString());}
    const label=history.seed+'-'+arm+'-probe-transfer-current',trace=row.traces[label],digest=createHash('sha256'),stream=createReadStream(join(source,'traces',label+'.jsonl.gz')).pipe(createGunzip());stream.on('data',chunk=>digest.update(chunk));
    let events=0,decisions=0,available=0;const comparisons=Object.fromEntries(['CB','DC','DB'].map(key=>[key,{absoluteAdvantage:0,disagreements:0}]));
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);events++;if(event.type!=='decision')continue;decisions++;assert.deepEqual(event.own.cue,[0,0,0,0]);
      const predictions=Object.fromEntries(['B','C','D'].map(phase=>[phase,values(anchors[phase].state.learners[event.id].steering,event.features)]));
      for(let action=0;action<2;action++)close(predictions.D[action],event.steering.predictions[action]);
      if(!event.available)continue;available++;
      for(const [key,entry]of Object.entries(comparisons)){const left=predictions[key[0]],right=predictions[key[1]];entry.absoluteAdvantage+=Math.abs((left[1]-left[0])-(right[1]-right[0]));entry.disagreements+=Number((left[1]>left[0])!==(right[1]>right[0]));}
    }
    assert.equal(events,trace.events);assert.equal(digest.digest('hex'),trace.sha256);assert.ok(available>0);
    for(const entry of Object.values(comparisons)){entry.meanAbsoluteAdvantage=available?entry.absoluteAdvantage/available:null;entry.disagreementRate=available?entry.disagreements/available:null;}
    const current=row.arms[arm].probes['transfer-current'].endpoint;
    const resource=Object.fromEntries(['reset','native-full'].map(mode=>{const other=row.arms[arm].probes['transfer-'+mode].endpoint;return [mode,{energy:current.budgetAdjustedEnergyPerFounder-other.budgetAdjustedEnergyPerFounder,intake:(current.statistics.transfer.intake-other.statistics.transfer.intake)/current.founders,cost:(current.statistics.transfer.cost-other.statistics.transfer.cost)/current.founders,survivors:current.survivors-other.survivors}];}));
    result.arms[arm]={anchorHashes,traceSha256:trace.sha256,decisions,available,comparisons,resource};
  }
  writeFileSync(join(output,history.seed+'.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});rows.push(result);console.log(JSON.stringify({seed:history.seed,project:result.arms.project.comparisons}));
}
const arms=Object.fromEntries(original.arms.map(arm=>[arm,{comparisons:Object.fromEntries(['CB','DC','DB'].map(key=>[key,{meanAbsoluteAdvantage:rows.reduce((sum,row)=>sum+row.arms[arm].comparisons[key].meanAbsoluteAdvantage,0)/rows.length,meanDisagreementRate:rows.reduce((sum,row)=>sum+row.arms[arm].comparisons[key].disagreementRate,0)/rows.length}])),resource:Object.fromEntries(['reset','native-full'].map(mode=>[mode,Object.fromEntries(['energy','intake','cost','survivors'].map(key=>[key,rows.reduce((sum,row)=>sum+row.arms[arm].resource[mode][key],0)/rows.length]))]) )}]));
writeFileSync(join(output,'results.json'),JSON.stringify({schema:1,arms,scope:protocol.scope},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({arms}));
