export const APPROVED_TOPDOWN_CAMERA = Object.freeze({
  projection: "orthographic",
  position: Object.freeze({ x: 0, y: 15.5, z: 16.5 }),
  target: Object.freeze({ x: 0, y: 0, z: -0.35 }),
  orthoHeight: 8.45,
  maxHorizontalOffset: 0.001,
});

export function validateApprovedTopdownCamera(camera = APPROVED_TOPDOWN_CAMERA) {
  if (camera?.projection !== "orthographic") return false;
  if (!Number.isFinite(camera?.position?.x) || Math.abs(camera.position.x) > camera.maxHorizontalOffset) return false;
  if (!Number.isFinite(camera?.position?.y) || camera.position.y <= 0) return false;
  if (!Number.isFinite(camera?.position?.z) || camera.position.z <= 0) return false;
  if (!Number.isFinite(camera?.target?.x) || Math.abs(camera.target.x) > camera.maxHorizontalOffset) return false;
  if (!Number.isFinite(camera?.orthoHeight) || camera.orthoHeight <= 0) return false;
  return true;
}

export function applyApprovedTopdownCamera(entity, camera = APPROVED_TOPDOWN_CAMERA) {
  if (!validateApprovedTopdownCamera(camera)) {
    throw new TypeError("Camera does not match the approved centered top-down contract");
  }
  entity.setPosition(camera.position.x, camera.position.y, camera.position.z);
  entity.lookAt(camera.target.x, camera.target.y, camera.target.z);
  entity.camera.orthoHeight = camera.orthoHeight;
  return entity;
}
