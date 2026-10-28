import {randomUUID} from 'node:crypto';
import {readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {World, DT, INPUTS, OUTPUTS, validateConfig} from '../engine.mjs';
import {CheckpointStore} from '../persistence.mjs';
import {telemetry} from '../telemetry.mjs';
import {compactControllerView} from './controller-adapter.mjs';

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const CONFIG_KEYS = new Set(['seed', 'founders', 'capacity', 'learning', 'mutation', 'nutrient', 'seasonal', 'challenges', 'ecology', 'signalMode', 'controller', 'actorParameters', 'episodicParameters', 'reproduction']);
export const EDITABLE = new Set(['capacity', 'learning', 'mutation', 'nutrient', 'seasonal', 'ecology', 'signalMode']);

export function configObject(config, keys) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw Error('Configuration must be an object');
  for (const key of Object.keys(config)) if (!keys.has(key)) throw Error(`Unsupported setting: ${key}`);
  return config;
}

export function nameOf(name) {
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) throw Error('Name must contain 1–80 characters');
  return name.trim();
}

// Each experiment owns its World, RNG, genomes, acquired state and checkpoint queue.
export class EcosystemManager {
  constructor(directory) {
    this.directory = directory;
    this.experiments = new Map();
    this.cursor = 0;
    this.creations = Promise.resolve();
  }

  async init() {
    await new CheckpointStore(this.directory).init();
    for (const item of await readdir(this.directory, {withFileTypes: true})) {
      if (!ID.test(item.name)) continue;
      if (!item.isDirectory()) throw Error(`Invalid ecosystem directory: ${item.name}`);
      const store = new CheckpointStore(join(this.directory, item.name));
      const saved = await store.recover();
      if (!saved || saved.schema !== 1 || saved.id !== item.name ||
          !Number.isFinite(Date.parse(saved.createdAt)) || ![1, 5, 10].includes(saved.speed) ||
          !Number.isSafeInteger(saved.checkpointClock) || saved.checkpointClock < 0 ||
          (saved.parentId !== null && !ID.test(saved.parentId))) {
        throw Error(`Invalid ecosystem recovery: ${item.name}`);
      }
      const entry = this.entry(saved.id, nameOf(saved.name), World.restore(saved.checkpoint), store,
        saved.createdAt, saved.parentId);
      entry.speed = saved.speed;
      entry.savedAt = saved.savedAt;
      entry.checkpointClock = saved.checkpointClock || 0;
      // Restart never silently advances or reseeds an experiment.
      this.experiments.set(entry.id, entry);
    }
  }

  entry(id, name, world, store, createdAt = new Date().toISOString(), parentId = null) {
    return {id, name, world, store, createdAt, parentId, paused: true, speed: 1,
      savedAt: null, error: null, owed: 0, checkpointClock: 0, pending: 0, queue: Promise.resolve()};
  }

  get(id) {
    const entry = this.experiments.get(id);
    if (!entry) throw Object.assign(Error('Ecosystem not found'), {status: 404});
    return entry;
  }

  list() {
    return [...this.experiments.values()].map(entry => ({...this.metadata(entry), metrics: entry.world.metrics()}));
  }

  metadata(entry) {
    return {id: entry.id, name: entry.name, createdAt: entry.createdAt, parentId: entry.parentId,
      paused: entry.paused, speed: entry.speed, savedAt: entry.savedAt, error: entry.error};
  }

  state(id) {
    const entry = this.get(id);
    return {...entry.world.snapshot(), ecosystem: this.metadata(entry), telemetry: telemetry(entry.world),
      eventCount: entry.world.events.length, eventHasMore: entry.world.events.length > 100,
      interface: {inputs: INPUTS, outputs: OUTPUTS}};
  }

  frame(id, {sinceTick = 0, sinceEvent = 0} = {}) {
    const entry = this.get(id);
    const frame = entry.world.frame({sinceTick,sinceEvent});
    return {...frame,
      eventCount: entry.world.events.length,
      ecosystem: this.metadata(entry), telemetry: telemetry(entry.world),
      interface: {inputs: INPUTS, outputs: OUTPUTS}};
  }

  eventPage(id, {offset = 0, limit = 100} = {}) {
    if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 200)
      throw Error('Invalid event page');
    const items = this.get(id).world.events;
    const end = Math.max(0, items.length - offset);
    const start = Math.max(0, end - limit);
    return {total: items.length, offset, limit, hasMore: start > 0, items: items.slice(start,end)};
  }

  lineage(id, {offset = 0, limit = 100} = {}) {
    if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 500)
      throw Error('Invalid lineage page');
    const items = this.get(id).world.lineage;
    return {total: items.length, offset, limit, items: items.slice(offset, offset + limit)};
  }

  inspect(id, agentId) {
    if (!Number.isSafeInteger(agentId) || agentId < 1) throw Error('Invalid agent ID');
    const detail = this.get(id).world.inspect(agentId);
    return detail.genome ? {...detail, controllerView: compactControllerView(detail,{inputs:INPUTS,outputs:OUTPUTS})} : detail;
  }

  serialize(entry, savedAt = new Date().toISOString()) {
    return {schema: 1, id: entry.id, name: entry.name, createdAt: entry.createdAt,
      parentId: entry.parentId, speed: entry.speed, savedAt, checkpointClock: entry.checkpointClock,
      checkpoint: entry.world.checkpoint()};
  }

  async persist(entry) {
    const data = this.serialize(entry);
    try {
      await entry.store.save('autosave.json', data);
      entry.savedAt = data.savedAt;
      if (entry.error?.startsWith('Checkpoint failed:')) entry.error = null;
    } catch (error) {
      entry.paused = true;
      entry.error = `Checkpoint failed: ${error.message}`;
      throw error;
    }
  }

  checkpoints(id) {
    return this.get(id).store.list();
  }

  async archive(entry) {
    entry.checkpointClock = Math.max(Date.now(), entry.checkpointClock + 1);
    const name = `checkpoint-${entry.checkpointClock}-tick-${entry.world.tick}.json`;
    try {
      await entry.store.save(name, this.serialize(entry));
    } catch (error) {
      entry.paused = true;
      entry.error = `Checkpoint failed: ${error.message}`;
      throw error;
    }
    return name;
  }

  exclusive(entry, operation) {
    entry.pending++;
    const result = entry.queue.then(operation);
    entry.queue = result.catch(() => {});
    return result.finally(() => { entry.pending--; });
  }

  async add(name, world, parentId = null) {
    if (this.experiments.size >= 16) throw Error('This local workspace supports up to 16 ecosystems');
    const id = randomUUID();
    const store = new CheckpointStore(join(this.directory, id));
    await store.init();
    const entry = this.entry(id, nameOf(name), world, store, undefined, parentId);
    await this.persist(entry);
    this.experiments.set(id, entry);
    return this.state(id);
  }

  create({name, config = {}} = {}) {
    const validatedName = nameOf(name);
    const world = new World({founders: 24, capacity: 120, challenges: 'cycle',
      ...configObject(config, CONFIG_KEYS)});
    const result = this.creations.then(() => this.add(validatedName, world));
    this.creations = result.catch(() => {});
    return result;
  }

  fork(id, name) {
    const source = this.get(id);
    const validatedName = nameOf(name);
    return this.exclusive(source, async () => {
      const copy = World.restore(source.world.checkpoint());
      copy.record('fork', `Independent branch of ecosystem ${source.name} at tick ${copy.tick}`);
      const result = this.creations.then(() => this.add(validatedName, copy, id));
      this.creations = result.catch(() => {});
      return result;
    });
  }

  control(id, command = {}) {
    const entry = this.get(id);
    return this.exclusive(entry, async () => {
      const world = entry.world;
      let savedCheckpoint;
      switch (command.action) {
        case 'run':
          if (!world.flies.length || world.capacityReached) throw Error('Ecosystem stopped: extinction or population capacity');
          if (entry.error) throw Error('Resolve the reported error or restore a valid checkpoint before running');
          entry.paused = false;
          entry.owed = 0;
          break;
        case 'pause':
          entry.paused = true;
          entry.owed = 0;
          break;
        case 'step': {
          const ticks = command.ticks ?? 10;
          if (!Number.isSafeInteger(ticks) || ticks < 1 || ticks > 1000) throw Error('Step must be 1–1000 ticks');
          entry.paused = true;
          entry.owed = 0;
          try { world.advance(ticks); }
          catch (error) { entry.error = `Simulation failed: ${error.message}`; throw error; }
          break;
        }
        case 'speed':
          if (![1, 5, 10].includes(command.value)) throw Error('Speed must be 1, 5 or 10');
          entry.speed = command.value;
          break;
        case 'configure': {
          const changes = configObject(command.config, EDITABLE);
          const next = {...world.config, ...changes};
          validateConfig(next);
          if (next.capacity < world.flies.length) throw Error('Capacity must cover the living population');
          if (next.capacity > world.config.capacity) world.capacityReached = false;
          world.config = next;
          world.record('intervention', `Settings changed: ${JSON.stringify(changes)}`,{changes});
          break;
        }
        case 'checkpoint':
          savedCheckpoint = await this.archive(entry);
          break;
        case 'restore': {
          const saved = await entry.store.load(command.name);
          if (saved.schema !== 1 || saved.id !== id) throw Error('Checkpoint belongs to another ecosystem');
          const candidate = World.restore(saved.checkpoint);
          await this.archive(entry);
          entry.world = candidate;
          entry.paused = true;
          entry.owed = 0;
          entry.error = null;
          break;
        }
        default:
          throw Error('Unknown control action');
      }
      await this.persist(entry);
      return {...this.state(id), ...(savedCheckpoint ? {savedCheckpoint} : {})};
    });
  }

  advanceRealtime(seconds, budgetMs = 8) {
    const active = [...this.experiments.values()].filter(entry => !entry.paused && !entry.pending);
    if (!active.length) return false;
    for (const entry of active) entry.owed = Math.min(100, entry.owed + Math.min(seconds, .25) * entry.speed / DT);
    const deadline = performance.now() + budgetMs;
    let idle = 0;
    while (performance.now() < deadline && idle < active.length) {
      const entry = active[this.cursor++ % active.length];
      if (entry.paused || entry.owed < 1) { idle++; continue; }
      idle = 0;
      try {
        if (!entry.world.step() || entry.world.capacityReached || !entry.world.flies.length) entry.paused = true;
        entry.owed--;
      } catch (error) {
        entry.paused = true;
        entry.error = `Simulation failed: ${error.message}`;
      }
    }
    return active.some(entry => !entry.paused && !entry.pending && entry.owed >= 1);
  }

  async flush() {
    await Promise.all([...this.experiments.values()].map(entry =>
      this.exclusive(entry, () => this.persist(entry))));
  }

  async close() {
    for (const entry of this.experiments.values()) entry.paused = true;
    await this.creations;
    await this.flush();
  }
}
