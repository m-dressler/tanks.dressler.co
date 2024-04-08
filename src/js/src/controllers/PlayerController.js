// @ts-check

import { Tank } from "../actors/Tank.js";
import { renderContext } from "../Ouitanks.js";
import { screenToWorld } from "../Util.js";

/**
 *
 * @param {*} scene
 * @param {*} x
 * @param {*} y
 * @returns
 */
export const PlayerController = (scene, x, y) => {
  const tank = new Tank(scene, x, y);

  const updateRemote = (update) => {
    // for (let i = 0; i < remoteConnections.length; ++i)
    //   remoteConnections[i].send(update);
  };

  let movingForward = false;
  let movingBackward = false;
  let turningLeft = false;
  let turningRight = false;

  document.addEventListener("keydown", (e) => {
    if (e.key === "w") {
      movingForward = true;
      updateRemote("MOV_F 1");
    } else if (e.key === "a") {
      turningLeft = true;
      updateRemote("ROT_L 1");
    } else if (e.key === "d") {
      turningRight = true;
      updateRemote("ROT_R 1");
    } else if (e.key === "s") {
      movingBackward = true;
      updateRemote("MOV_B 1");
    } else if (e.key === " ") {
      tank.plantMine();
      updateRemote("MINE");
    }
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "w") {
      movingForward = false;
      updateRemote("MOV_F 0");
    } else if (e.key === "a") {
      turningLeft = false;
      updateRemote("ROT_L 0");
    } else if (e.key === "d") {
      turningRight = false;
      updateRemote("ROT_R 0");
    } else if (e.key === "s") {
      movingBackward = false;
      updateRemote("MOV_B 0");
    }
  });

  document.addEventListener("mousemove", (e) => {
    const aimPoint = screenToWorld(renderContext.camera, e.clientX, e.clientY);
    updateRemote(["AIM", aimPoint.x, aimPoint.y, aimPoint.z].join(" "));
    tank.setAim(aimPoint);
  });

  document.addEventListener("click", (e) => {
    if (e.button === 0) {
      tank.shoot();
      updateRemote("SHOT");
    }
  });

  /**
   * @param {number} delta
   */
  const update = (delta) => {
    if (movingForward) tank.move(delta, true);
    if (movingBackward) tank.move(delta, false);

    if (turningLeft) tank.turn(delta, true);
    if (turningRight) tank.turn(delta, false);
  };

  return {
    update,
  };
};
