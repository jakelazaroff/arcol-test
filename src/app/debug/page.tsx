"use client";

import GUI from "lil-gui";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { classnames } from "~/lib/classnames";
import {
  center,
  connectAcrossRays,
  connectVerts,
  isClockwise,
  raycast,
  transformToZ0,
} from "~/lib/loft";
import { triangulate } from "~/lib/triangulate";

import css from "./page.module.css";

const ceiling: THREE.Vector3[] = [
  new THREE.Vector3(6, 10, 0),
  // new THREE.Vector3(2, 10, 4),
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
].map(v => v.multiplyScalar(15));

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

let settings = {
  axes: true,
  rays: true,
  labels: true,
  outlines: true,
  table: true,
  connections: true,
  triangles: true,
  shape_1: true,
  shape_2: true,
};

if (global.localStorage) {
  const stored = JSON.parse(localStorage.getItem("debug_settings") || "null");
  if (stored) settings = { ...settings, ...stored };
}

export default function Debug() {
  const [matrix, setMatrix] = useState(false);
  useEffect(() => {
    setMatrix(settings.table);

    const gui = new GUI();
    gui.add(settings, "axes").name("Axes");
    gui.add(settings, "rays").name("Rays");
    gui.add(settings, "labels").name("Labels");
    gui.add(settings, "outlines").name("Outlines");
    gui
      .add(settings, "table")
      .name("Table")
      .onChange((v: boolean) => setMatrix(v));
    gui.add(settings, "connections").name("Connections");
    gui.add(settings, "triangles").name("Triangles");

    const shape1 = gui.addFolder("Shape 1");
    shape1.add(settings, "shape_1").name("Visible");

    const shape2 = gui.addFolder("Shape 2");
    shape2.add(settings, "shape_2").name("Visible");

    gui.onChange(() => {
      if (ctx.current) draw(ctx.current);
      localStorage.setItem("debug_settings", JSON.stringify(settings));
    });

    return () => gui.destroy();
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const w = ctx.canvas.clientWidth,
      h = ctx.canvas.clientHeight;

    // scale canvas to element size
    ctx.canvas.width = w * devicePixelRatio;
    ctx.canvas.height = h * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // translate and scale to orient coordinate system
    ctx.translate(w / 2, h / 2);
    ctx.scale(1, -1);

    if (settings.axes) {
      // draw vertical axis
      ctx.moveTo(0, h / 2);
      ctx.lineTo(0, h / -2);

      // draw horizontal axis
      ctx.moveTo(w / -2, 0);
      ctx.lineTo(w / 2, 0);

      ctx.stroke();
    }

    // draw triangles
    if (settings.triangles) {
      if (settings.shape_1) drawTris(ctx, p1, triangulate(ceiling), "black");
      if (settings.shape_2) drawTris(ctx, p2, triangulate(floor), "black");
    }

    // draw rays
    if (settings.rays) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = "orange";
      for (const ray of rays) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ray) * 1000, Math.sin(ray) * 1000);
        ctx.stroke();
      }
    }

    if (settings.connections) {
      // draw all connections, including ones that cross the rays
      drawConnections(ctx, connections2, pL, pS, "magenta");

      // draw connections, excluding ones that cross the rays
      drawConnections(ctx, connections, pL, pS, "lime");
    }

    // draw shape outlines
    if (settings.outlines) {
      if (settings.shape_1) drawShape(ctx, p1, "red");
      if (settings.shape_2) drawShape(ctx, p2, "blue");
    }
  }, []);

  const ctx = useRef<CanvasRenderingContext2D | null>(null);
  const ref = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      const context = canvas?.getContext("2d");
      if (!context) return;

      ctx.current = context;
      draw(context);
    },
    [draw],
  );

  return (
    <div className={css.wrapper}>
      <canvas style={{ width: "100%", height: "100%" }} ref={ref} />
      {matrix ? (
        <div className={css.table} style={{ "--columns": pS.length } as CSSProperties}>
          {connections.map((row, i) =>
            row.map((_, j) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey:
                key={`${i}_${j}`}
                className={classnames(css.connection, {
                  // biome-ignore lint/style/noNonNullAssertion:
                  [css.green!]: connections[i][j],
                  // biome-ignore lint/style/noNonNullAssertion:
                  [css.purple!]: connections2[i][j],
                })}
              >
                {i}, {j}
              </div>
            )),
          )}
        </div>
      ) : null}
    </div>
  );
}

function drawShape(ctx: CanvasRenderingContext2D, path: THREE.Vector3Tuple[], color: string) {
  ctx.beginPath();

  ctx.lineWidth = 4;
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

    if (settings.labels) {
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

function drawTris(
  ctx: CanvasRenderingContext2D,
  vertices: THREE.Vector3Tuple[],
  tris: [number, number, number][],
  color: string,
) {
  for (const tri of tris) {
    const [x1, y1] = vertices[tri[0]],
      [x2, y2] = vertices[tri[1]],
      [x3, y3] = vertices[tri[2]];

    ctx.lineWidth = 1;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.stroke();
  }
}
