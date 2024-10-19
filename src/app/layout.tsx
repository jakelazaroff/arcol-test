import type { Metadata } from "next";

import "~/style/style.css";

export const metadata: Metadata = {
  title: "Arcol",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
