/** Stable, explicitly model-labelled read contract for the observer UI. */
export function compactControllerView(detail, channels) {
  if (!detail?.genome || !detail?.brain) return {schema: 1, model: 'compact-neural', available: false,
    archived: detail?.archived || null};
  return {schema: 1, model: detail.brain.episodic ? (detail.brain.episodic.actuator==='joint'?'compact-joint-episodic':'compact-episodic-actor') : detail.genome.actor ? 'compact-trace-actor' : 'compact-neural', available: true, agentId: detail.id,
    generation: detail.generation, parents: detail.parents, ageSeconds: detail.age, energy: detail.energy,
    offspring: detail.offspring, bodyTraits: {...detail.genome.traits},
    controller: {neurons: detail.genome.nodes.length, connections: detail.genome.edges.length,
      inputs: channels.inputs, outputs: channels.outputs,
      traceNormalization:detail.genome.actor?.traceNormalization??0,
      activity: {...detail.brain.activity}, acquiredWeightDelta: [...detail.brain.plastic],
      eligibility: [...detail.brain.eligibility], rewardBaseline: detail.brain.baseline},
    ...(detail.brain.episodic ? {episodic: {stored: detail.brain.episodic.memory.records.length,
      capacity: detail.brain.episodic.memory.config.capacity, experiences: detail.brain.episodic.memory.seen,
      pendingReturns: detail.brain.episodic.pending.length, actuator: detail.brain.episodic.actuator??'turn',
      returnMode: detail.brain.episodic.returnMode??'mean',
      bootstrapMode:detail.brain.episodic.bootstrapMode??'greedy',
      featureMode:detail.brain.episodic.featureMode??null,
      exploration:detail.brain.episodic.memory.config.exploration,
      priorStrength:detail.brain.episodic.memory.config.priorStrength??0,
      reserveRisk:detail.brain.episodic.reserveRisk??false,
      ...(detail.brain.episodic.reserveRisk?{riskWeight:detail.brain.episodic.riskWeight,reserveThreshold:detail.brain.episodic.reserveThreshold,riskLearning:detail.brain.episodic.riskLearning}:{}),
      moveMode: detail.brain.episodic.moveMode??'residual',
      speedLevels: detail.brain.episodic.speedLevels?[...detail.brain.episodic.speedLevels]:null,
      lastUpdate: detail.brain.episodic.lastUpdate?structuredClone(detail.brain.episodic.lastUpdate):null,
      correction: detail.brain.episodic.lastCorrection??null,
      movementCorrection:detail.brain.episodic.lastMoveCorrection??(detail.brain.episodic.actuator==='move'?detail.brain.episodic.lastCorrection??null:null),
      turnGain:detail.brain.episodic.turnGain??null,
      turnCorrection: detail.brain.episodic.actuator==='move'?0:detail.brain.episodic.lastCorrection??null,
      lastDecision: detail.brain.episodic.lastDecision ? structuredClone(detail.brain.episodic.lastDecision) : null}} : {}),
    lastObservation: {inputs: [...(detail.lastInputs || [])], outputs: [...(detail.lastActions || [])],
      foodEaten: detail.lastFood || 0, energyCost: detail.lastEnergyCost || 0, signal: detail.signal || 0}};
}

export function connectomeControllerView({agent, audit}) {
  if (!agent || !audit) return {schema: 1, model: 'malecns-connectome', available: false};
  return {schema: 1, model: 'malecns-connectome', available: true, agentId: agent.id,
    generation: agent.generation, parents: agent.parents, ageSeconds: agent.age, energy: agent.energy,
    offspring: agent.offspring || 0, bodyTraits: {...(agent.alleles || {})},
    controller: {neurons: audit.neurons, connections: audit.edges, inputs: null, outputs: null,
      readoutHz: {...(agent.neural?.readout_hz || {})}, topologyMutable: false,
      acquiredMemoryInherited: false},
    lastObservation: {spikes: agent.neural?.spikes || 0,
      activeNeurons: agent.neural?.active_neurons || 0,
      sensoryDrive: {...(agent.neural?.sensory_drive || {})}}};
}
