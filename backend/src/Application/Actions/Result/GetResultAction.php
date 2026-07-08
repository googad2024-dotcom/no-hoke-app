<?php

declare(strict_types=1);

namespace App\Application\Actions\Result;

use App\Application\Services\DiagnosisScorer;
use App\Models\ResultAccessToken;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class GetResultAction
{
    private LoggerInterface $logger;
    private DiagnosisScorer $scorer;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
        $this->scorer = new DiagnosisScorer();
    }

    public function __invoke(Request $request, Response $response, array $args): Response
    {
        try {
            $token = $args['token'] ?? null;

            if (!$token) {
                $error = ['success' => false, 'message' => 'Token is required'];
                $response->getBody()->write(json_encode($error));
                return $response
                    ->withHeader('Content-Type', 'application/json')
                    ->withStatus(400);
            }

            // トークンを取得（リレーション含む）
            $accessToken = ResultAccessToken::with([
                'lead.diagnosisSession'
            ])->where('token', $token)->first();

            if (!$accessToken) {
                $error = ['success' => false, 'message' => 'Invalid token'];
                $response->getBody()->write(json_encode($error));
                return $response
                    ->withHeader('Content-Type', 'application/json')
                    ->withStatus(404);
            }

            // トークンの有効期限チェック
            if (!$accessToken->isValid()) {
                $error = ['success' => false, 'message' => 'Token has expired'];
                $response->getBody()->write(json_encode($error));
                return $response
                    ->withHeader('Content-Type', 'application/json')
                    ->withStatus(410);
            }

            // アクセス日時を記録
            $accessToken->markAsAccessed();

            $lead = $accessToken->lead;
            $session = $lead->diagnosisSession;

            $this->logger->info('Result accessed', [
                'token' => $token,
                'lead_id' => $lead->id
            ]);

            // 診断スコアを再計算して詳細を返す
            $diagnosis = $this->scorer->calculate($session);

            $result = [
                'success' => true,
                'data' => [
                    'score'         => $diagnosis['score'],
                    'grade'         => $diagnosis['grade'],
                    'grade_message' => $diagnosis['grade_message'],
                    'breakdown'     => $diagnosis['breakdown'],
                    'diagnosis' => [
                        'age'                => $session->age,
                        'children_count'     => (int) $session->children_count,
                        'monthly_income'     => (float) $session->monthly_income,
                        'monthly_fixed_cost' => (float) $session->monthly_fixed_cost,
                        'savings'            => (float) $session->savings,
                        'monthly_insurance'  => (float) $session->monthly_insurance,
                    ],
                    'email'           => $lead->email,
                    'recommendations' => $this->generateRecommendations($diagnosis),
                ],
            ];

            $response->getBody()->write(json_encode($result));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(200);

        } catch (\Exception $e) {
            $this->logger->error('Failed to get result', [
                'error' => $e->getMessage()
            ]);

            $error = [
                'success' => false,
                'message' => 'Failed to get result',
            ];

            $response->getBody()->write(json_encode($error));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(500);
        }
    }

    /**
     * 診断結果に基づいた推奨事項を生成
     */
    private function generateRecommendations(array $diagnosis): array
    {
        $recommendations = [];

        foreach ($diagnosis['breakdown'] as $item) {
            if ($item['deduction'] === 0) {
                continue;
            }

            switch ($item['name']) {
                case '流動性余命':
                    $recommendations[] = [
                        'title'       => '現預金の積み増しを検討しましょう',
                        'description' => '現在の流動性余命は' . $item['label'] . 'です。月の支出（固定費＋保険料）の24ヶ月分以上を目安に現預金を確保することで、万一の際も安心です。',
                    ];
                    break;
                case '固定費率':
                    $recommendations[] = [
                        'title'       => '固定費を見直しましょう',
                        'description' => '固定費率は' . $item['label'] . 'です。理想は手取りの30%以下。家賃・通信費・サブスクリプションなどの圧縮を検討してください。',
                    ];
                    break;
                case '保険料率':
                    $recommendations[] = [
                        'title'       => '保険料の適正化を検討しましょう',
                        'description' => '保険料率は' . $item['label'] . 'です。手取りの5%以下が目安。重複している保障や不要な特約がないか見直しましょう。',
                    ];
                    break;
                case '可処分所得率':
                    $recommendations[] = [
                        'title'       => '毎月の余剰資金を増やしましょう',
                        'description' => '可処分所得率は' . $item['label'] . 'です。固定費や保険料を削減し、手取りの50%以上を自由に使える状態を目指しましょう。',
                    ];
                    break;
            }
        }

        if (empty($recommendations)) {
            $recommendations[] = [
                'title'       => '現状を維持しましょう',
                'description' => '全ての指標が良好な状態です。今の習慣を継続しながら、資産形成をさらに加速させましょう。',
            ];
        }

        return $recommendations;
    }
}
