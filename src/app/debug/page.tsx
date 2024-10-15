"use client";

import { useCallback } from "react";

import {
  between,
  center,
  connectAcrossRays,
  connectVerts,
  generateTris,
  isClockwise,
  normalize,
  raycast,
  transformToZ0,
  type Vector3
} from "~/lib/loft";

const triangle: Vector3[] = [
  [60, 0, 0],
  [-30, 0, 52],
  [-30, 0, -52]
];

const star: Vector3[] = [
  [-66, 0, 56],
  [-179, 0, 10],
  [-72, 0, -50],
  [-61, 0, -172],
  [29, 0, -89],
  [149, 0, -116],
  [98, 0, -4],
  [160, 0, 101],
  [39, 0, 87],
  [-42, 0, 179]
];

export default function Home() {
  const ref = useCallback((canvas: HTMLCanvasElement | null) => {
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const w = ctx.canvas.clientWidth,
      h = ctx.canvas.clientHeight;

    // scale canvas to element size
    ctx.canvas.width = w * devicePixelRatio;
    ctx.canvas.height = w * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // translate and scale to orient coordinate system
    ctx.translate(w / 2, h / 2);
    ctx.scale(1, -1);

    // draw vertical axis
    ctx.moveTo(0, h / 2);
    ctx.lineTo(0, h / -2);

    // draw horizontal axis
    ctx.moveTo(w / -2, 0);
    ctx.lineTo(w / 2, 0);

    ctx.stroke();

    const p1 = triangle.map<Vector3>(v => [...v]),
      p2 = star.map<Vector3>(v => [...v]);

    transformToZ0(p1);
    transformToZ0(p2);

    center(triangle);
    center(star);

    if (isClockwise(p1)) p1.reverse();
    if (isClockwise(p2)) p2.reverse();

    let pS = p1,
      pL = p2,
      vertices = new Float32Array([...star, ...triangle].flat());
    if (pS.length > pL.length) {
      pS = p2;
      pL = p1;
      vertices = new Float32Array([...triangle, ...star].flat());
    }

    const rays = raycast(pS, pL);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "orange";
    for (const ray of rays) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ray) * 1000, Math.sin(ray) * 1000);
      ctx.stroke();
    }

    const connections = connectVerts(pS, pL, rays);

    // let col = connections[0].indexOf(true),
    //   row = 0;
    // let i = 0;
    // console.log(connections);
    // while (true) {
    //   const nextRow = (row + 1) % pL.length,
    //     nextCol = (col + 1) % pS.length;
    //   console.log(
    //     `[${nextRow}][${col}] = ${connections[nextRow][col]}`,
    //     `[${row}][${nextCol}] = ${connections[row][nextCol]}`
    //   );
    //   if (connections[nextRow][col]) {
    //     row = nextRow;
    //     continue;
    //   }
    //   if (connections[row][nextCol]) {
    //     col = nextCol;
    //     continue;
    //   }

    //   console.log("BREAK", `pL: ${row}, ${nextRow}`, `pS: ${col}, ${nextCol}`);
    //   if (row === 0 || ++i === 20) break;
    // }

    const connections2: typeof connections = JSON.parse(JSON.stringify(connections));
    connectAcrossRays(connections2);

    drawConnections(ctx, connections2, pL, pS, "magenta");
    drawConnections(ctx, connections, pL, pS, "lime");

    console.log(connections2.join("\n"));
    // generateTris(connections);
    // for (let col = 0; col < pS.length; col++) {
    //   // s1 = pS[i];
    //   // s2 = pS[(i + 1) % pS.length];
    //   // get the rays surrounding that point
    //   const start = rays[col],
    //     end = rays[(col + 1) % rays.length];

    //   // for each point in `pL`…
    //   let crossed = false;
    //   for (let row = 0; row < pL.length; row++) {
    //     // get the angle of that point
    //     const angle = normalize(Math.atan2(pL[row][1], pL[row][0]));

    //     console.log(row, angle, crossed);

    //     // if the angle is between the two rays, note that we've crossed the second ray
    //     if (between(start, angle, end)) crossed = true;

    //     // if we haven't yet crossed, skip to the next point
    //     if (!crossed) continue;

    //     // if we're here, we've gone *past* the second ray

    //     // l1 = pL[j];
    //     // l2 = pL[(j + 1) % pL.length];
    //     // console.log([col, (col + 1) % pS.length], [row, (row + 1) % pL.length]);

    //     // connections[row][col] = true;
    //     console.log(
    //       "CONNECT",
    //       `pS: ${col}, ${(col + 1) % rays.length}`,
    //       `pL: ${row}, ${(row + 1) % pL.length}`
    //     );
    //     break;
    //   }
    // }

    drawShape(ctx, p1, "red");
    drawShape(ctx, p2, "blue");
  }, []);

  return <canvas style={{ width: "100%", height: "100%" }} ref={ref} />;
}

function drawShape(ctx: CanvasRenderingContext2D, path: Vector3[], color: string) {
  ctx.beginPath();

  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  for (const [x, y] of path) {
    ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.stroke();

  for (const [x, y] of path) {
    ctx.beginPath();
    ctx.ellipse(x, y, 4, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawConnections(
  ctx: CanvasRenderingContext2D,
  matrix: boolean[][],
  pL: Vector3[],
  pS: Vector3[],
  color: string
) {
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (!matrix[i][j]) continue;

      const [x1, y1] = pL[i];
      const [x2, y2] = pS[j];

      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
}
