import GUI from "lil-gui";
import { atom, createStore } from "jotai";

export const store = createStore();

export const stats = atom(false);
export const grid = atom(false);
export const labels = atom(false);
export const wireframe = atom(false);

export default function gui() {
  const gui = new GUI();
  gui.close();
  gui.add({ stats: false }, "stats").onChange((value: boolean) => store.set(stats, () => value));
  gui.add({ grid: false }, "grid").onChange((value: boolean) => store.set(grid, () => value));
  gui.add({ labels: false }, "labels").onChange((value: boolean) => store.set(labels, () => value));
  gui
    .add({ wireframe: false }, "wireframe")
    .onChange((value: boolean) => store.set(wireframe, () => value));

  return () => gui.destroy();
}
