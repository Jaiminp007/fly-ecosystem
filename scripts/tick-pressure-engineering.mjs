import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tickWorldEngineeringRecord,worldSourceHashes} from './tick-cue-engineering.mjs';
import {runTickPressureBattery,tickPressureEffects} from '../learning/tick-cue-pressure.mjs';

const root = fileURLToPath(new URL('../',import.meta.url));
export function pressureSourceHashes() {
  const sources = {}, visit = path => {
    const name = relative(root,path).split(sep).join('/');
    assert.ok(name && !name.startsWith('../') && !name.startsWith('/'));
    if (Object.hasOwn(sources,name)) return;
    const bytes = readFileSync(path); sources[name] = createHash('sha256').update(bytes).digest('hex');
    if (/\.m?js$/.test(name)) for (const match of bytes.toString('utf8').matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g)) visit(resolve(dirname(path),match[1]));
  };
  for (const path of ['scripts/tick-pressure-engineering.mjs','scripts/audit-tick-pressure.py',
    'scripts/audit-tick-cue.py','scripts/audit-tick-actor-critic.py','tests/tick-pressure.test.mjs']) visit(resolve(root,path));
  for (const path of Object.keys(worldSourceHashes())) visit(resolve(root,path));
  return Object.fromEntries(Object.entries(sources).sort(([left],[right]) => left.localeCompare(right,'en')));
}

export function tickPressureEngineeringRecord() {
  const base = tickWorldEngineeringRecord(), cases = [];
  for (const parent of ['phase-candidate','partial-mortality','age-extinction','absent-end-C']) {
    const source = base.cases.find(row => row.name === parent);
    const checkpoint = source ? structuredClone(parent === 'phase-candidate' ? source.finalCheckpoint.atC : source.finalCheckpoint) : null;
    // Short mortality fixtures have no acquired snapshots. Provide unchanged
    // initial weights solely to check lifecycle/debt, never as learned skills.
    if (checkpoint && parent !== 'phase-candidate') for (const family of ['A','B']) checkpoint.state.savedModels[family] =
      Object.fromEntries(Object.entries(checkpoint.state.learners).map(([id,state]) => [id,structuredClone(state.weights)]));
    const events = {};
    const battery = runTickPressureBattery(checkpoint,{A: 17049,B: 17049},2,{ticks: 2,emit: ({role,event}) => (events[role] ??= []).push(event)});
    cases.push({parent,checkpoint,checkpointJson: JSON.stringify(checkpoint),events,battery,effects: tickPressureEffects(battery)});
  }
  return JSON.parse(JSON.stringify({schema: 1,kind: 'tick-pressure-engineering',
    scope: 'Named artificial lifecycle fixtures only. No acquired skill, meaningful pressure, performance bank or RSI established.',
    sources: pressureSourceHashes(),base,cases}));
}

export function replayTickPressure(record) {
  assert.deepEqual(record.sources,pressureSourceHashes(),'Source closure mismatch');
  assert.equal(JSON.stringify(record),JSON.stringify(tickPressureEngineeringRecord()),'Exact JSON pressure replay mismatch');
  return {schema: 1,passed: true,exactJsonReplay: true,cases: record.cases.length,
    probes: record.cases.length*8,node: process.version,platform: process.platform};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length === 2 && args[0] === '--output') writeFileSync(args[1],JSON.stringify(tickPressureEngineeringRecord())+'\n',{flag: 'wx'});
  else {
    assert.ok(args.length === 4 && args[0] === '--replay' && args[2] === '--output');
    writeFileSync(args[3],JSON.stringify(replayTickPressure(JSON.parse(readFileSync(args[1],'utf8'))),null,2)+'\n',{flag: 'wx'});
  }
}
