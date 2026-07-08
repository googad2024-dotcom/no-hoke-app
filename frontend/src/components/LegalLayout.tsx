import Link from "next/link";

/**
 * 法務系ページ（プライバシーポリシー・利用規約・特定商取引法）の共通レイアウト。
 * 上部にロゴバー、中央に本文コンテナ、見出しと最終更新日を表示する。
 * フッターは app/layout.tsx の共通 Footer が描画する。
 */
export default function LegalLayout({
  title,
  updatedAt,
  children,
}: {
  title: string;
  /** 例: "2026-07-06" */
  updatedAt?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 bg-[#f8fafd]">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex w-fit items-center">
            <img
              src="/images/nohoke_logo.svg"
              alt="NoHoKe"
              className="h-8 w-auto"
            />
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {updatedAt && (
          <p className="mt-2 text-sm text-gray-400">最終更新日：{updatedAt}</p>
        )}
        <div className="mt-8 space-y-8 rounded-2xl border border-gray-100 bg-white p-6 md:p-10 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
          {children}
        </div>
      </main>
    </div>
  );
}

/**
 * 法務ページ内の 1 セクション（見出し＋本文）。
 */
export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-gray-900">{heading}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-gray-600">
        {children}
      </div>
    </section>
  );
}

/**
 * 事業側で確定・記入が必要な箇所を明示するプレースホルダ。
 * 本番公開前にすべて実値へ差し替えること。
 */
export function Todo({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-700">
      【要記入：{children}】
    </span>
  );
}
