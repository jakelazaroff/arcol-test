import { expect, test } from "vitest";
import { type Vector3, loft } from "./loft";

test("triangle and star", () => {
  const triangle: Vector3[] = [
    [6.0, 5, 0],
    [-3.0, 5, 5.2],
    [-3.0, 5, -5.2]
  ];

  const star: Vector3[] = [
    [-6.6, -5, 5.6],
    [-17.9, -5, 1.0],
    [-7.2, -5, -5.0],
    [-6.1, -5, -17.2],
    [2.9, -5, -8.9],
    [14.9, -5, -11.6],
    [9.8, -5, -4],
    [16.0, -5, 10.1],
    [3.9, -5, 8.7],
    [-4.2, -5, 17.9]
  ];

  const vertices = new Float32Array([...star, ...triangle].flat());
  const indices = new Uint16Array([
    0, 11, 1, 1, 11, 12, 1, 12, 2, 2, 12, 3, 3, 12, 4, 4, 12, 10, 4, 10, 5, 5, 10, 6, 6, 10, 7, 7,
    10, 11, 7, 11, 8, 8, 11, 9, 9, 11, 0
  ]);

  const triangleFirst = loft(triangle, star);
  expect(triangleFirst.vertices).toEqual(vertices);
  expect(triangleFirst.indices).toEqual(indices);

  const starFirst = loft(star, triangle);
  expect(starFirst.vertices).toEqual(vertices);
  expect(starFirst.indices).toEqual(indices);
});
