import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createGunzip} from 'node:zlib';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/extended-b-taste-census/20261026-v1'),source=join(root,'evidence/extended-b-development/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),close=(left,right)=>assert.ok(Math.abs(left-right)<1e-8+1e-10*Math.max(Math.abs(left),Math.abs(right))),result=read(join(base,'results.json'));
assert.equal(hash(readFileSync(join(source,'protocol.json'))),result.sourceProtocolSha256);assert.equal(hash(readFileSync(join(root,'scripts/census-extended-b-taste.mjs'))),result.scriptSha256);assert.equal(hash(readFileSync(join(root,'docs/EXTENDED_B_TASTE_CENSUS_PLAN.md'))),result.planSha256);
let decisions=0,selected=0,receipts=0;
for(const row of result.rows){const label=row.seed+'-'+row.arm+'-acquire-B',path=join(source,'starts',label+'.json'),start=read(path),study=read(join(source,'rows',row.seed+'.json'));assert.equal(hash(readFileSync(path)),row.startSha256);
  const groups=Object.fromEntries(['early','late'].map(half=>[half,Object.fromEntries(['good','bad'].map(type=>[type,{count:0,probability:0,accepted:0,beneficial:0,toxin:0}]))])),pending={},digest=createHash('sha256');let events=0,count=0;
  const stream=createReadStream(join(source,'traces',label+'.jsonl.gz')).pipe(createGunzip());stream.on('data',chunk=>digest.update(chunk));
  for await(const line of createInterface({input:stream,crlfDelay:Infinity})){const event=JSON.parse(line);events++;
    if(event.type==='decision'){
      let group=null;if(event.own.odorPresent&&event.own.contactPresent&&event.own.contactHomogeneous){const entry=start.state.codebook.B.find(item=>item.bits.every((value,index)=>value===event.own.cue[index]));assert.ok(entry);
        group=groups[event.tick-start.world.world.tick<=512?'early':'late'][entry.valence>0?'good':'bad'];group.count++;group.probability+=event.choice.feedProbability;group.accepted+=Number(event.choice.accept);selected++;}
      assert.ok(!pending[event.id]);pending[event.id]={tick:event.tick,group};decisions++;count++;
    }else if(event.type==='physical'){const entry=pending[event.agentId];assert.ok(entry);assert.equal(entry.tick,event.tick);if(entry.group){entry.group.beneficial+=event.beneficialEaten;entry.group.toxin+=event.toxinDamage;}delete pending[event.agentId];receipts++;}
  }
  assert.equal(Object.keys(pending).length,0);assert.equal(count,row.decisions);assert.equal(events,study.traces[label].events);assert.equal(digest.digest('hex'),study.traces[label].sha256);
  for(const half of ['early','late'])for(const type of ['good','bad'])for(const key of Object.keys(groups[half][type]))close(groups[half][type][key],row.groups[half][type][key]);
}
assert.equal(decisions,receipts);for(const arm of ['observe','filter'])for(const half of ['early','late'])for(const type of ['good','bad']){const sum={count:0,probability:0,accepted:0,beneficial:0,toxin:0};for(const row of result.rows.filter(item=>item.arm===arm))for(const key of Object.keys(sum))sum[key]+=row.groups[half][type][key];
  const target=result.summary[arm][half][type];for(const key of Object.keys(sum))close(sum[key],target[key]);if(sum.count){close(target.meanProbability,sum.probability/sum.count);close(target.acceptedFraction,sum.accepted/sum.count);}}
const report={schema:1,passed:true,decisions,receipts,selected,scope:'Independent factual cue, propensity, receipt and aggregate reconstruction from recorded traces; not independent physics or causal evaluation.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
