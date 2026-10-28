import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createGunzip} from 'node:zlib';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createTwoTimescaleTaste,learnTwoTimescaleTaste} from '../learning/two-timescale-taste.mjs';
import {diagnosticScores} from '../learning/taste-checkpoint-diagnostic.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),output=join(root,'evidence/recency-replay-offline/20261026-v2');assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),rel=path=>relative(root,path).split(sep).join('/'),write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const original=join(root,'evidence/target-taste-development/20261026-v1'),conflict=join(root,'evidence/adjacent-conflict-development/20261026-v2'),originalProtocol=read(join(original,'protocol.json')),conflictProtocol=read(join(conflict,'protocol.json')),inputs=[];
for(const [corpus,study,studyProtocol]of [['original',original,originalProtocol],['conflict',conflict,conflictProtocol]])for(const history of studyProtocol.histories){
  const location=corpus==='conflict'&&studyProtocol.reusedSeeds.includes(history.seed)?join(root,'evidence/adjacent-conflict-development/20261026-v1'):study,rowPath=join(location,'rows',history.seed+'.json'),row=read(rowPath),anchor=join(location,'anchors',history.seed+'-observe-D.json');
  const traces={};for(const phase of ['A','B','C']){const label=history.seed+'-observe-acquire-'+phase,entry=row.traces[label];assert.ok(entry);const compressed=corpus==='conflict';traces[phase]={path:rel(join(location,'traces',label+'.jsonl'+(compressed?'.gz':''))),compressed,sha256:entry.sha256,events:entry.events};}
  inputs.push({corpus,seed:history.seed,row:rel(rowPath),rowSha256:hash(readFileSync(rowPath)),anchor:rel(anchor),anchorSha256:hash(readFileSync(anchor)),traces});
}
const sources={};function visit(path){const name=rel(path);assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;const data=readFileSync(path);sources[name]=hash(data);if(/\.m?js$/.test(name))for(const match of data.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));}
for(const name of ['scripts/recency-replay-offline-v2.mjs','scripts/check-recency-provenance-v2.mjs','scripts/check-recency-learning-v2.mjs','docs/RECENCY_REPLAY_OFFLINE_PLAN.md','docs/RECENCY_REPLAY_V1_BOUNDARY_NOTE.md','tests/two-timescale-taste.test.mjs'])visit(join(root,name));
const protocol={schema:1,inputs,sourceSha256:sources,studyProtocols:{original:hash(readFileSync(join(original,'protocol.json'))),conflict:hash(readFileSync(join(conflict,'protocol.json')))},policies:['uniform','recent-mix'],scope:'Offline factual selected-body replay on reused histories; evaluator labels never enter training, no physical benefit or qualification claim.'};
write(join(output,'protocol.json'),protocol);for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
const rows=[];
for(const input of inputs){
  assert.equal(hash(readFileSync(join(root,input.row))),input.rowSha256);const anchorData=readFileSync(join(root,input.anchor));assert.equal(hash(anchorData),input.anchorSha256);const anchor=JSON.parse(anchorData),founders={};
  for(const fly of anchor.world.world.flies){const learnerSeed=(input.seed^Math.imul(fly.id,2654435761)^0x2c9277b5)>>>0||1;founders[fly.id]={agentId:fly.id,learnerSeed,examples:[],models:{uniform:createTwoTimescaleTaste(fly.id,learnerSeed),'recent-mix':createTwoTimescaleTaste(fly.id,learnerSeed)},checkpoints:{},scores:{},encodedBytes:{},recentReplays:0};}
  assert.ok(Object.keys(founders).length>0);
  for(const phase of ['A','B','C']){
    const spec=input.traces[phase],source=createReadStream(join(root,spec.path)),stream=spec.compressed?source.pipe(createGunzip()):source,digest=createHash('sha256'),pending={};stream.on('data',chunk=>digest.update(chunk));let events=0;
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);events++;
      if(event.type==='decision'&&Object.hasOwn(founders,event.id)){assert.ok(!pending[event.id]);pending[event.id]=event;}
      else if(event.type==='observe'&&Object.hasOwn(founders,event.own.agentId)){
        const decision=pending[event.own.agentId];assert.ok(decision);assert.equal(decision.tick,event.own.tick);delete pending[event.own.agentId];assert.equal(event.own.terminal,false);
        if(decision.choice.move===-1&&decision.choice.accept&&decision.own.odorPresent&&decision.own.contactPresent&&decision.own.contactHomogeneous&&event.own.lastFood!==0){
          const factual={agentId:event.own.agentId,tick:event.own.tick,cue:decision.own.cue,target:Number(event.own.lastFood>0)},example={phase,...factual},founder=founders[event.own.agentId];founder.examples.push(example);
          learnTwoTimescaleTaste(founder.models.uniform,factual,'uniform');const result=learnTwoTimescaleTaste(founder.models['recent-mix'],factual,'recent-mix');founder.recentReplays+=Number(result.useRecent);
          assert.equal(founder.models.uniform.work.scalarOperations,founder.models['recent-mix'].work.scalarOperations);assert.equal(founder.models.uniform.rngState,founder.models['recent-mix'].rngState);
        }
      }
    }
    assert.equal(Object.keys(pending).length,0);assert.equal(events,spec.events);assert.equal(digest.digest('hex'),spec.sha256);
    for(const founder of Object.values(founders)){founder.checkpoints[phase]={};founder.scores[phase]={};founder.encodedBytes[phase]={};
      for(const policy of protocol.policies){const model=founder.models[policy];founder.checkpoints[phase][policy]=structuredClone(model);founder.scores[phase][policy]=Object.fromEntries(['A','B'].map(family=>[family,diagnosticScores(model.weights,anchor.state.codebook[family]).logLoss]));founder.encodedBytes[phase][policy]=encodedStateBytes(model);}
      assert.equal(founder.encodedBytes[phase].uniform,founder.encodedBytes[phase]['recent-mix']);
    }
  }
  const items=Object.values(founders);for(const founder of items)delete founder.models;
  const bImprovement=items.reduce((sum,founder)=>sum+founder.scores.B.uniform.B-founder.scores.B['recent-mix'].B,0)/items.length,aLossChange=items.reduce((sum,founder)=>sum+founder.scores.C['recent-mix'].A-founder.scores.C.uniform.A,0)/items.length;
  const row={corpus:input.corpus,seed:input.seed,founders,bImprovement,aLossChange};write(join(output,'rows',input.corpus+'-'+input.seed+'.json'),row);rows.push(row);console.log(JSON.stringify({corpus:input.corpus,seed:input.seed,founders:items.length,bImprovement,aLossChange}));
}
for(const [name,digest]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),digest);
const corpora=Object.fromEntries(['original','conflict'].map(corpus=>{const values=rows.filter(row=>row.corpus===corpus);assert.equal(values.length,8);const meanBImprovement=values.reduce((sum,row)=>sum+row.bImprovement,0)/8,bPositiveHistories=values.filter(row=>row.bImprovement>0).length,meanALossChange=values.reduce((sum,row)=>sum+row.aLossChange,0)/8;return [corpus,{meanBImprovement,bPositiveHistories,meanALossChange,offlineGate:meanBImprovement>0&&bPositiveHistories>=6&&meanALossChange<=0}];}));
write(join(output,'results.json'),{schema:1,qualified:false,corpora,jointOfflineGate:Object.values(corpora).every(value=>value.offlineGate),scope:protocol.scope});console.log(JSON.stringify({corpora}));
