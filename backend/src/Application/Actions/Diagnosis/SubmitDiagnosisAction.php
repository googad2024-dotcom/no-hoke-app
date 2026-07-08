<?php

declare(strict_types=1);

namespace App\Application\Actions\Diagnosis;

use App\Application\Services\DiagnosisScorer;
use App\Models\DiagnosisSession;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class SubmitDiagnosisAction
{
    private LoggerInterface $logger;
    private DiagnosisScorer $scorer;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
        $this->scorer = new DiagnosisScorer();
    }

    public function __invoke(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();

            if (empty($data['session_id'])) {
                $error = ['success' => false, 'message' => 'Session ID is required'];
                $response->getBody()->write(json_encode($error));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            // 入力値域チェック（フロントの diagnosisSchema と同一基準。改ざん・直接POST対策）
            $validationError = $this->validateInput($data);
            if ($validationError !== null) {
                $error = ['success' => false, 'message' => $validationError];
                $response->getBody()->write(json_encode($error));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            $session = DiagnosisSession::where('session_id', $data['session_id'])->first();

            if (!$session) {
                $error = ['success' => false, 'message' => 'Session not found'];
                $response->getBody()->write(json_encode($error));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $session->update([
                'age'                => $data['age']                ?? null,
                'children_count'     => $data['children_count']     ?? null,
                'monthly_income'     => $data['monthly_income']     ?? null,
                'monthly_fixed_cost' => $data['monthly_fixed_cost'] ?? null,
                'savings'            => $data['savings']            ?? null,
                'monthly_insurance'  => $data['monthly_insurance']  ?? null,
            ]);

            $diagnosis = $this->scorer->calculate($session);

            $session->diagnosis_score = $diagnosis['score'];
            $session->save();

            $this->logger->info('Diagnosis submitted', [
                'session_id' => $data['session_id'],
                'score'      => $diagnosis['score'],
                'grade'      => $diagnosis['grade'],
            ]);

            $result = [
                'success'       => true,
                'session_id'    => $data['session_id'],
                'score'         => $diagnosis['score'],
                'grade'         => $diagnosis['grade'],
                'grade_message' => $diagnosis['grade_message'],
                'breakdown'     => $diagnosis['breakdown'],
                'message'       => 'Diagnosis submitted successfully',
            ];

            $response->getBody()->write(json_encode($result));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);

        } catch (\Exception $e) {
            $this->logger->error('Failed to submit diagnosis', ['error' => $e->getMessage()]);

            $error = ['success' => false, 'message' => 'Failed to submit diagnosis'];
            $response->getBody()->write(json_encode($error));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    /**
     * 6項目の値域チェック。問題があればエラーメッセージ、なければ null を返す。
     * 上限はフロントの diagnosisSchema.ts と揃える。
     */
    private function validateInput(array $data): ?string
    {
        $maxMoney   = 10_000_000;     // 月次金額（月収・固定費・保険料）
        $maxSavings = 9_999_999_999;  // 現預金（DECIMAL(12,2) の範囲内）

        // 年齢
        if (!isset($data['age']) || !is_numeric($data['age'])) {
            return '年齢を入力してください';
        }
        $age = (int) $data['age'];
        if ($age < 18 || $age > 100) {
            return '年齢は18〜100歳で入力してください';
        }

        // 未成年の扶養人数
        if (!isset($data['children_count']) || !is_numeric($data['children_count'])) {
            return '未成年のお子様の人数を選択してください';
        }
        $children = (int) $data['children_count'];
        if ($children < 0 || $children > 20) {
            return 'お子様の人数は0〜20人で入力してください';
        }

        // 金額系（下限・上限）
        $money = [
            'monthly_income'     => ['label' => '手取り月収', 'min' => 1, 'max' => $maxMoney],
            'monthly_fixed_cost' => ['label' => '毎月固定費', 'min' => 0, 'max' => $maxMoney],
            'savings'            => ['label' => '現預金額',   'min' => 0, 'max' => $maxSavings],
            'monthly_insurance'  => ['label' => '毎月保険料', 'min' => 0, 'max' => $maxMoney],
        ];

        foreach ($money as $key => $rule) {
            if (!isset($data[$key]) || !is_numeric($data[$key])) {
                return $rule['label'] . 'を入力してください';
            }
            $value = (float) $data[$key];
            if ($value < $rule['min']) {
                return $rule['label'] . 'が不正です';
            }
            if ($value > $rule['max']) {
                return $rule['label'] . 'が大きすぎます';
            }
        }

        return null;
    }
}
