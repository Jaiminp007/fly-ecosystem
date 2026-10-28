import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createDecoupledCueTaste,learnDecoupledCueTaste,predictDecoupledCueTaste} from '../learning/decoupled-cue-taste.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),previous=join(root,'evidence/recency-replay-offline/20261026-v2'),output=join(root,'evidence/decoupled-cue-offline/20261026-v1');assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),rel=path=>relative(root,path).split(sep).join('/'),write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const oldProtocol=read(join(previous,'protocol.json')),provenance=read(join(previous,'provenance-readback.json'));assert.equal(provenance.passed,true);
const inputs=oldProtocol.inputs.map(input=>{const previousRow=rel(join(previous,'rows',input.corpus+'-'+input.seed+'.json'));return {corpus:input.corpus,seed:input.seed,anchor:input.anchor,anchorSha256:input.anchorSha256,previousRow,previousRowSha256:hash(readFileSync(join(root,previousRow)))};});
const sources={};function visit(path){const name=rel(path);assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;const data=readFileSync(path);sources[name]=hash(data);if(/\.m?js$/.test(name))for(const match of data.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));}
for(const name of ['scripts/decoupled-cue-offline.mjs','scripts/check-decoupled-cue-offline.mjs','docs/DECOUPLED_CUE_RESIDUAL_PLAN.md','tests/decoupled-cue-taste.test.mjs'])visit(join(root,name));
const protocol={schema:1,inputs,sourceSha256:sources,previousProtocolSha256:hash(readFileSync(join(previous,'protocol.json'))),previousProvenanceSha256:hash(readFileSync(join(previous,'provenance-readback.json'))),policies:['shared','shared-plus-cue'],scope:'Offline own-example decoupled cue-residual screen on selected reused histories; no physical outcome or qualification claim.'};
write(join(output,'protocol.json'),protocol);for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
function loss(model,cues,policy){return cues.reduce((sum,cue)=>{const probability=predictDecoupledCueTaste(model,cue.bits,policy);return sum-Math.log(cue.valence>0?probability:1-probability);},0)/cues.length;}
const rows=[];
for(const input of inputs){const oldBytes=readFileSync(join(root,input.previousRow)),anchorBytes=readFileSync(join(root,input.anchor));assert.equal(hash(oldBytes),input.previousRowSha256);assert.equal(hash(anchorBytes),input.anchorSha256);const old=JSON.parse(oldBytes),anchor=JSON.parse(anchorBytes),founders={};
  for(const oldFounder of Object.values(old.founders)){
    assert.ok(anchor.world.world.flies.some(fly=>fly.id===oldFounder.agentId));const founder={agentId:oldFounder.agentId,learnerSeed:oldFounder.learnerSeed,examples:oldFounder.examples,checkpoints:{},scores:{},encodedBytes:{}},models=Object.fromEntries(protocol.policies.map(policy=>[policy,createDecoupledCueTaste(founder.agentId,founder.learnerSeed)]));
    for(const phase of ['A','B','C']){
      for(const item of founder.examples.filter(value=>value.phase===phase)){const factual={agentId:item.agentId,tick:item.tick,cue:item.cue,target:item.target};for(const policy of protocol.policies)learnDecoupledCueTaste(models[policy],factual);assert.equal(models.shared.rngState,models['shared-plus-cue'].rngState);assert.equal(models.shared.work.scalarOperations,models['shared-plus-cue'].work.scalarOperations);}
      founder.checkpoints[phase]={};founder.scores[phase]={};founder.encodedBytes[phase]={};for(const policy of protocol.policies){founder.checkpoints[phase][policy]=structuredClone(models[policy]);founder.scores[phase][policy]=Object.fromEntries(['A','B'].map(family=>[family,loss(models[policy],anchor.state.codebook[family],policy)]));founder.encodedBytes[phase][policy]=encodedStateBytes(models[policy]);}
      assert.equal(founder.encodedBytes[phase].shared,founder.encodedBytes[phase]['shared-plus-cue']);
    }
    founders[founder.agentId]=founder;
  }
  const items=Object.values(founders);assert.ok(items.length);const bImprovement=items.reduce((sum,founder)=>sum+founder.scores.B.shared.B-founder.scores.B['shared-plus-cue'].B,0)/items.length,aLossChange=items.reduce((sum,founder)=>sum+founder.scores.C['shared-plus-cue'].A-founder.scores.C.shared.A,0)/items.length;
  const row={corpus:input.corpus,seed:input.seed,founders,bImprovement,aLossChange};write(join(output,'rows',input.corpus+'-'+input.seed+'.json'),row);rows.push(row);console.log(JSON.stringify({corpus:input.corpus,seed:input.seed,founders:items.length,bImprovement,aLossChange}));
}
for(const [name,digest]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),digest);
const corpora=Object.fromEntries(['original','conflict'].map(corpus=>{const values=rows.filter(row=>row.corpus===corpus);assert.equal(values.length,8);const meanBImprovement=values.reduce((sum,row)=>sum+row.bImprovement,0)/8,bPositiveHistories=values.filter(row=>row.bImprovement>0).length,meanALossChange=values.reduce((sum,row)=>sum+row.aLossChange,0)/8;return [corpus,{meanBImprovement,bPositiveHistories,meanALossChange,offlineGate:meanBImprovement>0&&bPositiveHistories>=6&&meanALossChange<=0}];}));
write(join(output,'results.json'),{schema:1,qualified:false,corpora,jointOfflineGate:Object.values(corpora).every(value=>value.offlineGate),scope:protocol.scope});console.log(JSON.stringify({corpora}));
