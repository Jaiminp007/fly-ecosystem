import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('archived absolute Node reads and imports translate without rewriting evidence bytes', () => {
  const directory = mkdtempSync(join(tmpdir(), 'afterwing-portable-loader-'));
  try {
    writeFileSync(join(directory, 'evidence.json'), '{"unchanged":true}\n');
    writeFileSync(join(directory, 'fixture.mjs'), 'export const verified = true;\n');
    const old = '/Users/jaiminpatel/.t3/scratch/2026-10-21-clone-this-github-repo-start-d28b3a85';
    const code = `import {readFileSync} from 'node:fs'; import {readFile} from 'node:fs/promises'; const p=${JSON.stringify(old + '/evidence.json')}; const m=await import(${JSON.stringify('file://' + old + '/fixture.mjs')}); process.stdout.write(JSON.stringify({sync:readFileSync(p,'utf8'),async:await readFile(p,'utf8'),module:m.verified}));`;
    const result = spawnSync(process.execPath, ['--import', fileURLToPath(new URL('../scripts/portable-evidence-loader.mjs', import.meta.url)), '--input-type=module', '-e', code], {encoding: 'utf8', env: {...process.env, FLY_HANDOFF_ROOT: directory}});
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), {sync: '{"unchanged":true}\n', async: '{"unchanged":true}\n', module: true});
  } finally { rmSync(directory, {recursive: true, force: true}); }
});
