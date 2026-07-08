<?php

declare(strict_types=1);

namespace App\Application\Actions\Payment;

use App\Application\Services\PaymentFulfillmentService;
use App\Application\Services\StripeService;
use App\Models\Payment;
use App\Models\ResultAccessToken;
use App\Models\StripeWebhookEvent;
use Carbon\Carbon;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

/**
 * Stripe Webhook 受信。
 *
 * POST /api/stripe/webhook
 *
 * - 生ボディ + Stripe-Signature で署名検証（改ざん防止）
 * - event_id による冪等性（二重配信を無視）
 * - payment_intent.succeeded で決済確定 → Lead/トークン発行 → 購入完了メール
 */
class StripeWebhookAction
{
    private LoggerInterface $logger;
    private StripeService $stripe;
    private PaymentFulfillmentService $fulfillment;

    public function __construct(
        LoggerInterface $logger,
        StripeService $stripe,
        PaymentFulfillmentService $fulfillment
    ) {
        $this->logger      = $logger;
        $this->stripe      = $stripe;
        $this->fulfillment = $fulfillment;
    }

    public function __invoke(Request $request, Response $response): Response
    {
        // 署名検証には「生ボディ」が必要（PSR-7 の __toString は先頭へ巻き戻して全体を返す）
        $payload   = (string) $request->getBody();
        $sigHeader = $request->getHeaderLine('Stripe-Signature');

        try {
            $event = $this->stripe->constructWebhookEvent($payload, $sigHeader);
        } catch (\Throwable $e) {
            // 署名不正 → 400（Stripe は再送しない）
            $this->logger->warning('Stripe webhook signature verification failed', [
                'error' => $e->getMessage(),
            ]);
            return $response->withStatus(400);
        }

        // 冪等性: 受信済みイベントは何もせず 200
        if (StripeWebhookEvent::where('event_id', $event->id)->exists()) {
            $this->logger->info('Duplicate Stripe webhook ignored', ['event_id' => $event->id]);
            return $response->withStatus(200);
        }

        StripeWebhookEvent::create([
            'event_id' => $event->id,
            'type'     => $event->type,
            'payload'  => $payload,
        ]);

        try {
            switch ($event->type) {
                case 'payment_intent.succeeded':
                    $this->fulfillment->fulfill($event->data->object);
                    break;
                case 'payment_intent.payment_failed':
                    $this->updateStatus($event->data->object->id, 'failed');
                    break;
                case 'charge.refunded':
                    $this->handleRefunded($event->data->object);
                    break;
                default:
                    // 未対応イベントは無視
                    break;
            }

            StripeWebhookEvent::where('event_id', $event->id)
                ->update(['processed_at' => Carbon::now()]);

            return $response->withStatus(200);
        } catch (\Throwable $e) {
            // 処理失敗時は 500 を返し、Stripe の自動再送に委ねる
            $this->logger->error('Stripe webhook processing failed', [
                'event_id' => $event->id,
                'type'     => $event->type,
                'error'    => $e->getMessage(),
            ]);
            return $response->withStatus(500);
        }
    }

    private function handleRefunded(object $charge): void
    {
        $intentId = $charge->payment_intent ?? null;
        if (!$intentId) {
            return;
        }

        $payment = $this->updateStatus($intentId, 'refunded');

        // 返金後はフル結果へのアクセス権を失効させる。
        // 買い切り（expires_at = NULL = 無期限）のまま閲覧可能になってしまうのを防ぐため、
        // 発行済みトークンの有効期限を過去に倒して isValid() を false にする。
        if ($payment && $payment->result_access_token_id) {
            $token = ResultAccessToken::find($payment->result_access_token_id);
            if ($token) {
                $token->expires_at = Carbon::now()->subSecond();
                $token->save();

                $this->logger->info('Result token revoked due to refund', [
                    'payment_id' => $payment->id,
                    'token_id'   => $token->id,
                ]);
            }
        }
    }

    private function updateStatus(string $intentId, string $status): ?Payment
    {
        $payment = Payment::where('stripe_payment_intent_id', $intentId)->first();
        if ($payment) {
            $payment->status = $status;
            $payment->save();
        }
        return $payment;
    }
}
