<?php

declare(strict_types=1);

namespace App\Application\Validation;

/**
 * メールアドレスのバリデーション（形式チェック＋よくあるドメイン誤字の検出）。
 *
 * `user@gmail.co` のような形式上は正しいが明らかな打ち間違い（.com の誤り等）は
 * FILTER_VALIDATE_EMAIL を通過してしまい、宛先不達（バウンス）の原因になる。
 * 送信前にこれらを検出して弾く。
 *
 * フロントの src/lib/email.ts と基準を揃える。
 */
class EmailValidator
{
    /** 高確度の「打ち間違いドメイン」→ 正しいドメイン */
    private const TYPO_DOMAINS = [
        // gmail
        'gmail.co'    => 'gmail.com',
        'gmail.con'   => 'gmail.com',
        'gmail.cmo'   => 'gmail.com',
        'gmail.om'    => 'gmail.com',
        'gmail.cm'    => 'gmail.com',
        'gmail.comm'  => 'gmail.com',
        'gmail.jp'    => 'gmail.com',
        'gmail.ne.jp' => 'gmail.com',
        'gmial.com'   => 'gmail.com',
        'gmai.com'    => 'gmail.com',
        'gmaill.com'  => 'gmail.com',
        'gnail.com'   => 'gmail.com',
        'gmail.col'   => 'gmail.com',
        // yahoo（国内は yahoo.co.jp）
        'yahoo.con'   => 'yahoo.co.jp',
        'yahoo.co'    => 'yahoo.co.jp',
        'yahoo.cojp'  => 'yahoo.co.jp',
        // outlook / hotmail / icloud
        'outlook.co'  => 'outlook.com',
        'outlook.con' => 'outlook.com',
        'hotmail.co'  => 'hotmail.com',
        'hotmail.con' => 'hotmail.com',
        'icloud.co'   => 'icloud.com',
        'icloud.con'  => 'icloud.com',
    ];

    /**
     * メールアドレスを検証する。
     *
     * @return string|null エラーメッセージ。問題なければ null。
     */
    public static function validate(string $raw): ?string
    {
        $email = trim($raw);

        if ($email === '') {
            return 'メールアドレスを入力してください';
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return 'メールアドレスの形式が正しくありません';
        }

        $parts  = explode('@', $email);
        $domain = strtolower(end($parts));
        if (isset(self::TYPO_DOMAINS[$domain])) {
            return 'メールアドレスをご確認ください（@'
                . self::TYPO_DOMAINS[$domain]
                . ' の誤りではありませんか？）';
        }

        return null;
    }
}
