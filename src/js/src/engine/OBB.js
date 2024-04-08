// @ts-check
import { Vector2, Vector3 } from "../../three.js";

class LineSegment {
  /**
   * @param {Vector2} p1 
   * @param {Vector2} p2 
   */
  constructor(p1, p2) {
    this.p1 = p1; // Vector2 representing the first endpoint of the line segment
    this.p2 = p2; // Vector2 representing the second endpoint of the line segment

    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    this.normal = new Vector2(dy/len, -dx/len);;
  }
}

class Interval {
  /**
   * @param {number} min 
   * @param {number} max 
   */
  constructor(min, max) {
    this.min = min; // Minimum value of the interval
    this.max = max; // Maximum value of the interval
  }

  // Returns the length of the interval (max - min)
  get length() {
    return this.max - this.min;
  }

  // Returns true if the interval is empty (length <= 0)
  get isEmpty() {
    return this.length <= 0;
  }

  /**
   * @param {number} value 
   * @returns true if the interval contains the given value
   */
  contains(value) {
    return value >= this.min && value <= this.max;
  }

  /**
   * @param {Interval} other 
   * @returns true if the interval overlaps with the given interval
   */
  overlaps(other) {
    return !this.isEmpty && !other.isEmpty && this.contains(other.min) || other.contains(this.min);
  }

  /**
   * @param {Interval} other 
   * @returns the overlap between the interval and the given interval, or null if they do not overlap
   */
  getOverlap(other) {
    if (this.overlaps(other)) {
      return new Interval(Math.max(this.min, other.min), Math.min(this.max, other.max));
    } else {
      return null;
    }
  }
}

export class OBB {
  /**
   * @param {Vector2} center 
   * @param {Vector2} halfSize 
   * @param {number} [angle] 
   */
  constructor(center, halfSize, angle = 0) {
    this.center = center;
    this.halfSize = halfSize; // Vector2 representing the half-width and half-height of the OBB
    this.angle = -angle; // Rotation angle of the OBB in radians
  }

  /**
   * @returns the vertices of the OBB in clockwise order, starting from the top-left corner
   */
  getVertices() {
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);
    const x = this.center.x;
    const y = this.center.y;
    const hw = this.halfSize.x;
    const hh = this.halfSize.y;

    return [
      new Vector2(cos * hw - sin * hh + x, sin * hw + cos * hh + y),
      new Vector2(cos * hw + sin * hh + x, sin * hw - cos * hh + y),
      new Vector2(-cos * hw + sin * hh + x, -sin * hw - cos * hh + y),
      new Vector2(-cos * hw - sin * hh + x, -sin * hw + cos * hh + y),
    ];
  }

  /**
   * @returns the edges of the OBB as line segments 
   */
  getEdges() {
    const vertices = this.getVertices();
    return [
      new LineSegment(vertices[0], vertices[1]),
      new LineSegment(vertices[1], vertices[2]),
      new LineSegment(vertices[2], vertices[3]),
      new LineSegment(vertices[3], vertices[0]),
    ];
  }

  /**
   * @returns {Vector2[]} the normal vectors of the OBB's edges
   */
  getNormals() {
    const edges = this.getEdges();
    return edges.map(edge => edge.normal);
  }

  /**
   * @param {Vector2} normal 
   * @returns {Interval}
   */
  project(normal) {
    // Compute the scalar projection of each vertex onto the normal vector
    const projections = this.getVertices().map(vertex => vertex.dot(normal));

    // Return the interval formed by the minimum and maximum projections
    return new Interval(Math.min(...projections), Math.max(...projections));
  }

  /**
   * @param {Vector3} vector 
   */
  translate(vector) {
    const { x, z: y } = vector;
    this.center.x += x * Math.cos(this.angle) - y * Math.sin(this.angle);
    this.center.y += x * Math.sin(this.angle) + y * Math.cos(this.angle);
  }
}
