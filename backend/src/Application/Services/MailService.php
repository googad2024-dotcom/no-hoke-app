<?php

declare(strict_types=1);

namespace App\Application\Services;

use PHPMailer\PHPMailer\Exception as PHPMailerException;
use PHPMailer\PHPMailer\PHPMailer;
use Psr\Log\LoggerInterface;
use RuntimeException;

/**
 * SMTP（PHPMailer）によるメール送信サービス。
 *
 * SMTP接続情報は .env から取得する:
 *   MAIL_HOST / MAIL_PORT / MAIL_USERNAME / MAIL_PASSWORD
 *   MAIL_ENCRYPTION (tls|ssl|'') / MAIL_FROM_ADDRESS / MAIL_FROM_NAME
 */
class MailService
{
    private const BRAND_NAME = 'NoHoKe';

    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    /**
     * 診断結果案内メールを送信する。
     *
     * @param string      $toEmail     宛先メールアドレス
     * @param string      $resultUrl   診断結果フルページのURL
     * @param array       $diagnosis   DiagnosisScorer::calculate() の戻り値（score / grade を使用）
     * @param string|null $purchaseUrl 500円プラン決済ページのURL。指定すると本文にアップセルを表示する
     *
     * @throws RuntimeException SMTP未設定・送信失敗時
     */
    public function sendResultEmail(
        string $toEmail,
        string $resultUrl,
        array $diagnosis,
        ?string $purchaseUrl = null
    ): void {
        $this->send(
            $toEmail,
            $resultUrl,
            $diagnosis,
            '【' . self::BRAND_NAME . '】資産形成診断結果のご案内',
            $purchaseUrl
        );
    }

    /**
     * 500円プラン購入完了メールを送信する（フル結果解放のご案内）。
     *
     * 本文・テンプレートは結果案内メールを流用し、件名のみ購入完了向けに変更する。
     *
     * @throws RuntimeException SMTP未設定・送信失敗時
     */
    public function sendPurchaseEmail(string $toEmail, string $resultUrl, array $diagnosis): void
    {
        $this->send(
            $toEmail,
            $resultUrl,
            $diagnosis,
            '【' . self::BRAND_NAME . '】ご購入ありがとうございます｜診断結果のご案内',
            null,
            true // 500円プランは買い切り＝無期限アクセス
        );
    }

    /**
     * お問い合わせフォームの内容を運営宛に送信する。
     *
     * 宛先は CONTACT_TO_ADDRESS（未設定なら MAIL_FROM_ADDRESS）。
     * 返信先（Reply-To）は問い合わせ者のメールアドレスに設定し、
     * 受信側からそのまま返信できるようにする。
     *
     * @param string $name    問い合わせ者の氏名
     * @param string $email   問い合わせ者のメールアドレス（Reply-To）
     * @param string $message 問い合わせ本文
     *
     * @throws RuntimeException SMTP未設定・送信失敗時
     */
    public function sendContactEmail(string $name, string $email, string $message): void
    {
        $host = $_ENV['MAIL_HOST'] ?? '';
        if ($host === '') {
            throw new RuntimeException('MAIL_HOST is not configured (.env). メール送信設定が未設定です。');
        }

        $toAddress = trim((string) ($_ENV['CONTACT_TO_ADDRESS'] ?? ''));
        if ($toAddress === '') {
            $toAddress = $_ENV['MAIL_FROM_ADDRESS'] ?? '';
        }
        if ($toAddress === '') {
            throw new RuntimeException('お問い合わせの宛先（CONTACT_TO_ADDRESS / MAIL_FROM_ADDRESS）が未設定です。');
        }

        $mailer = new PHPMailer(true);

        try {
            $mailer->isSMTP();
            $mailer->Host    = $host;
            $mailer->Port    = (int) ($_ENV['MAIL_PORT'] ?? 587);
            $mailer->CharSet = PHPMailer::CHARSET_UTF8;

            $username = $_ENV['MAIL_USERNAME'] ?? '';
            $password = $_ENV['MAIL_PASSWORD'] ?? '';
            if ($username !== '') {
                $mailer->SMTPAuth = true;
                $mailer->Username = $username;
                $mailer->Password = $password;
            }

            $encryption = $_ENV['MAIL_ENCRYPTION'] ?? 'tls';
            if ($encryption === 'tls') {
                $mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            } elseif ($encryption === 'ssl') {
                $mailer->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            } else {
                $mailer->SMTPSecure  = '';
                $mailer->SMTPAutoTLS = false;
            }

            // 送信元は認証済みの自ドメイン。なりすまし判定を避けるため From は自アドレスにし、
            // 問い合わせ者のアドレスは Reply-To に設定する。
            $fromAddress = $_ENV['MAIL_FROM_ADDRESS'] ?? 'no-reply@example.com';
            $fromName    = $_ENV['MAIL_FROM_NAME'] ?? self::BRAND_NAME;
            $mailer->setFrom($fromAddress, $fromName);
            $mailer->addAddress($toAddress);
            $mailer->addReplyTo($email, $name !== '' ? $name : $email);

            $mailer->isHTML(false);
            $mailer->Subject = '【' . self::BRAND_NAME . '】お問い合わせを受け付けました';
            $mailer->Body    = implode("\n", [
                'お問い合わせフォームから送信がありました。',
                '',
                '■お名前',
                $name,
                '',
                '■メールアドレス',
                $email,
                '',
                '■お問い合わせ内容',
                $message,
                '',
                '──────────────────',
                'このメールに返信すると、送信者へ直接返信できます（Reply-To 設定済み）。',
            ]);

            $mailer->send();

            $this->logger->info('Contact email sent', ['from' => $email, 'to' => $toAddress]);
        } catch (PHPMailerException $e) {
            $this->logger->error('Failed to send contact email', [
                'from'  => $email,
                'error' => $mailer->ErrorInfo ?: $e->getMessage(),
            ]);
            throw new RuntimeException('メール送信に失敗しました', 0, $e);
        }
    }

    /**
     * 共通のメール送信処理。
     *
     * @param string      $subject     件名
     * @param string|null $purchaseUrl 500円プラン決済ページのURL（無料導線のアップセル用。有料完了メールでは null）
     * @param bool        $permanent   true の場合、結果URLが無期限である旨を本文に表示する（500円プラン購入者）
     *
     * @throws RuntimeException SMTP未設定・送信失敗時
     */
    private function send(
        string $toEmail,
        string $resultUrl,
        array $diagnosis,
        string $subject,
        ?string $purchaseUrl = null,
        bool $permanent = false
    ): void {
        $host = $_ENV['MAIL_HOST'] ?? '';
        if ($host === '') {
            throw new RuntimeException('MAIL_HOST is not configured (.env). メール送信設定が未設定です。');
        }

        $score = (int) ($diagnosis['score'] ?? 0);
        $grade = (string) ($diagnosis['grade'] ?? '-');

        $mailer = new PHPMailer(true);

        try {
            $mailer->isSMTP();
            $mailer->Host       = $host;
            $mailer->Port       = (int) ($_ENV['MAIL_PORT'] ?? 587);
            $mailer->CharSet    = PHPMailer::CHARSET_UTF8;

            $username = $_ENV['MAIL_USERNAME'] ?? '';
            $password = $_ENV['MAIL_PASSWORD'] ?? '';
            if ($username !== '') {
                $mailer->SMTPAuth = true;
                $mailer->Username = $username;
                $mailer->Password = $password;
            }

            $encryption = $_ENV['MAIL_ENCRYPTION'] ?? 'tls';
            if ($encryption === 'tls') {
                $mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            } elseif ($encryption === 'ssl') {
                $mailer->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            } else {
                $mailer->SMTPSecure = '';
                $mailer->SMTPAutoTLS = false;
            }

            $fromAddress = $_ENV['MAIL_FROM_ADDRESS'] ?? 'no-reply@example.com';
            $fromName    = $_ENV['MAIL_FROM_NAME'] ?? self::BRAND_NAME;
            $mailer->setFrom($fromAddress, $fromName);
            $mailer->addAddress($toEmail);

            $mailer->isHTML(true);
            $mailer->Subject = $subject;
            $mailer->Body    = $this->renderHtml($resultUrl, $score, $grade, $purchaseUrl, $permanent);
            $mailer->AltBody = $this->renderText($resultUrl, $score, $grade, $purchaseUrl, $permanent);

            $mailer->send();

            $this->logger->info('Result email sent', [
                'to'    => $toEmail,
                'score' => $score,
                'grade' => $grade,
            ]);
        } catch (PHPMailerException $e) {
            $this->logger->error('Failed to send result email', [
                'to'    => $toEmail,
                'error' => $mailer->ErrorInfo ?: $e->getMessage(),
            ]);
            throw new RuntimeException('メール送信に失敗しました', 0, $e);
        }
    }

    /**
     * HTMLメール本文をレンダリングする。
     */
    private function renderHtml(string $resultUrl, int $score, string $grade, ?string $purchaseUrl = null, bool $permanent = false): string
    {
        $brandName  = self::BRAND_NAME;
        $gradeLabel = $this->gradeLabel($grade);
        $logoUrl    = $this->logoUrl();

        ob_start();
        require __DIR__ . '/templates/result_email.php';
        return (string) ob_get_clean();
    }

    /**
     * プレーンテキスト代替本文。
     */
    private function renderText(string $resultUrl, int $score, string $grade, ?string $purchaseUrl = null, bool $permanent = false): string
    {
        // 500円プラン購入完了メール（買い切り＝無期限）かどうかで本文を出し分ける。
        $isPaid = $permanent;

        if ($isPaid) {
            $lines = [
                self::BRAND_NAME . ' 詳細レポートのご案内',
                '',
                'この度は詳細レポート（500円プラン）をご購入いただきありがとうございます。',
                'フル診断結果と具体的な改善アドバイスがすべてご確認いただけるようになりました。',
                '',
                '詳細レポートを見る:',
                $resultUrl,
                '',
                '※上記URLは買い切りプランのため、期限なくいつでもご確認いただけます。',
                '',
                '【診断内容サマリー】',
            ];
        } else {
            $lines = [
                self::BRAND_NAME . ' 資産形成診断結果のご案内',
                '',
                'この度は資産形成診断をご利用いただきありがとうございます。',
                'お客様の診断結果がご確認いただけるようになりました。',
                '',
                '診断結果を見る:',
                $resultUrl,
                '',
                '※上記URLは本メール送信後7日間有効です。',
                '',
                '【診断内容サマリー（途中結果）】',
            ];
        }

        $lines[] = '総合スコア: ' . $score . '/100';
        $lines[] = '総合ランク: ' . $grade . ' ランク';
        $lines[] = 'ライフプラン充実度: ' . $this->gradeLabel($grade);

        // 無料導線のみ: 500円プランへのアップセル
        if ($purchaseUrl !== null && $purchaseUrl !== '') {
            $lines[] = '';
            $lines[] = '──────────────────';
            $lines[] = '＼ もっと詳しく知りたい方へ ／';
            $lines[] = '500円で詳細レポートをGET！（税込・買い切り）';
            $lines[] = 'フル診断結果と具体的な改善アドバイスをすべて公開します。';
            $lines[] = '今すぐ購入する:';
            $lines[] = $purchaseUrl;
            $lines[] = '──────────────────';
        }

        $lines[] = '';
        $lines[] = '本診断結果ページはお客様だけがアクセスできるプライベートURLです。';
        $lines[] = '第三者に共有しないようご注意ください。';

        return implode("\n", $lines);
    }

    /**
     * メール内に表示するロゴ画像の公開URL。
     *
     * MAIL_LOGO_URL が設定されていればそれを使用し、
     * 未設定なら FRONTEND_URL/images/nohoke_logo.png にフォールバックする。
     * 外部ホスト方式のため、メールクライアントで表示可能な PNG を参照する
     * （SVG は多くのメールクライアントで表示できない）。
     */
    private function logoUrl(): string
    {
        $logoUrl = trim((string) ($_ENV['MAIL_LOGO_URL'] ?? ''));
        if ($logoUrl !== '') {
            return $logoUrl;
        }

        $frontendUrl = $_ENV['FRONTEND_URL'] ?? $_ENV['APP_URL'] ?? '';
        return rtrim($frontendUrl, '/') . '/images/nohoke_logo.png';
    }

    /**
     * ランク（A/B/C/D/E）→ ライフプラン充実度の文言。
     */
    private function gradeLabel(string $grade): string
    {
        return match (strtoupper($grade)) {
            'A'     => '非常に良好',
            'B'     => '良好',
            'C'     => '標準',
            'D'     => '要改善',
            'E'     => '要見直し',
            default => '-',
        };
    }
}
