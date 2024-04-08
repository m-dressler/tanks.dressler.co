import * as THREE from "../../three.js";

/**
 *
 * @param {*} tank
 * @param {RTCDataChannel} connection
 * @returns
 */
export const RemoteController = (tank, connection) => {
  let movingForward = false;
  let movingBackward = false;
  let turningLeft = false;
  let turningRight = false;

  connection.addEventListener("message", ({ data }) => {
    const spaceIndex = data.indexOf(" ");
    const cmd = spaceIndex !== -1 ? data.substring(0, spaceIndex) : data;
    const args =
      spaceIndex !== -1 ? data.substring(spaceIndex + 1).split(" ") : [];
    switch (cmd) {
      case "MOV_F":
        movingForward = args[0] === "1";
        break;
      case "ROT_L":
        turningLeft = args[0] === "1";
        break;
      case "ROT_R":
        turningRight = args[0] === "1";
        break;
      case "MOV_B":
        movingBackward = args[0] === "1";
        break;
      case "SHOT":
        tank.shoot();
        break;
      case "MINE":
        tank.plantMine();
        break;
      case "AIM":
        tank.setAim(new THREE.Vector3(...args.map(Number)));
        break;
      default:
        console.error("UNKNOWN COMMAND ", data);
    }
  });

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
