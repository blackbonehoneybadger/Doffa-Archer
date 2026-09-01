import { MeshBuilder, Vector3 } from "@babylonjs/core";

export function createCombatFx(scene, materials) {
  const telegraphById = new Map();
  const projectileMeshes = [];

  function ringFor(id) {
    let mesh = telegraphById.get(id);
    if (!mesh) {
      mesh = MeshBuilder.CreateDisc(`telegraph-${id}`, { radius: 0.7, tessellation: 28 }, scene);
      mesh.rotation.x = Math.PI / 2;
      mesh.material = materials.telegraph;
      telegraphById.set(id, mesh);
    }
    return mesh;
  }

  function projectileMesh(index) {
    let mesh = projectileMeshes[index];
    if (!mesh) {
      mesh = MeshBuilder.CreateSphere(`seed-shot-${index}`, { diameter: 0.22, segments: 8 }, scene);
      mesh.material = materials.vein;
      projectileMeshes[index] = mesh;
    }
    return mesh;
  }

  return {
    sync(world) {
      for (const enemy of world.enemies) {
        const ring = ringFor(enemy.id);
        ring.setEnabled(enemy.alive);
        ring.position = new Vector3(enemy.x, 0.04, enemy.z);
        const charging = enemy.telegraph > 0;
        ring.scaling.setAll(charging ? 1.15 + (1 - enemy.telegraph / Math.max(enemy.attackWindup, 0.01)) * 0.4 : 0.85);
        ring.visibility = charging ? 0.9 : 0.28;
      }
      world.projectiles.forEach((shot, index) => {
        const mesh = projectileMesh(index);
        mesh.setEnabled(true);
        mesh.position = new Vector3(shot.x, 0.45, shot.z);
      });
      for (let index = world.projectiles.length; index < projectileMeshes.length; index += 1) {
        projectileMeshes[index].setEnabled(false);
      }
    },
  };
}
