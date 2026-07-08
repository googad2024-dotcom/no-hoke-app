"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import ColorButton from "@/components/ColorButton";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img
            src="/images/nohoke_logo.svg"
            alt="NoHoKe"
            className="h-10 w-auto"
          />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="#features"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            サービスの特徴
          </Link>
          <Link
            href="#flow"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            診断の流れ
          </Link>
          <Link
            href="#faq"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            よくある質問
          </Link>
          <Link
            href="#info"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            お役立ち情報
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <ColorButton />
          <Button variant="ghost" className="hidden md:inline-flex">
            ログイン
          </Button>
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            無料で診断する
          </Button>
        </div>
      </div>
    </header>
  );
}
