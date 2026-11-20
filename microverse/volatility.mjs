// Volatility-regime world variant (P13b amendment A2 candidate): long calm epochs (one rule held) alternate
// with volatile bursts (rule switches every 150 ticks). Flies cannot sense the regime.
const FAM = ['pairs', 'staircase', 'triples', 'single'];
export function volatilitySchedule({ calm = 4000, burst = 2000, every = 150 } = {}) {
  const s = []; let f = 0;
  for (let block = 0; block < 4; block++) { s.push([FAM[block % 4], calm]); for (let t = 0; t < burst; t += every) s.push([FAM[f++ % 4], every]); }
  return s;
}
