"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ColorButton from "@/components/ColorButton";
import { apiUrl } from "@/lib/api";

type Phase = "processing" | "paid" | "failed";

function ThanksContent() {
  const searchParams = useSearchParams();
  const pi = searchParams.get("pi");

  const [phase, setPhase] = useState<Phase>("processing");
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pi) {
      setPhase("failed");
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 24; // 約60秒（2.5秒間隔）

    const poll = async () => {
      attempts += 1;
      try {
        const res = await fetch(
          apiUrl(`/api/payment/status?pi=${encodeURIComponent(pi)}`),
        );
        const data = await res.json();

        if (cancelled) return;

        if (data.success && data.paid) {
          setResultUrl(data.result_url ?? null);
          setPhase("paid");
          return;
        }
        if (data.status === "failed" || data.status === "canceled") {
          setPhase("failed");
          return;
        }
      } catch {
        // ネットワーク一時エラーはリトライで吸収
      }

      if (!cancelled && attempts < maxAttempts) {
        setTimeout(poll, 2500);
      }
      // タイムアウトしても processing のまま（Webルックは後追いでメール到達）
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [pi]);

  return (
    <div className="flex-1 bg-gradient-to-b from-[#436cb0]/10 to-white">
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

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-xl mx-auto">
          <Card className="p-8 md:p-12 text-center border border-gray-100 shadow-[0_8px_80px_rgba(67,108,176,0.15),0_2px_20px_rgba(0,0,0,0.05)]">
            {phase === "processing" && (
              <>
                <Loader2 className="w-14 h-14 text-[#436cb0] mx-auto mb-6 animate-spin" />
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                  決済を処理しています
                </h1>
                <p className="text-gray-600 leading-relaxed">
                  確定まで数秒お待ちください。
                  <br />
                  この画面は自動で更新されます。
                </p>
              </>
            )}

            {phase === "paid" && (
              <>
                <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                  ご購入ありがとうございます
                </h1>
                <p className="text-gray-600 leading-relaxed mb-8">
                  フル診断結果を解放しました。
                  <br />
                  ご登録のメールアドレスにも結果ページのURLをお送りしました。
                </p>
                {resultUrl && (
                  <a href={resultUrl}>
                    <Button
                      size="lg"
                      className="bg-[#436cb0] hover:bg-[#274576] text-white px-10 py-6"
                    >
                      フル診断結果を見る
                    </Button>
                  </a>
                )}
                <p className="mt-6 text-sm text-gray-500 leading-relaxed">
                  メールが届かない場合は、迷惑メールフォルダもご確認ください。
                  <br />
                  上のボタンからは今すぐ結果をご覧いただけます。
                </p>
              </>
            )}

            {phase === "failed" && (
              <>
                <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                  決済を確認できませんでした
                </h1>
                <p className="text-gray-600 leading-relaxed mb-8">
                  決済が完了していないか、エラーが発生した可能性があります。
                  <br />
                  お手数ですが、もう一度お試しください。
                </p>
                <Link href="/">
                  <Button size="lg" variant="outline" className="px-10 py-6">
                    トップへ戻る
                  </Button>
                </Link>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function ThanksPage() {
  return (
    <Suspense fallback={null}>
      <ThanksContent />
    </Suspense>
  );
}
