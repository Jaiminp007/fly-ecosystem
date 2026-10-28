import assert from 'node:assert/strict';

const distance=(first,second)=>Math.hypot(first.x-second.x,first.y-second.y);
const clamp=(value,lower,upper)=>Math.max(lower,Math.min(upper,value));

export class PursuitCensus{
  constructor(emit=()=>{}){this.emit=emit;this.active=new Map();this.episodes=[];this.nextId=1;}
  record(record){
    const key=record.target?record.phase+':'+record.target.index+':'+record.target.x+':'+record.target.y:record.phase+':none';
    let episode=this.active.get(record.id);
    if(episode&&(episode.key!==key||episode.lastTick+1!==record.tick)){this.finish(record.id,'switch');episode=null;}
    if(!episode){
      episode={episodeId:this.nextId++,key,id:record.id,phase:record.phase,target:record.target,startTick:record.tick,lastTick:record.tick,
        ticks:0,startDistance:record.distanceBefore,endDistance:record.distanceAfter,path:0,netApproach:0,intake:0,toxinDamage:0,
        physicalCosts:0,movementCosts:0,rejectedMoves:0,boundaryClips:0,wallWarnings:0,previousIntakePositive:0,
        firstRaw:[...record.raw],lastRaw:[...record.raw],startPosition:[record.x,record.y],endPosition:[record.afterX,record.afterY]};
      this.active.set(record.id,episode);
    }
    episode.ticks++;episode.lastTick=record.tick;episode.endDistance=record.distanceAfter;
    episode.path+=record.displacement;episode.netApproach+=record.distanceBefore===null?0:record.distanceBefore-record.distanceAfter;
    episode.intake+=record.intake;episode.toxinDamage+=record.toxinDamage;episode.physicalCosts+=record.cost;episode.movementCosts+=record.movementCost;
    episode.rejectedMoves+=Number(record.collision);episode.boundaryClips+=Number(record.boundaryClip);
    episode.wallWarnings+=Number(record.raw[10]>0||record.raw[11]>0);episode.previousIntakePositive+=Number(record.raw[13]>0);
    episode.lastRaw=[...record.raw];episode.endPosition=[record.afterX,record.afterY];
    this.emit({...record,episodeId:episode.episodeId});
  }
  finish(id,reason){const episode=this.active.get(id);if(!episode)return;episode.endReason=reason;this.episodes.push(episode);this.active.delete(id);}
  finishAll(){for(const id of this.active.keys())this.finish(id,'endpoint-or-death');return this.episodes;}
}

export function observePursuit(world,census,phase){
  const sensors=world.sensors.bind(world),step=world.step.bind(world),normal=world.rng.normal.bind(world.rng),targets=new Map();let noise=0;
  Object.defineProperty(world.rng,'normal',{enumerable:false,configurable:true,value:()=>{noise=normal();return noise;}});
  Object.defineProperty(world,'sensors',{enumerable:false,configurable:true,value:(fly,foodIndex,agentIndex,challenge)=>{
    const raw=sensors(fly,foodIndex,agentIndex,challenge);let target=null,score=0;
    for(const patch of foodIndex.nearby(fly,fly.genome.traits.sense).filter(patch=>patch.amount>.06)){
      const value=patch.amount/(distance(fly,patch)+20);if(value>score){target=patch;score=value;}
    }
    targets.set(fly.id,target?{index:world.food.indexOf(target),x:target.x,y:target.y,amount:target.amount,
      deepInterior:world.obstacles.some(obstacle=>distance(target,obstacle)<obstacle.r-10)}:null);
    return raw;
  }});
  Object.defineProperty(world,'step',{enumerable:false,configurable:true,value:controller=>step((fly,raw,tick)=>{
    const hooks=controller(fly,raw,tick),before={x:fly.x,y:fly.y,heading:fly.heading},target=targets.get(fly.id);let outputs=null;
    return {...hooks,afterController:native=>{hooks.afterController?.(native);outputs=[...native];},afterStep:receipt=>{
      hooks.afterStep?.(receipt);assert.ok(outputs);
      const heading=before.heading+outputs[0]*.28+noise*.06,speed=(outputs[1]+1)/2*fly.genome.traits.speed;
      const unbounded={x:before.x+Math.cos(heading)*speed*.1,y:before.y+Math.sin(heading)*speed*.1};
      const proposed={x:clamp(unbounded.x,6,994),y:clamp(unbounded.y,6,634)};
      const collision=world.obstacles.some(obstacle=>distance(proposed,obstacle)<obstacle.r+5);
      assert.ok(Math.abs(fly.x-(collision?before.x:proposed.x))<1e-9&&Math.abs(fly.y-(collision?before.y:proposed.y))<1e-9);
      census.record({id:fly.id,tick,phase:phase(),raw:[...raw],outputs,target,x:before.x,y:before.y,afterX:fly.x,afterY:fly.y,
        distanceBefore:target?distance(before,target):null,distanceAfter:target?distance(fly,target):null,
        displacement:distance(before,fly),collision,boundaryClip:unbounded.x!==proposed.x||unbounded.y!==proposed.y,
        intake:receipt.beneficialEaten,toxinDamage:receipt.toxinDamage,cost:receipt.cost,movementCost:speed*.008*.1});
    }};
  })});
}

export function summarizePursuit(episodes){
  const sums=names=>Object.fromEntries(names.map(name=>[name,episodes.reduce((sum,episode)=>sum+episode[name],0)]));
  const targeted=episodes.filter(episode=>episode.target),zeroIntake=targeted.filter(episode=>episode.intake===0),deep=targeted.filter(episode=>episode.target.deepInterior);
  const distribution=values=>{const sorted=[...values].sort((first,second)=>first-second);return {count:sorted.length,min:sorted[0]??null,median:sorted[Math.floor(sorted.length/2)]??null,p90:sorted[Math.floor(sorted.length*.9)]??null,max:sorted.at(-1)??null};};
  return {episodes:episodes.length,...sums(['ticks','path','intake','toxinDamage','physicalCosts','movementCosts','rejectedMoves','boundaryClips']),
    targetedTicks:targeted.reduce((sum,episode)=>sum+episode.ticks,0),deepInteriorTicks:deep.reduce((sum,episode)=>sum+episode.ticks,0),
    zeroIntakeTargetedTicks:zeroIntake.reduce((sum,episode)=>sum+episode.ticks,0),
    targetEpisodeTicks:distribution(targeted.map(episode=>episode.ticks)),zeroIntakeEpisodeTicks:distribution(zeroIntake.map(episode=>episode.ticks)),
    zeroIntakeEpisodeApproach:distribution(zeroIntake.map(episode=>episode.netApproach)),deepInteriorEpisodeTicks:distribution(deep.map(episode=>episode.ticks))};
}
