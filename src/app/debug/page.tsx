import type { Metadata } from "next";

import Debug from "~/component/Debug";

export const metadata: Metadata = {
  title: "Arcol Debugger",
};

export default function Page() {
  return <Debug />;
}
