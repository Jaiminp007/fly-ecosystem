import {compactControllerView} from '/controller-adapter.mjs';

const $ = id => document.getElementById(id);
let selectedId = null;
let selectedAgent = null;
let lastInspectionAt = 0;
let lastListAt = 0;
let ecosystemItems = [];
let trackingAgent = false;
let panMode = false;
let didDrag = false;
let selectedTrail = [];
let inspectorRequest = 0;
const pickers = [];
const syncPickers = () => pickers.forEach(picker => picker.sync());
let state = null;
let polling = false;
let acting = false;
let noticeTimer;
let noticeSource = null;
let forkSource = null;
let revision = 0;
let worldFrame = {from: new Map(), to: new Map(), startedAt: 0, duration: 0};
let lastFrameAt = 0;
let agentOptionKey = '';
let worldAnimating = false;
let throughputSamples = [];
let throughputTarget = null;
let eventsShown = 12;
let eventRowsKey = '';
let comparisonState = null;
let camera = {x: 0, y: 0, zoom: 1};
let cameraDrag = null;
const observerPerformance = {worldDrawMs: 0, brainDrawMs: 0, latestApiJsonBytes: 0};
window.__afterwingPerformance = observerPerformance;
function rememberHabitat(id) { try { localStorage.setItem('afterwing.habitat', id); } catch {} }
function preferredHabitat(items) {
  let remembered; try { remembered = localStorage.getItem('afterwing.habitat'); } catch {}
  return items.find(item => item.id === remembered) ||
    items.find(item => !item.paused && item.metrics.population > 0) ||
    items.find(item => item.metrics.population > 0) || items[0];
}
function playbackLabel() {
  if (state.ecosystem.paused) { throughputSamples = []; observerPerformance.actualSpeed = 0; return 'Paused · use +1s to step'; }
  const now = performance.now(), tick = state.metrics.tick, previous = throughputSamples.at(-1);
  if (throughputTarget !== state.ecosystem.speed || (previous && (tick < previous.tick || now - previous.at > 3000))) throughputSamples = [];
  throughputTarget = state.ecosystem.speed;
  throughputSamples.push({at: now, tick});
  while (throughputSamples.length > 2 && throughputSamples[1].at < now - 5000) throughputSamples.shift();
  const first = throughputSamples[0], elapsed = now - first.at;
  const measured = elapsed >= 1000 ? (tick - first.tick) * 100 / elapsed : null;
  observerPerformance.actualSpeed = measured;
  return `${state.ecosystem.speed}× target${measured === null ? '' : ` · ${measured.toFixed(1)}× measured`}`;
}

async function request(path, data) {
  const response = await fetch(path, data === undefined ? {} : {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data),
  });
  const result = await response.json();
  observerPerformance.latestApiJsonBytes = new TextEncoder().encode(JSON.stringify(result)).byteLength;
  if (!response.ok) throw Error(result.error || `Request failed (${response.status})`);
  return result;
}

function notify(message, error = false, source = 'action') {
  clearTimeout(noticeTimer);
  noticeSource = source;
  $('notice').textContent = message;
  $('notice').hidden = false;
  if (!error) noticeTimer = setTimeout(() => { $('notice').hidden = true; }, 5000);
}

function listEcosystems(items) {
  ecosystemItems = items;
  const list = $('ecosystemList');
  const query = $('habitatSearch').value.trim().toLowerCase();
  const existing = new Map([...list.children].map(button => [button.dataset.id, button]));
  const ids = new Set();
  for (const item of items.filter(item => item.name.toLowerCase().includes(query))) {
    ids.add(item.id);
    let button = existing.get(item.id);
    if (!button) {
      button = document.createElement('button'); button.type = 'button'; button.dataset.id = item.id;
      button.append(document.createElement('strong'), document.createElement('small'));
      button.onclick = () => { $('habitatPicker').open = false; selectEcosystem(item.id); };
      list.append(button);
    }
    button.className = `ecosystem-card${item.id === selectedId ? ' active' : ''}`;
    button.setAttribute('aria-pressed', String(item.id === selectedId));
    button.firstChild.textContent = item.name;
    button.lastChild.textContent = `${item.metrics.population} agents · ${item.paused ? 'Paused' : 'Running'}`;
  }
  for (const button of [...list.children]) if (!ids.has(button.dataset.id)) button.remove();
}

function syncComparisonOptions(items) {
  const select = $('compareHabitat');
  if (!select) return;
  const current = select.value;
  const choices = items.filter(item => item.id !== selectedId);
  const key = JSON.stringify(choices.map(item => [item.id, item.name]));
  if (select.dataset.key === key) return;
  select.replaceChildren(new Option('Choose another habitat', ''), ...choices.map(item => new Option(item.name, item.id)));
  select.value = choices.some(item => item.id === current) ? current : '';
  select.dataset.key = key;
}

async function selectEcosystem(id) {
  revision++;
  selectedId = id;
  selectedAgent = null;
  agentOptionKey = '';
  delete $('settings').dataset.dirty;
  trackingAgent = false;
  selectedTrail = [];
  state = null;
  comparisonState = null;
  $('compareHabitat').value = '';
  $('comparisonReadout').textContent = 'Select a habitat to compare populations and conditions at the same artificial time.';
  camera = {x: 0, y: 0, zoom: 1};
  eventsShown = 12;
  eventRowsKey = '';
  worldFrame = {from: new Map(), to: new Map(), startedAt: 0, duration: 0};
  lastFrameAt = 0;
  throughputSamples = [];
  $('individual').textContent = 'Select an agent to inspect inherited traits and acquired state.';
  $('brain').getContext('2d').clearRect(0, 0, 440, 300);
  $('brainLegend').textContent = '';
  try {
    const result = await request(`/api/ecosystems/${id}`);
    if (selectedId !== id) return;
    state = result;
    rememberHabitat(id);
    selectedAgent = result.flies[0]?.id ?? null;
    render();
    await inspectAgent();
    await refreshCheckpoints(id);
    await refresh();
  } catch (error) { notify(error.message, true); }
}

async function refresh() {
  if (polling || acting) return;
  polling = true;
  try {
    if (!ecosystemItems.length || performance.now() - lastListAt > 1500) {
      ecosystemItems = await request('/api/ecosystems'); lastListAt = performance.now();
      listEcosystems(ecosystemItems);
    }
    const items = ecosystemItems;
    const firstSelection = !selectedId && items.length > 0;
    if (firstSelection) {
      selectedId = preferredHabitat(items).id;
      rememberHabitat(selectedId);
      selectedAgent = null;
    }
    syncComparisonOptions(items);
    const id = selectedId;
    const currentRevision = revision;
    if (id) {
      const full = firstSelection || !state;
      const result = await request(full ? `/api/ecosystems/${id}` :
        `/api/ecosystems/${id}/frame?sinceTick=${state.metrics.tick}&sinceEvent=${state.eventCursor || 0}`);
      if (id === selectedId && currentRevision === revision && !acting) {
        state = full ? {...result, eventCursor: Math.max(0, ...result.events.map(event => event.seq || 0))} : {
          ...state, ...result,
          history: [...state.history, ...result.history].slice(-2000),
          events: [...new Map([...state.events, ...result.events].map(event => [event.seq || `${event.kind}:${event.tick}:${event.text}`, event])).values()].slice(-300),
          eventCursor: result.eventCursor, eventHasMore: result.eventCount > 100,
        };
        for (const event of result.events) {
          if (event.kind === 'birth' && !state.lineage.some(agent => agent.id === event.agentId))
            state.lineage.push({id: event.agentId, parents: event.parentIds || [], generation: event.generation,
              born: event.tick, died: null});
          if (event.kind === 'death') {
            const archived = state.lineage.find(agent => agent.id === event.agentId);
            if (archived) archived.died = event.tick;
          }
        }
        state.lineage = state.lineage.slice(-500);
        if (firstSelection) selectedAgent = result.flies[0]?.id ?? null;
        render();
        if (firstSelection || performance.now() - lastInspectionAt > 1200) { await inspectAgent(); lastInspectionAt = performance.now(); }
        if (firstSelection) await refreshCheckpoints(id);
      }
    }
    $('connection').textContent = 'Lab connected';
    $('connection').dataset.offline = 'false';
    if (noticeSource === 'connection') { $('notice').hidden = true; noticeSource = null; }
  } catch (error) {
    worldAnimating = false;
    throughputSamples = [];
    $('arenaState').textContent = 'Connection interrupted';
    $('connection').textContent = 'Connection interrupted';
    $('connection').dataset.offline = 'true';
    notify(error.message, true, 'connection');
  } finally { polling = false; }
}

async function control(command) {
  if (!selectedId || acting) return;
  const id = selectedId;
  revision++;
  acting = true;
  updatePlaybackControls();
  try {
    const result = await request(`/api/ecosystems/${id}/control`, command);
    if (selectedId === id) {
      state = {...result, eventCursor: Math.max(0, ...result.events.map(event => event.seq || 0))};
      if (command.action === 'restore') {
        worldFrame = {from: new Map(), to: new Map(), startedAt: 0, duration: 0};
        lastFrameAt = 0;
      }
      render();
      await inspectAgent();
      if (['checkpoint', 'restore'].includes(command.action)) await refreshCheckpoints(id);
    }
    if (command.action === 'checkpoint') notify('Checkpoint saved.');
    if (command.action === 'restore') notify('Checkpoint restored. The previous state was archived; the ecosystem is paused.');
    if (command.action === 'configure') { delete $('settings').dataset.dirty; notify('Habitat settings updated and recorded.'); }
  } catch (error) { notify(error.message, true); }
  finally { acting = false; updatePlaybackControls(); }
}

async function refreshCheckpoints(id) {
  const names = await request(`/api/ecosystems/${id}/checkpoints`);
  if (selectedId !== id) return;
  const previous = $('checkpoints').value;
  $('checkpoints').replaceChildren(new Option('Choose a checkpoint', ''),
    ...names.map(name => new Option(`Tick ${name.match(/tick-(\d+)/)[1]} · ${new Date(Number(name.split('-')[1])).toLocaleTimeString()}`, name)));
  if (names.includes(previous)) $('checkpoints').value = previous;
  $('restore').disabled = !$('checkpoints').value;
  syncPickers();
}

function renderComparison() {
  if (!comparisonState || !state) return;
  const a = state.metrics, b = comparisonState.metrics;
  $('comparisonReadout').textContent = `${state.ecosystem.name} at ${a.seconds.toFixed(1)}s: ${a.population} living · ${a.births} births · ${a.deaths} deaths. ${comparisonState.ecosystem.name} at ${b.seconds.toFixed(1)}s: ${b.population} living · ${b.births} births · ${b.deaths} deaths. These are current snapshots, not an aligned experiment. Seeds: ${state.config.seed} and ${comparisonState.config.seed}.`;
}

function updatePlaybackControls() {
  if (!state) return;
  const stopped = state.ecosystem.paused;
  const unavailable = state.metrics.status !== 'running' || Boolean(state.ecosystem.error);
  $('run').innerHTML = stopped ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 2 10 6-10 6Z"/></svg>Run' : '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2h4v12H3zm6 0h4v12H9z"/></svg>Pause';
  $('run').disabled = acting || unavailable;
  $('run').setAttribute('aria-label', stopped ? 'Run simulation' : 'Pause simulation');
  for (const id of ['step','advance']) $(id).disabled = acting || !stopped || unavailable;
  for (const button of $('speedButtons').querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(Number(button.dataset.speed) === state.ecosystem.speed));
    button.disabled = acting;
  }
  $('restore').disabled = acting || !$('checkpoints').value;
}

function render() {
  if (!state) return;
  const metrics = state.metrics;
  const ecosystem = state.ecosystem;
  $('empty').hidden = true;
  $('workspace').hidden = false;
  $('name').textContent = ecosystem.name;
  $('model').textContent = `${state.config.controller === 'episodic-actor' ? (state.config.episodicParameters?.actuator==='joint'?'Joint episodic actor (experimental)':'Episodic actor (experimental)') : state.config.controller === 'trace-actor' ? 'Trace actor (experimental)' : 'Compact neural model'} · seed ${state.config.seed}`;
  $('status').textContent = ecosystem.error ? 'Needs attention' : metrics.status === 'extinct' ? 'Extinct' :
    metrics.status === 'capacity' ? 'Capacity reached' : ecosystem.paused ? 'Paused' : 'Running';
  $('status').dataset.state = metrics.status === 'extinct' ? 'extinct' : ecosystem.paused ? 'paused' : 'running';
  $('clock').textContent = `${metrics.seconds.toLocaleString(undefined, {maximumFractionDigits: 1})}s elapsed`;
  $('arenaState').textContent = playbackLabel();
  $('worldEmpty').hidden = metrics.population > 0;
  updatePlaybackControls();
  $('speed').value = String(ecosystem.speed);
  $('export').href = `/api/ecosystems/${ecosystem.id}/checkpoint`;
  $('phase').textContent = state.challenge ? `${state.challenge.name} · ${Math.ceil(state.challenge.remaining)}s remaining` : 'Original habitat';
  $('time').textContent = `${metrics.seconds.toFixed(1)} artificial seconds`;
  $('saved').textContent = ecosystem.savedAt ? `Saved ${new Date(ecosystem.savedAt).toLocaleTimeString()}` : 'Automatic checkpoints every 15s';
  $('accounting').textContent = `Energy balance residual ${metrics.accountingError.toExponential(2)} · Mean acquired weight change ${metrics.learnedMagnitude.toFixed(5)}. Extinction does not trigger reseeding.`;
  const metricsFragment = document.createDocumentFragment();
  for (const [label, value] of [['Living agents', metrics.population], ['Births / deaths', `${metrics.births} / ${metrics.deaths}`],
    ['Deepest ancestry', state.telemetry.deepestEver], ['Mean neurons', metrics.meanNodes.toFixed(1)]]) {
    const box = document.createElement('div'); box.className = 'metric';
    const title = document.createElement('span'); title.textContent = label;
    const number = document.createElement('strong'); number.textContent = value;
    box.append(title, number); metricsFragment.append(box);
  }
  $('metrics').replaceChildren(metricsFragment);
  if (!$('settings').contains(document.activeElement) && !$('settings').dataset.dirty) {
    for (const key of ['nutrient', 'capacity']) $(key).value = state.config[key];
    for (const key of ['learning', 'mutation', 'seasonal']) $(key).checked = state.config[key];
    $('ecology').value = state.config.ecology || 'baseline';
    $('signalMode').value = state.config.signalMode || 'normal';
    $('capacity').min = Math.max(state.config.founders, metrics.population);
  }
  if ($('autoFollow').checked && selectedAgent && !state.flies.some(agent => agent.id === selectedAgent)) selectedAgent = state.flies[0]?.id ?? null;
  if (!selectedAgent && state.flies.length) selectedAgent = state.flies[0].id;
  const archived = state.lineage.filter(agent => agent.died !== null).slice(-25);
  const choices = [...state.flies.map(agent => [`Agent ${agent.id} · G${agent.generation}`, agent.id]),
    ...archived.map(agent => [`Agent ${agent.id} · archived`, agent.id])];
  if (selectedAgent && !choices.some(([,id]) => id === selectedAgent)) choices.push([`Agent ${selectedAgent} · archived`, selectedAgent]);
  const nextAgentOptionKey = JSON.stringify(choices);
  if (nextAgentOptionKey !== agentOptionKey) {
    const focus = document.activeElement === $('agents');
    $('agents').replaceChildren(new Option('Choose an agent', ''), ...choices.map(([label, id]) => new Option(label, id)));
    $('agents').value = selectedAgent ? String(selectedAgent) : '';
    const compareValue = $('compareAgent').value;
    $('compareAgent').replaceChildren(new Option('Choose an agent', ''), ...choices.map(([label, id]) => new Option(label, id)));
    $('compareAgent').value = choices.some(([, id]) => String(id) === compareValue) ? compareValue : '';
    agentOptionKey = nextAgentOptionKey;
    if (focus) $('agents').focus({preventScroll: true});
  }
  $('agents').value = selectedAgent || '';
  const living = state.flies.find(agent => agent.id === selectedAgent);
  $('locateAgent').disabled = !living;
  $('locateAgent').setAttribute('aria-pressed', String(trackingAgent && Boolean(living)));
  $('mapSelection').hidden = !living;
  if (living) $('mapSelection').textContent = `Agent ${living.id} · generation ${living.generation} · energy ${living.energy.toFixed(1)} / 120`;
  $('previousAgent').disabled = $('nextAgent').disabled = !state.flies.length;
  $('eventCount').textContent = state.eventCount || state.events.length;
  syncPickers();
  const filter = $('eventFilter').value;
  const visibleEvents = [...state.events].reverse().filter(event => filter === 'all' || event.kind === filter);
  const nextEventRowsKey = JSON.stringify(visibleEvents.slice(0, eventsShown));
  if (nextEventRowsKey !== eventRowsKey && !$('events').contains(document.activeElement)) {
  $('events').replaceChildren();
  for (const event of visibleEvents.slice(0, eventsShown)) {
    const row = document.createElement('div'); row.className = 'event';
    row.dataset.kind = event.kind;
    const text = document.createElement('div'); text.textContent = event.text;
    const time = document.createElement('small'); time.textContent = `${(event.tick * .1).toFixed(1)}s`;
    row.append(text, time);
    const ids = [...new Set([event.agentId, ...(event.parentIds || [])].filter(Number.isInteger))];
    if (ids.length) {
      const links = document.createElement('div'); links.className = 'event-agents';
      for (const id of ids) { const button = document.createElement('button'); button.type = 'button'; button.textContent = `Inspect ${id}`; button.dataset.agentId = id; links.append(button); }
      row.append(links);
    }
    $('events').append(row);
  }
  eventRowsKey = nextEventRowsKey;
  }
  $('moreEvents').hidden = visibleEvents.length <= eventsShown && !state.eventHasMore;
  if (comparisonState) renderComparison();
  if (ecosystem.error) notify(ecosystem.error, true);
  const now = performance.now();
  const next = new Map(state.flies.map(agent => [agent.id, {x: agent.x, y: agent.y, heading: agent.heading}]));
  const canInterpolate = !state.ecosystem.paused && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  worldFrame = {
    from: canInterpolate ? new Map([...next].map(([id, point]) => [id, worldFrame.to.get(id) || point])) : next,
    to: next,
    startedAt: now,
    duration: canInterpolate && lastFrameAt ? Math.min(1800, Math.max(0, now - lastFrameAt)) : 0,
  };
  worldAnimating = worldFrame.duration > 0;
  lastFrameAt = now;
  drawWorld();
  drawHistory();
}

function drawWorld() {
  if (!state) return;
  const startedAt = performance.now();
  const canvas = $('world'), context = canvas.getContext('2d');
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = canvas.clientWidth || 1000, height = canvas.clientHeight || 640;
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  }
  context.setTransform(canvas.width / 1000, 0, 0, canvas.height / 640, 0, 0);
  context.fillStyle = '#142c2c'; context.fillRect(0, 0, 1000, 640);
  const living = state.flies.find(agent => agent.id === selectedAgent);
  const frameProgress = worldFrame.duration ? Math.min(1,(performance.now()-worldFrame.startedAt)/worldFrame.duration) : 1;
  if (trackingAgent && living) { const from=worldFrame.from.get(living.id)||living,to=worldFrame.to.get(living.id)||living; camera.x=(500-(from.x+(to.x-from.x)*frameProgress))*camera.zoom; camera.y=(320-(from.y+(to.y-from.y)*frameProgress))*camera.zoom; }
  context.save();
  context.translate(500+camera.x,320+camera.y); context.scale(camera.zoom,camera.zoom); context.translate(-500,-320);
  const readable = width > 550;
  function mapLabel(text,x,y,color) {
    if (!readable) return;
    context.save(); context.font = `${Math.max(13,14*1000/width)/camera.zoom}px system-ui`;
    context.fillStyle = color; context.textAlign = 'center'; context.fillText(text,x,y); context.restore();
  }
  for (const center of state.resourceCenters || []) {
    context.fillStyle = '#b9a15309'; context.beginPath(); context.arc(center.x,center.y,65,0,Math.PI*2); context.fill();
    mapLabel('Food patch',center.x,center.y-72,'#bfa65b');
  }
  for (const food of state.food) {
    if (food.amount < .02) continue;
    context.fillStyle = `rgba(227,190,95,${Math.min(.95,.15+food.amount*.35)})`;
    context.beginPath(); context.arc(food.x,food.y,1+Math.sqrt(food.amount)*2.3,0,Math.PI*2); context.fill();
  }
  for (const rock of state.obstacles) {
    context.fillStyle = '#51655e'; context.beginPath(); context.arc(rock.x,rock.y,rock.r,0,Math.PI*2); context.fill();
    context.strokeStyle = '#6a7b6c'; context.lineWidth = 1;
    context.beginPath(); context.arc(rock.x-4,rock.y-4,rock.r*.68,.8,4.3); context.stroke();
    mapLabel('Obstacle',rock.x,rock.y+rock.r+20,'#9aaca0');
  }
  const zone = state.challenge?.hazard || state.challenge?.bloom;
  if (zone) {
    const danger = Boolean(state.challenge.hazard);
    context.fillStyle = danger ? '#d27e5b1f' : '#c6b05b14';
    context.beginPath(); context.arc(zone.x,zone.y,zone.r,0,Math.PI*2); context.fill();
    context.strokeStyle = danger ? '#d98a68' : '#d5bd75'; context.lineWidth = 1.5/camera.zoom;
    context.setLineDash([7,6]); context.stroke(); context.setLineDash([]);
    mapLabel(danger ? 'Danger · energy cost' : 'Food bloom',zone.x,zone.y-zone.r-12,danger?'#e2a082':'#d5bd75');
  }
  const progress = worldFrame.duration ? Math.min(1,(performance.now()-worldFrame.startedAt)/worldFrame.duration) : 1;
  const ancestors = new Set();
  if ($('overlay').value === 'lineage' && selectedAgent) {
    const pending = [selectedAgent];
    while (pending.length) { const entry = state.lineage.find(item => item.id === pending.pop());
      for (const parent of entry?.parents || []) if (!ancestors.has(parent)) { ancestors.add(parent); pending.push(parent); }
    }
  }
  for (const agent of state.flies) {
    const start=worldFrame.from.get(agent.id)||agent,end=worldFrame.to.get(agent.id)||agent;
    const angleDelta=Math.atan2(Math.sin(end.heading-start.heading),Math.cos(end.heading-start.heading));
    const x=start.x+(end.x-start.x)*progress,y=start.y+(end.y-start.y)*progress;
    const selected=agent.id===selectedAgent;
    context.save(); context.translate(x,y); context.rotate(start.heading+angleDelta*progress);
    if (selected) {
      if (selectedTrail.at(-1)?.tick !== state.metrics.tick) selectedTrail.push({x,y,tick:state.metrics.tick,id:agent.id});
      selectedTrail=selectedTrail.filter(point=>point.id===agent.id).slice(-18);
      context.strokeStyle='#f4f1d5'; context.lineWidth=1.6/camera.zoom;
      context.beginPath(); context.arc(0,0,17,0,Math.PI*2); context.stroke();
    }
    if (agent.lastFood>.05) { context.strokeStyle='#dcc07870';context.lineWidth=1;context.beginPath();context.arc(0,0,11,0,Math.PI*2);context.stroke(); }
    context.fillStyle='#c1ddd87c';
    context.beginPath();context.ellipse(-3,-4,7,3.5,-.5,0,Math.PI*2);context.ellipse(-3,4,7,3.5,.5,0,Math.PI*2);context.fill();
    context.strokeStyle='#96b5a5';context.lineWidth=.75;context.beginPath();
    for(const side of [-1,1]){context.moveTo(-3,side*2);context.lineTo(-6,side*7);context.moveTo(2,side*2);context.lineTo(3,side*6);}context.stroke();
    context.fillStyle=$('overlay').value==='energy'?`hsl(${Math.max(0,agent.energy/120)*115},62%,58%)`:ancestors.has(agent.id)?'#7fbfe7':`hsl(${135+agent.color*35},35%,${48+agent.energy/12}%)`;
    context.beginPath();context.ellipse(0,0,6.5,3,0,0,Math.PI*2);context.fill();
    context.fillStyle='#e5eee4';context.beginPath();context.arc(5,0,2,0,Math.PI*2);context.fill();
    context.restore();
  }
  if(selectedTrail.length>1){context.strokeStyle='#cfddbd55';context.lineWidth=1.3/camera.zoom;context.beginPath();selectedTrail.forEach((p,i)=>i?context.lineTo(p.x,p.y):context.moveTo(p.x,p.y));context.stroke();}
  context.restore();
  observerPerformance.worldDrawMs=performance.now()-startedAt;
}

function drawHistory() {
  if (!state || !$('history').clientWidth) return;
  const canvas=$('history'),width=canvas.clientWidth,height=canvas.clientHeight,ratio=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
  const context=canvas.getContext('2d');context.setTransform(ratio,0,0,ratio,0,0);
  const points=[...state.history];if(points.at(-1)?.tick!==state.metrics.tick)points.push(state.metrics);
  const series=[['population','Population','#237563'],['meanEnergy','Mean energy','#347f9e'],['food','Food reserve','#a57e27'],['meanNodes','Mean neurons','#816b57']];
  const first=points[0]?.tick||0,span=Math.max(1,(points.at(-1)?.tick||0)-first),rowHeight=height/4;
  series.forEach(([key,label,color],row)=>{
    const top=row*rowHeight,scale=Math.max(1,...points.map(p=>p[key]));
    context.fillStyle='#60716d';context.font='12px system-ui';context.fillText(label,0,top+17);
    context.fillStyle=color;context.font='500 15px system-ui';context.fillText(Number(state.metrics[key]).toLocaleString(undefined,{maximumFractionDigits:key==='population'?0:1}),0,top+36);
    context.strokeStyle=color;context.lineWidth=1.7;context.beginPath();
    points.forEach((point,index)=>{const x=108+(point.tick-first)/span*(width-114),y=top+rowHeight-8-Math.min(1,point[key]/scale)*(rowHeight-16);index?context.lineTo(x,y):context.moveTo(x,y);});context.stroke();
  });
}

async function inspectAgent() {
  if (!selectedId || !state) return;
  const id=selectedId,agentId=selectedAgent,requestId=++inspectorRequest;
  if (!agentId) {
    $('individual').textContent='No living agents remain. Open Activity to inspect the retained life history.';
    $('networkView').hidden=true;$('agentStatus').textContent='No living agents';return;
  }
  const detail=await request(`/api/ecosystems/${id}/agents/${agentId}`);
  if(id!==selectedId||agentId!==selectedAgent||requestId!==inspectorRequest)return;
  const view=detail.controllerView||compactControllerView(detail,state.interface);
  if ($('individual').dataset.agentId === String(agentId) && $('individual').contains(document.activeElement)) return;
  $('individual').dataset.agentId = String(agentId);
  const sensesOpen=Boolean($('individual').querySelector('.senses')?.open);
  const memoryOpen=Boolean($('individual').querySelector('.episodic-memory')?.open);
  $('individual').replaceChildren();$('networkView').hidden=!view.available;
  $('agentStatus').textContent=view.available?'Alive':'Archived';$('agentStatus').dataset.state=view.available?'alive':'archived';
  if(!view.available){
    const box=document.createElement('div');box.className='archived-message';
    const title=document.createElement('h3');title.textContent=`Agent ${agentId}`;
    const text=document.createElement('p');text.textContent=detail.archived?`Died at ${(detail.archived.died*.1).toFixed(1)}s. Parents: ${detail.archived.parents.join(' + ')||'founder'}. Ancestry is retained; this agent's lifetime network was not archived.`:'This agent is unavailable.';
    const follow=document.createElement('button');follow.type='button';follow.textContent='Follow a living agent';follow.disabled=!state.flies.length;
    follow.onclick=()=>{selectedAgent=state.flies[0]?.id??null;$('autoFollow').checked=true;render();inspectAgent();};
    box.append(title,text,follow);$('individual').append(box);return;
  }
  const heading=document.createElement('h3');heading.textContent=`Agent ${view.agentId}`;
  const energyHeading=document.createElement('div');energyHeading.className='energy-heading';
  const energyLabel=document.createElement('span');energyLabel.textContent='Energy';const energyValue=document.createElement('strong');energyValue.textContent=`${view.energy.toFixed(1)} / 120`;energyHeading.append(energyLabel,energyValue);
  const track=document.createElement('div');track.className='energy-track';const fill=document.createElement('span');fill.style.width=`${Math.max(0,Math.min(100,view.energy/120*100))}%`;track.append(fill);
  const traits=document.createElement('div');traits.className='traits';
  for(const[label,value]of[['Age',`${view.ageSeconds.toFixed(1)}s`],['Generation',view.generation],['Children',view.offspring],['Neurons / edges',`${view.controller.neurons} / ${view.controller.connections}`]]){
    const box=document.createElement('div'),name=document.createElement('span'),number=document.createElement('strong');name.textContent=label;number.textContent=value;box.append(name,number);traits.append(box);
  }
  const parents=document.createElement('div');parents.className='agent-parents';parents.append(view.parents.length?'Parents':'Founder · no parents');
  for(const parent of view.parents){const button=document.createElement('button');button.type='button';button.textContent=`Agent ${parent}`;button.onclick=()=>chooseAgent(parent);parents.append(button);}
  const actions=document.createElement('div');actions.className='action-readout';const title=document.createElement('h3');title.textContent='Current controller outputs';actions.append(title);
  if(view.controller.traceNormalization){const note=document.createElement('p');note.className='hint';note.textContent='Sensory traces use exponential averages: each new input is weighted by one minus retention. The same trace neurons and connections remain active.';actions.append(note);}
  view.controller.outputs.forEach((name,index)=>{const value=view.lastObservation.outputs[index]||0,row=document.createElement('div');row.className='action-row';
    const label=document.createElement('span');label.textContent=name[0].toUpperCase()+name.slice(1);label.title={turn:'Negative turns left; positive turns right.',move:'−1 stops; +1 moves at full inherited speed.',eat:'A positive output enables feeding when food is nearby.',mate:'A positive output enables mating when conditions are met.',signal:'−1 emits no signal; +1 is maximum output.'}[name]||name;const bar=document.createElement('div');bar.className='action-track';const level=document.createElement('i');level.style.left=`${value<0?50+value*50:50}%`;level.style.width=`${Math.abs(value)*50}%`;bar.append(level);const number=document.createElement('strong');number.textContent=value.toFixed(2);row.append(label,bar,number);actions.append(row);
  });
  const feeding=document.createElement('p');feeding.className='feeding-readout';feeding.textContent=`Last step: ${view.lastObservation.foodEaten.toFixed(3)} food gained · ${view.lastObservation.energyCost.toFixed(3)} energy spent. Turn: − left / + right. Move: −1 stopped / +1 full speed. Eating and mating need a positive output and suitable conditions.`;actions.append(feeding);
  const senses=document.createElement('details');senses.className='senses';senses.open=sensesOpen;const summary=document.createElement('summary');summary.textContent='Inspect sensory inputs';const grid=document.createElement('div');grid.className='input-grid';grid.dataset.ui='sensory readings';
  view.controller.inputs.forEach((name,index)=>{const item=document.createElement('span');item.textContent=`${name}: ${Number(view.lastObservation.inputs[index]||0).toFixed(2)}`;grid.append(item);});senses.append(summary,grid);
  $('individual').append(heading,energyHeading,track,traits,parents,actions,senses);
  if(view.episodic){
    const memory=document.createElement('details');memory.className='senses episodic-memory';memory.open=memoryOpen;
    const summary=document.createElement('summary');summary.textContent='Inspect recalled experience';memory.append(summary);
    const stats=document.createElement('p');stats.textContent=`${view.episodic.stored} / ${view.episodic.capacity} experiences stored · ${view.episodic.experiences} observed · ${view.episodic.pendingReturns} returns pending.`;memory.append(stats);
    const valueMode=view.episodic.returnMode==='td';
    if(view.episodic.featureMode){const line=document.createElement('p');line.textContent=view.episodic.featureMode==='navigation'?'Recall uses foraging cues, current energy and a fixed scale anchor; clocks, age and mating cues are excluded.':`Retrieval representation: ${view.episodic.featureMode}.`;memory.append(line);}
    if(valueMode&&view.episodic.bootstrapMode==='expected'){const line=document.createElement('p');line.textContent=`Future values average the configured action distribution, including ${(view.episodic.exploration*100).toFixed(0)}% random exploration. They are predictions under that policy.`;memory.append(line);}
    if(view.episodic.priorStrength){const line=document.createElement('p');line.textContent=`Sparse action estimates share a local prior from the recalled outcomes, with weight ${view.episodic.priorStrength}. It is an estimate from experience, not a correct-action label.`;memory.append(line);}
    if(view.episodic.lastUpdate){const update=view.episodic.lastUpdate,components=update.target,line=document.createElement('p');line.textContent=`Latest value update: observed contribution ${components.observed.toFixed(4)} + estimated future ${components.estimatedFuture.toFixed(4)} = target ${update.value.toFixed(4)} over ${components.horizon} ticks.${components.terminal?' Terminal transition: future value is zero.':''}`;memory.append(line);}
    if(view.episodic.reserveRisk){const line=document.createElement('p');line.textContent=`Reserve estimate: discounted shortfall below ${(view.episodic.reserveThreshold*100).toFixed(0)}% energy, weighted by ${view.episodic.riskWeight.toFixed(2)} when choosing.${view.episodic.riskLearning?'':' Acquisition is disabled.'} This is a reserve-cost prediction, not a probability of death.`;memory.append(line);const risk=view.episodic.lastUpdate?.risk;if(risk){const update=document.createElement('p');update.textContent=`Latest reserve target: observed ${risk.observed.toFixed(4)} + predicted future ${risk.estimatedFuture.toFixed(4)} = ${risk.value.toFixed(4)}.${risk.terminal?' Terminal target assumes an unsafe absorbing state.':''}`;memory.append(update);}}
    const decision=view.episodic.lastDecision;
    if(decision?.actuator==='joint'){
      const options=decision.retrieval.options,chosen=options.find(o=>o.id===decision.choice),levels=view.episodic.speedLevels;
      const speed=o=>levels?`${(levels[o.speed<0?0:1]*100).toFixed(0)}% speed`:(o.speed<0?'slower':'faster');
      const description=document.createElement('p');description.textContent=`Controller step ${decision.step}: ${speed(chosen)} with ${chosen.turn<0?'left':'right'} correction selected by ${decision.reason==='retrieval'?'the largest estimated return':decision.reason==='tie'?'a random tie break':'random exploration'}. Current executed turn ${view.lastObservation.outputs[0].toFixed(3)}, movement ${view.lastObservation.outputs[1].toFixed(3)}.`;memory.append(description);
      const tag=document.createElement('p');tag.textContent='Each record stores 17 sensory features plus the speed command actually selected; its action is the selected turn-correction sign. The speed tag separates the two possible motor conditions.';memory.append(tag);
      for(const option of options){const title=document.createElement('p');title.textContent=`${speed(option)} + ${option.turn<0?'left':'right'} correction${option.id===decision.choice?' · chosen':''}: estimated normalized return ${option.estimate.toFixed(4)} · ${option.neighbors.length} recalled experiences`;memory.append(title);const list=document.createElement('ul');for(const row of option.neighbors){const item=document.createElement('li');item.textContent=`Experience ${row.experience} · speed tag ${row.features[17]<0?'slower':'faster'} · ${row.action<0?'left':'right'} correction · value target ${row.reward.toFixed(4)} (observed ${row.target.observed.toFixed(4)} + predicted future ${row.target.estimatedFuture.toFixed(4)}) · distance ${row.distance.toFixed(3)}`;list.append(item);}memory.append(list);}
      const note=document.createElement('p');note.textContent='Storage and both speed-conditioned recalls cost energy. These are predictions from executed experience, not proof of useful coordinated behavior.';memory.append(note);
    }else if(decision){
      const speed=(decision.actuator??view.episodic.actuator)==='move',negative=speed?'slower':'left',positive=speed?'faster':'right';
      const levels=speed&&view.episodic.moveMode==='levels'?view.episodic.speedLevels:null,selection=levels?`${(levels[decision.choice<0?0:1]*100).toFixed(0)}% of inherited maximum speed`:`${decision.choice<0?negative:positive} correction`;
      const applied=levels?`Current movement output: ${view.lastObservation.outputs[1].toFixed(3)}.`:`Applied ${speed?'movement':'turn'} correction this step: ${Number(view.episodic.correction??view.episodic.turnCorrection??0).toFixed(3)}.`;
      const description=document.createElement('p');description.textContent=`Controller step ${decision.step}: ${selection} selected by ${decision.reason==='retrieval'?(decision.reserveRisk?'the larger return-minus-reserve-cost estimate':'the larger recalled reward estimate'):decision.reason==='tie'?'a random tie break':'random exploration'}. ${applied} These are the experiences retrieved at decision time.`;memory.append(description);
      for(const[key,label]of[['negative',speed?`Slower${levels?` (${(levels[0]*100).toFixed(0)}%)`:''}`:'Left'],['positive',speed?`Faster${levels?` (${(levels[1]*100).toFixed(0)}%)`:''}`:'Right']]){
        const score=decision.retrieval[key],title=document.createElement('p');title.textContent=`${label}: estimated ${valueMode?'normalized return':'discounted reward'} ${score.estimate.toFixed(4)}${decision.reserveRisk?` · reserve cost ${score.riskEstimate.toFixed(4)} · combined score ${score.score.toFixed(4)}`:''} · ${score.neighbors.length} recalled ${score.neighbors.length===1?'experience':'experiences'}`;memory.append(title);
        if(score.priorWeight){const evidence=document.createElement('p');evidence.textContent=`Unpooled estimate ${score.rawEstimate.toFixed(4)} · relative support ${score.supportWeight.toFixed(3)} · shared prior ${score.priorEstimate.toFixed(4)} with weight ${score.priorWeight}.`;memory.append(evidence);}
        const list=document.createElement('ul');
        for(const row of score.neighbors){const item=document.createElement('li');item.textContent=`Experience ${row.experience??'unknown'} · ${row.target?'value target':'observed reward'} ${row.reward.toFixed(4)}${row.target?` (observed ${row.target.observed.toFixed(4)} + estimated future ${row.target.estimatedFuture.toFixed(4)})`:''}${row.risk?` · reserve target ${row.risk.value.toFixed(4)} (observed ${row.risk.observed.toFixed(4)} + predicted future ${row.risk.estimatedFuture.toFixed(4)})`:''} · feature distance ${row.distance.toFixed(3)}`;list.append(item);}memory.append(list);
      }
      const note=document.createElement('p');note.textContent=valueMode?'Value targets combine normalized observed food-minus-cost rewards with an estimated future component. The future component is a prediction. Memory storage and all value/retrieval lookups cost energy.':'Rewards are past food gain minus energy cost. Similar observations can have different outcomes; a larger estimate does not prove a better action. Memory storage and lookup also cost energy.';memory.append(note);
    }else{const empty=document.createElement('p');empty.textContent='No captured decision yet. Step or run this experimental controller to inspect a decision.';memory.append(empty);}
    $('individual').append(memory);
  }
  $('networkLabel').textContent=`${view.controller.neurons} neurons`;
  drawBrain(detail);
}

function drawBrain(agent) {
  const startedAt=performance.now(),canvas=$('brain'),width=canvas.clientWidth||300,height=220,ratio=Math.min(devicePixelRatio||1,2);
  canvas.style.height=`${height}px`;canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
  const context=canvas.getContext('2d');context.setTransform(ratio,0,0,ratio,0,0);context.fillStyle='#142c2c';context.fillRect(0,0,width,height);
  const positions=new Map(),columns=[18,width*.46,width-71];
  ['input','hidden','output'].forEach((kind,column)=>{const nodes=agent.genome.nodes.filter(n=>n.kind===kind);context.fillStyle='#a3bfb0';context.font='11px system-ui';context.fillText(['Inputs','Internal','Actions'][column],columns[column]-5,18);
    nodes.forEach((node,index)=>{const cols=kind==='hidden'?Math.min(7,Math.ceil(Math.sqrt(nodes.length/3))):1;const rows=Math.ceil(nodes.length/cols);positions.set(node.id,[columns[column]+(index%cols-(cols-1)/2)*6,31+(Math.floor(index/cols)+.5)*(height-45)/rows]);});
  });
  const edges=agent.genome.edges.map((edge,index)=>({edge,index,score:Math.abs((edge.w+agent.brain.plastic[index])*(agent.brain.activity[edge.from]||0))})).sort((a,b)=>b.score-a.score).slice(0,180);
  for(const{edge,index}of edges){const a=positions.get(edge.from),b=positions.get(edge.to);if(!a||!b)continue;context.strokeStyle=edge.w+agent.brain.plastic[index]>=0?'#8db59b35':'#df947035';context.lineWidth=.6;context.beginPath();context.moveTo(...a);context.lineTo(...b);context.stroke();}
  for(const node of agent.genome.nodes){const[x,y]=positions.get(node.id);context.fillStyle=`rgba(195,222,179,${.3+Math.min(1,Math.abs(agent.brain.activity[node.id]))*.7})`;context.beginPath();context.arc(x,y,node.kind==='hidden'?1.5:2.7,0,Math.PI*2);context.fill();
    if(node.kind==='output'){context.fillStyle='#bdcec3';context.font='10px system-ui';context.fillText(state.interface.outputs[node.id-state.interface.inputs.length],x+8,y+3);}
  }
  $('brainLegend').textContent=`Brightness shows activity. Green / coral edges have positive / negative weights. Showing ${edges.length} of ${agent.genome.edges.length} connections, ranked by current signal magnitude.`;
  observerPerformance.brainDrawMs=performance.now()-startedAt;
}

async function chooseAgent(id) {
  selectedAgent=id;selectedTrail=[];
  if(!state.flies.some(agent=>agent.id===id))$('autoFollow').checked=false;
  render();
  try{await inspectAgent();}catch(error){notify(error.message,true);}
}

const openCreate = () => { $('createError').textContent = ''; $('createDialog').showModal(); };
$('new').onclick = openCreate;
$('first').onclick = openCreate;
$('cancel').onclick = () => $('createDialog').close();
$('create').onsubmit = async event => {
  event.preventDefault();
  const submit = event.submitter || event.target.querySelector('button[type=submit]'); submit.disabled = true;
  try {
    const data = new FormData(event.target), config = {};
    for (const key of ['seed', 'founders', 'capacity', 'nutrient']) config[key] = Number(data.get(key));
    for (const key of ['learning', 'mutation', 'seasonal', 'reproduction']) config[key] = data.has(key);
    config.controller = data.get('controller'); config.challenges = data.get('challenges'); config.ecology = data.get('ecology'); config.signalMode = data.get('signalMode');
    if(config.controller==='episodic-actor'){const returnMode=data.get('episodicReturnMode')||'mean';config.episodicParameters={actuator:data.get('episodicActuator')||'turn',returnMode,...(returnMode==='td'?{discount:.99,decisionTicks:8,creditTicks:8}:{})};}
    const result = await request('/api/ecosystems', {name: data.get('name'), config});
    $('createDialog').close(); await selectEcosystem(result.ecosystem.id);
  } catch (error) { $('createError').textContent = error.message; }
  finally { submit.disabled = false; }
};
document.querySelector('select[name=controller]').addEventListener('change',event=>{document.getElementById('episodicControls').hidden=event.target.value!=='episodic-actor';});
$('run').onclick = () => control({action: state.ecosystem.paused ? 'run' : 'pause'});
$('step').onclick = () => control({action: 'step', ticks: 10});
$('advance').onclick = () => control({action: 'step', ticks: 100});
$('speed').onchange = event => control({action: 'speed', value: Number(event.target.value)});
$('save').onclick = () => control({action: 'checkpoint'});
$('restore').onclick = () => { if ($('checkpoints').value) control({action: 'restore', name: $('checkpoints').value}); };
$('settings').addEventListener('input', () => { $('settings').dataset.dirty = 'true'; });
$('settings').addEventListener('change', () => { $('settings').dataset.dirty = 'true'; });
$('settings').onsubmit = event => {
  event.preventDefault();
  control({action: 'configure', config: {nutrient: Number($('nutrient').value), capacity: Number($('capacity').value), ecology: $('ecology').value, signalMode: $('signalMode').value,
    learning: $('learning').checked, mutation: $('mutation').checked, seasonal: $('seasonal').checked}});
};
$('fork').onclick = () => {
  forkSource = selectedId; $('forkName').value = `${state.ecosystem.name.slice(0, 65)} — branch`;
  $('forkError').textContent = ''; $('forkDialog').showModal();
};
$('cancelFork').onclick = () => $('forkDialog').close();
$('forkForm').onsubmit = async event => {
  event.preventDefault(); const submit = event.submitter || event.target.querySelector('button[type=submit]'); submit.disabled = true;
  try {
    const result = await request(`/api/ecosystems/${forkSource}/fork`, {name: $('forkName').value});
    $('forkDialog').close(); await selectEcosystem(result.ecosystem.id);
  } catch (error) { $('forkError').textContent = error.message; }
  finally { submit.disabled = false; }
};
$('agents').onchange = event => chooseAgent(Number(event.target.value) || null);
$('compareAgent').onchange = async event => {
  if (!event.target.value || !selectedId || !selectedAgent) { $('traitComparison').textContent = 'Choose another agent to compare inherited traits.'; return; }
  try {
    const [a,b] = await Promise.all([selectedAgent, Number(event.target.value)].map(id => request(`/api/ecosystems/${selectedId}/agents/${id}`)));
    if (!a.genome || !b.genome) { $('traitComparison').textContent = 'Both agents need retained genomes for a trait comparison.'; return; }
    const table = document.createElement('table'); table.className = 'trait-table';
    const head = document.createElement('tr');
    for (const label of ['Trait', `Agent ${a.id}`, `Agent ${b.id}`]) { const cell = document.createElement('th'); cell.textContent=label; head.append(cell); }
    table.append(head);
    for (const key of Object.keys(a.genome.traits)) {
      const row = document.createElement('tr');
      for (const value of [key, a.genome.traits[key].toFixed(3), b.genome.traits[key].toFixed(3)]) { const cell=document.createElement('td'); cell.textContent=value; row.append(cell); }
      table.append(row);
    }
    $('traitComparison').replaceChildren(table);
  } catch (error) { notify(error.message, true); }
};
$('eventFilter').onchange = () => { eventsShown = 12; if (state) render(); };
$('moreEvents').onclick = async () => {
  if (!state) return;
  const filter = $('eventFilter').value;
  const visible = [...state.events].filter(event => filter === 'all' || event.kind === filter);
  if (visible.length > eventsShown) { eventsShown += 12; render(); return; }
  try {
    const page = await request(`/api/ecosystems/${selectedId}/events?offset=${state.events.length}&limit=100`);
    state.events = [...page.items, ...state.events].slice(-300);
    state.eventHasMore = page.hasMore;
    eventsShown += 12;
    render();
  } catch (error) { notify(error.message, true); }
};
$('events').onclick = async event => {
  const button = event.target.closest('button[data-agent-id]');
  if (!button) return;
  setInspectorTab('agent');
  await chooseAgent(Number(button.dataset.agentId));
};
$('compareHabitat').onchange = async event => {
  const id = event.target.value;
  comparisonState = id ? await request(`/api/ecosystems/${id}`).catch(error => { notify(error.message, true); return null; }) : null;
  renderComparison();
};
$('overlay').onchange = () => {
  const mode=$('overlay').value;
  const legend=$('worldLegend');
  legend.innerHTML=mode==='energy'?'<span><i style="background:#ce704e;border-radius:50%"></i>Low energy</span><span><i style="background:#63ad6c;border-radius:50%"></i>High energy</span><span>Energy range: 0–120</span>':mode==='lineage'?'<span><i style="background:#7fbfe7;border-radius:50%"></i>Retained ancestors</span><span><i class="legend-fly"></i>Other living agents</span><span>White ring: selected agent</span>':'<span><i class="legend-fly"></i>Neural fly</span><span><i class="legend-food"></i>Food</span><span><i class="legend-obstacle"></i>Obstacle</span><span><i class="legend-danger"></i>Danger / energy cost</span>';
  $('mapHint').textContent=mode==='energy'?'Agent energy: red is low, green is high. Each fly has a maximum of 120 energy.':mode==='lineage'?'Blue flies are retained ancestors of the selected agent. Ancestry records may include agents no longer alive.':'Click a fly to inspect it. Scroll to zoom; choose Pan to move around.';
  if(state)drawWorld();
};
$('zoomIn').onclick=()=>{camera.zoom=Math.min(4,camera.zoom*1.25);drawWorld();};
$('zoomOut').onclick=()=>{camera.zoom=Math.max(1,camera.zoom/1.25);drawWorld();};
$('resetView').onclick=()=>{camera={x:0,y:0,zoom:1};trackingAgent=false;$('locateAgent').setAttribute('aria-pressed','false');drawWorld();};
$('locateAgent').onclick=()=>{trackingAgent=!trackingAgent;if(trackingAgent)camera.zoom=Math.max(1.5,camera.zoom);$('locateAgent').setAttribute('aria-pressed',String(trackingAgent));drawWorld();};
function setPanMode(value){panMode=value;$('world').dataset.mode=value?'pan':'inspect';$('panMode').setAttribute('aria-pressed',String(value));$('inspectMode').setAttribute('aria-pressed',String(!value));}
$('panMode').onclick=()=>setPanMode(true);$('inspectMode').onclick=()=>setPanMode(false);
$('world').onpointerdown=event=>{didDrag=false;if(event.button===0&&(panMode||event.shiftKey)){trackingAgent=false;cameraDrag={x:event.clientX,y:event.clientY,originX:camera.x,originY:camera.y};event.currentTarget.setPointerCapture(event.pointerId);event.currentTarget.dataset.dragging='true';}};
$('world').onpointermove=event=>{if(!cameraDrag)return;didDrag=Math.hypot(event.clientX-cameraDrag.x,event.clientY-cameraDrag.y)>4;camera.x=cameraDrag.originX+(event.clientX-cameraDrag.x)/event.currentTarget.clientWidth*1000;camera.y=cameraDrag.originY+(event.clientY-cameraDrag.y)/event.currentTarget.clientWidth*1000;drawWorld();};
const endPan=()=>{cameraDrag=null;$('world').dataset.dragging='false';};
$('world').onpointerup=endPan;$('world').onpointercancel=endPan;
$('world').onwheel=event=>{event.preventDefault();camera.zoom=Math.max(1,Math.min(4,camera.zoom*(event.deltaY<0?1.1:1/1.1)));drawWorld();};
$('world').onclick=async event=>{
  if(!state||event.shiftKey||didDrag||panMode)return;
  const bounds=event.target.getBoundingClientRect(),sx=(event.clientX-bounds.left)/bounds.width*1000,sy=(event.clientY-bounds.top)/bounds.height*640;
  const x=(sx-500-camera.x)/camera.zoom+500,y=(sy-320-camera.y)/camera.zoom+320;
  const progress=worldFrame.duration?Math.min(1,(performance.now()-worldFrame.startedAt)/worldFrame.duration):1;
  const hitDistance=agent=>{const from=worldFrame.from.get(agent.id)||agent,to=worldFrame.to.get(agent.id)||agent;return Math.hypot(from.x+(to.x-from.x)*progress-x,from.y+(to.y-from.y)*progress-y);};
  const agent=[...state.flies].sort((a,b)=>hitDistance(a)-hitDistance(b))[0];
  if(!agent||hitDistance(agent)>Math.max(25,14*1000/bounds.width)/camera.zoom)return;
  setInspectorTab('agent');await chooseAgent(agent.id);
};
function setInspectorTab(tab){for(const name of ['agent','activity']){$(`${name}Tab`).setAttribute('aria-selected',String(name===tab));$(`${name}Tab`).tabIndex=name===tab?0:-1;$(`${name}Panel`).hidden=name!==tab;}if(tab==='agent'&&state)inspectAgent().catch(error=>notify(error.message,true));}
$('agentTab').onclick=()=>setInspectorTab('agent');$('activityTab').onclick=()=>setInspectorTab('activity');
for(const name of ['agent','activity'])$(`${name}Tab`).onkeydown=event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();const next=name==='agent'?'activity':'agent';setInspectorTab(next);$(`${next}Tab`).focus();}};
function adjacentAgent(offset){if(!state?.flies.length)return;const index=state.flies.findIndex(a=>a.id===selectedAgent);chooseAgent(state.flies[(Math.max(0,index)+offset+state.flies.length)%state.flies.length].id);}
$('previousAgent').onclick=()=>adjacentAgent(-1);$('nextAgent').onclick=()=>adjacentAgent(1);
$('autoFollow').onchange=()=>{if(state){render();inspectAgent().catch(error=>notify(error.message,true));}};
$('habitatSearch').oninput=()=>listEcosystems(ecosystemItems);
$('checkpoints').onchange=()=>{$('restore').disabled=!$('checkpoints').value;};
$('speedButtons').onclick=event=>{const button=event.target.closest('button[data-speed]');if(button)control({action:'speed',value:Number(button.dataset.speed)});};
for(const id of ['save','fork','export'])$(id).addEventListener('click',()=>{$('worldActions').open=false;});
document.addEventListener('keydown',event=>{if(event.code==='Space'&&!event.repeat&&!event.target.closest('input,button,select,textarea,a,summary,dialog')&&state&&!$('run').disabled){event.preventDefault();$('run').click();}});

function animateWorld() {
  if (worldAnimating && state && !$('workspace').hidden) {
    drawWorld();
    if (performance.now() >= worldFrame.startedAt + worldFrame.duration) worldAnimating = false;
  }
  requestAnimationFrame(animateWorld);
}

function enhanceSelect(select) {
  if (select.hidden) return;
  const wrapper=document.createElement('div');wrapper.className='picker';
  select.before(wrapper);wrapper.append(select);select.hidden=true;
  const trigger=document.createElement('button');trigger.type='button';trigger.className='picker-trigger';trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
  const label=document.createElement('span'),chevron=document.createElement('span');chevron.className='chevron';chevron.setAttribute('aria-hidden','true');trigger.append(label,chevron);
  const menu=document.createElement('div');menu.className='picker-menu';menu.dataset.ui='selection menu';menu.hidden=true;
  const searchable=select.dataset.search==='true'||['checkpoints','compareHabitat'].includes(select.id);
  const search=document.createElement('input');search.type='search';search.className='picker-search';search.placeholder='Search…';search.setAttribute('aria-label','Filter options');search.autocomplete='off';search.hidden=!searchable;
  const list=document.createElement('div');list.className='picker-options';list.setAttribute('role','listbox');list.setAttribute('aria-label',select.getAttribute('aria-label')||select.id||select.name);
  const menuId=`picker-${select.id||select.name}`;menu.id=menuId;trigger.setAttribute('aria-controls',menuId);menu.append(search,list);wrapper.append(trigger,menu);
  const fieldName=select.getAttribute('aria-label')||[...(select.closest('label')?.childNodes||[])].filter(node=>node.nodeType===3).map(node=>node.textContent.trim()).join(' ')||select.id||select.name;
  function sync(){label.textContent=select.selectedOptions[0]?.textContent||'Choose…';trigger.disabled=select.disabled;trigger.setAttribute('aria-label',`${fieldName}: ${label.textContent}`);}
  function draw(){list.replaceChildren();const query=search.value.toLowerCase();
    for(const option of [...select.options].filter(option=>!option.disabled&&option.textContent.toLowerCase().includes(query))){
      const button=document.createElement('button');button.type='button';button.className='picker-option';button.setAttribute('role','option');button.setAttribute('aria-selected',String(option.selected));button.textContent=option.textContent;
      button.onclick=()=>{select.value=option.value;sync();close();trigger.focus({preventScroll:true});select.dispatchEvent(new Event('change',{bubbles:true}));};list.append(button);
    }
    if(!list.children.length){const empty=document.createElement('div');empty.className='picker-empty';empty.textContent='No matching options';list.append(empty);}
  }
  function close(){menu.hidden=true;trigger.setAttribute('aria-expanded','false');}
  function open(){for(const picker of pickers)picker.close();search.value='';draw();menu.hidden=false;trigger.setAttribute('aria-expanded','true');const bounds=menu.getBoundingClientRect();menu.classList.toggle('open-up',bounds.bottom>innerHeight&&wrapper.getBoundingClientRect().top>bounds.height);(searchable?search:list.querySelector('[aria-selected=true]')||list.querySelector('button'))?.focus();}
  trigger.onclick=()=>menu.hidden?open():close();
  trigger.onkeydown=event=>{if(event.key==='ArrowDown'){event.preventDefault();open();}};
  menu.onkeydown=event=>{const options=[...list.querySelectorAll('button')],index=options.indexOf(document.activeElement);
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();trigger.focus();}
    else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const target=event.key==='Home'?0:event.key==='End'?options.length-1:event.key==='ArrowDown'?(index+1)%options.length:(index-1+options.length)%options.length;options[target]?.focus();}
    else if(event.key==='Enter'&&event.target===search){event.preventDefault();options[0]?.click();}
  };
  search.oninput=draw;document.addEventListener('pointerdown',event=>{if(!wrapper.contains(event.target))close();});
  new MutationObserver(()=>{sync();if(!menu.hidden)draw();}).observe(select,{childList:true,subtree:true});
  const picker={sync,close};pickers.push(picker);sync();
}
document.querySelectorAll('select').forEach(enhanceSelect);

refresh();
requestAnimationFrame(animateWorld);
setInterval(refresh, 250);
window.addEventListener('resize', () => { if (state) { drawWorld(); drawHistory(); inspectAgent().catch(error => notify(error.message,true)); } });

let labState=null,labBusy=false;
async function refreshLab(){
 try{labState=await request('/api/autonomy');renderLab();}catch(error){$('labStatus').textContent='Lab status unavailable';$('labError').hidden=false;$('labError').textContent=error.message;}
}
function renderLab(){
 if(!labState)return;
 const names={'not-started':'Ready to train',running:'Training',paused:'Paused','round-budget-reached':'Round budget reached','heldout-evaluation':'Independent evaluation','task-milestones-met':'Task milestones met','heldout-not-confirmed':'Held-out result did not pass',error:'Needs attention'};
 $('labStatus').textContent=labState.activeTrack==='ecology'&&labState.running?'Ecology search':labState.stopping?'Pausing…':names[labState.status]||labState.status;
 $('labStage').textContent=labState.stageName;
 $('labProgress').textContent=labState.round!==undefined?`${Math.min(labState.stage,labState.totalStages)} / ${labState.totalStages} stages passed · ${labState.round} evaluation rounds · ${labState.promotions} parameter promotions`:'';
 $('startEcologyLab').disabled=labBusy||labState.running||labState.status!=='task-milestones-met';
 $('startLab').disabled=labBusy||labState.running;$('stopLab').disabled=labBusy||!labState.running||labState.stopping;
 $('startLab').textContent=['task-milestones-met','heldout-not-confirmed','error'].includes(labState.status)||labState.error?'New campaign':labState.round?'Resume':'Start campaign';
 $('labError').hidden=!labState.error;if(labState.error)$('labError').textContent=labState.error;
 const rows=labState.heldout||[],list=$('labEvidence');list.replaceChildren();
 if(rows.length){
  const table=document.createElement('table');table.className='lab-table';const head=document.createElement('tr');for(const label of ['Held-out task','Learned (95% interval)','Frozen','Memory reset','Learned − frozen (95% interval)']){const cell=document.createElement('th');cell.textContent=label;head.append(cell);}table.append(head);
  for(const row of rows){const summary=row.summary,tr=document.createElement('tr'),learned=summary.learned.mean,frozen=learned-summary.learnedMinusfrozen.mean,reset=learned-summary['learnedMinusmemory-reset'].mean;for(const value of [row.stage,`${(learned*100).toFixed(1)}% [${summary.learned.ci95.map(x=>(x*100).toFixed(1)).join(', ')}]`,`${(frozen*100).toFixed(1)}%`,`${(reset*100).toFixed(1)}%`,`${(summary.learnedMinusfrozen.mean*100).toFixed(1)} points [${summary.learnedMinusfrozen.ci95.map(x=>(x*100).toFixed(1)).join(', ')}]`]){const cell=document.createElement('td');cell.textContent=value;tr.append(cell);}table.append(tr);}list.append(table);
  const note=document.createElement('p');note.className='hint';note.textContent=`${rows[0].summary.learned.n} independent seed pairs per task. The held-out gate requires the accuracy interval's lower end to reach ${((labState.gates?.heldoutAccuracyLowerBound ?? .85)*100).toFixed(0)}%, plus a reliable gain over frozen and memory-reset controls. Habitat survival, human cognition, and RSI require separate evidence.`;list.append(note);
 }else if(labState.history?.length){const last=labState.history.at(-1);const note=document.createElement('p');note.textContent=`Latest fresh-seed gate: ${last.stage}, ${(last.accuracy.mean*100).toFixed(1)}% choice accuracy. ${last.stagePassed?'Stage gate passed.':'Stage gate not met; searching bounded parameter proposals.'}`;list.append(note);}
 if(labState.continual?.summary){const study=labState.continual,note=document.createElement('p');note.className='hint';note.textContent=`Sequential cue study: task A after learning B ${(study.summary.aAfter.mean*100).toFixed(1)}%; task B ${(study.summary.bAfter.mean*100).toFixed(1)}%, across ${study.summary.aAfter.n} seeds. These tasks use disjoint sensory channels; broader continual retention and ecological transfer remain open.${study.parentCueCampaign!==labState.id?' This study belongs to an earlier cue campaign.':''}`;list.append(note);}
 if(labState.ecologyConfirmation?.summary){const study=labState.ecologyConfirmation,gain=study.summary.learningGain,note=document.createElement('p');note.className='hint';note.textContent=`Locked-policy scarcity confirmation: ${gain.n} seed pairs; learning minus frozen energy ${gain.mean.toFixed(2)} per founder, 95% interval [${gain.ci95.map(x=>x.toFixed(2)).join(', ')}]. Mean population difference ${study.summary.populationDifference.mean.toFixed(2)}. ${study.passed?'The joint energy/survival gate passed.':'The joint energy/survival gate did not pass.'} This result concerns the locked policy and short scarcity task; later proposals require their own confirmation.`;list.append(note);}
 if(labState.ecology){const eco=labState.ecology,last=eco.history?.at(-1),note=document.createElement('p');note.className='hint';note.textContent=`Ecology: ${eco.stageName}, ${eco.round} rounds, ${eco.promotions} parameter promotions; ${eco.status}. ${last?.learningGain?`Latest tested proposal's learning minus frozen net energy: ${last.learningGain.mean.toFixed(2)} per founder, 95% interval [${last.learningGain.ci95.map(x=>x.toFixed(2)).join(', ')}].`:''} ${last?.promoted?'Proposal promoted.':'No proposal promotion recorded for this round.'} ${last?.stagePassed?'Environment gate passed.':'Environment gate not passed.'} Difficulty advances only for accepted settings with a positive learning-gain interval and no average survival loss.`;list.append(note);}
}
async function controlLab(action){if(labBusy)return;labBusy=true;renderLab();try{labState=await request('/api/autonomy',{action,...(action==='start-ecology'?{rounds:2,newCampaign:labState?.ecology?.status==='error'||Boolean(labState?.error)||(Boolean(labState?.ecology)&&labState.ecology.parentCueCampaign!==labState.id)}:{}),...(action==='start'?{rounds:12,newCampaign:['task-milestones-met','heldout-not-confirmed','error'].includes(labState?.status)||Boolean(labState?.error)}:{})});}catch(error){notify(error.message,true);}finally{labBusy=false;renderLab();setTimeout(refreshLab,500);}}
$('startEcologyLab').onclick=()=>controlLab('start-ecology');$('startLab').onclick=()=>controlLab('start');$('stopLab').onclick=()=>controlLab('stop');
refreshLab();setInterval(refreshLab,5000);
