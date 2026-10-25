import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {simulateAuthorityHistory} from '../learning/cue-foraging.mjs';

test('independent authority audit rebuilds nonempty decisions, physical receipts and bills, and rejects altered evidence',t=>{
  if(!process.env.SARSA_AUDIT_PYTHON)return t.skip('Set SARSA_AUDIT_PYTHON for independent Python reconstruction');
  const p={reference:{founders:2,actorParameters:{},parameters:{actuator:'move',moveMode:'levels',slowSpeed:.15,fastSpeed:.5,decisionTicks:8,creditTicks:8,returnMode:'td',discount:.99}},
    pricing:{byteEnergyPerSecond:1e-5/(17*8),operationEnergy:5e-6/17},arms:['valueOracle','cueOracle','accept','refuse','random','shuffledOracle','nullCueOracle','nullRandom']},
    h={seed:115,cueSeed:116,resourceSeeds:[117,118,119,120],shuffleSeed:121,nullSeed:122},lines=[];
  const row=simulateAuthorityHistory(p,h,e=>lines.push(JSON.stringify(e))),dir=mkdtempSync(join(tmpdir(),'cue-audit-'));
  try{
    writeFileSync(join(dir,'input.json'),JSON.stringify({p,h,row}));writeFileSync(join(dir,'trace.jsonl'),lines.join('\n')+'\n');
    const script=["import json,runpy,sys", "from pathlib import Path", "a=runpy.run_path(sys.argv[1]); d=Path(sys.argv[2]); x=json.loads((d/'input.json').read_text()); f=d/'trace.jsonl'",
      "counts=a['audit_trace'](f,x['p'],x['h'],x['row'])", "assert counts['bodies']==16 and counts['decisions']>100 and counts['bodySteps']>1000",
      "original=[json.loads(v) for v in f.read_text().splitlines()]", "for kind in ['choice','cost','work','missing-body']:",
      "    events=json.loads(json.dumps(original))", "    if kind=='choice':", "        next(e for e in events if e['type']=='decision')['choice']*=-1",
      "    elif kind=='cost':", "        next(e for e in events if e['type']=='ledger')['cost']+=.01",
      "    elif kind=='work':", "        next(iter(next(e for e in events if e['type']=='end')['learners'].values()))['work']['scalarOperations']+=1",
      "    else:", "        events=[e for e in events if not(e.get('agentId')==1 and e['type']=='ledger')]",
      "    f.write_text(''.join(json.dumps(e)+'\\n' for e in events))", "    try:", "        a['audit_trace'](f,x['p'],x['h'],x['row'])",
      "    except AssertionError:", "        pass", "    else:", "        raise AssertionError('Accepted mutation: '+kind)"].join('\n');
    const result=spawnSync(process.env.SARSA_AUDIT_PYTHON,['-c',script,fileURLToPath(new URL('../scripts/audit-cue-authority.py',import.meta.url)),dir],{encoding:'utf8'});
    assert.equal(result.status,0,result.stdout+result.stderr);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
