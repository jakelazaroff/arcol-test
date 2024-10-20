import { createStore } from "jotai";
import { atomWithStorage } from "jotai/utils";
import GUI from "lil-gui";

export const store = createStore();

export const stats = atomWithStorage("stats", false, undefined, { getOnInit: true });
export const grid = atomWithStorage("grid", false, undefined, { getOnInit: true });
export const labels = atomWithStorage("labels", false, undefined, { getOnInit: true });
export const wireframe = atomWithStorage("wireframe", false, undefined, { getOnInit: true });

export default function gui() {
  const gui = new GUI();
  gui.close();
  gui
    .add({ stats: store.get(stats) }, "stats")
    .onChange((value: boolean) => store.set(stats, () => value));
  gui
    .add({ grid: store.get(grid) }, "grid")
    .onChange((value: boolean) => store.set(grid, () => value));
  gui
    .add({ labels: store.get(labels) }, "labels")
    .onChange((value: boolean) => store.set(labels, () => value));
  gui
    .add({ wireframe: store.get(wireframe) }, "wireframe")
    .onChange((value: boolean) => store.set(wireframe, () => value));

  return () => gui.destroy();
}
