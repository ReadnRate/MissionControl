import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mission Control | ReadnRate",
  description: "Executive Command Center",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} flex h-screen overflow-hidden bg-slate-950`}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-white text-slate-900">
          {children}
        </main>
      </body>
    </html>
  );
}
