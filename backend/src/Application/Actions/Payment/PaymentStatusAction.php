<?php

declare(strict_types=1);

namespace App\Application\Actions\Payment;

use App\Application\Services\PaymentFulfillmentService;
use App\Application\Services\StripeService;
use App\Models\Payment;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

/**
 * 決済ステータス照会（サンクスページのポーリング用）。
 *
 * GET /api/payment/status?pi=pi_xxx
 * resp: { success, status, paid, result_url? }
 *
 * DB が未確定（pending）の場合は Stripe API へ直接 PaymentIntent を問い合わせ、
 * succeeded であればその場で確定処理を行う。これにより `stripe listen` が
 * 動いていないローカル環境でも、Webhook 到達が遅れる本番でも、画面が進む。
 */
class PaymentStatusAction
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
        $params = $request->getQueryParams();
        $intentId = trim((string) ($params['pi'] ?? ''));

        if ($intentId === '') {
            return $this->json($response, [
                'success' => false,
                'message' => 'pi は必須です',
            ], 400);
        }

        $payment = Payment::where('stripe_payment_intent_id', $intentId)->first();
        if (!$payment) {
            return $this->json($response, [
                'success' => false,
                'message' => '決済が見つかりません',
            ], 404);
        }

        // DB が未確定なら Stripe 側の真実を確認し、確定済みならその場で解放する。
        // （Webhook はバックアップ。CLI 未起動でもここで進む）
        if ($payment->status !== 'paid') {
            try {
                $intent = $this->stripe->retrievePaymentIntent($intentId);
                if ($intent->status === 'succeeded') {
                    $this->fulfillment->fulfill($intent);
                    $payment->refresh();
                } elseif ($intent->status === 'canceled') {
                    $payment->status = 'canceled';
                    $payment->save();
                }
            } catch (\Throwable $e) {
                // Stripe 一時エラーはポーリングの次回に委ねる（DB の現状を返す）
                $this->logger->warning('Failed to retrieve PaymentIntent on status poll', [
                    'pi'    => $intentId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $paid = $payment->status === 'paid';

        $body = [
            'success' => true,
            'status'  => $payment->status,
            'paid'    => $paid,
        ];

        // 確定済みなら結果ページURLを返す（メール未着でも画面から遷移できるように）
        if ($paid && $payment->result_access_token_id) {
            $token = $payment->resultAccessToken->token ?? null;
            if ($token) {
                $frontendUrl = $_ENV['FRONTEND_URL'] ?? $_ENV['APP_URL'] ?? '';
                $body['result_url'] = rtrim($frontendUrl, '/') . '/result/?token=' . $token;
            }
        }

        return $this->json($response, $body, 200);
    }

    private function json(Response $response, array $data, int $status): Response
    {
        $response->getBody()->write(json_encode($data));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}
