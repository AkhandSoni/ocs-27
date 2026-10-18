import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlayStation 5",
  description: "An interactive PlayStation gaming room.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
