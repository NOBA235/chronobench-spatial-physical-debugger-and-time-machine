// npx tsx tools/verify-levels.ts : each level must FAIL by default and be solvable by moving the anchors.
import { LEVELS } from '../src/levels/BuiltInParadoxes';
import { Arena, NUM_PLATES, PS, Timeline } from '../src/math/DeterministicRingBuffer';

const tl = new Timeline(), a = new Arena();
const R = Math.PI / 180;
const put = (k: number, x: number, y: number, z: number, t: number, p: number, r = 0.07) =>
  a.plates.set([x, y, z, Math.sin(t * R) * Math.cos(p * R), Math.cos(t * R), Math.sin(t * R) * Math.sin(p * R), r], k * PS);
const solves = () => { tl.fork(0, a); return tl.hitFrame >= 0; };

function poses(xs: number[], ys: number[], zs: number[], ts: number[], ps: number[]) {
  const out: number[][] = [];
  for (const x of xs) for (const y of ys) for (const z of zs) for (const t of ts) for (const p of (t === 0 ? [0] : ps)) out.push([x, y, z, t, p]);
  return out;
}
const fine = poses([-0.25, -0.2, -0.15, -0.1, -0.05, 0, 0.05, 0.1, 0.15, 0.2, 0.25], [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45],
  [-0.1, 0, 0.1], [0, 20, 40, 60, 80, 100, 120, 140, 160], [0, 45, 90, 135, 180, 225, 270, 315]);
const coarse = poses([-0.2, -0.1, 0, 0.1, 0.2], [0.1, 0.25, 0.4], [-0.1, 0.1], [30, 60, 90, 120, 150], [0, 90, 180, 270]);

for (const L of LEVELS) {
  a.load(L); tl.reset(); L.bodies.forEach((b, k) => tl.seed(k, b));
  const base = L.plates.map((p) => { const n = Math.hypot(p[3], p[4], p[5]); return [p[0], p[1], p[2], p[3] / n, p[4] / n, p[5] / n, p[6]]; });
  const reset = () => base.forEach((p, k) => a.plates.set(p, k * PS));
  reset();
  const fails = !solves();
  let found = '';
  for (let k = 0; k < NUM_PLATES && !found; k++)
    for (const q of fine) { reset(); put(k, q[0], q[1], q[2], q[3], q[4]); if (solves()) { found = `1 plate: #${k} @ ${q.join(',')}`; break; } }
  for (const q of found ? [] : coarse) {
    for (const w of coarse) { reset(); put(0, q[0], q[1], q[2], q[3], q[4]); put(1, w[0], w[1], w[2], w[3], w[4]); if (solves()) { found = `2 plates: ${q.join(',')} + ${w.join(',')}`; break; } }
    if (found) break;
  }
  console.log(`${L.name}: default ${fails ? 'FAILS' : 'SOLVES (bad)'} | ${found || 'NO SOLUTION FOUND'}`);
}
