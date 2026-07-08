<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    protected $table = 'leads';

    protected $fillable = [
        'diagnosis_session_id',
        'email',
        'is_email_verified',
    ];

    protected $casts = [
        'diagnosis_session_id' => 'integer',
        'is_email_verified' => 'boolean',
    ];

    /**
     * リレーション: 診断セッションに属する
     */
    public function diagnosisSession(): BelongsTo
    {
        return $this->belongsTo(DiagnosisSession::class, 'diagnosis_session_id');
    }

    /**
     * リレーション: 複数のアクセストークンを持つ
     */
    public function accessTokens(): HasMany
    {
        return $this->hasMany(ResultAccessToken::class, 'lead_id');
    }

    /**
     * リレーション: 複数の予約を持つ
     */
    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'lead_id');
    }
}
