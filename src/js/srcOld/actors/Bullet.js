// @ts-check
import { createActor } from "../../../js/src/engine/Actor.js";
import * as THREE from "../../../js/three.js";
import { addCollidable, getCollisionDirection, removeCollidable } from "../engine/CollisionManager.js";
import { getMines } from "./Mine.js";

const m_bullet = new THREE.MeshPhongMaterial({ color: 0xffffff });
const g_bullet = (() => {
  /** The radius of the bullet */
  const radius = 0.06;
  /** The length of the bullet */
  const length = 0.4;
  /** The segments for revolutions (circle) */
  const segments = 8;
  /** The steps for taper (detail of pointiness) which the body is divided on. 0 means it's a cone (segment+1 vertices) */
  const steps = 2;
  /** The percentage at which it is full width (pointiness) */
  const taporFraction = 0.2;

  const vertices = (() => {
    // Initialize the verticies with the single pointy vertex
    const vertices = [
      {
        position: [0, 0, 0],
        normal: [-1, 0, 0],
      },
    ];
    // For each step of the taper part, generate the segment
    for (let step = 0; step < steps; ++step) {
      // The radius is a sine interpolated from 0-PI/2
      const r = radius * Math.sin(((step + 1) * Math.PI) / 2 / steps);
      // The x coordinate is interpolated from 0 to taporFraction of the length
      const x = (length * taporFraction * (step + 1)) / steps;
      // Generate the ring segment for that 
      for (let i = 0; i < segments; ++i) {
        const theta = (i * Math.PI * 2) / segments;
        const y = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;
        vertices.push({
          position: [x, y, z],
          normal: [0, Math.cos(theta), Math.sin(theta)],
        });
      }
    }
    // Generate the final circle segment at the bullet's end
    for (let i = 0; i < segments; ++i) {
      const theta = (i * Math.PI * 2) / segments;
      const y = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      vertices.push({
        position: [length, y, z],
        normal: [0, Math.cos(theta), Math.sin(theta)],
      });
    }
    return vertices;
  })()

  const faceIndecies = (() => {
    const faceIndecies = [0, 1, segments];
    for (let i = 0; i < segments - 1; ++i)
      faceIndecies.push(0, i + 2, i + 1);

    for (let step = 0; step < steps; ++step) {
      const offset1 = 1 + segments * step;
      const offset2 = 1 + segments * (step + 1);

      // Wrap-around indicies so we don't have to do modulus 
      faceIndecies.push(offset1 + segments - 1, offset1, offset2 + segments - 1);
      faceIndecies.push(offset1, offset2, offset2 + segments - 1);

      for (let i = 0; i < segments - 1; ++i) {
        faceIndecies.push(offset1 + i, offset1 + i + 1, offset2 + i);
        faceIndecies.push(offset1 + i + 1, offset2 + i + 1, offset2 + i);
      }
    }
    const start = 1 + steps * segments;
    for (let i = 1; i < segments - 1; ++i)
      faceIndecies.push(start, start + i, start + i + 1);

    return faceIndecies;
  })()

  const positions = vertices.flatMap(v => v.position);
  const normals = vertices.flatMap(v => v.normal);

  const geometry = new THREE.BufferGeometry();
  geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3(0, -radius, -radius),
    new THREE.Vector3(length, radius, radius)
  );
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(positions), 3)
  );
  geometry.setAttribute(
    "normal",
    new THREE.BufferAttribute(new Float32Array(normals), 3)
  );
  geometry.setIndex(faceIndecies);
  return geometry;
})();
const size = Math.max(g_bullet.boundingBox.max.x - g_bullet.boundingBox.min.x, g_bullet.boundingBox.max.z - g_bullet.boundingBox.min.z);

/**
 * @typedef {import('../engine/Actor.js').Actor & {bouncesLeft: number, velocity: THREE.Vector3}} Bullet
 */

/** @type {Bullet[]} */
const bullets = [];

export const spawnBullet = (scene, position, angle) => {
  /** @type {Bullet} */
  const speed = 0.2;
  const mesh = new THREE.Mesh(g_bullet, m_bullet);
  Object.assign(bullet.mesh.position, position);
  const bounds = { x: position.x, y: position.z, w: size, h: size }
  const bouncesLeft = 1;

  mesh.rotateY(Math.PI - angle);
  const velocity = new THREE.Vector3(
    Math.cos(angle) * speed,
    0,
    Math.sin(angle) * speed
  );

  const destroy = () => {
    scene.remove(bullet.mesh);
    bullets.splice(bullets.indexOf(bullet), 1);
  };
  bullet.getBoundingBox = () => {
    const bounding = g_bullet.boundingBox.clone();
    bounding.applyMatrix4(bullet.mesh.matrixWorld);
    return bounding;
  };

  /** @param {import("../engine/CollisionManager.js").Collidable} collidable */
  const onCollide = ({ bounds: otherBounds, type, onCollision: otherCollision }) => {
    console.log(type);
    if (type === "bullet") {
      if (otherCollision) otherCollision(bullet);
      bullet.destroy();
      removeCollidable("bullet", bullet.bounds);
    }

    if (type !== 'wall') return;
    const dir = getCollisionDirection(otherBounds, bounds);

    if (dir === "TOP" || dir == "BOT") {
      bullet.velocity.z = -bullet.velocity.z;
      bullet.mesh.rotateY(Math.PI / 2);
    }
    else {
      bullet.velocity.x = -bullet.velocity.x;
      bullet.mesh.rotateY(Math.PI / 2);
    }

  };

  const bullet = { ...createActor(scene, mesh, 'bullet', bounds, { onDestroy: destroy, onCollide }), ...{ bouncesLeft, velocity } }

  bullets.push(bullet);
  scene.add(bullet.mesh);
};

export const updateBullets = (delta) => {
  for (let i = 0; i < bullets.length; ++i) {
    const bullet = bullets[i];
    const displacement = bullet.velocity.clone().multiplyScalar(delta * 30)
    bullet.mesh.position.add(displacement);
    bullet.bounds.x += displacement.x;
    bullet.bounds.y += displacement.z;
  }
};

export const getBullets = () => bullets;
