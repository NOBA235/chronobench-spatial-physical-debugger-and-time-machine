import { Vector3 } from 'three';
import { control, shared } from '../state';
import { Arena, MAX_BODIES, NUM_PLATES, PS, STRIDE, Timeline } from '../math/DeterministicRingBuffer';
import type { Paradox } from './ParadoxSchema';

const tl = new Timeline(), ar = new Arena();
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const plate = (x: number, y: number, z: number, deg: number) => [x, y, z, Math.sin(deg * Math.PI / 180), Math.cos(deg * Math.PI / 180), 0, 0.07];
const PARKED = [[0.28, 0.47, 0.25, 0, 1, 0, 0.07], [-0.28, 0.47, 0.25, 0, 1, 0, 0.07]];
let serial = 0;

function run(L: Paradox, plates: number[][]): boolean {
  ar.load(L); tl.reset(); L.bodies.forEach((b, k) => tl.seed(k, b));
  plates.forEach((p, k) => ar.plates.set(p, k * PS));
  tl.fork(0, ar);
  return tl.hitFrame >= 0;
}

/**
 * Offline mutator. Backtracks from a real trajectory: it simulates the core against a secret solution
 * pose, drops the reactor where that path deviates most from the free-flight path, then parks the plates.
 * Every level is checked with the solver: parked pose must miss, solution pose must hit.
 */
export function mutate(): Paradox | null {
  for (let tries = 0; tries < 400; tries++) {
    const draft: Paradox = {
      name: '', rule: 'Chaos rewrote the rules. Reach the reactor.', gravity: rnd(-1.5, -0.5), target: [9, 9, 9], targetR: 0.05,
      bodies: [[-0.27, rnd(0.2, 0.4), 0, rnd(0.35, 0.6), rnd(0, 0.2), 0]], plates: PARKED,
    };
    const sol = [plate(rnd(-0.15, 0.2), rnd(0.08, 0.3), 0, rnd(-60, 60)), plate(rnd(-0.15, 0.2), rnd(0.08, 0.3), 0, rnd(-60, 60))];
    run(draft, PARKED);
    const free = Float32Array.from(tl.data.subarray(0, 600 * MAX_BODIES * STRIDE));
    run(draft, sol);
    for (let f = 220; f < 560; f += 20) {
      const o = f * MAX_BODIES * STRIDE;
      const x = tl.data[o], y = tl.data[o + 1], z = tl.data[o + 2];
      const dev = Math.hypot(x - free[o], y - free[o + 1], z - free[o + 2]);
      if (tl.data[o + 6] === 0 || dev < 0.12 || y < 0.1 || y > 0.42 || Math.abs(x) > 0.26) continue;
      const L: Paradox = { ...draft, name: `Chaos Paradox ${++serial}`, target: [x, y, z] };
      if (!run(L, PARKED) && run(L, sol)) return L;
    }
  }
  return null;
}

const R = Math.PI / 180;

/** Solver gate. Null unless the layout FAILS as authored and ONE anchor move SOLVES it; returns the solved anchor poses. */
export function findSolution(L: Paradox): number[][] | null {
  const base = L.plates.map((p) => { const n = Math.hypot(p[3], p[4], p[5]) || 1; return [p[0], p[1], p[2], p[3] / n, p[4] / n, p[5] / n, p[6]]; });
  const reset = () => base.forEach((p, k) => ar.plates.set(p, k * PS));
  ar.load(L); tl.reset(); L.bodies.forEach((b, k) => tl.seed(k, b));
  reset(); tl.fork(0, ar);
  if (tl.hitFrame >= 0) return null;
  for (let k = 0; k < NUM_PLATES; k++)
    for (let x = -0.25; x <= 0.251; x += 0.05) for (let y = 0.05; y <= 0.451; y += 0.05) for (const z of [-0.1, 0, 0.1])
      for (let t = 0; t <= 160; t += 20) for (let w = 0; w < (t === 0 ? 1 : 360); w += 90) {
        reset();
        const s = Math.sin(t * R);
        ar.plates.set([x, y, z, s * Math.cos(w * R), Math.cos(t * R), s * Math.sin(w * R), base[k][6]], k * PS);
        tl.fork(0, ar);
        if (tl.hitFrame >= 0) return Array.from({ length: NUM_PLATES }, (_, i) => Array.from(ar.plates.subarray(i * PS, (i + 1) * PS)));
      }
  return null;
}

const grid = (v: unknown, n: number, max: number): v is number[][] =>
  Array.isArray(v) && v.length <= max && v.every((r) => Array.isArray(r) && r.length === n && r.every((x) => typeof x === 'number' && Number.isFinite(x) && Math.abs(x) <= 5));

/** Structural validation of untrusted model output. Anything malformed is rejected before it reaches the solver. */
function sanitize(j: any): Paradox | null {
  if (!j || typeof j.gravity !== 'number' || j.gravity > -0.1 || j.gravity < -3) return null;
  if (typeof j.targetR !== 'number' || j.targetR < 0.03 || j.targetR > 0.08) return null;
  if (!grid([j.target], 3, 1) || !grid(j.bodies, 6, 3) || j.bodies.length < 1 || !grid(j.plates, 7, 2) || j.plates.length !== 2) return null;
  if ((j.pendulums && !grid(j.pendulums, 8, 2)) || (j.repulsors && !grid(j.repulsors, 5, 1)) || (j.lasers && !grid(j.lasers, 3, 1))) return null;
  if (j.plates.some((p: number[]) => Math.hypot(p[3], p[4], p[5]) < 0.1 || p[6] < 0.04 || p[6] > 0.09)) return null;
  return {
    name: String(j.name ?? 'Gemini Paradox').slice(0, 40), rule: String(j.paradoxNarrative ?? 'Causality has been rewritten.').slice(0, 90),
    gravity: j.gravity, target: j.target, targetR: j.targetR, bodies: j.bodies, plates: j.plates,
    pendulums: j.pendulums, repulsors: j.repulsors, lasers: j.lasers,
  };
}

function telemetry(): object {
  const v = new Vector3(), t = control.tele;
  const anchorAngles = (shared.stage?.plates ?? []).map((m) => Math.round(Math.acos(Math.min(1, Math.max(-1, v.set(0, 1, 0).applyQuaternion(m.quaternion).y))) / R));
  return { levelIndex: t.levelIndex, solveTimeSeconds: Number(t.solveSeconds.toFixed(1)), scrubCount: t.scrubCount, freezeFrameUsed: t.freezeFrame, anchorAngles };
}

async function fetchGemini(): Promise<Paradox | null> {
  let key: string | null | undefined = import.meta.env.VITE_AI_API_KEY || new URLSearchParams(window.location.search).get('key');
  try { key ||= localStorage.getItem('CHRONO_AI_KEY'); } catch { /* storage blocked */ }
  if (!key) return null;
  const prompt = `You are the Chaos Architect of a VR physics puzzle. A sphere (body 0) launches and must reach a reactor sphere. The player can only move two disc deflector plates. Telemetry of the last paradox: ${JSON.stringify(telemetry())}. Design a NEW paradox that counters their habits. Units are metres, scene local, x in [-0.28,0.28], y in [0.05,0.48], z in [-0.28,0.28]. The layout MUST fail as authored and be solvable by moving one plate. Reply with JSON only: {"name":string,"paradoxNarrative":"one dramatic sentence","gravity":-0.3..-2,"target":[x,y,z],"targetR":0.04..0.06,"bodies":[[x,y,z,vx,vy,vz]],"plates":[[cx,cy,cz,nx,ny,nz,radius 0.05..0.08],[...]],"pendulums":[[px,py,pz,length,amplitudeRad,omega,phase,0.04]],"repulsors":[[x,y,z,strength 0.002..0.01,range]]}. pendulums (max 2) and repulsors (max 1) are optional.`;
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 2500);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl.signal,
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const L = sanitize(JSON.parse(data.candidates[0].content.parts[0].text));
    return L && findSolution(L) ? L : null; // solver gate: reject unsolvable or already-solved layouts
  } catch {
    return null; // timeout, network, or malformed JSON -> procedural fallback
  } finally {
    clearTimeout(timer);
  }
}

let busy = false;

/** Never fails: Gemini (solver-gated, 2.5s budget) -> verified procedural mutator -> random built-in level. */
export async function summonChaos(): Promise<void> {
  if (busy) return;
  busy = true;
  try {
    const L = (await fetchGemini()) ?? mutate();
    if (!L) { control.levelRequest = Math.floor(Math.random() * 5); return; }
    control.chaos = L;
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      speechSynthesis.speak(new SpeechSynthesisUtterance(`${L.name}. ${L.rule}`));
    }
  } finally {
    busy = false;
  }
}
