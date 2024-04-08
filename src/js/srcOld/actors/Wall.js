// @ts-check

import * as THREE from "../../../js/three.js";
import { addCollidable } from "../engine/CollisionManager.js";
const size = 1;

const g_wall = new THREE.BoxGeometry(size, 1, size);
const m_wall = new THREE.MeshPhongMaterial({ color: 0xffffff });
const m_breakableWall = new THREE.MeshPhongMaterial({ color: 0xee8888 });

/**
 *
 * @param {number} x
 * @param {number} y
 * @returns {THREE.Mesh}
 */
export const createWall = (x, y) => {
  const mesh = new THREE.Mesh(g_wall, m_wall);
  Object.assign(mesh.position, { x, y: 0.5, z: y });
  addCollidable("wall", { x: x - size / 2, y: y - size / 2, w: size, h: size });
  return mesh;
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @returns {THREE.Mesh}
 */
export const createBreakableWall = (x, y) => {
  const mesh = new THREE.Mesh(g_wall, m_breakableWall);
  Object.assign(mesh.position, { x, y: 0.5, z: y });
  addCollidable("wall", { x: x - size / 2, y: y - size / 2, w: size, h: size });
  return mesh;
};
