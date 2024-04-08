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
    b2.h + b1.y > b1.y
  );
};


/** @type {HTMLCanvasElement} */
const canvas = document.querySelector('#debug > canvas');
const { width, height } = canvas;
/** @type {CanvasRenderingContext2D } */
const ctx = canvas.getContext('2d');
const debugRect = (x, y, w, h) => {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.stroke();
}
const scale = 15;
const transformBounds = (element) => {
  let { x, y, w, h } = element.bounds;
  x = x * scale + 200;
  y = y * scale + 160;
  w *= scale;
  h *= scale
  return [x,y,w,h];
}
const drawDebug = () => {
  ctx.clearRect(0, 0, width, height);

  const { wall, tank, mine, bullet } = collidables;

  ctx.strokeStyle = "red"
  for (const t of tank) 
    debugRect(...transformBounds(t))

  ctx.strokeStyle = "black"
  for (const t of wall) 
    debugRect(...transformBounds(t))
    
  ctx.strokeStyle = "blue"
  for (const t of bullet) 
    debugRect(...transformBounds(t))
}



export const resolveCollisions = () => {
  drawDebug();
  const wallCollidables = [...collidables.tank, ...collidables.bullet]
  for (let i = 0; i < collidables.wall.length; ++i) {
    const wall = collidables.wall[i];
    const wallBounds = wall.bounds;
    for (let j = i + 1; j < wallCollidables.length; ++j) {
      const c2 = wallCollidables[j];
      const b2 = c2.bounds;
      if (areColliding(wallBounds, b2)) {
        console.log("COLLISION!")
        if (wall.onCollision) wall.onCollision(c2);
        if (c2.onCollision) c2.onCollision(wall);
      }
    }
  }
};

export const clearCollidables = () => {
  for (const collidable in collidables)
    collidables[collidable] = [];
};
