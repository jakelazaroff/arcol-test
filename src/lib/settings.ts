import { createStore } from "jotai";
import { atomWithStorage } from "jotai/utils";
import GUI from "lil-gui";

export const store = createStore();

export const stats = atomWithStorage("stats", false, undefined, { getOnInit: true });
export const grid = atomWithStorage("grid", false, undefined, { getOnInit: true });
export const labels = atomWithStorage("labels", false, undefined, { getOnInit: true });
export const wireframe = atomWithStorage("wireframe", false, undefined, { getOnInit: true });
export const caps = atomWithStorage("caps", true, undefined, { getOnInit: true });

export default function gui() {
  const gui = new GUI();
  gui.close();
  gui
    .add({ stats: store.get(stats) }, "stats")
    .name("Stats")
    .onChange((value: boolean) => store.set(stats, () => value));
  gui
    .add({ grid: store.get(grid) }, "grid")
    .name("Grid")
    .onChange((value: boolean) => store.set(grid, () => value));
  gui
    .add({ labels: store.get(labels) }, "labels")
    .name("Labels")
    .onChange((value: boolean) => store.set(labels, () => value));
  gui
    .add({ wireframe: store.get(wireframe) }, "wireframe")
    .name("Wireframe")
    .onChange((value: boolean) => store.set(wireframe, () => value));
  gui
    .add({ caps: store.get(caps) }, "caps")
    .name("Caps")
    .onChange((value: boolean) => store.set(caps, () => value));

  return () => gui.destroy();
}
