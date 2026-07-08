"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStripe } from "@/lib/stripe";
import { apiUrl } from "@/lib/api";
import { validateEmail } from "@/lib/email";

const stripePromise = getStripe();

type Props = {
  sessionId: string;
  /** 左パネル上部に表示するプラン概要（バッジ・価格・特典など） */
  planSummary?: React.ReactNode;
};

/**
 * 500円プランの決済フォーム（横並び2パネル）。
 * 左: プラン概要 + メール入力
 * 右: メール送信で PaymentIntent を作成すると、カード入力パネルが右からスライドインする
 * 決済成功でサンクスページへ（確定・メールは Webhook 側で実施）。
 */
export default function PaymentForm({ sessionId, planSummary }: Props) {
  const [email, setEmail] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardReady = Boolean(clientSecret && paymentIntentId);

  const startPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 既にカードパネルを表示済みなら二重作成しない
    if (cardReady) return;

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/payment/intent"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message ?? "決済の準備に失敗しました");
      }
      setClientSecret(data.client_secret);
      setPaymentIntentId(data.payment_intent_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-start justify-center gap-6">
      {/* 左パネル: プラン概要 + メール入力 */}
      <Card className="w-full lg:w-[380px] p-6 md:p-8 border-2 border-[#436cb0] shadow-[0_8px_80px_rgba(67,108,176,0.15),0_2px_20px_rgba(0,0,0,0.05)]">
        {planSummary}

        <form onSubmit={startPayment} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="payment-email">メールアドレス</Label>
            <Input
              id="payment-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={cardReady}
              required
            />
            <p className="text-xs text-gray-500">
              ご購入後、このアドレスへ診断結果ページのURLをお送りします。
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            size="lg"
            disabled={loading || cardReady}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {cardReady
              ? "メールを確認しました"
              : loading
                ? "準備中..."
                : "500円で購入に進む"}
          </Button>
        </form>
      </Card>

      {/* 右パネル: カード入力（PaymentIntent 作成後に右からスライドイン） */}
      {clientSecret && paymentIntentId && (
        <Card className="w-full lg:w-[420px] p-6 md:p-8 border border-gray-100 shadow-[0_8px_80px_rgba(67,108,176,0.15),0_2px_20px_rgba(0,0,0,0.05)] animate-in slide-in-from-right-8 fade-in duration-500">
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: { theme: "stripe" } }}
          >
            <CheckoutForm paymentIntentId={paymentIntentId} email={email} />
          </Elements>
        </Card>
      )}
    </div>
  );
}

/**
 * Elements 配下のカード入力 + 確定処理。
 */
function CheckoutForm({
  paymentIntentId,
  email,
}: {
  paymentIntentId: string;
  email: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    try {
      const returnUrl = `${window.location.origin}/result/thanks/?pi=${paymentIntentId}`;

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
          receipt_email: email,
        },
        // カード等は遷移せずその場で確定。3DS 等が必要な手段のみ return_url へ
        redirect: "if_required",
      });

      if (confirmError) {
        // カード拒否・認証失敗・パラメータ不備などはここに入る
        setError(
          confirmError.message ??
            "決済に失敗しました。カード情報をご確認のうえ、もう一度お試しください。",
        );
        return;
      }

      // リダイレクト型の手段では通常ここに到達しない（ページ遷移する）
      if (!paymentIntent) {
        setError(
          "決済の確認に失敗しました。お手数ですが、もう一度お試しください。",
        );
        return;
      }

      // 確定（succeeded / processing）→ サンクスページでステータスをポーリング
      if (
        paymentIntent.status === "succeeded" ||
        paymentIntent.status === "processing"
      ) {
        router.push(`/result/thanks/?pi=${paymentIntentId}`);
        return;
      }

      // 承認されなかった（要再入力）
      if (paymentIntent.status === "requires_payment_method") {
        setError(
          "決済が承認されませんでした。別のカードでお試しいただくか、入力内容をご確認ください。",
        );
        return;
      }

      // requires_action / requires_confirmation など想定外の状態
      setError(
        `決済が完了しませんでした（状態: ${paymentIntent.status}）。もう一度お試しください。`,
      );
    } catch (err) {
      // confirmPayment が例外を投げた場合でも「処理中…」のまま固まらないようにする
      console.error("Stripe confirmPayment failed", err);
      setError(
        err instanceof Error
          ? `決済処理中にエラーが発生しました: ${err.message}`
          : "決済処理中にエラーが発生しました。お手数ですが、もう一度お試しください。",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        type="submit"
        size="lg"
        disabled={!stripe || submitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {submitting ? "処理中..." : "500円を支払う"}
      </Button>

      <p className="flex items-center justify-center gap-1 text-xs text-gray-500">
        Stripe による安全な決済。カード情報は当社サーバーを経由しません。
      </p>
    </form>
  );
}
