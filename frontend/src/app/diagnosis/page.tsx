"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Info,
  User,
  Users,
  Wallet,
  Home,
  PiggyBank,
  CheckCircle2,
  Check,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ColorButton from "@/components/ColorButton";
import { apiUrl } from "@/lib/api";
import {
  validateNumericField,
  diagnosisInputSchema,
  type NumericField,
} from "@/lib/diagnosisSchema";

type FormData = {
  age: string;
  children_count: number | null;
  monthly_income: string;
  monthly_fixed_cost: string;
  savings: string;
  monthly_insurance: string;
};

const steps = [
  {
    id: 1,
    title: "年齢を入力してください",
    description: "あなたの現在の年齢を教えてください。",
    field: "age" as keyof FormData,
    placeholder: "30",
    unit: "歳",
    type: "number",
  },
  {
    id: 2,
    title: "未成年のお子様の人数を選択してください",
    description:
      "より最適な資産形成のご提案を行うために、扶養している未成年のお子様の人数を教えてください。",
    field: "children_count" as keyof FormData,
    type: "children",
  },
  {
    id: 3,
    title: "手取り月収を入力してください",
    description:
      "税金や社会保険料を引いた後の、毎月の手取り収入を入力してください。",
    field: "monthly_income" as keyof FormData,
    placeholder: "300,000",
    unit: "円",
    type: "number",
    info: "ボーナスは含めず、毎月の手取り額のみを入力してください。",
    example: "例：手取り45万円の場合は→ 450,000円と入力",
  },
  {
    id: 4,
    title: "毎月の固定費を入力してください",
    description:
      "家賃・住宅ローン・保険料、通信費などの毎月の固定費の合計金額を入力してください。",
    field: "monthly_fixed_cost" as keyof FormData,
    placeholder: "150,000",
    unit: "円",
    type: "number",
    info: "ボーナス払いや年払いの費用は含めず、毎月の固定費のみを入力してください",
    example: "例：家賃・住宅ローン、保険料、通信費、サブスクリプションなど",
  },
  {
    id: 5,
    title: "現預金額を入力してください",
    description:
      "銀行口座や現金など、すぐに引き出せる資産の合計金額を入力してください。",
    field: "savings" as keyof FormData,
    placeholder: "1,000,000",
    unit: "円",
    type: "number",
    info: "普通預金、定期預金、電子マネー、現金などが含まれます",
    example: "例：普通預金500万円＋定期預金300万円＋現金30万円など",
  },
  {
    id: 6,
    title: "毎月の保険料を入力してください",
    description:
      "生命保険、医療保険、がん保険、学資保険など、毎月支払っている保険料の合計額を入力してください。",
    field: "monthly_insurance" as keyof FormData,
    placeholder: "10,000",
    unit: "円",
    type: "number",
    info: "ボーナス払いや年払いの保険料は含めず、毎月の保険料のみを入力してください。",
    example:
      "例：生命保険5,000円 + 医療保険3,000円 + がん保険2,000円 = 10,000円",
  },
];

const stepIllustrations = [
  {
    icon: User,
    gradient: "from-blue-100 to-indigo-50",
    iconColor: "text-[#436cb0]",
    label: "あなたのライフステージに\n合わせた診断を行います",
    badge: "年齢に応じた最適プラン",
    imageSrc: "/images/s-002.png",
  },
  {
    icon: Users,
    gradient: "from-emerald-100 to-teal-50",
    iconColor: "text-emerald-600",
    label: "家族構成で\n必要な保障額が変わります",
    badge: "ご家族の未来を守る",
    imageSrc: "/images/s-003.png",
  },
  {
    icon: Wallet,
    gradient: "from-violet-100 to-purple-50",
    iconColor: "text-violet-600",
    label: "収入から最適な\n資産形成プランを算出します",
    badge: "手取り収入で診断精度UP",
    imageSrc: "/images/s-004.png",
  },
  {
    icon: Home,
    gradient: "from-orange-100 to-amber-50",
    iconColor: "text-orange-500",
    label: "固定費を把握することで\n本当の余剰資金が分かります",
    badge: "毎月の余力を可視化",
    imageSrc: "/images/s-005.png",
  },
  {
    icon: PiggyBank,
    gradient: "from-pink-100 to-rose-50",
    iconColor: "text-pink-500",
    label: "現在の貯蓄状況から\n不足額をシミュレーションします",
    badge: "貯蓄の充実度チェック",
    imageSrc: "/images/s-006.png",
  },
  {
    icon: Shield,
    gradient: "from-blue-100 to-sky-50",
    iconColor: "text-[#436cb0]",
    label: "保険料の適正額を\n診断結果でお伝えします",
    badge: "保険の見直しポイント",
    imageSrc: "/images/s-007.png",
  },
];

export default function DiagnosisPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [sessionId, setSessionId] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    age: "",
    children_count: null,
    monthly_income: "",
    monthly_fixed_cost: "",
    savings: "",
    monthly_insurance: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  // Step2 の子ども選択カテゴリ（UI用）。未成年のみ人数入力を表示し、成人独立済・なしは人数0扱い。
  const [childrenType, setChildrenType] = useState<
    "minor" | "adult" | "none" | null
  >(null);

  useEffect(() => {
    // 診断セッションを開始
    const startSession = async () => {
      try {
        const response = await fetch(apiUrl("/api/diagnosis/start"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (data.success) {
          setSessionId(data.session_id);
        }
      } catch (error) {
        console.error("Failed to start session:", error);
      }
    };

    startSession();
  }, []);

  const currentStepData = steps[currentStep - 1];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitError("");

    // 送信前に全項目をまとめて値域チェック（最終ガード）
    const payload = {
      age: parseInt(formData.age, 10),
      children_count: formData.children_count,
      monthly_income: parseFloat(formData.monthly_income.replace(/,/g, "")),
      monthly_fixed_cost: parseFloat(
        formData.monthly_fixed_cost.replace(/,/g, ""),
      ),
      savings: parseFloat(formData.savings.replace(/,/g, "")),
      monthly_insurance: parseFloat(
        formData.monthly_insurance.replace(/,/g, ""),
      ),
    };

    const validation = diagnosisInputSchema.safeParse(payload);
    if (!validation.success) {
      setSubmitError(
        validation.error.issues[0]?.message ?? "入力内容をご確認ください",
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(apiUrl("/api/diagnosis/submit"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          ...payload,
        }),
      });

      const data = await response.json();
      if (data.success) {
        sessionStorage.setItem(
          "diagnosis_result",
          JSON.stringify({
            score: data.score,
            grade: data.grade,
            grade_message: data.grade_message,
            breakdown: data.breakdown,
          }),
        );
        router.push(`/diagnosis/processing?session_id=${sessionId}`);
      } else {
        setSubmitError(
          data.message ||
            "送信に失敗しました。ページを再読み込みして再度お試しください。",
        );
      }
    } catch (error) {
      console.error("Failed to submit diagnosis:", error);
      setSubmitError(
        "通信エラーが発生しました。バックエンドが起動しているか確認してください。",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 現在ステップの数値入力の値域エラー（空欄時は null）
  const currentFieldError =
    currentStepData.type === "number"
      ? validateNumericField(
          currentStepData.field as NumericField,
          (formData[currentStepData.field] as string) ?? "",
        )
      : null;

  const isStepValid = () => {
    if (currentStepData.type === "children") {
      // 未成年ありは人数（1人以上）の入力が必須。成人独立済・なしは即座に有効。
      if (childrenType === "minor") {
        return formData.children_count !== null && formData.children_count >= 1;
      }
      return childrenType === "adult" || childrenType === "none";
    }
    const field = currentStepData.field;
    const value = formData[field] as string;
    if (value === "") return false;
    return validateNumericField(field as NumericField, value) === null;
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-slate-50 to-[#436cb0]/10">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
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
        資産形成診断
      </div>
      <div className="pt-16 mt-9">
        <div className="container mx-auto px-4 md:px-6 py-5">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-end">
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="flex items-end flex-1 last:flex-none"
                >
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[11px] sm:text-sm transition-colors duration-300 ${
                        step.id <= currentStep
                          ? "text-[#436cb0] font-semibold"
                          : "text-gray-400"
                      }`}
                    >
                      Step {step.id}
                    </span>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                        step.id < currentStep
                          ? "bg-[#436cb0]"
                          : step.id === currentStep
                            ? "bg-[#436cb0]"
                            : "bg-gray-200"
                      }`}
                    >
                      {step.id < currentStep && (
                        <Check
                          className="w-3.5 h-3.5 text-white"
                          strokeWidth={3}
                        />
                      )}
                    </div>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mb-3 mx-1 transition-colors duration-300 ${
                        step.id < currentStep ? "bg-[#436cb0]" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:px-6 md:py-16">
        <div className="max-w-6xl mx-auto bg-white-gr p-5 sm:p-6 md:p-8 rounded-xl border border-gray-100 shadow-[0_8px_80px_rgba(67,108,176,0.15),0_2px_20px_rgba(0,0,0,0.05)]">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center md:min-h-[440px]">
            {/* Left Side - Form */}
            <div className="space-y-6 md:space-y-8 md:ml-2">
              <div className="space-y-3">
                <p className="text-sm font-medium text-[#436cb0]">
                  Step {currentStep}/6
                </p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight whitespace-normal md:whitespace-nowrap mb-6">
                  {currentStepData.title}
                </h2>
                <p className="text-gray-500 text-base md:text-xl leading-relaxed">
                  {currentStepData.description}
                </p>
              </div>

              {/* Number Input */}
              {currentStepData.type === "number" && (
                <div className="space-y-3">
                  <div className="relative bg-white rounded-2xl border-2 border-blue shadow-sm text-right">
                    <input
                      type="text"
                      value={formData[currentStepData.field] as string}
                      onChange={(e) => {
                        let value = e.target.value.replace(/[^0-9]/g, "");
                        // 先頭の余分な0を除去（"0"単体は許可し、"0"の後に数字が続く場合のみ除去）
                        // 例: "0"→"0", "05"→"5", "007"→"7"
                        value = value.replace(/^0+(?=\d)/, "");
                        // 項目ごとの最大桁数に制限
                        const maxDigits: Partial<Record<keyof FormData, number>> =
                          {
                            age: 2,
                            monthly_income: 8,
                            monthly_fixed_cost: 6,
                            monthly_insurance: 5,
                          };
                        const limit = maxDigits[currentStepData.field];
                        if (limit !== undefined) {
                          value = value.slice(0, limit);
                        }
                        const formatted = value.replace(
                          /\B(?=(\d{3})+(?!\d))/g,
                          ",",
                        );
                        setFormData({
                          ...formData,
                          [currentStepData.field]: formatted,
                        });
                      }}
                      placeholder={currentStepData.placeholder}
                      className="w-full text-[44px] md:text-[72px] leading-none font-bold text-blue px-5 md:px-8 py-5 md:py-7 pr-16 md:pr-20 outline-none placeholder:text-gray-200 bg-transparent"
                    />
                    <span className="absolute right-4 md:right-5 top-1/2 -translate-y-1/2 text-lg md:text-xl font-medium text-gray-600 pt-4 md:pt-8">
                      {currentStepData.unit}
                    </span>
                  </div>
                  {currentFieldError && (
                    <p className="text-sm text-red-600 px-2">
                      {currentFieldError}
                    </p>
                  )}
                  {currentStepData.info && (
                    <div className="flex gap-2 text-xs text-[#436cb0] bg-[#436cb0]/10 px-4 py-3 rounded-xl">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5 mb-0" />
                      <div>
                        {currentStepData.info}
                        {currentStepData.example && (
                          <div className="mt-1 text-gray-500 ">
                            {currentStepData.example}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Children Input（未成年あり=人数入力 / 成人独立済 / なし） */}
              {currentStepData.type === "children" &&
                (() => {
                  const cards = [
                    {
                      key: "minor" as const,
                      icon: Users,
                      title: "子供あり",
                      sub: "未成年",
                    },
                    {
                      key: "adult" as const,
                      icon: Users,
                      title: "子供あり",
                      sub: "成人(独立済)",
                    },
                    {
                      key: "none" as const,
                      icon: User,
                      title: "子供なし",
                      sub: "お子様はいない",
                    },
                  ];
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        {cards.map((card) => {
                          const selected = childrenType === card.key;
                          const Icon = card.icon;
                          return (
                            <button
                              key={card.key}
                              className={`relative flex flex-col items-center justify-center gap-2 sm:gap-3 py-5 sm:py-7 px-1 rounded-2xl border-2 transition-all ${
                                selected
                                  ? "bg-[#436cb0]/10 border-[#436cb0]"
                                  : "bg-white border-gray-200 hover:border-[#436cb0]/50"
                              }`}
                              onClick={() => {
                                setChildrenType(card.key);
                                setFormData({
                                  ...formData,
                                  // 未成年は人数入力待ち（null）、それ以外は0人扱い
                                  children_count: card.key === "minor" ? null : 0,
                                });
                              }}
                            >
                              {selected && (
                                <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-[#436cb0]" />
                              )}
                              <div
                                className={`p-3 rounded-full ${selected ? "bg-[#436cb0]/15" : "bg-gray-100"}`}
                              >
                                <Icon
                                  className={`w-7 h-7 ${selected ? "text-[#436cb0]" : "text-gray-400"}`}
                                />
                              </div>
                              <div className="text-center">
                                <p
                                  className={`text-base font-bold ${selected ? "text-[#365a96]" : "text-gray-800"}`}
                                >
                                  {card.title}
                                </p>
                                <p
                                  className={`text-xs mt-0.5 ${selected ? "text-[#436cb0]" : "text-gray-400"}`}
                                >
                                  {card.sub}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* 未成年ありを選択した場合のみ人数入力を表示 */}
                      {childrenType === "minor" && (
                        <div className="relative bg-white rounded-xl border-2 border-[#436cb0] shadow-sm text-right w-[calc((100%-2rem)/3)] min-w-[160px]">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={
                              formData.children_count === null
                                ? ""
                                : String(formData.children_count)
                            }
                            onChange={(e) => {
                              let v = e.target.value.replace(/[^0-9]/g, "");
                              v = v.replace(/^0+(?=\d)/, "");
                              v = v.slice(0, 2);
                              setFormData({
                                ...formData,
                                children_count: v === "" ? null : parseInt(v, 10),
                              });
                            }}
                            placeholder="1"
                            className="w-full text-[40px] leading-none font-bold text-blue px-6 py-4 pr-14 outline-none placeholder:text-gray-200 bg-transparent"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-medium text-[#436cb0]">
                            人
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
            </div>

            {/* Right Side - Illustration */}
            {(() => {
              const illust = stepIllustrations[currentStep - 1];
              const Icon = illust.icon;
              return (
                <div className="hidden md:flex items-center justify-center">
                  {illust.imageSrc ? (
                    <div className="relative w-full h-[400px]">
                      <Image
                        src={illust.imageSrc}
                        alt={`Step ${currentStep} illustration`}
                        fill
                        className="object-contain transition-all duration-500"
                      />
                    </div>
                  ) : (
                    <div
                      className={`w-64 h-64 bg-gradient-to-br ${illust.gradient} rounded-full flex items-center justify-center transition-all duration-500`}
                    >
                      <Icon className={`w-32 h-32 ${illust.iconColor}`} />
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Navigation */}
          <div className="flex flex-col items-center gap-3 mt-8 pt-8 border-t border-gray-100">
            {submitError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 w-full text-center">
                {submitError}
              </p>
            )}
            <div className="flex items-center gap-3 md:gap-4 justify-center w-full">
              <Button
                variant="outline"
                size="lg"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex-1 md:flex-none rounded-xl px-6 md:px-12 py-6 md:py-8 border-gray-200 text-gray-600 shadow-[0_8px_80px_rgba(67,108,176,0.15),0_2px_20px_rgba(0,0,0,0.05)]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                戻る
              </Button>
              <Button
                size="lg"
                onClick={handleNext}
                disabled={!isStepValid() || isLoading}
                className="flex-1 md:flex-none rounded-xl px-6 md:px-12 py-6 md:py-8 bg-blue hover:bg-[#365a96] text-white shadow-[0_8px_80px_rgba(67,108,176,0.15),0_2px_20px_rgba(0,0,0,0.05)]"
              >
                {isLoading
                  ? "送信中..."
                  : currentStep === steps.length
                    ? "診断結果を確認する"
                    : "次へ"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
