// @ts-check
import * as THREE from "../../three.js";
import { Actor } from "../engine/Actor.js";

const radius = 3;
const time = 0.2;

const g_explosion = new THREE.SphereGeometry(1, 5, 5, 0, Math.PI, 0, Math.PI);
g_explosion.rotateX(-Math.PI / 2)
const m_explosion = new THREE.MeshPhongMaterial({ color: 0xff0000 });

export class Explosion extends Actor {
  /**
   * @param {THREE.Scene} scene 
   * @param {THREE.Vector3} position 
   */
  constructor(scene, position) {
    const mesh = new THREE.Mesh(g_explosion, m_explosion);
    // TODO no OBB but circle bounding box
    super(scene, mesh, "explosion", { width: 0.1, height: 0.1 }, {
      position,
      scale: 0.1,
      onUpdate: (delta) => {
        this.time -= delta;
        const r = (radius * (time - this.time)) / time;
        this.mesh.scale.set(r, r, r);
        if (this.time < 0) this.destroy();
      }
    })
    this.time = time;
  }
}