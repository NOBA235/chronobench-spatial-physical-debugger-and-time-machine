import { createSystem } from '@iwsdk/core';
import { Plane, Raycaster, Vector2, Vector3, type Mesh } from 'three';
import { ORIGIN, shared } from '../state';
import { summonChaos } from '../levels/ChaosArchitectAgent';

const ray = new Raycaster(), ndc = new Vector2(), plane = new Plane(), hit = new Vector3(), off = new Vector3();
const X = new Vector3(1, 0, 0), Y = new Vector3(0, 1, 0), Z = new Vector3(0, 0, 1);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Desktop play: drag = move in the vertical plane, Ctrl+drag = move on the table, Shift+drag or R/F = tilt. */
export class DesktopAnchorSystem extends createSystem({}) {
  private sel: Mesh | null = null;
  private mode = 0; private lx = 0; private ly = 0;

  init(): void {
    const el = this.world.renderer.domElement;
    const aim = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, this.camera);
    };
    shared.onDown = (e) => {
      if (e.target !== el || this.world.renderer.xr.isPresenting || !shared.stage) return false;
      aim(e);
      if (ray.intersectObject(shared.stage.chaosOrb).length) { void summonChaos(); this.mode = -1; shared.dragging = true; return true; }
      const h = ray.intersectObjects(shared.stage.plates)[0];
      if (!h) { this.sel = null; return false; }
      this.sel = h.object as Mesh;
      this.mode = e.shiftKey ? 1 : e.ctrlKey ? 2 : 0;
      this.lx = e.clientX; this.ly = e.clientY;
      plane.setFromNormalAndCoplanarPoint(this.mode === 2 ? Y : Z, this.sel.position);
      ray.ray.intersectPlane(plane, hit);
      off.copy(this.sel.position).sub(hit);
      shared.dragging = true;
      return true;
    };
    shared.onMove = (e) => {
      const s = this.sel;
      if (!s || this.mode < 0) return;
      if (this.mode === 1) {
        s.rotateOnWorldAxis(Z, (e.clientX - this.lx) * 0.01);
        s.rotateOnWorldAxis(X, (e.clientY - this.ly) * 0.01);
        this.lx = e.clientX; this.ly = e.clientY;
      } else {
        aim(e);
        if (ray.ray.intersectPlane(plane, hit)) {
          s.position.copy(hit).add(off);
          s.position.set(
            clamp(s.position.x - ORIGIN.x, -0.28, 0.28) + ORIGIN.x,
            clamp(s.position.y - ORIGIN.y, 0.05, 0.48) + ORIGIN.y,
            clamp(s.position.z - ORIGIN.z, -0.28, 0.28) + ORIGIN.z);
        }
      }
    };
    shared.onUp = () => { shared.dragging = false; };
    window.addEventListener('keydown', (e) => {
      if (!this.sel) return;
      if (e.code === 'KeyR') this.sel.rotateOnWorldAxis(Z, 0.08);
      else if (e.code === 'KeyF') this.sel.rotateOnWorldAxis(Z, -0.08);
    });
  }
}
