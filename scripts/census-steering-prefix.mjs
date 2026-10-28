import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/taste-steering-crossover/20261026-v1'),output=join(root,'evidence/steering-prefix-census/20261026-v1');assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(source,'protocol.json'));
async function tape(label,trace){
  const stream=createReadStream(join(source,'traces',label+'.jsonl')),digest=createHash('sha256'),events=[];stream.on('data',chunk=>digest.update(chunk));
  for await(const line of createInterface({input:stream,crlfDelay:Infinity})){const event=JSON.parse(line);if(event.type==='decision'||event.type==='physical')events.push(event);}
  assert.equal(digest.digest('hex'),trace.sha256);return events;
}
const same=(left,right)=>JSON.stringify(left)===JSON.stringify(right),records=[];
for(const input of protocol.inputs){const row=read(join(source,'rows',input.history.seed+'.json'));
  for(const phase of ['A','B']){
    const arms=row.phases[phase].arms,labels=['AA','AB'].map(arm=>input.history.seed+'-'+phase+'-'+arm),[left,right]=await Promise.all(labels.map((label,index)=>tape(label,arms[['AA','AB'][index]].trace)));
    const startLeft=read(join(source,'starts',labels[0]+'.json')),startRight=read(join(source,'starts',labels[1]+'.json'));assert.deepEqual(startLeft.world,startRight.world);
    let matchedDecisions=0,matchedReceipts=0,first=null;
    for(let index=0;index<Math.max(left.length,right.length);index++){
      const before=left[index],after=right[index];if(!before||!after){first={kind:'event-count',index};break;}
      if(before.type!==after.type){first={kind:'event-order',index,before:before.type,after:after.type};break;}
      if(before.type==='decision'){
        if(before.id!==after.id||before.tick!==after.tick){first={kind:'decision-order',index,before:{id:before.id,tick:before.tick},after:{id:after.id,tick:after.tick}};break;}
        if(!same(before.own,after.own)){first={kind:'own-observation',index,id:before.id,tick:before.tick};break;}
        if(before.requestedExtra!==after.requestedExtra||before.storageBytes!==after.storageBytes){first={kind:'controller-cost',index,id:before.id,tick:before.tick,before:{requestedExtra:before.requestedExtra,storageBytes:before.storageBytes},after:{requestedExtra:after.requestedExtra,storageBytes:after.storageBytes}};break;}
        if(!same(before.outputs,after.outputs)){
          first={kind:'command',index,id:before.id,tick:before.tick,own:before.own,available:before.available,features:before.features,recommendation:before.recommendation,
            before:{outputs:before.outputs,steering:before.steering,choice:before.choice},after:{outputs:after.outputs,steering:after.steering,choice:after.choice}};break;
        }
        matchedDecisions++;
      }else{
        if(!same(before,after)){first={kind:'physical-receipt',index,before,after};break;}matchedReceipts++;
      }
    }
    records.push({seed:input.history.seed,phase,matchedDecisions,matchedReceipts,first,energyDifference:row.phases[phase].energy.steeringAtA});
  }
}
const result={schema:1,scope:'Post-outcome deterministic prefix census of AA vs AB: fixed A taste and A/B steering, same paid D-world starts; no counterfactual labels.',sourceProtocolSha256:hash(readFileSync(join(source,'protocol.json'))),scriptSha256:hash(readFileSync(fileURLToPath(import.meta.url))),records};
mkdirSync(dirname(output),{recursive:true});mkdirSync(output);writeFileSync(join(output,'results.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({records:records.map(record=>({seed:record.seed,phase:record.phase,matchedDecisions:record.matchedDecisions,matchedReceipts:record.matchedReceipts,first:record.first&&{kind:record.first.kind,id:record.first.id,tick:record.first.tick,before:record.first.before?.steering?.action,after:record.first.after?.steering?.action},energyDifference:record.energyDifference}))}));
