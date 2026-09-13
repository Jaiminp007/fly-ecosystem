"""MaleCNS arena: full anatomical graph per individual, engineered embodiment.

No compact controller fallback. Dynamics come from the pinned Stonkfly kernel.
This is an integration experiment, not a validated biological organism.
"""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import random
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
os.environ.setdefault('STONKFLY_DATA', str(ROOT / 'data/malecns-v1'))
sys.path.insert(0, str(ROOT / 'vendor'))
import numpy as np
from stonkfly.neural.brain import MemoryBrain
from stonkfly.neural.common import DATA, annotations

MODEL = 'afterwing-malecns-arena-v4'
MIGRATABLE_MODELS = {'afterwing-malecns-arena-v2', 'afterwing-malecns-arena-v3'}
DT = .1
MATING_ENERGY = 60.

def angle(v):
    return (v + math.pi) % (2 * math.pi) - math.pi

class Controller:
    def __init__(self, alleles=None):
        self.brain = MemoryBrain()
        a = annotations(self.brain.ids)
        self.groups = {f'{kind}_{side}': np.flatnonzero(a.type.eq(kind) & a.somaSide.eq(side))
                       for kind in ['LC9', 'DNa02', 'DNp09', 'MN9'] for side in ['L', 'R']}
        if any(not len(v) for v in self.groups.values()):
            raise ValueError('Required annotated motor readout absent')
        self.alleles = alleles or {'visual_gain': 1., 'motor_gain': 1., 'plastic_gain': 1.}
        self.brain.baseline_plastic *= self.alleles['plastic_gain']
        self.brain.weight[self.brain.circuit['edges']] = self.brain.baseline_plastic
        self.audit = {'neurons': self.brain.n, 'edges': len(self.brain.post),
                      'readout_source_ids': {k: self.brain.ids[v].tolist() for k,v in self.groups.items()}}

    def step(self, fly, food, learning=True):
        b = self.brain
        # Explicit angular panorama projected onto upstream inferred retina UV.
        bearings = (b.uv[:, 0] - .5) * math.pi * 2
        light = np.full(len(b.retina), .015, dtype=np.float32)
        contact = False
        target = None
        for p in food:
            if p['amount'] <= .01:
                continue
            dx, dy = p['x']-fly['x'], p['y']-fly['y']
            dist = math.hypot(dx,dy)
            bearing = angle(math.atan2(dy,dx)-fly['heading'])
            if target is None or dist < target[0]:
                target = (dist, bearing)
            delta = (bearings-bearing+math.pi) % (2*math.pi)-math.pi
            light += np.exp(-delta**2/.025).astype(np.float32) * min(1.,p['amount']/5) / (1+dist/80)
            contact |= dist < 15
        pulses = []
        sensory_drive = {'LC9_L': 0., 'LC9_R': 0., 'sugar': 20. if contact else 0.}
        if target is not None:
            # The connectome does not include a calibrated retina-to-behaviour model.
            # LC9 is an annotated visual projection population upstream of DNp09.
            # This explicit object-detector adapter preserves the full graph between
            # visual input and descending motor output; it is not a movement fallback.
            dist, bearing = target
            salience = math.exp(-dist / 350.)
            lateral = math.sin(bearing)
            # In arena coordinates a positive bearing is a clockwise/rightward
            # target. DNp09 activation drives an ipsilateral forward turn, so
            # the right LC9 population receives the stronger rightward cue.
            gain = self.alleles['visual_gain']
            sensory_drive['LC9_L'] = 40. * gain * salience * (.75 - .25 * lateral)
            sensory_drive['LC9_R'] = 40. * gain * salience * (.75 + .25 * lateral)
            pulses.extend((self.groups[k], sensory_drive[k]) for k in ['LC9_L', 'LC9_R'])
        if contact:
            pulses.append((b.sugar, sensory_drive['sugar']))
        counts, wall = b.step(np.clip(light*self.alleles['visual_gain'],0,1), DT*1000,
                             learning=learning, stimulation=pulses or None)
        hz = {k: float(counts[v].mean()/DT) for k,v in self.groups.items() if not k.startswith('LC9_')}
        forward_hz = hz['DNp09_L'] + hz['DNp09_R']
        # DNp09 is the calibrated target-pursuit interface used here: bilateral
        # activity supplies forward drive and its right-left difference supplies
        # the ipsilateral turn. DNa02 remains reported for later steering assays
        # but is not mixed into this decoder because the approximate dynamics can
        # produce a conflicting transient response to the same LC9 stimulus.
        turn_hz = hz['DNp09_R'] - hz['DNp09_L']
        turn = math.tanh(turn_hz/30) * self.alleles['motor_gain']
        speed = 35 * math.tanh(forward_hz/50) * self.alleles['motor_gain']
        eat = hz['MN9_L']+hz['MN9_R'] > 0
        if not np.isfinite(b.v).all() or not np.isfinite(b.g).all():
            raise FloatingPointError('Nonfinite neural state')
        return {'turn':turn,'speed':speed,'eat':eat,'spikes':int(counts.sum()),
                'active_neurons':int(np.count_nonzero(counts)),'readout_hz':hz,
                'sensory_drive':sensory_drive,'kernel_seconds':wall}

class Arena:
    def __init__(self, founders=2, capacity=4, seed=42):
        if not 1 <= founders <= capacity <= 16:
            raise ValueError('Require 1 <= founders <= capacity <= 16 (operational population ceiling)')
        self.rng = random.Random(seed)
        self.capacity = capacity
        self.tick = 0
        self.next_id = 1
        self.births = self.deaths = 0
        self.flies = []
        self.controllers = {}
        self.events = []
        self.paused = True
        self.error = None
        self.wall_seconds = 0.
        self.food = [{'x':x,'y':y,'amount':5.} for x,y in [(180,180),(350,250),(600,370),(800,450)]]
        self.lineage = []
        for i in range(founders):
            self.add([], 0, i % 2, 160+i*20, 180)

    def add(self, parents, generation, sex, x, y, alleles=None):
        # Allocation succeeds before the world accepts a birth; failure pauses rather than replacing the brain.
        controller = Controller(alleles)
        f = {'id':self.next_id,'parents':parents,'generation':generation,'sex':sex,
             'x':x,'y':y,'heading':self.rng.uniform(-math.pi,math.pi), 'age':0.,
             'energy':65. if not parents else 48.,'cooldown':0.,'alleles':controller.alleles,
             'neural':{'spikes':0,'active_neurons':0,'readout_hz':{}}}
        self.controllers[f['id']] = controller
        self.flies.append(f)
        self.lineage.append({'id':f['id'],'parents':parents,'generation':generation,'born':self.tick,'died':None})
        self.next_id += 1
        return f

    def step(self):
        if not self.flies:
            self.paused = True
            return
        start = time.perf_counter()
        # All actions are actual full-connectome output. No food-seeking fallback.
        actions = {f['id']:self.controllers[f['id']].step(f,self.food) for f in self.flies}
        self.tick += 1
        phase = ['First Light','The Drift','Lean Season','The Squall'][(self.tick//1800)%4]
        for i,p in enumerate(self.food):
            p['amount'] = min(5.,p['amount']+DT*(.03 if phase=='Lean Season' else .1))
            if phase=='The Drift':
                p['x'] = min(980,max(20,p['x']+math.sin(self.tick*.001+i)*DT*2))
        for f in self.flies:
            a = actions[f['id']]
            f['neural'] = a
            f['heading'] = angle(f['heading']+a['turn']*DT*2.8)
            f['x'] = min(994,max(6,f['x']+math.cos(f['heading'])*a['speed']*DT))
            f['y'] = min(634,max(6,f['y']+math.sin(f['heading'])*a['speed']*DT))
            # Engineered body costs; not scaled from compact-neuron count.
            cost = .08 + a['speed']*.004
            if phase=='The Squall' and math.hypot(f['x']-500,f['y']-320)<120:
                cost += .35
            f['energy'] -= DT*cost
            f['age'] += DT
            f['cooldown'] = max(0,f['cooldown']-DT)
            if a['eat']:
                for p in self.food:
                    if math.hypot(f['x']-p['x'],f['y']-p['y'])<15:
                        take = min(p['amount'],max(0,120-f['energy']),.8)
                        p['amount'] -= take
                        f['energy'] += take
        dead = [f for f in self.flies if f['energy']<=0 or f['age']>=300]
        for f in dead:
            self.deaths += 1
            self.lineage[f['id']-1]['died'] = self.tick
            del self.controllers[f['id']]
            self.flies.remove(f)
        # Reproduction is an explicit body rule, not inferred neural courtship.
        for f in list(self.flies):
            if f['sex']!=0 or f['age']<30 or f['energy']<MATING_ENERGY or f['cooldown']:
                continue
            mate = next((m for m in self.flies if m['sex']==1 and m['age']>=30 and m['energy']>=MATING_ENERGY
                         and not m['cooldown'] and math.hypot(f['x']-m['x'],f['y']-m['y'])<26),None)
            if mate is None:
                continue
            if len(self.flies)>=self.capacity:
                self.paused=True
                self.events.append('Population capacity reached; paused without discarding a birth.')
                break
            alleles = {k:min(2.,max(.5,self.rng.choice([f['alleles'][k],mate['alleles'][k]])
                                     * math.exp(self.rng.gauss(0,.02)))) for k in f['alleles']}
            self.add([f['id'],mate['id']],max(f['generation'],mate['generation'])+1,
                     self.rng.randrange(2),(f['x']+mate['x'])/2,(f['y']+mate['y'])/2,alleles)
            f['energy']-=24;mate['energy']-=24
            f['cooldown']=mate['cooldown']=12.
            self.births+=1
        if not self.flies:
            self.paused=True
            self.events.append('Extinct. No replacement population.')
        self.wall_seconds += time.perf_counter()-start

    def state(self):
        return {'model':MODEL,'dataset':'MaleCNS v1.0','tick':self.tick,'seconds':self.tick*DT,
                'paused':self.paused,'error':self.error,'population':len(self.flies),
                'births':self.births,'deaths':self.deaths,'capacity':self.capacity,
                'mating_energy':MATING_ENERGY,
                'phase':['First Light','The Drift','Lean Season','The Squall'][(self.tick//1800)%4],
                'simulated_per_wall':self.tick*DT/self.wall_seconds if self.wall_seconds else 0,
                'flies':self.flies,'food':self.food,'lineage':self.lineage,'events':self.events[-20:],
                'brains':{str(k):v.audit for k,v in self.controllers.items()},
                'assumptions':['Full MaleCNS graph with approximate spiking dynamics',
                    'Engineered retinal panorama plus LC9 object detector, motor readouts and body physics',
                    'Both reproductive roles use the same male anatomical template',
                    'Offspring inherit three gain alleles; acquired neural memory is not inherited',
                    'Anatomical topology is fixed in this integration; no structural evolution yet',
                    'No demonstrated learning benefit or biological validation']}

    def save(self, directory):
        root=Path(directory);root.mkdir(parents=True,exist_ok=True)
        target=root/f'tick-{self.tick}-{time.time_ns()}'
        target.mkdir()
        for k,c in self.controllers.items():
            c.brain.checkpoint(target/f'brain-{k}.npz')
        data={'model':MODEL,'state':self.state(),'next_id':self.next_id,'rng':self.rng.getstate(),
              'wall_seconds':self.wall_seconds}
        (target/'world.json').write_text(json.dumps(data,allow_nan=False))
        # Pointer commits only after every brain is durable and complete.
        pointer=root/'latest.partial';pointer.write_text(target.name);pointer.replace(root/'latest')
        return target

    @classmethod
    def restore(cls, target):
        target=Path(target);data=json.loads((target/'world.json').read_text())
        if data['model'] != MODEL and data['model'] not in MIGRATABLE_MODELS:
            raise ValueError('Not a compatible MaleCNS arena checkpoint; compact checkpoints cannot be migrated')
        s=data['state'];w=object.__new__(cls)
        w.rng=random.Random()
        def tuples(x):return tuple(tuples(v) for v in x) if isinstance(x,list) else x
        w.rng.setstate(tuples(data['rng']))
        w.next_id=data['next_id'];w.tick=s['tick'];w.capacity=s['capacity']
        w.births=s['births'];w.deaths=s['deaths'];w.flies=s['flies'];w.food=s['food']
        w.lineage=s['lineage'];w.events=s['events'];w.paused=True;w.error=None
        if data['model'] != MODEL:
            w.events.append(f"Migrated {data['model']} to {MODEL}; neural state retained, mating energy changed to {MATING_ENERGY}.")
        w.wall_seconds=data['wall_seconds'];w.controllers={}
        for f in w.flies:
            c=Controller(f['alleles']);c.brain.restore(target/f"brain-{f['id']}.npz")
            w.controllers[f['id']]=c
        return w
