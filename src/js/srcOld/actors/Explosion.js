import * as THREE from "../../../js/three.js";
import { getTanks } from "./Tank.js";
import { getBullets } from "./Bullet.js";

const radius = 3;
const time = 0.2;

const g_explosion = new THREE.SphereGeometry(1, 5, 5, 0, Math.PI, 0, Math.PI);
const m_explosion = new THREE.MeshPhongMaterial({ color: 0xff0000 });

const explosions = [];

export const spawnExplosion = (scene, position) => {
  const explosion = {};
  explosion.time = time;
  explosion.mesh = new THREE.Mesh(g_explosion, m_explosion);
  Object.assign(explosion.mesh.position, position);
  Object.assign(
    explosion.mesh.scale,
    new THREE.Vector3({ x: 0.1, y: 0.1, z: 0.1 })
  );
  explosion.mesh.rotation.x = -Math.PI / 2;
  explosion.destroy = () => {
    scene.remove(explosion.mesh);
    explosions.splice(explosions.indexOf(explosion), 1);
  };
  explosions.push(explosion);
  scene.add(explosion.mesh);

  const bounding = new THREE.Box3(
    new THREE.Vector3(-radius + position.x, -100, -radius + position.z),
    new THREE.Vector3(radius + position.x, 100, radius + position.z)
  );

  const tanks = getTanks();
  for (let i = 0; i < tanks.length; ++i) {
    const tank = tanks[i];
    if (tank.getBoundingBox().intersectsBox(bounding)) tank.destroy();
  }
  const bullets = getBullets();
  for (let i = 0; i < bullets.length; ++i) {
    const bullet = bullets[i];
    if (bullet.getBoundingBox().intersectsBox(bounding)) bullet.destroy();
  }
};

export const updateExplosions = (delta) => {
  for (let i = 0; i < explosions.length; ++i) {
    const explosion = explosions[i];
    explosion.time -= delta;
    const r = (radius * (time - explosion.time)) / time;
    explosion.mesh.scale.set(r, r, r);
    if (explosion.time < 0) explosion.destroy();
  }
};
