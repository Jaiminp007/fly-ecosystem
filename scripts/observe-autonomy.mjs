import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base=process.env.PLATFORM_BASE_URL||'http://127.0.0.1:8767';
const directory=new URL('../evidence/autonomy-baseline/',import.meta.url);
await mkdir(directory,{recursive:true});
const request=async(path,data)=>{const response=await fetch(base+path,data===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const body=await response.json();if(!response.ok)throw Error(JSON.stringify(body));return body;};
const report={startedAt:new Date().toISOString(),protocol:{seed:20261023,requestedSpeed:10,targetTicks:7200,wallLimitSeconds:180,sampling:'All living agents in each frame, approximately every 500ms. Motor extremes are |output| > .98. Sampled movement is not a full per-tick path.'},arms:{},samples:[]};
try{
  for(const learning of [true,false]){
    const arm=learning?'learning':'frozen';
    const result=await request('/api/ecosystems',{name:`Autonomy baseline · ${arm}`,config:{seed:report.protocol.seed,founders:24,capacity:240,learning,mutation:true,nutrient:3,seasonal:false,challenges:'cycle',ecology:'baseline',signalMode:'normal'}});
    const id=result.ecosystem.id,checkpoint=await request(`/api/ecosystems/${id}/checkpoint`);
    report.arms[arm]={id,founderSha256:createHash('sha256').update(JSON.stringify(checkpoint.world.flies)).digest('hex'),start:result.metrics,agentSamples:0,feedingSamples:0,actions:Array.from({length:5},()=>({sum:0,extreme:0})),maxAccountingResidual:0};
    await writeFile(new URL(`${arm}-initial.json`,directory),JSON.stringify(checkpoint));
  }
  const founders=Object.values(report.arms).map(arm=>arm.founderSha256);if(founders[0]!==founders[1])throw Error('Founder match failed');
  for(const arm of Object.values(report.arms)){await request(`/api/ecosystems/${arm.id}/control`,{action:'speed',value:10});await request(`/api/ecosystems/${arm.id}/control`,{action:'run'});}
  const started=Date.now();let lastLog=0;
  while(Date.now()-started<report.protocol.wallLimitSeconds*1000){
    let completed=true;
    for(const[label,arm]of Object.entries(report.arms)){
      const frame=await request(`/api/ecosystems/${arm.id}/frame?sinceTick=0&sinceEvent=0`);
      if(!arm.end&& (frame.metrics.tick>=report.protocol.targetTicks||frame.ecosystem.paused||frame.metrics.status!=='running')){
        const paused=await request(`/api/ecosystems/${arm.id}/control`,{action:'pause'});arm.end=paused.metrics;
      }
      if(!arm.end)completed=false;
      for(const agent of frame.flies){arm.agentSamples++;if(agent.lastFood>0)arm.feedingSamples++;for(let i=0;i<5;i++){const value=agent.actions[i]||0;arm.actions[i].sum+=value;if(Math.abs(value)>.98)arm.actions[i].extreme++;}}
      arm.maxAccountingResidual=Math.max(arm.maxAccountingResidual,Math.abs(frame.metrics.accountingError));
      report.samples.push({arm:label,wallSeconds:(Date.now()-started)/1000,...frame.metrics,challenge:frame.challenge?.name,paused:frame.ecosystem.paused});
    }
    if(Date.now()-lastLog>10000){console.log(JSON.stringify(report.samples.slice(-2)));lastLog=Date.now();await writeFile(new URL('progress.json',directory),JSON.stringify(report,null,2));}
    if(completed)break;
    await new Promise(resolve=>setTimeout(resolve,500));
  }
}finally{
  for(const[label,arm]of Object.entries(report.arms)){
    try{const result=await request(`/api/ecosystems/${arm.id}/control`,{action:'pause'});arm.end=result.metrics;arm.meanActions=arm.actions.map(action=>action.sum/Math.max(1,arm.agentSamples));arm.extremeFractions=arm.actions.map(action=>action.extreme/Math.max(1,arm.agentSamples));arm.feedingFraction=arm.feedingSamples/Math.max(1,arm.agentSamples);await writeFile(new URL(`${label}-final.json`,directory),JSON.stringify(await request(`/api/ecosystems/${arm.id}/checkpoint`)));}catch(error){arm.error=error.message;}
  }
  report.finishedAt=new Date().toISOString();await writeFile(new URL('results.json',directory),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.arms,null,2));
}
