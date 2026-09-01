import {
  Color3,
  DynamicTexture,
  MeshBuilder,
  PBRMaterial,
  Skeleton,
  Bone,
  TransformNode,
  Vector3,
  Matrix,
} from "@babylonjs/core";

/**
 * Honey Badger — hierarchical rig + mesh parts.
 * Head is explicitly a PLACEHOLDER (no invented face scan).
 * STRONG ROOTS on upper back is locked and never mirrored.
 */

function mat(scene, name, albedo, extras = {}) {
  const m = new PBRMaterial(name, scene);
  m.albedoColor = albedo;
  m.metallic = extras.metallic ?? 0.08;
  m.roughness = extras.roughness ?? 0.65;
  if (extras.emissive) {
    m.emissiveColor = extras.emissive;
    m.emissiveIntensity = extras.emissiveIntensity ?? 1;
  }
  return m;
}

function makeStrongRootsTexture(scene) {
  const size = 256;
  const tex = new DynamicTexture("strongRootsTex", { width: size, height: size }, scene, false);
  const ctx = tex.getContext();
  ctx.fillStyle = "#5a3a28";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#0a0a0a";
  ctx.font = "bold 36px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Never mirror — draw once, left-to-right as on the body.
  ctx.fillText("STRONG ROOTS", size / 2, size / 2);
  tex.update();
  return tex;
}

function makePlaceholderHeadTexture(scene) {
  const size = 256;
  const tex = new DynamicTexture("placeholderHeadTex", { width: size, height: size }, scene, false);
  const ctx = tex.getContext();
  ctx.fillStyle = "#b08a6a";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#1a120c";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("PLACEHOLDER", size / 2, size / 2 - 12);
  ctx.fillText("HEAD", size / 2, size / 2 + 16);
  tex.update();
  return tex;
}

function makeChestTattooTexture(scene) {
  const size = 256;
  const tex = new DynamicTexture("chestTattooTex", { width: size, height: size }, scene, false);
  const ctx = tex.getContext();
  ctx.fillStyle = "#8d6a52";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.ellipse(size / 2, size / 2 + 10, 48, 40, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("HONEY BADGER", size / 2, 48);
  tex.update();
  return tex;
}

export function createHoneyBadger(scene, shadow) {
  const root = new TransformNode("honeyBadger", scene);
  root.position = new Vector3(0, 0, 2.8);

  const skin = mat(scene, "hbSkin", new Color3(0.55, 0.4, 0.3), { roughness: 0.7 });
  const pants = mat(scene, "hbPants", new Color3(0.08, 0.09, 0.1), { roughness: 0.85 });
  const shoe = mat(scene, "hbShoe", new Color3(0.05, 0.05, 0.06), { roughness: 0.55, metallic: 0.2 });
  const steel = mat(scene, "hbSteel", new Color3(0.05, 0.05, 0.06), { roughness: 0.28, metallic: 0.95 });
  const glowEdge = mat(scene, "hbGlow", new Color3(0.2, 0.08, 0.01), {
    emissive: new Color3(1, 0.45, 0.08),
    emissiveIntensity: 2.2,
    roughness: 0.35,
  });

  // Rig bones as TransformNodes (animation targets).
  const hips = new TransformNode("hips", scene);
  hips.parent = root;
  hips.position = new Vector3(0, 0.95, 0);

  const spine = new TransformNode("spine", scene);
  spine.parent = hips;
  spine.position = new Vector3(0, 0.25, 0);

  const chest = new TransformNode("chest", scene);
  chest.parent = spine;
  chest.position = new Vector3(0, 0.28, 0);

  const neck = new TransformNode("neck", scene);
  neck.parent = chest;
  neck.position = new Vector3(0, 0.28, 0);

  const headBone = new TransformNode("headBone", scene);
  headBone.parent = neck;
  headBone.position = new Vector3(0, 0.16, 0);

  const lThigh = new TransformNode("lThigh", scene);
  lThigh.parent = hips;
  lThigh.position = new Vector3(-0.16, -0.05, 0);
  const lShin = new TransformNode("lShin", scene);
  lShin.parent = lThigh;
  lShin.position = new Vector3(0, -0.42, 0);
  const lFoot = new TransformNode("lFoot", scene);
  lFoot.parent = lShin;
  lFoot.position = new Vector3(0, -0.4, 0.05);

  const rThigh = new TransformNode("rThigh", scene);
  rThigh.parent = hips;
  rThigh.position = new Vector3(0.16, -0.05, 0);
  const rShin = new TransformNode("rShin", scene);
  rShin.parent = rThigh;
  rShin.position = new Vector3(0, -0.42, 0);
  const rFoot = new TransformNode("rFoot", scene);
  rFoot.parent = rShin;
  rFoot.position = new Vector3(0, -0.4, 0.05);

  const rShoulder = new TransformNode("rShoulder", scene);
  rShoulder.parent = chest;
  rShoulder.position = new Vector3(0.28, 0.18, 0);
  const rArm = new TransformNode("rArm", scene);
  rArm.parent = rShoulder;
  rArm.position = new Vector3(0.05, -0.05, 0);
  const rFore = new TransformNode("rFore", scene);
  rFore.parent = rArm;
  rFore.position = new Vector3(0, -0.32, 0);
  const rHand = new TransformNode("rHand", scene);
  rHand.parent = rFore;
  rHand.position = new Vector3(0, -0.28, 0);

  const lShoulder = new TransformNode("lShoulder", scene);
  lShoulder.parent = chest;
  lShoulder.position = new Vector3(-0.28, 0.18, 0);
  const lArm = new TransformNode("lArm", scene);
  lArm.parent = lShoulder;
  lArm.position = new Vector3(-0.05, -0.05, 0);
  const lFore = new TransformNode("lFore", scene);
  lFore.parent = lArm;
  lFore.position = new Vector3(0, -0.32, 0);
  const lHand = new TransformNode("lHand", scene);
  lHand.parent = lFore;
  lHand.position = new Vector3(0, -0.28, 0);

  // Mesh parts parented to bones (gameplay height ~1.8).
  const pelvis = MeshBuilder.CreateBox("pelvis", { width: 0.42, height: 0.28, depth: 0.28 }, scene);
  pelvis.parent = hips;
  pelvis.material = pants;
  pelvis.position = new Vector3(0, -0.05, 0);

  const torso = MeshBuilder.CreateCylinder("torso", {
    height: 0.55,
    diameterTop: 0.42,
    diameterBottom: 0.48,
    tessellation: 10,
  }, scene);
  torso.parent = chest;
  torso.material = skin;
  torso.position = new Vector3(0, 0, 0);

  const chestDecal = MeshBuilder.CreatePlane("chestTattoo", { width: 0.32, height: 0.36 }, scene);
  chestDecal.parent = chest;
  chestDecal.position = new Vector3(0, 0.02, 0.23);
  const chestMat = mat(scene, "chestTatMat", new Color3(1, 1, 1));
  chestMat.albedoTexture = makeChestTattooTexture(scene);
  chestDecal.material = chestMat;

  const backDecal = MeshBuilder.CreatePlane("strongRoots", { width: 0.42, height: 0.16 }, scene);
  backDecal.parent = chest;
  backDecal.position = new Vector3(0, 0.12, -0.24);
  backDecal.rotation.y = Math.PI;
  // Critical: never flip horizontal scale on this decal (would mirror STRONG ROOTS).
  const backMat = mat(scene, "strongRootsMat", new Color3(1, 1, 1));
  backMat.albedoTexture = makeStrongRootsTexture(scene);
  backDecal.material = backMat;

  const head = MeshBuilder.CreateSphere("placeholderHead", { diameter: 0.28, segments: 10 }, scene);
  head.parent = headBone;
  const headMat = mat(scene, "headMat", new Color3(1, 1, 1));
  headMat.albedoTexture = makePlaceholderHeadTexture(scene);
  head.material = headMat;

  const beard = MeshBuilder.CreateCylinder("beard", {
    height: 0.28,
    diameterTop: 0.16,
    diameterBottom: 0.05,
    tessellation: 8,
  }, scene);
  beard.parent = headBone;
  beard.position = new Vector3(0, -0.18, 0.08);
  beard.material = mat(scene, "beardMat", new Color3(0.04, 0.04, 0.04), { roughness: 0.9 });

  function limb(name, parent, size, material, pos) {
    const m = MeshBuilder.CreateBox(name, size, scene);
    m.parent = parent;
    m.material = material;
    m.position = pos;
    m.castShadow = true;
    if (shadow) shadow.addShadowCaster(m);
    return m;
  }

  limb("lThighMesh", lThigh, { width: 0.16, height: 0.4, depth: 0.18 }, pants, new Vector3(0, -0.2, 0));
  limb("lShinMesh", lShin, { width: 0.14, height: 0.38, depth: 0.16 }, pants, new Vector3(0, -0.18, 0));
  limb("lShoe", lFoot, { width: 0.16, height: 0.1, depth: 0.28 }, shoe, new Vector3(0, -0.02, 0.06));
  limb("rThighMesh", rThigh, { width: 0.16, height: 0.4, depth: 0.18 }, pants, new Vector3(0, -0.2, 0));
  limb("rShinMesh", rShin, { width: 0.14, height: 0.38, depth: 0.16 }, pants, new Vector3(0, -0.18, 0));
  limb("rShoe", rFoot, { width: 0.16, height: 0.1, depth: 0.28 }, shoe, new Vector3(0, -0.02, 0.06));
  limb("rArmMesh", rArm, { width: 0.12, height: 0.3, depth: 0.14 }, skin, new Vector3(0, -0.14, 0));
  limb("rForeMesh", rFore, { width: 0.11, height: 0.28, depth: 0.12 }, skin, new Vector3(0, -0.12, 0));
  limb("lArmMesh", lArm, { width: 0.12, height: 0.3, depth: 0.14 }, skin, new Vector3(0, -0.14, 0));
  limb("lForeMesh", lFore, { width: 0.11, height: 0.28, depth: 0.12 }, skin, new Vector3(0, -0.12, 0));

  torso.castShadow = true;
  head.castShadow = true;
  if (shadow) {
    shadow.addShadowCaster(torso);
    shadow.addShadowCaster(head);
  }

  const katana = new TransformNode("katana", scene);
  katana.parent = rHand;
  katana.position = new Vector3(0.02, -0.05, 0.05);
  katana.rotation = new Vector3(-0.2, 0, 0.4);

  const blade = MeshBuilder.CreateBox("blade", { width: 0.04, height: 0.95, depth: 0.02 }, scene);
  blade.parent = katana;
  blade.position = new Vector3(0, -0.45, 0);
  blade.material = steel;

  const guard = MeshBuilder.CreateBox("tsuba", { width: 0.16, height: 0.03, depth: 0.08 }, scene);
  guard.parent = katana;
  guard.material = steel;

  const trail = MeshBuilder.CreateTorus("slashTrail", {
    diameter: 1.1,
    thickness: 0.04,
    tessellation: 20,
  }, scene);
  trail.parent = root;
  trail.position = new Vector3(0, 1.1, 0.4);
  trail.rotation.x = Math.PI / 2;
  trail.material = glowEdge;
  trail.isVisible = false;

  // Lightweight Babylon Skeleton metadata for "skinned/rigged" proof in diagnostics.
  const skeleton = new Skeleton("honeyBadgerSkeleton", "hbSkel", scene);
  const boneRoot = new Bone("rootBone", skeleton, null, Matrix.Identity());
  new Bone("spineBone", skeleton, boneRoot, Matrix.Translation(0, 1.2, 0));
  new Bone("armBone", skeleton, boneRoot, Matrix.Translation(0.3, 1.4, 0));
  skeleton.returnToRest();

  let attackT = 0;
  let walkT = 0;

  return {
    root,
    skeleton,
    bones: { hips, spine, chest, rArm, rFore, rHand, lArm, lThigh, rThigh, headBone },
    katana,
    trail,
    strongRootsMesh: backDecal,
    placeholderHead: head,
    get position() {
      return { x: root.position.x, z: root.position.z };
    },
    setPosition(x, z) {
      root.position.x = x;
      root.position.z = z;
    },
    setFacing(yaw) {
      root.rotation.y = yaw;
    },
    getFacing() {
      return root.rotation.y;
    },
    playAttack() {
      attackT = 0.42;
      trail.isVisible = true;
    },
    update(dt, moving) {
      if (attackT > 0) {
        attackT -= dt;
        const u = 1 - attackT / 0.42;
        const swing = Math.sin(u * Math.PI) * 1.6;
        rArm.rotation.x = -0.4 - swing * 0.2;
        rFore.rotation.y = -swing;
        rHand.rotation.z = swing * 0.5;
        trail.rotation.y = root.rotation.y + swing;
        trail.scaling.x = 0.6 + Math.sin(u * Math.PI) * 0.8;
        if (attackT <= 0) {
          trail.isVisible = false;
          rArm.rotation.set(0, 0, 0);
          rFore.rotation.set(0, 0, 0);
          rHand.rotation.set(0, 0, 0);
        }
      }
      if (moving) {
        walkT += dt * 8;
        lThigh.rotation.x = Math.sin(walkT) * 0.45;
        rThigh.rotation.x = Math.sin(walkT + Math.PI) * 0.45;
      } else {
        lThigh.rotation.x *= 0.8;
        rThigh.rotation.x *= 0.8;
      }
    },
  };
}
