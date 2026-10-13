const $ = id => document.getElementById(id);
let selectedId = null;
let selectedAgent = null;
let state = null;
let polling = false;
let acting = false;
let noticeTimer;
let forkSource = null;
let revision = 0;

async function request(path, data) {
  const response = await fetch(path, data === undefined ? {} : {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw Error(result.error || `Request failed (${response.status})`);
  return result;
}

function notify(message, error = false) {
  clearTimeout(noticeTimer);
  $('notice').textContent = message;
  $('notice').hidden = false;
  if (!error) noticeTimer = setTimeout(() => { $('notice').hidden = true; }, 5000);
}

function listEcosystems(items) {
  $('ecosystemList').replaceChildren();
  for (const item of items) {
    const button = document.createElement('button');
    button.className = `ecosystem-card${item.id === selectedId ? ' active' : ''}`;
    button.setAttribute('aria-pressed', String(item.id === selectedId));
    const name = document.createElement('strong');
    name.textContent = item.name;
    const meta = document.createElement('small');
    meta.textContent = `${item.metrics.population} agents · ${item.metrics.seconds.toFixed(1)}s · ${item.paused ? 'paused' : 'running'}`;
    button.append(name, meta);
    button.onclick = () => selectEcosystem(item.id);
    $('ecosystemList').append(button);
  }
}

async function selectEcosystem(id) {
  revision++;
  selectedId = id;
  selectedAgent = null;
  state = null;
  $('individual').textContent = 'Select an agent to inspect inherited traits and acquired state.';
  $('brain').getContext('2d').clearRect(0, 0, 440, 300);
  $('brainLegend').textContent = '';
  try {
    const result = await request(`/api/ecosystems/${id}`);
    if (selectedId !== id) return;
    state = result;
    render();
    await refreshCheckpoints(id);
    await refresh();
  } catch (error) { notify(error.message, true); }
}

async function refresh() {
  if (polling || acting) return;
  polling = true;
  try {
    const items = await request('/api/ecosystems');
    listEcosystems(items);
    const firstSelection = !selectedId && items.length > 0;
    if (firstSelection) {
      selectedId = items[0].id;
      selectedAgent = null;
    }
    const id = selectedId;
    const currentRevision = revision;
    if (id) {
      const result = await request(`/api/ecosystems/${id}`);
      if (id === selectedId && currentRevision === revision && !acting) {
        state = result;
        render();
        await inspectAgent();
        if (firstSelection) await refreshCheckpoints(id);
      }
    }
    $('connection').textContent = 'Local lab connected';
  } catch (error) {
    $('connection').textContent = 'Connection interrupted';
    notify(error.message, true);
  } finally { polling = false; }
}

async function control(command) {
  if (!selectedId || acting) return;
  const id = selectedId;
  revision++;
  acting = true;
  try {
    const result = await request(`/api/ecosystems/${id}/control`, command);
    if (selectedId === id) {
      state = result;
      render();
      await inspectAgent();
      if (['checkpoint', 'restore'].includes(command.action)) await refreshCheckpoints(id);
    }
    if (command.action === 'checkpoint') notify('Checkpoint saved.');
    if (command.action === 'restore') notify('Checkpoint restored. The previous state was archived; the ecosystem is paused.');
    if (command.action === 'configure') notify('Habitat settings updated and recorded.');
  } catch (error) { notify(error.message, true); }
  finally { acting = false; }
}

async function refreshCheckpoints(id) {
  const names = await request(`/api/ecosystems/${id}/checkpoints`);
  if (selectedId !== id) return;
  const previous = $('checkpoints').value;
  $('checkpoints').replaceChildren(new Option('Choose a checkpoint', ''),
    ...names.map(name => new Option(`Tick ${name.match(/tick-(\d+)/)[1]} · ${new Date(Number(name.split('-')[1])).toLocaleTimeString()}`, name)));
  if (names.includes(previous)) $('checkpoints').value = previous;
}

function render() {
  if (!state) return;
  const metrics = state.metrics;
  const ecosystem = state.ecosystem;
  $('empty').hidden = true;
  $('workspace').hidden = false;
  $('name').textContent = ecosystem.name;
  $('model').textContent = `ARTIFICIAL NEURAL AGENTS · SEED ${state.config.seed}`;
  $('status').textContent = ecosystem.error ? 'Needs attention' : metrics.status === 'extinct' ? 'Extinct' :
    metrics.status === 'capacity' ? 'Capacity reached' : ecosystem.paused ? 'Paused' : 'Running';
  $('run').textContent = ecosystem.paused ? 'Run ecosystem' : 'Pause';
  $('run').disabled = metrics.status !== 'running' || Boolean(ecosystem.error);
  $('speed').value = String(ecosystem.speed);
  $('export').href = `/api/ecosystems/${ecosystem.id}/checkpoint`;
  $('phase').textContent = state.challenge ? `${state.challenge.name} · ${Math.ceil(state.challenge.remaining)}s remaining` : 'Original habitat';
  $('time').textContent = `${metrics.seconds.toFixed(1)} artificial seconds`;
  $('saved').textContent = ecosystem.savedAt ? `Saved ${new Date(ecosystem.savedAt).toLocaleTimeString()}` : 'Automatic checkpoints every 15s';
  $('accounting').textContent = `Energy balance residual ${metrics.accountingError.toExponential(2)} · Mean acquired weight change ${metrics.learnedMagnitude.toFixed(5)}. Extinction does not trigger reseeding.`;
  $('metrics').replaceChildren();
  for (const [label, value] of [['Living agents', metrics.population], ['Births / deaths', `${metrics.births} / ${metrics.deaths}`],
    ['Deepest ancestry', state.telemetry.deepestEver], ['Mean neurons', metrics.meanNodes.toFixed(1)]]) {
    const box = document.createElement('div'); box.className = 'metric';
    const title = document.createElement('span'); title.textContent = label;
    const number = document.createElement('strong'); number.textContent = value;
    box.append(title, number); $('metrics').append(box);
  }
  if (!$('settings').contains(document.activeElement)) {
    for (const key of ['nutrient', 'capacity']) $(key).value = state.config[key];
    for (const key of ['learning', 'mutation', 'seasonal']) $(key).checked = state.config[key];
    $('capacity').min = Math.max(state.config.founders, metrics.population);
  }
  const archived = state.lineage.filter(agent => agent.died !== null).slice(-25);
  $('agents').replaceChildren(new Option('Choose an agent', ''),
    ...state.flies.map(agent => new Option(`Agent ${agent.id} · G${agent.generation}`, agent.id)),
    ...archived.map(agent => new Option(`Agent ${agent.id} · archived`, agent.id)));
  $('agents').value = selectedAgent || '';
  $('events').replaceChildren();
  for (const event of [...state.events].reverse().slice(0, 20)) {
    const row = document.createElement('div'); row.className = 'event';
    const text = document.createElement('div'); text.textContent = event.text;
    const time = document.createElement('small'); time.textContent = `${(event.tick * .1).toFixed(1)}s`;
    row.append(text, time); $('events').append(row);
  }
  if (ecosystem.error) notify(ecosystem.error, true);
  drawWorld();
  drawHistory();
}

function drawWorld() {
  const context = $('world').getContext('2d');
  context.fillStyle = '#101c16'; context.fillRect(0, 0, 1000, 640);
  context.strokeStyle = '#233328'; context.lineWidth = .5;
  for (let x = 0; x <= 1000; x += 50) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, 640); context.stroke(); }
  for (let y = 0; y <= 640; y += 50) { context.beginPath(); context.moveTo(0, y); context.lineTo(1000, y); context.stroke(); }
  for (const food of state.food) {
    if (food.amount < .02) continue;
    context.fillStyle = `rgba(237,207,112,${Math.min(.7, food.amount * .3)})`;
    context.beginPath(); context.arc(food.x, food.y, 1 + Math.sqrt(food.amount) * 2, 0, Math.PI * 2); context.fill();
  }
  for (const obstacle of state.obstacles) {
    context.fillStyle = '#304039'; context.beginPath(); context.arc(obstacle.x, obstacle.y, obstacle.r, 0, Math.PI * 2); context.fill();
  }
  const zone = state.challenge?.hazard || state.challenge?.bloom;
  if (zone) {
    context.strokeStyle = state.challenge.hazard ? '#e99578' : '#e3d47e';
    context.setLineDash([8, 7]); context.beginPath(); context.arc(zone.x, zone.y, zone.r, 0, Math.PI * 2); context.stroke(); context.setLineDash([]);
  }
  for (const agent of state.flies) {
    context.save(); context.translate(agent.x, agent.y); context.rotate(agent.heading);
    context.fillStyle = `hsl(${90 + agent.color * 130},50%,${40 + agent.energy / 5}%)`;
    context.beginPath(); context.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#edf4e6'; context.beginPath(); context.arc(5, 0, 1.5, 0, Math.PI * 2); context.fill();
    if (agent.id === selectedAgent) { context.strokeStyle = '#f0f5e5'; context.beginPath(); context.arc(0, 0, 15, 0, Math.PI * 2); context.stroke(); }
    context.restore();
  }
}

function drawHistory() {
  const context = $('history').getContext('2d');
  context.clearRect(0, 0, 1000, 140);
  const points = [...state.history];
  if (points.at(-1)?.tick !== state.metrics.tick) points.push(state.metrics);
  if (!points.length) return;
  const max = Math.max(10, ...points.map(point => point.population));
  const first = points[0].tick;
  const span = Math.max(1, points.at(-1).tick - first);
  context.fillStyle = '#a2b3a6'; context.font = '12px system-ui';
  context.fillText(String(max), 4, 16); context.fillText('0', 4, 125);
  context.strokeStyle = '#c7eea6'; context.lineWidth = 2; context.beginPath();
  points.forEach((point, index) => {
    const x = 35 + (point.tick - first) / span * 950;
    const y = 125 - point.population / max * 110;
    if (index) context.lineTo(x, y); else context.moveTo(x, y);
  });
  context.stroke();
}

async function inspectAgent() {
  if (!selectedId || !selectedAgent) return;
  const id = selectedId, agentId = selectedAgent;
  const detail = await request(`/api/ecosystems/${id}/agents/${agentId}`);
  if (id !== selectedId || agentId !== selectedAgent) return;
  $('individual').replaceChildren();
  if (!detail.genome) {
    $('individual').textContent = detail.archived ? `Agent ${agentId} died at ${(detail.archived.died * .1).toFixed(1)}s. Parents: ${detail.archived.parents.join(' + ') || 'founder'}. Its ancestry is retained; its lifetime neural state is not.` : 'Agent is unavailable.';
    $('brain').getContext('2d').clearRect(0, 0, 440, 300);
    $('brainLegend').textContent = '';
    return;
  }
  const title = document.createElement('h3'); title.textContent = `Agent ${detail.id} · generation ${detail.generation}`;
  const traits = document.createElement('div'); traits.className = 'traits';
  const change = detail.brain.plastic.reduce((total, weight) => total + Math.abs(weight), 0);
  for (const [label, value] of [['Parents', detail.parents.join(' + ') || 'Founder'], ['Age', `${detail.age.toFixed(1)}s`],
    ['Energy', detail.energy.toFixed(1)], ['Children', detail.offspring], ['Neurons / edges', `${detail.genome.nodes.length} / ${detail.genome.edges.length}`],
    ['Acquired change', change.toFixed(4)], ['Inherited speed', detail.genome.traits.speed.toFixed(1)], ['Learning rate', detail.genome.traits.learningRate.toFixed(4)]]) {
    const box = document.createElement('div'), name = document.createElement('span'), number = document.createElement('strong');
    name.textContent = label; number.textContent = value; box.append(name, number); traits.append(box);
  }
  $('individual').append(title, traits);
  drawBrain(detail);
}

function drawBrain(agent) {
  const context = $('brain').getContext('2d');
  context.clearRect(0, 0, 440, 300);
  const positions = new Map();
  ['input', 'hidden', 'output'].forEach((kind, column) => {
    const nodes = agent.genome.nodes.filter(node => node.kind === kind);
    context.fillStyle = '#a2b3a6'; context.font = '11px system-ui'; context.fillText(kind, 20 + column * 170, 16);
    nodes.forEach((node, index) => positions.set(node.id, [30 + column * 170, 30 + (index + .5) * 250 / nodes.length]));
  });
  agent.genome.edges.forEach((edge, index) => {
    const start = positions.get(edge.from), end = positions.get(edge.to);
    context.strokeStyle = edge.w + agent.brain.plastic[index] >= 0 ? '#8fbe7470' : '#d2927c70';
    context.lineWidth = .8; context.beginPath(); context.moveTo(...start); context.lineTo(...end); context.stroke();
  });
  for (const node of agent.genome.nodes) {
    const [x, y] = positions.get(node.id);
    context.fillStyle = `rgba(199,238,166,${.3 + Math.min(1, Math.abs(agent.brain.activity[node.id])) * .7})`;
    context.beginPath(); context.arc(x, y, 4, 0, Math.PI * 2); context.fill();
    if (node.kind === 'output') { context.fillStyle = '#a2b3a6'; context.fillText(state.interface.outputs[node.id - state.interface.inputs.length], x + 10, y + 4); }
  }
  $('brainLegend').textContent = 'Green edges: positive weights. Coral: negative. Brightness: current activity. Learned changes are individual; children inherit the genome.';
}

const openCreate = () => { $('createError').textContent = ''; $('createDialog').showModal(); };
$('new').onclick = openCreate;
$('first').onclick = openCreate;
$('cancel').onclick = () => $('createDialog').close();
$('create').onsubmit = async event => {
  event.preventDefault();
  const submit = event.submitter; submit.disabled = true;
  try {
    const data = new FormData(event.target), config = {};
    for (const key of ['seed', 'founders', 'capacity', 'nutrient']) config[key] = Number(data.get(key));
    for (const key of ['learning', 'mutation', 'seasonal']) config[key] = data.has(key);
    config.challenges = data.get('challenges');
    const result = await request('/api/ecosystems', {name: data.get('name'), config});
    $('createDialog').close(); await selectEcosystem(result.ecosystem.id);
  } catch (error) { $('createError').textContent = error.message; }
  finally { submit.disabled = false; }
};
$('run').onclick = () => control({action: state.ecosystem.paused ? 'run' : 'pause'});
$('step').onclick = () => control({action: 'step', ticks: 10});
$('advance').onclick = () => control({action: 'step', ticks: 100});
$('speed').onchange = event => control({action: 'speed', value: Number(event.target.value)});
$('save').onclick = () => control({action: 'checkpoint'});
$('restore').onclick = () => { if ($('checkpoints').value) control({action: 'restore', name: $('checkpoints').value}); };
$('settings').onsubmit = event => {
  event.preventDefault();
  control({action: 'configure', config: {nutrient: Number($('nutrient').value), capacity: Number($('capacity').value),
    learning: $('learning').checked, mutation: $('mutation').checked, seasonal: $('seasonal').checked}});
};
$('fork').onclick = () => {
  forkSource = selectedId; $('forkName').value = `${state.ecosystem.name.slice(0, 65)} — branch`;
  $('forkError').textContent = ''; $('forkDialog').showModal();
};
$('cancelFork').onclick = () => $('forkDialog').close();
$('forkForm').onsubmit = async event => {
  event.preventDefault(); const submit = event.submitter; submit.disabled = true;
  try {
    const result = await request(`/api/ecosystems/${forkSource}/fork`, {name: $('forkName').value});
    $('forkDialog').close(); await selectEcosystem(result.ecosystem.id);
  } catch (error) { $('forkError').textContent = error.message; }
  finally { submit.disabled = false; }
};
$('agents').onchange = async event => {
  selectedAgent = Number(event.target.value) || null;
  if (!selectedAgent) { $('individual').textContent = 'Select an agent to inspect its network.'; $('brain').getContext('2d').clearRect(0, 0, 440, 300); $('brainLegend').textContent = ''; }
  try { await inspectAgent(); if (state) drawWorld(); } catch (error) { notify(error.message, true); }
};
$('world').onclick = async event => {
  if (!state) return;
  const bounds = event.target.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width * state.width;
  const y = (event.clientY - bounds.top) / bounds.height * state.height;
  const agent = [...state.flies].sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
  if (!agent || Math.hypot(agent.x - x, agent.y - y) > 30) return;
  selectedAgent = agent.id; $('agents').value = String(agent.id);
  try { await inspectAgent(); drawWorld(); } catch (error) { notify(error.message, true); }
};
refresh();
setInterval(refresh, 1500);
