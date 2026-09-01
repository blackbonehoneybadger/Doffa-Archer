import * as THREE from "three";
import { VIEWPORT } from "../config/game-config.js";
import { getEnemyDefinition } from "./content.js";
import {
  getEnemyDirectionalStateFrame,
  getEnemyFullMotionFrame,
  getEnemyReactionAnimationState,
  getEnemySpecialAnimationState,
} from "./enemy-animation.js";
import {
  getSpriteRenderMetrics,
  HERO_COMBAT_ANCHOR_Y,
  HERO_COMBAT_RENDER_HEIGHT,
} from "./sprite-render-metrics.js";
import { getRoomArt } from "./room-art.js";

const TAU = Math.PI * 2;

function gameToWorld(x, y) {
  return {
    x: x - VIEWPORT.width * 0.5,
    z: y * 0.92,
  };
}

function textureFromCanvasSource(source) {
  if (!source) {
    return null;
  }
  const texture = new THREE.CanvasTexture(source);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function disposeMaterial(material) {
  if (!material) {
    return;
  }
  material.map?.dispose();
  material.dispose();
}

export class ArenaRenderer3D {
  constructor({ canvas }) {
    this.canvas = canvas;
    this.isSupported = typeof WebGLRenderingContext !== "undefined";
    if (!this.isSupported) {
      return;
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(VIEWPORT.width, VIEWPORT.height, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x070504, 1);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x120a07, 0.00085);

    this.camera = new THREE.PerspectiveCamera(
      42,
      VIEWPORT.width / VIEWPORT.height,
      10,
      2600,
    );
    this.camera.position.set(0, 520, 430);
    this.camera.lookAt(0, 0, 560);

    this.ambient = new THREE.AmbientLight(0xffd2a0, 0.55);
    this.keyLight = new THREE.DirectionalLight(0xff8a3d, 1.35);
    this.keyLight.position.set(120, 420, 260);
    this.fillLight = new THREE.DirectionalLight(0x6a8fd4, 0.35);
    this.fillLight.position.set(-180, 260, 120);
    this.rimLight = new THREE.PointLight(0xff5a1f, 0.8, 1400, 1.6);
    this.rimLight.position.set(0, 180, 820);
    this.scene.add(this.ambient, this.keyLight, this.fillLight, this.rimLight);

    this.roomMesh = null;
    this.roomTexture = null;
    this.roomTextureKey = null;
    this.entityRoot = new THREE.Group();
    this.scene.add(this.entityRoot);
    this.entitySprites = new Map();
  }

  renderFrame(game) {
    if (!this.isSupported) {
      return;
    }

    this.syncRoom(game);
    this.syncEntities(game);
    this.renderer.render(this.scene, this.camera);
  }

  syncRoom(game) {
    const environment = game.roomDefinition?.environment ?? "ash";
    const roomArt = getRoomArt(environment, {
      roomId: game.roomDefinition?.id,
      roomNumber: game.room,
      artVariant: game.roomDefinition?.artVariant,
    });
    const roomSprite = roomArt ? game.roomSprites.get(roomArt.sprite) : null;
    const textureKey = roomArt?.sprite ?? "procedural";

    if (textureKey === this.roomTextureKey) {
      if (this.roomTexture && roomSprite) {
        this.roomTexture.needsUpdate = true;
      }
      return;
    }

    if (this.roomMesh) {
      this.scene.remove(this.roomMesh);
      this.roomMesh.geometry.dispose();
      disposeMaterial(this.roomMesh.material);
      this.roomMesh = null;
    }
    this.roomTexture?.dispose();
    this.roomTexture = null;
    this.roomTextureKey = textureKey;

    const floorWidth = 760;
    const floorDepth = 1180;
    const geometry = new THREE.PlaneGeometry(floorWidth, floorDepth, 1, 1);
    geometry.rotateX(-Math.PI * 0.5);

    let material;
    if (roomSprite) {
      this.roomTexture = textureFromCanvasSource(roomSprite);
      material = new THREE.MeshStandardMaterial({
        map: this.roomTexture,
        roughness: 0.82,
        metalness: 0.08,
      });
    } else {
      material = new THREE.MeshStandardMaterial({
        color: 0x24140f,
        roughness: 0.9,
        metalness: 0.04,
      });
    }

    this.roomMesh = new THREE.Mesh(geometry, material);
    this.roomMesh.position.set(0, 0, 620);
    this.scene.add(this.roomMesh);
  }

  syncEntities(game) {
    const seen = new Set();
    const entries = [];

    if (game.mode !== "idle" && game.player) {
      entries.push({
        id: "player",
        x: game.player.x,
        y: game.player.y,
        sprite: game.heroFullMotionSprite ?? game.heroMotionSprite ?? game.heroSprite,
        frame: null,
        height: HERO_COMBAT_RENDER_HEIGHT,
        anchorY: HERO_COMBAT_ANCHOR_Y,
        alpha: 1,
      });
    }

    for (const enemy of game.enemies) {
      if (!enemy.alive && !enemy.defeated) {
        continue;
      }
      const definition = getEnemyDefinition(enemy.type);
      const art = definition?.art;
      const spriteBundle = this.resolveEnemySprite(
        enemy,
        art,
        game.enemyMotionSprites.get(enemy.type) ?? null,
        game.enemySpecialSprites.get(enemy.type) ?? null,
        game.enemyReactionSprites.get(enemy.type) ?? null,
        game.enemySprites.get(enemy.type) ?? null,
      );
      if (!spriteBundle.sprite) {
        continue;
      }
      entries.push({
        id: enemy.id,
        x: enemy.x,
        y: enemy.y,
        sprite: spriteBundle.sprite,
        frame: spriteBundle.frame,
        height: art?.renderHeight ?? enemy.radius * 3.5,
        anchorY: art?.anchorY ?? 0.6,
        alpha: enemy.submerged ? 0.12 : 1,
      });
    }

    for (const entry of entries) {
      seen.add(entry.id);
      let mesh = this.entitySprites.get(entry.id);
      if (!mesh) {
        mesh = this.createBillboard();
        this.entityRoot.add(mesh);
        this.entitySprites.set(entry.id, mesh);
      }
      this.applyBillboard(mesh, entry);
    }

    for (const [id, mesh] of this.entitySprites.entries()) {
      if (seen.has(id)) {
        continue;
      }
      this.entityRoot.remove(mesh);
      disposeMaterial(mesh.material);
      mesh.geometry.dispose();
      this.entitySprites.delete(id);
    }
  }

  resolveEnemySprite(enemy, art, motionSprite, specialSprite, reactionSprite, staticSprite) {
    const reactionState = reactionSprite ? getEnemyReactionAnimationState(enemy) : null;
    const specialState = specialSprite ? getEnemySpecialAnimationState(enemy) : null;
    if (reactionState && reactionSprite) {
      return {
        sprite: reactionSprite,
        frame: getEnemyDirectionalStateFrame(
          enemy,
          reactionState,
          art?.reactionStateRows,
          art?.reactionAnimation,
        ),
      };
    }
    if (specialState && specialSprite) {
      return {
        sprite: specialSprite,
        frame: getEnemyDirectionalStateFrame(
          enemy,
          specialState,
          art?.specialStateRows,
          art?.specialAnimation,
        ),
      };
    }
    if (motionSprite) {
      return {
        sprite: motionSprite,
        frame: getEnemyFullMotionFrame(enemy, art?.motionStateRows, art?.motionAnimation),
      };
    }
    return {
      sprite: staticSprite,
      frame: null,
    };
  }

  createBillboard() {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      alphaTest: 0.04,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(geometry, material);
  }

  applyBillboard(mesh, entry) {
    if (!entry.sprite) {
      return;
    }
    const position = gameToWorld(entry.x, entry.y);
    mesh.position.set(position.x, entry.height * 0.42, position.z);
    mesh.material.opacity = entry.alpha ?? 1;

    const texture = this.buildEntityTexture(entry.sprite, entry.frame, entry.height, entry.anchorY);
    if (mesh.material.map && mesh.material.map !== texture) {
      mesh.material.map.dispose();
    }
    mesh.material.map = texture;
    mesh.material.needsUpdate = true;

    const aspect = texture.image.width / Math.max(texture.image.height, 1);
    mesh.scale.set(entry.height * aspect, entry.height, 1);
    mesh.lookAt(this.camera.position.x, mesh.position.y, this.camera.position.z);
  }

  buildEntityTexture(sprite, frame, targetHeight, anchorY) {
    const offscreen = document.createElement("canvas");
    const metrics = getSpriteRenderMetrics({
      spriteWidth: sprite.width,
      spriteHeight: sprite.height,
      columns: frame?.columns ?? 1,
      rows: frame?.rows ?? 1,
      targetHeight,
      anchorY,
    });
    offscreen.width = Math.max(1, Math.ceil(metrics.targetWidth));
    offscreen.height = Math.max(1, Math.ceil(metrics.targetHeight));
    const context = offscreen.getContext("2d");
    context.clearRect(0, 0, offscreen.width, offscreen.height);
    if (frame) {
      const sourceColumn = frame.column ?? frame.index % (frame.columns ?? 4);
      const sourceRow = frame.row ?? Math.floor(frame.index / (frame.columns ?? 4));
      const sourceX = sourceColumn * metrics.sourceWidth;
      const sourceY = sourceRow * metrics.sourceHeight;
      context.drawImage(
        sprite,
        sourceX,
        sourceY,
        metrics.sourceWidth,
        metrics.sourceHeight,
        metrics.destinationX,
        metrics.destinationY,
        metrics.targetWidth,
        metrics.targetHeight,
      );
    } else {
      context.drawImage(
        sprite,
        metrics.destinationX,
        metrics.destinationY,
        metrics.targetWidth,
        metrics.targetHeight,
      );
    }
    return textureFromCanvasSource(offscreen);
  }

  dispose() {
    if (!this.isSupported) {
      return;
    }
    for (const mesh of this.entitySprites.values()) {
      disposeMaterial(mesh.material);
      mesh.geometry.dispose();
    }
    this.entitySprites.clear();
    if (this.roomMesh) {
      this.roomMesh.geometry.dispose();
      disposeMaterial(this.roomMesh.material);
    }
    this.roomTexture?.dispose();
    this.renderer.dispose();
  }
}
