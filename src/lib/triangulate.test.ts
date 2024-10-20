import { expect, test } from "vitest";
import { type Vector3, triangulate } from "./triangulate";

test("triangle with midpoint added", () => {
  const triangle: Vector3[] = [
    { x: 6, y: 10, z: 0 },
    { x: 0.8730043437764863, y: 10, z: 2.962264156929141 },
    { x: -3, y: 10, z: 5.2 },
    { x: -3, y: 10, z: -5.2 },
  ];

  const expected = [
    [2, 3, 0],
    [2, 0, 1],
  ];

  const actual = triangulate(triangle);
  expect(actual).toEqual(expected);
});

test("star", () => {
  const star: Vector3[] = [
    { x: -6.6, y: -5, z: 5.6 },
    { x: -17.9, y: -5, z: 1.0 },
    { x: -7.2, y: -5, z: -5.0 },
    { x: -6.1, y: -5, z: -17.2 },
    { x: 2.9, y: -5, z: -8.9 },
    { x: 14.9, y: -5, z: -11.6 },
    { x: 9.8, y: -5, z: -4 },
    { x: 16.0, y: -5, z: 10.1 },
    { x: 3.9, y: -5, z: 8.7 },
    { x: -4.2, y: -5, z: 17.9 },
  ];

  const expected = [
    [4, 5, 6],
    [0, 1, 2],
    [8, 9, 0],
    [2, 3, 4],
    [6, 7, 8],
    [6, 8, 0],
    [6, 0, 2],
    [6, 2, 4],
  ];

  const actual = triangulate(star);
  expect(actual).toEqual(expected);
});
