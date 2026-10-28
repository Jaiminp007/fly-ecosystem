import assert from 'node:assert/strict';
import {createReadStream,existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createGunzip} from 'node:zlib';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/supported-balanced-replay-development/20261026-v1'),funnel=join(root,'evidence/balanced-b-credit-funnel/20261026-v1'),output=join(root,'evidence/balanced-b-moving-contact/20261026-v1');assert.ok(!existsSync(output));mkdirSync(output,{recursive:true});
const read=path=>JSON.parse(readFileSync(path,'utf8')),sha=data=>createHash('sha256').update(data).digest('hex'),development=read(join(source,'protocol.json')),files=['scripts/balanced-b-moving-contact.mjs','docs/BALANCED_B_MOVING_CONTACT_PLAN.md'];
const protocol={schema:1,sourceProtocol:sha(readFileSync(join(source,'protocol.json'))),funnelProtocol:sha(readFileSync(join(funnel,'protocol.json'))),files:Object.fromEntries(files.map(path=>[path,sha(readFileSync(join(root,path)))])),scope:'Selected factual pre-movement contact census, not stopped counterfactuals or qualification.'};writeFileSync(join(output,'protocol.json'),JSON.stringify(protocol,null,2)+'\n',{flag:'wx'});
const keys=['contact','accepted','moving','movingAccepted','movingPositive','movingNegative'],rows=[];
for(const history of development.histories){const rowBytes=readFileSync(join(source,'rows',history.seed+'.json')),original=JSON.parse(rowBytes),priorBytes=readFileSync(join(funnel,history.seed+'.json')),prior=JSON.parse(priorBytes),result={seed:history.seed,rowSha256:sha(rowBytes),funnelSha256:sha(priorBytes),arms:{}};
  for(const arm of development.arms){const states=Object.fromEntries(prior.arms[arm].people.map(person=>[person.id,{id:person.id,bExamples:person.bExamples,counts:Object.fromEntries(keys.map(key=>[key,0]))}])),label=history.seed+'-'+arm+'-acquire-B',trace=original.traces[label],digest=createHash('sha256'),stream=createReadStream(join(source,'traces',label+'.jsonl.gz')).pipe(createGunzip());stream.on('data',chunk=>digest.update(chunk));let events=0;const pending={};
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){const event=JSON.parse(line);events++;if(event.type==='decision'&&states[event.id]){assert.ok(!pending[event.id]);pending[event.id]=event;const contact=event.own.odorPresent&&event.own.contactPresent&&event.own.contactHomogeneous,moving=event.choice.move!==-1,accepted=event.choice.accept,counts=states[event.id].counts;
      counts.contact+=Number(contact);counts.accepted+=Number(contact&&accepted);counts.moving+=Number(contact&&moving);counts.movingAccepted+=Number(contact&&moving&&accepted);
    }else if(event.type==='observe'&&states[event.own.agentId]){const id=event.own.agentId,decision=pending[id];assert.ok(decision&&decision.tick===event.own.tick);delete pending[id];if(decision.own.odorPresent&&decision.own.contactPresent&&decision.own.contactHomogeneous&&decision.choice.move!==-1&&decision.choice.accept){states[id].counts.movingPositive+=Number(event.own.lastFood>0);states[id].counts.movingNegative+=Number(event.own.lastFood<0);}}
    }
    assert.equal(Object.keys(pending).length,0);assert.equal(events,trace.events);assert.equal(digest.digest('hex'),trace.sha256);assert.equal(trace.sha256,prior.arms[arm].traceSha256);result.arms[arm]={traceSha256:trace.sha256,people:Object.values(states)};
  }
  writeFileSync(join(output,history.seed+'.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});rows.push(result);console.log(JSON.stringify({seed:history.seed}));
}
const arms={};for(const arm of development.arms){arms[arm]={};const people=rows.flatMap(row=>row.arms[arm].people);for(const group of ['withB','withoutB']){const selected=people.filter(person=>group==='withB'?person.bExamples>0:person.bExamples===0);arms[arm][group]={people:selected.length,totals:Object.fromEntries(keys.map(key=>[key,selected.reduce((sum,person)=>sum+person.counts[key],0)])),peopleWith:Object.fromEntries(keys.map(key=>[key,selected.filter(person=>person.counts[key]>0).length]))};}}
writeFileSync(join(output,'results.json'),JSON.stringify({schema:1,arms,scope:protocol.scope},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({arms}));
