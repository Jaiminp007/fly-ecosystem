import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {CUE_ARMS,CUE_PROBES} from '../learning/cue-foraging.mjs';
import {CUE_CONTRASTS,simulateCueHistory,validateCueRow,cueEffect} from '../learning/cue-development.mjs';
const p={reference:{founders:4,actorParameters:{},parameters:{actuator:'move',moveMode:'levels',slowSpeed:.15,fastSpeed:.5,decisionTicks:8,creditTicks:8,returnMode:'td',discount:.99}},
  pricing:{byteEnergyPerSecond:1e-5/(17*8),operationEnergy:5e-6/17},arms:CUE_ARMS,probes:CUE_PROBES},
  h={seed:103,cueSeed:104,resourceSeeds:[105,106,107,108],shuffleSeed:109,nullSeed:110,probeSeeds:{A:123,B:124,C:125,transfer:126}};

test('fixed cue study covers all arms and matched frozen probes, with nineteen required directional effects',()=>{
  assert.equal(CUE_CONTRASTS.length,21);assert.equal(CUE_CONTRASTS.filter(c=>!c.optional&&!c.null).length,19);
  const row=simulateCueHistory(p,h,'development');validateCueRow(row,h,p,'development');
  assert.equal(row.probes.length,13);assert.ok(row.probes.every(v=>v.acquisitionDisabled));
  for(const c of CUE_CONTRASTS)assert.ok(Number.isFinite(cueEffect(row,c)));
  const a=row.probes.find(v=>v.family==='A'&&v.version==='A'),later=row.probes.find(v=>v.family==='A'&&v.version==='C'),reset=row.probes.find(v=>v.family==='A'&&v.version==='reset');
  assert.equal(cueEffect(row,CUE_CONTRASTS.find(c=>c.id==='A-retention')),later.value-.95*a.value-.05*reset.value);
});

test('Python reconstructs cue body learning, actual own reward, physical bills and nonempty role coverage',t=>{
  if(!process.env.SARSA_AUDIT_PYTHON)return t.skip('Set SARSA_AUDIT_PYTHON for independent reconstruction');
  const lines=[],row=simulateCueHistory(p,h,'development',e=>lines.push(JSON.stringify(e))),dir=mkdtempSync(join(tmpdir(),'cue-development-'));
  try{writeFileSync(join(dir,'input.json'),JSON.stringify({p,h,row}));writeFileSync(join(dir,'trace.jsonl'),lines.join('\n')+'\n');
    const code=["import runpy,json,sys", "from pathlib import Path", "a=runpy.run_path(sys.argv[1]); d=Path(sys.argv[2]); x=json.loads((d/'input.json').read_text()); f=d/'trace.jsonl'",
      "counts=a['audit_trace'](f,x['p'],x['h'],x['row'])", "assert counts['learnerBodies']==40 and counts['factualTransitions']>100 and counts['physicalReceipts']>100",
      "original=[json.loads(v) for v in f.read_text().splitlines()]", "for kind in ['reward','cost','missing-body']:", "    events=json.loads(json.dumps(original))",
      "    if kind=='reward':", "        next(e for e in events if e['type']=='experience' and e['transitions'])['transitions'][0]['reward']+=.01",
      "    elif kind=='cost':", "        next(e for e in events if e['type']=='ledger')['cost']+=.01",
      "    else:", "        events=[e for e in events if not(e.get('agentId')==1 and e['type']=='ledger')]",
      "    f.write_text(''.join(json.dumps(e)+'\\n' for e in events))", "    try:", "        a['audit_trace'](f,x['p'],x['h'],x['row'])", "    except (AssertionError,KeyError):", "        pass", "    else:", "        raise AssertionError('Accepted mutation: '+kind)"].join('\n');
    const result=spawnSync(process.env.SARSA_AUDIT_PYTHON,['-c',code,fileURLToPath(new URL('../scripts/audit-cue-development.py',import.meta.url)),dir],{encoding:'utf8'});assert.equal(result.status,0,result.stdout+result.stderr);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
