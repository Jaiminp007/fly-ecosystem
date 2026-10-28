import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/supported-balanced-replay-development/20261026-v1'),base=join(root,'evidence/balanced-pressure-founder/20261026-v2');
const read=path=>JSON.parse(readFileSync(path,'utf8')),sha=data=>createHash('sha256').update(data).digest('hex'),close=(left,right)=>assert.ok(Math.abs(left-right)<1e-8+1e-10*Math.max(Math.abs(left),Math.abs(right))),protocol=read(join(base,'protocol.json')),previous=read(join(source,'protocol.json'));
assert.equal(sha(readFileSync(join(source,'protocol.json'))),protocol.sourceProtocol);for(const [path,digest]of Object.entries(protocol.files))assert.equal(sha(readFileSync(join(root,path))),digest);
const values=[];let receipts=0;
for(const history of previous.histories){const saved=read(join(base,history.seed+'.json')),rowBytes=readFileSync(join(source,'rows',history.seed+'.json')),row=JSON.parse(rowBytes);assert.equal(sha(rowBytes),saved.rowSha256);
  for(const arm of previous.arms){const anchors={};for(const phase of ['A','B','D']){const bytes=readFileSync(join(source,'anchors',history.seed+'-'+arm+'-'+phase+'.json.gz'));assert.equal(sha(bytes),saved.arms[arm].anchorHashes[phase]);anchors[phase]=JSON.parse(gunzipSync(bytes).toString());}
    const alive=new Set(anchors.D.world.world.flies.map(fly=>fly.id));
    for(const phase of ['A','B']){const probes={};for(const model of ['A','B']){const label=history.seed+'-'+arm+'-probe-'+phase+'-'+model,initialBytes=readFileSync(join(source,'starts',label+'.json.gz')),finalBytes=readFileSync(join(source,'finals',label+'.json.gz')),initial=JSON.parse(gunzipSync(initialBytes)),final=JSON.parse(gunzipSync(finalBytes)),trace=gunzipSync(readFileSync(join(source,'traces',label+'.jsonl.gz')));
        assert.equal(sha(initialBytes),saved.arms[arm].phases[phase].inputs[model].startHash);assert.equal(sha(finalBytes),saved.arms[arm].phases[phase].inputs[model].finalHash);assert.equal(sha(trace),row.traces[label].sha256);assert.equal(sha(trace),saved.arms[arm].phases[phase].inputs[model].traceHash);
        const energy={},net={},physical=new Map(final.world.world.flies.map(fly=>[fly.id,fly.energy])),lines=trace.toString().split('\n');assert.equal(lines.pop(),'');assert.equal(lines.length,row.traces[label].events);
        for(const line of lines){const event=JSON.parse(line);if(event.type==='physical'){net[event.agentId]=(net[event.agentId]??0)+event.beneficialEaten-event.toxinDamage;receipts++;}}
        for(const id of initial.state.founderIds)energy[id]=(physical.get(id)??0)-final.state.learners[id].charge.outstandingEnergy;
        close((Object.values(energy).reduce((sum,value)=>sum+value,0)-initial.state.startingEnergy+initial.state.startingDebt)/initial.state.founderIds.length,row.arms[arm].probes[phase+'-'+model].endpoint.budgetAdjustedEnergyPerFounder);
        probes[model]={initial,energy,net};
      }
      assert.deepEqual(probes.A.initial.world,probes.B.initial.world);close(probes.A.initial.state.startingDebt,probes.B.initial.state.startingDebt);const sign=phase==='A'?1:-1,founders=saved.arms[arm].phases[phase].founders;assert.equal(founders.length,alive.size);
      for(const entry of founders){assert.ok(alive.has(entry.id));assert.equal(entry.bExamples,anchors.B.state.learners[entry.id].cueTaste.seen-anchors.A.state.learners[entry.id].cueTaste.seen);close(entry.energy,sign*(probes.A.energy[entry.id]-probes.B.energy[entry.id]));close(entry.net,sign*((probes.A.net[entry.id]??0)-(probes.B.net[entry.id]??0)));values.push({arm,phase,...entry});}
    }
  }
}
const result=read(join(base,'results.json'));for(const arm of previous.arms)for(const phase of ['A','B'])for(const group of ['withB','withoutB']){
  const items=values.filter(item=>item.arm===arm&&item.phase===phase&&(group==='withB'?item.bExamples>0:item.bExamples===0)),entry=result.groups[arm][phase][group];assert.equal(entry.count,items.length);
  for(const metric of ['energy','net']){const total=items.reduce((sum,item)=>sum+item[metric],0);close(entry[metric+'Total'],total);if(items.length)close(entry[metric+'Mean'],total/items.length);else assert.equal(entry[metric+'Mean'],null);}
  assert.equal(entry.positive,items.filter(item=>item.energy>1e-9).length);assert.equal(entry.negative,items.filter(item=>item.energy< -1e-9).length);assert.equal(entry.tied,items.filter(item=>Math.abs(item.energy)<=1e-9).length);
}
const report={schema:1,passed:true,histories:previous.histories.length,founderContrasts:values.length,receipts,checkerSha256:sha(readFileSync(fileURLToPath(import.meta.url))),scope:'Independent founder endpoint, inherited-debt, factual receipt and grouped arithmetic reconstruction; not independent physical dynamics or exposure causality.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
