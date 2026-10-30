export interface Paradox {
  name: string;
  rule: string;
  gravity: number;
  target: [number, number, number];
  targetR: number;
  /** [x, y, z, vx, vy, vz] per body; body 0 is the Energy Core */
  bodies: number[][];
  /** [cx, cy, cz, nx, ny, nz, radius] per anchor plate (exactly 2) */
  plates: number[][];
  /** [pivotX, pivotY, pivotZ, length, amplitudeRad, omega, phase, bobRadius]; theta(t) = A*sin(omega*t + phase) */
  pendulums?: number[][];
  /** [x, y, z, strength, range]; pushes the core away with acceleration strength/d^2 */
  repulsors?: number[][];
  /** [ceilingY, beamSpacing, beamHalfWidth]; a lattice of lethal beams along x and z */
  lasers?: number[][];
}
