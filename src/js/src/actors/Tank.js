// @ts-check

import * as THREE from "../../three.js";
import { Actor } from "../engine/Actor.js";
import { getCollisionDirection } from "../engine/CollisionManager.js";
import { OBB } from "../engine/OBB.js";
import { Bullet } from "./Bullet.js";
import { Mine } from "./Mine.js";

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
  const width = (g_tankTrack.boundingBox.max.x - g_tankTrack.boundingBox.min.x) * 1.1;
  const height = ((g_tankTrack.boundingBox.max.z - g_tankTrack.boundingBox.min.z) * 2 + g_tankBody.parameters.depth) * 1.1;
  const bounds = { width, height };

  return { tank, tower, towerBase, nozzlePipe, bounds };
};

export class Tank extends Actor {
  /**
   * 
   * @param {THREE.Scene} scene 
   * @param {number} x 
   * @param {number} y 
   */
  constructor(scene, x, y) {
    const { tank: mesh, tower, towerBase, nozzlePipe, bounds } = createTankObject3D();

    const onDestroy = () => {
      console.log("DESTROYING TANK");
    };

    /** @param {import('../engine/Actor.js').Actor} wall */
    const onCollide = ({ bounds: wallBounds }) => {
      const dir = getCollisionDirection(wallBounds, this.bounds);
      let newCenter;
      switch (dir) {
        case "TOP":
          newCenter = wallBounds.center.y + wallBounds.halfSize.y + this.bounds.halfSize.y;
          this.bounds.center.y = newCenter;
          mesh.position.z = newCenter;
          break;
        case "BOT":
          newCenter = wallBounds.center.y - wallBounds.halfSize.y - this.bounds.halfSize.y;
          this.bounds.center.y = newCenter;
          mesh.position.z = newCenter;
          break;
        case "LEF":
          newCenter = wallBounds.center.x + wallBounds.halfSize.x + this.bounds.halfSize.x;
          this.bounds.center.x = newCenter;
          mesh.position.x = newCenter;
          break;
        case "RIG":
          newCenter = wallBounds.center.x - wallBounds.halfSize.x - this.bounds.halfSize.x;
          this.bounds.center.x = newCenter;
          mesh.position.x = newCenter;
      }
    };

    super(scene, mesh, "tank", bounds, {
      onDestroy,
      onCollide,
      position: new THREE.Vector3(x, config.trackHeight / 2, y)
    })
    this.speed = 0.075;
    this.rotSpeed = 0.1;
    this.aimLocation = { x: x + 3, z: y };

    this.tower = tower;
    this.towerBase = towerBase;
    this.nozzlePipe = nozzlePipe;

    this.aimPoint = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.2),
      m_tankBody
    );
    this.aimPoint.translateX(this.aimLocation.x);
    scene.add(this.aimPoint);

    tanks.push(this);
  }

  getAimAngle() {
    let pos = new THREE.Vector3();
    this.towerBase.getWorldPosition(pos);
    return Math.atan2(this.aimLocation.z - pos.z, this.aimLocation.x - pos.x);
  };

  updateAim() {
    let { x: baseRotX, y: baseRotY } = this.mesh.rotation;
    if (baseRotX === -Math.PI)
      baseRotY = baseRotX - baseRotY;
    this.tower.rotation.y = -baseRotY - this.getAimAngle();
  };
  /**
   * @param {THREE.Vector3} vector 
   */
  updateAimVisualization = (vector) => {
    this.aimPoint.position.set(vector.x, 0, vector.z);
  };

  /**
   * @param {number} delta 
   * @param {boolean} forward 
   */
  move(delta, forward) {
    const translate = this.speed * delta * 30 * (forward ? 1 : -1);
    this.translate(new THREE.Vector3(translate, 0, 0));
    this.updateAim();
  };
  /**
   * @param {number} delta 
   * @param {boolean} clockwise 
   */
  turn(delta, clockwise) {
    const rotAmount = this.rotSpeed * delta * 30 * (clockwise ? 1 : -1);
    this.rotateY(rotAmount)
    this.updateAim();
  };
  shoot() {
    let pos = new THREE.Vector3();
    this.nozzlePipe.getWorldPosition(pos);
    new Bullet(this.scene, pos, this.getAimAngle());
  };
  plantTankMine = () => {
    let pos = new THREE.Vector3();
    this.towerBase.getWorldPosition(pos);
    pos.y = 0;
    new Mine(this.scene, pos);
  };
  /** @param {THREE.Vector3} vector */
  setAim(vector) {
    Object.assign(this.aimLocation, { x: vector.x, z: vector.z });
    this.updateAimVisualization(vector);
    this.updateAim();
  };

}
