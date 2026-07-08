import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // 共有サーバー（Node.js 不可）向けに静的エクスポート
  output: "export",
  // 各ルートを route/index.html で出力し Apache での配信を容易にする
  trailingSlash: true,
  // 静的エクスポートでは next/image の既定ローダーが使えないため無効化
  images: { unoptimized: true },
};

export default nextConfig;
