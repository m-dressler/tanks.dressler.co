// @ts-check

/** @type {{wall:import('./Actor').Actor[],tank:import('./Actor').Actor[],mine:import('./Actor').Actor[],bullet:import('./Actor').Actor[]}}} */
const collidables = {
  wall: [],
  tank: [],
  mine: [],
  bullet: [],
};

/**
 * @param {import('./Actor').Actor} actor
 */
export const addCollidable = (actor) => {
  collidables[actor.type].push(actor);
};

/**
 * @param {"tank"|"wall"|"bullet"|"mine"} type
 * @param {import('./OBB').OBB} bounds
 */
export const removeCollidable = (type, bounds) => {
  const i = collidables[type].findIndex((o) => o.bounds === bounds);
  collidables[type].splice(i, 1);
};

/**
 *
 * @param {import('./OBB').OBB} obb1
 * @param {import('./OBB').OBB} obb2
 * @returns {boolean}
 */
const areColliding = (obb1, obb2) => {
  // Get the normal vectors of the OBBs' edges
  const normals1 = obb1.getNormals();
  const normals2 = obb2.getNormals();

  // Check for a separating axis along each normal vector
  let colliding = true;
  for (const normal of normals1.concat(normals2)) {
    const interval1 = obb1.project(normal);
    const interval2 = obb2.project(normal);
    if (!interval1.overlaps(interval2)) {
      colliding = false;
      break;
    }
  }
  return colliding;
};


/** @ts-ignore @type {HTMLCanvasElement} */
const canvas = document.querySelector('#debug > canvas');
const { width, height } = canvas;
/** @ts-ignore @type {CanvasRenderingContext2D } */
const ctx = canvas.getContext('2d');
ctx.translate(canvas.width / 2, canvas.height / 2);
const scale = 10;
ctx.lineWidth = 1 / scale;
ctx.scale(scale, scale);


/**
 * @param {import('./OBB').OBB} obb 
 * @param {boolean} fill 
 */
const debugRect = (obb, fill) => {
  // Save the current context state
  ctx.save();

  // Translate and rotate the context to match the OBB
  ctx.translate(obb.center.x, obb.center.y);
  ctx.rotate(obb.angle);

  const { x: width, y: height } = obb.halfSize;

  // Draw and fill a rectangle using the OBB's half-size and center point
  if (fill) {
    ctx.fillRect(-width, -height, width * 2, height * 2);
  } else {
    ctx.beginPath();
    ctx.rect(-width, -height, width * 2, height * 2);
    ctx.stroke();
  }

  // Restore the context to its previous state
  ctx.restore();
}

/**
 * @param {import('./Actor').Actor[]} collided 
 */
const drawDebug = (collided) => {
  ctx.clearRect(-width, -height, width * 2, height * 2);

  const { wall, tank, mine, bullet } = collidables;

  ctx.strokeStyle = ctx.fillStyle = "red";
  for (const t of tank)
    debugRect(t.bounds, collided.indexOf(t) !== -1)

  ctx.strokeStyle = ctx.fillStyle = "black"
  for (const t of wall)
    debugRect(t.bounds, collided.indexOf(t) !== -1)

  ctx.strokeStyle = ctx.fillStyle = "blue"
  for (const t of bullet)
    debugRect(t.bounds, collided.indexOf(t) !== -1)

  ctx.strokeStyle = ctx.fillStyle = "yellow"
  for (const t of mine)
    debugRect(t.bounds, collided.indexOf(t) !== -1)
}

export const resolveCollisions = () => {
  /** @type {import('./Actor').Actor[]} */
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
        if (c2.onCollide) c2.onCollide(wall);
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
        if (bullet.onCollide) bullet.onCollide(c2);
      }
    }
  }

  drawDebug(collisions);
};

/**
 * 
 * @param {import('./OBB').OBB} bounds1 
 * @param {import('./OBB').OBB} bounds2 
 * @returns {"TOP" | "BOT" | "LEF" | "RIG"}
 */
export const getCollisionDirection = (bounds1, bounds2) => {
  const { x: x1, y: y1 } = bounds1.center;
  const { x: x2, y: y2 } = bounds2.center;

  const dx = x2 - x1;
  const dy = y2 - y1;
  if (Math.abs(dx) > Math.abs(dy))
    return dx > 0 ? "LEF" : "RIG";
  return dy > 0 ? "TOP" : "BOT";
}

export const clearCollidables = () => {
  const arrays = Object.values(collidables);
  for(let i = 0; i < arrays.length; ++i)
    arrays[i].length=0;
};
