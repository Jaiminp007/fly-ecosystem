// Read-only path translation for archived Node audits. Original protocol bytes
// and their hashes remain untouched. Writes are intentionally not redirected.
import fs from 'node:fs';
import promises from 'node:fs/promises';
import {registerHooks, syncBuiltinESMExports} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

const original = '/Users/jaiminpatel/.t3/scratch/2026-10-21-clone-this-github-repo-start-d28b3a85';
const current = resolve(process.env.FLY_HANDOFF_ROOT || fileURLToPath(new URL('..', import.meta.url)));
function translated(value) {
  if (value instanceof URL) return value.protocol === 'file:' ? pathToFileURL(translated(fileURLToPath(value))) : value;
  if (Buffer.isBuffer(value)) return Buffer.from(translated(value.toString()));
  if (typeof value !== 'string') return value;
  return value === original || value.startsWith(original + '/') ? current + value.slice(original.length) : value;
}
function wrap(object, name) {
  const originalMethod = object[name];
  if (typeof originalMethod !== 'function') return;
  const wrapped = function(path, ...args) { return originalMethod.call(object, translated(path), ...args); };
  if (typeof originalMethod.native === 'function') wrapped.native = function(path, ...args) { return originalMethod.native.call(object, translated(path), ...args); };
  object[name] = wrapped;
}
for (const name of ['readFile', 'open', 'stat', 'lstat', 'realpath', 'readdir', 'access']) wrap(promises, name);
for (const name of ['readFile', 'readFileSync', 'open', 'openSync', 'stat', 'statSync', 'lstat', 'lstatSync', 'realpath', 'realpathSync', 'readdir', 'readdirSync', 'access', 'accessSync', 'existsSync', 'createReadStream']) wrap(fs, name);
syncBuiltinESMExports();
registerHooks({resolve(specifier, context, nextResolve) {
  const mapped = specifier.startsWith('file:') ? translated(new URL(specifier)).href : translated(specifier);
  return nextResolve(mapped, context);
}});
