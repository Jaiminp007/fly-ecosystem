import {randomUUID} from 'node:crypto';
import {join} from 'node:path';
import {DT,INPUTS,OUTPUTS,World} from '../engine.mjs';
import {CheckpointStore} from '../persistence.mjs';
import {EcosystemManager,EDITABLE,configObject,nameOf} from './manager.mjs';
import {WorkerWorld} from './worker-world.mjs';
import {compactControllerView} from './controller-adapter.mjs';

// Opt-in server backend. Acquired state stays in one persistent worker per
// habitat; only explicit exports/forks/restores transfer complete checkpoints.
// The inherited metadata/control queues and file format remain compatible.
export class WorkerEcosystemManager extends EcosystemManager {
  async attach(entry,checkpoint) {
    const worker=new WorkerWorld(checkpoint,{directory:entry.store.directory});
    try {
      const ready=await worker.ready;
      entry.world=worker;entry.metrics=ready.metrics;entry.config=ready.config;
      entry.runtime={droppedTicks:0,clippedWallSeconds:0,maxOwedTicks:0,lastSaveMs:null};
    } catch(error) {await worker.close();throw error;}
  }

  async init() {
    await super.init();
    try {for(const entry of this.experiments.values())await this.attach(entry,entry.world.checkpoint());}
    catch(error) {
      await Promise.all([...this.experiments.values()].filter(e=>e.world instanceof WorkerWorld).map(e=>e.world.close()));
      throw error;
    }
  }

  list() {return [...this.experiments.values()].map(entry=>({...this.metadata(entry),metrics:structuredClone(entry.metrics)}));}
  metadata(entry) {return {...super.metadata(entry),runtime:{backend:'worker',...entry.runtime,owedTicks:entry.owed}};}

  async view(entry) {
    const state=await entry.world.platformState();entry.metrics=state.metrics;
    return {...state,ecosystem:this.metadata(entry)};
  }
  state(id) {const entry=this.get(id);return this.exclusive(entry,()=>this.view(entry));}
  frame(id,cursor={}) {
    const entry=this.get(id);
    return this.exclusive(entry,async()=>{
      const frame=await entry.world.platformFrame(cursor);entry.metrics=frame.metrics;
      return {...frame,ecosystem:this.metadata(entry)};
    });
  }
  eventPage(id,page={}) {const entry=this.get(id);return this.exclusive(entry,()=>entry.world.eventPage(page));}
  lineage(id,page={}) {const entry=this.get(id);return this.exclusive(entry,()=>entry.world.lineage(page));}
  inspect(id,agentId) {
    if(!Number.isSafeInteger(agentId)||agentId<1)throw Error('Invalid agent ID');
    const entry=this.get(id);
    return this.exclusive(entry,async()=>{
      const detail=await entry.world.inspect(agentId);
      return detail.genome?{...detail,controllerView:compactControllerView(detail,{inputs:INPUTS,outputs:OUTPUTS})}:detail;
    });
  }

  savedMetadata(entry,savedAt=new Date().toISOString()) {
    return {schema:1,id:entry.id,name:entry.name,createdAt:entry.createdAt,parentId:entry.parentId,
      speed:entry.speed,savedAt,checkpointClock:entry.checkpointClock};
  }
  async serialize(entry,savedAt) {return {...this.savedMetadata(entry,savedAt),checkpoint:await entry.world.checkpoint()};}
  async persist(entry) {
    const metadata=this.savedMetadata(entry);
    try {
      const saved=await entry.world.save('autosave.json',metadata);entry.savedAt=metadata.savedAt;entry.runtime.lastSaveMs=saved.durationMs;
      if(entry.error?.startsWith('Checkpoint failed:'))entry.error=null;
    } catch(error) {entry.paused=true;entry.error=`Checkpoint failed: ${error.message}`;throw error;}
  }
  async archive(entry) {
    entry.checkpointClock=Math.max(Date.now(),entry.checkpointClock+1);
    const name=`checkpoint-${entry.checkpointClock}-tick-${entry.metrics.tick}.json`;
    try {await entry.world.save(name,this.savedMetadata(entry));}
    catch(error) {entry.paused=true;entry.error=`Checkpoint failed: ${error.message}`;throw error;}
    return name;
  }

  async add(name,world,parentId=null) {
    if(this.experiments.size>=16)throw Error('This local workspace supports up to 16 ecosystems');
    const id=randomUUID(),store=new CheckpointStore(join(this.directory,id));await store.init();
    const entry=this.entry(id,nameOf(name),null,store,undefined,parentId);
    await this.attach(entry,world.checkpoint());
    try {await this.persist(entry);this.experiments.set(id,entry);return await this.view(entry);}
    catch(error) {this.experiments.delete(id);await entry.world.close();throw error;}
  }

  fork(id,name) {
    const source=this.get(id),validatedName=nameOf(name);
    return this.exclusive(source,async()=>{
      // Forking is explicit and infrequent; its full checkpoint transfer is
      // intentional. Record the same event without changing RNG state.
      const checkpoint=await source.world.checkpoint();
      const copy=World.restore(checkpoint);
      copy.record('fork',`Independent branch of ecosystem ${source.name} at tick ${copy.tick}`);
      const result=this.creations.then(()=>this.add(validatedName,copy,id));
      this.creations=result.catch(()=>{});return result;
    });
  }

  control(id,command={}) {
    const entry=this.get(id);
    return this.exclusive(entry,async()=>{
      let savedCheckpoint;
      switch(command.action) {
        case 'run':
          if(entry.metrics.status!=='running')throw Error('Ecosystem stopped: extinction or population capacity');
          if(entry.error)throw Error('Resolve the reported error or restore a valid checkpoint before running');
          entry.paused=false;entry.owed=0;break;
        case 'pause':entry.paused=true;entry.owed=0;break;
        case 'step': {
          const ticks=command.ticks??10;
          if(!Number.isSafeInteger(ticks)||ticks<1||ticks>1000)throw Error('Step must be 1–1000 ticks');
          entry.paused=true;entry.owed=0;
          try {entry.metrics=await entry.world.advance(ticks);}
          catch(error) {entry.error=`Simulation failed: ${error.message}`;throw error;}
          break;
        }
        case 'speed':
          if(![1,5,10].includes(command.value))throw Error('Speed must be 1, 5 or 10');
          entry.speed=command.value;break;
        case 'configure': {
          const result=await entry.world.configure(configObject(command.config,EDITABLE));
          entry.config=result.config;entry.metrics=result.metrics;break;
        }
        case 'checkpoint':savedCheckpoint=await this.archive(entry);break;
        case 'restore': {
          const saved=await entry.store.load(command.name);
          if(saved.schema!==1||saved.id!==id)throw Error('Checkpoint belongs to another ecosystem');
          const candidate=new WorkerWorld(saved.checkpoint,{directory:entry.store.directory});
          try {
            const ready=await candidate.ready;await this.archive(entry);
            const previous=entry.world;entry.world=candidate;entry.metrics=ready.metrics;entry.config=ready.config;
            entry.paused=true;entry.owed=0;entry.error=null;await previous.close();
          } catch(error) {await candidate.close();throw error;}
          break;
        }
        default:throw Error('Unknown control action');
      }
      await this.persist(entry);
      return {...await this.view(entry),...(savedCheckpoint?{savedCheckpoint}:{})};
    });
  }

  advanceRealtime(seconds) {
    const active=[...this.experiments.values()].filter(entry=>!entry.paused);
    for(const entry of active) {
      // Time continues to accrue while a worker computes or writes a save.
      // Each entry still has at most one in-flight simulation/control unit.
      const elapsed=Math.max(0,seconds),accrued=Math.min(elapsed,.25);
      entry.runtime.clippedWallSeconds+=elapsed-accrued;
      const owed=entry.owed+accrued*entry.speed/DT;
      // Large real checkpoints can take longer than a wall second. Retain
      // ten wall seconds at the highest requested speed so workers can catch
      // up after saves, without allowing an unbounded sleep/resume backlog.
      entry.runtime.droppedTicks+=Math.max(0,owed-1000);
      entry.owed=Math.min(1000,owed);entry.runtime.maxOwedTicks=Math.max(entry.runtime.maxOwedTicks,entry.owed);
      if(entry.pending||entry.owed<1)continue;
      const ticks=Math.min(10,Math.floor(entry.owed));entry.owed-=ticks;
      this.exclusive(entry,async()=>{
        entry.metrics=await entry.world.advance(ticks);
        if(entry.metrics.status!=='running'){entry.paused=true;entry.owed=0;}
      }).catch(error=>{entry.paused=true;entry.error=`Simulation failed: ${error.message}`;});
    }
    // Yield to I/O, then check active workers promptly. No active habitats
    // means the server returns to its ordinary idle timer.
    return active.length>0;
  }

  async close() {
    for(const entry of this.experiments.values()){entry.paused=true;entry.owed=0;}
    await this.creations;
    try {await this.flush();}
    finally {await Promise.all([...this.experiments.values()].map(entry=>entry.world.close()));}
  }
}
