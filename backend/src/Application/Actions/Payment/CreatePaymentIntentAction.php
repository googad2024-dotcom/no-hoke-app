<?php

declare(strict_types=1);

namespace App\Application\Actions\Payment;

use App\Application\Services\StripeService;
use App\Application\Validation\EmailValidator;
use App\Models\DiagnosisSession;
use App\Models\Payment;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

/**
 * 500円プランの PaymentIntent を作成する。
 *
 * POST /api/payment/intent
 * body: { session_id: string(UUID), email: string }
 * resp: { success, client_secret, payment_intent_id, amount }
 */
class CreatePaymentIntentAction
{
    private const PLAN_CODE = 'basic_500';
    private const AMOUNT    = 500;     // JPY はゼロ小数通貨のため 500 をそのまま
    private const CURRENCY  = 'jpy';

    private LoggerInterface $logger;
    private StripeService $stripe;

    public function __construct(LoggerInterface $logger, StripeService $stripe)
    {
        $this->logger = $logger;
        $this->stripe = $stripe;
    }

    public function __invoke(Request $request, Response $response): Response
    {
        try {
            $data = (array) $request->getParsedBody();
            $sessionId = trim((string) ($data['session_id'] ?? ''));
            $email     = trim((string) ($data['email'] ?? ''));

            if ($sessionId === '' || $email === '') {
                return $this->json($response, [
                    'success' => false,
                    'message' => 'session_id と email は必須です',
                ], 400);
            }

            $emailError = EmailValidator::validate($email);
            if ($emailError !== null) {
                return $this->json($response, [
                    'success' => false,
                    'message' => $emailError,
                ], 400);
            }

            $session = DiagnosisSession::where('session_id', $sessionId)->first();
            if (!$session) {
                return $this->json($response, [
                    'success' => false,
                    'message' => '診断セッションが見つかりません',
                ], 404);
            }

            // PaymentIntent を作成（金額・通貨はサーバ固定）
            $intent = $this->stripe->createPaymentIntent(
                self::AMOUNT,
                self::CURRENCY,
                [
                    'session_id' => $sessionId,
                    'plan_code'  => self::PLAN_CODE,
                ],
                $email
            );

            // 決済レコードを pending で作成（既存があれば更新）
            Payment::updateOrCreate(
                ['stripe_payment_intent_id' => $intent->id],
                [
                    'diagnosis_session_id' => $session->id,
                    'email'                => $email,
                    'plan_code'            => self::PLAN_CODE,
                    'amount'               => self::AMOUNT,
                    'currency'             => self::CURRENCY,
                    'status'               => 'pending',
                ]
            );

            $this->logger->info('PaymentIntent created', [
                'payment_intent_id' => $intent->id,
                'session_id'        => $sessionId,
            ]);

            return $this->json($response, [
                'success'           => true,
                'client_secret'     => $intent->client_secret,
                'payment_intent_id' => $intent->id,
                'amount'            => self::AMOUNT,
            ], 201);
        } catch (\Throwable $e) {
            $this->logger->error('Failed to create PaymentIntent', [
                'error' => $e->getMessage(),
            ]);

            return $this->json($response, [
                'success' => false,
                'message' => '決済の準備に失敗しました',
            ], 500);
        }
    }

    private function json(Response $response, array $data, int $status): Response
    {
        $response->getBody()->write(json_encode($data));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}
