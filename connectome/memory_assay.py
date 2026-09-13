"""Measure process peak RSS while allocating actual full-connectome controllers."""
import gc
import hashlib
import json
import resource
import sys

from arena import Controller, ROOT

def peak_bytes():
    value = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    return int(value if sys.platform == 'darwin' else value * 1024)

result = {'platform': sys.platform, 'start_peak_bytes': peak_bytes()}
first = Controller()
gc.collect()
result['one_brain_peak_bytes'] = peak_bytes()
second = Controller()
gc.collect()
result['two_brain_peak_bytes'] = peak_bytes()
result['neurons_per_brain'] = first.brain.n
result['edges_per_brain'] = len(first.brain.post)
result['arena_sha256'] = hashlib.sha256((ROOT / 'connectome/arena.py').read_bytes()).hexdigest()
result['interpretation'] = (
    'Process peak RSS on this machine, including temporary initialization memory. '
    'It is evidence for hosting assessment, not a portable guarantee.'
)
target = ROOT / 'evidence/malecns-memory-assay.json'
target.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
