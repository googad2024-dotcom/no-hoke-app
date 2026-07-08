import Link from "next/link";

/**
 * 全ページ共通フッター（app/layout.tsx で描画）。
 * 法務ページ（プライバシーポリシー・利用規約・特定商取引法）とお問い合わせへの導線を常時表示する。
 * 各ページのルートは flex-1 のため、内容が短いページでは本フッターが1画面内に収まる。
 */
export default function Footer() {
  const links = [
    { href: "/privacy", label: "プライバシーポリシー" },
    { href: "/terms", label: "利用規約" },
    { href: "/tokushoho", label: "特定商取引法に基づく表記" },
    { href: "/contact", label: "お問い合わせ" },
  ];

  return (
    <footer className="shrink-0 border-t border-gray-200 bg-white print:hidden">
      <div className="container mx-auto flex flex-col items-center gap-3 px-4 py-4 md:px-6">
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-gray-500 transition-colors hover:text-gray-900"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} NoHoKe. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
