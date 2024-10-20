import { vec3 } from "gl-matrix";
import { L } from "vitest/dist/chunks/reporters.DAfKSDh5.js";

// https://arxiv.org/pdf/1212.6038
// https://www.geometrictools.com/Documentation/TriangulationByEarClipping.pdf

export type Vector3 = { x: number; y: number; z: number };
type Vec3Tuple = [x: number, y: number, z: number];

class Path {
  verts: [...Vec3Tuple, present: boolean][] = [];

  constructor(verts: Vector3[]) {
    this.verts = verts.map<[...Vec3Tuple, boolean]>(({ x, y, z }) => [x, y, z, true]);
  }

  at(i: number): vec3 {
    const [x, y, z] = this.verts[i];
    return [x, y, z];
  }

  remove(i: number) {
    this.verts[i][3] = false;
  }

  next(i: number) {
    return this._find(i, 1);
  }

  prev(i: number) {
    return this._find(i, this.verts.length - 1);
  }

  _find(i: number, inc: number): [number, vec3] | undefined {
    let current = (i + inc) % this.verts.length;
    while (current !== i) {
      const vert = this.verts.at(current);
      if (!vert) return;
      const [x, y, z, present] = vert;
      if (present) return [current, [x, y, z]];

      current = (current + inc) % this.verts.length;
    }
  }
}

interface Tip {
  verts: [number, number, number];
  angle: number;
  ear: boolean;
}

export function triangulate(vertices: Vector3[]) {
  const path = new Path(vertices);

  // const reflexes = findReflexVertices(verts);
  const tips: Tip[] = vertices.map((_, i) => getTip(path, i));

  const tris: [number, number, number][] = [];
  while (tris.length < vertices.length - 2) {
    // find the ear tip with the smallest angle
    const tip = tips.filter(tip => tip.ear).sort((a, b) => a.angle - b.angle)[0];

    tris.push(tip.verts);

    tip.ear = false;
    path.remove(tip.verts[1]);

    tips[tip.verts[0]] = getTip(path, tip.verts[0]);
    tips[tip.verts[2]] = getTip(path, tip.verts[2]);
  }

  return tris;
}

function getTip(path: Path, i: number): Tip {
  const [prev, v1] = path.prev(i)!,
    v2 = path.at(i)!,
    [next, v3] = path.next(i)!;

  // calculate the angle between the points
  const a = vec3.sub(vec3.create(), v1, v2),
    b = vec3.sub(vec3.create(), v3, v2),
    angle = vec3.angle(a, b);

  const verts: [number, number, number] = [prev, i, next];

  // if the angle is obtuse, it can't form an ear tip
  if (angle >= Math.PI) return { verts, angle, ear: false };

  for (const [x, y, z] of path.verts) {
    const p: vec3 = [x, y, z];
    if (vec3.equals(v1, p)) continue;
    if (vec3.equals(v2, p)) continue;
    if (vec3.equals(v3, p)) continue;
    const inside =
      isSameSide(v1, v2, v3, p) && isSameSide(v2, v3, v1, p) && isSameSide(v3, v1, v2, p);

    if (inside) return { verts, angle, ear: false };
  }

  return { verts, angle, ear: true };
}

/** Given a path, find all vertices that "point in", creating concave subsections */
function findReflexVertices(path: Vec3Tuple[]) {
  const reflexes: Vec3Tuple[] = [];

  for (let i = 0; i < path.length; i++) {
    // find the adjacent points
    const v1 = path[clamp(i - 1, path.length)],
      v2 = path[i],
      v3 = path[clamp(i + 1, path.length)];

    // calculate the angle between the points
    const a = vec3.sub(vec3.create(), v1, v2),
      b = vec3.sub(vec3.create(), v3, v2),
      theta = vec3.angle(a, b);

    // if the angle is greater than pi, it's a reflex vertex
    if (theta >= Math.PI) reflexes.push(v2);
  }

  return reflexes;
}

// Function to check if a point is on the same side of the edge as the triangle's third vertex
function isSameSide(a: vec3, b: vec3, p1: vec3, p2: vec3): boolean {
  const cp1 = vec3.create();
  const cp2 = vec3.create();
  const edge = vec3.create();

  vec3.subtract(edge, b, a); // edge vector: b - a

  // Cross product of edge and vector (p1 - a)
  vec3.subtract(cp1, p1, a);
  vec3.cross(cp1, edge, cp1);

  // Cross product of edge and vector (p2 - a)
  vec3.subtract(cp2, p2, a);
  vec3.cross(cp2, edge, cp2);

  // Check if cp1 and cp2 are pointing in the same direction (positive dot product)
  return vec3.dot(cp1, cp2) >= 0;
}

function clamp(i: number, range: number) {
  const clamped = i % range, // normalize into range [-range, range]
    positive = clamped + range, // translate into range [0, 2range]
    result = positive % range; // normalize into range [0, range]

  return result;
}
