import { expect, test } from "vitest";
import { type Vector3, loft } from "./loft";

test("loft", () => {
  const start: Vector3[] = [
    [-20, 20, 0],
    [-20, -20, 0],
    [20, -20, 0],
    [20, 20, 0]
  ];
  const end: Vector3[] = [
    [-25, 5, 0],
    [-5, -25, 0],
    [25, -5, 0],
    [5, 25, 0]
  ];

  const { vertices, indices } = loft(start, end);

  console.log(indices);
  expect(vertices).toEqual(new Float32Array([...end, ...start].flat()));
});
