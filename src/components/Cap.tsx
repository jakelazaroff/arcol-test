import { useMemo } from "react";
import type * as THREE from "three";

import { triangulate } from "~/lib/triangulate";
import BufferGeoemtry from "./BufferGeometry";

interface Props {
  path: THREE.Vector3[];
  color?: string | number;
}

export default function Cap(props: Props) {
  const { path, color = "pink" } = props;

  const { vertices, indices } = useMemo(
    () => ({
      vertices: path.flatMap(({ x, y, z }) => [x, y, z]),
      indices: triangulate(path).flat(),
    }),
    [path],
  );

  return <BufferGeoemtry vertices={vertices} indices={indices} color={color} />;
}
