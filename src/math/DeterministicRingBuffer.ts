import type { Paradox } from '../levels/ParadoxSchema';

export const FRAMES = 600, MAX_BODIES = 8, STRIDE = 7, DT = 1 / 60, NUM_PLATES = 2, PS = 7, MAX_BOUNCES = 16;

export class Arena {
  gravity = -1.2; floorY = 0; radius = 0.015; wall = 0.3; targetR = 0.04;
  plates = new Float32Array(NUM_PLATES * PS);
  target = new Float32Array(3);
  pend = new Float32Array(16); pendCount = 0;
  rep = new Float32Array(5); repCount = 0;
  laser = new Float32Array(3); laserOn = false;
  load(l: Paradox): void {
    this.gravity = l.gravity; this.targetR = l.targetR;
    this.pendCount = Math.min(2, l.pendulums?.length ?? 0);
    for (let k = 0; k < this.pendCount; k++) this.pend.set(l.pendulums![k], k * 8);
    this.laserOn = !!l.lasers?.length;
    if (this.laserOn) this.laser.set(l.lasers![0]);
    this.repCount = Math.min(1, l.repulsors?.length ?? 0);
    if (this.repCount) this.rep.set(l.repulsors![0], 0);
    for (let k = 0; k < 3; k++) this.target[k] = l.target[k];
  }
}

export class Timeline {
  readonly data = new Float32Array(FRAMES * MAX_BODIES * STRIDE);
  bodies = 0;
  hitFrame = -1;
  /** Impact log for body 0: [frame, x, y, z, nx, ny, nz] per bounce, ascending by frame. */
  readonly bounces = new Float32Array(MAX_BOUNCES * 7);
  bounceCount = 0;

  reset(): void { this.data.fill(0); this.bodies = 0; this.hitFrame = -1; this.bounceCount = 0; }

  private rec(f: number, x: number, y: number, z: number, nx: number, ny: number, nz: number): void {
    if (this.bounceCount >= MAX_BOUNCES) return;
    const o = this.bounceCount++ * 7, b = this.bounces;
    b[o] = f; b[o + 1] = x; b[o + 2] = y; b[o + 3] = z; b[o + 4] = nx; b[o + 5] = ny; b[o + 6] = nz;
  }

  seed(b: number, s: number[]): void {
    const o = b * STRIDE;
    for (let k = 0; k < 6; k++) this.data[o + k] = s[k];
    this.data[o + 6] = 1;
    if (b + 1 > this.bodies) this.bodies = b + 1;
  }

  /** Invalidate frames (from, 599] and re-simulate them from the state at `from`. */
  fork(from: number, a: Arena): void {
    if (this.hitFrame > from) this.hitFrame = -1;
    while (this.bounceCount > 0 && this.bounces[(this.bounceCount - 1) * 7] > from) this.bounceCount--;
    const d = this.data, r = a.radius, rt = a.targetR + r, p = a.plates;
    for (let f = from + 1; f < FRAMES; f++) {
      for (let b = 0; b < this.bodies; b++) {
        const s = ((f - 1) * MAX_BODIES + b) * STRIDE, o = (f * MAX_BODIES + b) * STRIDE;
        if (d[s + 6] === 0) { for (let k = 0; k < STRIDE; k++) d[o + k] = d[s + k]; continue; }
        let x = d[s], y = d[s + 1], z = d[s + 2], vx = d[s + 3], vy = d[s + 4], vz = d[s + 5];
        for (let k = 0; k < a.repCount; k++) {
          const q = k * 5, dx = x - a.rep[q], dy = y - a.rep[q + 1], dz = z - a.rep[q + 2], d2 = dx * dx + dy * dy + dz * dz + 1e-4;
          if (d2 < a.rep[q + 4] * a.rep[q + 4]) { const g = a.rep[q + 3] * DT / (d2 * Math.sqrt(d2)); vx += dx * g; vy += dy * g; vz += dz * g; }
        }
        vy += a.gravity * DT; x += vx * DT; y += vy * DT; z += vz * DT;
        if (y < a.floorY + r) { y = a.floorY + r; if (b === 0 && vy < -0.15) this.rec(f, x, y, z, 0, 1, 0); vy = -vy * 0.7; }
        if (x > a.wall) { x = a.wall; vx = -vx * 0.9; } else if (x < -a.wall) { x = -a.wall; vx = -vx * 0.9; }
        for (let k = 0; k < NUM_PLATES; k++) {
          const q = k * PS, nx = p[q + 3], ny = p[q + 4], nz = p[q + 5];
          const ox = x - p[q], oy = y - p[q + 1], oz = z - p[q + 2];
          const dist = ox * nx + oy * ny + oz * nz, vn = vx * nx + vy * ny + vz * nz;
          if (Math.abs(dist) < r && dist * vn < 0) {
            const pr = p[q + 6];
            if (ox * ox + oy * oy + oz * oz - dist * dist < pr * pr) {
              const j = 1.9 * vn, push = (dist < 0 ? -r : r) - dist;
              vx -= j * nx; vy -= j * ny; vz -= j * nz;
              x += push * nx; y += push * ny; z += push * nz;
              if (b === 0) this.rec(f, x, y, z, dist < 0 ? -nx : nx, dist < 0 ? -ny : ny, dist < 0 ? -nz : nz);
            }
          }
        }
        let alive = 1;
        for (let k = 0; k < a.pendCount; k++) {
          const q = k * 8, th = a.pend[q + 4] * Math.sin(a.pend[q + 5] * f * DT + a.pend[q + 6]), L = a.pend[q + 3];
          const hx = x - (a.pend[q] + L * Math.sin(th)), hy = y - (a.pend[q + 1] - L * Math.cos(th)), hz = z - a.pend[q + 2], hr = a.pend[q + 7] + r;
          if (hx * hx + hy * hy + hz * hz < hr * hr) { alive = 0; vx = vy = vz = 0; }
        }
        if (a.laserOn && y + r > a.laser[0]) {
          const s = a.laser[1], w = a.laser[2] + r;
          if (Math.abs(x - Math.round(x / s) * s) < w || Math.abs(z - Math.round(z / s) * s) < w) { alive = 0; vx = vy = vz = 0; }
        }
        d[o] = x; d[o + 1] = y; d[o + 2] = z; d[o + 3] = vx; d[o + 4] = vy; d[o + 5] = vz; d[o + 6] = alive;
        if (b === 0 && alive && this.hitFrame < 0) {
          const tx = x - a.target[0], ty = y - a.target[1], tz = z - a.target[2];
          if (tx * tx + ty * ty + tz * tz < rt * rt) this.hitFrame = f;
        }
      }
    }
  }
}
