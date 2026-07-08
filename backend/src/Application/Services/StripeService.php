<?php

declare(strict_types=1);

namespace App\Application\Services;

use RuntimeException;
use Stripe\PaymentIntent;
use Stripe\Stripe;
use Stripe\Webhook;

/**
 * Stripe SDK のラッパー。
 *
 * .env から以下を参照する:
 *   STRIPE_SECRET_KEY      シークレットキー（sk_test_... / sk_live_...）
 *   STRIPE_WEBHOOK_SECRET  Webhook 署名シークレット（whsec_...）
 */
class StripeService
{
    public function __construct()
    {
        $secret = (string) ($_ENV['STRIPE_SECRET_KEY'] ?? '');
        if ($secret === '') {
            throw new RuntimeException('STRIPE_SECRET_KEY is not configured (.env).');
        }
        Stripe::setApiKey($secret);
    }

    /**
     * PaymentIntent を作成する。金額・通貨はサーバ側で固定（改ざん防止）。
     *
     * @param int    $amount   金額（JPY はゼロ小数通貨のため 500 をそのまま）
     * @param string $currency 通貨コード（例: jpy）
     * @param array  $metadata Stripe に保存するメタデータ
     * @param string|null $receiptEmail 領収メール送信先（任意）
     */
    public function createPaymentIntent(
        int $amount,
        string $currency,
        array $metadata = [],
        ?string $receiptEmail = null
    ): PaymentIntent {
        $params = [
            'amount'                    => $amount,
            'currency'                  => $currency,
            'metadata'                  => $metadata,
            'automatic_payment_methods' => ['enabled' => true],
        ];

        if ($receiptEmail !== null && $receiptEmail !== '') {
            $params['receipt_email'] = $receiptEmail;
        }

        return PaymentIntent::create($params);
    }

    /**
     * PaymentIntent を取得する（確定状況を Stripe 側の真実として確認するため）。
     *
     * @param string $intentId pi_xxx
     */
    public function retrievePaymentIntent(string $intentId): PaymentIntent
    {
        return PaymentIntent::retrieve($intentId);
    }

    /**
     * Webhook の署名を検証し、検証済みイベントを返す。
     *
     * @param string $payload   リクエストの生ボディ
     * @param string $sigHeader Stripe-Signature ヘッダ
     *
     * @throws \Stripe\Exception\SignatureVerificationException 署名不正時
     */
    public function constructWebhookEvent(string $payload, string $sigHeader): \Stripe\Event
    {
        $secret = (string) ($_ENV['STRIPE_WEBHOOK_SECRET'] ?? '');
        if ($secret === '') {
            throw new RuntimeException('STRIPE_WEBHOOK_SECRET is not configured (.env).');
        }

        return Webhook::constructEvent($payload, $sigHeader, $secret);
    }
}
