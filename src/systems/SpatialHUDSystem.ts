import { createSystem } from '@iwsdk/core';
import { CanvasTexture, Sprite, SpriteMaterial } from 'three';
import { ORIGIN, control } from '../state';

/** Diegetic HUD: a canvas-backed sprite floating above the diorama. Redrawn at 10Hz or on change. */
export class SpatialHUDSystem extends createSystem({}) {
  private cv = document.createElement('canvas');
  private g!: CanvasRenderingContext2D;
  private tex!: CanvasTexture;
  private sig = -1; private name = '';

  init(): void {
    this.cv.width = 512; this.cv.height = 256;
    this.g = this.cv.getContext('2d')!;
    this.tex = new CanvasTexture(this.cv);
    const s = new Sprite(new SpriteMaterial({ map: this.tex, transparent: true, depthWrite: false }));
    s.scale.set(0.5, 0.25, 1);
    s.position.set(ORIGIN.x, ORIGIN.y + 0.68, ORIGIN.z);
    this.scene.add(s);
  }

  update(): void {
    const tq = Math.floor(control.cursor / 6);
    const sig = ((tq * 4 + (control.hit ? 1 : 0) + (control.frozen ? 2 : 0)) * 100 + Math.round(control.timeScale * 10)) | 0;
    if (sig === this.sig && control.name === this.name) return;
    this.sig = sig; this.name = control.name;
    const g = this.g, ts = control.timeScale;
    const state = control.frozen ? 'FROZEN' : ts < 0 ? `REWIND ${ts.toFixed(1)}x` : `PLAY +${ts.toFixed(1)}x`;
    g.clearRect(0, 0, 512, 256);
    g.fillStyle = 'rgba(4,14,20,0.78)'; g.fillRect(8, 8, 496, 240);
    g.strokeStyle = control.hit ? '#ffc24a' : '#ff3b55'; g.lineWidth = 3; g.strokeRect(8, 8, 496, 240);
    g.textBaseline = 'top';
    g.fillStyle = '#e8fbff'; g.font = 'bold 34px sans-serif'; g.fillText(control.name, 28, 24);
    g.fillStyle = '#8fb5c2'; g.font = '20px sans-serif'; g.fillText(control.rule, 28, 70);
    g.fillStyle = '#6ff6ff'; g.font = '30px monospace';
    g.fillText(`t = ${(tq / 10).toFixed(2).padStart(5, '0')}s / 10.00s`, 28, 112);
    g.fillStyle = control.frozen ? '#9a8cff' : ts < 0 ? '#3ff0ff' : '#ffc24a'; g.fillText(state, 28, 156);
    g.fillStyle = control.hit ? '#ffc24a' : '#ff3b55'; g.font = 'bold 28px sans-serif';
    g.fillText(control.hit ? '[CAUSALITY STABILIZED]' : '[TIMELINE FRACTURED]', 28, 200);
    this.tex.needsUpdate = true;
  }
}
