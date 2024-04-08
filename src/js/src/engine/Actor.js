// @ts-check
import * as THREE from "../../three.js";
import { addUpdatable, removeUpdatable } from "../Level.js";
import { addCollidable, removeCollidable } from "./CollisionManager.js";
import { OBB } from "./OBB.js";

export class Actor {
  /**
   * @param {THREE.Scene} scene
   * @param {THREE.Object3D} mesh
   * @param {"tank"|"bullet"|"wall"|"mine"} type
   * @param {{width:number, height:number} |import('./OBB.js').OBB} bounds
   * @param {object} [additional]
   * @param {()=>void} [additional.onDestroy]
   * @param {(other: Actor)=>void} [additional.onCollide]
   * @param {THREE.Vector3} [additional.position]
   * @param {number} [additional.rotateY]
   * @param {number} [additional.scale]
   * @param {(delta:number)=>any} [additional.onUpdate]
   */
  constructor(scene, mesh, type, bounds, additional) {
    this.mesh = mesh;
    this.type = type;
    if (bounds instanceof OBB)
      this.bounds = bounds;
    else
      this.bounds = new OBB(new THREE.Vector2(0, 0), new THREE.Vector2(bounds.width / 2, bounds.height / 2))
    this.scene = scene;
    this.additional = additional;
    this.onCollide = additional?.onCollide;

    if (additional?.position)
      this.translate(additional.position);
    if (additional?.rotateY)
      this.rotateY(additional.rotateY);
    if (additional?.scale)
      this.scale(additional.scale);
    if(additional?.onUpdate)
      addUpdatable(additional?.onUpdate);

    addCollidable(this);
    scene.add(mesh);
  }

  destroy() {
    console.log(this, this.scene);
    this.scene.remove(this.mesh);
    removeCollidable(this.type, this.bounds);
    if(this.additional?.onUpdate)
      removeUpdatable(this.additional?.onUpdate);
    if (this.additional?.onDestroy)
      this.additional.onDestroy()
  };

  /**
   * @param {THREE.Vector3} vector 
   */
  translate(vector) {
    this.bounds.translate(vector)
    this.mesh.translateX(vector.x);
    this.mesh.translateY(vector.y);
    this.mesh.translateZ(vector.z);
  }

  /**
   * @param {number} theta 
   */
  rotateY(theta) {
    this.bounds.angle -= theta;
    this.mesh.rotateY(theta)
  }

  /**
   * @param {number} size 
   */
  scale(size) {
    this.bounds.halfSize.multiplyScalar(size);
    this.mesh.scale.set(size);
  }

  flipX() {
    this.mesh.scale.multiply(new THREE.Vector3(-1, 1, 1));
    this.mesh.rotation.y = -this.mesh.rotation.y;
    this.bounds.angle = -this.bounds.angle;
  }

  flipZ() {
    this.mesh.scale.multiply(new THREE.Vector3(1, 1, -1));
    this.mesh.rotation.y = Math.PI - this.mesh.rotation.y;
    this.bounds.angle = Math.PI - this.bounds.angle;
  }
}