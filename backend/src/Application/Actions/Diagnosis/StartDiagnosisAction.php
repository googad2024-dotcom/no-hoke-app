<?php

declare(strict_types=1);

namespace App\Application\Actions\Diagnosis;

use App\Models\DiagnosisSession;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class StartDiagnosisAction
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    public function __invoke(Request $request, Response $response): Response
    {
        try {
            // 新しいセッションIDを生成
            $sessionId = DiagnosisSession::generateSessionId();

            // 診断セッションを作成
            $session = DiagnosisSession::create([
                'session_id' => $sessionId,
            ]);

            $this->logger->info('Diagnosis session started', ['session_id' => $sessionId]);

            $data = [
                'success' => true,
                'session_id' => $sessionId,
                'message' => 'Diagnosis session started successfully',
            ];

            $response->getBody()->write(json_encode($data));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(201);

        } catch (\Exception $e) {
            $this->logger->error('Failed to start diagnosis session', [
                'error' => $e->getMessage()
            ]);

            $error = [
                'success' => false,
                'message' => 'Failed to start diagnosis session',
            ];

            $response->getBody()->write(json_encode($error));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(500);
        }
    }
}
