// Live microverse viewer: runs microverse/sim.mjs in the browser (no server work).
import { Microverse, ODOR_BITS } from '/microverse/sim.mjs';
import { STRAINS } from '/microverse/strains.mjs';
import { CONFIG } from '/microverse/config.mjs';

const $ = id => document.getElementById(id);
const COLORS = { SELF: '#edcf70', FIXED: '#99cae8', SHAM: '#c99ae8', EVO: '#8fd3c1', ORACLE: '#f19a6b' };
const LABELS = { SELF: 'Self-improving', FIXED: 'Fixed program', SHAM: 'Fake self-improver', EVO: 'Mutation only', ORACLE: 'Born knowing the rule' };
const MOVE_NAMES = ['bias', 'food here', 'good food here', 'smell', 'crowding', 'energy', 'near smell', 'far smell', 'toward best food', 'worth staying'];
const world = $('world'), ctx = world.getContext('2d'), chart = $('chart'), cctx = chart.getContext('2d');
let w, names, history, running = true, selected = null, frames = 0;

function reset() {
  names = $('scenario').value.split(',');
  const seed = Math.max(1, Math.floor(+$('seed').value || 1));
  w = new Microverse(seed, Object.fromEntries(names.map(n => [n, STRAINS[n]])), CONFIG);
  history = []; selected = null; renderFly();
  $('legend').innerHTML = names.map(n => `<span><i style="background:${COLORS[n]}"></i>${LABELS[n]}</span>`).join('') +
    '<span><b style="background:#7fc97a"></b>nutritious food</span><span><b style="background:#d9827a"></b>toxic food</span>';
  draw();
}

function draw() {
  const N = w.cfg.size, c = world.width / N;
  ctx.fillStyle = '#121924'; ctx.fillRect(0, 0, world.width, world.height);
  for (let k = 0; k < w.plant.length; k++) {
    const p = w.plant[k]; if (!p) continue;
    const a = Math.max(.08, p.amount / w.cfg.plantCap);
    ctx.fillStyle = w.kindValence[p.kind] > 0 ? `rgba(127,201,122,${a})` : `rgba(217,130,122,${a})`;
    ctx.fillRect((k % N) * c + 1, Math.floor(k / N) * c + 1, c - 2, c - 2);
  }
  for (const f of w.flies) {
    ctx.beginPath(); ctx.arc(f.x * c + c / 2, f.y * c + c / 2, f === selected ? c * .48 : c * .32, 0, 7);
    ctx.fillStyle = COLORS[f.strain]; ctx.fill();
    if (f === selected) { ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); }
  }
  const left = w.ruleEnds - w.tick;
  $('ruleLabel').textContent = `food rule: ${w.rule.family} · changes in ${left}`;
  $('mTick').textContent = w.tick.toLocaleString(); $('mPop').textContent = w.flies.length;
  $('mBirths').textContent = w.stats.births.toLocaleString(); $('mDeaths').textContent = w.stats.deaths.toLocaleString();
  drawChart();
}

function drawChart() {
  const W = chart.width, H = chart.height; cctx.clearRect(0, 0, W, H);
  cctx.strokeStyle = '#303644'; cctx.lineWidth = 1; cctx.beginPath(); cctx.moveTo(0, H - .5); cctx.lineTo(W, H - .5); cctx.stroke();
  if (history.length < 2) return;
  const max = Math.max(10, ...history.flatMap(h => names.map(n => h[n])));
  for (const n of names) {
    cctx.beginPath(); cctx.strokeStyle = COLORS[n]; cctx.lineWidth = 2;
    history.forEach((h, i) => { const x = i / (history.length - 1) * W, y = H - 4 - h[n] / max * (H - 12); i ? cctx.lineTo(x, y) : cctx.moveTo(x, y); });
    cctx.stroke();
  }
  cctx.fillStyle = '#adb5c3'; cctx.font = '12px ui-monospace,monospace'; cctx.fillText(`${max} flies`, 6, 14);
}

function renderStrains() {
  const s = w.snapshot().strains, held = w.rule.target.length;
  $('strains').innerHTML = names.map(n => { const v = s[n]; return `<div class="strain" style="border-color:${COLORS[n]}"><h3 style="color:${COLORS[n]}">${LABELS[n]}</h3>
    <div class="grid2"><div><span>Flies</span><strong>${v.n}</strong></div><div><span>Taste skill</span><strong>${v.n ? (v.skill * 100).toFixed(0) + '%' : '—'}</strong></div>
    <div><span>Rule terms found</span><strong>${v.n ? v.targetsHeld.toFixed(1) + ' / ' + held : '—'}</strong></div><div><span>Generation</span><strong>${v.n ? v.gen.toFixed(1) : '—'}</strong></div>
    <div><span>Taste features</span><strong>${v.n ? v.tasteMasks.toFixed(1) : '—'}</strong></div><div><span>Movement senses</span><strong>${v.n ? v.moveMasks.toFixed(1) : '—'}</strong></div></div></div>`; }).join('') +
    '<p class="subtle">Taste skill: how much more often a fly eats nutritious than toxic food right now. Rule terms found: how many of the hidden rule\'s pieces its taste program holds.</p>';
}

const bitsOf = m => [...Array(ODOR_BITS).keys()].filter(b => m >> b & 1).map(b => b + 1);
function renderFly() {
  const f = selected && w.flies.includes(selected) ? selected : null;
  if (!f) { $('fly').innerHTML = selected ? 'That fly has died. Click another one.' : 'Click a fly on the map to inspect its inherited program and what it has learned.'; return; }
  const t = f.brain.taste, mv = f.brain.move, target = new Set(w.rule.target);
  const taste = t.masks.filter(m => m).map(m => `<code class="${target.has(m) ? 'hit' : ''}">${bitsOf(m).join('·')}</code>`).join('');
  const move = mv.masks.map((m, i) => `<code title="weight ${mv.w[i].toFixed(2)}">${MOVE_NAMES.filter((_, b) => m >> b & 1).join(' × ')}</code>`).join('');
  const trust = t.lossModel === undefined ? 'not yet' : t.lossModel < t.lossBase ? 'yes' : 'no — guessing the base rate';
  $('fly').innerHTML = `<div class="grid2"><div><span>Fly</span><strong>#${f.id}</strong></div><div><span>Lineage</span><strong style="color:${COLORS[f.strain]}">${LABELS[f.strain]}</strong></div>
    <div><span>Energy</span><strong>${f.energy.toFixed(0)}</strong></div><div><span>Age</span><strong>${f.age}</strong></div>
    <div><span>Generation</span><strong>${f.gen}</strong></div><div><span>Meals good / toxic</span><strong>${f.eaten.good} / ${f.eaten.bad}</strong></div></div>
    <p class="subtle" style="margin:14px 0 4px">Taste features (odor bits combined; highlighted = part of the current hidden rule)</p><div class="chips">${taste || '<code>none</code>'}</div>
    <p class="subtle" style="margin:14px 0 4px">Trusts its taste model: ${trust}</p>
    <p class="subtle" style="margin:14px 0 4px">Movement senses</p><div class="chips">${move}</div>`;
}

world.addEventListener('click', e => {
  const r = world.getBoundingClientRect(), N = w.cfg.size, x = Math.floor((e.clientX - r.left) / r.width * N), y = Math.floor((e.clientY - r.top) / r.height * N);
  let best = null, bd = 9; for (const f of w.flies) { const d = Math.abs(f.x - x) + Math.abs(f.y - y); if (d < bd) { bd = d; best = f; } }
  selected = bd <= 2 ? best : null; renderFly(); draw();
});
$('play').addEventListener('click', () => { running = !running; $('play').textContent = running ? 'Pause' : 'Play'; });
$('reset').addEventListener('click', reset);
$('scenario').addEventListener('change', reset);
$('seed').addEventListener('change', reset);

function loop() {
  if (running && w.flies.length) {
    const steps = +$('speed').value;
    for (let i = 0; i < steps && w.flies.length; i++) {
      w.step();
      if (w.tick % 20 === 0) { const c = {}; for (const n of names) c[n] = 0; for (const f of w.flies) c[f.strain]++; history.push(c); if (history.length > 600) history.splice(0, history.length - 600); }
    }
    draw(); if (++frames % 10 === 0) { renderStrains(); renderFly(); }
    if (!w.flies.length) { $('ruleLabel').textContent = 'extinct — press New world'; running = false; $('play').textContent = 'Play'; }
  }
  requestAnimationFrame(loop);
}
reset(); renderStrains(); loop();
