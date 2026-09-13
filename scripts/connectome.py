"""Separate full-connectome assay. Never substituted into the compact ecosystem.

Downloads public MaleCNS data using pinned upstream checksums, retains the upstream
graph, and runs an explicit engineered visual stimulus through its native kernel.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "malecns-v1"
os.environ["STONKFLY_DATA"] = str(DATA)
sys.path.insert(0, str(ROOT / "vendor"))

def sha(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda:f.read(8*1024*1024),b''):h.update(block)
    return h.hexdigest()

def prepare():
    DATA.mkdir(parents=True,exist_ok=True)
    locks=json.loads((ROOT/'vendor/stonkfly/neural/sources.lock.json').read_text())
    for name,entry in locks.items():
        path=DATA/name
        if path.exists() and path.stat().st_size==entry['bytes'] and sha(path)==entry['sha256']:
            print('Verified '+name,flush=True);continue
        print('Downloading '+name,flush=True)
        temp=path.with_suffix('.partial')
        with urllib.request.urlopen(entry['url'],timeout=90) as response,temp.open('wb') as f:
            while True:
                block=response.read(8*1024*1024)
                if not block:break
                f.write(block)
        if temp.stat().st_size!=entry['bytes'] or sha(temp)!=entry['sha256']:
            raise RuntimeError('Source checksum/size mismatch: '+name)
        temp.replace(path)
    (DATA/'source.lock.json').write_text(json.dumps(locks,indent=2))
    from stonkfly.neural.connectome import import_graph
    from stonkfly.neural.prepare import prepare as compile_graph
    import_graph();compile_graph()
    print('Prepared '+str(DATA/'graph.npz'),flush=True)

def assay(duration):
    import numpy as np
    np.seterr(divide='raise',over='raise',invalid='raise')
    from stonkfly.neural.visual import VisualMemoryBrain
    if not (DATA/'graph.npz').exists():raise RuntimeError('Run prepare first')
    start=time.perf_counter();brain=VisualMemoryBrain();load_seconds=time.perf_counter()-start
    # Synthetic white sensory field: explicit calibration input, not natural vision.
    frame=np.full((90,160,3),255,dtype=np.uint8)
    before=brain.weight[brain.circuit['edges']].copy()
    start=time.perf_counter()
    counts,compute=brain.rgb_step(frame,duration,learning=True)
    elapsed=time.perf_counter()-start
    manifest=json.loads((DATA/'manifest.json').read_text())
    if not all(np.isfinite(getattr(brain,k)).all() for k in ['weight','v','g']):raise RuntimeError('Nonfinite neural state')
    result={'mode':'full-connectome-assay','source_commit':'78ef3e05ab0fa086032098558d893667068944a0','numpy_version':np.__version__,'strict_numeric_checks':True,'neurons':brain.n,'edges':len(brain.post),'contacts':manifest['synaptic_contacts'],'neural_ms':duration,'load_seconds':load_seconds,'wall_seconds':elapsed,'kernel_seconds':float(compute),'neural_realtime_factor':duration/1000/elapsed,'total_spikes':int(counts.sum()),'active_neurons':int(np.count_nonzero(counts)),'changed_plastic_edges':int(np.count_nonzero(before!=brain.weight[brain.circuit['edges']])),'assumptions':['Synthetic white RGB field','Upstream approximate neural dynamics and visual mapping','Not connected to the ecosystem','No population reproduction or learned behavior demonstrated']}
    target=ROOT/'evidence'/'connectome-assay.json';target.parent.mkdir(exist_ok=True)
    target.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('command',choices=['prepare','assay']);p.add_argument('--ms',type=float,default=100)
    a=p.parse_args()
    if not 0<a.ms<=1000:raise ValueError('Assay duration must be 0–1000 ms')
    prepare() if a.command=='prepare' else assay(a.ms)
