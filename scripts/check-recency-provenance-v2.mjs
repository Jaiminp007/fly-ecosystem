import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createGunzip} from 'node:zlib';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/recency-replay-offline/20261026-v2'),read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(base,'protocol.json'));let traces=0,decisions=0,examples=0;
for(const [name,digest]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),digest);
for(const [corpus,path]of Object.entries({original:'evidence/target-taste-development/20261026-v1/protocol.json',conflict:'evidence/adjacent-conflict-development/20261026-v2/protocol.json'}))assert.equal(hash(readFileSync(join(root,path))),protocol.studyProtocols[corpus]);
for(const input of protocol.inputs){
  const anchorData=readFileSync(join(root,input.anchor));assert.equal(hash(anchorData),input.anchorSha256);const oldRowData=readFileSync(join(root,input.row));assert.equal(hash(oldRowData),input.rowSha256);const oldRow=JSON.parse(oldRowData),anchor=JSON.parse(anchorData),alive=new Set(anchor.world.world.flies.map(fly=>fly.id)),row=read(join(base,'rows',input.corpus+'-'+input.seed+'.json')),expected=Object.fromEntries(Object.keys(row.founders).map(id=>[id,[]]));assert.equal(alive.size,Object.keys(expected).length);
  for(const phase of ['A','B','C']){const spec=input.traces[phase],oldTrace=oldRow.traces[input.seed+'-observe-acquire-'+phase];assert.equal(spec.sha256,oldTrace.sha256);assert.equal(spec.events,oldTrace.events);const pending={},source=createReadStream(join(root,spec.path)),stream=spec.compressed?source.pipe(createGunzip()):source,digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));let events=0;
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){const event=JSON.parse(line);events++;
      if(event.type==='decision'&&alive.has(event.id)){assert.ok(!pending[event.id]);pending[event.id]=event;decisions++;}
      else if(event.type==='observe'&&alive.has(event.own.agentId)){const decision=pending[event.own.agentId];assert.ok(decision);assert.equal(decision.tick,event.own.tick);delete pending[event.own.agentId];
        if(decision.choice.move===-1&&decision.choice.accept&&decision.own.odorPresent&&decision.own.contactPresent&&decision.own.contactHomogeneous&&event.own.lastFood!==0){
          expected[event.own.agentId].push({phase,agentId:event.own.agentId,tick:event.own.tick,cue:decision.own.cue,target:Number(event.own.lastFood>0)});examples++;}
      }
    }
    assert.equal(Object.keys(pending).length,0);assert.equal(events,spec.events);assert.equal(digest.digest('hex'),spec.sha256);traces++;
  }
  for(const [id,founder]of Object.entries(row.founders))assert.deepEqual(founder.examples,expected[id]);
}
const report={schema:1,passed:true,traces,decisions,examples,scope:'Independent own decision/observation example reconstruction and original trace hashes; not independent physical simulation.'};
writeFileSync(join(base,'provenance-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
