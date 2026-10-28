import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {World} from '../engine.mjs';

const MODES = ['normal', 'disabled', 'scrambled'];
const SEEDS = Array.from({length: 10}, (_, i) => 3001 + i * 109);
const HORIZON = 7200;
const start = performance.now();
const rows = [];
for (const seed of SEEDS) {
  let initial = null;
  const arms = {};
  for (const signalMode of MODES) {
    const world = new World({seed, founders: 24, capacity: 240, learning: true, mutation: true,
      nutrient: 3, seasonal: false, challenges: 'off', ecology: 'baseline', signalMode});
    const founders = JSON.stringify(world.flies);
    if (initial && founders !== initial) throw Error(`Signal treatment founders did not match at seed ${seed}`);
    initial = founders;
    const initialSignalCost = world.totals.signalCost;
    let agentTicks=0;
    for(let tick=0;tick<HORIZON&&world.step();tick++)agentTicks+=world.flies.length;
    arms[signalMode] = {population: world.flies.length, births: world.totals.births,
      deaths: world.totals.deaths, foodEaten: world.totals.foodEaten,
      signalCost: world.totals.signalCost - initialSignalCost,
      signalExposurePerAgentTick: world.totals.signalExposure / Math.max(1, agentTicks),
      energyResidual: world.metrics().accountingError, completedTicks: world.tick};
  }
  rows.push({seed, arms});
  console.log(JSON.stringify({seed, populations: Object.fromEntries(MODES.map(mode => [mode, arms[mode].population]))}));
}
const paired = (a,b,key) => rows.map(row => row.arms[a][key] - row.arms[b][key]);
const summarize = values => {
  const mean = values.reduce((sum,value)=>sum+value,0)/values.length;
  const sd = Math.sqrt(values.reduce((sum,value)=>sum+(value-mean)**2,0)/(values.length-1));
  const half=2.262*sd/Math.sqrt(values.length);
  return {mean,ci95:[mean-half,mean+half]};
};
const sourceSha256={};
for(const path of ['engine.mjs','scripts/signal-evaluation.mjs'])
  sourceSha256[path]=createHash('sha256').update(await readFile(new URL(`../${path}`,import.meta.url))).digest('hex');
const report={protocol:{treatments:MODES,seedPairs:SEEDS,horizonTicks:HORIZON,
  matched: 'Each treatment uses the same seed and identical founder genomes, positions and main RNG. Only signal handling differs.',
  reproduction:'enabled',mutation:'enabled',learning:'enabled',seasonality:'off',challengeSchedule:'off',
  endpoints:['final population','births','deaths','food eaten','signal energy cost','received signal exposure'],
  interpretationBoundary:'Population, feeding and survival are receiver/ecosystem outcomes; they do not establish cooperation or communication intent.'},
  sourceSha256,rows,comparisons:{normalMinusDisabled:{population:summarize(paired('normal','disabled','population')),
    foodEaten:summarize(paired('normal','disabled','foodEaten'))},
    normalMinusScrambled:{population:summarize(paired('normal','scrambled','population')),
    foodEaten:summarize(paired('normal','scrambled','foodEaten'))}},
  wallSeconds:(performance.now()-start)/1000};
const directory=new URL('../evidence/signal-study/',import.meta.url);
await mkdir(directory,{recursive:true});
await writeFile(new URL('results.json',directory),`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify(report.comparisons,null,2));
