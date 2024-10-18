import * as Y from "yjs";

export function toYMap([x, y, z]: [number, number, number]) {
  return new Y.Map<number>([
    ["x", x],
    ["y", y],
    ["z", z],
  ] as const);
}

export function toVector3(map: Y.Map<number>): [x: number, y: number, z: number] {
  return [map.get("x")!, map.get("y")!, map.get("z")!] as const;
}
