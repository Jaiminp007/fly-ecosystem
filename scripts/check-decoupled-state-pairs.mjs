import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/decoupled-cue-offline/20261026-v1'),read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(base,'protocol.json'));let pairs=0,unseen=0,seen=0;
for(const input of protocol.inputs){const anchorBytes=readFileSync(join(root,input.anchor));assert.equal(hash(anchorBytes),input.anchorSha256);const anchor=JSON.parse(anchorBytes),row=read(join(base,'rows',input.corpus+'-'+input.seed+'.json'));
  for(const founder of Object.values(row.founders)){
    for(const phase of ['A','B','C']){assert.deepEqual(founder.checkpoints[phase].shared,founder.checkpoints[phase]['shared-plus-cue']);assert.equal(founder.encodedBytes[phase].shared,founder.encodedBytes[phase]['shared-plus-cue']);pairs++;}
    for(const cue of anchor.state.codebook.B){const support=founder.examples.filter(example=>['A','B'].includes(example.phase)&&example.cue.every((bit,index)=>bit===cue.bits[index])).length,index=cue.bits.reduce((sum,bit,position)=>sum+(bit>0?2**position:0),0);
      if(!support){assert.equal(founder.checkpoints.B.shared.residuals[index],0);unseen++;}else seen++;
    }
  }
}
const report={schema:1,passed:true,pairs,unseen,seen,scope:'Post-outcome exact paired-state and unseen-residual identity check; no physical or qualification inference.'};
writeFileSync(join(base,'state-pair-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
