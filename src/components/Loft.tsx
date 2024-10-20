import { useMemo } from "react";
import type * as THREE from "three";

import { loft } from "~/lib/loft";
import BufferGeoemtry from "./BufferGeometry";

interface Props {
  a: THREE.Vector3[];
  b: THREE.Vector3[];
  color?: string | number;
  wireframe?: boolean;
}

export default function Loft(props: Props) {
  const { a, b, color = "pink", wireframe } = props;

  const { vertices, indices } = useMemo(() => {
    if (!a.length || !b.length) return { vertices: [], indices: [] };
    return loft(a, b);
  }, [a, b]);

  return (
    <BufferGeoemtry vertices={vertices} indices={indices} color={color} wireframe={wireframe} />
  );
}
