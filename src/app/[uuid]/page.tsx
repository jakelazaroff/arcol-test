"use client";

import { OrbitControls, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { YDocProvider, useArray, useYjsProvider } from "@y-sweet/react";
import { Provider, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type * as THREE from "three";
import type * as Y from "yjs";

import Cap from "~/component/Cap";
import Loft from "~/component/Loft";
import Plane from "~/component/Plane";
import gui, { caps, grid, stats, wireframe } from "~/lib/settings";
import { store } from "~/lib/settings";
import { toVector3, toYMap } from "~/lib/yjs";

export default function Home({ params }: { params: { uuid: string } }) {
  useEffect(() => gui(), []);

  return (
    <YDocProvider docId={params.uuid} authEndpoint="/yjs">
      <Provider store={store}>
        <ErrorBoundary fallback={<Fallback />}>
          <Scene />
        </ErrorBoundary>
      </Provider>
    </YDocProvider>
  );
}

function Scene() {
  const provider = useYjsProvider();

  const floor = useArray<Y.Map<number>>("floor");
  const ceiling = useArray<Y.Map<number>>("ceiling");

  useEffect(() => {
    function sync() {
      if (!floor.length) {
        floor.push([
          toYMap({ x: -6.6, y: -10, z: 5.6 }),
          toYMap({ x: -17.9, y: -10, z: 1.0 }),
          toYMap({ x: -7.2, y: -10, z: -5.0 }),
          toYMap({ x: -6.1, y: -10, z: -17.2 }),
          toYMap({ x: 2.9, y: -10, z: -8.9 }),
          toYMap({ x: 14.9, y: -10, z: -11.6 }),
          toYMap({ x: 9.8, y: -10, z: -4 }),
          toYMap({ x: 16.0, y: -10, z: 10.1 }),
          toYMap({ x: 3.9, y: -10, z: 8.7 }),
          toYMap({ x: -4.2, y: -10, z: 17.9 }),
        ]);
      }

      if (!ceiling.length) {
        ceiling.push([
          toYMap({ x: 6.0, y: 10, z: 0 }),
          toYMap({ x: -3.0, y: 10, z: 5.2 }),
          toYMap({ x: -3.0, y: 10, z: -5.2 }),
        ]);
      }
    }

    provider.on("synced", sync);
    return () => provider.off("synced", sync);
  }, [provider, floor, ceiling]);

  const data = { floor, ceiling };
  const [dragging, setDragging] = useState<[id: string, index: number] | undefined>(undefined);

  const displayStats = useAtomValue(stats);
  const displayGrid = useAtomValue(grid);
  const displayWireframe = useAtomValue(wireframe);
  const displayCaps = useAtomValue(caps);

  return (
    <Canvas camera={{ position: [0, 30, 30] }}>
      {displayGrid && <gridHelper args={[50, 10]} />}
      {displayStats && <Stats />}
      <OrbitControls enableRotate={!dragging} />
      <ambientLight intensity={Math.PI / 2} />
      <spotLight
        position={[100, 100, 100]}
        angle={0.15}
        penumbra={1}
        decay={0}
        intensity={Math.PI}
      />
      <pointLight position={[-100, -100, -100]} decay={0} intensity={Math.PI} />

      {displayCaps ? (
        <>
          <Cap path={ceiling.map(toVector3)} color="red" />
          <Cap path={floor.map(toVector3)} color="red" />
        </>
      ) : null}
      <Loft a={floor.map(toVector3)} b={ceiling.map(toVector3)} wireframe={displayWireframe} />

      {Object.entries(data).map(([id, path]) => (
        <Plane
          key={id}
          id={id}
          path={path.map(toVector3)}
          color="blue"
          dragging={dragging}
          onStartDrag={i => setDragging([id, i])}
          onMovePoint={(i, { x, y, z }) => {
            if (dragging?.[0] !== id || dragging?.[1] !== i) return;

            const point = path.get(i);
            point.set("x", x);
            point.set("y", y);
            point.set("z", z);
          }}
          onAddPoint={(i, point) => {
            setDragging([id, i]);
            path.insert(i, [toYMap(point)]);
          }}
          onRemovePoint={i => path.delete(i)}
          onEndDrag={() => setDragging(undefined)}
        />
      ))}
    </Canvas>
  );
}

function Fallback() {
  const floor = useArray<THREE.Vector3Tuple>("floor");
  const ceiling = useArray<THREE.Vector3Tuple>("ceiling");

  return (
    <div>
      <h2>Whoops!</h2>
      <pre>
        <code>{JSON.stringify(ceiling)}</code>
      </pre>
      <pre>
        <code>{JSON.stringify(floor)}</code>
      </pre>
    </div>
  );
}
