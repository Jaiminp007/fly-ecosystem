import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createGunzip} from 'node:zlib';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/extended-b-development/20261026-v1'),output=join(root,'evidence/extended-b-taste-census/20261026-v1');assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(source,'protocol.json'));
const empty=()=>({count:0,probability:0,accepted:0,beneficial:0,toxin:0});const rows=[];
for(const history of protocol.histories){const row=read(join(source,'rows',history.seed+'.json'));
  for(const arm of protocol.arms){const label=history.seed+'-'+arm+'-acquire-B',startPath=join(source,'starts',label+'.json'),initial=read(startPath),trace=row.traces[label],phaseStart=initial.world.world.tick,pending={},groups={early:{good:empty(),bad:empty()},late:{good:empty(),bad:empty()}},digest=createHash('sha256');let events=0,decisions=0;
    const stream=createReadStream(join(source,'traces',label+'.jsonl.gz')).pipe(createGunzip());stream.on('data',chunk=>digest.update(chunk));
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);events++;
      if(event.type==='decision'){
        assert.ok(!pending[event.id]);let target=null;
        if(event.own.contactPresent&&event.own.odorPresent&&event.own.contactHomogeneous){
          const matches=initial.state.codebook.B.filter(item=>item.bits.every((value,index)=>value===event.own.cue[index]));assert.equal(matches.length,1);
          const half=event.tick-phaseStart<=512?'early':'late',type=matches[0].valence===1?'good':'bad';target=groups[half][type];target.count++;target.probability+=event.choice.feedProbability;target.accepted+=Number(event.choice.accept);
        }
        pending[event.id]={tick:event.tick,target};decisions++;
      }else if(event.type==='physical'){
        const item=pending[event.agentId];assert.ok(item);assert.equal(item.tick,event.tick);if(item.target){item.target.beneficial+=event.beneficialEaten;item.target.toxin+=event.toxinDamage;}delete pending[event.agentId];
      }
    }
    assert.equal(Object.keys(pending).length,0);assert.equal(events,trace.events);assert.equal(digest.digest('hex'),trace.sha256);
    rows.push({seed:history.seed,arm,startSha256:hash(readFileSync(startPath)),decisions,groups});
  }
}
const summary={};for(const arm of protocol.arms){summary[arm]={};for(const half of ['early','late']){summary[arm][half]={};for(const type of ['good','bad']){const sum=empty();for(const row of rows.filter(item=>item.arm===arm))for(const key of Object.keys(sum))sum[key]+=row.groups[half][type][key];summary[arm][half][type]={...sum,meanProbability:sum.count?sum.probability/sum.count:null,acceptedFraction:sum.count?sum.accepted/sum.count:null};}}}
const report={schema:1,sourceProtocolSha256:hash(readFileSync(join(source,'protocol.json'))),scriptSha256:hash(readFileSync(fileURLToPath(import.meta.url))),planSha256:hash(readFileSync(join(root,'docs/EXTENDED_B_TASTE_CENSUS_PLAN.md'))),scope:'Outcome-informed factual own-contact records with evaluator-only cue valence; no causal or qualification inference.',rows,summary};
mkdirSync(dirname(output),{recursive:true});mkdirSync(output);writeFileSync(join(output,'results.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(summary));
