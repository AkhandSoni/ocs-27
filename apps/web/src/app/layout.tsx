import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACM-VIT · OCS ’27 Console",
  description: "Because Technology Matters. Explore ACM-VIT domains, projects and an original arcade inside an interactive gaming console.",
  icons: { icon: "/console/mark.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
