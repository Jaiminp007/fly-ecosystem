import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createGunzip,gunzipSync} from 'node:zlib';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/steering-projection-development/20261026-v1'),base=join(root,'evidence/steering-projection-drift/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),close=(first,second)=>assert.ok(Math.abs(first-second)<1e-9+1e-10*Math.max(Math.abs(first),Math.abs(second)));
const protocol=read(join(base,'protocol.json')),original=read(join(source,'protocol.json'));assert.equal(hash(readFileSync(join(source,'protocol.json'))),protocol.sourceProtocol);
for(const [path,digest]of Object.entries(protocol.files))assert.equal(hash(readFileSync(join(root,path))),digest);
let decisions=0,available=0;const rows=[];
for(const history of original.histories){
  const row=read(join(base,history.seed+'.json')),inputBytes=readFileSync(join(source,'rows',history.seed+'.json')),input=JSON.parse(inputBytes);assert.equal(hash(inputBytes),row.rowSha256);
  for(const arm of original.arms){
    const saved=row.arms[arm],anchors={};for(const phase of ['B','C','D']){const bytes=readFileSync(join(source,'anchors',history.seed+'-'+arm+'-'+phase+'.json.gz'));assert.equal(hash(bytes),saved.anchorHashes[phase]);anchors[phase]=JSON.parse(gunzipSync(bytes).toString());}
    const label=history.seed+'-'+arm+'-probe-transfer-current',digest=createHash('sha256'),stream=createReadStream(join(source,'traces',label+'.jsonl.gz')).pipe(createGunzip());stream.on('data',chunk=>digest.update(chunk));
    let events=0,localDecisions=0,localAvailable=0;const sums={CB:0,DC:0,DB:0},disagreements={CB:0,DC:0,DB:0};
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);events++;if(event.type!=='decision')continue;localDecisions++;assert.deepEqual(event.own.cue,[0,0,0,0]);const prediction={};
      for(const phase of ['B','C','D']){const model=anchors[phase].state.learners[event.id].steering;prediction[phase]=[0,0];for(let action=0;action<2;action++)for(let index=0;index<8;index++)prediction[phase][action]+=(model.weights[action][index]+model.contextWeights[0][action][index])*event.features[index];}
      close(prediction.D[0],event.steering.predictions[0]);close(prediction.D[1],event.steering.predictions[1]);if(!event.available)continue;localAvailable++;
      for(const key of ['CB','DC','DB']){const first=prediction[key[0]],second=prediction[key[1]];sums[key]+=Math.abs((first[1]-first[0])-(second[1]-second[0]));if((first[1]>first[0])!==(second[1]>second[0]))disagreements[key]++;}
    }
    assert.equal(digest.digest('hex'),saved.traceSha256);assert.equal(saved.traceSha256,input.traces[label].sha256);assert.equal(events,input.traces[label].events);assert.equal(localDecisions,saved.decisions);assert.equal(localAvailable,saved.available);
    for(const key of ['CB','DC','DB']){close(sums[key],saved.comparisons[key].absoluteAdvantage);assert.equal(disagreements[key],saved.comparisons[key].disagreements);close(sums[key]/localAvailable,saved.comparisons[key].meanAbsoluteAdvantage);close(disagreements[key]/localAvailable,saved.comparisons[key].disagreementRate);}
    const current=input.arms[arm].probes['transfer-current'].endpoint;for(const mode of ['reset','native-full']){const other=input.arms[arm].probes['transfer-'+mode].endpoint,entry=saved.resource[mode];close(entry.energy,current.budgetAdjustedEnergyPerFounder-other.budgetAdjustedEnergyPerFounder);close(entry.intake,(current.statistics.transfer.intake-other.statistics.transfer.intake)/current.founders);close(entry.cost,(current.statistics.transfer.cost-other.statistics.transfer.cost)/current.founders);assert.equal(entry.survivors,current.survivors-other.survivors);}
    decisions+=localDecisions;available+=localAvailable;
  }rows.push(row);
}
const result=read(join(base,'results.json'));for(const arm of original.arms){for(const key of ['CB','DC','DB'])for(const metric of ['meanAbsoluteAdvantage','meanDisagreementRate']){const name=metric==='meanDisagreementRate'?'disagreementRate':metric;close(result.arms[arm].comparisons[key][metric],rows.reduce((sum,row)=>sum+row.arms[arm].comparisons[key][name],0)/rows.length);}
  for(const mode of ['reset','native-full'])for(const metric of ['energy','intake','cost','survivors'])close(result.arms[arm].resource[mode][metric],rows.reduce((sum,row)=>sum+row.arms[arm].resource[mode][metric],0)/rows.length);}
const report={schema:1,passed:true,histories:rows.length,decisions,available,checkerSha256:hash(readFileSync(fileURLToPath(import.meta.url))),scope:'Independent frozen-policy arithmetic, trace hashes and endpoint summaries; not independent physical dynamics or counterfactual outcomes.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
