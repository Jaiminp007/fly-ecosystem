// Synthetic fixtures only (no worlds). Validates the frozen verdict engine.
import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreBodyTransfer,settledValue,bodyTransferBank,bodyTransferSources,probeAnchor,OPERATION_ENERGY} from '../scripts/body-transfer.mjs';

const ep=(V,surv=24,ops=1000,billed=900)=>({budgetAdjustedEnergyPerFounder:V,survivors:surv,
  scalarOperations:ops,operationsBilled:billed,additionalScalarOperations:ops,accountingResidual:0,
  incurredEnergy:1,paidEnergy:1,outstandingEnergy:0});
const probe=(value,surv=24)=>({value,survivors:surv,seed:1,startWorldSha256:'x',startPending:100,
  skippedAllDead:false,endpoint:ep(value,surv,1100,1000)});
const bodyBlock=(arms,probes)=>({arms:Object.fromEntries(Object.entries(arms).map(([a,V])=>[a,{endpoint:ep(V)}])),
  probes: Object.fromEntries(Object.entries(probes).map(([k,v])=>[k,probe(v)])),atCSurvivors:24});
const PASS_ARMS={candidate:10,unlearned:8,frozen:9,reset:9.8,acceptCruise:7,acceptStationary:5};
const PASS_PROBES={'A:A':6,'A:B':5,'A:current':6,'A:reset':4,'B:A':5,'B:B':6,'B:current':6,'B:reset':4,
  'transfer:current':4,'transfer:reset':4,'transfer:acceptCruise':3,'transfer:acceptStationary':2,
  'early-A:current':5,'early-A:reset':4,'early-B:current':5,'early-B:reset':4};
const PASS_DIRECT={'A:current':6,'A:reset':4,'B:current':6,'B:reset':4,'transfer:current':4,
  'transfer:reset':4,'transfer:acceptCruise':3,'transfer:acceptStationary':2};
const row=(seed,arms=PASS_ARMS,probesN=PASS_PROBES,probesP=null,direct=PASS_DIRECT,nondeg=3)=>({history:{seed},
  N:bodyBlock(arms,probesN),P:bodyBlock(arms,probesP??probesN),
  direct:Object.fromEntries(Object.entries(direct).map(([k,v])=>[k,probe(v)])),nondeg:{P:nondeg}});
const eight=(fn)=>Array.from({length:8},(_,i)=>fn(i));

test('settled readback subtracts unsettled per-founder cost',()=>{
  assert.equal(settledValue(10,240,0),10-OPERATION_ENERGY*240/24);
  assert.equal(settledValue(10,100,100),10);
});

test('all-pass fixtures clear N, P and direct flags',()=>{
  const s=scoreBodyTransfer(eight(i=>row(1000+i)));
  assert.ok(s.nPass&&s.pPass&&s.dPass);
  assert.ok(s.g.N.g1.pass&&s.g.P.g5.pass&&s.g6skill.B.pass&&s.g6direct.pass);
});

test('N retention failure clears nPass only',()=>{
  const bad={...PASS_PROBES,'A:current':5.0};
  const s=scoreBodyTransfer(eight(i=>i===0?row(2000,PASS_ARMS,bad,PASS_PROBES):row(2000+i)));
  assert.equal(s.g.N.g5.pass,false);assert.equal(s.nPass,false);assert.ok(s.pPass&&s.dPass);
});

test('tie semantics: exact zero is noninferior but never positive',()=>{
  const tied={...PASS_ARMS,unlearned:10,reset:10};
  const s=scoreBodyTransfer(eight(i=>row(3000+i,tied)));
  assert.ok(s.g.N.g3.pass);
  assert.equal(s.g.N.g1.pass,false);
});

test('revival references point at each probe\'s own source anchor',()=>{
  assert.equal(probeAnchor('N',7,'A:A'),'N/7-C');
  assert.equal(probeAnchor('P',7,'transfer:reset'),'P/7-C');
  assert.equal(probeAnchor('N',7,'early-A:current'),'N/7-A');
  assert.equal(probeAnchor('P',7,'early-B:reset'),'P/7-B');
});
test('wrong history count is rejected',()=>{
  assert.throws(()=>scoreBodyTransfer(eight(i=>row(4000+i)).slice(0,7)));
});

test('bank draws 72 unique fresh seeds outside the exclusion union',()=>{
  const p=bodyTransferBank('evidence/body-transfer/test-bank-01/protocol.json');
  assert.equal(p.experiment,'body-transfer-optionA-v1');
  assert.equal(p.histories.length,8);
  const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,72);
  assert.ok(!flat.includes(41)&&!flat.some(s=>s>=355001&&s<=355009));
  assert.ok(p.excludedSeeds.includes(41)&&p.excludedSeeds.includes(355001));
});

test('source manifest covers plan, adapter and scorer',()=>{
  const sources=bodyTransferSources();
  for(const name of ['scripts/body-transfer.mjs','learning/taste-experiment.mjs',
    'learning/pursuit-authority.mjs','docs/BODY_TRANSFER_PLAN_V1.md'])assert.ok(sources[name]);
});
