import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {EcosystemManager} from './manager.mjs';
import {WorkerEcosystemManager} from './worker-manager.mjs';
import {AutonomyService} from './autonomy.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const files = new Map([['/', ['index.html', 'text/html']], ['/app.js', ['app.js', 'text/javascript']],
  ['/style.css', ['style.css', 'text/css']], ['/controller-adapter.mjs', ['../controller-adapter.mjs', 'text/javascript']]]);

async function body(req) {
  if (req.headers['content-type'] !== 'application/json') throw Object.assign(Error('JSON required'), {status: 415});
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 32_768) throw Object.assign(Error('Request too large'), {status: 413});
    chunks.push(chunk);
  }
  const data = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('Request must be an object');
  return data;
}

export async function createPlatform({directory = resolve(ROOT, 'runs/platform'), port = 8767,
  realtime = true, autonomyDirectory = resolve(ROOT, 'runs/autonomy'), workers = false} = {}) {
  const manager = workers ? new WorkerEcosystemManager(directory) : new EcosystemManager(directory);
  const autonomy = new AutonomyService(autonomyDirectory);
  const sourceSha256 = {};
  for (const file of ['../engine.mjs','../challenges.mjs','../learning/trace-actor.mjs','../learning/episodic.mjs','../learning/episodic-actor.mjs','../learning/joint-episodic.mjs','./manager.mjs','./worker-manager.mjs','./worker-world.mjs','./world-worker.mjs','../persistence.mjs','../telemetry.mjs','./controller-adapter.mjs','./server.mjs'])
    sourceSha256[file.replace('../','').replace('./','platform/')] = createHash('sha256').update(await readFile(new URL(file, import.meta.url))).digest('hex');
  await manager.init();
  const json = (res, status, data) => {
    res.writeHead(status, {'Content-Type': 'application/json', 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'});
    res.end(JSON.stringify(data));
  };
  const server = http.createServer(async (req, res) => {
    try {
      const address = server.address();
      const hosts = [`127.0.0.1:${address.port}`, `localhost:${address.port}`];
      if (!hosts.includes(req.headers.host)) return json(res, 403, {error: 'Local host required'});
      if (req.method === 'POST' && req.headers.origin &&
          !hosts.some(host => req.headers.origin === `http://${host}`)) {
        return json(res, 403, {error: 'Same-origin requests only'});
      }
      const path = new URL(req.url, 'http://127.0.0.1').pathname;
      if (req.method === 'GET' && path === '/healthz') {
        const unhealthy = manager.list().some(entry => entry.error);
        return json(res, unhealthy ? 503 : 200, {ok: !unhealthy, ecosystems: manager.experiments.size, runtime: workers ? 'workers' : 'main'});
      }
      if (path === '/api/autonomy') {
        if (req.method === 'GET') return json(res, 200, await autonomy.status());
        if (req.method === 'POST') return json(res, 200, await autonomy.control(await body(req)));
      }
      if (path === '/api/ecosystems') {
        if (req.method === 'GET') return json(res, 200, manager.list());
        if (req.method === 'POST') return json(res, 201, await manager.create(await body(req)));
      }
      const match = path.match(/^\/api\/ecosystems\/([^/]+)(?:\/(control|fork|checkpoint|checkpoints|agents|frame|lineage|events)(?:\/(\d+))?)?$/);
      if (match) {
        const [, id, action, agentId] = match;
        if (req.method === 'GET') {
          if (action === 'frame' && !agentId) {
            const url = new URL(req.url, 'http://127.0.0.1');
            const sinceTick = Number(url.searchParams.get('sinceTick') || 0);
            const sinceEvent = Number(url.searchParams.get('sinceEvent') || 0);
            if (![sinceTick,sinceEvent].every(value => Number.isSafeInteger(value) && value >= 0)) throw Error('Invalid frame cursor');
            return json(res, 200, await manager.frame(id,{sinceTick,sinceEvent}));
          }
          if (action === 'lineage' && !agentId) {
            const url = new URL(req.url, 'http://127.0.0.1');
            return json(res, 200, await manager.lineage(id, {offset: Number(url.searchParams.get('offset') || 0),
              limit: Number(url.searchParams.get('limit') || 100)}));
          }
          if (action === 'events' && !agentId) {
            const url = new URL(req.url, 'http://127.0.0.1');
            return json(res, 200, await manager.eventPage(id,{offset: Number(url.searchParams.get('offset') || 0),
              limit: Number(url.searchParams.get('limit') || 100)}));
          }
          if (!action) return json(res, 200, await manager.state(id));
          if (action === 'agents' && agentId) return json(res, 200, await manager.inspect(id, Number(agentId)));
          if (action === 'checkpoints' && !agentId) return json(res, 200, await manager.checkpoints(id));
          if (action === 'checkpoint' && !agentId) {
            const entry = manager.get(id);
            const checkpoint = await manager.exclusive(entry, () => entry.world.checkpoint());
            res.setHeader('Content-Disposition', `attachment; filename="ecosystem-${entry.id}.json"`);
            return json(res, 200, {...checkpoint, provenance: {exportedAt: new Date().toISOString(),
              ecosystemId: entry.id, parentId: entry.parentId, seed: checkpoint.world.config.seed,
              config: checkpoint.world.config, sourceSha256}});
          }
        }
        if (req.method === 'POST' && !agentId) {
          if (action === 'control') return json(res, 200, await manager.control(id, await body(req)));
          if (action === 'fork') return json(res, 201, await manager.fork(id, (await body(req)).name));
        }
      }
      if (req.method === 'GET' && files.has(path)) {
        const [name, type] = files.get(path);
        const data = await readFile(new URL(`./web/${name}`, import.meta.url));
        res.writeHead(200, {'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-cache',
          'X-Content-Type-Options': 'nosniff'});
        return res.end(data);
      }
      return json(res, 404, {error: 'Route not found'});
    } catch (error) {
      json(res, error.status || 400, {error: error.message});
    }
  });
  await new Promise((done, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', done);
  });
  let last = performance.now();
  let timer, stopped = false;
  const pump = () => {
    if (stopped) return;
    const now = performance.now();
    const backlog = manager.advanceRealtime((now - last) / 1000);
    last = now;
    // Keep the bounded compute chunk, yield to I/O, then catch up promptly
    // while requested ticks remain. Idle habitats do not busy-spin.
    timer = setTimeout(pump, backlog ? 0 : 10);
  };
  if (realtime) timer = setTimeout(pump, 10);
  let saving = false;
  const autosave = realtime && setInterval(async () => {
    if (saving) return;
    saving = true;
    try { await manager.flush(); } catch (error) { console.error(error.message); }
    finally { saving = false; }
  }, 15_000);
  let closing;
  return {manager, autonomy, server, close() {
    if (closing) return closing;
    stopped = true;
    clearTimeout(timer);
    clearInterval(autosave);
    closing = (async () => {
      // Stop accepting controls before the final checkpoint; pending controls finish first.
      await new Promise(done => server.close(done));
      await autonomy.close();
      await manager.close();
    })();
    return closing;
  }};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const platform = await createPlatform({directory: process.env.PLATFORM_RUNS_DIR || resolve(ROOT, 'runs/platform'),
    port: Number(process.env.PLATFORM_PORT || 8767), workers: process.env.PLATFORM_WORLD_WORKERS === '1'});
  console.log(`Neural ecosystem platform: http://127.0.0.1:${platform.server.address().port}`);
  const stop = () => platform.close().then(() => process.exit(0), error => {
    console.error(error.message); process.exit(1);
  });
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}
