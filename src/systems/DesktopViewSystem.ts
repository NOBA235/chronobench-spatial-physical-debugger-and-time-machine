import { createSystem } from '@iwsdk/core';
import { MathUtils, Vector3 } from 'three';
import { ORIGIN, shared } from '../state';

const C = new Vector3(ORIGIN.x, ORIGIN.y + 0.28, ORIGIN.z);

/** Browser view (no headset): the camera orbits the diorama. Right-drag orbits, - / = keys zoom. */
export class DesktopViewSystem extends createSystem({}) {
  init(): void {
    const el = this.world.renderer.domElement;
    let orbit = false, lx = 0, ly = 0;
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 2) return;
      orbit = true; lx = e.clientX; ly = e.clientY; el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (!orbit) return;
      shared.view.yaw -= (e.clientX - lx) * 0.005;
      shared.view.pitch = MathUtils.clamp(shared.view.pitch + (e.clientY - ly) * 0.005, -0.2, 1.3);
      lx = e.clientX; ly = e.clientY;
    });
    el.addEventListener('pointerup', () => { orbit = false; });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Minus') shared.view.dist = Math.min(2.5, shared.view.dist + 0.1);
      else if (e.code === 'Equal') shared.view.dist = Math.max(0.5, shared.view.dist - 0.1);
    });
  }

  update(): void {
    if (this.world.renderer.xr.isPresenting) return;
    const v = shared.view, cp = Math.cos(v.pitch);
    this.camera.position.set(C.x + v.dist * Math.sin(v.yaw) * cp, C.y + v.dist * Math.sin(v.pitch), C.z + v.dist * Math.cos(v.yaw) * cp);
    this.camera.lookAt(C);
  }
}
