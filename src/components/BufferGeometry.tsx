import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

interface Props {
  vertices: number[];
  indices: number[];
  color?: string | number;
  wireframe?: boolean;
}

const PADDING = 600;
const zeroes = new Array(PADDING).fill(0);

export default function BufferGeoemtry(props: Props) {
  const { vertices, indices, color = "pink", wireframe } = props;

  const v = useMemo(() => new Float32Array([...vertices, ...zeroes].slice(0, PADDING)), [vertices]);
  const i = useMemo(() => new Uint16Array([...indices, ...zeroes].slice(0, PADDING)), [indices]);

  const position = useRef<THREE.BufferAttribute>(null);
  const index = useRef<THREE.BufferAttribute>(null);
  useEffect(() => {
    if (!position.current || !index.current) return;

    position.current.array = v;
    position.current.needsUpdate = true;

    index.current.array = i;
    index.current.needsUpdate = true;
  }, [v, i]);

  return (
    <mesh>
      <bufferGeometry>
        <bufferAttribute
          ref={position}
          attach="attributes-position"
          array={v}
          count={v.length / 3}
          itemSize={3}
          needsUpdate
        />
        <bufferAttribute
          ref={index}
          attach="index"
          array={i}
          count={i.length}
          itemSize={1}
          needsUpdate
        />
      </bufferGeometry>
      <meshStandardMaterial
        color={color}
        flatShading
        side={THREE.DoubleSide}
        wireframe={wireframe}
      />
    </mesh>
  );
}
