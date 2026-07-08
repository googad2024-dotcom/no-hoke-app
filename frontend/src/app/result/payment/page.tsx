"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, ChevronLeft } from "lucide-react";
import ColorButton from "@/components/ColorButton";
import PaymentForm from "@/components/PaymentForm";

/**
 * 500円プランの決済専用ページ。
 * プレビュー画面の「500円で今すぐ見る」から session_id 付きで遷移してくる。
 * 左にプラン概要+メール、右にカード入力（スライドイン）の2パネル構成。
 * 決済完了後は PaymentForm 内でサンクスページ（/result/thanks）へ遷移する。
 */
function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      router.push("/diagnosis");
    }
  }, [sessionId, router]);

  if (!sessionId) {
    return null;
  }

  const benefits = [
    "フル診断結果の解放",
    "結果ページURLをメール送付",
    "専門家への相談予約",
  ];

  // 左パネル上部に表示するプラン概要
  const planSummary = (
    <div>
      <div className="text-center">
        <div className="inline-block bg-[#436cb0] text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
          おすすめ
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">500円プラン</h1>
        <p className="text-sm text-gray-600">
          フル診断結果をすぐに解放。結果ページのURLをメールでお届けします。
        </p>
        <div className="mt-4">
          <span className="text-4xl font-bold text-[#436cb0]">¥500</span>
          <span className="text-sm text-gray-500">（税込・買い切り）</span>
        </div>
      </div>

      <div className="mt-6 space-y-2 text-sm text-gray-600">
        {benefits.map((b) => (
          <div key={b} className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#436cb0]" />
            <span>{b}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-gradient-to-b from-[#436cb0]/10 to-white">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <img
                src="/images/nohoke_logo.svg"
                alt="NoHoKe"
                className="h-8 w-auto"
              />
            </Link>
            <ColorButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* 戻る */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            診断結果へ戻る
          </button>

          <PaymentForm sessionId={sessionId} planSummary={planSummary} />

          {/* 購入前の同意・法定表記への導線 */}
          <p className="mt-6 text-center text-xs leading-relaxed text-gray-400">
            ご購入手続きを進めることで、
            <Link
              href="/privacy"
              className="text-[#436cb0] underline underline-offset-2 hover:text-gray-700"
            >
              プライバシーポリシー
            </Link>
            ・
            <Link
              href="/terms"
              className="text-[#436cb0] underline underline-offset-2 hover:text-gray-700"
            >
              利用規約
            </Link>
            に同意したものとみなします。お支払い条件は
            <Link
              href="/tokushoho"
              className="text-[#436cb0] underline underline-offset-2 hover:text-gray-700"
            >
              特定商取引法に基づく表記
            </Link>
            をご確認ください。
          </p>
        </div>
      </main>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={null}>
      <PaymentPageContent />
    </Suspense>
  );
}
