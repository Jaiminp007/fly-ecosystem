import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {cueObservation} from '../learning/cue-foraging.mjs';
import {chargeForStep,billSarsaWork} from '../learning/sarsa-experiment.mjs';
import {createTickBody,chooseTickAction,observeTickBody,tickMotor,freezeTickBody,resetTickBody,restoreTickBody} from '../learning/tick-actor-critic.mjs';

export const TICK_ENGINEERING_SOURCES = ['learning/tick-actor-critic.mjs','learning/odor-identity.mjs',
  'learning/intervention-study.mjs','learning/cue-foraging.mjs','learning/sarsa-experiment.mjs',
  'scripts/tick-actor-critic-engineering.mjs','scripts/audit-tick-actor-critic.py',
  'tests/tick-actor-critic.test.mjs','tests/tick-actor-critic-audit.test.mjs'];
const canonical = value => JSON.parse(JSON.stringify(value));

export function tickEngineeringRecord() {
  const pricing = {operationEnergy: 5e-6/17,byteEnergyPerSecond: 1e-5/(17*8)};
  const fixtures = [];
  for (const [index,name] of ['continuing','frozen-reset','terminal-debt','neutral'].entries()) {
    const agentId = index+11, seed = 17021+index;
    let state = createTickBody(agentId,seed);
    const initialState = canonical(state), events = [];
    const append = event => events.push(canonical({...event,state}));
    const limit = name === 'neutral' ? 3 : name === 'terminal-debt' ? 4 : 6;
    for (let tick = 1; tick <= limit; tick++) {
      const raw = Array(17).fill(0); raw[0] = .8; raw[2] = .6; raw[3] = .5;
      raw[4] = .4; raw[10] = tick%3 === 0 ? 1 : 0; raw[13] = tick%2 ? .25 : -.25; raw[16] = 1;
      const cue = name === 'neutral' ? [0,0,0,0] : [tick%2 ? 1 : -1,-1,1,-1];
      const own = {agentId,tick,energy: 50-tick/20,raw,observation: cueObservation(raw,cue)};
      const transitions = [], action = chooseTickAction(state,own,row => transitions.push(row));
      append({type: 'choose',own,action,transitions});
      const outputs = tickMotor(state,raw,action); append({type: 'motor',raw,action,outputs});
      const bill = chargeForStep(state,pricing); append({type: 'charge',energyCost: bill.energyCost});
      const paid = name === 'terminal-debt' ? bill.energyCost/2 : bill.energyCost;
      bill.afterEnergyCharge({paid}); append({type: 'pay',paid});
      const terminal = tick === limit && ['terminal-debt','neutral'].includes(name);
      const after = {agentId,tick,energy: terminal ? -state.charge.outstandingEnergy : own.energy-.01,terminal};
      const endings = []; observeTickBody(state,after,row => endings.push(row));
      append({type: 'observe',own: after,transitions: endings});
      if (terminal) {billSarsaWork(state,pricing); append({type: 'bill'});}
      if (name === 'frozen-reset' && tick === 3) {freezeTickBody(state); append({type: 'freeze'});}
      if (name === 'frozen-reset' && tick === 5) {resetTickBody(state); append({type: 'reset'});}
      state = restoreTickBody(canonical(state)); append({type: 'restore'});
    }
    fixtures.push({name,agentId,seed,initialState,events,finalState: canonical(state)});
  }
  return {schema: 1,kind: 'tick-actor-critic-engineering-tape',
    scope: 'Synthetic own-energy API schedules only; not physical sensor provenance, ecological performance, qualification, or a complete portable source freeze.',
    pricing,sources: Object.fromEntries(TICK_ENGINEERING_SOURCES.map(path => [path,
      createHash('sha256').update(readFileSync(new URL(`../${path}`,import.meta.url))).digest('hex')])),fixtures};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  assert.ok(args.length === 2 && args[0] === '--output','Usage: node scripts/tick-actor-critic-engineering.mjs --output PATH');
  writeFileSync(args[1],JSON.stringify(tickEngineeringRecord(),null,2)+'\n',{flag: 'wx'});
}
