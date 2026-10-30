import { World } from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import { ChaosOrb, Plate } from './state';
import { AgenticOrbSystem } from './systems/AgenticOrbSystem';
import { CausalSimulationSystem } from './systems/CausalSimulationSystem';
import { DemoDirectorSystem } from './systems/DemoDirectorSystem';
import { DesktopAnchorSystem } from './systems/DesktopAnchorSystem';
import { DesktopViewSystem } from './systems/DesktopViewSystem';
import { installPointerGuard } from './systems/PointerGuard';
import { SpatialHUDSystem } from './systems/SpatialHUDSystem';
import { TimeScrubSystem } from './systems/TimeScrubSystem';

installPointerGuard();

World.create(document.getElementById('scene-container') as HTMLDivElement, projectOptions).then((world) => {
  for (const c of [Plate, ChaosOrb]) {
    try { world.registerComponent(c); } catch { /* already registered by the project manifest */ }
  }
  world.registerSystem(TimeScrubSystem);
  world.registerSystem(CausalSimulationSystem);
  world.registerSystem(DesktopAnchorSystem);
  world.registerSystem(DesktopViewSystem);
  world.registerSystem(SpatialHUDSystem);
  world.registerSystem(AgenticOrbSystem);
  world.registerSystem(DemoDirectorSystem);
});
