import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
const python=process.env.CONNECTOME_PYTHON || path.join(root,'.venv-connectome/bin/python');
if(!existsSync(python)){
 console.error('MaleCNS runtime missing. Follow docs/MALECNS.md to install and prepare the verified data. No compact fallback was started.');process.exit(1);
}
const child=spawn(python,['connectome/server.py',...process.argv.slice(2)],{cwd:root,stdio:'inherit'});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('error',e=>{console.error(e.message);process.exitCode=1});
child.on('exit',code=>{process.exitCode=code??1});
