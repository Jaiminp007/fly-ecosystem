import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/recency-replay-offline/20261026-v1'),read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(base,'protocol.json'));
for(const [name,digest]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),digest);
function bytes(value){if(value===null||typeof value==='boolean')return 1;if(typeof value==='number'){assert.ok(Number.isFinite(value));return 8;}if(typeof value==='string')return 4+Buffer.byteLength(value);if(Array.isArray(value))return 4+value.reduce((sum,item)=>sum+bytes(item),0);return 4+Object.entries(value).reduce((sum,[key,item])=>sum+4+Buffer.byteLength(key)+bytes(item),0);}
function rng(state){let seed=state.rngState;seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;state.rngState=seed>>>0;state.work.scalarOperations+=7;return state.rngState/4294967296;}
function learn(state,example,policy){const bits=example.cue,phi=[1,...bits,bits[0]*bits[1],bits[0]*bits[2],bits[0]*bits[3],bits[1]*bits[2],bits[1]*bits[3],bits[2]*bits[3]],record={agentId:state.agentId,tick:example.tick,phi,target:example.target};state.work.scalarOperations+=20;state.seen++;state.lastTick=example.tick;
  const retention=rng(state),reservoirDraw=rng(state),recentDraw=rng(state),coin=rng(state);
  if(state.reservoir.length<32){state.reservoir.push(structuredClone(record));state.work.scalarOperations++;}else{const index=Math.floor(retention*state.seen);state.work.scalarOperations+=2;if(index<32){state.reservoir[index]=structuredClone(record);state.work.scalarOperations++;}}
  if(state.recent.length===8){state.recent.shift();state.work.scalarOperations+=8;}state.recent.push(structuredClone(record));state.work.scalarOperations++;
  const oldIndex=Math.floor(reservoirDraw*state.reservoir.length),recentIndex=Math.floor(recentDraw*state.recent.length),coinRecent=coin<.5,recent=policy==='recent-mix'&&coinRecent;state.work.scalarOperations+=5;
  for(const sample of [record,recent?state.recent[recentIndex]:state.reservoir[oldIndex]]){let sum=0;for(let index=0;index<11;index++)sum+=state.weights[index]*sample.phi[index];const error=sample.target-1/(1+Math.exp(-Math.log(3)-sum/Math.sqrt(11))),step=.5*error/Math.sqrt(11);for(let index=0;index<11;index++)state.weights[index]=Math.max(-8,Math.min(8,state.weights[index]+step*sample.phi[index]));state.work.scalarOperations+=81;state.updates++;}return Number(recent);
}
function loss(weights,cues){let sum=0;for(const cue of cues){const bits=cue.bits,phi=[1,...bits,bits[0]*bits[1],bits[0]*bits[2],bits[0]*bits[3],bits[1]*bits[2],bits[1]*bits[3],bits[2]*bits[3]];let dot=0;for(let index=0;index<11;index++)dot+=weights[index]*phi[index];const probability=.05+.9/(1+Math.exp(-Math.log(3)-dot/Math.sqrt(11)));sum-=Math.log(cue.valence>0?probability:1-probability);}return sum/cues.length;}
let founders=0,updates=0;const rows=[];
for(const input of protocol.inputs){const anchor=read(join(root,input.anchor));assert.equal(hash(readFileSync(join(root,input.anchor))),input.anchorSha256);const row=read(join(base,'rows',input.corpus+'-'+input.seed+'.json'));let bDelta=0,aDelta=0;
  for(const founder of Object.values(row.founders)){founders++;const models=Object.fromEntries(['uniform','recent-mix'].map(policy=>[policy,{agentId:founder.agentId,weights:Array(11).fill(0),reservoir:[],recent:[],seen:0,rngState:founder.learnerSeed,lastTick:0,updates:0,work:{scalarOperations:11}}]));let recentCount=0;
    for(const phase of ['A','B','C']){for(const example of founder.examples.filter(item=>item.phase===phase)){for(const policy of ['uniform','recent-mix']){recentCount+=policy==='recent-mix'?learn(models[policy],example,policy):0;if(policy==='uniform')learn(models[policy],example,policy);updates+=2;}}
      for(const policy of ['uniform','recent-mix']){assert.deepEqual(JSON.parse(JSON.stringify(models[policy])),founder.checkpoints[phase][policy]);assert.equal(bytes(models[policy]),founder.encodedBytes[phase][policy]);for(const family of ['A','B'])assert.ok(Math.abs(loss(models[policy].weights,anchor.state.codebook[family])-founder.scores[phase][policy][family])<1e-12);}
    }
    assert.equal(recentCount,founder.recentReplays);bDelta+=founder.scores.B.uniform.B-founder.scores.B['recent-mix'].B;aDelta+=founder.scores.C['recent-mix'].A-founder.scores.C.uniform.A;
  }
  const count=Object.keys(row.founders).length;assert.ok(count);assert.ok(Math.abs(row.bImprovement-bDelta/count)<1e-12);assert.ok(Math.abs(row.aLossChange-aDelta/count)<1e-12);rows.push(row);
}
const result=read(join(base,'results.json'));for(const corpus of ['original','conflict']){const values=rows.filter(row=>row.corpus===corpus),summary=result.corpora[corpus];assert.equal(values.length,8);
  assert.ok(Math.abs(summary.meanBImprovement-values.reduce((sum,row)=>sum+row.bImprovement,0)/8)<1e-12);assert.equal(summary.bPositiveHistories,values.filter(row=>row.bImprovement>0).length);assert.ok(Math.abs(summary.meanALossChange-values.reduce((sum,row)=>sum+row.aLossChange,0)/8)<1e-12);
  assert.equal(summary.offlineGate,summary.meanBImprovement>0&&summary.bPositiveHistories>=6&&summary.meanALossChange<=0);}
const report={schema:1,passed:true,founders,updates,scope:'Independent RNG, reservoir, recent queue, weight update and evaluator log-loss reconstruction; not embodied cost or physical outcomes.'};
writeFileSync(join(base,'learning-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
