"use client";

import { useCallback } from "react";

import css from "./page.module.css";

import {
  center,
  connectAcrossRays,
  connectVerts,
  isClockwise,
  raycast,
  transformToZ0,
  type Vector3
} from "~/lib/loft";
import { classnames } from "~/lib/classnames";

const ceiling: Vector3[] = [
  [60, 0, 0],
  [-30, 0, 52],
  [-30, 0, -52]
];

const floor: Vector3[] = [
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
].map(([x, y, z]) => [x * 1.5, y * 1.5, z * 1.5] as const);

const p1 = ceiling.map<Vector3>(v => [...v]),
  p2 = floor.map<Vector3>(v => [...v]);

transformToZ0(p1);
transformToZ0(p2);

center(p1);
center(p2);

if (isClockwise(p1)) p1.reverse();
if (isClockwise(p2)) p2.reverse();

let pS = p1,
  pL = p2;
if (pS.length > pL.length) {
  pS = p2;
  pL = p1;
}

const rays = raycast(pS);
const connections = connectVerts(pL, pS, rays);

const connections2: typeof connections = JSON.parse(JSON.stringify(connections));
connectAcrossRays(connections2);

export default function Home() {
  const ref = useCallback((canvas: HTMLCanvasElement | null) => {
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const w = ctx.canvas.clientWidth,
      h = ctx.canvas.clientHeight;

    // scale canvas to element size
    ctx.canvas.width = w * devicePixelRatio;
    ctx.canvas.height = h * devicePixelRatio;
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

    ctx.lineWidth = 2;
    ctx.strokeStyle = "orange";
    for (const ray of rays) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ray) * 1000, Math.sin(ray) * 1000);
      ctx.stroke();
    }

    drawConnections(ctx, connections2, pL, pS, "magenta");
    drawConnections(ctx, connections, pL, pS, "lime");

    drawShape(ctx, p1, "red");
    drawShape(ctx, p2, "blue");
  }, []);

  return (
    <div className={css.wrapper}>
      <canvas style={{ width: "100%", height: "100%" }} ref={ref} />
      <div className={css.table}>
        {connections.map((row, i) =>
          row.map((col, j) => (
            <div
              key={i + "_" + j}
              className={classnames(css.connection, {
                [css.green!]: connections[i][j],
                [css.purple!]: connections2[i][j]
              })}
            >
              {i}, {j}
            </div>
          ))
        )}
      </div>
    </div>
  );
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
    for (let j = 0; j < matrix[0].length; j++) {
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
