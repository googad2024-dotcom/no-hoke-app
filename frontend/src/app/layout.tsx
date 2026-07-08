import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ColorProvider from "@/components/ColorProvider";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "お金の流動性診断 | NoHoKe",
  description:
    "5分でできる無料診断。あなたのお金の流動性を診断し、自由に使えるお金を見える化します。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ColorProvider>
          {children}
          <Footer />
        </ColorProvider>
      </body>
    </html>
  );
}
