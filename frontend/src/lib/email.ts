/**
 * メールアドレスのバリデーション（形式チェック＋よくあるドメイン誤字の検出）。
 *
 * `user@gmail.co` のような形式上は正しいが明らかな打ち間違い（.com の誤り等）は
 * FILTER_VALIDATE_EMAIL / type="email" を通過してしまい、宛先不達（バウンス）の
 * 原因になる。送信前にこれらを検出して即時フィードバックする。
 *
 * フロント・バックエンドで基準を揃える（backend: App\Application\Validation\EmailValidator）。
 */

// 形式チェック（RFC を厳密に満たすものではないが、実用上十分な精度）
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 高確度の「打ち間違いドメイン」→ 正しいドメイン
const TYPO_DOMAINS: Record<string, string> = {
  // gmail
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cmo": "gmail.com",
  "gmail.om": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.comm": "gmail.com",
  "gmail.jp": "gmail.com",
  "gmail.ne.jp": "gmail.com",
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmail.col": "gmail.com",
  // yahoo（国内は yahoo.co.jp）
  "yahoo.con": "yahoo.co.jp",
  "yahoo.co": "yahoo.co.jp",
  "yahoo.cojp": "yahoo.co.jp",
  // outlook / hotmail / icloud
  "outlook.co": "outlook.com",
  "outlook.con": "outlook.com",
  "hotmail.co": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "icloud.co": "icloud.com",
  "icloud.con": "icloud.com",
};

/**
 * メールアドレスを検証する。
 * @returns エラーメッセージ。問題なければ null。
 */
export function validateEmail(raw: string): string | null {
  const email = raw.trim();

  if (email === "") {
    return "メールアドレスを入力してください";
  }
  if (!EMAIL_RE.test(email)) {
    return "メールアドレスの形式が正しくありません";
  }

  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const suggestion = TYPO_DOMAINS[domain];
  if (suggestion) {
    return `メールアドレスをご確認ください（@${suggestion} の誤りではありませんか？）`;
  }

  return null;
}
