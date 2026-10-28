import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,writeSync,closeSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {MixedFocalTransfer} from '../learning/mixed-focal-transfer.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),development=join(root,'evidence/cue-shared-development/20261026-v1'),census=join(root,'evidence/cue-component-mortality/20261026-v1'),output=join(root,'evidence/cue-focal-controller/20261026-v1');assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex');
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const previous=read(join(development,'protocol.json')),observed=read(join(census,'results.json')),selected=[{seed:1172370180,focal:2},{seed:1917475589,focal:2}];
assert.deepEqual(observed.discordances.map(item=>({seed:item.seed,focal:item.id})),selected);assert.ok(observed.discordances.every(item=>item.classification==='lost'));
const cases=selected.map(item=>{const history=previous.histories.find(value=>value.seed===item.seed),anchor='evidence/cue-shared-development/20261026-v1/anchors/'+item.seed+'-cue-shared-D.json';assert.ok(history);
  return {...item,probeSeed:history.probeSeeds.transfer,anchor,anchorSha256:hash(readFileSync(join(root,anchor)))};}),sources={};
function visit(path){const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../'));if(Object.hasOwn(sources,name))return;
  const data=readFileSync(path);sources[name]=hash(data);if(/\.m?js$/.test(name))for(const match of data.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(path),match[1]));}
for(const name of ['scripts/cue-focal-controller.mjs','scripts/check-cue-focal-controller.mjs','docs/CUE_FOCAL_CONTROLLER_DESIGN.md','tests/mixed-focal-transfer.test.mjs'])visit(join(root,name));
for(const [name,value]of Object.entries(sources))if(Object.hasOwn(previous.sourceSha256,name))assert.equal(value,previous.sourceSha256[name]);
const protocol={schema:1,kind:'cue-focal-controller',cases,sourceSha256:sources,priorProtocolSha256:hash(readFileSync(join(development,'protocol.json'))),censusSha256:hash(readFileSync(join(census,'results.json'))),
  arms:['all-residual','focal-cheap','focal-residual','all-cheap'],ticks:256,scope:'Outcome-selected mixed-program total-world diagnosis with paid setup, not a learned skill, fresh qualification or RSI.'};
write(join(output,'protocol.json'),protocol);for(const name of Object.keys(sources)){const path=join(output,'sources',name);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,readFileSync(join(root,name)),{flag:'wx'});}
const rows=[];
for(const selectedCase of cases){
  const anchor=read(join(root,selectedCase.anchor));assert.equal(hash(readFileSync(join(root,selectedCase.anchor))),selectedCase.anchorSha256);
  const alive=anchor.world.world.flies.map(fly=>fly.id);assert.ok(alive.includes(selectedCase.focal));const arms={};let commonWorld=null;
  for(const arm of protocol.arms){
    const cheapIds=arm==='all-residual'?[]:arm==='focal-cheap'?[selectedCase.focal]:arm==='focal-residual'?alive.filter(id=>id!==selectedCase.focal):alive;
    const label=selectedCase.seed+'-'+selectedCase.focal+'-'+arm,run=MixedFocalTransfer.create(anchor,{seed:selectedCase.probeSeed,cheapIds});
    const initial=run.checkpoint(false),startWorldSha256=hash(JSON.stringify(initial.world));if(commonWorld===null)commonWorld=startWorldSha256;else assert.equal(startWorldSha256,commonWorld);
    write(join(output,'starts',label+'.json'),initial);const path=join(output,'traces',label+'.jsonl');mkdirSync(dirname(path),{recursive:true});const fd=openSync(path,'wx'),digest=createHash('sha256');let events=0;
    run.attach(event=>{const line=JSON.stringify(event)+'\n';writeSync(fd,line);digest.update(line);events++;});let endpoint;
    try{endpoint=run.advance(protocol.ticks);}finally{run.attach(null);closeSync(fd);}
    const final=run.checkpoint(false),focal=run.world.flies.find(fly=>fly.id===selectedCase.focal);write(join(output,'finals',label+'.json'),final);
    arms[arm]={cheapIds,endpoint,focalAlive:!!focal,focalEnergy:focal?.energy??0,startWorldSha256,trace:{sha256:digest.digest('hex'),events}};
  }
  const row={...selectedCase,arms};write(join(output,'rows',selectedCase.seed+'-'+selectedCase.focal+'.json'),row);rows.push(row);
  console.log(JSON.stringify({seed:selectedCase.seed,focal:selectedCase.focal,arms:Object.fromEntries(Object.entries(arms).map(([arm,value])=>[arm,{alive:value.focalAlive,energy:value.focalEnergy,survivors:value.endpoint.survivors}]))}));
}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);
const result={schema:1,qualified:false,cases:rows,scope:protocol.scope};write(join(output,'results.json'),result);console.log(JSON.stringify({cases:rows.map(row=>({seed:row.seed,focal:row.focal,arms:Object.fromEntries(Object.entries(row.arms).map(([arm,value])=>[arm,{alive:value.focalAlive,energy:value.focalEnergy,survivors:value.endpoint.survivors}]))}))}));
