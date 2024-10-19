import { Text } from "@react-three/drei";
import { type ThreeEvent, useThree } from "@react-three/fiber";
import { useAtomValue } from "jotai";
import { Fragment, useState } from "react";
import * as THREE from "three";
import { labels } from "~/lib/settings";

interface Props {
  path: THREE.Vector3[];
  color?: string;
  onPointerDown(point: THREE.Vector3): void;
  onAddPoint(i: number, point: THREE.Vector3): void;
  onRemovePoint(i: number): void;
  onMovePoint(i: number, point: THREE.Vector3): void;
  onPointerUp(point: THREE.Vector3): void;
}

export default function Plane(props: Props) {
  const { path, color, onPointerDown, onPointerUp, onAddPoint, onRemovePoint, onMovePoint } = props;

  const [preview, setPreview] = useState<THREE.Vector3 | null>(null);

  return (
    <>
      {path.map((point, i) => {
        const prev = path.at((i - 1) % path.length)!;

        const v1 = prev.clone(),
          v2 = point.clone();

        const c = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
        const length = v1.distanceTo(v2);
        const direction = new THREE.Vector3().subVectors(v2, v1).normalize();

        const rotation = new THREE.Quaternion();
        rotation.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction); // Align the Y axis of the box with the direction

        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: no ID here
          <Fragment key={i}>
            <Point
              position={point}
              color={color}
              label={"" + i}
              onPointerDown={e => {
                if (e.altKey) return onRemovePoint(i);
                onPointerDown(point);
              }}
              onPointerMove={e => onMovePoint(i, new THREE.Vector3(e.x, point.y, e.z))}
              onPointerUp={() => onPointerUp(point)}
            />
            <mesh
              position={c}
              quaternion={rotation}
              visible={false}
              onPointerMove={e => {
                const v1 = prev.clone(),
                  v2 = point.clone();

                const AB = new THREE.Vector3().subVectors(v2, v1);
                const AP = new THREE.Vector3().subVectors(e.point, v1);

                // Calculate the projection scalar t
                let t = AP.dot(AB) / AB.lengthSq();

                // Clamp t to ensure the snapped point is within the segment
                t = Math.max(0, Math.min(1, t));

                // Calculate the snapped point
                const closestPoint = new THREE.Vector3().copy(v1).add(AB.multiplyScalar(t));
                setPreview(closestPoint);
              }}
              onPointerDown={e => {
                if (!preview) return;
                e.stopPropagation();
                setPreview(null);
                onAddPoint(i, preview);
              }}
              onPointerOut={() => setPreview(null)}
            >
              <boxGeometry args={[0.5, length - 1, 0.5]} />
            </mesh>
            {preview ? (
              <mesh position={preview}>
                <sphereGeometry args={[0.5, 32, 16]} />
                <meshStandardMaterial color={color} />
              </mesh>
            ) : null}
          </Fragment>
        );
      })}
    </>
  );
}

type ThreeTarget = {
  setPointerCapture(pointerId: number): void;
  releasePointerCapture(pointerId: number): void;
} | null;

interface PointProps {
  position: THREE.Vector3;
  label?: string;
  color?: string | number;
  onPointerDown(e: ThreeEvent<PointerEvent>): void;
  onPointerMove(vector: THREE.Vector3): void;
  onPointerUp(e: ThreeEvent<PointerEvent>): void;
}

const raycaster = new THREE.Raycaster();

function Point(props: PointProps) {
  const { color = "blue", label, onPointerDown, onPointerMove, onPointerUp, ...rest } = props;
  const { camera } = useThree();

  const displayLabels = useAtomValue(labels);

  const [, setHover] = useState(false);

  return (
    <>
      <mesh
        {...rest}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        onPointerDown={e => {
          e.stopPropagation();

          const target = e.target as ThreeTarget;
          target?.setPointerCapture(e.pointerId);

          onPointerDown(e);
        }}
        onPointerMove={e => {
          const canvas = e.nativeEvent.target as HTMLCanvasElement;
          const { width, height } = canvas.getBoundingClientRect();

          // calculate normalized device coordinates
          const x = (e.x / width) * 2 - 1,
            y = -(e.y / height) * 2 + 1;

          const intersection = castToYPlane(camera, new THREE.Vector2(x, y), rest.position.y);
          if (intersection) onPointerMove(intersection);
        }}
        onPointerUp={e => {
          e.stopPropagation();

          const target = e.target as ThreeTarget;
          target?.releasePointerCapture(e.pointerId);

          onPointerUp(e);
        }}
        onPointerCancel={() => {}}
      >
        <sphereGeometry args={[0.5, 32, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {displayLabels && label !== "" ? (
        <Text
          position={[rest.position.x, rest.position.y + 2, rest.position.z]}
          color="black"
          scale={[2, 2, 2]}
        >
          {label}
        </Text>
      ) : null}
    </>
  );
}

function castToYPlane(camera: THREE.Camera, v: THREE.Vector2, y: number) {
  // cast the ray
  raycaster.setFromCamera(v, camera);

  // define the plane
  const normal = new THREE.Vector3(0, 1, 0);
  const p = new THREE.Vector3(0, y, 0);

  // get the ray direction
  const dir = raycaster.ray.direction;

  const denominator = dir.dot(normal);

  // ensure the ray isn't parallel to the plane
  if (Math.abs(denominator) <= Number.EPSILON) return;

  // calculate t (the distance along the ray to the intersection point)
  const t = p.sub(raycaster.ray.origin).dot(normal) / denominator;

  // calculate the intersection point
  return new THREE.Vector3().copy(raycaster.ray.origin).add(dir.multiplyScalar(t));
}
