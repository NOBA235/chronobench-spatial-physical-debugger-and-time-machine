import type { Paradox } from './ParadoxSchema';

const A = [0.9, 2.5, 0, 0.04]; // shared pendulum swing: amplitude, omega, phase, bob radius

export const LEVELS: Paradox[] = [
  { name: 'The Severed Arc', rule: 'Steer the core over the pendulum to the reactor.', gravity: -1.2, target: [0.22, 0.28, 0], targetR: 0.05,
    bodies: [[-0.25, 0.3, 0, 0.4, 0.3, 0]],
    pendulums: [[0, 0.5, 0, 0.35, ...A]],
    plates: [[-0.1, 0.05, 0, 0, 1, 0, 0.07], [0.25, 0.05, 0.2, 0, 1, 0, 0.06]] },
  { name: 'Twin-Pendulum Crossfire', rule: 'Bank the core past both pendulums.', gravity: -1.0, target: [0.24, 0.22, 0.1], targetR: 0.05,
    bodies: [[-0.27, 0.25, -0.1, 0.45, 0.1, 0.05]],
    pendulums: [[-0.05, 0.5, 0, 0.32, 0.8, 2.2, 0, 0.04], [0.1, 0.5, 0, 0.32, 0.8, 2.2, Math.PI, 0.04]],
    plates: [[-0.2, 0.05, 0.2, 0, 1, 0, 0.07], [0.2, 0.05, -0.2, 0, 1, 0, 0.07]] },
  { name: 'Zero-G Ricochet Vault', rule: 'Stay under the ceiling lasers. Redirect the core.', gravity: -0.25, target: [0.2, 0.38, 0], targetR: 0.05,
    bodies: [[-0.25, 0.2, 0, 0.5, 0.15, 0]],
    lasers: [[0.48, 0.1, 0.012]],
    plates: [[-0.2, 0.4, 0.2, 0, -1, 0, 0.08], [0.25, 0.05, 0.2, 0, 1, 0, 0.06]] },
  { name: 'The Repulsor Wells', rule: 'Thread the core past the repulsor well.', gravity: -1.2, target: [0.22, 0.1, 0], targetR: 0.05,
    bodies: [[-0.25, 0.3, 0, 0.45, 0, 0]],
    repulsors: [[0, 0.12, 0, 0.004, 0.25]],
    plates: [[-0.2, 0.05, 0.2, 0, 1, 0, 0.07], [0.2, 0.4, 0.2, 0, -1, 0, 0.06]] },
  { name: 'The Ouroboros Relay', rule: 'Dodge the hammer and relay the core home.', gravity: -1.5, target: [0.25, 0.3, 0], targetR: 0.05,
    bodies: [[-0.27, 0.4, 0, 0.6, 0, 0]],
    pendulums: [[0, 0.5, 0, 0.3, 0.7, 3.5, 0, 0.04]],
    plates: [[-0.2, 0.05, 0.2, 0, 1, 0, 0.07], [0.2, 0.05, 0.2, 0, 1, 0, 0.07]] },
];
