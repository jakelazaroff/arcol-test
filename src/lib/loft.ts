import { vec3, mat4 } from "gl-matrix";

// https://micsymposium.org/mics2018/proceedings/MICS_2018_paper_65.pdf

export type Vector3 = [x: number, y: number, z: number];

export function loft(
  start: Vector3[],
  end: Vector3[]
): { vertices: Float32Array; indices: Uint16Array } {
  // https://micsymposium.org/mics2018/proceedings/MICS_2018_paper_65.pdf

  // 1) Make copies of the paths to manipulate in 3D space
  const p1 = start.map<Vector3>(v => [...v]),
    p2 = end.map<Vector3>(v => [...v]);

  // 2) Map nonplanar paths to an appropriate plane

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
    vertices = new Float32Array([...end, ...start].flat());
  if (pS.length > pL.length) {
    pS = p2;
    pL = p1;
    vertices = new Float32Array([...start, ...end].flat());
  }

  // 7) Scale pL to completely encompass pS

  // 8) Generate rays from the origin that extend through the edge midpoints of pS
  const rays = raycast(pS, pL);

  // 9) Connect vertices on pL to the vertices on pS in the sections created by the rays
  console.log(JSON.stringify({ pS, pL, rays }));
  const connections = connectVerts(pS, pL, rays);
  console.log(connections.join("\n"));

  // 10) Find appropriate connections for unconnected vertices in pL if they exist

  // 11) Find appropriate connections for unconnected vertices in pS if they exist

  // 12) Make the final connections that cross each of the rays
  connectAcrossRays(connections);

  // 13) Generate a connected list of triangles

  console.log(connections.join("\n"));
  let row = 0,
    col = connections[0].findIndex(edge => edge);
  if (col === -1) throw new Error("No starting point");

  const tris: [v1: number, v2: number, v3: number][] = [];
  const pSoffset = pL.length;

  for (let i = 0; i < pL.length + pS.length; i++) {
    const i1 = row,
      v1 = pL[row];
    const i2 = pSoffset + col,
      v2 = pS[col];
    let i3: number, v3: Vector3;

    const nextRow = (row + 1) % pL.length,
      nextCol = (col + 1) % pS.length;
    console.log(
      row,
      col,
      connections[nextRow]?.[col] ? "DOWN" : connections[row][nextCol] ? "RIGHT" : "BREAK"
    );
    if (connections[nextRow]?.[col]) {
      row = nextRow;
      i3 = row;
      v3 = pL[row];
    } else if (connections[row][nextCol]) {
      col = nextCol;
      i3 = col;
      v3 = pS[col];
    } else throw new Error("Broken path");

    const tri: (typeof tris)[0] = [i1, i2, i3];
    if (!isClockwise([v1, v2, v3])) tri.reverse();
    tris.push(tri);
  }

  return { vertices, indices: new Uint16Array(tris.flat()) };
}

export function transformToZ0(path: Vector3[]): void {
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
  const targetNormal = vec3.fromValues(0, 0, 1);
  const rotationAxis = vec3.create();
  vec3.cross(rotationAxis, normal, targetNormal);

  const angle = Math.acos(vec3.dot(normal, targetNormal));

  // if the path is already cpplanar with z = 0, zero out the z component and return
  if (vec3.length(rotationAxis) === 0) return path.forEach(v => (v[2] = 0));

  // create rotation matrix and rotate all vertices
  const rotationMatrix = mat4.create();

  vec3.normalize(rotationAxis, rotationAxis);
  mat4.fromRotation(rotationMatrix, angle, rotationAxis);

  for (const v of path) {
    const rotated = vec3.create();
    vec3.transformMat4(rotated, vec3.fromValues(...v), rotationMatrix);
    v[0] = rotated[0];
    v[1] = rotated[1];
    v[2] = 0; // set z to 0 after rotation
  }
}

export function center(path: Vector3[]) {
  // calculate average of coordinates
  const cx = path.reduce((sum, [x]) => sum + x, 0) / path.length,
    cy = path.reduce((sum, [, y]) => sum + y, 0) / path.length;

  // translate points around the origin
  for (const v of path) {
    v[0] -= cx;
    v[1] -= cy;
  }
}

export function isClockwise(path: Vector3[]) {
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

export function raycast(pS: Vector3[], pL: Vector3[]) {
  const rays: number[] = [];

  // iterate through each vertex
  for (let i = 0; i < pS.length; i++) {
    // get the coordinates of the current and next vertex, wrapping around to 0
    const [x1, y1] = pS.at((i - 1) % pS.length)!!!,
      [x2, y2] = pS[i];

    // add the angle of the ray from (0, 0) through the midpoint of the line between the vertices
    const angle = Math.atan2((y1 + y2) / 2, (x1 + x2) / 2);
    rays.push(normalize(angle));
  }

  return rays;
}

export function connectVerts(pS: Vector3[], pL: Vector3[], rays: number[]) {
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
      if (row === 4) console.log(row, col, start, angle, end, between(start, angle, end));

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
    const [nextRow, nextCol] = connections[++i % connections.length];
    // mark a connection in the next column
    matrix[row][nextCol] = true;

    console.log(`pS: ${col}, ${nextCol}; pL: ${row}, ${nextRow}`);
  }
}

export function generateTris(pL: Vector3[], pS: Vector3[], matrix: boolean[][]) {
  const connections: [row: number, col: number][] = [];
  const rows = matrix.length,
    cols = matrix[0].length;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (matrix[row][col]) connections.push([row, col]);
    }
  }

  for (let i = 0; i < connections.length; i++) {
    const [l1, s1] = connections[i],
      [l2, s2] = connections[(i + 1) % connections.length];

    const tri: number[] = [];
  }
}

const TWO_PI = Math.PI * 2;
export function normalize(angle: number) {
  const clamped = angle % TWO_PI, // normalize into range [-2pi, 2pi]
    positive = clamped + TWO_PI, // translate into range [0, 4pi]
    result = positive % TWO_PI; // normalize into range [0, 2pi]

  return result;
}

export function between(n1: number, nb: number, n2: number) {
  if (nb === n1 || nb === n2) return true;

  if (n1 < n2) return n1 < nb && nb < n2;
  else return n1 < nb || nb < n2;
}
