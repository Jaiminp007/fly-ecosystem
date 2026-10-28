import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {simulateTransferAuthority,TRANSFER_AUTHORITY_ARMS} from '../learning/transfer-authority.mjs';
import {scoreTransferAuthority} from '../scripts/transfer-authority.mjs';

const protocol={reference:{founders:2,actorParameters:{},parameters:{actuator:'move',moveMode:'levels',slowSpeed:.15,fastSpeed:.5,decisionTicks:8,creditTicks:8,returnMode:'td',discount:.99}},
  pricing:{byteEnergyPerSecond:1e-5/(17*8),operationEnergy:5e-6/17},arms:TRANSFER_AUTHORITY_ARMS,critical:2.4};
const history={seed:115,cueSeed:116,resourceSeeds:[117,118,119,120],shuffleSeed:121,nullSeed:122,transferSeed:123};

test('transfer authority shares initial worlds, uses own taste and charges bounded fixed state',()=>{
  const events=[],row=simulateTransferAuthority(protocol,history,event=>events.push(structuredClone(event)));
  assert.deepEqual(Object.keys(row.arms),TRANSFER_AUTHORITY_ARMS);
  assert.equal(new Set(Object.values(row.arms).map(arm=>arm.initialWorldSha256)).size,1);
  assert.deepEqual(simulateTransferAuthority(protocol,history),row);
  for(const mode of TRANSFER_AUTHORITY_ARMS){
    const decisions=events.filter(event=>event.stage==='probe'&&event.arm===mode&&event.type==='decision');
    assert.ok(decisions.length>0);
    for(const event of decisions){
      assert.equal((event.tick-1537)%8,0);
      assert.ok([-1,1].includes(event.choice));
      if(mode!=='randomSpeed')assert.equal(event.choice,mode==='slow'||mode==='tasteSpeed'&&event.previousIntake>0?-1:1);
    }
    const end=events.find(event=>event.stage==='probe'&&event.arm===mode&&event.type==='end');
    assert.equal(end.endpoint.founders,2);
    assert.ok(Math.abs(end.endpoint.accountingResidual)<1e-6);
    for(const state of Object.values(end.learners)){
      assert.ok(state.decisions<=32);
      assert.equal(state.work.scalarOperations,state.ticks*6+state.decisions*(mode==='randomSpeed'?7:1));
      if(state.ticks)assert.ok(state.charge.incurredEnergy>0&&state.charge.storageBytes>0);
      else assert.equal(state.charge.incurredEnergy,0);
      assert.equal(state.weights,undefined);
      assert.ok(Math.abs(state.charge.incurredEnergy-state.charge.paidEnergy-state.charge.outstandingEnergy)<1e-8);
    }
  }
});

test('transfer authority never revives warmup-extinct founders or creates probe receipts',()=>{
  const events=[],row=simulateTransferAuthority({...protocol,pricing:{operationEnergy:100,byteEnergyPerSecond:100}},history,event=>events.push(structuredClone(event)));
  assert.equal(row.warmup.endpoint.survivors,0);
  for(const arm of Object.values(row.arms)){
    assert.equal(arm.endpoint.founders,2);
    assert.equal(arm.endpoint.survivors,0);
    assert.equal(arm.endpoint.budgetAdjustedEnergyPerFounder,0);
  }
  assert.equal(events.filter(event=>event.stage==='probe'&&['decision','ledger'].includes(event.type)).length,0);
});

test('transfer scoring requires every energy and survival guard without learner qualification',()=>{
  const rows=Array.from({length:16},()=>({arms:Object.fromEntries(TRANSFER_AUTHORITY_ARMS.map(mode=>[mode,{endpoint:{budgetAdjustedEnergyPerFounder:mode==='tasteSpeed'?2:0,survival:1}}]))}));
  assert.equal(scoreTransferAuthority(rows,protocol).passed,true);
  assert.equal(scoreTransferAuthority(rows,protocol).learnerQualification,false);
  rows[0].arms.tasteSpeed.endpoint.survival=0;
  assert.equal(scoreTransferAuthority(rows,protocol).passed,false);
  rows[0].arms.tasteSpeed.endpoint.survival=1;
  for(const row of rows)row.arms.fast.endpoint.budgetAdjustedEnergyPerFounder=2;
  assert.equal(scoreTransferAuthority(rows,protocol).comparisons[0].passed,false);
  assert.throws(()=>scoreTransferAuthority(rows.slice(1),protocol));
});

test('independent transfer reconstruction rejects altered decisions, work, charges and missing receipts',context=>{
  if(!process.env.SARSA_AUDIT_PYTHON)return context.skip('Set SARSA_AUDIT_PYTHON for independent reconstruction');
  const lines=[],row=simulateTransferAuthority(protocol,history,event=>lines.push(JSON.stringify(event))),directory=mkdtempSync(join(tmpdir(),'transfer-audit-'));
  try{
    writeFileSync(join(directory,'input.json'),JSON.stringify({p:protocol,h:history,row}));
    writeFileSync(join(directory,'trace.jsonl'),lines.join('\n')+'\n');
    const script=["import json,runpy,sys", "from pathlib import Path", "a=runpy.run_path(sys.argv[1]); d=Path(sys.argv[2]); x=json.loads((d/'input.json').read_text()); f=d/'trace.jsonl'",
      "a['audit_trace'](f,x['p'],x['h'],x['row'])", "original=[json.loads(v) for v in f.read_text().splitlines()]",
      "for kind in ['choice','cost','work','missing-body','rng','initial-energy']:", "    events=json.loads(json.dumps(original))",
      "    if kind=='choice':", "        next(e for e in events if e['stage']=='probe' and e['type']=='decision')['choice']*=-1",
      "    elif kind=='cost':", "        next(e for e in events if e['stage']=='probe' and e['type']=='ledger')['cost']+=.01",
      "    elif kind=='work':", "        next(iter(next(e for e in events if e['stage']=='probe' and e['type']=='end')['learners'].values()))['work']['scalarOperations']+=1",
      "    elif kind=='rng':", "        next(e for e in events if e['stage']=='probe' and e['type']=='decision' and e['arm']=='randomSpeed')['rngState']^=1",
      "    elif kind=='initial-energy':", "        next(e for e in events if e['stage']=='probe' and e['type']=='start')['initialEnergy']+=1",
      "    else:", "        target=next(e for e in events if e['stage']=='probe' and e['type']=='ledger')",
      "        events=[e for e in events if not(e['stage']=='probe' and e['arm']==target['arm'] and e.get('agentId')==target['agentId'] and e['type']=='ledger')]",
      "    f.write_text(''.join(json.dumps(e)+'\\n' for e in events))", "    try:", "        a['audit_trace'](f,x['p'],x['h'],x['row'])",
      "    except AssertionError:", "        pass", "    else:", "        raise AssertionError('Accepted mutation: '+kind)"].join('\n');
    const result=spawnSync(process.env.SARSA_AUDIT_PYTHON,['-c',script,fileURLToPath(new URL('../scripts/audit-transfer-authority.py',import.meta.url)),directory],{encoding:'utf8'});
    assert.equal(result.status,0,result.stdout+result.stderr);
  }finally{rmSync(directory,{recursive:true,force:true});}
});
