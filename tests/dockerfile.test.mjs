import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {join,dirname,normalize} from 'node:path';

// Guard: every local module reachable from server.mjs, and every file the server serves, must be
// copied by the Dockerfile; otherwise the deployed image crashes or 404s.
test('Dockerfile copies every local module the server imports and every file it serves',()=>{
  const copied=new Set(),dirs=[];
  for(const line of readFileSync('Dockerfile','utf8').split(/\r?\n/)){const m=line.match(/^COPY\s+(.+)$/);if(!m)continue;const parts=m[1].trim().split(/\s+/);parts.pop();
    for(const p of parts){if(existsSync(p)&&statSync(p).isDirectory())dirs.push(normalize(p)+'/');else copied.add(normalize(p));}}
  const covered=f=>copied.has(normalize(f))||dirs.some(d=>normalize(f).startsWith(d.replace(/\/$/,'')+(process.platform==='win32'?'\\':'/'))||normalize(f).startsWith(d));
  const seen=new Set(),walk=f=>{f=normalize(f);if(seen.has(f))return;seen.add(f);
    for(const m of readFileSync(f,'utf8').matchAll(/(?:import|export)[^'"]*?from\s*['"](\.[^'"]+)['"]/g))walk(join(dirname(f),m[1]));};
  walk('server.mjs');
  for(const f of seen)assert.ok(covered(f),`Dockerfile does not copy ${f}, imported by the server`);
  const routes=[...readFileSync('server.mjs','utf8').matchAll(/'\/[^']*':'((?:dist|microverse)\/[^']+)'/g)].map(m=>m[1]);
  assert.ok(routes.length>=5);
  for(const f of routes){assert.ok(existsSync(f),`served file missing: ${f}`);assert.ok(covered(f),`Dockerfile does not copy served file ${f}`);}
  for(const f of ['microverse/sim.mjs','microverse/strains.mjs'])for(const m of readFileSync(f,'utf8').matchAll(/from\s*['"](\.[^'"]+)['"]/g))assert.ok(covered(join(dirname(f),m[1])),`${f} imports uncopied ${m[1]}`);
});
