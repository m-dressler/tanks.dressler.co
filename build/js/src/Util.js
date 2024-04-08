import * as THREE from "../three.js";

export const screenToWorld = (camera, x, y) => {
  var worldPos = new THREE.Vector3(x, 0, y);
  const angleMultiplier = Math.sin(camera.rotation.x);
  worldPos.x = (x - window.innerWidth / 2) / camera.zoom;
  worldPos.z = (-y + window.innerHeight / 2) / camera.zoom / angleMultiplier;
  return worldPos;
};
