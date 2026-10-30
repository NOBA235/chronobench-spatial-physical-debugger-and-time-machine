import { Pressed, createSystem } from '@iwsdk/core';
import { ORIGIN, ChaosOrb, shared } from '../state';
import { summonChaos } from '../levels/ChaosArchitectAgent';

export class AgenticOrbSystem extends createSystem({ pressed: { required: [ChaosOrb, Pressed] } }) {
  init(): void {
    this.queries.pressed.subscribe('qualify', () => void summonChaos());
    window.addEventListener('keydown', (e) => { if (e.code === 'KeyG' && !e.repeat) void summonChaos(); });
  }

  update(delta: number, time: number): void {
    const o = shared.stage?.chaosOrb;
    if (!o) return;
    o.rotation.y += delta; o.rotation.x += delta * 0.4;
    o.position.y = ORIGIN.y + 0.5 + Math.sin(time * 2) * 0.01;
  }
}
