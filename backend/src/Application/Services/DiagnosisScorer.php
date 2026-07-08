<?php

declare(strict_types=1);

namespace App\Application\Services;

use App\Models\DiagnosisSession;

class DiagnosisScorer
{
    public function calculate(DiagnosisSession $session): array
    {
        $age    = (int) $session->age;
        $kids   = (int) $session->children_count;
        $income = (float) $session->monthly_income;
        $fixed  = (float) $session->monthly_fixed_cost;
        $cash   = (float) $session->savings;
        $ins    = (float) $session->monthly_insurance;

        // 流動性余命＝現預金 ÷ 月の支出（固定費＋保険料）。
        // 支出が0の場合は現預金が事実上「無限に持つ」ため最高評価（大きな月数）とする。
        $monthlyOutflow = $fixed + $ins;
        $lifespan  = $monthlyOutflow > 0
            ? $cash / $monthlyOutflow
            : ($cash > 0 ? 999.0 : 0.0);
        $fixedRate = $income > 0 ? $fixed / $income * 100 : 0;
        $insRate   = $income > 0 ? $ins   / $income * 100 : 0;
        $dispRate  = $income > 0 ? ($income - $fixed - $ins) / $income * 100 : 0;

        $L = $this->scoreLifespan($lifespan);
        $F = $this->scoreFixed($fixedRate);
        $I = $this->scoreIns($insRate);
        $D = $this->scoreDisp($dispRate);
        $A = $this->scoreAge($age);
        $C = $this->scoreChildren($kids);

        // 6指標の減点上限は合計100。年齢・子どもの追加に伴い財務4指標を再配分している。
        $totalDed = $L['ded'] + $F['ded'] + $I['ded'] + $D['ded'] + $A['ded'] + $C['ded'];
        // 年齢の減点に 0.5 刻みが含まれるため、最終スコアは整数に丸める。
        $score = (int) round(max(0, 100 - $totalDed));
        $grade = $this->grade($score);

        return [
            'score'         => $score,
            'grade'         => $grade['g'],
            'grade_message' => $grade['msg'],
            'breakdown'     => [
                [
                    'name'          => '流動性余命',
                    'description'   => '現預金 ÷ 月の支出（固定費＋保険料）',
                    'max_deduction' => 30,
                    'deduction'     => $L['ded'],
                    'label'         => $L['label'],
                    'value'         => round($lifespan, 1),
                ],
                [
                    'name'          => '固定費率',
                    'description'   => '月間固定費 ÷ 手取り月収',
                    'max_deduction' => 20,
                    'deduction'     => $F['ded'],
                    'label'         => $F['label'],
                    'value'         => round($fixedRate, 1),
                ],
                [
                    'name'          => '保険料率',
                    'description'   => '月間保険料 ÷ 手取り月収',
                    'max_deduction' => 20,
                    'deduction'     => $I['ded'],
                    'label'         => $I['label'],
                    'value'         => round($insRate, 1),
                ],
                [
                    'name'          => '可処分所得率',
                    'description'   => '(手取り − 固定費 − 保険料) ÷ 手取り',
                    'max_deduction' => 10,
                    'deduction'     => $D['ded'],
                    'label'         => $D['label'],
                    'value'         => round($dispRate, 1),
                ],
                [
                    'name'          => '年齢',
                    'description'   => '年齢による備えの必要性',
                    'max_deduction' => 10,
                    'deduction'     => $A['ded'],
                    'label'         => $A['label'],
                    'value'         => $age,
                ],
                [
                    'name'          => '子ども',
                    'description'   => '未成年の扶養人数',
                    'max_deduction' => 10,
                    'deduction'     => $C['ded'],
                    'label'         => $C['label'],
                    'value'         => $kids,
                ],
            ],
        ];
    }

    // ─── 各指標スコア ────────────────────────────────────────

    private function scoreLifespan(float $m): array
    {
        if ($m >= 24) return ['ded' => 0,  'label' => round($m, 1) . 'ヶ月（24ヶ月以上）'];
        if ($m >= 12) return ['ded' => 8,  'label' => round($m, 1) . 'ヶ月（12〜23ヶ月）'];
        if ($m >= 6)  return ['ded' => 19, 'label' => round($m, 1) . 'ヶ月（6〜11ヶ月）'];
        return               ['ded' => 30, 'label' => round($m, 1) . 'ヶ月（0〜5ヶ月）'];
    }

    private function scoreFixed(float $r): array
    {
        if ($r <= 30) return ['ded' => 0,  'label' => round($r, 1) . '%（30%以下）'];
        if ($r <= 40) return ['ded' => 4,  'label' => round($r, 1) . '%（31〜40%）'];
        if ($r <= 50) return ['ded' => 12, 'label' => round($r, 1) . '%（41〜50%）'];
        return               ['ded' => 20, 'label' => round($r, 1) . '%（51%以上）'];
    }

    private function scoreIns(float $r): array
    {
        if ($r <= 5)  return ['ded' => 0,  'label' => round($r, 1) . '%（5%以下）'];
        if ($r <= 10) return ['ded' => 8,  'label' => round($r, 1) . '%（6〜10%）'];
        if ($r <= 15) return ['ded' => 16, 'label' => round($r, 1) . '%（11〜15%）'];
        return               ['ded' => 20, 'label' => round($r, 1) . '%（16%以上）'];
    }

    private function scoreDisp(float $r): array
    {
        if ($r >= 50) return ['ded' => 0,  'label' => round($r, 1) . '%（50%以上）'];
        if ($r >= 40) return ['ded' => 3,  'label' => round($r, 1) . '%（40〜49%）'];
        if ($r >= 30) return ['ded' => 6,  'label' => round($r, 1) . '%（30〜39%）'];
        return               ['ded' => 10, 'label' => round($r, 1) . '%（29%以下）'];
    }

    /**
     * 年齢による減点（減点方式・最大10点）。
     * 若年ほど備えの猶予が長いため減点は小さい。最年少層でも -2.5点。
     */
    private function scoreAge(int $a): array
    {
        if ($a <= 34) return ['ded' => 2.5, 'label' => $a . '歳（18〜34歳）'];
        if ($a <= 49) return ['ded' => 5.0, 'label' => $a . '歳（35〜49歳）'];
        if ($a <= 64) return ['ded' => 7.5, 'label' => $a . '歳（50〜64歳）'];
        return               ['ded' => 10.0, 'label' => $a . '歳（65歳以上）'];
    }

    /**
     * 未成年の扶養人数による減点（1人あたり -2点、5人以上で上限 -10点）。
     */
    private function scoreChildren(int $n): array
    {
        $ded   = min(max($n, 0), 5) * 2;
        $label = $n >= 5 ? '5人以上（未成年）' : $n . '人（未成年）';
        return ['ded' => $ded, 'label' => $label];
    }

    /**
     * スコア（0〜100）を A〜E の5段階に判定する。
     *   A：非常に良好 / B：良好 / C：標準 / D：要改善 / E：要見直し
     */
    private function grade(int $s): array
    {
        if ($s >= 80) return ['g' => 'A', 'msg' => '家計の流動性が高く、現状維持で問題ありません。'];
        if ($s >= 65) return ['g' => 'B', 'msg' => '大きな問題はありませんが、一部見直すとさらに改善できます。'];
        if ($s >= 50) return ['g' => 'C', 'msg' => '一般的な状態。改善できるポイントがいくつかあります。'];
        if ($s >= 35) return ['g' => 'D', 'msg' => '固定費や保険料などに見直しの優先度が高い項目があります。'];
        return               ['g' => 'E', 'msg' => '家計への負担が大きく、早めに全体の確認が必要と言ってよい状態です。'];
    }
}
