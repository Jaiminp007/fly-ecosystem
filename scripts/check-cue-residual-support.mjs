import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/cue-residual-support/20261026-v1'),source=join(root,'evidence/cue-residual-offline/20261026-v1'),read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),close=(left,right)=>assert.ok(Math.abs(left-right)<1e-12),result=read(join(base,'results.json'));
assert.equal(hash(readFileSync(join(source,'protocol.json'))),result.sourceProtocolSha256);assert.equal(hash(readFileSync(join(source,'readback.json'))),result.sourceReadbackSha256);assert.equal(hash(readFileSync(join(root,'scripts/census-cue-residual-support.mjs'))),result.scriptSha256);assert.equal(hash(readFileSync(join(root,'docs/CUE_RESIDUAL_SUPPORT_PLAN.md'))),result.planSha256);
function probability(model,cue,includeResidual){const bits=cue.bits,phi=[1,...bits,bits[0]*bits[1],bits[0]*bits[2],bits[0]*bits[3],bits[1]*bits[2],bits[1]*bits[3],bits[2]*bits[3]],index=bits.reduce((sum,value,position)=>sum+(value>0?2**position:0),0);let dot=0;for(let position=0;position<11;position++)dot+=model.weights[position]*phi[position];return .05+.9/(1+Math.exp(-Math.log(3)-dot/Math.sqrt(11)-Number(includeResidual)*model.residuals[index]));}
for(const input of result.inputs){const rowPath=join(source,'rows',input.corpus+'-'+input.seed+'.json'),rowBytes=readFileSync(rowPath),anchorBytes=readFileSync(join(root,input.anchor));assert.equal(hash(rowBytes),input.rowSha256);assert.equal(hash(anchorBytes),input.anchorSha256);const row=JSON.parse(rowBytes),anchor=JSON.parse(anchorBytes),records=result.records.filter(item=>item.corpus===input.corpus&&item.seed===input.seed);assert.equal(records.length,Object.keys(row.founders).length*4);let sum=0;
  for(const item of records){const founder=row.founders[item.id],cue=anchor.state.codebook.B.find(value=>value.id===item.cueId);assert.ok(founder&&cue);assert.equal(cue.valence,item.valence);
    const support=founder.examples.filter(example=>['A','B'].includes(example.phase)&&example.cue.every((value,index)=>value===cue.bits[index])).length;assert.equal(support,item.support);
    const index=cue.bits.reduce((total,value,position)=>total+(value>0?2**position:0),0),control=probability(founder.checkpoints.B.shared,cue,false),candidate=probability(founder.checkpoints.B['shared-plus-cue'],cue,true);if(!support)assert.equal(founder.checkpoints.B['shared-plus-cue'].residuals[index],0);
    close(control,item.control);close(candidate,item.candidate);close(item.controlLoss,-Math.log(cue.valence>0?control:1-control));close(item.candidateLoss,-Math.log(cue.valence>0?candidate:1-candidate));sum+=item.controlLoss-item.candidateLoss;
  }
  close(sum/records.length,row.bImprovement);
}
for(const corpus of ['original','conflict'])for(const [bucket,predicate]of [['zero',value=>value===0],['one',value=>value===1],['multiple',value=>value>=2]]){const records=result.records.filter(item=>item.corpus===corpus&&predicate(item.support)),summary=result.summary[corpus][bucket];assert.equal(records.length,summary.count);assert.equal(records.filter(item=>item.valence===1).length,summary.positiveTargets);if(records.length)close(summary.meanImprovement,records.reduce((sum,item)=>sum+item.controlLoss-item.candidateLoss,0)/records.length);}
const report={schema:1,passed:true,inputs:result.inputs.length,cueEvaluations:result.records.length,scope:'Independent observed cue support, model-score and aggregation reconstruction from previously audited factual examples; not physics or causal effect.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
