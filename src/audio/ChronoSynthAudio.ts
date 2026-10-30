import type { Vector3 } from 'three';

class ChronoSynth {
  private ctx: AudioContext | null = null;
  private osc!: OscillatorNode; private lp!: BiquadFilterNode; private gain!: GainNode;

  resume(): void {
    if (!this.ctx) {
      const c = (this.ctx = new AudioContext());
      this.osc = c.createOscillator(); this.osc.type = 'sawtooth';
      this.lp = c.createBiquadFilter(); this.lp.type = 'lowpass';
      this.gain = c.createGain(); this.gain.gain.value = 0;
      this.osc.connect(this.lp).connect(this.gain).connect(c.destination);
      this.osc.start();
    }
    void this.ctx.resume();
  }

  /** Tape-warp: pitch and filter follow scrub speed; freeze drops to silence. */
  update(timeScale: number, frozen: boolean): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, s = Math.abs(timeScale);
    this.osc.frequency.setTargetAtTime(110 * Math.pow(2, timeScale * 0.6), t, 0.05);
    this.lp.frequency.setTargetAtTime(frozen ? 120 : 500 + s * 900, t, 0.05);
    this.gain.gain.setTargetAtTime(frozen ? 0 : Math.min(s, 1.5) * 0.025, t, 0.08);
  }

  /** Escapement click while scrubbing. */
  tick(): void {
    if (!this.ctx) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'square'; o.frequency.value = 1800;
    g.gain.setValueAtTime(0.03, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.02);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.02);
  }

  listen(p: Vector3): void {
    if (!this.ctx) return;
    const l = this.ctx.listener;
    l.positionX.value = p.x; l.positionY.value = p.y; l.positionZ.value = p.z;
  }

  chime(freq: number, at?: Vector3): void {
    if (!this.ctx) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), pan = c.createPanner();
    pan.panningModel = 'HRTF';
    if (at) { pan.positionX.value = at.x; pan.positionY.value = at.y; pan.positionZ.value = at.z; }
    o.type = 'triangle'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.08, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.5);
    o.connect(g).connect(pan).connect(c.destination); o.start(); o.stop(c.currentTime + 0.5);
  }

  victory(at?: Vector3): void { this.chime(523, at); this.chime(659, at); this.chime(784, at); }
}

export const audio = new ChronoSynth();
