import http from 'node:http';
import {timingSafeEqual} from 'node:crypto';
import {CheckpointStore} from './persistence.mjs';
import {telemetry} from './telemetry.mjs';
import {readFile,writeFile,rename,mkdir,readdir} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {World,DT} from './engine.mjs';
const ROOT=dirname(fileURLToPath(import.meta.url)),RUNS=resolve(process.env.RUNS_DIR||join(ROOT,'runs'));
const hosted=process.env.HOST==='0.0.0.0',demo=process.env.DEMO_MODE==='true';
const token=process.env.ADMIN_TOKEN||'';
if(hosted&&token&&token.length<32)throw Error('ADMIN_TOKEN must contain at least 32 characters');
const store=new CheckpointStore(RUNS);await store.init();
let world=new World(),paused=true,speed=1,actualSpeed=0,lastError=null;
// Invalid recovery fails startup before any write; never replace it with founders.
const recovered=await store.recover();
if(recovered){world=World.restore(recovered);paused=recovered.server?.paused!==false;speed=recovered.server?.speed||1;}
else if(process.env.AUTO_START==='true'){paused=false;speed=5;}
let savedAt=null,lastWall=performance.now(),owed=0,windowStart=performance.now(),windowTicks=0;
const checkpoint=()=>({...world.checkpoint(),server:{paused,speed,savedAt:new Date().toISOString()}});
const atomic=(name,value)=>store.save(name,value);
async function autosave(){try{await atomic('autosave.json',checkpoint());savedAt=new Date().toISOString();}catch(e){lastError=e.message;paused=true;throw e;}}
let lastRollingTick=world.tick,terminalSaved=world.flies.length===0;
async function periodic(){try{await autosave();if(world.tick-lastRollingTick>=3000){await store.rolling(checkpoint());lastRollingTick=world.tick;}if(!world.flies.length&&!terminalSaved){await atomic(`terminal-${Date.now()}-tick-${world.tick}.json`,checkpoint());terminalSaved=true;}}catch(e){lastError=e.message;paused=true;}}
setInterval(()=>{const now=performance.now(),elapsed=Math.min((now-lastWall)/1000,.25);lastWall=now;
  if(!paused){owed=speed==='max'?1e9:Math.min(owed+elapsed*speed/DT,10000);const end=performance.now()+14;while(owed>=1&&performance.now()<end){if(!world.step()){paused=true;break;}owed--;windowTicks++;}}
  else owed=0;
  if(now-windowStart>=1000){actualSpeed=windowTicks*DT/((now-windowStart)/1000);windowTicks=0;windowStart=now;}
},20);
setInterval(periodic,15000).unref();
const state=()=>({...world.snapshot(),telemetry:telemetry(world),runtime:{paused,speed,actualSpeed,savedAt,lastError,hosted,demo,readOnly:hosted,backend:'compact',fullConnectome:'Not active: use the separate connectome assay; this world uses compact artificial brains.'}});
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
const PORT=Number(process.env.PORT||8765);
const server=http.createServer(async(req,res)=>{try{
  // Local-only writes: reject cross-origin browser requests and DNS rebinding hosts.
  if(!hosted&&![`127.0.0.1:${PORT}`,`localhost:${PORT}`].includes(req.headers.host)){json(res,403,{error:'Local host required'});return;}
  const url=new URL(req.url,`http://127.0.0.1:${PORT}`);
  if(req.method==='GET'&&url.pathname==='/healthz')return json(res,lastError?503:200,{ok:!lastError,worldStatus:world.metrics().status});
  if(req.method==='GET'&&url.pathname==='/api/state')return json(res,200,state());
  if(req.method==='GET'&&url.pathname==='/api/agent')return json(res,200,world.inspect(Number(url.searchParams.get('id'))));
  if(req.method==='GET'&&url.pathname==='/api/checkpoint'){res.setHeader('Content-Disposition','attachment; filename="fly-world.json"');return json(res,200,checkpoint());}
  if(req.method==='GET'&&url.pathname==='/api/saves')return json(res,200,await store.list());
  if(req.method==='POST'){
    if(hosted){const supplied=req.headers.authorization?.replace(/^Bearer /,'')||'';const a=Buffer.from(supplied),b=Buffer.from(token);if(!token||a.length!==b.length||!timingSafeEqual(a,b))return json(res,401,{error:'Owner authorization required'});}

    if(req.headers.origin&&!(hosted?req.headers.origin===`https://${req.headers.host}`:[`http://127.0.0.1:${PORT}`,`http://localhost:${PORT}`].includes(req.headers.origin)))return json(res,403,{error:'Same-origin requests only'});
    if(req.headers['content-type']!=='application/json')return json(res,415,{error:'JSON required'});
    let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>25_000_000){json(res,413,{error:'Checkpoint too large'});req.destroy();return;}}
    const data=JSON.parse(raw||'{}');
    if(url.pathname==='/api/control'){
      if(data.action==='pause'){paused=true;}
      else if(data.action==='run'){if(!world.flies.length||world.capacityReached)throw new Error('World stopped: create a new world or increase capacity');paused=false;}
      else if(data.action==='speed'){if(![1,5,20,100,'max'].includes(data.value))throw new Error('Invalid speed');speed=data.value;}
      else if(data.action==='step'){paused=true;world.advance(10);}
      else if(data.action==='save'){const name=`checkpoint-${Date.now()}-tick-${world.tick}.json`;await atomic(name,checkpoint());world.record('checkpoint',`Saved at tick ${world.tick}`);return json(res,200,{name});}
      else if(data.action==='load'){const candidate=World.restore(await store.load(data.name));await atomic(`checkpoint-${Date.now()}-tick-${world.tick}.json`,checkpoint());world=candidate;paused=true;lastRollingTick=world.tick;terminalSaved=false;}
      else if(data.action==='import'){const candidate=World.restore(data.checkpoint);await atomic(`checkpoint-${Date.now()}-tick-${world.tick}.json`,checkpoint());world=candidate;paused=true;lastRollingTick=world.tick;terminalSaved=false;}
      else if(data.action==='reset'){const next=new World(data.config||{});await atomic(`checkpoint-${Date.now()}-tick-${world.tick}.json`,checkpoint());world=next;paused=true;lastRollingTick=world.tick;terminalSaved=false;}
      else if(data.action==='environment'){
        if(!Number.isFinite(data.nutrient)||data.nutrient<0||data.nutrient>5)throw new Error('Invalid nutrient level');world.config.nutrient=data.nutrient;world.record('intervention',`Resource renewal changed to ${data.nutrient}×`);
      }else if(data.action==='capacity'){
        if(!Number.isInteger(data.value)||data.value<world.flies.length||data.value>2000)throw new Error('Capacity must fit the population and be at most 2000');world.config.capacity=data.value;world.capacityReached=false;world.record('intervention',`Capacity changed to ${data.value}`);
      }else throw new Error('Unknown action');
      await autosave();return json(res,200,state());
    }
  }
  if(req.method!=='GET')return json(res,404,{error:'Unknown route'});
  const routes={'/':'index.html','/app.js':'app.js','/style.css':'style.css'};
  const file=routes[url.pathname];if(!file)return json(res,404,{error:'Not found'});
  const body=await readFile(join(ROOT,'dist',file));res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(body);
}catch(e){json(res,400,{error:e.message});}});
server.listen(PORT,hosted?'0.0.0.0':'127.0.0.1',()=>console.log(`Fly ecosystem: http://127.0.0.1:${PORT}`));
async function stop(){const saved=checkpoint();paused=true;try{await atomic('autosave.json',saved);server.close(()=>process.exit(0));}catch(e){console.error(e.message);process.exit(1);}}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
