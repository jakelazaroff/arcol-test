import { expect, test } from "vitest";
import { type Vector3, loft } from "./loft";

test("triangle and star", () => {
  const triangle: Vector3[] = [
    { x: 6.0, y: 5, z: 0},
    { x: -3.0, y: 5, z: 5.2},
    { x: -3.0, y: 5, z: -5.2},
  ];

  const star: Vector3[] = [
    {x: -6.6, y: -5, z: 5.6},
    {x: -17.9, y: -5, z: 1.0},
    {x: -7.2, y: -5, z: -5.0},
    {x: -6.1, y: -5, z: -17.2},
    {x: 2.9, y: -5, z: -8.9},
    {x: 14.9, y: -5, z: -11.6},
    {x: 9.8, y: -5, z: -4},
    {x: 16.0, y: -5, z: 10.1},
    {x: 3.9, y: -5, z: 8.7},
    {x: -4.2, y: -5, z: 17.9},
  ];

  const vertices = [...star, ...triangle].map(({ x, y, z }) => [x, y, z]).flat();
  const indices = [
    0, 11, 1, 1, 11, 12, 1, 12, 2, 2, 12, 3, 3, 12, 4, 4, 12, 10, 4, 10, 5, 5, 10, 6, 6, 10, 7, 7,
    10, 11, 7, 11, 8, 8, 11, 9, 9, 11, 0,
  ];

  const triangleFirst = loft(triangle, star);
  expect(triangleFirst.vertices).toEqual(vertices);
  expect(triangleFirst.indices).toEqual(indices);

  const starFirst = loft(star, triangle);
  expect(starFirst.vertices).toEqual(vertices);
  expect(starFirst.indices).toEqual(indices);
});

test("triangle with midpoint added", () => {
  const triangle: Vector3[] = [
    {x: 6, y: 10, z: 0},
    {x: 0.8730043437764863, y: 10, z: 2.962264156929141},
    {x: -3, y: 10, z: 5.2},
    {x: -3, y: 10, z: -5.2},
  ];

  const star: Vector3[] = [
    { x: -6.6, y: -5, z: 5.6},
    { x: -17.9, y: -5, z: 1.0},
    { x: -7.2, y: -5, z: -5.0},
    { x: -6.1, y: -5, z: -17.2},
    { x: 2.9, y: -5, z: -8.9},
    { x: 14.9, y: -5, z: -11.6},
    { x: 9.8, y: -5, z: -4},
    { x: 16.0, y: -5, z: 10.1},
    { x: 3.9, y: -5, z: 8.7},
    { x: -4.2, y: -5, z: 17.9},
  ];

  const vertices = [...star, ...triangle].map(({ x, y, z }) => [x, y, z]).flat();
  const indices = [
    0, 12, 1, 1, 12, 13, 1, 13, 2, 2, 13, 3, 3, 13, 4, 4, 13, 10, 4, 10, 5, 5, 10, 6, 11, 10, 6, 6,
    11, 7, 7, 11, 8, 8, 11, 9, 9, 11, 12, 9, 12, 0,
  ];

  const triangleFirst = loft(triangle, star);
  expect(triangleFirst.vertices).toEqual(vertices);
  expect(triangleFirst.indices).toEqual(indices);

  const starFirst = loft(star, triangle);
  expect(starFirst.vertices).toEqual(vertices);
  expect(starFirst.indices).toEqual(indices);
});
