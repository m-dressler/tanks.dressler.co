// @ts-check

import * as THREE from "../../three.js";
import { Actor } from "../engine/Actor.js";

const size = 1;
const g_wall = new THREE.BoxGeometry(size, 1, size);
const m_wall = new THREE.MeshPhongMaterial({ color: 0xffffff });
const m_breakableWall = new THREE.MeshPhongMaterial({ color: 0xee8888 });

export class Wall extends Actor {
  /**
   * @param {THREE.Scene} scene
   * @param {number} x 
   * @param {number} y 
   * @param {boolean} breakable
   */
  constructor(scene, x, y, breakable) {
    const mesh = new THREE.Mesh(g_wall, breakable ? m_breakableWall : m_wall);
    super(scene, mesh, "wall", { width: size, height: size }, {
      position: new THREE.Vector3(x, 0.5, y),
    })
    this.breakable = breakable;
  }
}