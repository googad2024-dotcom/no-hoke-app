<?php

declare(strict_types=1);

namespace App\Application\Actions\Contact;

use App\Application\Services\MailService;
use App\Application\Validation\EmailValidator;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

/**
 * お問い合わせフォームの受付。
 *
 * POST /api/contact
 * body: { name, email, message }
 * resp: { success, message }
 *
 * 入力を検証し、運営宛に問い合わせメールを送信する（Reply-To は問い合わせ者）。
 */
class SendContactAction
{
    private LoggerInterface $logger;
    private MailService $mailService;

    public function __construct(LoggerInterface $logger, MailService $mailService)
    {
        $this->logger      = $logger;
        $this->mailService = $mailService;
    }

    public function __invoke(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        $name    = trim((string) ($data['name'] ?? ''));
        $email   = trim((string) ($data['email'] ?? ''));
        $message = trim((string) ($data['message'] ?? ''));

        // 必須チェック
        if ($name === '' || $email === '' || $message === '') {
            return $this->json($response, [
                'success' => false,
                'message' => 'お名前・メールアドレス・お問い合わせ内容は必須です',
            ], 400);
        }

        // 長さの上限（DoS・巨大送信の抑制）。フロントの maxLength と揃える。
        if (mb_strlen($name) > 100 || mb_strlen($message) > 2000) {
            return $this->json($response, [
                'success' => false,
                'message' => '入力が長すぎます。お名前は100文字、内容は2000文字以内でご入力ください',
            ], 400);
        }

        // メール形式＋よくあるドメイン誤字の検出（送信・返信の不達を防ぐ）
        $emailError = EmailValidator::validate($email);
        if ($emailError !== null) {
            return $this->json($response, [
                'success' => false,
                'message' => $emailError,
            ], 400);
        }

        try {
            $this->mailService->sendContactEmail($name, $email, $message);
        } catch (\Throwable $e) {
            $this->logger->error('Failed to send contact email', [
                'from'  => $email,
                'error' => $e->getMessage(),
            ]);
            return $this->json($response, [
                'success' => false,
                'message' => '送信に失敗しました。時間をおいて再度お試しください',
            ], 500);
        }

        return $this->json($response, [
            'success' => true,
            'message' => 'お問い合わせを受け付けました',
        ], 201);
    }

    private function json(Response $response, array $data, int $status): Response
    {
        $response->getBody()->write(json_encode($data));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}
