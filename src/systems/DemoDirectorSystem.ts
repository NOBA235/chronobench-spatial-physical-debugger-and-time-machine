import { createSystem } from '@iwsdk/core';
import { MathUtils, Quaternion, Vector3 } from 'three';
import { ORIGIN, control, shared } from '../state';
import { LEVELS } from '../levels/BuiltInParadoxes';
import { findSolution, summonChaos } from '../levels/ChaosArchitectAgent';

/** 50s hands-free trailer (press T). Frozen at 0.2s: Level 1's core is still upstream of the anchor there, so moving it changes the outcome. */
const FREEZE_FRAME = 12;
const UP = new Vector3(0, 1, 0), pa = new Vector3(), pb = new Vector3(), n = new Vector3();
const qa = new Quaternion(), qb = new Quaternion();

export class DemoDirectorSystem extends createSystem({}) {
  private on = false; private t0 = -1; private fired = false;

  init(): void {
    window.addEventListener('keydown', (e) => { if (e.code === 'KeyT' && !e.repeat) { if (this.on) this.endShow(); else this.beginShow(); } });
  }

  private beginShow(): void {
    const L = LEVELS[0], sol = findSolution(L);
    if (!sol || !shared.stage) return;
    const a = L.plates[0], b = sol[0];
    pa.set(a[0] + ORIGIN.x, a[1] + ORIGIN.y, a[2] + ORIGIN.z); qa.setFromUnitVectors(UP, n.set(a[3], a[4], a[5]).normalize());
    pb.set(b[0] + ORIGIN.x, b[1] + ORIGIN.y, b[2] + ORIGIN.z); qb.setFromUnitVectors(UP, n.set(b[3], b[4], b[5]).normalize());
    control.auto = true; control.frozen = false; control.timeScale = 1; control.levelRequest = 0;
    this.on = true; this.t0 = -1; this.fired = false;
  }

  private endShow(): void {
    this.on = false; control.auto = false; control.frozen = false; control.timeScale = 1;
    shared.view.yaw = 0;
  }

  update(_delta: number, time: number): void {
    if (!this.on || !shared.stage) return;
    if (this.t0 < 0) this.t0 = time;
    const t = time - this.t0, plate = shared.stage.plates[0];
    shared.view.yaw = 0.55 * Math.sin(t * 0.4);
    if (t < 8) { control.frozen = false; control.timeScale = 1; }
    else if (t < 18) {
      if (!control.frozen && control.cursor > FREEZE_FRAME + 4) control.timeScale = -2.5;
      else if (!control.frozen) { control.seek = FREEZE_FRAME; control.frozen = true; control.timeScale = 0; }
    } else if (t < 32) {
      const u = MathUtils.smoothstep((t - 18) / 14, 0, 1);
      plate.position.lerpVectors(pa, pb, u);
      plate.quaternion.slerpQuaternions(qa, qb, u);
    } else if (t < 42) { control.frozen = false; control.timeScale = 1; }
    else if (!this.fired) { this.fired = true; void summonChaos(); }
    if (t > 50) this.endShow();
  }
}
