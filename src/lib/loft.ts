import { mat4, vec3 } from "gl-matrix";

// https://micsymposium.org/mics2018/proceedings/MICS_2018_paper_65.pdf

export type Vector3 = { x: number; y: number; z: number };
type Vector3Tuple = [x: number, y: number, z: number];

export function loft(start: Vector3[], end: Vector3[]): { vertices: number[]; indices: number[] } {
  // https://micsymposium.org/mics2018/proceedings/MICS_2018_paper_65.pdf

  // 1) Make copies of the paths to manipulate in 3D space
  const p1 = start.map<Vector3Tuple>(v => [v.x, v.y, v.z]),
    p2 = end.map<Vector3Tuple>(v => [v.x, v.y, v.z]);

  // 2) Map nonplanar paths to an appropriate plane
  // TODO

  // 3) Perform linear transformations to make the current pair of planar paths coplanar
  transformToZ0(p1);
  transformToZ0(p2);

  // 4) Center both paths over the origin
  center(p1);
  center(p2);

  // 5) Reverse the order of the indices if path traversal is clockwise
  if (isClockwise(p1)) p1.reverse();
  if (isClockwise(p2)) p2.reverse();

  // 6) Determine which path has less vertices (pS) and which has more (pL)
  let pS = p1,
    pL = p2,
    vertices = [...end, ...start].map(({ x, y, z }) => [x, y, z]).flat(2);
  if (pS.length > pL.length) {
    pS = p2;
    pL = p1;
    vertices = [...start, ...end].map(({ x, y, z }) => [x, y, z]).flat(2);
  }

  // 7) Scale pL to completely encompass pS
  // skipped — only necessary as a visulization aid

  // 8) Generate rays from the origin that extend through the edge midpoints of pS
  const rays = raycast(pS);

  // 9) Connect vertices on pL to the vertices on pS in the sections created by the rays
  const connections = connectVerts(pL, pS, rays);

  // 10) Find appropriate connections for unconnected vertices in pL if they exist
  // TODO

  // 11) Find appropriate connections for unconnected vertices in pS if they exist
  // TODO

  // 12) Make the final connections that cross each of the rays
  connectAcrossRays(connections);

  // 13) Generate a connected list of triangles
  const indices = generateTris(pL, pS, connections);

  return { vertices, indices };
}

export function transformToZ0(path: Vector3Tuple[]): void {
  // calculate the normal vector of the plane using the first three vertices
  const [p1, p2, p3] = path;
  const v1 = vec3.create();
  const v2 = vec3.create();
  vec3.subtract(v1, p2, p1);
  vec3.subtract(v2, p3, p1);

  const normal = vec3.create();
  vec3.cross(normal, v1, v2);
  vec3.normalize(normal, normal);

  // calculate rotation to align the normal with the z-axis
  const target = vec3.fromValues(0, 0, 1);
  const axis = vec3.create();
  vec3.cross(axis, normal, target);

  const angle = Math.acos(vec3.dot(normal, target));

  // if the path is already cpplanar with z = 0, zero out the z component and return
  if (vec3.length(axis) === 0) {
    for (const v of path) v[2] = 0;
    return;
  }

  // create rotation matrix and rotate all vertices
  const rotation = mat4.create();

  vec3.normalize(axis, axis);
  mat4.fromRotation(rotation, angle, axis);

  for (const v of path) {
    const rotated = vec3.create();
    vec3.transformMat4(rotated, vec3.fromValues(...v), rotation);
    v[0] = rotated[0];
    v[1] = rotated[1];
    v[2] = 0; // set z to 0 after rotation
  }
}

export function center(path: Vector3Tuple[]) {
  // calculate average of coordinates
  const cx = path.reduce((sum, [x]) => sum + x, 0) / path.length,
    cy = path.reduce((sum, [, y]) => sum + y, 0) / path.length;

  // translate points around the origin
  for (const v of path) {
    v[0] -= cx;
    v[1] -= cy;
  }
}

export function isClockwise(path: Vector3Tuple[]) {
  // https://stackoverflow.com/a/1165943

  let sum = 0;

  // iterate through each vertex
  for (let i = 0; i < path.length; i++) {
    // get the coordinates of the current and next vertex, wrapping around to 0
    const [x1, y1] = path[i],
      [x2, y2] = path[(i + 1) % path.length];

    // add the cross product to the sum
    sum += (x2 - x1) * (y2 + y1);
  }

  // if the sum is positive, the path is clockwise
  return sum > 0;
}

export function raycast(pS: Vector3Tuple[]) {
  const rays: number[] = [];

  // iterate through each vertex
  for (let i = 0; i < pS.length; i++) {
    // get the coordinates of the current and next vertex, wrapping around to 0
    // biome-ignore lint/style/noNonNullAssertion: modulo prevents it from being undefined
    const [x1, y1] = pS.at((i - 1) % pS.length)!,
      [x2, y2] = pS[i];

    // add the angle of the ray from (0, 0) through the midpoint of the line between the vertices
    const angle = Math.atan2((y1 + y2) / 2, (x1 + x2) / 2);
    rays.push(normalize(angle));
  }

  return rays;
}

export function connectVerts(pL: Vector3Tuple[], pS: Vector3Tuple[], rays: number[]) {
  // create the adjacency matrix
  const matrix = new Array<number>(pL.length)
    .fill(0)
    .map(() => new Array<boolean>(pS.length).fill(false));

  // for each point in `pS`…
  for (let col = 0; col < pS.length; col++) {
    // get the rays surrounding that point
    const start = rays[col],
      end = rays[(col + 1) % rays.length];

    // for each point in `pL`…
    for (let row = 0; row < pL.length; row++) {
      // get the angle of that point
      const angle = normalize(Math.atan2(pL[row][1], pL[row][0]));

      // if the angle is between the two rays, set the corresponding adjacency matrix cell to `true`
      if (between(start, angle, end)) matrix[row][col] = true;
    }
  }

  return matrix;
}

export function connectAcrossRays(matrix: boolean[][]) {
  // find all the connections in the matrix
  const connections: [row: number, col: number][] = [];
  const rows = matrix.length,
    cols = matrix[0].length;

  // iterate through the rows and cols, pushing the `true` values into the connections list
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (matrix[row][col]) connections.push([row, col]);
    }
  }

  // for each connection…
  for (let i = 0; i < connections.length; i++) {
    const [row, col] = connections[i];

    // find the neighboring cells in the matrix
    const above = Number(matrix.at((row - 1) % rows)?.[col]),
      below = Number(matrix.at((row + 1) % rows)?.[col]),
      left = Number(matrix[row].at((col - 1) % cols)),
      right = Number(matrix[row].at((col + 1) % cols));

    // skip cells that have two connections
    if (above + below + left + right === 2) continue;

    // get the next connected cell
    // TODO: choose vertices that will result in a convex polygon
    const [_nextRow, nextCol] = connections[(i + 1) % connections.length];
    // mark a connection in the next column
    matrix[row][nextCol] = true;
  }
}

export function generateTris(pL: Vector3Tuple[], pS: Vector3Tuple[], matrix: boolean[][]) {
  // find the first connection in the first row
  let row = 0,
    col = matrix[0].findIndex(edge => edge);
  if (col === -1) throw new Error("No starting point");

  // each tri consists of three indices pointing to an array of pL's vertices concatenated with pS's
  const tris: [v1: number, v2: number, v3: number][] = [];

  // pL's vertices are before pS's, so to index a pS vertex we need to add pL's length as an offset
  const pSoffset = pL.length;

  // the number of tris will be equal to the length of pL + pS
  for (let i = 0; i < pL.length + pS.length; i++) {
    // the first two indices of each tri are the row and column in the connection matrix
    const i1 = row,
      v1 = pL[row];
    const i2 = pSoffset + col,
      v2 = pS[col];
    let i3: number, v3: Vector3Tuple;

    // find next row and column, wrapping around to 0 if exceeding the number of vertices
    const nextRow = (row + 1) % pL.length,
      nextCol = (col + 1) % pS.length;

    // either the box in the next row or next column will be filled
    // the direction of travel corresponds to the final vertex: rows correspond to pL, while cols correspond to pS
    if (matrix[nextRow]?.[col]) {
      // if the connection is in the next row, the final vertex is the next vertex in pL
      row = nextRow;
      i3 = row;
      v3 = pL[row];
    } else if (matrix[row][nextCol]) {
      // if the connection is in the next col, the final vertex is the next vertex in pS
      col = nextCol;
      i3 = pSoffset + col;
      v3 = pS[col];
    } else throw new Error("Broken path");

    // create a tri out of the indices
    const tri: (typeof tris)[0] = [i1, i2, i3];

    // ensure the tri is clockwise
    if (!isClockwise([v1, v2, v3])) tri.reverse();

    tris.push(tri);
  }

  return tris.flat();
}

const TWO_PI = Math.PI * 2;

/** Normalize a radian angle into the range [0, 2pi] */
export function normalize(angle: number) {
  const clamped = angle % TWO_PI, // normalize into range [-2pi, 2pi]
    positive = clamped + TWO_PI, // translate into range [0, 4pi]
    result = positive % TWO_PI; // normalize into range [0, 2pi]

  return result;
}

/** Return whether a number `n` is between two numbers `min` and `max`, wrapping around 0. */
export function between(min: number, n: number, max: number) {
  // if n is equal to min or max, return true
  if (n === min || n === max) return true;

  // if min is less than max, the comparison is easy: just check whether n is between them
  if (min < max) return min < n && n < max;

  // if min is *greater* than max, check that n does *not* fall between them
  return min < n || n < max;
}
