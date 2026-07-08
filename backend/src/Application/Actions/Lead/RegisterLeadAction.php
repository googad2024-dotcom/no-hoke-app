<?php

declare(strict_types=1);

namespace App\Application\Actions\Lead;

use App\Application\Services\DiagnosisScorer;
use App\Application\Services\MailService;
use App\Application\Services\SheetLogService;
use App\Application\Validation\EmailValidator;
use App\Models\DiagnosisSession;
use App\Models\Lead;
use App\Models\ResultAccessToken;
use Carbon\Carbon;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class RegisterLeadAction
{
    private LoggerInterface $logger;
    private MailService $mailService;
    private DiagnosisScorer $scorer;
    private SheetLogService $sheetLog;

    public function __construct(LoggerInterface $logger, MailService $mailService)
    {
        $this->logger = $logger;
        $this->mailService = $mailService;
        $this->scorer = new DiagnosisScorer();
        $this->sheetLog = new SheetLogService($logger);
    }

    public function __invoke(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();

            // バリデーション
            if (empty($data['session_id']) || empty($data['email'])) {
                $error = [
                    'success' => false,
                    'message' => 'Session ID and email are required'
                ];
                $response->getBody()->write(json_encode($error));
                return $response
                    ->withHeader('Content-Type', 'application/json')
                    ->withStatus(400);
            }

            // メールアドレス形式チェック＋よくあるドメイン誤字の検出
            $emailError = EmailValidator::validate((string) $data['email']);
            if ($emailError !== null) {
                $error = [
                    'success' => false,
                    'message' => $emailError,
                ];
                $response->getBody()->write(json_encode($error));
                return $response
                    ->withHeader('Content-Type', 'application/json')
                    ->withStatus(400);
            }

            // セッションを取得
            $session = DiagnosisSession::where('session_id', $data['session_id'])->first();

            if (!$session) {
                $error = ['success' => false, 'message' => 'Session not found'];
                $response->getBody()->write(json_encode($error));
                return $response
                    ->withHeader('Content-Type', 'application/json')
                    ->withStatus(404);
            }

            // リードを作成（既存の場合は更新）
            $lead = Lead::updateOrCreate(
                ['diagnosis_session_id' => $session->id],
                ['email' => $data['email']]
            );

            // アクセストークンを生成
            $token = ResultAccessToken::generateToken();
            $expiresAt = Carbon::now()->addDays(7); // 7日間有効

            ResultAccessToken::create([
                'lead_id' => $lead->id,
                'token' => $token,
                'expires_at' => $expiresAt,
            ]);

            $this->logger->info('Lead registered', [
                'lead_id' => $lead->id,
                'email' => $data['email']
            ]);

            // 結果閲覧用URL（フロントエンドのフル結果ページを指す）
            $frontendUrl = $_ENV['FRONTEND_URL'] ?? $_ENV['APP_URL'] ?? '';
            // 静的エクスポート（動的セグメント不可）のためクエリ文字列でトークンを渡す
            $resultUrl = rtrim($frontendUrl, '/') . '/result/?token=' . $token;

            // 500円プラン決済ページURL（無料メール内のアップセル用）
            $purchaseUrl = rtrim($frontendUrl, '/')
                . '/result/payment/?session_id=' . rawurlencode((string) $data['session_id']);

            // 診断サマリー（メール本文の途中結果表示用）を算出
            $diagnosis = $this->scorer->calculate($session);

            // 無料完了をスプレッドシート（hohoke_user_log）へ記録。
            // メール送信より前に行い、SMTP失敗時でも記録が残るようにする。
            $this->sheetLog->log(
                '無料',
                (string) $data['email'],
                (string) $data['session_id'],
                (int) ($diagnosis['score'] ?? 0),
                (string) ($diagnosis['grade'] ?? '')
            );

            // 結果閲覧用URL＋アップセルURLを含むHTMLメールを送信。
            // 送信に失敗してもトークンは既に発行済みのため、登録自体は成功扱いとし、
            // email_sent=false を返してフロント側で画面から結果へ誘導できるようにする。
            $emailSent = true;
            try {
                $this->mailService->sendResultEmail($data['email'], $resultUrl, $diagnosis, $purchaseUrl);
            } catch (\Throwable $mailError) {
                $emailSent = false;
                $this->logger->error('Failed to send result email', [
                    'lead_id' => $lead->id,
                    'error'   => $mailError->getMessage(),
                ]);
            }

            $result = [
                'success' => true,
                'lead_id' => $lead->id,
                'token' => $token,
                'result_url' => $resultUrl,
                'email_sent' => $emailSent,
                'message' => $emailSent
                    ? 'Lead registered successfully'
                    : 'Lead registered but email delivery failed',
            ];

            $response->getBody()->write(json_encode($result));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(201);

        } catch (\Exception $e) {
            $this->logger->error('Failed to register lead', [
                'error' => $e->getMessage()
            ]);

            $error = [
                'success' => false,
                'message' => 'Failed to register lead',
            ];

            $response->getBody()->write(json_encode($error));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(500);
        }
    }
}
