import * as THREE from "../../../js/three.js";
import { spawnExplosion } from "./Explosion.js";

/** @type {[import('../engine/Actor.js').Actor & {time: number}]} */
const mines = [];
export const getMines = () => mines;

const MINE_TIME = 5;

const radius = 0.2;
const g_mine = new THREE.SphereGeometry(radius, 5, 5, 0, Math.PI, 0, Math.PI);
g_mine.boundingBox = new THREE.Box3(
  new THREE.Vector3(-radius, -100, -radius),
  new THREE.Vector3(radius, 100, radius)
);
const m_mine = new THREE.MeshPhongMaterial({ color: 0x000000 });

export const plantMine = (scene, position) => {
  const mesh = new THREE.Mesh(g_mine, m_mine.clone());

  Object.assign(mesh.position, position);
  mesh.rotation.x = -Math.PI / 2;

  const mine = { mesh, time: MINE_TIME };

  mine.destroy = () => {
    scene.remove(mesh);
    mesh.material.dispose(); // Since it is a clone, we dispose the clone
    mines.splice(mines.indexOf(mine), 1);
    spawnExplosion(scene, position);
  };

  // Since the mine doesn't move, we can precompute the transformation
  const bounding = mesh.geometry.boundingBox.clone();
  bounding.min.x += position.x;
  bounding.max.x += position.x;
  bounding.min.z += position.z;
  bounding.min.z += position.z;

  bounding.applyMatrix4(mesh.matrixWorld);
  mine.getBoundingBox = () => bounding;
  console.log(bounding.min, bounding.max);

  mines.push(mine);
  scene.add(mesh);
};

export const updateMines = (delta) => {
  for (let i = 0; i < mines.length; ++i) {
    const mine = mines[i];
    if ((mine.time -= delta) < 0) mine.destroy();
    const colval = (MINE_TIME / mine.time) % 2;
    mine.mesh.material.color.set(colval > 1 ? 0xffff00 : 0xff0000);
    if (mine) mine.mesh.remove();

    // mine.mesh.rotation.x += delta * 0.001;
  }
};
