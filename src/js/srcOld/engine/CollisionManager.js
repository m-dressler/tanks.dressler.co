// @ts-check

/**
 * @typedef {object} Bound2D
 * @property {number} x
 * @property {number} y
 * @property {number} w
 * @property {number} h
 *
 * @typedef {object} Collidable
 * @property {Bound2D} bounds
 * @property {(collision:Collidable)=>void} [onCollision]
 * @property {"tank"|"wall"|"bullet"|"mine"} type
 */
/** @type {{wall:Collidable[],tank:Collidable[],mine:Collidable[],bullet:Collidable[]}}} */
const collidables = {
  wall: [],
  tank: [],
  mine: [],
  bullet: [],
};

/**
 * @param {"tank"|"wall"|"bullet"|"mine"} type
 * @param {Bound2D} bounds
 * @param {(collision:Collidable)=>void} [onCollision]
 */
export const addCollidable = (type, bounds, onCollision) => {
  const collidable = { bounds, type, onCollision };
  collidables[type].push(collidable);
};

/**
 * @param {"tank"|"wall"|"bullet"|"mine"} type
 * @param {Bound2D} bounds
 */
export const removeCollidable = (type, bounds) => {
  const i = collidables[type].findIndex((o) => o.bounds === bounds);
  collidables[type].splice(i, 1);
};

/**
 *
 * @param {Bound2D} b1
 * @param {Bound2D} b2
 * @returns {boolean}
 */
const areColliding = (b1, b2) => {
  return (
    b2.x < b1.x + b1.w &&
    b2.x + b2.w > b1.x &&
    b2.y < b1.y + b1.h &&
    b2.h + b2.y > b1.y
  );
};


/** @type {HTMLCanvasElement} */
const canvas = document.querySelector('#debug > canvas');
const { width, height } = canvas;
/** @type {CanvasRenderingContext2D } */
const ctx = canvas.getContext('2d');
const debugRect = (x, y, w, h, fill) => {
  if (fill) {
    ctx.fillRect(x, y, w, h)
  } else {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.stroke();
  }
}
const scale = 15;
const transformBounds = (element) => {
  let { x, y, w, h } = element.bounds;
  x = x * scale + 200;
  y = y * scale + 160;
  w *= scale;
  h *= scale
  return [x, y, w, h];
}
const drawDebug = (collided) => {
  ctx.clearRect(0, 0, width, height);

  const { wall, tank, mine, bullet } = collidables;

  ctx.strokeStyle = ctx.fillStyle = "red"
  for (const t of tank)
    debugRect(...transformBounds(t), collided.indexOf(t) !== -1)

  ctx.strokeStyle = ctx.fillStyle = "black"
  for (const t of wall)
    debugRect(...transformBounds(t), collided.indexOf(t) !== -1)

  ctx.strokeStyle = ctx.fillStyle = "blue"
  for (const t of bullet)
    debugRect(...transformBounds(t), collided.indexOf(t) !== -1)
}



export const resolveCollisions = () => {
  /** @type {Collidable[]} */
  const collisions = [];
  const wallCollidables = collidables.tank;
  for (let i = 0; i < collidables.wall.length; ++i) {
    const wall = collidables.wall[i];
    const wallBounds = wall.bounds;
    for (let j = 0; j < wallCollidables.length; ++j) {
      const c2 = wallCollidables[j];
      const b2 = c2.bounds;
      if (areColliding(wallBounds, b2)) {
        collisions.push(wall, c2);
        if (c2.onCollision) c2.onCollision(wall);
      }
    }
  }

  const bulletCollidables = [...collidables.wall, ...collidables.mine, ...collidables.tank, ...collidables.bullet];
  for (let i = 0; i < collidables.bullet.length; ++i) {
    const bullet = collidables.bullet[i];
    const bulletBounds = bullet.bounds;
    for (let j = 0; j < bulletCollidables.length; ++j) {
      const c2 = bulletCollidables[j];
      if (c2 === bullet) continue;
      const b2 = c2.bounds;
      if (areColliding(bulletBounds, b2)) {
        collisions.push(bullet, c2);
        if (bullet.onCollision) bullet.onCollision(c2);
      }
    }
  }

  drawDebug(collisions);
};

/**
 * 
 * @param {Bound2D} bounds1 
 * @param {Bound2D} bounds2 
 * @returns {"TOP" | "BOT" | "LEF" | "RIG"}
 */
export const getCollisionDirection = (bounds1, bounds2) => {
  const x1 = bounds1.x + bounds1.w / 2;
  const x2 = bounds2.x + bounds2.w / 2;
  const y1 = bounds1.y + bounds1.h / 2;
  const y2 = bounds2.y + bounds2.h / 2;

  const dx = x2 - x1;
  const dy = y2 - y1;
  if (Math.abs(dx) > Math.abs(dy))
    return dx > 0 ? "LEF" : "RIG";
  return dy > 0 ? "TOP" : "BOT";
}

export const clearCollidables = () => {
  for (const collidable in collidables)
    collidables[collidable] = [];
};
