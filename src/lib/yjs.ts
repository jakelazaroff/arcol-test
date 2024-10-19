import * as THREE from "three";
import * as Y from "yjs";

export function toYMap({ x, y, z }: { x: number, y: number, z: number }) {
  return new Y.Map<number>([
    ["x", x],
    ["y", y],
    ["z", z],
  ] as const);
}

export function toVector3(map: Y.Map<number>): THREE.Vector3 {
  return new THREE.Vector3(map.get("x")!, map.get("y")!, map.get("z")!);
}
