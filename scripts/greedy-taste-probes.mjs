// Exploratory uniform inference-mode intervention on saved DEVELOPMENT bodies.
// Does not rerun/relabel training or replace any original result.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {tasteDevelopmentSources} from './taste-development.mjs';
import {runTastePressureBattery,tastePressureEffects} from '../learning/taste-pressure.mjs';
import {digest} from '../learning/intervention-study.mjs';
const args=process.argv.slice(2),value=k=>args[args.indexOf(k)+1];
assert.ok(args.includes('--input')&&args.includes('--output'));
const input=resolve(value('--input')),output=resolve(value('--output'));assert.ok(!existsSync(output));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(dirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
const sources={...tasteDevelopmentSources(),'scripts/greedy-taste-probes.mjs':digest(readFileSync(new URL(import.meta.url)))};
for(const file of Object.keys(sources)){const target=join(output,'sources',file);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(resolve(file)),{flag:'wx'});}
write(join(output,'attempt.json'),{schema:1,kind:'exploratory-uniform-greedy-inference-intervention',input,sources,
  scope:'Post-hoc development checkpoint intervention only. All model versions get the same new inference mode and actual pricing. No new training, source-result replacement, qualification or RSI.'});
const start=performance.now(),cpu=process.cpuUsage(),rows=[];
for(const file of readdirSync(join(input,'rows')).filter(n=>n.endsWith('.json'))){
  const row=read(join(input,'rows',file)),path=join(input,'anchors',`${row.history.seed}-C.json`);if(!existsSync(path))continue;
  const anchor=read(path),originalSha256=digest(anchor);
  for(const state of Object.values(anchor.state.learners)){
    state.config.greedyInference=true;state.inference=false;
  }
  const battery=runTastePressureBattery(anchor,row.history);
  const result={history:row.history,originalSha256,interventionSha256:digest(anchor),battery,effects:tastePressureEffects(battery)};
  write(join(output,'rows',file),result);rows.push(result);console.log(JSON.stringify({seed:row.history.seed,effects:result.effects}));
}
assert.ok(rows.length>0);
for(const[name,hash]of Object.entries(sources))assert.equal(digest(readFileSync(resolve(name))),hash);
const used=process.cpuUsage(cpu),result={schema:1,histories:rows.length,qualified:false,
  effects:Object.fromEntries(Object.keys(rows[0].effects).map(k=>[k,{mean:rows.reduce((n,r)=>n+r.effects[k],0)/rows.length,positive:rows.filter(r=>r.effects[k]>0).length}])),
  runtime:{wallSeconds:(performance.now()-start)/1000,cpuSeconds:(used.user+used.system)/1e6},sources};
write(join(output,'results.json'),result);console.log(JSON.stringify(result));
