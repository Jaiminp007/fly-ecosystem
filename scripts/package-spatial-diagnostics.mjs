import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join,relative,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Readable,Writable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {createGzip,createGunzip} from 'node:zlib';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'handoff/spatial-diagnostics-20261026');
const started=performance.now(),files=new Set(),chunkLimit=24*1024*1024;
function add(name){
  const path=resolve(root,name);
  assert.ok(path.startsWith(root+'/')||path.startsWith(root+'\\'));
  assert.ok(!fs.lstatSync(path).isSymbolicLink());
  if(fs.statSync(path).isDirectory())for(const child of fs.readdirSync(path))add(join(name,child));
  else files.add(relative(root,path).replaceAll('\\','/'));
}
async function hash(path){
  const digest=createHash('sha256');
  for await(const block of fs.createReadStream(path))digest.update(block);
  return digest.digest('hex');
}
for(const name of ['feeding-context','overlap-harvest','overlap-diagnosis','guarded-overlap'])add('evidence/'+name);
const feeding=JSON.parse(fs.readFileSync(join(root,'evidence/feeding-context/20261026-v1/protocol.json'),'utf8'));
for(const input of feeding.inputs){
  add(input.acquisition);add(input.transfer);
  const seed=input.history.seed;
  add('evidence/coverage-development/20261026-v1/rows/'+seed+'.json');
  add('evidence/taste-development/attempt-15-progress/anchors/'+seed+'-C.json');
  add('evidence/escape-commitment/20261025-v1/rows/'+seed+'.json');
}
for(const name of ['evidence/coverage-development/20261026-v1/protocol.json','evidence/taste-development/attempt-15-progress/protocol.json',
  'HANDOFF.md','docs/PROGRESS.md','docs/RESEARCH_GOAL.md','docs/HANDOFF_FILE_INDEX.md','docs/SPATIAL_DIAGNOSTIC_RESULTS.md',
  'docs/FEEDING_CONTEXT_DESIGN.md','docs/OVERLAP_HARVEST_DESIGN.md','docs/OVERLAP_CAUSAL_DIAGNOSIS.md','docs/GUARDED_OVERLAP_DESIGN.md',
  'learning/feeding-context.mjs','learning/overlap-harvest.mjs','learning/guarded-overlap.mjs',
  'scripts/feeding-context.mjs','scripts/check-feeding-context.py','scripts/overlap-harvest.mjs','scripts/diagnose-overlap.mjs','scripts/check-overlap.py',
  'scripts/guarded-overlap.mjs','scripts/resume-guarded-overlap.mjs','scripts/check-guarded-overlap.mjs','scripts/package-spatial-diagnostics.mjs',
  'tests/feeding-context.test.mjs','tests/overlap-harvest.test.mjs','tests/guarded-overlap.test.mjs'])add(name);
for(const name of fs.readdirSync(root))if(/^\.(feeding-context|overlap|guarded-overlap).*20261026.*\.log$/.test(name))add(name);
assert.ok(!fs.existsSync(output),'Archive already exists; never overwrite evidence');
const records=[];
for(const path of [...files].sort())records.push({path,bytes:fs.statSync(join(root,path)).size,sha256:await hash(join(root,path))});
fs.mkdirSync(join(output,'archives'),{recursive:true});
const chunks=[];let descriptor=null,chunkBytes=0;
const sink=new Writable({write(block,encoding,callback){
  try{
    let offset=0;
    while(offset<block.length){
      if(descriptor===null){
        const name='archives/part-'+String(chunks.length+1).padStart(4,'0')+'.gzpart';
        descriptor=fs.openSync(join(output,name),'wx');chunkBytes=0;chunks.push({path:relative(root,join(output,name)).replaceAll('\\','/')});
      }
      const length=Math.min(block.length-offset,chunkLimit-chunkBytes);
      const written=fs.writeSync(descriptor,block,offset,length);assert.ok(written>0);
      offset+=written;chunkBytes+=written;
      if(chunkBytes===chunkLimit){fs.closeSync(descriptor);descriptor=null;}
    }
    callback();
  }catch(error){callback(error);}
},final(callback){if(descriptor!==null)fs.closeSync(descriptor);callback();}});
async function* members(){
  yield Buffer.from('FLY-EVIDENCE-1\n');
  for(const record of records){
    const header=Buffer.from(JSON.stringify(record)),length=Buffer.alloc(4);length.writeUInt32BE(header.length);
    yield length;yield header;
    yield* fs.createReadStream(join(root,record.path));
  }
  yield Buffer.alloc(4);
}
await pipeline(Readable.from(members()),createGzip({level:3}),sink);
for(const chunk of chunks){chunk.bytes=fs.statSync(join(root,chunk.path)).size;chunk.sha256=await hash(join(root,chunk.path));}
async function* compressed(){for(const chunk of chunks){assert.equal(await hash(join(root,chunk.path)),chunk.sha256);yield* fs.createReadStream(join(root,chunk.path));}}
const inflated=Readable.from(compressed()).pipe(createGunzip());
const iterator=inflated[Symbol.asyncIterator]();let pending=Buffer.alloc(0);
async function consume(size,accept){
  let remaining=size;
  while(remaining){
    if(!pending.length){const next=await iterator.next();assert.equal(next.done,false,'Truncated archive');pending=next.value;}
    const length=Math.min(remaining,pending.length);accept(pending.subarray(0,length));pending=pending.subarray(length);remaining-=length;
  }
}
async function read(size){const parts=[];await consume(size,part=>parts.push(part));return Buffer.concat(parts);}
assert.equal((await read(15)).toString(),'FLY-EVIDENCE-1\n');
let verified=0;
for(const expected of records){
  const length=(await read(4)).readUInt32BE();assert.ok(length>0&&length<65536);
  const record=JSON.parse((await read(length)).toString());assert.deepEqual(record,expected);
  const digest=createHash('sha256');await consume(record.bytes,part=>digest.update(part));assert.equal(digest.digest('hex'),record.sha256);verified++;
}
assert.equal((await read(4)).readUInt32BE(),0);assert.equal(pending.length,0);assert.equal((await iterator.next()).done,true);
const manifest={schema:1,format:'ordered split gzip; FLY-EVIDENCE-1 newline magic; repeated uint32be JSON-header length, UTF-8 header, exact content bytes; zero header length terminates',
  files:records,chunks,uncompressedBytes:records.reduce((sum,item)=>sum+item.bytes,0),compressedBytes:chunks.reduce((sum,item)=>sum+item.bytes,0),
  streamedArchiveContentVerified:verified,wallSeconds:(performance.now()-started)/1000,
  scope:'Self-contained failed feeding-context, overlap, focal-intervention and guarded-overlap diagnostics, including source captures, interrupted execution, recovery, inputs and readbacks. No qualification or RSI claim.'};
fs.writeFileSync(join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({files:records.length,chunks:chunks.length,compressedBytes:manifest.compressedBytes,verified,wallSeconds:manifest.wallSeconds}));
