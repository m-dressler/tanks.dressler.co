// @ts-check

import { Clock } from "../../js/three.js";
import { PlayerController } from "./controllers/PlayerController.js";
import { createWall, createBreakableWall } from "./actors/Wall.js";
import { updateBullets } from "./actors/Bullet.js";
import { updateMines } from "./actors/Mine.js";
import { updateExplosions } from "./actors/Explosion.js";
import {
  clearCollidables,
  resolveCollisions,
} from "./engine/CollisionManager.js";
import { renderContext } from "./Ouitanks.js";

const levelWidth = 23;
const levelHeight = 17;

const createObject = (updatables, objectCode, x, y) => {
  const scene = renderContext.scene;
  switch (objectCode) {
    case " ":
      break;
    case "X":
      scene.add(createWall(x, y));
      break;
    case "I":
      scene.add(createBreakableWall(x, y));
      break;
    case "1":
      const playerController = PlayerController(scene, x, y);
      updatables.push(playerController);
      break;
    default:
      console.error("Unknown level code", objectCode);
      break;
  }
};

const runLevel = (updatables) => {
  const updateGame = (delta) => {
    for (let i = 0; i < updatables.length; ++i) updatables[i].update(delta);

    updateBullets(delta);
    updateMines(delta);
    updateExplosions(delta);
  };

  const clock = new Clock();
  function animate() {
    requestAnimationFrame(animate);
    updateGame(clock.getDelta());
    resolveCollisions();
    const { renderer, scene, camera } = renderContext;
    renderer.render(scene, camera);
  }
  animate();
};

const updateCamera = () => {
  const camera = renderContext.camera;
  const width = camera.right - camera.left;
  const height = camera.top - camera.bottom;

  const zoom = Math.min(width / levelWidth, height / levelHeight);
  camera.zoom = zoom;
  camera.position.set(0, 50, 30);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
};

/**
 * @param {number} level
 */
export const loadLevel = async (level) => {
  const res = await fetch(`/levels/${level}.lvl`);
  const map = await res.text();
  
  clearCollidables();
  const updatables = [];

  const rows = map.split("\n");
  if (rows.length !== levelHeight)
    console.error(`Level height should be ${levelHeight} (is ${rows.length})`);

  for (let y = 0; y < rows.length; ++y) {
    const row = rows[y];
    if (row.length !== levelWidth)
      console.error(
        `Level width should be ${levelWidth} (is ${row.length} at row ${y})`
      );
    for (let x = 0; x < row.length; ++x) {
      createObject(updatables, row[x], x - levelWidth / 2, y - levelHeight / 2);
    }
  }

  updateCamera();
  runLevel(updatables);
};
