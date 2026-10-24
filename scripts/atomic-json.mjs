import {writeFile, rename} from 'node:fs/promises';

// Windows may reject replacement transiently with EPERM. Retry the same
// completed temporary file; never delete the previous checkpoint to force it.
export async function atomicJson(path, data, {
  renameFile = rename,
  wait = ms => new Promise(resolve => setTimeout(resolve, ms)),
  attempts = 8
} = {}) {
  await writeFile(path + '.tmp', JSON.stringify(data, null, 2) + '\n');
  for (let attempt = 1; ; attempt++) {
    try { await renameFile(path + '.tmp', path); return; }
    catch (error) {
      if (error.code !== 'EPERM' || attempt >= attempts) throw error;
      await wait(attempt * 10);
    }
  }
}
