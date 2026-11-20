// P1 of the 2026-11-14 review (plan: docs/P1_SKILL_MATTERS_PLAN.md).
// Does taste skill change energy and survival? Codes: bias-only, identity, correct.
// Usage: node scripts/p1-skill-matters.mjs <out.json> <factorial|confirm> [settingJSON]
import {writeFileSync,existsSync,readFileSync} from 'node:fs';
import {Pool,makeHistories} from '../learning/taste-program-eval.mjs';

const [out,MODE,settingArg]=process.argv.slice(2);
const pool=new Pool(4),mean=v=>v.reduce((a,b)=>a+b,0)/v.length,t0=performance.now();
const say=x=>console.log(JSON.stringify({t:Math.round((performance.now()-t0)/1000),...x}));
// Balanced rules only (every family can hold both classes): single Walsh terms and 2-bit AND/OR.
const single=(name,mask,sign)=>({name,rule:{mask,sign},correct:[0,mask]});
const gate=(kind,[a,b],sign)=>({name:`${kind}(${a},${b})${sign>0?'+':'-'}`,rule:{terms:[[1<<a,1],[1<<b,1]],bias:(kind==='AND'?-1:1)*1.5,sign},correct:[0,1<<a,1<<b,(1<<a)|(1<<b)]});
const RULES={factorial:[single('s3+',3,1),gate('AND',[0,1],-1),gate('OR',[2,3],1),single('s12-',12,-1)],
  confirm:[single('s5-',5,-1),gate('AND',[1,3],1),gate('OR',[0,2],-1),single('s10+',10,1)]}[MODE];
const BANK={factorial:992001,confirm:993001}[MODE],PER_RULE=4;
const codes=r=>({bias:[0],identity:[...Array(16).keys()],correct:r.correct});
const SETTINGS=MODE==='factorial'?[null,'threshold'].flatMap(d=>[1,3].flatMap(tox=>[1,.5].map(nut=>({decision:d,toxinScale:tox,nutrientScale:nut}))))
  :[JSON.parse(settingArg)];
const ckptPath=out+'.ckpt.json',ckpt=existsSync(ckptPath)?JSON.parse(readFileSync(ckptPath,'utf8')):{};
const rows=[];
for(const s of SETTINGS){
  const key=JSON.stringify(s);
  if(!ckpt[key]){
    const jobs=[];
    for(const [ri,r] of RULES.entries()){const hs=makeHistories(BANK+ri,PER_RULE);
      for(const [hi,h] of hs.entries())for(const [cname,masks] of Object.entries(codes(r)))
        jobs.push(pool.run({code:'masks',masks,step:4,replays:1},h,{valenceRule:r.rule,toxinScale:s.toxinScale,nutrientScale:s.nutrientScale,...(s.decision?{tasteDecisionMode:s.decision}:{})})
          .then(x=>({rule:r.name,history:hi,code:cname,survivors:x.survivors,energy:x.energy,discrimination:x.discrimination})));}
    ckpt[key]=await Promise.all(jobs);writeFileSync(ckptPath,JSON.stringify(ckpt));
  }
  const R=ckpt[key],by=c=>R.filter(x=>x.code===c),C=by('correct'),B=by('bias'),I=by('identity');
  const sign=(a,b,f)=>{let w=0,l=0;a.forEach((x,i)=>{const d=x[f]-b[i][f];if(d>1e-9)w++;else if(d<-1e-9)l++;});let p=0;const n=w+l,c=(n,k)=>{let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return r;};for(let k=w;k<=n;k++)p+=c(n,k)/2**n;return {wins:w,losses:l,p:n?p:1};};
  const row={setting:s,means:Object.fromEntries(['bias','identity','correct'].map(c=>[c,{survivors:mean(by(c).map(x=>x.survivors)),energy:mean(by(c).map(x=>x.energy)),discrimination:mean(by(c).map(x=>x.discrimination))}])),
    correctVsBias:{survivors:sign(C,B,'survivors'),energy:sign(C,B,'energy')},identityVsBias:{survivors:sign(I,B,'survivors'),energy:sign(I,B,'energy')}};
  rows.push(row);say(row);
}
writeFileSync(out,JSON.stringify({schema:1,kind:'p1-skill-matters',plan:'docs/P1_SKILL_MATTERS_PLAN.md',mode:MODE,bank:BANK,rules:RULES,rows,raw:ckpt,seconds:(performance.now()-t0)/1000},null,2)+'\n');
pool.close();
