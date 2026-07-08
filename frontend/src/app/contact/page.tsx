"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mail,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Lock,
} from "lucide-react";
import Link from "next/link";
import ColorButton from "@/components/ColorButton";
import { apiUrl } from "@/lib/api";
import { validateEmail } from "@/lib/email";

const NAME_MAX = 100;
const MESSAGE_MAX = 2000;

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (name.trim() === "") {
      setError("お名前を入力してください");
      return;
    }
    // メール形式・ドメイン誤字を送信前にチェック（返信の不達を防ぐ）
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    if (message.trim() === "") {
      setError("お問い合わせ内容を入力してください");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(apiUrl("/api/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await response.json();
      if (data.success) {
        setSent(true);
      } else {
        setError(data.message || "送信に失敗しました");
      }
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[#f8fafd] flex flex-col">
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
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl mx-auto">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full border-2 border-[#436cb0]/30 flex items-center justify-center">
              <Mail className="w-9 h-9 text-[#436cb0]" />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              お問い合わせ
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              サービスに関するご質問・ご要望などをお寄せください。
              <br />
              内容を確認のうえ、担当者よりご返信いたします。
            </p>
          </div>

          {sent ? (
            /* 送信完了 */
            <Card className="p-8 md:p-10 border border-gray-100 shadow-[0_8px_80px_rgba(67,108,176,0.15),0_2px_20px_rgba(0,0,0,0.05)]">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
                  <CheckCircle className="w-9 h-9 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  お問い合わせを送信しました
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-8">
                  この度はお問い合わせいただきありがとうございます。
                  <br />
                  ご入力いただいたメールアドレス宛に、担当者よりご返信いたします。
                </p>
                <Button asChild size="lg" className="bg-[#436cb0] hover:bg-[#365a96]">
                  <Link href="/">トップへ戻る</Link>
                </Button>
              </div>
            </Card>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-5 bg-white p-8 rounded-[20px] border border-gray-100 shadow-[0_8px_80px_rgba(67,108,176,0.15),0_2px_20px_rgba(0,0,0,0.05)]"
            >
              {/* Name */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <label htmlFor="name" className="text-sm font-medium text-gray-700">
                    お名前
                  </label>
                  <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                    必須
                  </span>
                </div>
                <Input
                  id="name"
                  type="text"
                  placeholder="例）山田 太郎"
                  value={name}
                  maxLength={NAME_MAX}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12 text-base"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
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

              {/* Message */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <label htmlFor="message" className="text-sm font-medium text-gray-700">
                    お問い合わせ内容
                  </label>
                  <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                    必須
                  </span>
                </div>
                <Textarea
                  id="message"
                  placeholder="お問い合わせ内容をご記入ください。"
                  value={message}
                  maxLength={MESSAGE_MAX}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="min-h-40 text-base"
                />
                <p className="text-right text-xs text-gray-400">
                  {message.length} / {MESSAGE_MAX}
                </p>
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
                className="w-full bg-[#436cb0] hover:bg-[#365a96] text-lg font-bold py-7"
                disabled={isLoading}
              >
                {isLoading ? (
                  "送信中..."
                ) : (
                  <>
                    この内容で送信する
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
                <Lock className="w-3 h-3" />
                入力いただいた個人情報は、お問い合わせへの対応のみに利用します。
              </p>

              {/* 個人情報取扱いの同意（プライバシーポリシーへの導線） */}
              <p className="text-xs text-gray-400 text-center leading-relaxed">
                「この内容で送信する」を押すことで、
                <Link
                  href="/privacy"
                  className="text-[#436cb0] underline underline-offset-2 hover:text-gray-700"
                >
                  プライバシーポリシー
                </Link>
                に同意したものとみなします。
              </p>
            </form>
          )}

          {/* Back link */}
          {!sent && (
            <div className="text-center mt-6">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-[#436cb0] hover:text-gray-700 underline underline-offset-2"
              >
                <ArrowLeft className="w-4 h-4" />
                トップへ戻る
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
