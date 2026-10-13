import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {EcosystemManager} from './manager.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const files = new Map([['/', ['index.html', 'text/html']], ['/app.js', ['app.js', 'text/javascript']],
  ['/style.css', ['style.css', 'text/css']]]);

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
  realtime = true} = {}) {
  const manager = new EcosystemManager(directory);
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
        return json(res, unhealthy ? 503 : 200, {ok: !unhealthy, ecosystems: manager.experiments.size});
      }
      if (path === '/api/ecosystems') {
        if (req.method === 'GET') return json(res, 200, manager.list());
        if (req.method === 'POST') return json(res, 201, await manager.create(await body(req)));
      }
      const match = path.match(/^\/api\/ecosystems\/([^/]+)(?:\/(control|fork|checkpoint|checkpoints|agents)(?:\/(\d+))?)?$/);
      if (match) {
        const [, id, action, agentId] = match;
        if (req.method === 'GET') {
          if (!action) return json(res, 200, manager.state(id));
          if (action === 'agents' && agentId) return json(res, 200, manager.inspect(id, Number(agentId)));
          if (action === 'checkpoints' && !agentId) return json(res, 200, await manager.checkpoints(id));
          if (action === 'checkpoint' && !agentId) {
            res.setHeader('Content-Disposition', `attachment; filename="ecosystem-${manager.get(id).id}.json"`);
            return json(res, 200, manager.get(id).world.checkpoint());
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
  const timer = realtime && setInterval(() => {
    const now = performance.now();
    manager.advanceRealtime((now - last) / 1000);
    last = now;
  }, 20);
  let saving = false;
  const autosave = realtime && setInterval(async () => {
    if (saving) return;
    saving = true;
    try { await manager.flush(); } catch (error) { console.error(error.message); }
    finally { saving = false; }
  }, 15_000);
  let closing;
  return {manager, server, close() {
    if (closing) return closing;
    clearInterval(timer);
    clearInterval(autosave);
    closing = (async () => {
      // Stop accepting controls before the final checkpoint; pending controls finish first.
      await new Promise(done => server.close(done));
      await manager.close();
    })();
    return closing;
  }};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const platform = await createPlatform({directory: process.env.PLATFORM_RUNS_DIR || resolve(ROOT, 'runs/platform'),
    port: Number(process.env.PLATFORM_PORT || 8767)});
  console.log(`Neural ecosystem platform: http://127.0.0.1:${platform.server.address().port}`);
  const stop = () => platform.close().then(() => process.exit(0), error => {
    console.error(error.message); process.exit(1);
  });
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}
