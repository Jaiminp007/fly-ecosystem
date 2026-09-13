"""Real full-graph regression, not a stubbed controller test."""
import gc
import json
from pathlib import Path
import tempfile
import numpy as np
from arena import Arena, ROOT
w=Arena(founders=1,capacity=2)
w.flies[0]['x']=120.;w.flies[0]['y']=180.;w.flies[0]['heading']=0.
start_x=w.flies[0]['x']
observed_speeds=[]
for _ in range(20):
    w.step()
    observed_speeds.append(w.flies[0]['neural']['speed'])
assert max(observed_speeds)>0, 'LC9 to DNp09 path never produced forward speed'
assert w.flies[0]['x']!=start_x, 'Full-connectome motor output did not move the body'
with tempfile.TemporaryDirectory() as temp:
    checkpoint=w.save(temp)
    metadata=json.loads((checkpoint/'world.json').read_text())
    metadata['model']='afterwing-malecns-arena-v2'
    (checkpoint/'world.json').write_text(json.dumps(metadata))
    w.step()
    expected=w.state()
    expected_v=w.controllers[1].brain.v.copy()
    del w;gc.collect()
    restored=Arena.restore(checkpoint)
    assert any('Migrated afterwing-malecns-arena-v2' in event for event in restored.events)
    restored.step()
    actual=restored.state()
    for state in [actual,expected]:
        for fly in state['flies']: fly['neural'].pop('kernel_seconds',None)
    assert actual['flies']==expected['flies'], 'Continuation differs'
    np.testing.assert_array_equal(restored.controllers[1].brain.v, expected_v)
    b=restored.controllers[1].brain
    before=b.v.copy()
    child=restored.add([1,1],1,0,200,200,{'visual_gain':1.1,'motor_gain':.9,'plastic_gain':1.05})
    cb=restored.controllers[child['id']].brain
    assert not np.shares_memory(b.v,cb.v) and not np.shares_memory(b.weight,cb.weight)
    assert np.array_equal(b.ids,cb.ids) and np.array_equal(b.post,cb.post)
    cb.v[0]+=1
    np.testing.assert_array_equal(b.v,before)
    result={'model':expected['model'],'checkpoint_continuation_exact':True,
            'independent_neural_state':True,'offspring_full_topology_equal':True,
            'lc9_to_dnp09_forward_motion':True,
            'v2_checkpoint_migration':True,
            'offspring_test':'Forced construction for isolation test, not spontaneous reproduction',
            'neurons':b.n,'edges':len(b.post),'observed_action':expected['flies'][0]['neural']}
    (ROOT/'evidence/malecns-integration.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))
