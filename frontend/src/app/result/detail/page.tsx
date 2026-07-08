"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiUrl } from "@/lib/api";
import {
  type ResultError,
  mapResultError,
  NETWORK_ERROR,
  MISSING_TOKEN_ERROR,
} from "@/lib/resultError";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Droplets,
  Shield,
  BarChart3,
  TrendingUp,
  ListChecks,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Calendar,
  Download,
  Clock,
} from "lucide-react";
import Link from "next/link";
import ColorButton from "@/components/ColorButton";

type DiagnosisResult = {
  score: number;
  grade?: string;
  grade_message?: string;
  diagnosis: {
    age: number;
    children_count: number;
    monthly_income: number;
    monthly_fixed_cost: number;
    savings: number;
    monthly_insurance: number;
  };
  email: string;
  recommendations: { title: string; description: string }[];
};

const yen = (v: number) => `${Math.round(v).toLocaleString()}円`;
const man = (v: number) => `${Math.round(v / 10000).toLocaleString()}万円`;

/* 各セクション見出しの丸番号 */
function NumBadge({ n }: { n: number }) {
  return (
    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#436cb0] text-white flex items-center justify-center text-sm font-bold">
      {n}
    </span>
  );
}

/* ラベル＋値の小箱 */
function Stat({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: string;
  tone?: "good" | "warn" | "muted";
}) {
  const color =
    tone === "warn"
      ? "text-red-600"
      : tone === "good"
        ? "text-green-600"
        : "text-gray-900";
  return (
    <div className="bg-gray-50 rounded-lg px-4 py-3">
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function DetailReportContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ResultError | null>(null);

  // PDF 出力対象（タイトル＋各セクション）
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  /**
   * レポート本体（reportRef）を画像化して1枚のPDFとして保存する。
   * Tailwind v4 の oklch カラーに対応するため html2canvas-pro を使用。
   * 内容の縦横比に合わせたページサイズで出力する（最終レポートと同方式）。
   */
  const handleDownloadPdf = async () => {
    const el = reportRef.current;
    if (!el || downloading) return;

    setDownloading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      // PDF用ロゴ（通常は非表示）を確実に描画するため、画像の読み込みと
      // レイアウト反映（downloading による表示切替）を待ってからキャプチャする
      await new Promise<void>((resolve) => {
        const logo = new Image();
        logo.onload = () => resolve();
        logo.onerror = () => resolve();
        logo.src = "/images/nohoke_logo.png";
      });
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );

      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const pageWmm = 210;
      const pageHmm = pageWmm * (canvas.height / canvas.width);

      const pdf = new jsPDF({
        orientation: pageHmm >= pageWmm ? "portrait" : "landscape",
        unit: "mm",
        format: [pageWmm, pageHmm],
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(imgData, "JPEG", 0, 0, pageWmm, pageHmm);
      pdf.save("お金の健康診断.pdf");
    } catch (e) {
      console.error("PDF 生成に失敗しました", e);
      alert("PDF の生成に失敗しました。お手数ですが再度お試しください。");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await fetch(apiUrl(`/api/result/${token}`));
        const data = await response.json();
        if (data.success) {
          setResult(data.data);
        } else {
          // HTTP ステータス（404/410/400…）で失効・無効を区別して日本語表示
          setError(mapResultError(response.status, data.message));
        }
      } catch {
        setError(NETWORK_ERROR);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchResult();
    } else {
      setError(MISSING_TOKEN_ERROR);
      setIsLoading(false);
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-blue-50/30 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">詳細診断を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    const err = error ?? {
      kind: "unknown" as const,
      title: "エラー",
      message: "診断結果が見つかりませんでした",
    };
    // 失効（410）は赤エラーではなく、期限切れ専用の落ち着いたトーンで表示
    const isExpired = err.kind === "expired";
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-blue-50/30 to-white p-4">
        <Card className="p-8 max-w-md">
          {isExpired ? (
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7 text-amber-600" />
            </div>
          ) : (
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          )}
          <h2 className="text-2xl font-bold text-center mb-2">{err.title}</h2>
          <p className="text-gray-600 text-center mb-6">{err.message}</p>
          <Button asChild className="w-full">
            <Link href="/diagnosis">新しい診断を開始</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const d = result.diagnosis;
  const income = d.monthly_income || 1;
  const fixed = d.monthly_fixed_cost;
  const ins = d.monthly_insurance;
  const cash = d.savings;

  /* ① 流動性余命：現預金 ÷ 生活維持費（固定費＋保険料） */
  const outflow = fixed + ins;
  const lifespanMonths = outflow > 0 ? cash / outflow : 0;
  const lifespanTarget = 12;

  /* ② 保険料分析：推奨は手取りの5%以内 */
  const insTarget = income * 0.05;
  const insDiff = Math.max(0, ins - insTarget);
  const insAnnual = insDiff * 12;

  /* ③ 固定費分析：適正は手取りの30%以内（バックエンドのスコア基準に合わせる） */
  const fixedTarget = income * 0.3;
  const fixedDiff = Math.max(0, fixed - fixedTarget);
  const fixedAnnual = fixedDiff * 12;

  /* ④ 5年後予測：毎月の余剰を積み立てた場合（年利3%想定・最終レポートと同じ簡易式） */
  const disposable = Math.max(0, income - fixed - ins);
  const dispRate = (disposable / income) * 100;
  const years = 5;
  const growth = 1.03;
  const baseSaving = disposable * 0.5;
  const noImprove = cash + baseSaving * 12 * years * growth;
  // 改善で浮いた保険料・固定費を全額積立に上乗せした場合
  const improvedSaving = baseSaving + insDiff + fixedDiff;
  const improved = cash + improvedSaving * 12 * years * growth;
  const gap = improved - noImprove;

  /* ⑤ 今やるべき順番：効果額（年間・円）が大きい順に並べる */
  type Action = { title: string; desc: string; impact: number };
  const actions: Action[] = [];
  if (insDiff > 0) {
    actions.push({
      title: "保険の見直し",
      desc: `保険料を月${yen(insTarget)}以内へ。年間 約${yen(insAnnual)}の改善余地`,
      impact: insAnnual,
    });
  }
  if (fixedDiff > 0) {
    actions.push({
      title: "固定費の削減",
      desc: `固定費を月${yen(fixedTarget)}目安へ。年間 約${yen(fixedAnnual)}の改善余地`,
      impact: fixedAnnual,
    });
  }
  if (lifespanMonths < 6) {
    actions.push({
      title: "生活防衛資金の確保",
      desc: `現預金は生活維持費 約${lifespanMonths.toFixed(1)}ヶ月分。まず6ヶ月分の確保を優先`,
      impact: income * 6,
    });
  }
  if (dispRate < 20) {
    actions.push({
      title: "毎月の積立を習慣化",
      desc: `可処分所得率は${Math.round(dispRate)}%。手取りの20%の積立を目標に`,
      impact: income * 0.2 * 12,
    });
  }
  actions.push({
    title: "NISA等で資産運用を開始",
    desc: "長期・分散投資で複利効果を活かす",
    impact: 0,
  });
  const ranked = [...actions].sort((a, b) => b.impact - a.impact).slice(0, 5);

  return (
    <div className="flex-1 bg-gradient-to-b from-blue-50/30 to-white">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img
              src="/images/nohoke_logo.svg"
              alt="NoHoKe"
              className="h-8 w-auto"
            />
          </Link>
          <div className="flex items-center gap-2">
            <ColorButton />
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={downloading}
            >
              <Download className="w-4 h-4 mr-2" />
              {downloading ? "PDF作成中..." : "PDF保存"}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/result?token=${token}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                レポートに戻る
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div ref={reportRef} className="p-2">
          {/* PDF出力時のみ左上に表示するロゴ（画面ではヘッダーのロゴを使うため非表示） */}
          <div className={downloading ? "block mb-4" : "hidden"}>
            <img
              src="/images/nohoke_logo.png"
              alt="NoHoKe"
              className="h-8 w-auto"
            />
          </div>
          {/* Title */}
        <div className="text-center mb-8">
          <Badge className="mb-3 bg-[#436cb0]/10 text-[#436cb0] hover:bg-[#436cb0]/10">
            詳細診断レポート
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            あなたのお金の<span className="text-[#436cb0]">健康診断</span>
          </h1>
          <p className="text-gray-600">
            数字で見る、いま取るべき具体的なアクション
          </p>
        </div>

        <div className="space-y-6">
          {/* ① 流動性余命 */}
          <Card className="p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <NumBadge n={1} />
              <Droplets className="w-5 h-5 text-[#436cb0]" />
              <h2 className="text-lg font-bold text-gray-900">流動性余命</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="現預金" value={man(cash)} />
              <Stat label="生活維持費（月）" value={yen(outflow)} />
            </div>
            <div className="mt-4 rounded-xl bg-[#436cb0]/5 p-4 text-center">
              <p className="text-sm text-gray-500">現預金だけで暮らせる期間</p>
              <p className="text-3xl font-bold text-[#436cb0] my-1">
                約{lifespanMonths.toFixed(1)}か月
              </p>
              <p className="text-xs text-gray-500">
                推奨：{lifespanTarget}か月以上
              </p>
            </div>
          </Card>

          {/* ② 保険料分析 */}
          <Card className="p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <NumBadge n={2} />
              <Shield className="w-5 h-5 text-[#436cb0]" />
              <h2 className="text-lg font-bold text-gray-900">保険料分析</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Stat
                label="現在（月）"
                value={yen(ins)}
                tone={insDiff > 0 ? "warn" : "good"}
              />
              <Stat label="推奨（月）" value={`${yen(insTarget)}以内`} />
              <Stat
                label="差額（月）"
                value={insDiff > 0 ? yen(insDiff) : "適正内"}
                tone={insDiff > 0 ? "warn" : "good"}
              />
              <Stat
                label="年間改善額"
                value={insAnnual > 0 ? yen(insAnnual) : "—"}
                tone={insAnnual > 0 ? "good" : "muted"}
              />
            </div>
            <p className="text-sm text-gray-600 mt-4">
              {insDiff > 0
                ? `保険料を推奨水準まで見直すと、年間 約${yen(insAnnual)}の改善が見込めます。`
                : "保険料は収入に対して適正な水準です。"}
            </p>
          </Card>

          {/* ③ 固定費分析 */}
          <Card className="p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <NumBadge n={3} />
              <BarChart3 className="w-5 h-5 text-[#436cb0]" />
              <h2 className="text-lg font-bold text-gray-900">固定費分析</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Stat
                label="現在（月）"
                value={yen(fixed)}
                tone={fixedDiff > 0 ? "warn" : "good"}
              />
              <Stat label="適正（月）" value={`${yen(fixedTarget)}以内`} />
              <Stat
                label="改善余地（月）"
                value={fixedDiff > 0 ? yen(fixedDiff) : "適正内"}
                tone={fixedDiff > 0 ? "warn" : "good"}
              />
              <Stat
                label="年間改善額"
                value={fixedAnnual > 0 ? yen(fixedAnnual) : "—"}
                tone={fixedAnnual > 0 ? "good" : "muted"}
              />
            </div>
            <p className="text-sm text-gray-600 mt-4">
              {fixedDiff > 0
                ? `固定費を適正水準まで抑えると、年間 約${yen(fixedAnnual)}の改善が見込めます。`
                : "固定費は収入に対して適正な水準です。"}
            </p>
          </Card>

          {/* ④ 5年後予測 */}
          <Card className="p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <NumBadge n={4} />
              <TrendingUp className="w-5 h-5 text-[#436cb0]" />
              <h2 className="text-lg font-bold text-gray-900">5年後予測</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">改善しない場合</p>
                <p className="text-2xl font-bold text-gray-700">
                  {man(noImprove)}
                </p>
              </div>
              <div className="rounded-xl border-2 border-[#436cb0] bg-[#436cb0]/5 p-4 text-center">
                <p className="text-sm text-[#436cb0] mb-1">改善した場合</p>
                <p className="text-2xl font-bold text-[#436cb0]">
                  {man(improved)}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-green-50 p-4 text-center">
              <p className="text-sm text-gray-600">5年後の差額</p>
              <p className="text-3xl font-bold text-green-600 my-1">
                ＋{man(gap)}
              </p>
              <p className="text-xs text-gray-500">
                毎月の余剰資金を積み立てた場合（年利3%想定）
              </p>
            </div>
          </Card>

          {/* ⑤ 今やるべき順番 */}
          <Card className="p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <NumBadge n={5} />
              <ListChecks className="w-5 h-5 text-[#436cb0]" />
              <h2 className="text-lg font-bold text-gray-900">今やるべき順番</h2>
            </div>
            <div className="space-y-3">
              {ranked.map((a, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4"
                >
                  <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[3rem] h-7 rounded-full bg-[#436cb0] text-white text-sm font-bold px-2">
                    {i + 1}位
                  </span>
                  <div>
                    <h4 className="text-base font-bold text-gray-900">
                      {a.title}
                    </h4>
                    <p className="text-sm text-gray-600">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* CTA */}
          <Card className="p-6 bg-gradient-to-r from-[#436cb0] to-[#34568c] text-white text-center">
            <Calendar className="w-10 h-10 mx-auto mb-3" />
            <p className="font-bold mb-1">この順番で、専門家と一緒に進めませんか？</p>
            <p className="text-blue-100 text-xs mb-4">
              ファイナンシャル・プランナーが最適なプランをご提案します（営業行為は行いません）
            </p>
            <Button
              variant="secondary"
              className="bg-white text-[#436cb0] hover:bg-gray-100 px-8 py-6"
              asChild
            >
              <a
                href="https://timerex.net"
                target="_blank"
                rel="noopener noreferrer"
              >
                相談を予約する
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DetailReportPage() {
  return (
    <Suspense fallback={null}>
      <DetailReportContent />
    </Suspense>
  );
}
