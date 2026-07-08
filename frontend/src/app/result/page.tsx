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
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  Shield,
  ShieldCheck,
  AlertCircle,
  Check,
  Calendar,
  ArrowRight,
  Download,
  Share2,
  PiggyBank,
  Wallet,
  Target,
  Sparkles,
  User,
  Users,
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

const clamp = (v: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, v));

const yen = (v: number) => `${Math.round(v).toLocaleString()}円`;

/* ------------------------------------------------------------------ */
/* レーダーチャート（六角形）                                          */
/* ------------------------------------------------------------------ */
function RadarChart({ data }: { data: { label: string; value: number }[] }) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const R = 100;
  const n = data.length;

  const pointAt = (i: number, ratio: number) => {
    const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
    return {
      x: cx + R * ratio * Math.cos(angle),
      y: cy + R * ratio * Math.sin(angle),
    };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const polygon = (ratio: number) =>
    Array.from({ length: n }, (_, i) => {
      const p = pointAt(i, ratio);
      return `${p.x},${p.y}`;
    }).join(" ");

  const dataPolygon = data
    .map((d, i) => {
      const p = pointAt(i, clamp(d.value) / 100);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto">
      {gridLevels.map((lvl) => (
        <polygon
          key={lvl}
          points={polygon(lvl)}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={1}
        />
      ))}
      {data.map((_, i) => {
        const p = pointAt(i, 1);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        );
      })}
      <polygon
        points={dataPolygon}
        fill="#436cb02e"
        stroke="#436cb0"
        strokeWidth={2}
      />
      {data.map((d, i) => {
        const p = pointAt(i, clamp(d.value) / 100);
        return <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#436cb0" />;
      })}
      {data.map((d, i) => {
        const p = pointAt(i, 1.22);
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-600"
            fontSize={11}
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* ドーナツチャート（資産構成）                                        */
/* ------------------------------------------------------------------ */
function DonutChart({
  segments,
  total,
  compact = false,
}: {
  segments: { label: string; value: number; color: string }[];
  total: number;
  /** PDF の狭い3カラムに収めるためのコンパクト表示 */
  compact?: boolean;
}) {
  const size = compact ? 120 : 180;
  const stroke = compact ? 18 : 26;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const sum = segments.reduce((a, s) => a + s.value, 0) || 1;

  let offset = 0;

  return (
    <div
      className={
        compact
          ? "flex flex-row items-center gap-4 w-full"
          : "flex flex-row flex-wrap items-center justify-center gap-6 md:gap-12 w-full"
      }
    >
      <div
        className="relative flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          style={{ width: size, height: size }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={stroke}
          />
          {(() => {
            // セグメント境界に出る白い切れ込み（隙間）を防ぐための微小オーバーラップ
            const overlap = c * 0.004;
            const els = segments.map((s, i) => {
              const len = (s.value / sum) * c;
              const el = (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${len + overlap} ${c - len - overlap}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += len;
              return el;
            });
            // 先頭セグメントほど前面に描画し、上部の継ぎ目をきれいに見せる
            return els.reverse();
          })()}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={
              compact ? "text-[9px] text-gray-500" : "text-xs text-gray-500"
            }
          >
            総資産
          </span>
          <span
            className={
              compact
                ? "text-sm font-bold text-gray-900"
                : "text-xl font-bold text-gray-900"
            }
          >
            {(total / 10000).toLocaleString()}
            <span
              className={
                compact ? "text-[10px] font-medium" : "text-sm font-medium"
              }
            >
              万円
            </span>
          </span>
        </div>
      </div>
      <div
        className={
          compact ? "w-full space-y-1" : "flex-1 space-y-2 min-w-[220px]"
        }
      >
        {segments.map((s, i) => (
          <div key={i} className="flex items-center justify-between">
            <div
              className={
                compact
                  ? "flex items-center gap-1.5 text-xs"
                  : "flex items-center gap-2 text-lg"
              }
            >
              <span
                className={
                  compact
                    ? "inline-block w-2 h-2 rounded-sm"
                    : "inline-block w-3 h-3 rounded-sm"
                }
                style={{ backgroundColor: s.color }}
              />
              <span
                className={
                  compact ? "text-gray-600 text-xs" : "text-gray-600 text-md"
                }
              >
                {s.label}
              </span>
            </div>
            <span
              className={
                compact
                  ? "font-semibold text-gray-900 text-xs"
                  : "font-semibold text-gray-900 text-xl"
              }
            >
              {Math.round((s.value / sum) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 資産推移ラインチャート                                              */
/* ------------------------------------------------------------------ */
function LineChart({ points }: { points: { year: number; value: number }[] }) {
  const w = 720;
  const h = 195;
  const padX = 48;
  const padY = 24;
  const max = Math.max(...points.map((p) => p.value)) * 1.1;
  const min = 0;

  const x = (i: number) => padX + (i / (points.length - 1)) * (w - padX * 2);
  const y = (v: number) =>
    h - padY - ((v - min) / (max - min)) * (h - padY * 2);

  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ");
  const area =
    `${x(0)},${h - padY} ` +
    points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ") +
    ` ${x(points.length - 1)},${h - padY}`;

  const gridLines = 4;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#436cb0" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#436cb0" stopOpacity={0} />
        </linearGradient>
      </defs>
      {Array.from({ length: gridLines + 1 }, (_, i) => {
        const gy = padY + (i / gridLines) * (h - padY * 2);
        const val = max - (i / gridLines) * (max - min);
        return (
          <g key={i}>
            <line
              x1={padX}
              y1={gy}
              x2={w - padX}
              y2={gy}
              stroke="#f3f4f6"
              strokeWidth={1}
            />
            <text
              x={padX - 8}
              y={gy}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
              className="fill-gray-400"
            >
              {Math.round(val / 10000)}万
            </text>
          </g>
        );
      })}
      <polygon points={area} fill="url(#areaGrad)" />
      <polyline
        points={line}
        fill="none"
        stroke="#436cb0"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((p, i) => (
        <g key={i}>
          {i % 2 === 0 && (
            <circle
              cx={x(i)}
              cy={y(p.value)}
              r={3}
              fill="#fff"
              stroke="#436cb0"
              strokeWidth={2}
            />
          )}
          <text
            x={x(i)}
            y={h - 6}
            textAnchor="middle"
            fontSize={10}
            className="fill-gray-400"
          >
            {p.year}年後
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* 保険適正度ゲージ（半円）                                            */
/* ------------------------------------------------------------------ */
function Gauge({
  value,
  compact = false,
}: {
  value: number;
  /** PDF の狭いカード向けに数値を小さくする */
  compact?: boolean;
}) {
  const w = 220;
  const h = 130;
  const cx = w / 2;
  const cy = h - 10;
  const r = 90;
  const ratio = clamp(value) / 100;

  const polar = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  // 180度(左) → 0度(右)
  const start = polar(180);
  const end = polar(180 - 180 * ratio);
  const track = polar(0);

  // 数値・ラベルは SVG 内に描画し、ゲージ（viewBox）と一緒に拡大縮小させる。
  // HTML オーバーレイの固定 px だと、狭いカードでゲージだけ小さくなり数値が円弧に被るため。
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        <path
          d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${track.x} ${track.y}`}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={16}
          strokeLinecap="round"
        />
        <path
          d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${
            ratio > 0.5 ? 1 : 0
          } 1 ${end.x} ${end.y}`}
          fill="none"
          stroke="#436cb0"
          strokeWidth={16}
          strokeLinecap="round"
        />
        <text
          x={cx}
          y={cy - 18}
          textAnchor="middle"
          fontSize={compact ? 44 : 48}
          fontWeight="700"
          className="fill-[#436cb0]"
        >
          {value}
        </text>
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fontSize={13}
          className="fill-gray-500"
        >
          適正度
        </text>
      </svg>
    </div>
  );
}

function FullResultContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  // ?pdfpreview=1 を付けると、PDF 出力用レイアウトを画面上で確認できる
  const pdfPreview = searchParams.get("pdfpreview") !== null;

  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ResultError | null>(null);

  // 画面表示用レポート本体（参照は残すが PDF 出力対象ではない）
  const reportRef = useRef<HTMLDivElement>(null);
  // PDF 出力専用レイアウト（A4 縦・画面外に常時描画しておき、これをキャプチャする）
  const pdfRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  /**
   * PDF 出力専用レイアウト（pdfRef）を画像化して PDF をダウンロードする。
   * Tailwind v4 の oklch カラーを使うため html2canvas-pro（oklch 対応）を使用。
   * A4 固定はせず、内容の縦横比に合わせた 1 枚の PDF として出力する
   * （プレビュー表示と同じ見た目で保存する）。
   */
  const handleDownloadPdf = async () => {
    const el = pdfRef.current;
    if (!el || downloading) return;

    setDownloading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      // PDF用ロゴ（通常は非表示）を確実に描画するため、画像の読み込みと
      // レイアウト反映（downloading=true による表示切替）を待ってからキャプチャする
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

      // A4 固定はせず、内容の縦横比に合わせた1枚の PDF を作る
      // （プレビュー表示そのままの見た目で保存する）。
      // 横幅は A4 幅(210mm)基準、高さは内容比率で算出する。
      const pageWmm = 210;
      const pageHmm = pageWmm * (canvas.height / canvas.width);

      const pdf = new jsPDF({
        orientation: pageHmm >= pageWmm ? "portrait" : "landscape",
        unit: "mm",
        format: [pageWmm, pageHmm],
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      // ページ全面に配置（レイアウト側の p-6 が余白として機能する）
      pdf.addImage(imgData, "JPEG", 0, 0, pageWmm, pageHmm);

      pdf.save("資産形成診断レポート.pdf");
    } catch (e) {
      console.error("PDF 生成に失敗しました", e);
      alert("PDF の生成に失敗しました。お手数ですが再度お試しください。");
    } finally {
      setDownloading(false);
    }
  };

  /**
   * 結果ページのURLを共有する。
   * Web Share API 対応端末ではネイティブ共有、非対応ではクリップボードへコピー。
   */
  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: "資産形成診断レポート",
      text: "資産形成診断の結果レポートです。",
      url,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(url);
      alert("レポートのリンクをコピーしました。");
    } catch (e) {
      // ユーザーが共有をキャンセルした場合などは無視
      if (e instanceof Error && e.name === "AbortError") return;
      console.error("共有に失敗しました", e);
      alert("共有に失敗しました。お手数ですが再度お試しください。");
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
      // トークン無しでアクセスされた場合は無限ローディングを避ける
      setError(MISSING_TOKEN_ERROR);
      setIsLoading(false);
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-blue-50/30 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">診断結果を読み込んでいます...</p>
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
  const disposable = income - d.monthly_fixed_cost - d.monthly_insurance;

  /* ---- レーダー（6軸）---- */
  const radarData = [
    { label: "収入力", value: clamp((income / 400000) * 100) },
    {
      label: "支出管理",
      value: clamp(100 - (d.monthly_fixed_cost / income) * 100),
    },
    { label: "貯蓄力", value: clamp((d.savings / (income * 6)) * 100) },
    {
      label: "保険適正",
      value: clamp(
        100 - Math.abs((d.monthly_insurance / income) * 100 - 6) * 8,
      ),
    },
    { label: "投資余力", value: clamp((disposable / income) * 100) },
    {
      label: "防衛資金",
      value: clamp((d.savings / (d.monthly_fixed_cost * 6 || 1)) * 100),
    },
  ];

  /* ---- 資産構成ドーナツ ---- */
  const donutSegments = [
    {
      label: "現預金",
      value: d.savings * 0.55,
      color: "#436cb0",
    },
    {
      label: "投資・運用",
      value: d.savings * 0.25,
      color: "oklch(0.72 0.15 250)",
    },
    {
      label: "保険(積立)",
      value: d.savings * 0.12,
      color: "oklch(0.82 0.1 240)",
    },
    { label: "その他", value: d.savings * 0.08, color: "#cbd5e1" },
  ];

  /* ---- 資産推移（積立シミュレーション）---- */
  const monthlySaving = Math.max(disposable * 0.5, 0);
  const assetPoints = Array.from({ length: 6 }, (_, i) => {
    const year = i * 5;
    return {
      year,
      value: d.savings + monthlySaving * 12 * year * 1.03,
    };
  });

  /* ---- 保険適正度 ---- */
  const insuranceRatio = (d.monthly_insurance / income) * 100;
  const insuranceScore = Math.round(
    clamp(100 - Math.abs(insuranceRatio - 6) * 8),
  );

  /* ---- 保険評価（収入に対する保険料の割合で判定）---- */
  const insuranceEval =
    insuranceRatio >= 5 && insuranceRatio <= 7
      ? {
          status: "保険内容は適切です",
          description: "現在の保険内容は適切な水準です。",
          tone: "good" as const,
        }
      : insuranceRatio > 7
        ? {
            status: "保険料が高めです",
            description: `保険料が収入の${Math.round(
              insuranceRatio,
            )}%を占めています。保障内容の見直しをおすすめします。`,
            tone: "warn" as const,
          }
        : {
            status: "保障が不足の可能性があります",
            description: `保険料は収入の${Math.round(
              insuranceRatio,
            )}%です。必要な保障が確保できているか確認しましょう。`,
            tone: "warn" as const,
          };

  /* ---- 生活防衛資金（現預金が生活費の何ヶ月分かで判定）---- */
  const emergencyMonths = d.savings / (d.monthly_fixed_cost || 1);
  const emergencyEval =
    emergencyMonths >= 6
      ? {
          status: "十分な水準です",
          description: "生活防衛資金は適切に確保されています。",
          tone: "good" as const,
        }
      : emergencyMonths >= 3
        ? {
            status: "もう少しで目標達成です",
            description: `現在は生活費の約${Math.round(
              emergencyMonths,
            )}ヶ月分です。6ヶ月分を目標にしましょう。`,
            tone: "warn" as const,
          }
        : {
            status: "資金が不足しています",
            description: `現在は生活費の約${Math.round(
              emergencyMonths,
            )}ヶ月分です。まずは3〜6ヶ月分を目指しましょう。`,
            tone: "warn" as const,
          };

  /* ---- 評価項目バー ---- */
  const evalBars = radarData.map((r) => ({
    label: r.label,
    value: Math.round(r.value),
  }));

  const improvements = [
    {
      icon: TrendingUp,
      title: "固定費を見直しましょう",
      description: `毎月の固定費が収入の${Math.round(
        (d.monthly_fixed_cost / income) * 100,
      )}%を占めています。理想は50%以下です。`,
      detail:
        "家賃や通信費などの固定費を見直すことで、月々の支出を削減できます。格安SIMへの乗り換えや、サブスクリプションサービスの整理を検討しましょう。",
    },
    {
      icon: Shield,
      title: "緊急時の備えを増やしましょう",
      description: `現在の貯蓄額は生活費の約${Math.max(
        1,
        Math.round(d.savings / (d.monthly_fixed_cost || 1)),
      )}ヶ月分です。6ヶ月分を目標にしましょう。`,
      detail:
        "予期せぬ出費や収入減少に備えて、生活費の6ヶ月分の貯蓄を目指しましょう。毎月の収入から一定額を自動的に貯蓄に回すことをお勧めします。",
    },
    {
      icon: AlertCircle,
      title: "保険の見直しを検討しましょう",
      description: `保険料が収入の${Math.round(
        insuranceRatio,
      )}%を占めています。必要な保障を精査しましょう。`,
      detail:
        "現在の保険内容が本当に必要なものか確認しましょう。重複している保障や不要な特約があれば見直すことで、保険料を適正化できます。",
    },
  ];

  const actionPlan = [
    {
      step: 1,
      title: "家計の見える化",
      period: "今すぐ",
      desc: "固定費・変動費を棚卸しし、収支を把握する",
    },
    {
      step: 2,
      title: "保険の最適化",
      period: "1〜3ヶ月",
      desc: "保障内容を精査し、過不足を調整する",
    },
    {
      step: 3,
      title: "防衛資金の確保",
      period: "3〜12ヶ月",
      desc: "生活費6ヶ月分を目標に積立を継続する",
    },
    {
      step: 4,
      title: "資産運用の開始",
      period: "1年〜",
      desc: "NISA等を活用し、長期・分散投資を始める",
    },
  ];

  /* ---- 目標達成状況 ---- */
  const goals = [
    {
      label: "生活防衛資金",
      current: Math.round(
        clamp((d.savings / ((d.monthly_fixed_cost || 1) * 6)) * 100),
      ),
      target: "生活費6ヶ月分",
    },
    {
      label: "保険の適正化",
      current: insuranceScore,
      target: "収入の5〜7%",
    },
    {
      label: "貯蓄率の確保",
      current: Math.round(clamp((disposable / income) * 100)),
      target: "手取りの20%",
    },
  ];
  const overallGoal = Math.round(
    goals.reduce((a, g) => a + g.current, 0) / goals.length,
  );

  // ランクはバックエンド（DiagnosisScorer）の判定を唯一の基準とする。
  // 万一 grade が無い場合のみ、同じA〜E基準でスコアから算出する。
  const rank =
    result.grade ??
    (result.score >= 80
      ? "A"
      : result.score >= 65
        ? "B"
        : result.score >= 50
          ? "C"
          : result.score >= 35
            ? "D"
            : "E");

  return (
    <div className="flex-1 bg-gradient-to-b from-blue-50/30 to-white">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <img
                src="/images/nohoke_logo.svg"
                alt="NoHoKe"
                className="h-8 w-auto"
              />
            </Link>
            <div className="flex items-center gap-2 print:hidden">
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
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                共有
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content — このページのみ max-width: full */}
      <main className="w-full px-4 md:px-16 py-8">
        <div
          ref={reportRef}
          className="w-full space-y-6 max-w-[1980px] mx-auto"
          style={pdfPreview ? { display: "none" } : undefined}
        >
          {/* Title */}
          <div className="text-center">
            <Badge className="mb-3 bg-green-100 text-green-700 hover:bg-green-100">
              <Check className="w-3 h-3 mr-1" />
              診断完了
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 mt-2">
              あなたのお金の
              <span className="text-blue-600">流動性診断</span>
              レポート
            </h1>
            <p className="text-gray-600">
              診断結果に基づいた詳細な分析とアドバイスをご覧いただけます
            </p>
            <div className="mt-6 print:hidden">
              <Button
                asChild
                size="lg"
                className="bg-[#436cb0] hover:bg-[#274576] px-8 py-6 text-lg animate-poyon"
              >
                <Link href={`/result/detail?token=${token}`}>
                  お金の健康診断を見る
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* ===== 上段：左[スコア+バランス+サマリー] / 右[資産構成] ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 左ボックス */}
            <Card className="lg:col-span-8 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* 総合スコア */}
                <div className="flex flex-col items-center justify-center gap-3 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 text-center">
                    総合スコア
                  </h3>
                  <div className="relative w-50 h-50">
                    <svg className="w-50 h-50 transform -rotate-90">
                      <circle
                        cx="100"
                        cy="100"
                        r="90"
                        stroke="currentColor"
                        strokeWidth="14"
                        fill="none"
                        className="text-gray-200"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="90"
                        stroke="currentColor"
                        strokeWidth="14"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 90}`}
                        strokeDashoffset={`${
                          2 * Math.PI * 90 * (1 - result.score / 100)
                        }`}
                        className="text-[#436cb0]"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-sm text-gray-500">総合スコア</div>
                        <div className="text-6xl font-bold text-[#436cb0]">
                          {result.score}
                        </div>
                        <div className="text-gray-500 text-sm">/ 100点</div>
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-base px-3 py-1 mt-3">
                    {rank} ランク
                  </Badge>
                </div>

                {/* 資産バランス（レーダー） */}
                <div className="min-w-0 border-x border-solid border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 text-center">
                    資産バランス
                  </h3>
                  <div className="max-w-[260px] mx-auto">
                    <RadarChart data={radarData} />
                  </div>
                </div>

                {/* サマリー（縦積み） */}
                <div className="space-y-2.5 w-full mx-auto gap-5 flex flex-col justify-start min-h-[300px]">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 text-center">
                    入力データ
                  </h3>
                  <div className="w-full mx-auto flex flex-wrap items-start gap-5 gap-y-2">
                    {[
                      {
                        icon: Wallet,
                        label: "手取り月収",
                        value: yen(d.monthly_income),
                      },
                      {
                        icon: BarChart3,
                        label: "毎月固定費",
                        value: yen(d.monthly_fixed_cost),
                      },
                      {
                        icon: PiggyBank,
                        label: "現預金額",
                        value: `${(d.savings / 10000).toLocaleString()}万円`,
                      },
                      {
                        icon: Shield,
                        label: "毎月保険料",
                        value: yen(d.monthly_insurance),
                      },
                      {
                        icon: User,
                        label: "年齢",
                        value: `${d.age}歳`,
                      },
                      {
                        icon: Users,
                        label: "子ども（未成年）",
                        value: `${d.children_count}人`,
                      },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-2 w-[calc(1/2*100%-10px)] min-h-12"
                        >
                          <div className="bg-blue-50 rounded-md p-1.5">
                            <Icon className="w-4 h-4 text-[#436cb0]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[14px] text-gray-500">
                              {item.label}
                            </div>
                            <div className="text-xl font-bold text-gray-900 truncate">
                              {item.value}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>

            {/* 右ボックス：資産構成 */}
            <Card className="lg:col-span-4 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">資産構成</h3>
              <DonutChart segments={donutSegments} total={d.savings} />
            </Card>
          </div>

          {/* ===== 中段：資産推移 / 目標達成状況 ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 資産推移 */}
            <Card className="lg:col-span-8 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">資産推移</h3>
                <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                  <Sparkles className="w-3 h-3 mr-1" />
                  毎月{yen(monthlySaving)}積立想定
                </Badge>
              </div>
              <LineChart points={assetPoints} />
              <p className="text-sm text-gray-500 mt-2">
                現在の家計状況から、毎月の余剰資金を積み立てた場合の資産推移（年利3%想定）です。
              </p>
            </Card>

            {/* 目標達成状況 */}
            <Card className="lg:col-span-4 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-5">
                目標達成状況
              </h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative w-[115px] h-[115px] flex-shrink-0">
                  <svg
                    width="115"
                    height="115"
                    viewBox="0 0 96 96"
                    className="w-[115px] h-[115px] transform -rotate-90"
                  >
                    <circle
                      cx="48"
                      cy="48"
                      r="41"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="41"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 41}`}
                      strokeDashoffset={`${
                        2 * Math.PI * 41 * (1 - overallGoal / 100)
                      }`}
                      className="text-[#436cb0]"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[1.6rem] font-bold text-[#436cb0]">
                      {overallGoal}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  資産形成目標の
                  <br />
                  総合達成率です。
                </p>
              </div>
              <div className="space-y-4">
                {goals.map((g, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-900">
                        {g.label}
                      </span>
                      <span className="text-[#436cb0] font-bold">
                        {g.current}%
                      </span>
                    </div>
                    <Progress
                      value={g.current}
                      className="h-3"
                      indicatorClassName="bg-[#436cb0]"
                    />
                    <p className="text-[11px] text-gray-400">
                      目標：{g.target}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ===== 下段：評価項目 / 保険適正度 / 改善ポイント ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 6つの評価項目 */}
            <Card className="lg:col-span-4 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-5">
                6つの評価項目
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-6 gap-y-4">
                {evalBars.map((item, index) => (
                  <div key={index} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-900">
                        {item.label}
                      </span>
                      <span className="text-[#436cb0] font-bold">
                        {item.value}点
                      </span>
                    </div>
                    <Progress
                      value={item.value}
                      className="h-3.5"
                      indicatorClassName="bg-[#436cb0]"
                    />
                  </div>
                ))}
              </div>
            </Card>

            {/* 保険適正度 */}
            <Card className="lg:col-span-2 p-6 flex flex-col items-center">
              <h3 className="text-lg font-bold text-gray-900 mb-4 self-start">
                保険適正度
              </h3>
              <Gauge value={insuranceScore} />
              <p className="text-sm text-gray-600 text-center mt-4">
                保険料は収入の{Math.round(insuranceRatio)}%。
                <br />
                適正範囲は5〜7%です。
              </p>
            </Card>

            {/* 保険評価・生活防衛資金 */}
            <Card className="lg:col-span-3 p-6">
              {/* 保険評価 */}
              <h3 className="text-lg font-bold text-gray-900 mb-3">保険評価</h3>
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div
                    className={`rounded-full p-2 flex-shrink-0 ${
                      insuranceEval.tone === "good"
                        ? "bg-blue-100"
                        : "bg-amber-100"
                    }`}
                  >
                    <ShieldCheck
                      className={`w-6 h-6 ${
                        insuranceEval.tone === "good"
                          ? "text-[#436cb0]"
                          : "text-amber-600"
                      }`}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-base font-bold text-gray-900">
                      {insuranceEval.status}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {insuranceEval.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* 生活防衛資金 */}
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                生活防衛資金
              </h3>
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`rounded-full p-2 flex-shrink-0 ${
                      emergencyEval.tone === "good"
                        ? "bg-blue-100"
                        : "bg-amber-100"
                    }`}
                  >
                    <PiggyBank
                      className={`w-6 h-6 ${
                        emergencyEval.tone === "good"
                          ? "text-[#436cb0]"
                          : "text-amber-600"
                      }`}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-base font-bold text-gray-900">
                      {emergencyEval.status}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {emergencyEval.description}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 改善ポイント */}
            <Card className="lg:col-span-3 p-6 bg-[#f6f8fb]">
              <h3 className="text-lg font-bold text-gray-900 mb-5">
                改善ポイント
              </h3>
              <div className="space-y-4 flex flex-col gap-4">
                {improvements.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="flex gap-3">
                      <div className="bg-blue-100 rounded-full p-2 h-9 w-9 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-[#436cb0]" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-base font-bold text-[#436cb0] ">
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ===== アクションプラン + CTA ===== */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-8">
              <Target className="w-6 h-6 text-[#436cb0]" />
              <h3 className="text-xl font-bold text-gray-900">
                資産形成アクションプラン
              </h3>
            </div>
            <div className="flex flex-col xl:flex-row gap-8 items-center">
              {/* ステップ */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1 w-full relative">
                {actionPlan.map((step) => (
                  <div key={step.step} className="relative">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-[#436cb0] text-white flex items-center justify-center text-lg font-bold mb-4 z-10">
                        {step.step}
                      </div>
                      <Badge
                        variant="outline"
                        className="mb-2 text-[#436cb0] border-blue-200"
                      >
                        {step.period}
                      </Badge>
                      <h4 className="font-bold text-gray-900 mb-1">
                        {step.title}
                      </h4>
                      <p className="text-sm text-gray-600">{step.desc}</p>
                    </div>
                    {step.step < actionPlan.length && (
                      <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-blue-100 -z-0" />
                    )}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="xl:w-72 flex-shrink-0 w-full">
                <div className="relative">
                  {/* 安心吹き出し（枠の左上・外側） */}
                  <div className="relative xl:absolute xl:-top-16 xl:-left-7 xl:z-20 mb-3 xl:mb-0 xl:max-w-[240px]">
                    <div className="relative rounded-xl bg-white border border-[#436cb0]/30 text-[#436cb0] text-[14px] leading-snug font-medium px-3 py-2 shadow-[0_4px_20px_rgba(67,108,176,0.18)]">
                      金融商品を販売することはありません。営業行為は一切行いませんのでご安心ください。
                      {/* 吹き出しの尾（右下＝ボックス方向を指す） */}
                      <span className="hidden xl:block absolute -bottom-1.5 right-8 w-3 h-3 bg-white border-b border-r border-[#436cb0]/30 rotate-45" />
                    </div>
                  </div>

                  <div className="rounded-xl bg-gradient-to-r from-[#436cb0] to-[#34568c] text-white p-6 text-center">
                    <Calendar className="w-10 h-10 mx-auto mb-3" />
                    <p className="font-bold mb-1">専門家に相談しませんか？</p>
                    <p className="text-blue-100 text-xs mb-4">
                      ファイナンシャル・プランナーが最適なプランをご提案します
                    </p>
                    <Button
                      variant="secondary"
                      className="bg-white text-[#436cb0] hover:bg-gray-100 w-full py-6"
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
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ==================================================================== */}
        {/* PDF 出力専用レイアウト（A4 縦向け・画面外に常時描画してキャプチャする） */}
        {/* 画面表示（上の reportRef）とは別レイアウトで、1ページに収まる構成にする */}
        {/* ==================================================================== */}
        <div
          ref={pdfRef}
          aria-hidden={!pdfPreview}
          style={
            pdfPreview
              ? {
                  // プレビュー時は画面中央に A4 見立てで表示
                  width: "820px",
                  margin: "24px auto",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
                }
              : {
                  position: "absolute",
                  left: "-10000px",
                  top: 0,
                  width: "820px",
                }
          }
          className="bg-white"
          data-pdf-report
        >
          {/* Card の枠線は ring(=box-shadow) で描画されており html2canvas では消えるため、
              PDF レイアウト内のカードには実線ボーダーを付与する */}
          <style>{`[data-pdf-report] [data-slot="card"]{border:1px solid #e5e7eb;box-shadow:none}`}</style>
          <div className="p-6 space-y-2 text-gray-900">
            {/* ロゴ（左上） */}
            <div className="flex justify-start mb-1">
              <img
                src="/images/nohoke_logo.png"
                alt="NoHoKe"
                className="h-8 w-auto"
              />
            </div>

            {/* タイトル */}
            <div className="text-center mb-2">
              <Badge className="mb-1 bg-green-100 text-green-700 hover:bg-green-100 text-[10px]">
                <Check className="w-3 h-3 mr-1" />
                診断完了
              </Badge>
              <h1 className="text-2xl font-bold text-gray-900">
                あなたのお金の
                <span className="text-blue-600">流動性診断</span>
                レポート
              </h1>
              <p className="text-[11px] text-gray-600 mt-1">
                診断結果に基づいた詳細な分析とアドバイスをご覧いただけます
              </p>
            </div>

            {/* Row1: 総合スコア / 資産バランス / 入力データ */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-3 flex flex-col items-center justify-center">
                <h3 className="text-sm font-bold text-gray-900 mb-2">
                  総合スコア
                </h3>
                <div className="relative" style={{ width: 112, height: 112 }}>
                  <svg
                    viewBox="0 0 200 200"
                    style={{ width: 112, height: 112 }}
                    className="-rotate-90"
                  >
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      stroke="currentColor"
                      strokeWidth="14"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      stroke="currentColor"
                      strokeWidth="14"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 90}`}
                      strokeDashoffset={`${2 * Math.PI * 90 * (1 - result.score / 100)}`}
                      className="text-[#436cb0]"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-[9px] text-gray-500">総合スコア</div>
                      <div className="text-2xl font-bold text-[#436cb0] leading-none">
                        {result.score}
                      </div>
                      <div className="text-gray-500 text-[9px]">/ 100点</div>
                    </div>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs px-2 py-0.5 mt-2">
                  {rank} ランク
                </Badge>
              </Card>

              <Card className="p-3">
                <h3 className="text-sm font-bold text-gray-900 mb-1 text-center">
                  資産バランス
                </h3>
                <div className="max-w-[190px] mx-auto">
                  <RadarChart data={radarData} />
                </div>
              </Card>

              <Card className="p-3">
                <h3 className="text-sm font-bold text-gray-900 mb-2 text-center">
                  入力データ
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      icon: Wallet,
                      label: "手取り月収",
                      value: yen(d.monthly_income),
                    },
                    {
                      icon: BarChart3,
                      label: "毎月固定費",
                      value: yen(d.monthly_fixed_cost),
                    },
                    {
                      icon: PiggyBank,
                      label: "現預金額",
                      value: `${(d.savings / 10000).toLocaleString()}万円`,
                    },
                    {
                      icon: Shield,
                      label: "毎月保険料",
                      value: yen(d.monthly_insurance),
                    },
                    {
                      icon: User,
                      label: "年齢",
                      value: `${d.age}歳`,
                    },
                    {
                      icon: Users,
                      label: "子ども（未成年）",
                      value: `${d.children_count}人`,
                    },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={i}
                        className="bg-gray-50 rounded-md px-2 py-1.5"
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          <Icon className="w-3 h-3 text-[#436cb0] flex-shrink-0" />
                          <span className="text-[9px] text-gray-500">
                            {item.label}
                          </span>
                        </div>
                        <div className="text-[13px] font-bold text-gray-900 text-right whitespace-nowrap">
                          {item.value}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Row2: 資産構成 / 目標達成状況 / 保険適正度 */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-3">
                <h3 className="text-sm font-bold text-gray-900 mb-2">
                  資産構成
                </h3>
                <DonutChart
                  segments={donutSegments}
                  total={d.savings}
                  compact
                />
              </Card>

              <Card className="p-3">
                <h3 className="text-sm font-bold text-gray-900 mb-2">
                  目標達成状況
                </h3>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="relative flex-shrink-0"
                    style={{ width: 72, height: 72 }}
                  >
                    <svg
                      viewBox="0 0 96 96"
                      style={{ width: 72, height: 72 }}
                      className="-rotate-90"
                    >
                      <circle
                        cx="48"
                        cy="48"
                        r="41"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-gray-200"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="41"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 41}`}
                        strokeDashoffset={`${2 * Math.PI * 41 * (1 - overallGoal / 100)}`}
                        className="text-[#436cb0]"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-[#436cb0]">
                        {overallGoal}%
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-600">
                    資産形成目標の総合達成率です。
                  </p>
                </div>
                <div className="space-y-1.5">
                  {goals.map((g, i) => (
                    <div key={i} className="space-y-0.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="font-medium text-gray-900">
                          {g.label}
                        </span>
                        <span className="text-[#436cb0] font-bold">
                          {g.current}%
                        </span>
                      </div>
                      <Progress
                        value={g.current}
                        className="h-2"
                        indicatorClassName="bg-[#436cb0]"
                      />
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-3 flex flex-col items-center">
                <h3 className="text-sm font-bold text-gray-900 mb-1 self-start">
                  保険適正度
                </h3>
                <div className="max-w-[150px] w-full">
                  <Gauge value={insuranceScore} compact />
                </div>
                <p className="text-[10px] text-gray-600 text-center mt-1">
                  保険料は収入の{Math.round(insuranceRatio)}
                  %。適正範囲は5〜7%です。
                </p>
              </Card>
            </div>

            {/* Row3: 資産推移 */}
            <Card className="p-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-gray-900">資産推移</h3>
                <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 text-[10px]">
                  <Sparkles className="w-3 h-3 mr-1" />
                  毎月{yen(monthlySaving)}積立想定
                </Badge>
              </div>
              <LineChart points={assetPoints} />
              <p className="text-[10px] text-gray-500 mt-1">
                現在の家計状況から、毎月の余剰資金を積み立てた場合の資産推移（年利3%想定）です。
              </p>
            </Card>

            {/* Row4: 6つの評価項目 / 保険評価・生活防衛資金 / 改善ポイント */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-3">
                <h3 className="text-sm font-bold text-gray-900 mb-2">
                  6つの評価項目
                </h3>
                <div className="space-y-1.5">
                  {evalBars.map((item, i) => (
                    <div key={i} className="space-y-0.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="font-medium text-gray-900">
                          {item.label}
                        </span>
                        <span className="text-[#436cb0] font-bold">
                          {item.value}点
                        </span>
                      </div>
                      <Progress
                        value={item.value}
                        className="h-2"
                        indicatorClassName="bg-[#436cb0]"
                      />
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-3">
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                  保険評価
                </h3>
                <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-2 mb-2">
                  <div className="flex items-start gap-2">
                    <div
                      className={`rounded-full p-1 flex-shrink-0 ${
                        insuranceEval.tone === "good"
                          ? "bg-blue-100"
                          : "bg-amber-100"
                      }`}
                    >
                      <ShieldCheck
                        className={`w-4 h-4 ${
                          insuranceEval.tone === "good"
                            ? "text-[#436cb0]"
                            : "text-amber-600"
                        }`}
                      />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-gray-900">
                        {insuranceEval.status}
                      </h4>
                      <p className="text-[10px] text-gray-600">
                        {insuranceEval.description}
                      </p>
                    </div>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                  生活防衛資金
                </h3>
                <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-2">
                  <div className="flex items-start gap-2">
                    <div
                      className={`rounded-full p-1 flex-shrink-0 ${
                        emergencyEval.tone === "good"
                          ? "bg-blue-100"
                          : "bg-amber-100"
                      }`}
                    >
                      <PiggyBank
                        className={`w-4 h-4 ${
                          emergencyEval.tone === "good"
                            ? "text-[#436cb0]"
                            : "text-amber-600"
                        }`}
                      />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-gray-900">
                        {emergencyEval.status}
                      </h4>
                      <p className="text-[10px] text-gray-600">
                        {emergencyEval.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-3 bg-[#f6f8fb]">
                <h3 className="text-sm font-bold text-gray-900 mb-2">
                  改善ポイント
                </h3>
                <div className="space-y-2">
                  {improvements.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex gap-2">
                        <div className="bg-blue-100 rounded-full p-1 h-6 w-6 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-3 h-3 text-[#436cb0]" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold text-[#436cb0]">
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-gray-600">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Row5: アクションプラン + CTA */}
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-[#436cb0]" />
                <h3 className="text-sm font-bold text-gray-900">
                  資産形成アクションプラン
                </h3>
              </div>
              <div className="flex gap-4 items-center">
                <div className="grid grid-cols-4 gap-3 flex-1">
                  {actionPlan.map((step) => (
                    <div
                      key={step.step}
                      className="flex flex-col items-center text-center"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#436cb0] text-white flex items-center justify-center text-xs font-bold mb-1">
                        {step.step}
                      </div>
                      <Badge
                        variant="outline"
                        className="mb-1 text-[9px] text-[#436cb0] border-blue-200 px-1 py-0"
                      >
                        {step.period}
                      </Badge>
                      <h4 className="text-[11px] font-bold text-gray-900">
                        {step.title}
                      </h4>
                      <p className="text-[9px] text-gray-600">{step.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="w-52 flex-shrink-0">
                  <div className="rounded-lg bg-gradient-to-r from-[#436cb0] to-[#34568c] text-white p-3 text-center">
                    <Calendar className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-xs font-bold mb-0.5">
                      専門家に相談しませんか？
                    </p>
                    <p className="text-blue-100 text-[9px] mb-2">
                      ファイナンシャル・プランナーが最適なプランをご提案します
                    </p>
                    <div className="bg-white text-[#436cb0] rounded-md py-2 text-xs font-medium">
                      相談を予約する
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

// useSearchParams は静的エクスポートで Suspense 境界が必須
export default function FullResultPage() {
  return (
    <Suspense fallback={null}>
      <FullResultContent />
    </Suspense>
  );
}
