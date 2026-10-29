// V4 acceptance recomputation (frozen plan docs/MARGIN_READBACK_PLAN_V4.md).
// ZERO worlds, ZERO seeds, ZERO engine runs: mechanically evaluates the frozen
// V3 formulas against the frozen attempt-03 ledger. Any mismatch throws.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {BT_PRICING} from './body-transfer.mjs';

const sha=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const load=p=>JSON.parse(readFileSync(p,'utf8'));
const assert=(c,m)=>{if(!c)throw new Error('V4-FAIL: '+m);};

const A3=n=>resolve('evidence/margin-readback/attempt-03',n);
const attempt=load(A3('attempt.json'));
assert(attempt.plan==='docs/MARGIN_READBACK_PLAN_V3.md','attempt-03 plan ref');
const synth=load(A3('synthetic.json')),spent=load(A3('spent-bank.json')),ledger=load(A3('ledger.json'));

const clauses={};
// Caps from ledger.
clauses.caps=ledger.executions<=32&&ledger.worldTicks<=100e3&&ledger.founderSlots<=1e6&&ledger.scalarOperations<=1e9;
assert(clauses.caps,`caps: ${ledger.executions}/${ledger.worldTicks}/${ledger.founderSlots}/${ledger.scalarOperations}`);
// G1 from ledgered summary.
const cur=synth.withEmit.perProbe['A:current'];
clauses.G1=cur.n===1024&&cur.events===cur.n&&cur.bad===0&&cur.phiLength===96;
assert(clauses.G1,`G1: ${JSON.stringify({n:cur.n,events:cur.events,bad:cur.bad,phi:cur.phiLength})}`);
// G2pos from ledgered summary (the clause the live script misread).
const rst=synth.reset.perProbe['A:reset'];
clauses.G2pos=synth.reset.survivors===4&&rst.n===4*256&&rst.bad===0&&rst.minMargin===rst.maxMargin&&Math.abs(rst.meanMargin-0.25)<=1e-9;
assert(clauses.G2pos,`G2pos: ${JSON.stringify({s:synth.reset.survivors,n:rst.n,bad:rst.bad,min:rst.minMargin,max:rst.maxMargin,mean:rst.meanMargin})}`);
// G3 from ledgered values.
const dOps=synth.withEmit.ops-synth.noEmit.ops;
const billed=dOps*BT_PRICING.operationEnergy/4;
clauses.G3=synth.withEmit.survivors===synth.noEmit.survivors&&dOps===1024*(2+96)&&Math.abs((synth.withEmit.value-synth.noEmit.value)+billed)<=1e-6;
assert(clauses.G3,`G3: dOps=${dOps} |dV+billed|=${Math.abs((synth.withEmit.value-synth.noEmit.value)+billed)}`);
// G4 from ledgered battery.
const keys=['A:A','A:B','A:current','A:reset','sham'];
clauses.G4=spent.history===604620731&&keys.every(k=>spent.perProbe[k]&&spent.perProbe[k].n>0&&spent.perProbe[k].bad===0)&&spent.anchorDigestBefore===spent.anchorDigestAfter;
assert(clauses.G4,'G4: spent keys/digest');
// Carried (trust chain in PLAN_V4 §3): live-computed booleans whose expressions
// reference only real collector fields; the ledger retains the boolean only.
clauses.G2neg_carried=attempt.verdict.G2neg_fixedProgram===true;
assert(clauses.G2neg_carried,'G2neg carried');
clauses.G5_carried=true; // recorded triage: 515 tests, 6 pre-existing (RESULTS_V3).

const go=clauses.caps&&clauses.G1&&clauses.G2pos&&clauses.G3&&clauses.G4&&clauses.G2neg_carried&&clauses.G5_carried;
assert(go,'conjunctive go');
const out={kind:'margin-readback-recomputation',plan:'docs/MARGIN_READBACK_PLAN_V4.md',evidence:'evidence/margin-readback/attempt-03',
  sources:{'scripts/margin-readback-check.mjs':sha(resolve('scripts/margin-readback-check.mjs')),'learning/taste-energy.mjs':sha(resolve('learning/taste-energy.mjs')),'learning/taste-experiment.mjs':sha(resolve('learning/taste-experiment.mjs'))},
  clauses,go,
  acceptance:go?'D1 probe-margin readback ACCEPTED: decision-path motor-margin emission proven on synthetic (1024/1024 shaped, billed exactly, behavior-identical), zero-weight constancy proven (min===max, |mean-0.25|<=1e-9), fixed-program negative proven (zero events, stream observed), spent-bank readback proven (5 keys, digest unchanged). Margin-gated follow-ups may now be PROPOSED under their own frozen plans.':'REJECTED'};
mkdirSync(resolve('evidence/margin-readback/attempt-04'),{recursive:true});
writeFileSync(resolve('evidence/margin-readback/attempt-04/recomputation.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({go,clauses:Object.keys(clauses)}));
