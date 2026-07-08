// 結果ページ（/result・/result/detail）のエラー表示を日本語化・種別化する共通ヘルパー。
//
// バックエンド（GetResultAction）は HTTP ステータスと英語 message を返す：
//   400 Token is required / 404 Invalid token / 410 Token has expired / 500 Failed to get result
// フロントはこれらを区別せず英語のまま表示していたため、ここで種別と日本語文言に変換する。

export type ResultErrorKind =
  | "expired" // 410：有効期限切れ
  | "invalid" // 404：該当トークン無し
  | "missing_token" // 400 / token 未指定
  | "network" // fetch 例外
  | "unknown"; // 500 等その他

export type ResultError = {
  kind: ResultErrorKind;
  /** エラーカードの見出し */
  title: string;
  /** 説明文 */
  message: string;
};

/**
 * HTTP ステータスとバックエンドの message から、表示用の日本語エラーを決定する。
 * ステータスを優先し、message は後方互換のフォールバックとして併用する。
 */
export function mapResultError(status: number, message?: string): ResultError {
  if (status === 410 || message === "Token has expired") {
    return {
      kind: "expired",
      title: "リンクの有効期限が切れました",
      message:
        "この診断結果の閲覧期限（発行から7日間）を過ぎています。お手数ですが、もう一度診断を行って新しい結果をご確認ください。",
    };
  }

  if (status === 404 || message === "Invalid token") {
    return {
      kind: "invalid",
      title: "リンクが無効です",
      message:
        "診断結果が見つかりませんでした。URL が正しいかご確認のうえ、もう一度診断を行ってください。",
    };
  }

  if (status === 400 || message === "Token is required") {
    return MISSING_TOKEN_ERROR;
  }

  return {
    kind: "unknown",
    title: "エラー",
    message:
      "診断結果を取得できませんでした。お手数ですが、時間をおいて再度お試しください。",
  };
}

/** fetch 自体が失敗した場合（オフライン等） */
export const NETWORK_ERROR: ResultError = {
  kind: "network",
  title: "通信エラー",
  message:
    "ネットワークエラーが発生しました。通信環境をご確認のうえ、再度お試しください。",
};

/** URL に token が付与されていない場合 */
export const MISSING_TOKEN_ERROR: ResultError = {
  kind: "missing_token",
  title: "トークンが指定されていません",
  message:
    "アクセスに必要な情報が不足しています。診断結果メールのリンクから再度アクセスしてください。",
};
