import { z } from "zod";

/**
 * 診断入力（6項目）の値域バリデーション。
 *
 * フロントのステップフォームとバックエンド送信の両方で同じ基準を使うための
 * 単一の正となるスキーマ。金額は手取り月収を基準にした現実的な上限を設定する。
 * （DB の DECIMAL 桁あふれ・非現実値による診断結果の破綻を防ぐ）
 */

// 金額系の上限（円）。savings のみ DECIMAL(12,2) に合わせて桁数を大きく取る。
const MAX_MONEY = 10_000_000; // 月次の金額（月収・固定費・保険料）
const MAX_SAVINGS = 9_999_999_999; // 現預金（DECIMAL(12,2) の範囲内）

export const ageSchema = z
  .number({ message: "年齢を入力してください" })
  .int("年齢は整数で入力してください")
  .min(18, "18歳以上を入力してください")
  .max(100, "100歳以下を入力してください");

export const monthlyIncomeSchema = z
  .number({ message: "手取り月収を入力してください" })
  .min(1, "手取り月収を入力してください")
  .max(MAX_MONEY, "金額が大きすぎます（1,000万円以下で入力してください）");

export const monthlyFixedCostSchema = z
  .number({ message: "毎月固定費を入力してください" })
  .min(0, "0円以上で入力してください")
  .max(MAX_MONEY, "金額が大きすぎます（1,000万円以下で入力してください）");

export const savingsSchema = z
  .number({ message: "現預金額を入力してください" })
  .min(0, "0円以上で入力してください")
  .max(MAX_SAVINGS, "金額が大きすぎます");

export const monthlyInsuranceSchema = z
  .number({ message: "毎月保険料を入力してください" })
  .min(0, "0円以上で入力してください")
  .max(MAX_MONEY, "金額が大きすぎます（1,000万円以下で入力してください）");

export const childrenCountSchema = z
  .number({ message: "未成年のお子様の人数を選択してください" })
  .int("整数で入力してください")
  .min(0, "0人以上を選択してください")
  .max(20, "人数が多すぎます（20人以下で入力してください）");

/** 診断送信ペイロード全体のスキーマ */
export const diagnosisInputSchema = z.object({
  age: ageSchema,
  children_count: childrenCountSchema,
  monthly_income: monthlyIncomeSchema,
  monthly_fixed_cost: monthlyFixedCostSchema,
  savings: savingsSchema,
  monthly_insurance: monthlyInsuranceSchema,
});

export type DiagnosisInput = z.infer<typeof diagnosisInputSchema>;

/** number 型フィールド名 */
export type NumericField =
  | "age"
  | "monthly_income"
  | "monthly_fixed_cost"
  | "savings"
  | "monthly_insurance";

const numericSchemas: Record<NumericField, z.ZodNumber> = {
  age: ageSchema,
  monthly_income: monthlyIncomeSchema,
  monthly_fixed_cost: monthlyFixedCostSchema,
  savings: savingsSchema,
  monthly_insurance: monthlyInsuranceSchema,
};

/**
 * フォームの数値フィールド（カンマ区切り文字列）を検証する。
 * @returns エラーメッセージ。問題なければ null。
 */
export function validateNumericField(
  field: NumericField,
  rawValue: string,
): string | null {
  const normalized = rawValue.replace(/,/g, "").trim();
  if (normalized === "") {
    // 空欄は「未入力」（ボタン非活性側で扱う）。ここではメッセージを出さない。
    return null;
  }
  const num = Number(normalized);
  if (!Number.isFinite(num)) {
    return "数値を入力してください";
  }
  const result = numericSchemas[field].safeParse(num);
  return result.success ? null : (result.error.issues[0]?.message ?? "入力値が不正です");
}
