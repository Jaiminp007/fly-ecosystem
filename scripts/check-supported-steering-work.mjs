import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createGunzip,gunzipSync} from 'node:zlib';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/supported-steering-development/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),checkpoint=path=>JSON.parse(gunzipSync(readFileSync(path+'.gz')).toString()),sha=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(base,'protocol.json'));
for(const [name,digest]of Object.entries(protocol.sourceSha256))assert.equal(sha(readFileSync(join(base,'sources',name))),digest);
let tapes=0,decisions=0,updates=0,terminalUpdates=0;
for(const history of protocol.histories){const row=read(join(base,'rows',history.seed+'.json'));
  for(const arm of protocol.arms)for(const phase of ['A','B','C','D']){
    const label=history.seed+'-'+arm+'-acquire-'+phase,trace=row.traces[label];if(!trace)continue;
    const initial=checkpoint(join(base,'starts',label+'.json')),final=checkpoint(join(base,'finals',label+'.json')),models={};
    for(const [id,state]of Object.entries(initial.state.learners)){assert.ok(state.steering.support&&!state.steering.projection);models[id]={work:state.steering.work.scalarOperations,pending:state.steering.pending!==null,dead:state.steering.dead};}
    const digest=createHash('sha256'),stream=createReadStream(join(base,'traces',label+'.jsonl.gz')).pipe(createGunzip());stream.on('data',chunk=>digest.update(chunk));let events=0;
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);events++;
      if(event.type==='decision'){const model=models[event.id];assert.ok(model&&!model.dead);model.work+=74;if(model.pending){model.work+=1199;updates++;}model.pending=true;assert.equal(model.work,event.steeringWork);decisions++;}
      else if(event.type==='observe'&&event.own.terminal){const model=models[event.own.agentId];assert.ok(model&&!model.dead);if(model.pending){model.work+=1151;model.pending=false;terminalUpdates++;}model.dead=true;}
    }
    assert.equal(events,trace.events);assert.equal(digest.digest('hex'),trace.sha256);
    for(const [id,state]of Object.entries(final.state.learners)){const model=models[id];assert.equal(model.work,state.steering.work.scalarOperations);assert.equal(model.pending,state.steering.pending!==null);assert.equal(model.dead,state.steering.dead);}
    tapes++;
  }
  console.log(JSON.stringify({seed:history.seed,tapes,decisions,updates,terminalUpdates}));
}
const report={schema:1,passed:true,tapes,decisions,updates,terminalUpdates,checkerSha256:sha(readFileSync(fileURLToPath(import.meta.url))),scope:'Independent arithmetic reconciliation of declared steering work and recorded schedule, not low-level operation or hardware-energy adequacy.'};
writeFileSync(join(base,'steering-work-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
