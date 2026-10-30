import { OneHandGrabbable, PokeInteractable, RayInteractable, type World } from '@iwsdk/core';
import {
  AdditiveBlending, ArrowHelper, BoxGeometry, BufferGeometry, DoubleSide, Vector3, CylinderGeometry, Float32BufferAttribute, IcosahedronGeometry, LineBasicMaterial, LineSegments,
  Mesh, MeshBasicMaterial, PlaneGeometry, RingGeometry, type ShaderMaterial, SphereGeometry,
} from 'three';
import { ChaosOrb, ORIGIN, Plate } from '../state';
import { MAX_BOUNCES, NUM_PLATES } from '../math/DeterministicRingBuffer';
import { freezeFieldMaterial, gridMaterial, holoMaterial, plasmaMaterial } from './Shaders';
import { Ribbon } from './TrajectoryRibbonMesh';

export interface Stage {
  orb: Mesh; target: Mesh; plates: Mesh[]; ribbon: Ribbon; bobs: Mesh[]; repulsor: Mesh;
  lasers: LineSegments; chaosOrb: Mesh; velArrow: ArrowHelper; ripples: Mesh[];
  mats: { grid: ShaderMaterial; plasma: ShaderMaterial; field: ShaderMaterial };
}

export function buildStage(world: World): Stage {
  const slab = new Mesh(new BoxGeometry(0.64, 0.02, 0.64), new MeshBasicMaterial({ color: 0x07131f }));
  slab.position.copy(ORIGIN); slab.position.y -= 0.011;
  const mats = { grid: gridMaterial(), plasma: plasmaMaterial(), field: freezeFieldMaterial() };
  const grid = new Mesh(new PlaneGeometry(0.6, 0.6), mats.grid);
  grid.rotation.x = -Math.PI / 2; grid.position.copy(ORIGIN); grid.position.y += 0.001;
  const field = new Mesh(new RingGeometry(0.4, 0.42, 96), mats.field);
  field.rotation.x = -Math.PI / 2; field.position.copy(ORIGIN); field.position.y += 0.002;
  const orb = new Mesh(new IcosahedronGeometry(0.015, 2), holoMaterial(0x6ff6ff));
  const target = new Mesh(new SphereGeometry(0.04, 24, 16), holoMaterial(0x3ff0ff));
  const ribbon = new Ribbon();
  const bobs = [0, 1].map(() => new Mesh(new SphereGeometry(0.04, 20, 14), mats.plasma));
  const repulsor = new Mesh(new CylinderGeometry(0.02, 0.02, 0.5, 24), holoMaterial(0xffa63a));
  const pts: number[] = [];
  for (let i = -3; i <= 3; i++) pts.push(i * 0.1, 0, -0.3, i * 0.1, 0, 0.3, -0.3, 0, i * 0.1, 0.3, 0, i * 0.1);
  const lasers = new LineSegments(new BufferGeometry().setAttribute('position', new Float32BufferAttribute(pts, 3)), new LineBasicMaterial({ color: 0xff3b55 }));
  lasers.visible = false;
  const velArrow = new ArrowHelper(new Vector3(0, 1, 0), new Vector3(), 0.1, 0x3ff0ff, 0.03, 0.02);
  velArrow.visible = false;
  const ripples = Array.from({ length: MAX_BOUNCES }, () => {
    const m = new Mesh(new RingGeometry(0.02, 0.026, 32), new MeshBasicMaterial({ color: 0xffc24a, transparent: true, blending: AdditiveBlending, side: DoubleSide, depthWrite: false }));
    m.visible = false;
    return m;
  });
  world.scene.add(slab, grid, field, orb, target, ribbon.line, repulsor, lasers, velArrow, ...ripples, ...bobs);

  const plates: Mesh[] = [];
  for (let i = 0; i < NUM_PLATES; i++) {
    const m = new Mesh(new CylinderGeometry(0.07, 0.07, 0.008, 48), holoMaterial(0x31d6ff));
    const e = world.createTransformEntity(m);
    e.addComponent(Plate, { index: i });
    e.addComponent(OneHandGrabbable);
    e.addComponent(RayInteractable);
    plates.push(m);
  }
  const chaosOrb = new Mesh(new IcosahedronGeometry(0.03, 1), holoMaterial(0xc08bff));
  chaosOrb.position.set(ORIGIN.x + 0.28, ORIGIN.y + 0.5, ORIGIN.z);
  const ce = world.createTransformEntity(chaosOrb);
  ce.addComponent(ChaosOrb);
  ce.addComponent(RayInteractable);
  ce.addComponent(PokeInteractable);
  return { orb, target, plates, ribbon, bobs, repulsor, lasers, chaosOrb, velArrow, ripples, mats };
}
