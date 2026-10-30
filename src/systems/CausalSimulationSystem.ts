import { createSystem } from '@iwsdk/core';
import { type MeshBasicMaterial, ShaderMaterial, Vector3 } from 'three';
import { audio } from '../audio/ChronoSynthAudio';
import { ORIGIN, control, shared } from '../state';
import { LEVELS } from '../levels/BuiltInParadoxes';
import type { Paradox } from '../levels/ParadoxSchema';
import { Arena, FRAMES, MAX_BODIES, MAX_BOUNCES, NUM_PLATES, PS, STRIDE, Timeline } from '../math/DeterministicRingBuffer';
import { buildStage, type Stage } from '../visuals/DioramaStageBuilder';

const UP = new Vector3(0, 1, 0), N = new Vector3(), V = new Vector3(), Z = new Vector3(0, 0, 1);

export class CausalSimulationSystem extends createSystem({}) {
  private tl = new Timeline();
  private arena = new Arena();
  private stage!: Stage;
  private custom: Paradox | null = null;
  private pose = new Float32Array(NUM_PLATES * PS);
  private cursor = 0; private prev = 0; private level = 0; private won = false; private lastChime = 0;
  private wasFrozen = false; private wasScrub = false;

  init(): void {
    this.stage = buildStage(this.world);
    shared.stage = this.stage;
    this.load(0);
  }

  private load(i: number): void {
    this.level = i % LEVELS.length;
    const L = this.custom ?? LEVELS[this.level];
    this.custom = null;
    control.name = L.name; control.rule = L.rule;
    const tele = control.tele;
    tele.levelIndex = this.level; tele.elapsed = 0; tele.solveSeconds = 0; tele.scrubCount = 0; tele.freezeFrame = -1;
    this.arena.load(L);
    this.tl.reset();
    L.bodies.forEach((b, k) => this.tl.seed(k, b));
    L.plates.forEach((p, k) => {
      const m = this.stage.plates[k];
      m.position.set(p[0] + ORIGIN.x, p[1] + ORIGIN.y, p[2] + ORIGIN.z);
      m.quaternion.setFromUnitVectors(UP, N.set(p[3], p[4], p[5]).normalize());
      m.scale.set(p[6] / 0.07, 1, p[6] / 0.07);
    });
    this.stage.bobs.forEach((b, k) => { b.visible = k < this.arena.pendCount; });
    this.stage.repulsor.visible = this.arena.repCount > 0;
    if (this.arena.repCount) this.stage.repulsor.position.set(this.arena.rep[0] + ORIGIN.x, this.arena.rep[1] + ORIGIN.y + 0.2, this.arena.rep[2] + ORIGIN.z);
    this.stage.lasers.visible = this.arena.laserOn;
    this.stage.lasers.position.set(ORIGIN.x, this.arena.laser[0] + ORIGIN.y, ORIGIN.z);
    this.stage.target.position.set(L.target[0] + ORIGIN.x, L.target[1] + ORIGIN.y, L.target[2] + ORIGIN.z);
    this.syncPlates();
    this.cursor = this.prev = 0; this.won = false;
    this.tl.fork(0, this.arena);
    this.refresh();
  }

  /** Copies anchor poses into the solver arena; returns true if any anchor moved. */
  private syncPlates(): boolean {
    let moved = false;
    for (let k = 0; k < NUM_PLATES; k++) {
      const m = this.stage.plates[k], q = k * PS, a = this.arena.plates;
      N.set(0, 1, 0).applyQuaternion(m.quaternion);
      const r = 0.07 * m.scale.x;
      const x = m.position.x - ORIGIN.x, y = m.position.y - ORIGIN.y, z = m.position.z - ORIGIN.z;
      if (Math.abs(x - this.pose[q]) + Math.abs(y - this.pose[q + 1]) + Math.abs(z - this.pose[q + 2]) +
          Math.abs(N.x - this.pose[q + 3]) + Math.abs(N.y - this.pose[q + 4]) + Math.abs(N.z - this.pose[q + 5]) > 1e-4) moved = true;
      a[q] = this.pose[q] = x; a[q + 1] = this.pose[q + 1] = y; a[q + 2] = this.pose[q + 2] = z;
      a[q + 3] = this.pose[q + 3] = N.x; a[q + 4] = this.pose[q + 4] = N.y; a[q + 5] = this.pose[q + 5] = N.z;
      a[q + 6] = this.pose[q + 6] = r;
    }
    return moved;
  }

  private refresh(): void {
    this.stage.ribbon.update(this.tl, Math.floor(this.cursor));
    (this.stage.target.material as ShaderMaterial).uniforms.uColor.value.setHex(this.tl.hitFrame >= 0 ? 0xffc24a : 0x3ff0ff);
  }

  update(delta: number, time: number): void {
    if (this.syncPlates()) {
      this.tl.fork(Math.floor(this.cursor), this.arena);
      this.refresh();
    }
    if (control.chaos) { this.custom = control.chaos; control.chaos = null; this.load(this.level); }
    if (control.levelRequest >= 0) { const i = control.levelRequest; control.levelRequest = -1; this.load(i); }
    const adv = (control.frozen ? 0 : control.timeScale * 60 * delta) + control.scrub * 120 * delta + control.nudge;
    const scrubbing = control.scrub !== 0 || control.nudge !== 0 || (!control.frozen && (control.timeScale < 0.7 || control.timeScale > 1.3));
    control.nudge = 0;
    if (scrubbing && !this.wasScrub) control.tele.scrubCount++;
    this.wasScrub = scrubbing;
    if (control.frozen && !this.wasFrozen) control.tele.freezeFrame = Math.floor(this.cursor);
    this.wasFrozen = control.frozen;
    if (!this.won) control.tele.elapsed += delta;
    if (control.seek >= 0) { this.cursor = this.prev = control.seek; control.seek = -1; }
    if (adv !== 0) {
      this.prev = this.cursor;
      this.cursor += adv;
      while (this.cursor >= FRAMES) this.cursor -= FRAMES;
      while (this.cursor < 0) this.cursor += FRAMES;
      if (scrubbing && Math.floor(this.cursor / 6) !== Math.floor(this.prev / 6)) audio.tick();
    }
    const d = this.tl.data, f0 = Math.floor(this.cursor), f1 = Math.min(f0 + 1, FRAMES - 1), a = this.cursor - f0;
    const s0 = f0 * MAX_BODIES * STRIDE, s1 = f1 * MAX_BODIES * STRIDE;
    this.stage.orb.position.set(
      d[s0] + (d[s1] - d[s0]) * a + ORIGIN.x,
      d[s0 + 1] + (d[s1 + 1] - d[s0 + 1]) * a + ORIGIN.y,
      d[s0 + 2] + (d[s1 + 2] - d[s0 + 2]) * a + ORIGIN.z);

    const arrow = this.stage.velArrow;
    arrow.visible = control.frozen && d[s0 + 6] !== 0;
    if (arrow.visible) {
      V.set(d[s0 + 3], d[s0 + 4], d[s0 + 5]);
      const sp = V.length();
      arrow.visible = sp > 1e-3;
      if (arrow.visible) {
        arrow.position.copy(this.stage.orb.position);
        arrow.setDirection(V.divideScalar(sp));
        arrow.setLength(Math.min(0.3, 0.04 + sp * 0.12), 0.03, 0.02);
        arrow.setColor(sp > 1 ? 0xffc24a : 0x3ff0ff);
      }
    }
    const bc = this.tl.bounceCount, B = this.tl.bounces;
    for (let k = 0; k < MAX_BOUNCES; k++) {
      const m = this.stage.ripples[k], q = k * 7, dt = k < bc ? this.cursor - B[q] : 99;
      m.visible = dt > -6 && dt < 40;
      if (!m.visible) continue;
      m.position.set(B[q + 1] + ORIGIN.x, B[q + 2] + ORIGIN.y, B[q + 3] + ORIGIN.z);
      m.quaternion.setFromUnitVectors(Z, N.set(B[q + 4], B[q + 5], B[q + 6]));
      m.scale.setScalar(0.2 + (dt + 6) * 0.12);
      (m.material as MeshBasicMaterial).opacity = 1 - Math.max(0, dt) / 40;
    }
    const tt = this.cursor / 60, P = this.arena.pend;
    for (let k = 0; k < this.arena.pendCount; k++) {
      const q = k * 8, th = P[q + 4] * Math.sin(P[q + 5] * tt + P[q + 6]);
      this.stage.bobs[k].position.set(P[q] + P[q + 3] * Math.sin(th) + ORIGIN.x, P[q + 1] - P[q + 3] * Math.cos(th) + ORIGIN.y, P[q + 2] + ORIGIN.z);
    }

    const dx = d[s1 + 3] - d[s0 + 3], dy = d[s1 + 4] - d[s0 + 4] - this.arena.gravity * (1 / 60), dz = d[s1 + 5] - d[s0 + 5];
    if (!control.frozen && dx * dx + dy * dy + dz * dz > 0.01 && time - this.lastChime > 0.12) {
      this.lastChime = time;
      audio.chime((control.timeScale < 0 ? 200 : 320) + Math.min(Math.abs(control.timeScale), 2.5) * 180, this.stage.orb.position);
    }
    const h = this.tl.hitFrame;
    if (h >= 0 && !this.won && !control.frozen && this.prev < h && this.cursor >= h) { this.won = true; control.tele.solveSeconds = control.tele.elapsed; audio.victory(this.stage.target.position); }
    if (this.won && !control.frozen && control.timeScale > 0 && this.cursor < this.prev) this.load(this.level + 1);
    audio.update(control.timeScale, control.frozen);
    audio.listen(this.camera.position);
    control.cursor = this.cursor; control.hit = this.tl.hitFrame >= 0;
    const m = this.stage.mats;
    m.grid.uniforms.uTime.value = m.plasma.uniforms.uTime.value = m.field.uniforms.uTime.value = time;
    m.grid.uniforms.uFreeze.value = control.frozen ? 1 : 0;
    m.field.uniforms.uColor.value.setHex(control.frozen ? 0x4b3fd1 : control.timeScale < 0 ? 0x3ff0ff : 0xffc24a);
  }
}
