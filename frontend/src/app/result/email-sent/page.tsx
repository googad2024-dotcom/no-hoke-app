"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import ColorButton from "@/components/ColorButton";

function EmailSentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";
  // メール送信に失敗したケース（lead/register が email_sent=false を返した）
  const mailFailed = searchParams.get("mail_failed") === "1";

  return (
    <div className="flex-1 bg-gradient-to-b from-blue-50/30 to-white">
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto min-w-[1000px]">
          <Card className="p-8 md:p-12 border border-gray-100 shadow-[0_8px_80px_rgba(67,108,176,0.15),0_2px_20px_rgba(0,0,0,0.05)]">
            {/* Icon */}
            <div className="flex justify-center mb-8">
              {/* <div className="relative">
                <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-full p-8">
                  <Mail className="w-20 h-20 text-blue-600" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-blue-600 rounded-full p-2">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              </div> */}
              <img src="/images/mail-sent.png" alt="" className="w-120" />
            </div>

            {/* Title */}
            <div className="text-center space-y-4 mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {mailFailed
                  ? "ご登録ありがとうございます"
                  : "メールを送信しました！"}
              </h1>
              <p className="text-gray-600">
                {mailFailed ? (
                  <>
                    メールの送信に失敗した可能性があります。
                    <br />
                    お手数ですが、下のボタンから診断結果をご確認ください。
                  </>
                ) : (
                  <>
                    ご登録いただいたメールアドレスに、
                    <br />
                    診断結果が記載されたURLを送信しました。
                  </>
                )}
              </p>
            </div>

            {/* Email Display */}
            {email && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 mx-auto min-w-[520px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* <Mail className="w-5 h-5 text-gray-500" /> */}
                    <div className="rounded-full w-[50px] h-[50px] bg-[oklch(0.63_0.18_262.11)] flex items-center justify-center">
                      <img src="/images/mail.svg" alt="" className="w-8" />
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        送信先メールアドレス
                      </div>
                      <div className="font-medium text-gray-900 text-xl">
                        {email}
                      </div>
                    </div>
                  </div>
                  {mailFailed ? (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-md">
                      <AlertCircle className="w-6 h-6 mr-1 " />
                      送信エラー
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-md">
                      <CheckCircle className="w-6 h-6 mr-1 " />
                      確認済み
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="space-y-4 mb-8 bg-gray-50 rounded-lg p-4 mb-6 mx-auto min-w-[520px]">
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900 mb-1 text-lg">
                    メールが届かない場合：
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>迷惑メールフォルダをご確認ください</li>
                    <li>
                      しばらく時間をおいてから受信ボックスをご確認ください
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-gray-600">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  メールが届かない場合や、誤ったアドレスを入力された場合は、
                  再度診断からやり直してください。
                </div>
              </div>
            </div>

            {/* 不達時：メールを待たずに直接結果ページへ遷移できる導線 */}
            {mailFailed && token && (
              <div className="mb-6 flex justify-center">
                <Button
                  size="lg"
                  className="w-full max-w-[520px] bg-[#436cb0] hover:bg-[#274576] text-white py-9 text-lg font-bold"
                  asChild
                >
                  <Link href={`/result/?token=${token}`}>
                    診断結果を見る
                  </Link>
                </Button>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="space-y-3 flex gap-6 mx-auto flex justify-center min-w-[350px]">
              <Button
                size="lg"
                className="w-full bg-[oklch(0.63_0.18_262.11)] hover:bg-blue-700 text-white py-9"
                asChild
              >
                <Link href="/diagnosis">診断をやり直す</Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="w-full py-9"
                asChild
              >
                <Link href="/">診断トップへ戻る</Link>
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function EmailSentPage() {
  return (
    <Suspense fallback={null}>
      <EmailSentContent />
    </Suspense>
  );
}
