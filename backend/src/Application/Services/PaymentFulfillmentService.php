<?php

declare(strict_types=1);

namespace App\Application\Services;

use App\Models\Lead;
use App\Models\Payment;
use App\Models\ResultAccessToken;
use Carbon\Carbon;
use Psr\Log\LoggerInterface;

/**
 * 決済確定（フルフィルメント）処理。
 *
 * Webhook（payment_intent.succeeded）とステータス照会ポーリングの両方から
 * 呼ばれる共通処理。email_sent_at / status により冪等。
 *
 * - status を paid に更新
 * - Lead を作成/更新し、フル結果アクセストークンを発行
 * - 購入完了メールを送信
 */
class PaymentFulfillmentService
{
    private LoggerInterface $logger;
    private MailService $mailService;
    private DiagnosisScorer $scorer;
    private SheetLogService $sheetLog;

    public function __construct(LoggerInterface $logger, MailService $mailService)
    {
        $this->logger      = $logger;
        $this->mailService = $mailService;
        $this->scorer      = new DiagnosisScorer();
        $this->sheetLog    = new SheetLogService($logger);
    }

    /**
     * 確定済み（succeeded）の PaymentIntent をもとにフル結果を解放する。
     *
     * @param object $intent Stripe の PaymentIntent オブジェクト
     *                       （Webhook の event.data.object / API retrieve のどちらでも可）
     */
    public function fulfill(object $intent): void
    {
        $payment = Payment::where('stripe_payment_intent_id', $intent->id)->first();
        if (!$payment) {
            $this->logger->warning('Payment row not found for intent', ['intent' => $intent->id]);
            return;
        }

        // 既に確定済み（メール送信済み）なら何もしない（冪等）
        if ($payment->status === 'paid' && $payment->email_sent_at !== null) {
            return;
        }

        // Stripe 側の確定情報を反映
        $email = $payment->email
            ?: ($intent->receipt_email ?? null)
            ?: ($intent->metadata->email ?? null);

        $payment->status     = 'paid';
        $payment->paid_at    = $payment->paid_at ?? Carbon::now();
        $payment->email      = $email;
        $payment->stripe_charge_id   = $intent->latest_charge ?? $payment->stripe_charge_id;
        $payment->stripe_customer_id = $intent->customer ?? $payment->stripe_customer_id;
        $payment->save();

        if (!$email) {
            $this->logger->warning('No email on paid payment; skip fulfillment email', [
                'payment_id' => $payment->id,
            ]);
            return;
        }

        $session = $payment->diagnosisSession;
        if (!$session) {
            $this->logger->warning('Diagnosis session missing for payment', [
                'payment_id' => $payment->id,
            ]);
            return;
        }

        // Lead を作成/更新（無料導線と同じ仕組みを有料版でも流用）
        $lead = Lead::updateOrCreate(
            ['diagnosis_session_id' => $session->id],
            ['email' => $email]
        );

        // フル結果アクセストークンは「一度だけ」発行する（冪等）。
        // Webhook 再送やポーリング再入で fulfill() が複数回呼ばれても、
        // 既に発行済みなら再利用する（重複トークン・孤児トークンを防止）。
        if ($payment->result_access_token_id
            && ($accessToken = ResultAccessToken::find($payment->result_access_token_id))
        ) {
            $token = $accessToken->token;
        } else {
            // 500円プランは買い切りのため無期限 = expires_at NULL
            $token = ResultAccessToken::generateToken();
            $accessToken = ResultAccessToken::create([
                'lead_id'    => $lead->id,
                'token'      => $token,
                'expires_at' => null,
            ]);

            $payment->lead_id = $lead->id;
            $payment->result_access_token_id = $accessToken->id;
            $payment->save();

            // 有料完了をスプレッドシート（hohoke_user_log）へ記録。
            // トークン初回発行時のみ実行し、再入時の二重記録を防ぐ。
            $diagnosisForLog = $this->scorer->calculate($session);
            $this->sheetLog->log(
                '有料',
                (string) $email,
                (string) $session->session_id,
                (int) ($diagnosisForLog['score'] ?? 0),
                (string) ($diagnosisForLog['grade'] ?? '')
            );
        }

        // フル結果ページURL（既存と同形式: クエリ文字列でトークンを渡す）
        $frontendUrl = $_ENV['FRONTEND_URL'] ?? $_ENV['APP_URL'] ?? '';
        $resultUrl = rtrim($frontendUrl, '/') . '/result/?token=' . $token;

        // 購入完了メール送信（email_sent_at で二重送信防止）。
        // 無料導線と同じ方針で SMTP 失敗は握りつぶし、確定処理は巻き戻さない。
        // 例外を投げないことで Webhook が 500 を返さず、Stripe 再送による
        // トークン重複発行を防ぐ。email_sent_at 未設定の間はサンクス画面
        // ポーリングの再入で自然にリトライされる（トークンは重複しない）。
        try {
            $diagnosis = $this->scorer->calculate($session);
            $this->mailService->sendPurchaseEmail($email, $resultUrl, $diagnosis);
            $payment->email_sent_at = Carbon::now();
            $payment->save();
        } catch (\Throwable $e) {
            $this->logger->error('Purchase email failed; token already issued, user can view via thanks screen', [
                'payment_id' => $payment->id,
                'error'      => $e->getMessage(),
            ]);
        }

        $this->logger->info('Payment fulfilled', [
            'payment_id' => $payment->id,
            'lead_id'    => $lead->id,
            'email'      => $email,
        ]);
    }
}
