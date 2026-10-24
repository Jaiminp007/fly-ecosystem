import {readdir,readFile,writeFile} from 'node:fs/promises';
const root='evidence/autonomous-learning',rows=[];
for(const item of await readdir(root,{withFileTypes:true})){if(!item.isDirectory())continue;try{const report=JSON.parse(await readFile(`${root}/${item.name}/results.json`,'utf8'));rows.push(report);}catch(error){if(error.code!=='ENOENT')throw error;}}
rows.sort((a,b)=>a.startedAt.localeCompare(b.startedAt));
let text='# Autonomous cue-learning campaigns\n\nEvery completed campaign, including failures, is listed below. The models use engineered sensory traces; these are task-learning and bounded parameter-search results, not RSI or ecological transfer evidence.\n\n| Campaign | Status | Rounds | Promotions | Long-memory held-out accuracy |\n| --- | --- | ---: | ---: | --- |\n';
for(const report of rows){const hard=report.heldout?.find(result=>result.stage==='long-memory');text+=`| [${report.id}](${report.id}/results.json) | ${report.status}${report.error?` (${report.error})`:''} | ${report.round} | ${report.promotions} | ${hard?`${(hard.summary.learned.mean*100).toFixed(1)}% [${hard.summary.learned.ci95.map(x=>(x*100).toFixed(1)).join(', ')}]`:'Not evaluated'} |\n`;}
const current=JSON.parse(await readFile('runs/autonomy/state.json','utf8'));
text+=`\nCurrent campaign: ${current.id}; source hashes, protocol, each seed, reset controls, and all proposals are in its report and round files. Earlier-task regression checks retrain on earlier tasks and do not establish continuous retention of previously acquired skills.\n`;
await writeFile(`${root}/summary.md`,text);console.log(JSON.stringify(rows.map(report=>({id:report.id,status:report.status,round:report.round,promotions:report.promotions})),null,2));
