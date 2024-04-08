// @ts-check

import { Clock } from "../three.js";
import { PlayerController } from "./controllers/PlayerController.js";
import { Wall } from "./actors/Wall.js";
import { updateBullets } from "./actors/Bullet.js";
import {
  clearCollidables,
  resolveCollisions,
} from "./engine/CollisionManager.js";
import { renderContext } from "./Ouitanks.js";

const levelWidth = 23;
const levelHeight = 17;

/** @type {((delta:number)=>any)[]} */
const updatables = [];

/**
 * @param {string} objectCode
 * @param {number} x
 * @param {number} y
 */
const createObject = (objectCode, x, y) => {
  const scene = renderContext.scene;
  switch (objectCode) {
    case " ":
      break;
    case "X":
      new Wall(scene, x, y, false);
      break;
    case "I":
      new Wall(scene, x, y, true);
      break;
    case "1":
      const playerController = PlayerController(scene, x, y);
      updatables.push(playerController.update);
      break;
    default:
      console.error("Unknown level code", objectCode);
      break;
  }
};

/**
 * @param {number} delta 
 */
const updateGame = (delta) => {
  for (let i = 0; i < updatables.length; ++i)
    updatables[i](delta);
  updateBullets(delta);
};

const runLevel = () => {
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
  // Clear previous objects
  updatables.length = 0;

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
      createObject(row[x], x - levelWidth / 2, y - levelHeight / 2);
    }
  }

  updateCamera();
  runLevel();
};

/**
 * @param {(delta:number)=>any} update
 */
export const addUpdatable = (update) =>
  updatables.push(update);

/**
 * @param {(delta:number)=>any} update
 */
export const removeUpdatable = (update) => {
  const index = updatables.indexOf(update);
  if (index !== -1)
    updatables.splice(index, 1);
}