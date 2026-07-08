"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ColorButton from "@/components/ColorButton";
import styles from "./page.module.css";
import { apiUrl } from "@/lib/api";
import { validateEmail } from "@/lib/email";

function EmailRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 送信前にメール形式・ドメイン誤字をチェック（不達となる送信を未然に防ぐ）
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(apiUrl("/api/lead/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, email }),
      });

      const data = await response.json();
      if (data.success) {
        // メール送信に失敗していても token は発行済み。mail_failed フラグを渡し、
        // 完了画面から直接結果ページへ遷移できるようにする。
        const mailFailed = data.email_sent === false ? "&mail_failed=1" : "";
        router.push(
          `/result/email-sent?email=${encodeURIComponent(email)}&token=${data.token}${mailFailed}`,
        );
      } else {
        setError(data.message || "登録に失敗しました");
      }
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-white flex flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center w-fit">
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

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-16 bg-[#f8fafd]">
        <div className={styles["meil-container"]}>
          <div className="w-full mx-auto">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-18 h-18 rounded-full border-2 border-[#436cb0]/30 flex items-center justify-center">
                <Mail className="w-12 h-12 text-[#436cb0]" />
              </div>
            </div>

            {/* Heading */}
            <div className="text-center mb-8">
              <p className="text-lg md:text-xl text-[#436cb0] font-medium mb-4">
                途中結果はここまでです
              </p>
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                お手元で診断結果を見る
              </h1>
              <p className="text-sm md:text-md text-gray-500 leading-relaxed">
                メールアドレスをご登録いただくと、
                <br className="hidden md:inline" />
                あなたの現状分析に関する診断結果をご確認いただけます。
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-4 mx-auto bg-white mb-12 p-6 md:p-8 w-full md:min-w-[400px] rounded-[20px] border border-gray-100 shadow-[0_8px_80px_rgba(67,108,176,0.15),0_2px_20px_rgba(0,0,0,0.05)]"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    メールアドレス
                  </label>
                  <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                    必須
                  </span>
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="例）example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 text-base"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full bg-[#436cb0] hover:bg-[#365a96] h-1 text-xl font-bold py-8"
                disabled={isLoading}
              >
                {isLoading ? (
                  "送信中..."
                ) : (
                  <>
                    診断結果を受け取る
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>

              <p className="text-sm text-gray-400 text-center flex items-center justify-center gap-1.5 items-start flex">
                <Lock className="w-3 h-3 mt-1" />
                入力いただいたメールアドレスは、診断結果の配信にのみ利用します。
                <br />
                第三者に提供することはありません。
              </p>

              {/* 個人情報取得の同意（プライバシーポリシーへの導線） */}
              <p className="text-xs text-gray-400 text-center leading-relaxed">
                「診断結果を受け取る」を押すことで、
                <Link
                  href="/privacy"
                  className="text-[#436cb0] underline underline-offset-2 hover:text-gray-700"
                >
                  プライバシーポリシー
                </Link>
                に同意したものとみなします。
              </p>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-400">または</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Sub links */}
            <div className="space-y-3 text-center flex flex-col justify-center">
              <Link
                href={`/result/preview?session_id=${sessionId}`}
                className="inline-flex items-center gap-1.5 text-md text-[#436cb0] hover:text-gray-700 underline underline-offset-2 flex justify-center mb-6"
              >
                <ArrowLeft className="w-5 h-5" />
                途中の診断結果へ戻る
              </Link>
              <Link
                href="/diagnosis"
                className="inline-flex items-center gap-1.5 text-md text-[#436cb0] hover:text-gray-700 underline underline-offset-2 mt-4 flex justify-center mb-6"
              >
                <img src="/images/file.svg" alt="" className="w-6 h-6" />
                診断せずに診断をやり直す
              </Link>
              <Link
                href={`/diagnosis?session_id=${sessionId}`}
                className="inline-flex items-center gap-1.5 text-md text-[#436cb0] hover:text-gray-700 underline underline-offset-2 flex justify-center"
              >
                <img src="/images/security.svg" alt="" className="w-6 h-6" />
                入力内容の確認・変更はこちら
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function EmailRegisterPage() {
  return (
    <Suspense fallback={null}>
      <EmailRegisterContent />
    </Suspense>
  );
}
