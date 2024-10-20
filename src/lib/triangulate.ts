import { vec3 } from "gl-matrix";

// https://arxiv.org/pdf/1212.6038
// https://www.geometrictools.com/Documentation/TriangulationByEarClipping.pdf

export type Vector3 = { x: number; y: number; z: number };
type Vec3WithIndex = [x: number, y: number, z: number, i: number];

interface Tip {
  verts: [number, number, number];
  angle: number;
  ear: boolean;
}

export function triangulate(vertices: Vector3[]) {
  const verts = vertices.map<Vec3WithIndex>(({ x, y, z }, i) => [x, y, z, i]);

  const reflexes = findReflexVertices(verts);
  const tips: Tip[] = [];

  for (let i = 0; i < verts.length; i++) {
    // find the adjacent points
    const prev = clamp(i - 1, verts.length),
      next = clamp(i + 1, verts.length);

    // ensure the points form an ear
    const [angle, ear] = getTip(verts[prev], verts[i], verts[next], reflexes);

    tips.push({ verts: [prev, i, next], angle, ear });
  }

  const tris: [number, number, number][] = [];
  while (tris.length < verts.length - 2) {
    // find the ear tip with the smallest angle
    const tip = tips.filter(tip => tip.ear).sort((a, b) => a.angle - b.angle)[0];

    // add the verts as a triangle
    tris.push(tip.verts);
    tip.ear = false;

    // Compute the interior angles and ear tip status of vi－ 1 and vi+1
    for (const i of [tip.verts[0], tip.verts[2]]) {
      // find the adjacent points
      const prev = clamp(i - 1, verts.length),
        next = clamp(i + 1, verts.length);

      // ensure the points form an ear
      const [angle, ear] = getTip(verts[prev], verts[i], verts[next], verts);
      tips[i].angle = angle;
      tips[i].ear = ear;
    }
  }

  return tris;
}

function getTip(
  v1: Vec3WithIndex,
  v2: Vec3WithIndex,
  v3: Vec3WithIndex,
  reflex: Vec3WithIndex[],
): [angle: number, ear: boolean] {
  // calculate the angle between the points
  const a = vec3.sub(vec3.create(), v1, v2),
    b = vec3.sub(vec3.create(), v3, v2),
    theta = vec3.angle(a, b);

  // if the angle is obtuse, it can't form an ear tip
  if (theta >= Math.PI) return [theta, false];

  // if any reflex vertex is inside the triangle, it can't form an ear tip
  const these = new Set([v1, v2, v3]);
  for (const p of reflex.filter(v => !these.has(v))) {
    const inside =
      isSameSide(v1, v2, v3, p) && isSameSide(v2, v3, v1, p) && isSameSide(v3, v1, v2, p);

    if (inside) return [theta, false];
  }

  return [theta, true];
}

/** Given a path, find all vertices that "point in", creating concave subsections */
function findReflexVertices(path: Vec3WithIndex[]) {
  const reflexes: Vec3WithIndex[] = [];

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
function isSameSide(
  a: Vec3WithIndex,
  b: Vec3WithIndex,
  p1: Vec3WithIndex,
  p2: Vec3WithIndex,
): boolean {
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
