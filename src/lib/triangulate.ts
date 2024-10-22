import { vec3 } from "gl-matrix";

// https://arxiv.org/pdf/1212.6038
// https://www.geometrictools.com/Documentation/TriangulationByEarClipping.pdf

export type Vector3 = { x: number; y: number; z: number };
type Vec3Tuple = [x: number, y: number, z: number];

/** A small wrapper around a path that supports removing elements while keeping the indices consistent. */
class Path<T> {
  array: Array<{ value: T; present: boolean }> = [];

  constructor(verts: T[]) {
    this.array = verts.map(value => ({ value, present: true }));
  }

  /** Return the item at index `i`. */
  at(i: number): T {
    return this.array[i].value;
  }

  /** Remove an item from the path. */
  remove(i: number) {
    this.array[i].present = false;
  }

  /** Find the next item that hasn't been removed. */
  next(i: number) {
    return this._find(i, 1);
  }

  /** Find the previous item that hasn't been removed. */
  prev(i: number) {
    // adding array.length - 1 is equivalent to moving backwards through the array
    return this._find(i, this.array.length - 1);
  }

  _find(i: number, inc: number): [number, T] | undefined {
    let current = i;
    do {
      // add increment, wrapping around to the beginning of the array if necessary
      current = (current + inc) % this.array.length;

      const item = this.array.at(current);
      if (item?.present) return [current, item.value];
    } while (current !== i);
  }

  *[Symbol.iterator]() {
    for (const item of this.array) {
      if (!item.present) continue;
      yield item.value;
    }
  }
}

interface Tip {
  verts: [number, number, number];
  angle: number;
  ear: boolean;
}

/** Given an array of vertices forming a path, return an array of vertex indices triangulating the path. */
export function triangulate(vertices: Vector3[]) {
  const path = new Path(vertices.map<Vec3Tuple>(({ x, y, z }) => [x, y, z]));

  // find all potential tips
  const tips: Tip[] = vertices.map((_, i) => getTip(path, i));
  const tris: [number, number, number][] = [];

  while (tris.length < vertices.length - 2) {
    // find the ear tip with the smallest angle
    const tip = tips.filter(tip => tip.ear).sort((a, b) => a.angle - b.angle)[0];

    // push the verts into the tris array
    tris.push(tip.verts);

    // mark as no longer a tip and remove the vertex from the path
    tip.ear = false;
    path.remove(tip.verts[1]);

    // recompute the tip status of the neighboring vertices
    tips[tip.verts[0]] = getTip(path, tip.verts[0]);
    tips[tip.verts[2]] = getTip(path, tip.verts[2]);
  }

  return tris;
}

/** Given a path and the index of a vertex, get the tip status of the triangle formed by it and the two adjacent vertices */
function getTip(path: Path<vec3>, i: number): Tip {
  // find the neighboring points
  const [prev, v1] = path.prev(i) as [number, vec3],
    v2 = path.at(i) as vec3,
    [next, v3] = path.next(i) as [number, vec3];

  // calculate the angle between the points
  const a = vec3.sub(vec3.create(), v1, v2),
    b = vec3.sub(vec3.create(), v3, v2),
    angle = vec3.angle(a, b);

  const verts: [number, number, number] = [prev, i, next];

  // if the angle is obtuse, it can't form an ear tip
  if (angle >= Math.PI) return { verts, angle, ear: false };

  // if any other point is inside the triangle, it can't be an ear tip
  // TODO: only check reflex vertices (vertices that "point in", creating concave subpaths)
  for (const p of path) {
    // skip the points that make up the triangle
    if (vec3.equals(v1, p)) continue;
    if (vec3.equals(v2, p)) continue;
    if (vec3.equals(v3, p)) continue;

    // for each edge of the triangle, check whether the point is on the same side as the remaining vertex
    const inside =
      isSameSide(v1, v2, v3, p) && isSameSide(v2, v3, v1, p) && isSameSide(v3, v1, v2, p);

    if (inside) return { verts, angle, ear: false };
  }

  return { verts, angle, ear: true };
}

/** Check whether a point is on the same side of the edge as the triangle's third vertex. */
function isSameSide(a: vec3, b: vec3, p1: vec3, p2: vec3): boolean {
  const cp1 = vec3.create();
  const cp2 = vec3.create();
  const edge = vec3.create();

  // edge vector: b - a
  vec3.subtract(edge, b, a);

  // cross product of edge and vector (p1 - a)
  vec3.subtract(cp1, p1, a);
  vec3.cross(cp1, edge, cp1);

  // cross product of edge and vector (p2 - a)
  vec3.subtract(cp2, p2, a);
  vec3.cross(cp2, edge, cp2);

  // if the dot product of cp1 and cp2 is positive, the vectors are pointing in the same direction
  return vec3.dot(cp1, cp2) >= 0;
}
