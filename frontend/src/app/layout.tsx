import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "AskLearnly",
  description: "Ask questions across your Learnly library and inspect the supporting evidence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
