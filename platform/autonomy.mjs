import {spawn} from 'node:child_process';
import {mkdir,readFile} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=fileURLToPath(new URL('..',import.meta.url));
export class AutonomyService {
 constructor(directory=resolve(ROOT,'runs/autonomy')){this.directory=directory;this.child=null;this.starting=false;this.lastError=null;this.stopping=false;this.childKind=null;this.ready=false;}
 async status(){
  let report={schema:1,status:'not-started',stageName:'No campaign started',history:[]};
  try{report=JSON.parse(await readFile(join(this.directory,'status.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')return{...report,status:'error',error:error.message,running:Boolean(this.child)};}
  let ecology=null;try{
   ecology=JSON.parse(await readFile(join(this.directory,'ecology/status.json'),'utf8'));
   const saved=JSON.parse(await readFile(join(this.directory,'ecology/state.json'),'utf8'));
   ecology.parentCueCampaign=saved.parentCueCampaign;
  }catch(error){if(error.code!=='ENOENT')ecology={status:'error',error:error.message};}
  let continual=null;try{continual=JSON.parse(await readFile(join(this.directory,'continual-status.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')continual={error:error.message};}
  let ecologyConfirmation=null;try{ecologyConfirmation=JSON.parse(await readFile(join(this.directory,'ecology-confirmation.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')ecologyConfirmation={error:error.message};}
  return{...report,ecology,continual,ecologyConfirmation,activeTrack:this.childKind,running:Boolean(this.child)||this.starting,stopping:this.stopping,...(this.lastError?{error:this.lastError}:{})};
 }
 async control(command){
  if(!command||!['start','stop','start-ecology'].includes(command.action))throw Error('Unknown learning-lab action');
  if(Object.keys(command).some(key=>!['action','rounds','newCampaign'].includes(key)))throw Error('Unknown learning-lab setting');
  if(command.newCampaign!==undefined&&typeof command.newCampaign!=='boolean')throw Error('Invalid new-campaign setting');
  const rounds=command.rounds??(command.action==='start-ecology'?2:12);if(!Number.isInteger(rounds)||rounds<1||rounds>64)throw Error('Rounds must be 1–64');
  if(command.action==='stop'){if(this.child){this.stopping=true;if(this.ready)this.child.kill('SIGINT');}return this.status();}
  if(this.child||this.starting)return this.status();
  this.starting=true;this.lastError=null;
  try{
   await mkdir(this.directory,{recursive:true});
   const log=createWriteStream(join(this.directory,'runner.log'),{flags:'a'});
   this.ready=false;this.childKind=command.action==='start-ecology'?'ecology':'cue';
   const args=[resolve(ROOT,this.childKind==='ecology'?'scripts/ecology-search.mjs':'scripts/autonomous-learning.mjs'),'--directory',this.directory,'--rounds',String(rounds)];if(command.newCampaign)args.push('--new');
   this.child=spawn(process.execPath,args,{cwd:ROOT,stdio:['ignore','pipe','pipe','ipc']});
   const child=this.child;child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});let stderr='';child.stderr.on('data',chunk=>{stderr=(stderr+chunk.toString()).slice(-2000);});
   child.once('error',error=>{this.lastError=error.message;this.child=null;this.stopping=false;this.childKind=null;this.ready=false;log.end();});
   child.once('exit',(code,signal)=>{if(code!==0)this.lastError=stderr||`Trainer exited with ${signal?`signal ${signal}`:`code ${code}`}`;this.child=null;this.stopping=false;this.childKind=null;this.ready=false;log.end();});
   await new Promise(resolve=>{const timeout=setTimeout(resolve,5000);const ready=()=>{clearTimeout(timeout);resolve();};child.on('message',message=>{if(message?.type==='ready'){this.ready=true;if(this.stopping)child.kill('SIGINT');ready();}});child.once('exit',ready);child.once('error',ready);});
  }finally{this.starting=false;}
  return this.status();
 }
 async close(){if(!this.child)return;const child=this.child;this.stopping=true;await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGINT');});}
}
