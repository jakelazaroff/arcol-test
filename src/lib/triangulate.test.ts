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
    [1, 2, 3],
  ];

  const actual = triangulate(triangle);
  expect(actual).toEqual(expected);
});
