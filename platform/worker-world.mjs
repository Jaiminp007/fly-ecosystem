import {Worker} from 'node:worker_threads';

// Each worker owns its World, RNGs, controller caches and acquired memory.
// The optional store writes checkpoints without transferring acquired state.
export class WorkerWorld{
 constructor(checkpoint,{directory}={}){
  this.pending=new Map();this.nextId=1;this.closed=false;
  this.ready=new Promise((resolve,reject)=>{this.resolveReady=resolve;this.rejectReady=reject;});
  this.ready.catch(()=>{}); // Callers may close before initialization completes.
  this.worker=new Worker(new URL('./world-worker.mjs',import.meta.url),{workerData:{checkpoint,directory},execArgv:[]});
  this.worker.on('message',message=>{
   if(Object.hasOwn(message,'ready')){if(message.ready)this.resolveReady({model:message.model,metrics:message.metrics,config:message.config});else this.rejectReady(Object.assign(new Error(message.error.message),{name:message.error.name}));return;}
   const waiter=this.pending.get(message.id);if(!waiter)return;this.pending.delete(message.id);
   if(message.ok)waiter.resolve(message.result);else waiter.reject(Object.assign(new Error(message.error.message),{name:message.error.name}));
  });
  const fail=error=>{this.closed=true;this.rejectReady(error);for(const p of this.pending.values())p.reject(error);this.pending.clear();};
  this.worker.on('error',fail);this.worker.on('exit',code=>{if(!this.closed||this.pending.size)fail(new Error('World worker exited with code '+code));});
 }
 async request(command,value){
  if(this.closed)throw Error('World worker is closed');await this.ready;if(this.closed)throw Error('World worker is closed');const id=this.nextId++;
  return new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject});try{this.worker.postMessage({id,command,value});}catch(error){this.pending.delete(id);reject(error);}});
 }
 advance(ticks){return this.request('advance',ticks);}
 checkpoint(){return this.request('checkpoint');}
 metrics(){return this.request('metrics');}
 frame(cursor){return this.request('frame',cursor);}
 state(){return this.request('state');}
 inspect(id){return this.request('inspect',id);}
 platformState(){return this.request('platformState');}
 platformFrame(cursor){return this.request('platformFrame',cursor);}
 eventPage(page){return this.request('eventPage',page);}
 lineage(page){return this.request('lineage',page);}
 configure(config){return this.request('configure',config);}
 record(event){return this.request('record',event);}
 save(name,metadata){return this.request('save',{name,metadata});}
 async close(){if(this.closed)return;this.closed=true;const error=new Error('World worker closed');this.rejectReady(error);for(const p of this.pending.values())p.reject(error);this.pending.clear();await this.worker.terminate();}
}
