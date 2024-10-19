"use client";

import { type CSSProperties, useCallback } from "react";

import css from "./page.module.css";

import {
  center,
  connectAcrossRays,
  connectVerts,
  isClockwise,
  raycast,
  transformToZ0
} from "~/lib/loft";
import * as THREE from "three";
import { classnames } from "~/lib/classnames";

const ceiling: THREE.Vector3[] = [
  new THREE.Vector3(6, 10, 0),
  new THREE.Vector3(0.8730043437764863, 10, 2.962264156929141),
  new THREE.Vector3(-3, 10, 5.2),
  new THREE.Vector3(-3, 10, -5.2),
].map(v3 => v3.multiplyScalar(10));

const floor: THREE.Vector3[] = [
  new THREE.Vector3(-6.6, -10, 5.6),
  new THREE.Vector3(-17.9, -10, 1),
  new THREE.Vector3(-7.2, -10, -5),
  new THREE.Vector3(-6.1, -10, -17.2),
  new THREE.Vector3(2.9, -10, -8.9),
  new THREE.Vector3(14.9, -10, -11.6),
  new THREE.Vector3(9.8, -10, -4),
  new THREE.Vector3(16, -10, 10.1),
  new THREE.Vector3(3.9, -10, 8.7),
  new THREE.Vector3(-4.2, -10, 17.9),
].map((v) => v.multiplyScalar(15));

const p1 = ceiling.map<THREE.Vector3Tuple>(v => [v.x, v.y, v.z]),
  p2 = floor.map<THREE.Vector3Tuple>(v => [v.x, v.y, v.z]);

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
      <div className={css.table} style={{ "--columns": pS.length } as CSSProperties}>
        {connections.map((row, i) =>
          row.map((col, j) => (
            <div
              key={i + "_" + j}
              className={classnames(css.connection, {
                [css.green!]: connections[i][j],
                [css.purple!]: connections2[i][j],
              })}
            >
              {i}, {j}
            </div>
          )),
        )}
      </div>
    </div>
  );
}

function drawShape(ctx: CanvasRenderingContext2D, path: THREE.Vector3Tuple[], color: string) {
  ctx.beginPath();

  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  for (const [x, y] of path) {
    ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.stroke();

  let i = 0;
  for (const [x, y] of path) {
    ctx.beginPath();
    ctx.ellipse(x, y, 4, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.scale(1, -1);
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "black";
    ctx.strokeStyle = "white";
    ctx.strokeText(`${i}`, x, -y - 8);
    ctx.fillText(`${i}`, x, -y - 8);
    ctx.scale(1, -1);
    i += 1;
  }
}

function drawConnections(
  ctx: CanvasRenderingContext2D,
  matrix: boolean[][],
  pL: THREE.Vector3Tuple[],
  pS: THREE.Vector3Tuple[],
  color: string,
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
