import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/decoupled-cue-offline/20261026-v1'),previous=join(root,'evidence/recency-replay-offline/20261026-v2'),read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(base,'protocol.json'));
for(const [name,digest]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),digest);assert.equal(hash(readFileSync(join(previous,'protocol.json'))),protocol.previousProtocolSha256);assert.equal(hash(readFileSync(join(previous,'provenance-readback.json'))),protocol.previousProvenanceSha256);assert.equal(read(join(previous,'provenance-readback.json')).passed,true);
function bytes(value){if(value===null||typeof value==='boolean')return 1;if(typeof value==='number'){assert.ok(Number.isFinite(value));return 8;}if(typeof value==='string')return 4+Buffer.byteLength(value);if(Array.isArray(value))return 4+value.reduce((sum,item)=>sum+bytes(item),0);return 4+Object.entries(value).reduce((sum,[key,item])=>sum+4+Buffer.byteLength(key)+bytes(item),0);}
function random(state){let seed=state.rngState;seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;state.rngState=seed>>>0;state.work.scalarOperations+=7;return state.rngState/4294967296;}
function feat(cue){return [1,...cue,cue[0]*cue[1],cue[0]*cue[2],cue[0]*cue[3],cue[1]*cue[2],cue[1]*cue[3],cue[2]*cue[3]];}
function idx(cue){return cue.reduce((sum,value,index)=>sum+(value>0?2**index:0),0);}
function score(state,cue,policy){const phi=feat(cue);let dot=0;for(let index=0;index<11;index++)dot+=state.weights[index]*phi[index];return Math.log(3)+dot/Math.sqrt(11)+Number(policy==='shared-plus-cue')*state.residuals[idx(cue)];}
function learn(state,example,policy){const record={agentId:state.agentId,tick:example.tick,phi:feat(example.cue),target:example.target};state.work.scalarOperations+=20;state.seen++;state.lastTick=example.tick;
  const retention=random(state),replay=random(state),recent=random(state),coin=random(state);
  if(state.reservoir.length<32){state.reservoir.push(structuredClone(record));state.work.scalarOperations++;}else{const position=Math.floor(retention*state.seen);state.work.scalarOperations+=2;if(position<32){state.reservoir[position]=structuredClone(record);state.work.scalarOperations++;}}
  if(state.recent.length===8){state.recent.shift();state.work.scalarOperations+=8;}state.recent.push(structuredClone(record));state.work.scalarOperations++;
  const oldIndex=Math.floor(replay*state.reservoir.length),recentIndex=Math.floor(recent*state.recent.length),coinRecent=coin<.5;assert.ok(recentIndex>=0&&typeof coinRecent==='boolean');state.work.scalarOperations+=5;
  for(const sample of [record,state.reservoir[oldIndex]]){const cue=sample.phi.slice(1,5),index=idx(cue),sharedError=sample.target-1/(1+Math.exp(-score(state,cue,'shared'))),fullError=sample.target-1/(1+Math.exp(-score(state,cue,'shared-plus-cue'))),step=.5*sharedError/Math.sqrt(11),residualStep=.5*fullError;
    for(let position=0;position<11;position++)state.weights[position]=Math.max(-8,Math.min(8,state.weights[position]+step*sample.phi[position]));state.residuals[index]=Math.max(-8,Math.min(8,state.residuals[index]+residualStep));state.work.scalarOperations+=125;state.updates++;}
}
function loss(state,cues,policy){return cues.reduce((sum,cue)=>{const probability=.05+.9/(1+Math.exp(-score(state,cue.bits,policy)));return sum-Math.log(cue.valence>0?probability:1-probability);},0)/cues.length;}
let founders=0,updates=0,examples=0;const rows=[];
for(const input of protocol.inputs){const data=readFileSync(join(root,input.previousRow));assert.equal(hash(data),input.previousRowSha256);const old=JSON.parse(data),anchorData=readFileSync(join(root,input.anchor));assert.equal(hash(anchorData),input.anchorSha256);const anchor=JSON.parse(anchorData),row=read(join(base,'rows',input.corpus+'-'+input.seed+'.json'));let bDelta=0,aDelta=0;
  assert.deepEqual(Object.keys(row.founders),Object.keys(old.founders));for(const founder of Object.values(row.founders)){founders++;assert.deepEqual(founder.examples,old.founders[founder.agentId].examples);assert.equal(founder.learnerSeed,old.founders[founder.agentId].learnerSeed);
    const models=Object.fromEntries(protocol.policies.map(policy=>[policy,{agentId:founder.agentId,weights:Array(11).fill(0),residuals:Array(16).fill(0),reservoir:[],recent:[],seen:0,rngState:founder.learnerSeed,lastTick:0,updates:0,work:{scalarOperations:27}}]));
    for(const phase of ['A','B','C']){for(const item of founder.examples.filter(value=>value.phase===phase)){const factual={agentId:item.agentId,tick:item.tick,cue:item.cue,target:item.target};for(const policy of protocol.policies){learn(models[policy],factual,policy);updates+=2;}examples++;}
      for(const policy of protocol.policies){assert.deepEqual(JSON.parse(JSON.stringify(models[policy])),founder.checkpoints[phase][policy]);assert.equal(bytes(models[policy]),founder.encodedBytes[phase][policy]);for(const family of ['A','B'])assert.ok(Math.abs(loss(models[policy],anchor.state.codebook[family],policy)-founder.scores[phase][policy][family])<1e-12);}
    }
    bDelta+=founder.scores.B.shared.B-founder.scores.B['shared-plus-cue'].B;aDelta+=founder.scores.C['shared-plus-cue'].A-founder.scores.C.shared.A;
  }
  const count=Object.keys(row.founders).length;assert.ok(count);assert.ok(Math.abs(row.bImprovement-bDelta/count)<1e-12);assert.ok(Math.abs(row.aLossChange-aDelta/count)<1e-12);rows.push(row);
}
const result=read(join(base,'results.json'));for(const corpus of ['original','conflict']){const values=rows.filter(row=>row.corpus===corpus),summary=result.corpora[corpus];assert.equal(values.length,8);assert.ok(Math.abs(summary.meanBImprovement-values.reduce((sum,row)=>sum+row.bImprovement,0)/8)<1e-12);assert.equal(summary.bPositiveHistories,values.filter(row=>row.bImprovement>0).length);assert.ok(Math.abs(summary.meanALossChange-values.reduce((sum,row)=>sum+row.aLossChange,0)/8)<1e-12);assert.equal(summary.offlineGate,summary.meanBImprovement>0&&summary.bPositiveHistories>=6&&summary.meanALossChange<=0);}
const report={schema:1,passed:true,founders,examples,updates,scope:'Independent previous-factual-input, RNG, stores, shared/residual updates, storage and evaluator-score reconstruction; not physical energy or qualification.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
