import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/taste-cue-filter-development/20261026-v1'),read=path=>JSON.parse(readFileSync(path,'utf8'));
const protocol=read(join(base,'protocol.json'));let decisions=0,examples=0,suppressed=0,traces=0;const arms={};
for(const arm of protocol.arms){arms[arm]={decisions:0,examples:0,suppressed:0};
  for(const history of protocol.histories){const row=read(join(base,'rows',history.seed+'.json'));
    for(const phase of ['A','B','C','D']){
      const label=history.seed+'-'+arm+'-acquire-'+phase,trace=row.traces[label];if(!trace)continue;
      const initial=read(join(base,'starts',label+'.json')),final=read(join(base,'finals',label+'.json')),pending={},counts={},digest=createHash('sha256');let events=0;
      assert.equal(initial.state.contactCueMode,arm);
      const stream=createReadStream(join(base,'traces',label+'.jsonl'));stream.on('data',chunk=>digest.update(chunk));
      for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
        const event=JSON.parse(line);events++;
        if(event.type==='decision'){
          assert.equal(typeof event.own.contactHomogeneous,'boolean');assert.ok(!pending[event.id]);pending[event.id]=event;decisions++;arms[arm].decisions++;
        }else if(event.type==='observe'){
          const decision=pending[event.own.agentId];assert.ok(decision);assert.equal(decision.tick,event.own.tick);delete pending[event.own.agentId];
          const factual=decision.choice.move===-1&&decision.choice.accept&&decision.own.contactPresent&&decision.own.odorPresent&&event.own.lastFood!==0;
          if(factual&&arm==='filter'&&!decision.own.contactHomogeneous){suppressed++;arms[arm].suppressed++;}
          if(factual&&(arm!=='filter'||decision.own.contactHomogeneous)){counts[event.own.agentId]=(counts[event.own.agentId]??0)+1;examples++;arms[arm].examples++;}
        }
      }
      assert.equal(Object.keys(pending).length,0);assert.equal(events,trace.events);assert.equal(digest.digest('hex'),trace.sha256);
      for(const [id,state]of Object.entries(final.state.learners))assert.equal(state.tasteExamples-initial.state.learners[id].tasteExamples,counts[id]??0);
      traces++;
    }
  }
}
const report={schema:1,passed:true,traces,decisions,examples,suppressed,arms,scope:'Independent trace-based reconstruction of factual taste example counts and suppression; contact geometry and hardware energy are not independently simulated.'};
writeFileSync(join(base,'credit-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
