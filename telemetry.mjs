// Observations only: no RNG draws or changes to model behavior.
export function telemetry(world){
 const sexes=[0,1].map(sex=>{const flies=world.flies.filter(f=>f.sex===sex);return {sex,population:flies.length,eligible:flies.filter(f=>f.age>=f.genome.traits.maturity&&f.energy>=65&&f.cooldown<=0).length,meanEnergy:flies.reduce((s,f)=>s+f.energy,0)/Math.max(1,flies.length)};});
 const recentDeaths={energy:0,age:0};for(const e of world.events)if(e.kind==='death'){if(e.text.endsWith('energy depleted'))recentDeaths.energy++;if(e.text.endsWith('lifespan reached'))recentDeaths.age++;}
 return {sexes,recentDeaths,deathWindow:'Retained event window; not lifetime totals',deepestEver:world.lineage.reduce((m,l)=>Math.max(m,l.generation),0),reproductiveBottleneck:world.flies.length>0&&sexes.some(s=>!s.population),eligibilityNote:'Age, energy and cooldown only; proximity and neural mating output still required.'};
}
