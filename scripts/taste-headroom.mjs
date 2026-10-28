import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname,relative,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runTimingHeadroom,HEADROOM_POLICIES} from '../learning/taste-headroom.mjs';
import {digest} from '../learning/intervention-study.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),input=resolve(root,'evidence/taste-development/attempt-15-progress');
const output=resolve(root,'evidence/taste-headroom/20261025-v1');assert.ok(!existsSync(output));
const read=p=>JSON.parse(readFileSync(p,'utf8')),write=(p,v)=>{mkdirSync(dirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
const sources={},visit=path=>{const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;
  const bytes=readFileSync(path);sources[name]=digest(bytes);if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(dirname(path),m[1]));};
for(const name of ['scripts/taste-headroom.mjs','docs/TASTE_HEADROOM_DESIGN.md','tests/taste-headroom.test.mjs'])visit(resolve(root,name));
const bank=read(join(input,'protocol.json')),attempt=read(join(input,'attempt.json'));
assert.equal(attempt.cruiseSpeed,0);assert.equal(attempt.count,8);
const inputs=bank.histories.map(history=>{const anchor=join(input,'anchors',`${history.seed}-C.json`),row=join(input,'rows',`${history.seed}.json`);
  return {history,anchor:relative(root,anchor).split(sep).join('/'),anchorSha256:digest(readFileSync(anchor)),row:relative(root,row).split(sep).join('/'),rowSha256:digest(readFileSync(row))};});
const protocol={schema:1,kind:'frozen-transfer-timing-headroom-development',createdAt:new Date().toISOString(),policies:HEADROOM_POLICIES,ticks:256,cruiseSpeed:0,
  inputs,sourceSha256:sources,rule:'Positive mean energy over both shadow/bare cruise, >=6/8 positive over shadow, nonnegative total survivor differences against both. No statistical qualification.',
  scope:'Reusable exploratory anchors. No training, duration sweep, privileged forks, new learner, qualification or RSI.'};
write(join(output,'protocol.json'),protocol);
for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
const start=performance.now(),cpu=process.cpuUsage(),rows=[];
for(const source of inputs){
  const anchor=read(join(root,source.anchor)),original=read(join(root,source.row)),arms={};
  const bare=original.probes['transfer:acceptCruise'];
  for(const policy of HEADROOM_POLICIES){arms[policy]=runTimingHeadroom(anchor,{policy,seed:source.history.probeSeeds.transfer});assert.equal(arms[policy].startWorldSha256,bare.startWorldSha256);}
  const effects=Object.fromEntries(['harvest','alignment'].map(policy=>[policy,{shadow:arms[policy].value-arms.cruise.value,bare:arms[policy].value-bare.value,
    shadowSurvivors:arms[policy].survivors-arms.cruise.survivors,bareSurvivors:arms[policy].survivors-bare.survivors}]));
  const row={history:source.history,arms,bare,effects};write(join(output,'rows',`${source.history.seed}.json`),row);rows.push(row);console.log(JSON.stringify({seed:source.history.seed,effects}));
}
for(const[name,hash]of Object.entries(sources))assert.equal(digest(readFileSync(join(root,name))),hash);
for(const source of inputs){assert.equal(digest(readFileSync(join(root,source.anchor))),source.anchorSha256);assert.equal(digest(readFileSync(join(root,source.row))),source.rowSha256);}
const summary=Object.fromEntries(['harvest','alignment'].map(policy=>{
  const e=rows.map(r=>r.effects[policy]),shadowMean=e.reduce((n,v)=>n+v.shadow,0)/8,bareMean=e.reduce((n,v)=>n+v.bare,0)/8,
    positive=e.filter(v=>v.shadow>0).length,shadowSurvivors=e.reduce((n,v)=>n+v.shadowSurvivors,0),bareSurvivors=e.reduce((n,v)=>n+v.bareSurvivors,0);
  return [policy,{shadowMean,bareMean,positive,shadowSurvivors,bareSurvivors,triggers:rows.reduce((n,r)=>n+r.arms[policy].statistics.triggers,0),
    promising:shadowMean>0&&bareMean>0&&positive>=6&&shadowSurvivors>=0&&bareSurvivors>=0}];
}));
const used=process.cpuUsage(cpu),result={schema:1,kind:protocol.kind,qualified:false,histories:8,summary,
  runtime:{wallSeconds:(performance.now()-start)/1000,cpuSeconds:(used.user+used.system)/1e6},sourceSha256:sources,scope:protocol.scope};
write(join(output,'results.json'),result);console.log(JSON.stringify(result));
