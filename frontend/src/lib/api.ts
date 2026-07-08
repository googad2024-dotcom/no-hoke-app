// API のベース URL。
// 開発時は .env.local で NEXT_PUBLIC_API_BASE=http://localhost:8080 を設定。
// 本番（同一ドメイン /api 配下）は空文字 → 相対パスで叩く。
// 静的エクスポートではビルド時にインライン化される点に注意。
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export const apiUrl = (path: string): string => `${API_BASE}${path}`;
