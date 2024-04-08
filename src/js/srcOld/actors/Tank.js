// @ts-check

import * as THREE from "../../../js/three.js";
import { addCollidable, getCollisionDirection } from "../engine/CollisionManager.js";
import { spawnBullet } from "./Bullet.js";
import { plantMine } from "./Mine.js";

const config = (() => {
  const config = {};

  config.baseLength = 0.8;
  config.baseWidth = 0.5;
  config.baseHeight = 0.3;

  config.trackLength = config.baseLength * 1.1;
  config.trackHeight = config.baseHeight * 1.1;
  config.trackWidth = config.baseWidth / 6;

  config.towerLength = config.baseWidth * 0.5;
  config.towerHeight = config.towerLength * 0.5;

  config.pipeRadius = 0.03;
  config.pipeLength = config.towerLength * 1.5;

  config.nozzleRadius = config.pipeRadius * 1.5;
  config.nozzleLength = config.pipeLength / 3;

  return config;
})();

const m_tankBody = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
const g_tankBody = (() =>
  new THREE.BoxGeometry(
    config.baseLength,
    config.baseHeight,
    config.baseWidth
  ))();
const g_tankTrack = (() => {
  const height = config.trackHeight / 2;

  const shape = new THREE.Shape();
  const detail = 15;
  for (let i = 0; i < detail; ++i) {
    shape.lineTo(
      -Math.sin((i / detail) * Math.PI) * height,
      -Math.cos((i / detail) * Math.PI) * height
    );
  }
  for (let i = 0; i < detail; ++i) {
    shape.lineTo(
      Math.sin((i / detail) * Math.PI) * height + config.trackLength - height,
      Math.cos((i / detail) * Math.PI) * height
    );
  }
  shape.lineTo(0, -height);

  const extrudeSettings = {
    steps: 2,
    depth: config.trackWidth,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.05,
    bevelOffset: 0,
    bevelSegments: 3,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();
  return geometry;
})();
const g_tankTowerBase = (() =>
  new THREE.BoxGeometry(
    config.towerLength,
    config.towerHeight,
    config.towerLength
  ))();
const g_tankTowerPipe = (() =>
  new THREE.CylinderGeometry(
    config.pipeRadius,
    config.pipeRadius,
    config.pipeLength,
    10
  ))();
const g_tankNozzle = (() =>
  new THREE.CylinderGeometry(
    config.nozzleRadius,
    config.nozzleRadius,
    config.nozzleLength,
    10
  ))();

/** @type {import('../engine/Actor.js').Actor[]} */
const tanks = [];

const createTankObject3D = () => {
  const base = new THREE.Mesh(g_tankBody, m_tankBody);
  const trackLeft = new THREE.Mesh(g_tankTrack, m_tankBody);
  trackLeft.translateZ(config.trackWidth / 2 + config.baseWidth / 2);
  const trackRight = new THREE.Mesh(g_tankTrack, m_tankBody);
  trackRight.translateZ(-config.trackWidth / 2 - config.baseWidth / 2);

  const towerBase = new THREE.Mesh(g_tankTowerBase, m_tankBody);
  const towerPipe = new THREE.Mesh(g_tankTowerPipe, m_tankBody);
  towerPipe.translateX(config.towerLength);
  towerPipe.rotateZ(Math.PI / 2);

  const nozzlePipe = new THREE.Mesh(g_tankNozzle, m_tankBody);
  nozzlePipe.translateY(-config.pipeLength / 2);
  towerPipe.add(nozzlePipe);

  const tower = new THREE.Object3D();
  tower.add(towerBase);
  tower.add(towerPipe);
  tower.translateY(config.baseHeight / 2 + config.towerHeight / 2);

  const tank = new THREE.Object3D();
  tank.add(base);
  tank.add(trackLeft);
  tank.add(trackRight);
  tank.add(tower);

  console.log(g_tankBody);
  const w = (g_tankTrack.boundingBox.max.x - g_tankTrack.boundingBox.min.x) * 1.1;
  const h = ((g_tankTrack.boundingBox.max.z - g_tankTrack.boundingBox.min.z) * 2 + g_tankBody.parameters.depth) * 1.1;
  const bounds = {
    x: -w / 2,
    y: -h / 2,
    w,
    h
  }

  return { tank, tower, towerBase, nozzlePipe, bounds };
};

export const createTank = (scene, x, y) => {
  const speed = 0.075;
  const rotSpeed = 0.1;
  const aimLocation = { x: x + 3, z: y };

  const aimPoint = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.2, 0.2),
    m_tankBody
  );
  aimPoint.translateX(aimLocation.x);
  scene.add(aimPoint);

  const { tank, tower, towerBase, nozzlePipe, bounds } = createTankObject3D();

  bounds.x += x;
  bounds.y += y;
  Object.assign(tank.position, { x: x, y: config.trackHeight / 2, z: y });
  scene.add(tank);

  const getAimAngle = () => {
    let pos = new THREE.Vector3();
    towerBase.getWorldPosition(pos);
    return Math.atan2(aimLocation.z - pos.z, aimLocation.x - pos.x);
  };

  const updateAim = () => {
    tower.rotation.y = -tank.rotation.y - getAimAngle();
  };
  const updateAimVisualization = (vector) => {
    aimPoint.position.set(vector.x, 0, vector.z);
  };

  const move = (delta, forward) => {
    const translate = speed * delta * 30 * (forward ? 1 : -1);
    tank.translateX(translate);
    bounds.x += Math.cos(tank.rotation.y) * translate;
    bounds.y += -Math.sin(tank.rotation.y) * translate;
    updateAim();
  };
  const turn = (delta, clockwise) => {
    const rotAmount = rotSpeed * delta * 30 * (clockwise ? 1 : -1);
    tank.rotation.y += rotAmount;
    updateAim();
  };
  const shoot = () => {
    let pos = new THREE.Vector3();
    nozzlePipe.getWorldPosition(pos);
    spawnBullet(scene, pos, getAimAngle());
  };
  const plantTankMine = () => {
    let pos = new THREE.Vector3();
    towerBase.getWorldPosition(pos);
    pos.y = 0;
    plantMine(scene, pos);
  };
  const setAim = (vector) => {
    Object.assign(aimLocation, { x: vector.x, z: vector.z });
    updateAimVisualization(vector);
    updateAim();
  };

  const destroy = () => {
    console.log("DESTROYING TANK");
  };

  /** @param {import("../engine/CollisionManager.js").Collidable} wall */
  const onCollision = ({ bounds: wallBounds }) => {
    const dir = getCollisionDirection(wallBounds, bounds);
    switch (dir) {
      case "TOP":
        bounds.y = wallBounds.y + wallBounds.h;
        tank.position.z = wallBounds.y + wallBounds.h + bounds.h / 2;
        break;
      case "BOT":
        bounds.y = wallBounds.y - bounds.h;
        tank.position.z = wallBounds.y - bounds.h / 2;
        break;
      case "LEF":
        bounds.x = wallBounds.x + wallBounds.w;
        tank.position.x = wallBounds.x + wallBounds.w + bounds.w / 2;
        break;
      case "RIG":
        bounds.x = wallBounds.x - bounds.w;
        tank.position.x = wallBounds.x - bounds.w / 2;
    }
  };

  addCollidable('tank', bounds, onCollision)

  tanks.push({ mesh: tank, destroy });

  return {
    move,
    turn,
    shoot,
    plantMine: plantTankMine,
    setAim,
  };
};

export const getTanks = () => tanks;
