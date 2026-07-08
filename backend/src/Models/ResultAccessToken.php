<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResultAccessToken extends Model
{
    protected $table = 'result_access_tokens';

    /**
     * このテーブルには updated_at 列が無いため、created_at のみ管理する
     */
    public const UPDATED_AT = null;

    protected $fillable = [
        'lead_id',
        'token',
        'expires_at',
        'accessed_at',
    ];

    protected $casts = [
        'lead_id' => 'integer',
        'expires_at' => 'datetime',
        'accessed_at' => 'datetime',
    ];

    /**
     * リレーション: リードに属する
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'lead_id');
    }

    /**
     * トークンを生成（JWT形式）
     */
    public static function generateToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    /**
     * トークンが有効期限内かチェック
     *
     * expires_at が NULL の場合は無期限（500円プラン購入者）として常に有効とみなす。
     */
    public function isValid(): bool
    {
        return $this->expires_at === null || $this->expires_at > Carbon::now();
    }

    /**
     * アクセス日時を記録
     */
    public function markAsAccessed(): void
    {
        $this->accessed_at = Carbon::now();
        $this->save();
    }
}
