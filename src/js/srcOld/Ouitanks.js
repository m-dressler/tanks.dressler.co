// @ts-check

import * as THREE from "../../js/three.js";
import { createTank } from "./actors/Tank.js";
import { RemoteController } from "./controllers/RemoteController.js";

const DEBUG = true;

if (!DEBUG)
  import("./ui.js");
else {
  import('./Level.js').then(module => module.loadLevel(1))
  addEventListener("DOMContentLoaded", () => document.getElementById('menu').style = "display:none;")
}
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.OrthographicCamera(
  window.innerWidth / -2,
  window.innerWidth / 2,
  window.innerHeight / 2,
  window.innerHeight / -2,
  0.1,
  1000
);

window.addEventListener(
  "resize",
  () => {
    camera.left = window.innerWidth / -2;
    camera.right = window.innerWidth / 2;
    camera.top = window.innerHeight / 2;
    camera.bottom = window.innerHeight / -2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  },
  false
);

/** @type {{update: function(number):void}[]} */
const remoteTanks = [];
const connections = [];
/** @param {RTCDataChannel} connection */
export const addRemoteConnection = (connection) => {
  connections.push(connection);
  const remoteTank = createTank(scene);
  const remoteController = RemoteController(remoteTank, connection);
  remoteTanks.push(remoteController);
};

// Lighting
{
  // Ambient light
  {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);
  }

  // Directional light
  {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 5, 10);
    scene.add(directionalLight);
  }
}

export const renderContext = { renderer, scene, camera };
