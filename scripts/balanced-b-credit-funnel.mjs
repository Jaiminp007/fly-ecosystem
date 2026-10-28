import assert from 'node:assert/strict';
import {createReadStream,existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createGunzip} from 'node:zlib';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/supported-balanced-replay-development/20261026-v1'),founder=join(root,'evidence/balanced-pressure-founder/20261026-v2'),output=join(root,'evidence/balanced-b-credit-funnel/20261026-v1');assert.ok(!existsSync(output));mkdirSync(output,{recursive:true});
const read=path=>JSON.parse(readFileSync(path,'utf8')),sha=data=>createHash('sha256').update(data).digest('hex'),development=read(join(source,'protocol.json')),files=['scripts/balanced-b-credit-funnel.mjs','docs/BALANCED_B_CREDIT_FUNNEL_PLAN.md'];
const protocol={schema:1,sourceProtocol:sha(readFileSync(join(source,'protocol.json'))),founderProtocol:sha(readFileSync(join(founder,'protocol.json'))),files:Object.fromEntries(files.map(path=>[path,sha(readFileSync(join(root,path)))])),scope:'D-survivor-selected own-credit funnel; not causal exposure or qualification.'};writeFileSync(join(output,'protocol.json'),JSON.stringify(protocol,null,2)+'\n',{flag:'wx'});
const stages=['decisions','stationary','accept','odor','contact','homogeneous','examples'],rows=[];
for(const history of development.histories){const rowBytes=readFileSync(join(source,'rows',history.seed+'.json')),original=JSON.parse(rowBytes),founderBytes=readFileSync(join(founder,history.seed+'.json')),survivors=JSON.parse(founderBytes),result={seed:history.seed,rowSha256:sha(rowBytes),founderSha256:sha(founderBytes),arms:{}};
  for(const arm of development.arms){const people=survivors.arms[arm].phases.A.founders,states=Object.fromEntries(people.map(person=>[person.id,{id:person.id,bExamples:person.bExamples,counts:Object.fromEntries(stages.map(stage=>[stage,0]))}])),label=history.seed+'-'+arm+'-acquire-B',trace=original.traces[label],digest=createHash('sha256'),stream=createReadStream(join(source,'traces',label+'.jsonl.gz')).pipe(createGunzip());stream.on('data',chunk=>digest.update(chunk));
    let events=0;const pending={};for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);events++;if(event.type==='decision'&&states[event.id]){assert.ok(!pending[event.id]);pending[event.id]=event;const counts=states[event.id].counts;counts.decisions++;
        if(event.choice.move===-1){counts.stationary++;if(event.choice.accept){counts.accept++;if(event.own.odorPresent){counts.odor++;if(event.own.contactPresent){counts.contact++;if(event.own.contactHomogeneous)counts.homogeneous++;}}}}
      }else if(event.type==='observe'&&states[event.own.agentId]){const id=event.own.agentId,decision=pending[id];assert.ok(decision);assert.equal(decision.tick,event.own.tick);delete pending[id];
        if(decision.choice.move===-1&&decision.choice.accept&&decision.own.odorPresent&&decision.own.contactPresent&&decision.own.contactHomogeneous&&event.own.lastFood!==0)states[id].counts.examples++;
      }
    }
    assert.equal(Object.keys(pending).length,0);assert.equal(events,trace.events);assert.equal(digest.digest('hex'),trace.sha256);for(const state of Object.values(states)){assert.equal(state.counts.examples,state.bExamples);for(let index=1;index<stages.length;index++)assert.ok(state.counts[stages[index]]<=state.counts[stages[index-1]]);}
    result.arms[arm]={traceSha256:trace.sha256,people:Object.values(states)};
  }
  writeFileSync(join(output,history.seed+'.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});rows.push(result);console.log(JSON.stringify({seed:history.seed}));
}
const arms={};for(const arm of development.arms){arms[arm]={};const people=rows.flatMap(row=>row.arms[arm].people);for(const group of ['withB','withoutB']){const selected=people.filter(person=>group==='withB'?person.bExamples>0:person.bExamples===0),reasons={};for(const person of selected)if(person.bExamples===0){const missing=stages.slice(1).find(stage=>person.counts[stage]===0);reasons[missing]=(reasons[missing]??0)+1;}
  arms[arm][group]={people:selected.length,stages:Object.fromEntries(stages.map(stage=>[stage,selected.reduce((sum,person)=>sum+person.counts[stage],0)])),zeroReasons:reasons};}}
writeFileSync(join(output,'results.json'),JSON.stringify({schema:1,arms,scope:protocol.scope},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({arms}));
