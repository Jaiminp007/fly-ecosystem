import {readFile,writeFile,rename,mkdir,readdir,unlink} from 'node:fs/promises';
import {join} from 'node:path';
export class CheckpointStore {
  constructor(directory,{retain=12}={}){this.directory=directory;this.retain=retain;this.queue=Promise.resolve();}
  async init(){await mkdir(this.directory,{recursive:true});}
  async recover(){try{return JSON.parse(await readFile(join(this.directory,'autosave.json'),'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}}
  save(name,value){const serialized=JSON.stringify(value);const run=this.queue.then(async()=>{const path=join(this.directory,name);await writeFile(path+'.tmp',serialized);await rename(path+'.tmp',path);});this.queue=run.catch(()=>{});return run;}
  async rolling(value){await this.save(`rolling-${Date.now()}-tick-${value.world.tick}.json`,value);const files=(await readdir(this.directory)).filter(n=>/^rolling-\d+-tick-\d+\.json$/.test(n)).sort().reverse();for(const name of files.slice(this.retain))await unlink(join(this.directory,name));}
  async list(){return (await readdir(this.directory)).filter(n=>/^(checkpoint|rolling|terminal)-\d+-tick-\d+\.json$/.test(n)).sort().reverse();}
  async load(name){if(!/^(checkpoint|rolling|terminal)-\d+-tick-\d+\.json$/.test(name))throw Error('Invalid checkpoint name');return JSON.parse(await readFile(join(this.directory,name),'utf8'));}
}
