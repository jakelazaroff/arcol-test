import { useThree } from "@react-three/fiber";
import { Fragment } from "react";
import * as THREE from "three";

interface Props {
  path: THREE.Vector3Tuple[];
  color?: string;
  onPointerDown(): void;
  onChangePath(path: THREE.Vector3Tuple[]): void;
  onPointerUp(): void;
}

export default function Plane(props: Props) {
  const { path, color, onPointerDown, onPointerUp, onChangePath } = props;

  return (
    <>
      {path.map((point, i) => (
        <Fragment key={i}>
          <Point
            position={point}
            color={color}
            onPointerDown={onPointerDown}
            onPointerMove={e => {
              onChangePath(
                path.map((point, j) => {
                  if (i !== j) return point;
                  return [e.x, point[1], e.z];
                })
              );
            }}
            onPointerUp={onPointerUp}
          />
        </Fragment>
      ))}
    </>
  );
}

type ThreeTarget = {
  setPointerCapture(pointerId: number): void;
  releasePointerCapture(pointerId: number): void;
} | null;

interface PointProps {
  position: THREE.Vector3Tuple;
  color?: string | number;
  onPointerDown(): void;
  onPointerMove(vector: THREE.Vector3): void;
  onPointerUp(): void;
}

const raycaster = new THREE.Raycaster();

function Point(props: PointProps) {
  const { color = "blue", onPointerDown, onPointerMove, onPointerUp, ...rest } = props;
  const { camera } = useThree();

  return (
    <mesh
      {...rest}
      onPointerDown={e => {
        e.stopPropagation();

        const target = e.target as ThreeTarget;
        target?.setPointerCapture(e.pointerId);

        onPointerDown();
      }}
      onPointerMove={e => {
        const canvas = e.nativeEvent.target as HTMLCanvasElement;
        const { width, height } = canvas.getBoundingClientRect();

        const x = (e.x / width) * 2 - 1,
          y = -(e.y / height) * 2 + 1;

        raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

        // define the plane
        const normal = new THREE.Vector3(0, 1, 0);
        const p = new THREE.Vector3(0, rest.position[1], 0);

        // get the ray direction
        const dir = raycaster.ray.direction;

        const denominator = dir.dot(normal);

        // ensure the ray isn't parallel to the plane
        if (Math.abs(denominator) <= Number.EPSILON) return;

        // calculate t (the distance along the ray to the intersection point)
        const t = p.sub(raycaster.ray.origin).dot(normal) / denominator;

        // calculate the intersection point
        const intersection = new THREE.Vector3()
          .copy(raycaster.ray.origin)
          .add(dir.multiplyScalar(t));

        onPointerMove(intersection);
      }}
      onPointerUp={e => {
        e.stopPropagation();

        const target = e.target as ThreeTarget;
        target?.releasePointerCapture(e.pointerId);

        onPointerUp();
      }}
      onPointerCancel={() => {}}
    >
      <sphereGeometry args={[0.5, 32, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
