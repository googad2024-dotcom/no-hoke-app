<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StripeWebhookEvent extends Model
{
    protected $table = 'stripe_webhook_events';

    /**
     * このテーブルには updated_at 列が無いため、created_at のみ管理する
     */
    public const UPDATED_AT = null;

    protected $fillable = [
        'event_id',
        'type',
        'payload',
        'processed_at',
    ];

    protected $casts = [
        'processed_at' => 'datetime',
    ];
}
