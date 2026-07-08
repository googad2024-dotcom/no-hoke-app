<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DiagnosisSession extends Model
{
    protected $table = 'diagnosis_sessions';

    protected $fillable = [
        'session_id',
        'age',
        'children_count',
        'monthly_income',
        'monthly_fixed_cost',
        'savings',
        'monthly_insurance',
        'diagnosis_score',
    ];

    protected $casts = [
        'age' => 'integer',
        'children_count' => 'integer',
        'monthly_income' => 'decimal:2',
        'monthly_fixed_cost' => 'decimal:2',
        'savings' => 'decimal:2',
        'monthly_insurance' => 'decimal:2',
        'diagnosis_score' => 'integer',
    ];

    /**
     * リレーション: 1つのリードを持つ
     */
    public function lead(): HasOne
    {
        return $this->hasOne(Lead::class, 'diagnosis_session_id');
    }

    /**
     * セッションIDを生成
     */
    public static function generateSessionId(): string
    {
        return bin2hex(random_bytes(16));
    }
}
