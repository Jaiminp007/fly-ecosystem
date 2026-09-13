// Explicit artificial environment schedule. No RNG or fitness-dependent rescue.
export const CHALLENGE_PHASES=[
 {name:'First Light',description:'Food renews normally. A recovery interval between pressures.'},
 {name:'The Drift',description:'A moving fertility band changes where food renews fastest.'},
 {name:'Lean Season',description:'Food renewal falls to 65% of the habitat setting.'},
 {name:'The Squall',description:'A moving stress zone costs energy. Nearby danger is visible to wall sensors.'}
];
export function challengeAt(config,tick){
 if(!config.challenges||config.challenges==='off')return null;
 const elapsed=Math.max(0,tick-(config.challengeStartTick||0))*.1,duration=180,index=Math.floor(elapsed/duration)%4,cycle=Math.floor(elapsed/(duration*4))+1;
 const moving={x:500+300*Math.sin(elapsed/70),y:320+160*Math.cos(elapsed/95)};
 return {...CHALLENGE_PHASES[index],index,cycle,elapsed,remaining:duration-elapsed%duration,duration,renewal:index===2?.65:1,bloom:index===1?{...moving,r:210}:null,hazard:index===3?{...moving,r:100,costPerSecond:.35}:null};
}
export function fertility(challenge,p){return challenge?.bloom?.r ? .45+1.55*Math.exp(-((p.x-challenge.bloom.x)**2+(p.y-challenge.bloom.y)**2)/(challenge.bloom.r**2)):challenge?.renewal??1;}
export function stress(challenge,f){const h=challenge?.hazard;return h&&Math.hypot(f.x-h.x,f.y-h.y)<h.r?h.costPerSecond:0;}
