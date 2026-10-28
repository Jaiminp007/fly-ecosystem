import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/supported-balanced-replay-development/20261026-v1'),founder=join(root,'evidence/balanced-pressure-founder/20261026-v2'),base=join(root,'evidence/balanced-b-credit-funnel/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),sha=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(base,'protocol.json')),development=read(join(source,'protocol.json'));
assert.equal(sha(readFileSync(join(source,'protocol.json'))),protocol.sourceProtocol);assert.equal(sha(readFileSync(join(founder,'protocol.json'))),protocol.founderProtocol);for(const [path,digest]of Object.entries(protocol.files))assert.equal(sha(readFileSync(join(root,path))),digest);
const stages=['decisions','stationary','accept','odor','contact','homogeneous','examples'],peopleByArm={rbase:[],blend:[]};let decisions=0,examples=0;
for(const history of development.histories){const expected=read(join(base,history.seed+'.json')),rowBytes=readFileSync(join(source,'rows',history.seed+'.json')),row=JSON.parse(rowBytes),founderBytes=readFileSync(join(founder,history.seed+'.json'));assert.equal(sha(rowBytes),expected.rowSha256);assert.equal(sha(founderBytes),expected.founderSha256);
  for(const arm of development.arms){const label=history.seed+'-'+arm+'-acquire-B',initial=JSON.parse(gunzipSync(readFileSync(join(source,'starts',label+'.json.gz')))),final=JSON.parse(gunzipSync(readFileSync(join(source,'finals',label+'.json.gz')))),last=JSON.parse(gunzipSync(readFileSync(join(source,'anchors',history.seed+'-'+arm+'-D.json.gz')))),buffer=gunzipSync(readFileSync(join(source,'traces',label+'.jsonl.gz')));assert.equal(sha(buffer),row.traces[label].sha256);assert.equal(sha(buffer),expected.arms[arm].traceSha256);
    const states={};for(const fly of last.world.world.flies)states[fly.id]={id:fly.id,bExamples:final.state.learners[fly.id].cueTaste.seen-initial.state.learners[fly.id].cueTaste.seen,counts:Object.fromEntries(stages.map(stage=>[stage,0]))};
    const pending={},lines=buffer.toString().split('\n');assert.equal(lines.pop(),'');assert.equal(lines.length,row.traces[label].events);
    for(const line of lines){const event=JSON.parse(line);if(event.type==='decision'&&states[event.id]){
      assert.ok(!pending[event.id]);pending[event.id]=event;const count=states[event.id].counts,stationary=event.choice.move===-1,accept=stationary&&event.choice.accept,odor=accept&&event.own.odorPresent,contact=odor&&event.own.contactPresent,homogeneous=contact&&event.own.contactHomogeneous;
      count.decisions++;count.stationary+=Number(stationary);count.accept+=Number(accept);count.odor+=Number(odor);count.contact+=Number(contact);count.homogeneous+=Number(homogeneous);decisions++;
    }else if(event.type==='observe'&&states[event.own.agentId]){const id=event.own.agentId,decision=pending[id];assert.ok(decision&&decision.tick===event.own.tick);delete pending[id];
      if(decision.choice.move===-1&&decision.choice.accept&&decision.own.odorPresent&&decision.own.contactPresent&&decision.own.contactHomogeneous&&event.own.lastFood!==0){states[id].counts.examples++;examples++;}}
    }
    assert.equal(Object.keys(pending).length,0);const actual=Object.values(states);assert.deepEqual(actual,expected.arms[arm].people);for(const person of actual)assert.equal(person.counts.examples,person.bExamples);peopleByArm[arm].push(...actual);
  }
}
const result=read(join(base,'results.json'));for(const arm of development.arms)for(const group of ['withB','withoutB']){const selected=peopleByArm[arm].filter(person=>group==='withB'?person.bExamples>0:person.bExamples===0),actual=result.arms[arm][group],reasons={};assert.equal(selected.length,actual.people);
  for(const stage of stages)assert.equal(selected.reduce((sum,person)=>sum+person.counts[stage],0),actual.stages[stage]);for(const person of selected)if(!person.bExamples){const missing=stages.slice(1).find(stage=>person.counts[stage]===0);reasons[missing]=(reasons[missing]??0)+1;}assert.deepEqual(reasons,actual.zeroReasons);
}
const report={schema:1,passed:true,histories:development.histories.length,decisions,examples,checkerSha256:sha(readFileSync(fileURLToPath(import.meta.url))),scope:'Independent recorded own-action/observation funnel and saved seen-count reconstruction; not causal intervention or physical simulation.'};writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
