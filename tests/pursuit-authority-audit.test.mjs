import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {PURSUIT_ARMS,simulatePursuitAuthority} from '../learning/pursuit-authority.mjs';
import {scorePursuitAuthority} from '../scripts/pursuit-authority.mjs';

const protocol={reference:{founders:2,actorParameters:{},parameters:{actuator:'move',moveMode:'levels',slowSpeed:.15,fastSpeed:.5,decisionTicks:8,creditTicks:8,returnMode:'td',discount:.99}},
  pricing:{byteEnergyPerSecond:1e-5/(17*8),operationEnergy:5e-6/17},arms:PURSUIT_ARMS,critical:2.4};
const history={seed:115,cueSeed:116,resourceSeeds:[117,118,119,120],shuffleSeed:121,nullSeed:122,transferSeed:123};

test('pursuit scoring cannot drop an energy comparison or survival guard',()=>{
  const rows=Array.from({length:16},()=>({arms:Object.fromEntries(PURSUIT_ARMS.map(arm=>[arm,{endpoint:{budgetAdjustedEnergyPerFounder:arm==='pursuit'?2:0,founders:2,survivors:2,survival:1}}]))}));
  assert.equal(scorePursuitAuthority(rows,protocol).passed,true);assert.equal(scorePursuitAuthority(rows,protocol).learnerQualification,false);
  rows[0].arms.pursuit.endpoint.survival=0;rows[0].arms.pursuit.endpoint.survivors=0;assert.equal(scorePursuitAuthority(rows,protocol).passed,false);
  rows[0].arms.pursuit.endpoint.survival=1;rows[0].arms.pursuit.endpoint.survivors=2;
  for(const row of rows)row.arms.legacyFast.endpoint.budgetAdjustedEnergyPerFounder=2;
  assert.equal(scorePursuitAuthority(rows,protocol).comparisons[0].passed,false);
  assert.throws(()=>scorePursuitAuthority(rows.slice(1),protocol));
});

test('working pursuit survival correction uses exact paired founder counts, not an epsilon or float cancellation',()=>{
  const rows=Array.from({length:16},()=>({arms:Object.fromEntries(PURSUIT_ARMS.map(arm=>[arm,{endpoint:{budgetAdjustedEnergyPerFounder:arm==='pursuit'?2:0,founders:24,survivors:7,survival:7/24}}]))}));
  rows[0].arms.pursuit.endpoint.survivors=8;rows[0].arms.pursuit.endpoint.survival=8/24;
  rows[1].arms.pursuit.endpoint.survivors=13;rows[1].arms.pursuit.endpoint.survival=13/24;
  for(const arm of ['legacyFast','refuse','random']){rows[1].arms[arm].endpoint.survivors=14;rows[1].arms[arm].endpoint.survival=14/24;}
  const floatingMean=rows.reduce((sum,row)=>sum+row.arms.pursuit.endpoint.survival-row.arms.legacyFast.endpoint.survival,0)/16;
  assert.ok(floatingMean<0);
  const guard=scorePursuitAuthority(rows,{...protocol,reference:{founders:24}}).survival[0];
  assert.equal(guard.mean,0);assert.equal(guard.passed,true);assert.equal(guard.survivorDifferences.reduce((sum,value)=>sum+value,0),0);
  if(process.env.SARSA_AUDIT_PYTHON){
    const script="import json,runpy,sys; x=json.load(sys.stdin); a=runpy.run_path(sys.argv[1]); g=a['survival_guard'](x['rows'],'legacyFast',x['p']); assert g['mean']==0 and g['passed']; assert sum(g['survivorDifferences'])==0";
    const result=spawnSync(process.env.SARSA_AUDIT_PYTHON,['-c',script,fileURLToPath(new URL('../scripts/audit-pursuit-authority.py',import.meta.url))],
      {encoding:'utf8',input:JSON.stringify({rows,p:{reference:{founders:24},survivalArithmetic:'exact-founder-counts-v1'}})});
    assert.equal(result.status,0,result.stdout+result.stderr);
  }
  rows[0].arms.pursuit.endpoint.survivors=7;rows[0].arms.pursuit.endpoint.survival=7/24;
  assert.equal(scorePursuitAuthority(rows,{...protocol,reference:{founders:24}}).survival[0].passed,false);
  rows[0].arms.pursuit.endpoint.survivors=6;
  assert.throws(()=>scorePursuitAuthority(rows,{...protocol,reference:{founders:24}}));
});

test('independent pursuit audit checks reactive motors and rejects altered evidence',context=>{
  if(!process.env.SARSA_AUDIT_PYTHON)return context.skip('Set SARSA_AUDIT_PYTHON for independent reconstruction');
  const lines=[],row=simulatePursuitAuthority(protocol,history,event=>lines.push(JSON.stringify(event))),directory=mkdtempSync(join(tmpdir(),'pursuit-audit-'));
  try{
    writeFileSync(join(directory,'input.json'),JSON.stringify({p:protocol,h:history,row}));writeFileSync(join(directory,'trace.jsonl'),lines.join('\n')+'\n');
    const script=["import json,runpy,sys", "from pathlib import Path", "a=runpy.run_path(sys.argv[1]); d=Path(sys.argv[2]); x=json.loads((d/'input.json').read_text()); f=d/'trace.jsonl'",
      "a['audit_trace'](f,x['p'],x['h'],x['row'])", "original=[json.loads(v) for v in f.read_text().splitlines()]",
      "for kind in ['motor','motor-work','missing-motor','choice','rng','cost','work','missing-receipt']:", "    events=json.loads(json.dumps(original))",
      "    if kind=='motor':", "        next(e for e in events if e['stage']=='probe' and e['type']=='motor')['outputs'][0]+=.01",
      "    elif kind=='motor-work':", "        next(e for e in events if e['stage']=='probe' and e['type']=='motor')['operations']+=1",
      "    elif kind=='missing-motor':", "        events.remove(next(e for e in events if e['stage']=='probe' and e['type']=='motor'))",
      "    elif kind=='choice':", "        next(e for e in events if e['stage']=='probe' and e['type']=='decision')['choice']*=-1",
      "    elif kind=='rng':", "        next(e for e in events if e['stage']=='probe' and e['type']=='decision' and e['arm']=='random')['rngState']^=1",
      "    elif kind=='cost':", "        next(e for e in events if e['stage']=='probe' and e['type']=='ledger')['cost']+=.01",
      "    elif kind=='work':", "        next(iter(next(e for e in events if e['stage']=='probe' and e['type']=='end')['learners'].values()))['work']['scalarOperations']+=1",
      "    else:", "        events.remove(next(e for e in events if e['stage']=='probe' and e['type']=='ledger'))",
      "    f.write_text(''.join(json.dumps(e)+'\\n' for e in events))", "    try:", "        a['audit_trace'](f,x['p'],x['h'],x['row'])",
      "    except AssertionError:", "        pass", "    else:", "        raise AssertionError('Accepted mutation: '+kind)"].join('\n');
    const result=spawnSync(process.env.SARSA_AUDIT_PYTHON,['-c',script,fileURLToPath(new URL('../scripts/audit-pursuit-authority.py',import.meta.url)),directory],{encoding:'utf8'});
    assert.equal(result.status,0,result.stdout+result.stderr);
  }finally{rmSync(directory,{recursive:true,force:true});}
});
