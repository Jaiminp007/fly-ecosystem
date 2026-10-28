import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {predictCueResidualTaste} from '../learning/cue-residual-taste.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/cue-residual-offline/20261026-v1'),output=join(root,'evidence/cue-residual-support/20261026-v1');assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(source,'protocol.json'));
assert.equal(hash(readFileSync(join(root,'learning/cue-residual-taste.mjs'))),protocol.sourceSha256['learning/cue-residual-taste.mjs']);assert.equal(read(join(source,'readback.json')).passed,true);
const records=[],inputs=[];
for(const input of protocol.inputs){const rowPath=join(source,'rows',input.corpus+'-'+input.seed+'.json'),row=read(rowPath),anchorBytes=readFileSync(join(root,input.anchor));assert.equal(hash(anchorBytes),input.anchorSha256);const anchor=JSON.parse(anchorBytes);let lossDifference=0,count=0;
  for(const founder of Object.values(row.founders))for(const cue of anchor.state.codebook.B){
    const support=founder.examples.filter(example=>(example.phase==='A'||example.phase==='B')&&example.cue.every((value,index)=>value===cue.bits[index])).length;
    const shared=founder.checkpoints.B.shared,active=founder.checkpoints.B['shared-plus-cue'],index=cue.bits.reduce((sum,value,position)=>sum+(value===1?2**position:0),0);
    if(support===0)assert.equal(active.residuals[index],0);
    const positive=cue.valence===1,control=predictCueResidualTaste(shared,cue.bits,'shared'),candidate=predictCueResidualTaste(active,cue.bits,'shared-plus-cue'),controlLoss=-Math.log(positive?control:1-control),candidateLoss=-Math.log(positive?candidate:1-candidate);
    lossDifference+=controlLoss-candidateLoss;count++;records.push({corpus:input.corpus,seed:input.seed,id:founder.agentId,cueId:cue.id,support,valence:cue.valence,control,candidate,controlLoss,candidateLoss});
  }
  assert.ok(count>0);assert.ok(Math.abs(lossDifference/count-row.bImprovement)<1e-12);inputs.push({corpus:input.corpus,seed:input.seed,rowSha256:hash(readFileSync(rowPath)),anchor:input.anchor,anchorSha256:input.anchorSha256});
}
const summary={};for(const corpus of ['original','conflict']){summary[corpus]={};for(const [bucket,predicate]of [['zero',value=>value===0],['one',value=>value===1],['multiple',value=>value>=2]]){const values=records.filter(record=>record.corpus===corpus&&predicate(record.support));summary[corpus][bucket]={count:values.length,positiveTargets:values.filter(value=>value.valence===1).length,meanImprovement:values.length?values.reduce((sum,value)=>sum+value.controlLoss-value.candidateLoss,0)/values.length:null};}}
const report={schema:1,sourceProtocolSha256:hash(readFileSync(join(source,'protocol.json'))),sourceReadbackSha256:hash(readFileSync(join(source,'readback.json'))),scriptSha256:hash(readFileSync(fileURLToPath(import.meta.url))),planSha256:hash(readFileSync(join(root,'docs/CUE_RESIDUAL_SUPPORT_PLAN.md'))),inputs,records,summary,scope:'Post-outcome same-observation cue support and evaluator loss; no causal or qualification inference.'};
mkdirSync(dirname(output),{recursive:true});mkdirSync(output);writeFileSync(join(output,'results.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(summary));
