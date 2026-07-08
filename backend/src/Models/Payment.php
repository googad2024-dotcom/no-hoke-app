<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $table = 'payments';

    protected $fillable = [
        'diagnosis_session_id',
        'lead_id',
        'email',
        'plan_code',
        'amount',
        'currency',
        'status',
        'stripe_payment_intent_id',
        'stripe_charge_id',
        'stripe_customer_id',
        'paid_at',
        'email_sent_at',
        'result_access_token_id',
        'metadata',
    ];

    protected $casts = [
        'diagnosis_session_id'   => 'integer',
        'lead_id'                => 'integer',
        'amount'                 => 'integer',
        'paid_at'                => 'datetime',
        'email_sent_at'          => 'datetime',
        'result_access_token_id' => 'integer',
        'metadata'               => 'array',
    ];

    public function diagnosisSession(): BelongsTo
    {
        return $this->belongsTo(DiagnosisSession::class, 'diagnosis_session_id');
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'lead_id');
    }

    public function resultAccessToken(): BelongsTo
    {
        return $this->belongsTo(ResultAccessToken::class, 'result_access_token_id');
    }
}
