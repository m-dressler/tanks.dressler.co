// @ts-check
import * as THREE from "../../three.js";
import { Actor } from "../engine/Actor.js";
import { Explosion } from "./Explosion.js";

const MINE_TIME = 5;

const radius = 0.2;
const g_mine = new THREE.SphereGeometry(radius, 5, 5, 0, Math.PI, 0, Math.PI);
g_mine.rotateX(-Math.PI / 2);
g_mine.boundingBox = new THREE.Box3(
  new THREE.Vector3(-radius, -100, -radius),
  new THREE.Vector3(radius, 100, radius)
);
const m_mine = new THREE.MeshPhongMaterial({ color: 0x000000 });

export class Mine extends Actor {
  /**
   * @param {THREE.Scene} scene 
   * @param {THREE.Vector3} position 
   */
  constructor(scene, position) {
    const material = m_mine.clone()
    const mesh = new THREE.Mesh(g_mine, material);

    // TODO circle bounds instead of OBB
    super(scene, mesh, "mine", { width: radius, height: radius }, {
      onDestroy: () => {
        mesh.material.dispose(); // Since it is a clone, we dispose the clone
        new Explosion(scene, position);
      },
      onUpdate: (delta) => {
        if ((this.time -= delta) < 0)
          this.destroy();
        const colval = (MINE_TIME / this.time) % 2;
        this.material.color.set(colval > 1 ? 0xffff00 : 0xff0000);
        this.mesh.remove();

        // mine.mesh.rotation.x += delta * 0.001;
      }
    })
    this.time = MINE_TIME;
    this.material = material;
  }
}