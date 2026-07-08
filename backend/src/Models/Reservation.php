<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reservation extends Model
{
    protected $table = 'reservations';

    protected $fillable = [
        'lead_id',
        'timerex_reservation_id',
        'reservation_status',
        'reserved_at',
    ];

    protected $casts = [
        'lead_id' => 'integer',
        'reserved_at' => 'datetime',
    ];

    /**
     * リレーション: リードに属する
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'lead_id');
    }

    /**
     * ステータス定数
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_CANCELLED = 'cancelled';
}
