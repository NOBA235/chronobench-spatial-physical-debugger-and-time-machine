import { BufferAttribute, BufferGeometry, Line, LineBasicMaterial } from 'three';
import { ORIGIN } from '../state';
import { FRAMES, MAX_BODIES, STRIDE, type Timeline } from '../math/DeterministicRingBuffer';

export class Ribbon {
  readonly line: Line;
  private pos = new Float32Array(FRAMES * 3);
  private geo = new BufferGeometry();
  private mat = new LineBasicMaterial({ color: 0xff3b55 });

  constructor() {
    this.geo.setAttribute('position', new BufferAttribute(this.pos, 3));
    this.line = new Line(this.geo, this.mat);
    this.line.frustumCulled = false;
  }

  update(tl: Timeline, from: number): void {
    const d = tl.data;
    for (let f = from; f < FRAMES; f++) {
      const s = f * MAX_BODIES * STRIDE, i = f * 3;
      this.pos[i] = d[s] + ORIGIN.x; this.pos[i + 1] = d[s + 1] + ORIGIN.y; this.pos[i + 2] = d[s + 2] + ORIGIN.z;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.setDrawRange(from, FRAMES - from);
    this.mat.color.setHex(tl.hitFrame >= 0 ? 0xffc24a : 0xff3b55);
  }
}
