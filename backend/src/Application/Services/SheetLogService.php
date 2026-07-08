<?php

declare(strict_types=1);

namespace App\Application\Services;

use Psr\Log\LoggerInterface;

/**
 * 無料／有料の完了イベントを Google スプレッドシート（hohoke_user_log）へ記録する。
 *
 * スプレッドシートに紐付けた Google Apps Script の Web アプリ（doPost）へ
 * JSON を POST して 1 行追記する方式。Google 認証情報やライブラリは不要。
 *
 * 送信先 URL は .env の SHEET_LOG_URL（Apps Script デプロイ時の /exec URL）。
 * 未設定なら何もしない。記録の失敗が本処理（メール送信・決済確定）を
 * 妨げないよう、例外は飲み込み warning ログのみ残す（fire-and-forget）。
 */
class SheetLogService
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    /**
     * @param string $type      種別（'無料' / '有料'）
     * @param string $email     メールアドレス
     * @param string $sessionId 診断セッションID（UUID）
     * @param int    $score     総合スコア（0〜100）
     * @param string $grade     総合ランク（A/B/C/D/E）
     */
    public function log(string $type, string $email, string $sessionId, int $score, string $grade): void
    {
        $url = trim((string) ($_ENV['SHEET_LOG_URL'] ?? ''));
        if ($url === '') {
            return; // 未設定時は無効化（テンプレ未デプロイ環境でも安全）
        }

        $payload = json_encode([
            'type'       => $type,
            'email'      => $email,
            'session_id' => $sessionId,
            'score'      => $score,
            'grade'      => $grade,
        ], JSON_UNESCAPED_UNICODE);

        try {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => $payload,
                CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => 5,
                // Apps Script の Web アプリは script.googleusercontent.com へ 302 する
                CURLOPT_FOLLOWLOCATION => true,
            ]);
            $result = curl_exec($ch);
            if ($result === false) {
                $this->logger->warning('Sheet log request failed', [
                    'type'  => $type,
                    'error' => curl_error($ch),
                ]);
            }
            curl_close($ch);
        } catch (\Throwable $e) {
            $this->logger->warning('Sheet log exception', [
                'type'  => $type,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
