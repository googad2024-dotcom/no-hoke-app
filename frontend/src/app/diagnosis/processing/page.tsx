"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Shield, Check, TrendingUp, Calculator, FileText } from "lucide-react";
import Link from "next/link";
import ColorButton from "@/components/ColorButton";

function ProcessingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState(0);

  const tasks = [
    { icon: Calculator, label: "収入と支出のバランスを評価", delay: 1000 },
    { icon: TrendingUp, label: "将来必要な資産を計算", delay: 2000 },
    { icon: FileText, label: "最適な資産形成プランを作成", delay: 3000 },
  ];

  useEffect(() => {
    if (!sessionId) {
      router.push("/diagnosis");
      return;
    }

    // プログレスバーのアニメーション
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    // タスクの進行
    tasks.forEach((task, index) => {
      setTimeout(() => {
        setCurrentTask(index + 1);
      }, task.delay);
    });

    // 3秒後に結果プレビューページへ遷移
    const timer = setTimeout(() => {
      router.push(`/result/preview?session_id=${sessionId}`);
    }, 3500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, [sessionId, router]);

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
            <div className="flex items-center gap-3">
              <ColorButton />
              <div className="text-sm text-gray-600">資産形成診断</div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b py-6">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold bg-[#436cb0] text-white">
                    <Check className="w-5 h-5" />
                  </div>
                  <div className="text-xs mt-2 text-gray-600">Step {step}</div>
                </div>
              ))}
            </div>
            <Progress value={100} className="h-2 [&>div]:bg-[#436cb0]" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Side - Progress Circle */}
              <div className="flex flex-col items-center justify-center space-y-8">
                {/* Circular Progress */}
                <div className="relative w-64 h-64">
                  <svg className="w-64 h-64 transform -rotate-90">
                    <circle
                      cx="128"
                      cy="128"
                      r="112"
                      stroke="currentColor"
                      strokeWidth="16"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="128"
                      cy="128"
                      r="112"
                      stroke="currentColor"
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 112}`}
                      strokeDashoffset={`${2 * Math.PI * 112 * (1 - progress / 100)}`}
                      className="text-[#436cb0] transition-all duration-300 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-[#436cb0]">
                        {progress}
                      </div>
                      <div className="text-gray-500 text-sm mt-1">%</div>
                    </div>
                  </div>
                </div>

                {/* Illustration placeholder */}
                <div className="hidden md:block">
                  <div className="bg-gradient-to-br from-[#436cb0]/15 to-[#436cb0]/5 rounded-2xl p-6 w-48">
                    <FileText className="w-16 h-16 text-[#436cb0] mx-auto" />
                    <div className="text-xs text-center text-gray-600 mt-2">
                      資産レポート作成中
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Status */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-gray-900">
                    診断を実行中です
                  </h2>
                  <p className="text-gray-600">
                    このまましばらくお待ちください。
                    <br />
                    あなたに最適な資産形成プランを算出しています。
                  </p>
                </div>

                {/* Task List */}
                <div className="space-y-4 py-6">
                  {tasks.map((task, index) => {
                    const Icon = task.icon;
                    const isCompleted = currentTask > index;
                    const isActive = currentTask === index + 1;

                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 transition-all duration-300 ${
                          isCompleted || isActive
                            ? "opacity-100"
                            : "opacity-40"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                            isCompleted
                              ? "bg-[#436cb0] text-white"
                              : isActive
                              ? "bg-[#436cb0]/15 text-[#436cb0]"
                              : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>
                        <span
                          className={`text-sm ${
                            isCompleted || isActive
                              ? "text-gray-900 font-medium"
                              : "text-gray-500"
                          }`}
                        >
                          {task.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Message */}
            <div className="mt-12 pt-6 border-t">
              <p className="text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                すべてのデータは暗号化され、安全に保護されています
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={null}>
      <ProcessingContent />
    </Suspense>
  );
}
