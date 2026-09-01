import { MeshBuilder, TransformNode, Vector3 } from "@babylonjs/core";
import { HERO_IDENTITY } from "../identity.js";

function limb(scene, name, options, material, parent) {
  const mesh = MeshBuilder.CreateCylinder(name, options, scene);
  mesh.material = material;
  mesh.parent = parent;
  return mesh;
}

export function createHoneyBadger(scene, materials) {
  const root = new TransformNode("honey-badger", scene);
  const hips = new TransformNode("hb-hips", scene);
  hips.parent = root;
  hips.position.y = 0.92;

  const torso = MeshBuilder.CreateCapsule("hb-torso", { height: 0.62, radius: 0.2, tessellation: 10 }, scene);
  torso.position.y = 0.28;
  torso.scaling.z = 0.9;
  torso.scaling.x = 1.15;
  torso.material = materials.skin;
  torso.parent = hips;

  const chestMark = MeshBuilder.CreatePlane("hb-chest-badger", { width: 0.28, height: 0.28 }, scene);
  chestMark.position = new Vector3(0, 0.34, 0.2);
  chestMark.material = materials.chestTattoo;
  chestMark.parent = hips;

  const backMark = MeshBuilder.CreatePlane("hb-strong-roots", { width: 0.36, height: 0.12 }, scene);
  backMark.position = new Vector3(0, 0.42, -0.2);
  backMark.rotation.y = Math.PI;
  backMark.material = materials.backTattoo;
  backMark.parent = hips;
  backMark.metadata = {
    text: HERO_IDENTITY.backText,
    mirrored: false,
    lock: "never-mirror-never-drop-lod",
  };

  const shoulders = new TransformNode("hb-shoulders", scene);
  shoulders.parent = hips;
  shoulders.position.y = 0.46;

  const leftArm = new TransformNode("hb-left-arm", scene);
  leftArm.parent = shoulders;
  leftArm.position = new Vector3(-0.26, 0, 0);
  const leftUpper = limb(scene, "hb-left-upper", { height: 0.32, diameter: 0.1, tessellation: 8 }, materials.skin, leftArm);
  leftUpper.position.y = -0.16;
  const leftFore = new TransformNode("hb-left-fore", scene);
  leftFore.parent = leftArm;
  leftFore.position.y = -0.32;
  const leftLower = limb(scene, "hb-left-lower", { height: 0.3, diameterTop: 0.08, diameterBottom: 0.07, tessellation: 8 }, materials.skin, leftFore);
  leftLower.position.y = -0.14;

  const rightArm = new TransformNode("hb-right-arm", scene);
  rightArm.parent = shoulders;
  rightArm.position = new Vector3(0.26, 0, 0);
  const rightUpper = limb(scene, "hb-right-upper", { height: 0.32, diameter: 0.1, tessellation: 8 }, materials.skin, rightArm);
  rightUpper.position.y = -0.16;
  const rightFore = new TransformNode("hb-right-fore", scene);
  rightFore.parent = rightArm;
  rightFore.position.y = -0.32;
  const rightLower = limb(scene, "hb-right-lower", { height: 0.3, diameterTop: 0.08, diameterBottom: 0.07, tessellation: 8 }, materials.skin, rightFore);
  rightLower.position.y = -0.14;

  const rightHand = new TransformNode("hb-right-hand", scene);
  rightHand.parent = rightFore;
  rightHand.position.y = -0.3;

  const katana = new TransformNode("hb-katana", scene);
  katana.parent = rightHand;
  const blade = MeshBuilder.CreateBox("hb-blade", { width: 0.035, height: 0.025, depth: 1.05 }, scene);
  blade.position.z = 0.42;
  blade.material = materials.steel;
  blade.parent = katana;
  const edge = MeshBuilder.CreateBox("hb-blade-edge", { width: 0.01, height: 0.03, depth: 1.05 }, scene);
  edge.position = new Vector3(0.02, 0, 0.42);
  edge.material = materials.steelEdge;
  edge.parent = katana;
  const guard = MeshBuilder.CreateBox("hb-tsuba", { width: 0.16, height: 0.03, depth: 0.03 }, scene);
  guard.position.z = -0.1;
  guard.material = materials.steel;
  guard.parent = katana;
  const hilt = MeshBuilder.CreateCylinder("hb-hilt", { height: 0.22, diameter: 0.035, tessellation: 8 }, scene);
  hilt.rotation.x = Math.PI / 2;
  hilt.position.z = -0.22;
  hilt.material = materials.pants;
  hilt.parent = katana;
  katana.rotation.x = -0.35;
  katana.rotation.z = 0.15;

  const neck = new TransformNode("hb-neck", scene);
  neck.parent = shoulders;
  neck.position.y = 0.12;
  const head = MeshBuilder.CreateSphere("hb-placeholder-head", { diameter: 0.26, segments: 12 }, scene);
  head.position.y = 0.18;
  head.scaling.y = 1.08;
  head.material = materials.skin;
  head.parent = neck;
  head.metadata = { placeholder: true, label: HERO_IDENTITY.head.label };

  const beardRoot = new TransformNode("hb-beard", scene);
  beardRoot.parent = neck;
  const beardTop = MeshBuilder.CreateSphere("hb-beard-top", { diameter: 0.16, segments: 8 }, scene);
  beardTop.position = new Vector3(0, 0.08, 0.08);
  beardTop.scaling.y = 0.7;
  beardTop.material = materials.beard;
  beardTop.parent = beardRoot;
  const beardHang = MeshBuilder.CreateCylinder("hb-beard-hang", {
    height: 0.46,
    diameterTop: 0.13,
    diameterBottom: 0.05,
    tessellation: 8,
  }, scene);
  beardHang.position = new Vector3(0, -0.16, 0.1);
  beardHang.material = materials.beard;
  beardHang.parent = beardRoot;

  const leftLeg = new TransformNode("hb-left-leg", scene);
  leftLeg.parent = root;
  leftLeg.position = new Vector3(-0.11, 0.92, 0);
  const leftThigh = limb(scene, "hb-left-thigh", { height: 0.42, diameterTop: 0.16, diameterBottom: 0.13, tessellation: 8 }, materials.pants, leftLeg);
  leftThigh.position.y = -0.2;
  const leftShin = new TransformNode("hb-left-shin", scene);
  leftShin.parent = leftLeg;
  leftShin.position.y = -0.42;
  limb(scene, "hb-left-calf", { height: 0.38, diameterTop: 0.12, diameterBottom: 0.1, tessellation: 8 }, materials.pants, leftShin).position.y = -0.18;
  const leftFoot = MeshBuilder.CreateBox("hb-left-shoe", { width: 0.12, height: 0.08, depth: 0.24 }, scene);
  leftFoot.position = new Vector3(0, -0.4, 0.04);
  leftFoot.material = materials.sneaker;
  leftFoot.parent = leftShin;
  const leftSole = MeshBuilder.CreateBox("hb-left-sole", { width: 0.13, height: 0.025, depth: 0.25 }, scene);
  leftSole.position = new Vector3(0, -0.45, 0.04);
  leftSole.material = materials.sneakerSole;
  leftSole.parent = leftShin;

  const rightLeg = new TransformNode("hb-right-leg", scene);
  rightLeg.parent = root;
  rightLeg.position = new Vector3(0.11, 0.92, 0);
  limb(scene, "hb-right-thigh", { height: 0.42, diameterTop: 0.16, diameterBottom: 0.13, tessellation: 8 }, materials.pants, rightLeg).position.y = -0.2;
  const rightShin = new TransformNode("hb-right-shin", scene);
  rightShin.parent = rightLeg;
  rightShin.position.y = -0.42;
  limb(scene, "hb-right-calf", { height: 0.38, diameterTop: 0.12, diameterBottom: 0.1, tessellation: 8 }, materials.pants, rightShin).position.y = -0.18;
  const rightFoot = MeshBuilder.CreateBox("hb-right-shoe", { width: 0.12, height: 0.08, depth: 0.24 }, scene);
  rightFoot.position = new Vector3(0, -0.4, 0.04);
  rightFoot.material = materials.sneaker;
  rightFoot.parent = rightShin;
  const rightSole = MeshBuilder.CreateBox("hb-right-sole", { width: 0.13, height: 0.025, depth: 0.25 }, scene);
  rightSole.position = new Vector3(0, -0.45, 0.04);
  rightSole.material = materials.sneakerSole;
  rightSole.parent = rightShin;

  for (const [index, offset] of [[-0.16, 0.14], [-0.16, 0.06], [-0.09, 0.1]].entries()) {
    const star = MeshBuilder.CreateCylinder(`hb-shuriken-${index}`, { height: 0.02, diameter: 0.1, tessellation: 6 }, scene);
    star.rotation.x = Math.PI / 2;
    star.position = new Vector3(offset[0], 0.86, offset[1]);
    star.material = materials.steel;
    star.parent = root;
  }

  const slash = MeshBuilder.CreateTorus("hb-slash-arc", { diameter: 1.9, thickness: 0.045, tessellation: 18 }, scene);
  slash.rotation.x = Math.PI / 2;
  slash.position.y = 1.1;
  slash.material = materials.slash;
  slash.parent = root;
  slash.isVisible = false;

  const ring = MeshBuilder.CreateDisc("hb-player-ring", { radius: 0.55, tessellation: 24 }, scene);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.03;
  ring.material = materials.playerRing;
  ring.parent = root;

  const height = HERO_IDENTITY.heightMeters;
  root.scaling.setAll(height / 1.7);

  return {
    root,
    hips,
    leftArm,
    rightArm,
    leftFore,
    rightFore,
    leftLeg,
    rightLeg,
    leftShin,
    rightShin,
    katana,
    slash,
    backMark,
    head,
    height,
  };
}

export function syncHoneyBadger(actor, world, dt) {
  const player = world.player;
  actor.root.position.x = player.x;
  actor.root.position.z = player.z;
  const yaw = Math.atan2(player.facingX, player.facingZ);
  actor.root.rotation.y = yaw;
  const moving = Math.hypot(world.input.moveX, world.input.moveZ) > 0.08;
  const phase = world.time * (moving ? 10 : 2.2);
  const stride = moving ? 0.55 : 0.06;
  actor.leftLeg.rotation.x = Math.sin(phase) * stride;
  actor.rightLeg.rotation.x = Math.sin(phase + Math.PI) * stride;
  actor.leftShin.rotation.x = Math.max(0, -Math.sin(phase) * stride * 0.6);
  actor.rightShin.rotation.x = Math.max(0, -Math.sin(phase + Math.PI) * stride * 0.6);
  actor.leftArm.rotation.x = Math.sin(phase + Math.PI) * stride * 0.45;
  if (player.swinging || player.attackActive > 0) {
    const swing = 1 - player.attackActive / 0.16;
    actor.rightArm.rotation.x = -1.15 + swing * 2.1;
    actor.rightArm.rotation.z = 0.35;
    actor.rightFore.rotation.x = -0.4;
    actor.slash.isVisible = true;
    actor.slash.rotation.z = swing * Math.PI;
    actor.slash.visibility = 1 - swing;
  } else {
    actor.rightArm.rotation.x = Math.sin(phase) * stride * 0.35;
    actor.rightArm.rotation.z = 0.12;
    actor.rightFore.rotation.x = -0.15;
    actor.slash.isVisible = false;
  }
  actor.hips.rotation.z = moving ? Math.sin(phase) * 0.04 : 0;
  return dt;
}
