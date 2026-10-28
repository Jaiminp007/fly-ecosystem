import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {digest} from '../learning/intervention-study.mjs';
import {scoreValueRows} from '../learning/value-development.mjs';
import {valueFixtureProtocol,valueSyntheticRows} from './value-development-fixtures.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
export function valueInferenceSources(){
  const sources={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(name&&!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(sources,name))return;
    const bytes=readFileSync(path);sources[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString('utf8').matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(dirname(path),m[1]));
  };
  for(const name of ['scripts/value-inference-engineering.mjs','scripts/audit-value-statistics.py',
    'tests/value-development.test.mjs','docs/VALUE_LEARNING_DEVELOPMENT.md'])visit(resolve(root,name));
  return Object.fromEntries(Object.entries(sources).sort(([a],[b])=>a.localeCompare(b,'en')));
}
export function valueInferenceRecord(){
  const p=valueFixtureProtocol();return {schema:1,kind:'value-study-inference-engineering',sources:valueInferenceSources(),p,
    banks:['development','confirmation'].map(phase=>{const rows=valueSyntheticRows(p,phase);return{phase,rows,result:scoreValueRows(rows,p,phase)};}),
    scope:'Invented statistical engineering tables, not registered seeds, measured performance or qualification.'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);
  if(args.length===2&&args[0]==='--output')writeFileSync(args[1],JSON.stringify(valueInferenceRecord())+'\n',{flag:'wx'});
  else{assert.ok(args.length===4&&args[0]==='--replay'&&args[2]==='--output');
    const record=JSON.parse(readFileSync(args[1]));assert.deepEqual(record,valueInferenceRecord());
    writeFileSync(args[3],JSON.stringify({schema:1,passed:true,exactJsonReplay:true,node:process.version,platform:process.platform})+'\n',{flag:'wx'});
  }
}
