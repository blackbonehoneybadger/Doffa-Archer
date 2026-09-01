import { ArcRotateCamera, Vector3 } from "@babylonjs/core";

const COMBAT_BETA = 0.82;
const COMBAT_RADIUS = 13.2;

export function createSliceCamera(scene, canvas) {
  const camera = new ArcRotateCamera(
    "rootfall-camera",
    Math.PI / 2,
    COMBAT_BETA,
    COMBAT_RADIUS,
    new Vector3(0, 0.9, 4.5),
    scene,
  );
  camera.lowerBetaLimit = 0.35;
  camera.upperBetaLimit = 1.35;
  camera.lowerRadiusLimit = 6;
  camera.upperRadiusLimit = 18;
  camera.fov = 0.72;
  camera.minZ = 0.1;
  camera.maxZ = 80;
  camera.panningSensibility = 0;
  camera.attachControl(canvas, false);
  camera.inputs.removeByType("ArcRotateCameraPointersInput");
  camera.inputs.removeByType("ArcRotateCameraMouseWheelInput");
  camera.inputs.removeByType("ArcRotateCameraKeyboardMoveInput");
  return camera;
}

export function syncCombatCamera(camera, world) {
  camera.target.set(world.player.x, 0.95, world.player.z - 0.4);
  camera.alpha = Math.PI / 2;
  camera.beta = COMBAT_BETA;
  camera.radius = COMBAT_RADIUS;
}

export function enableOrbitProof(camera, canvas) {
  camera.attachControl(canvas, true);
}

export function disableOrbitProof(camera, canvas) {
  camera.detachControl();
  camera.attachControl(canvas, false);
  camera.inputs.removeByType("ArcRotateCameraPointersInput");
  camera.inputs.removeByType("ArcRotateCameraMouseWheelInput");
  camera.inputs.removeByType("ArcRotateCameraKeyboardMoveInput");
}
