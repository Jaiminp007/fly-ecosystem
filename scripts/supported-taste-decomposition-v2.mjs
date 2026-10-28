import assert from 'node:assert/strict';
import {createReadStream,existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createGunzip,gunzipSync} from 'node:zlib';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/supported-steering-development/20261026-v1'),output=join(root,'evidence/supported-taste-decomposition/20261026-v2');assert.ok(!existsSync(output));mkdirSync(output,{recursive:true});
const read=path=>JSON.parse(readFileSync(path,'utf8')),sha=data=>createHash('sha256').update(data).digest('hex'),development=read(join(source,'protocol.json'));
const files=['scripts/supported-taste-decomposition-v2.mjs','docs/SUPPORTED_TASTE_DECOMPOSITION_PLAN.md','docs/SUPPORTED_TASTE_DECOMPOSITION_RECOVERY.md'],protocol={schema:1,sourceProtocol:sha(readFileSync(join(source,'protocol.json'))),files:Object.fromEntries(files.map(path=>[path,sha(readFileSync(join(root,path)))])),scope:'Post-assertion outcome-informed factual-input parameter decomposition; not causal physical outcome or qualification.'};
writeFileSync(join(output,'protocol.json'),JSON.stringify(protocol,null,2)+'\n',{flag:'wx'});
const index=cue=>cue.reduce((sum,value,position)=>sum+(value===1?2**position:0),0);
function logit(model,cue){const features=[1,...cue];for(let first=0;first<4;first++)for(let second=first+1;second<4;second++)features.push(cue[first]*cue[second]);return {shared:Math.log(3)+model.weights.reduce((sum,value,position)=>sum+value*features[position],0)/Math.sqrt(11),residual:model.residuals[index(cue)]};}
const close=(left,right)=>assert.ok(Math.abs(left-right)<1e-10+1e-10*Math.max(Math.abs(left),Math.abs(right))),rows=[];
for(const history of development.histories){const rowBytes=readFileSync(join(source,'rows',history.seed+'.json')),original=JSON.parse(rowBytes),anchors={},anchorHashes={};
  for(const phase of ['A','B','D']){const bytes=readFileSync(join(source,'anchors',history.seed+'-protect-'+phase+'.json.gz'));anchorHashes[phase]=sha(bytes);anchors[phase]=JSON.parse(gunzipSync(bytes).toString());}
  const book=anchors.A.state.codebook;assert.deepEqual(book,anchors.B.state.codebook);const aSlots=book.A.map(item=>index(item.bits)),bSlots=book.B.map(item=>index(item.bits));assert.equal(new Set([...aSlots,...bSlots]).size,8);
  const agents=anchors.D.world.world.flies.map(fly=>fly.id),support={agents:agents.length,withA:0,withB:0,examplesA:0,examplesB:0,unchangedAResiduals:0,changedAResiduals:0};
  for(const id of agents){const before=anchors.A.state.learners[id].cueTaste,after=anchors.B.state.learners[id].cueTaste,examplesB=after.seen-before.seen;assert.ok(examplesB>=0);support.withA+=Number(before.seen>0);support.withB+=Number(examplesB>0);support.examplesA+=before.seen;support.examplesB+=examplesB;
    for(const slot of aSlots){if(before.residuals[slot]===after.residuals[slot])support.unchangedAResiduals++;else support.changedAResiduals++;}}
  const result={seed:history.seed,rowSha256:sha(rowBytes),anchorHashes,support,probes:{}};
  for(const saved of ['A','B']){const label=history.seed+'-protect-probe-A-'+saved,trace=original.traces[label],digest=createHash('sha256'),stream=createReadStream(join(source,'traces',label+'.jsonl.gz')).pipe(createGunzip());stream.on('data',chunk=>digest.update(chunk));
    const totals={decisions:0,odor:0,sharedAbsolute:0,residualAbsolute:0,changedShared:0,changedResidual:0};let events=0;
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){const event=JSON.parse(line);events++;if(event.type!=='decision')continue;totals.decisions++;if(!event.own.odorPresent)continue;totals.odor++;
      const slot=index(event.own.cue);assert.ok(aSlots.includes(slot));const before=logit(anchors.A.state.learners[event.id].cueTaste,event.own.cue),after=logit(anchors.B.state.learners[event.id].cueTaste,event.own.cue),selected=saved==='A'?before:after;
      close(.05+.9/(1+Math.exp(-(selected.shared+selected.residual))),event.choice.feedProbability);const shared=after.shared-before.shared,residual=after.residual-before.residual;totals.changedResidual+=Number(residual!==0);totals.sharedAbsolute+=Math.abs(shared);totals.residualAbsolute+=Math.abs(residual);totals.changedShared+=Number(shared!==0);
    }
    assert.equal(events,trace.events);assert.equal(digest.digest('hex'),trace.sha256);result.probes[saved]={traceSha256:trace.sha256,totals};
  }
  writeFileSync(join(output,history.seed+'.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});rows.push(result);console.log(JSON.stringify(result));
}
const support=Object.fromEntries(['agents','withA','withB','examplesA','examplesB','unchangedAResiduals','changedAResiduals'].map(key=>[key,rows.reduce((sum,row)=>sum+row.support[key],0)])),probes=Object.fromEntries(['A','B'].map(saved=>[saved,Object.fromEntries(['decisions','odor','sharedAbsolute','residualAbsolute','changedShared','changedResidual'].map(key=>[key,rows.reduce((sum,row)=>sum+row.probes[saved].totals[key],0)]))]));
writeFileSync(join(output,'results.json'),JSON.stringify({schema:1,support,probes,scope:protocol.scope},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({support,probes}));

