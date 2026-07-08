"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp, Check, Mail, ChevronRight } from "lucide-react";
import Link from "next/link";
import ColorButton from "@/components/ColorButton";
import styles from "./page.module.css";

type BreakdownItem = {
  name: string;
  description: string;
  max_deduction: number;
  deduction: number;
  label: string;
  value: number;
};

type DiagnosisResult = {
  score: number;
  grade: string;
  grade_message: string;
  breakdown: BreakdownItem[];
};

function ResultPreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [score, setScore] = useState(0);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  useEffect(() => {
    if (!sessionId) {
      router.push("/diagnosis");
      return;
    }

    const stored = sessionStorage.getItem("diagnosis_result");
    const diagnosisResult: DiagnosisResult | null = stored
      ? JSON.parse(stored)
      : null;
    setResult(diagnosisResult);

    const targetScore = diagnosisResult?.score ?? 0;
    let currentScore = 0;
    const interval = setInterval(() => {
      currentScore += 1;
      setScore(currentScore);
      if (currentScore >= targetScore) {
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [sessionId, router]);

  // 年齢・子どもは本人が変えられない「前提条件」。努力項目とは分けて中立表示する。
  const PREMISE_ITEMS = ["年齢", "子ども"];

  // 努力で改善できる家計4項目（達成度バー＋良好/要改善ラベル）
  const financialBars =
    result?.breakdown
      .filter((item) => !PREMISE_ITEMS.includes(item.name))
      .map((item) => ({
        label: item.name,
        value: Math.round(
          ((item.max_deduction - item.deduction) / item.max_deduction) * 100,
        ),
      })) ?? [];

  // 前提条件（年齢・子ども）。点数ではなく実際の値を中立表示する。
  const premiseItems =
    result?.breakdown
      .filter((item) => PREMISE_ITEMS.includes(item.name))
      .map((item) => ({ label: item.name, value: item.label })) ?? [];

  // 達成度（0〜100）を「良好 / 標準 / 要改善」の3段階に。バーの色分けと一致させる。
  const ratingLabel = (value: number) => {
    if (value >= 70)
      return { text: "良好", textColor: "text-green-700", bg: "bg-green-100" };
    if (value >= 40)
      return { text: "標準", textColor: "text-[#365a96]", bg: "bg-[#436cb0]/15" };
    return { text: "要改善", textColor: "text-red-700", bg: "bg-red-100" };
  };

  // 改善提案も前提条件（年齢・子ども）は除外する（本人が変えられないため）。
  const improvements =
    result?.breakdown
      .filter((item) => item.deduction > 0 && !PREMISE_ITEMS.includes(item.name))
      .map((item) => ({
        icon: TrendingUp,
        title: item.name + "の改善が必要です",
        description: item.description + "　現在：" + item.label,
      })) ?? [];

  const gradeMap: Record<
    string,
    {
      label: string;
      percentile: string;
      color: string;
      bg: string;
      textColor: string;
    }
  > = {
    A: {
      label: "A ランク",
      percentile: "上位 20% に入っています",
      color: "#22c55e",
      bg: "bg-green-100",
      textColor: "text-green-700",
    },
    B: {
      label: "B ランク",
      percentile: "上位 40% に入っています",
      color: "#14b8a6",
      bg: "bg-teal-100",
      textColor: "text-teal-700",
    },
    C: {
      label: "C ランク",
      percentile: "上位 65% に入っています",
      color: "#436cb0",
      bg: "bg-[#436cb0]/15",
      textColor: "text-[#365a96]",
    },
    D: {
      label: "D ランク",
      percentile: "上位 85% に入っています",
      color: "#f97316",
      bg: "bg-orange-100",
      textColor: "text-orange-700",
    },
    E: {
      label: "E ランク",
      percentile: "見直しをおすすめします",
      color: "#ef4444",
      bg: "bg-red-100",
      textColor: "text-red-700",
    },
  };
  const gradeInfo = gradeMap[result?.grade ?? ""] ?? gradeMap["C"];

  const gradeScale = [
    {
      g: "A",
      range: "80〜100",
      label: "非常に良好",
      desc: "家計の流動性が高く、現状維持で問題ありません",
      bgClass: "bg-green-500",
      color: "#22c55e",
    },
    {
      g: "B",
      range: "65〜79",
      label: "良好",
      desc: "大きな問題はありませんが、一部見直すとさらに改善できます",
      bgClass: "bg-teal-500",
      color: "#14b8a6",
    },
    {
      g: "C",
      range: "50〜64",
      label: "標準",
      desc: "一般的な状態。改善できるポイントがいくつかあります",
      bgClass: "bg-[#436cb0]",
      color: "#436cb0",
    },
    {
      g: "D",
      range: "35〜49",
      label: "要改善",
      desc: "固定費や保険料などに見直しの優先度が高い項目があります",
      bgClass: "bg-orange-500",
      color: "#f97316",
    },
    {
      g: "E",
      range: "〜34",
      label: "要見直し",
      desc: "家計への負担が大きく、早めに全体の確認が必要な状態です",
      bgClass: "bg-red-500",
      color: "#ef4444",
    },
  ];

  // ゲージバーのスコア位置を計算（0〜100 → 0%〜100%）
  const gaugePosition = Math.min(Math.max(score, 0), 100);

  return (
    <div className="flex-1 bg-gradient-to-b from-[#436cb0]/10 to-white">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="relative flex items-center justify-between">
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

      {/* Progress Steps */}
      <div className="absolute left-1/2 -translate-x-1/2 text-xl text-gray-500 mt-12">
        診断結果
      </div>
      <div className=" border-b pt-16 mt-9">
        <div className="container mx-auto px-6 py-5">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-end">
              {[1, 2, 3, 4, 5, 6].map((step, idx) => (
                <div
                  key={step}
                  className="flex items-end flex-1 last:flex-none"
                >
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-[#436cb0]">
                      Step {step}
                    </span>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#436cb0]">
                      <Check
                        className="w-3.5 h-3.5 text-white"
                        strokeWidth={3}
                      />
                    </div>
                  </div>
                  {idx < 5 && (
                    <div className="flex-1 h-0.5 mb-3 mx-1 bg-[#436cb0]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              途中結果が出ました！
            </h1>
            <p className="text-gray-600">
              現時点でのあなたの資産形成状況を診断しました。
              <br />
              詳細なアドバイスをご覧になるには、メールアドレスをご登録ください。
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Score Card */}
              <Card className="p-8 border border-gray-100 shadow-[0_8px_80px_rgba(67,108,176,0.15),0_2px_20px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col md:flex-row items-start gap-8">
                  {/* Circular Score */}
                  <div className="flex flex-col items-center gap-4 flex-shrink-0 item-center">
                    <div className="relative w-44 h-44">
                      <svg className="w-44 h-44 transform -rotate-90">
                        <circle
                          cx="88"
                          cy="88"
                          r="78"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          className="text-gray-200"
                        />
                        <circle
                          cx="88"
                          cy="88"
                          r="78"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 78}`}
                          strokeDashoffset={`${2 * Math.PI * 78 * (1 - score / 100)}`}
                          style={{ color: gradeInfo.color }}
                          className="transition-all duration-500 ease-out"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div
                            className="text-4xl font-bold"
                            style={{ color: gradeInfo.color }}
                          >
                            {score}
                          </div>
                          <div className="text-gray-400 text-xs">
                            点 / 100点
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Score Description */}
                  <div className="flex-1 space-y-3">
                    <p className="text-sm text-gray-500 font-medium">
                      総合スコア
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                      <span
                        className={`inline-block px-8 md:px-12 py-2 rounded-full text-lg md:text-xl font-bold ${gradeInfo.bg} ${gradeInfo.textColor}`}
                      >
                        {gradeInfo.label}
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-7xl md:text-8xl font-bold text-gray-900 leading-[0.8]">
                          {score}
                        </span>
                        <span className="text-gray-500">点</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-500">
                      {gradeInfo.percentile}
                    </p>
                    <p className="text-sm text-gray-600 animate-bounce">
                      {result?.grade_message ?? "診断結果を読み込み中..."}
                    </p>
                  </div>
                </div>
              </Card>

              {/* 総合評価の目安 - グラフ版 */}
              <Card className="p-6 border border-gray-100 shadow-[0_8px_80px_rgba(67,108,176,0.15),0_2px_20px_rgba(0,0,0,0.05)]">
                <h3 className="text-base font-bold text-gray-900 mb-6">
                  総合評価の目安
                </h3>
                <div className="space-y-5">
                  {/* ゲージバー */}
                  <div className="relative">
                    <div className="flex h-11 rounded-xl overflow-hidden shadow-sm">
                      <div
                        style={{ width: "40%" }}
                        className="bg-orange-400 flex items-center justify-center"
                      >
                        <span className="text-white text-sm font-bold">C</span>
                      </div>
                      <div
                        style={{ width: "20%" }}
                        className="bg-[#436cb0] flex items-center justify-center"
                      >
                        <span className="text-white text-sm font-bold">B</span>
                      </div>
                      <div
                        style={{ width: "20%" }}
                        className="bg-teal-500 flex items-center justify-center"
                      >
                        <span className="text-white text-sm font-bold">A</span>
                      </div>
                      <div
                        style={{ width: "20%" }}
                        className="bg-green-500 flex items-center justify-center"
                      >
                        <span className="text-white text-sm font-bold">S</span>
                      </div>
                    </div>
                    {/* スコアマーカー */}
                    <div
                      className="absolute top-0 h-11 w-1 bg-white/90 rounded-full shadow-md transition-all duration-700"
                      style={{ left: `calc(${gaugePosition}% - 2px)` }}
                    />
                    {/* スコアラベル */}
                    <div
                      className="absolute -bottom-7 transform -translate-x-1/2 transition-all duration-700 flex flex-col items-center"
                      style={{ left: `${gaugePosition}%` }}
                    >
                      <div
                        className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent"
                        style={{ borderBottomColor: gradeInfo.color }}
                      />
                      <span
                        className="text-xs font-bold leading-none"
                        style={{ color: gradeInfo.color }}
                      >
                        {score}
                      </span>
                    </div>
                  </div>

                  {/* 目盛りラベル */}
                  <div className="relative h-5 mt-6">
                    {[0, 35, 50, 65, 80, 100].map((v) => (
                      <span
                        key={v}
                        className="absolute text-xs text-gray-400 transform -translate-x-1/2"
                        style={{ left: `${v}%` }}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>

              {/* 評価項目 */}
              <Card className="p-8 border border-gray-100 shadow-[0_8px_80px_rgba(67,108,176,0.15),0_2px_20px_rgba(0,0,0,0.05)]">
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  評価項目の内訳
                </h3>
                <div className="space-y-4">
                  {financialBars.map((item, index) => (
                    <div key={index} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 font-medium">
                          {item.label}
                        </span>
                        <span className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${ratingLabel(item.value).bg} ${ratingLabel(item.value).textColor}`}
                          >
                            {ratingLabel(item.value).text}
                          </span>
                          <span className="font-bold text-gray-900">
                            {item.value}点
                          </span>
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden h-4">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${item.value}%`,
                            backgroundColor:
                              item.value >= 70
                                ? "#22c55e"
                                : item.value >= 40
                                  ? "#436cb0"
                                  : "#ef4444",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* 前提条件（年齢・子ども）＝本人が変えられないため中立表示 */}
                {premiseItems.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 mb-3">
                      前提条件（診断で考慮したあなたの状況）
                    </p>
                    <div className="space-y-3">
                      {premiseItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-gray-500">{item.label}</span>
                          <span className="font-medium text-gray-600">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Improvements Card */}
              <Card className="p-8 border border-gray-100 shadow-[0_8px_80px_rgba(67,108,176,0.15),0_2px_20px_rgba(0,0,0,0.05)]">
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  改善ポイント TOP3
                </h3>
                <div className="space-y-4">
                  {improvements.slice(0, 3).map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={index}
                        className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#436cb0] text-white flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {item.title}
                          </h4>
                          <p className="text-sm text-gray-400 blur-sm select-none">
                            {item.description}
                          </p>
                        </div>
                        <Icon className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Right Section - Email Form + Grade Scale (sticky)　右側サイド */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                <Card className="p-6 border border-gray-100 shadow-[0_8px_80px_rgba(67,108,176,0.15),0_2px_20px_rgba(0,0,0,0.05)]">
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="bg-[#436cb0]/15 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Mail className="w-8 h-8 text-[#436cb0]" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        診断レポートをメールで受け取る
                      </h3>
                      <p className="text-sm text-gray-600">
                        診断結果をメールでお届けします
                      </p>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#436cb0]" />
                        <span>レポートをお手元で閲覧</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#436cb0]" />
                        <span>改善ポイントの解説</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#436cb0]" />
                        <span>いつでも</span>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="w-full bg-[#436cb0] hover:bg-[#274576] py-6"
                      onClick={() =>
                        router.push(
                          `/result/email-register?session_id=${sessionId}`,
                        )
                      }
                    >
                      無料で診断結果を受け取る
                    </Button>
                  </div>
                </Card>

                {/* 500円プラン（フル結果を即時解放） */}
                {sessionId && (
                  <Card className="p-6 border-2 border-[#436cb0] shadow-[0_8px_80px_rgba(67,108,176,0.15),0_2px_20px_rgba(0,0,0,0.05)]">
                    <div className="space-y-5">
                      <div className="text-center">
                        <div className="inline-block bg-[#436cb0] text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                          おすすめ
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          500円プラン
                        </h3>
                        <p className="text-sm text-gray-600">
                          フル診断結果をすぐに解放。
                          <br />
                          結果ページのURLをメールでお届けします。
                        </p>
                        <div className="mt-3">
                          <span className="text-4xl font-bold text-[#436cb0]">
                            ¥500
                          </span>
                          <span className="text-sm text-gray-500">
                            （税込・買い切り）
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#436cb0]" />
                          <span>フル診断結果の解放</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#436cb0]" />
                          <span>結果ページURLをメール送付</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#436cb0]" />
                          <span>専門家への相談予約</span>
                        </div>
                      </div>

                      <Button
                        size="lg"
                        className="w-full bg-[#436cb0] hover:bg-[#274576] py-6"
                        onClick={() =>
                          router.push(
                            `/result/payment/?session_id=${sessionId}`,
                          )
                        }
                      >
                        <span className="text-xl mr-[-.2rem]">500円</span>で
                        <span className="text-[17px] mr-[-.2rem]">
                          今すぐ見る
                        </span>
                      </Button>
                    </div>
                  </Card>
                )}

                {/* 総合評価の目安（右カラム） */}
                <Card className="p-5 border border-gray-100 shadow-[0_8px_80px_rgba(67,108,176,0.15),0_2px_20px_rgba(0,0,0,0.05)]">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">
                    総合評価の目安
                  </h3>
                  <div className="space-y-2">
                    {gradeScale.map(({ g, range, label, desc, bgClass }) => {
                      const isActive = result?.grade === g;
                      return (
                        <div
                          key={g}
                          className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors ${isActive ? "bg-gray-50 ring-1 ring-gray-200" : ""}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full ${bgClass} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 transition-opacity ${isActive ? "opacity-100" : "opacity-25"}`}
                          >
                            {g}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-sm font-bold ${isActive ? "text-gray-900" : "text-gray-400"}`}
                              >
                                {range}
                              </span>
                              <span
                                className={`text-xs font-medium ${isActive ? "text-gray-600" : "text-gray-300"}`}
                              >
                                {label}
                              </span>
                            </div>
                            <p
                              className={`text-xs mt-0.5 leading-relaxed ${isActive ? "text-gray-500" : "text-gray-300"}`}
                            >
                              {desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <Card
            className={`mt-8 p-8 border bg-[#ebeff9] border-gray-100 shadow-[0_8px_80px_rgba(67,108,176,0.15),0_2px_20px_rgba(0,0,0,0.05)] ${styles.bgImage}`}
          >
            {/*  <div className="flex flex-col items-start  gap-6 w-1/2">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">
                  あなたの未来のために、詳細を確認しましょう
                </h3>
                <p className=" text-sm">
                  メールアドレスをご登録いただくと、より詳しい診断結果と
                  <br />
                  具体的な改善プランをご覧いただけます。
                </p>
              </div>
              <Button
                size="lg"
                variant="secondary"
                className="bg-[#436cb0] text-white hover:bg-[#274576] whitespace-nowrap py-6"
              >
                詳細レポートを受け取る（無料）
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>*/}
            <div className="flex flex-col items-start gap-6 w-full md:w-1/2">
              <div className="space-y-2">
                <h3 className="text-xl md:text-2xl font-bold">
                  あなたの未来のために、詳細を確認しましょう
                </h3>
                <p className=" text-sm">
                  メールアドレスをご登録いただくと、より詳しい診断結果と
                  具体的な改善プランをご覧いただけます。
                </p>
              </div>
              <Button
                size="lg"
                variant="secondary"
                className="bg-[#436cb0] text-white hover:bg-[#274576] whitespace-nowrap py-6"
              >
                詳細レポートを購入（500円）
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function ResultPreviewPage() {
  return (
    <Suspense fallback={null}>
      <ResultPreviewContent />
    </Suspense>
  );
}
