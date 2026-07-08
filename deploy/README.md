# 共有サーバーへのデプロイ手順（FTP / 同一ドメイン /api）

Node.js を実行できない共有サーバー（Apache + PHP 8.3 + MySQL）に、
フロントは**静的エクスポート**、API は **同一ドメイン `/api` 配下の Slim PHP** として載せる。

## 配置レイアウト（Xserver サブドメイン構成）

Xserver ではサブドメインの**フォルダ自体がドキュメントルート（web ルート）**になる。
`nohoke.test8zaqrobacca.xyz/` の中が、一般的な「public_html 直下」と同じ役割。
深くネストして見えるだけで、中身の置き方・`.htaccess` のパスは変わらない。

```
/home/アカウント/test8zaqrobacca.xyz/public_html/nohoke.test8zaqrobacca.xyz/   ← ここが web ルート
  ├─ index.html / _next/ / diagnosis/ / result/ ...  ← frontend/out/ の中身を全展開
  ├─ .htaccess                                        ← deploy/root.htaccess をリネーム
  └─ server/                                          ← Slim 一式（vendor/ 含む）
       ├─ public/index.php
       ├─ app/  src/  vendor/  var/  logs/
       ├─ .env                                         ← backend/.env.production.example を元に作成
       └─ .htaccess                                    ← deploy/server.htaccess をリネーム
```

- アクセス URL は `https://nohoke.test8zaqrobacca.xyz/`
- `.env` の `APP_URL=https://nohoke.test8zaqrobacca.xyz/api`、`FRONTEND_URL=https://nohoke.test8zaqrobacca.xyz`
- API は `https://nohoke.test8zaqrobacca.xyz/api/...`（同一サブドメイン → CORS 不要）

## 手順

### 1. ローカルでビルド

```bash
# フロント（.env.production の NEXT_PUBLIC_API_BASE が空であること）
cd frontend && npm run build          # → frontend/out/

# バックエンドの本番依存
cd ../backend && composer install --no-dev --optimize-autoloader
```

### 2. サーバー準備

- コントロールパネルで **PHP 8.3** を選択
- phpMyAdmin で本番 DB を作成し、`backend/database/xs899439_nohoke.sql` をインポート

### 3. FTP アップロード

- `frontend/out/` の**中身** → `public_html/` 直下
- `backend/`（`app/ src/ public/ vendor/ var/ logs/`）→ `public_html/server/`
- `backend/.env.production.example` を本番値で埋めて `public_html/server/.env` として配置
- `deploy/root.htaccess` → `public_html/.htaccess`
- `deploy/server.htaccess` → `public_html/server/.htaccess`
- `server/var/`・`server/logs/` を書き込み可（755/775）に

### 4. 動作確認

- `https://（ドメイン）/api/health` → `{"status":"ok","database":"connected"}`
- `https://（ドメイン）/server/.env` が **403/404 で読めない**こと
- LP → 6項目入力 → 一部結果 → メール登録 → 受信メールの `/result/?token=...` → フル結果 → TimeRex まで通すこと

## Xserver 固有メモ

- **PHP 8.3**：サーバーパネル「PHP Ver.切替」で対象ドメインを 8.3 に設定。
- **DB_HOST は localhost ではない**：「MySQL設定」に表示される `mysqlXXXX.xserver.jp` を `.env` に指定。
  DB名・ユーザー名は「アカウント名\_xxx」形式で発行される。
- **web ルート**：`/home/アカウント/ドメイン/public_html/`。ここに `out/` の中身と `server/` を置く。
- **FTP/ファイルマネージャー**：`vendor/` は数千ファイルになるため、ZIP 化 →（SSH可なら）サーバー解凍、
  または「ファイルマネージャー」のアップロードを利用すると FTP より速く確実。
- **mod_rewrite / .htaccess**：標準で有効。`deploy/root.htaccess` の構成がそのまま使える。

## その他注意

- 静的エクスポートでは env はビルド時にインライン化される。本番ビルドは必ず `NEXT_PUBLIC_API_BASE` 空で行う。
- ドメイン直下ではなくサブディレクトリ配信する場合は `frontend/next.config.ts` に `basePath`/`assetPrefix` を追加。
- メール送信は共有サーバーの SMTP 制限に依存。将来は Resend への移行を推奨。

  これでアップロード用の成果物が両方そろいました:
  - フロント: frontend/out/（ビルド済み）
  - バックエンド: backend/（本番 vendor/ 込み）

  次回以降も依存を更新したくなったら、同じ docker compose exec backend composer ...
  で実行できます（ローカルへの Composer インストールは不要）。

  このまま README の手順どおり Xserver の nohoke.test8zaqrobacca.xyz/
  へアップロードして進められます。vendor/ は数千ファイルになるので、ZIP化 →
  ファイルマネージャーでアップ → 解凍が確実です。
