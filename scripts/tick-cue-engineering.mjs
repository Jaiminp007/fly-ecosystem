import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {TickCueExperiment,TICK_CUE_ARMS,TICK_CUE_PROBES,runTickCueProbe} from '../learning/tick-cue-experiment.mjs';

const root = fileURLToPath(new URL('../',import.meta.url));
const canonical = value => JSON.parse(JSON.stringify(value));
export const TICK_WORLD_SOURCE_SEEDS = ['scripts/tick-cue-engineering.mjs','scripts/audit-tick-cue.py',
  'scripts/audit-tick-actor-critic.py','tests/tick-cue-world-audit.test.mjs'];

export function worldSourceHashes() {
  const sources = {}, visit = path => {
    const name = relative(root,path).split(sep).join('/');
    assert.ok(name && !name.startsWith('../') && !name.startsWith('/'));
    if (Object.hasOwn(sources,name)) return;
    const bytes = readFileSync(path); sources[name] = createHash('sha256').update(bytes).digest('hex');
    if (!/\.m?js$/.test(name)) return;
    for (const match of bytes.toString('utf8').matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g)) visit(resolve(dirname(path),match[1]));
  };
  for (const path of TICK_WORLD_SOURCE_SEEDS) visit(resolve(root,path));
  return Object.fromEntries(Object.entries(sources).sort(([left],[right]) => left.localeCompare(right,'en')));
}

function prepare(run, profile) {
  for (const [index,fly] of run.world.flies.entries()) {
    Object.assign(fly,{energy: 120,x: 100+400*index,y: 100,age: 0});
    Object.assign(fly.genome.traits,{speed: 0,metabolism: 0,lifespan: 1000});
  }
  for (const patch of run.world.food) Object.assign(patch,{amount: 0,regrowth: 0});
  if (profile === 'mixed') {
    Object.assign(run.world.food[0],{x: 100,y: 100,amount: .8,capacity: 1,cueId: 1,cue: [1,-1,1,-1],valence: 1});
    Object.assign(run.world.food[1],{x: 100,y: 101,amount: .8,capacity: 1,cueId: 2,cue: [-1,1,-1,1],valence: -1});
  }
  if (profile === 'extinct') for (const fly of run.world.flies) fly.genome.traits.lifespan = .01;
  if (profile === 'partial') run.world.flies[0].genome.traits.lifespan = .01;
  run.world.initialEnergy = run.world.energy(); run.startingEnergy = 240;
}

export function tickWorldEngineeringRecord() {
  const config = {history: {seed: 17041,cueSeed: 17042,resourceSeeds: [17043,17044,17045,17046],shuffleSeed: 17047,nullSeed: 17048},
    reference: {founders: 2,actorParameters: {},parameters: {actuator: 'move',moveMode: 'levels',slowSpeed: .15,fastSpeed: .5,
      decisionTicks: 8,creditTicks: 8,returnMode: 'td',discount: .99}},
    pricing: {operationEnergy: 5e-6/17,byteEnergyPerSecond: 1e-5/(17*8)}};
  const cases = [];
  const collect = (name,arm,profile,ticks) => {
    const events = [], run = new TickCueExperiment({...config,arm,emit: event => events.push(event)});
    prepare(run,profile); const initialCheckpoint = run.checkpoint(false); run.advance(ticks);
    const result = {name,arm,profile,ticks,initialCheckpoint,events,finalCheckpoint: run.checkpoint(),endpoint: run.endpoint()};
    cases.push(result); return result;
  };
  for (const arm of TICK_CUE_ARMS) collect(`short-${arm}`,arm,'quiet',4);
  collect('mixed-intake','acceptCruise','mixed',3);
  const extinct = collect('age-extinction','candidate','extinct',1);
  const partial = collect('partial-mortality','candidate','partial',2);
  const phase = collect('phase-candidate','candidate','quiet',1792);
  collect('phase-frozen','frozen','quiet',1025); collect('phase-reset','reset','quiet',1025);
  const probes = [];
  const probe = (parent,checkpoint,spec,ticks) => {
    const events = [], result = runTickCueProbe(checkpoint,spec,17049,2,{ticks,emit: event => events.push(event)});
    probes.push({parent,spec,ticks,resourceSeed: 17049,events,result});
  };
  for (const spec of TICK_CUE_PROBES) probe(phase.name,phase.finalCheckpoint.atC,spec,2);
  for (const source of [partial,extinct]) for (const version of ['C','reset','accept','acceptStationary']) {
    probe(source.name,source.finalCheckpoint,{family: 'transfer',version},2);
  }
  probe('absent-end-C',null,{family: 'A',version: 'C'},2);
  return canonical({schema: 1,kind: 'tick-cue-world-engineering',
    scope: 'Named synthetic world fixtures and short probes; not performance histories, reachable learned states, qualification, or RSI.',
    config,sources: worldSourceHashes(),cases,probes});
}

export function replayTickWorldEngineering(record) {
  assert.deepEqual(record.sources,worldSourceHashes(),'Captured source mismatch');
  const regenerated = tickWorldEngineeringRecord();
  assert.ok(JSON.stringify(regenerated) === JSON.stringify(record),'Exact JSON world/event/probe replay mismatch');
  return {schema: 1,passed: true,cases: record.cases.length,probes: record.probes.length,
    exactJsonReplay: true,nodeVersion: process.version,platform: process.platform,
    scope: 'Exact same-runtime named engineering reconstruction; not a performance result or independent physics implementation.'};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length === 2 && args[0] === '--output') {
    writeFileSync(args[1],JSON.stringify(tickWorldEngineeringRecord())+'\n',{flag: 'wx'});
  } else {
    assert.ok(args.length === 4 && args[0] === '--replay' && args[2] === '--output',
      'Usage: --output RECORD | --replay RECORD --output AUDIT');
    const result = replayTickWorldEngineering(JSON.parse(readFileSync(args[1],'utf8')));
    writeFileSync(args[3],JSON.stringify(result,null,2)+'\n',{flag: 'wx'});
  }
}
