<?php
/**
 * 診断結果案内メール HTMLテンプレート（012.png デザイン / NoHoKe ブランド）
 *
 * MailService から output buffering で include される。
 * 以下の変数がスコープに存在する想定:
 *
 * @var string $brandName   ブランド名（NoHoKe）
 * @var string $resultUrl   診断結果フルページのURL
 * @var int    $score       総合スコア（0〜100）
 * @var string $grade       総合ランク（A/B/C/D/E）
 * @var string $gradeLabel  ライフプラン充実度の文言（良好 など）
 * @var string $logoUrl     ロゴ画像（PNG）の公開URL
 * @var ?string $purchaseUrl 500円プラン決済ページURL（無料導線のみ指定。指定時のみアップセルを表示）
 * @var bool    $permanent   true の場合、結果URLが無期限である旨を表示（500円プラン購入者）
 *
 * 注意: メールクライアント互換のためテーブルレイアウト＋インラインCSSのみを使用する。
 *       ロゴのみ外部ホストのPNGを参照（受信側で画像ブロックされた場合は alt 文言を表示）。
 */

$primary = '#436cb0';
$primaryDark = '#365a96';
$bg = '#f8fafd';
$border = '#e6ebf3';
$textDark = '#1f2937';
$textGray = '#6b7280';
$e = static fn (string $s): string => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
$purchaseUrl = $purchaseUrl ?? null;
$permanent = $permanent ?? false;

// 500円プラン購入完了メールかどうか（買い切り＝無期限アクセスのため $permanent で判定）。
// 無料（途中結果案内）と有料（フル結果解放）で見出し・リード文・サマリー表記を出し分ける。
$isPaid = $permanent;

$subHeading  = $isPaid ? 'ご購入ありがとうございます' : 'あなたの資産形成の可能性を見える化しました';
$heading     = $isPaid ? '詳細レポートのご案内' : '診断結果のご案内';
$summaryNote = $isPaid ? '診断内容サマリー' : '診断内容サマリー（途中結果）';
$ctaLabel    = $isPaid ? '詳細レポートを見る' : '診断結果を見る';
?>
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= $e($brandName) ?> <?= $e($heading) ?></title>
</head>
<body style="margin:0; padding:0; background-color:<?= $bg ?>; font-family:'Hiragino Kaku Gothic ProN','Meiryo',sans-serif; color:<?= $textDark ?>; -webkit-text-size-adjust:100%;">
  <!-- 上部注意バー -->
  <div style="background-color:#eef2f8; color:<?= $textGray ?>; font-size:11px; text-align:center; padding:8px 16px;">
    このメールにお心当たりがない場合は、破棄してください。
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:<?= $bg ?>; padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border:1px solid <?= $border ?>; border-radius:16px; overflow:hidden;">

          <!-- ヘッダー: ロゴ + セキュリティ -->
          <tr>
            <td style="padding:20px 28px; border-bottom:1px solid <?= $border ?>;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:20px; font-weight:bold; color:<?= $textDark ?>;">
                    <img src="<?= $e($logoUrl) ?>" alt="<?= $e($brandName) ?>" width="140" height="46" style="display:block; width:140px; height:auto; border:0; outline:none; text-decoration:none;">
                  </td>
                  <td align="right" style="font-size:12px; color:<?= $primary ?>;">
                    &#128274; 安心のセキュリティ
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 見出し -->
          <tr>
            <td style="padding:32px 28px 8px 28px; text-align:center;">
              <div style="font-size:13px; color:<?= $primary ?>; font-weight:600; margin-bottom:8px;">
                <?= $e($subHeading) ?>
              </div>
              <h1 style="margin:0; font-size:26px; font-weight:bold; color:<?= $textDark ?>;">
                <?= $e($heading) ?>
              </h1>
            </td>
          </tr>

          <!-- リード文 -->
          <tr>
            <td style="padding:16px 36px 8px 36px; text-align:left; font-size:14px; line-height:1.9; color:<?= $textGray ?>;">
              <p style="margin:0 0 4px 0;">お客様</p>
              <?php if ($isPaid): ?>
              <p style="margin:0;">
                この度は、<?= $e($brandName) ?> の詳細レポート（500円プラン）をご購入いただき、誠にありがとうございます。<br>
                フル診断結果と具体的な改善アドバイスがすべてご確認いただけるようになりました。<br>
                下記のボタンより、詳細レポートをご覧ください。
              </p>
              <?php else: ?>
              <p style="margin:0;">
                この度は、<?= $e($brandName) ?> の資産形成診断をご利用いただき、誠にありがとうございます。<br>
                お客様の診断結果がご確認いただけるようになりました。<br>
                下記のボタンより結果をご覧ください。
              </p>
              <?php endif; ?>
            </td>
          </tr>

          <!-- イラスト代替（CSS図形のエンベロープ風バッジ） -->
          <tr>
            <td style="padding:20px 28px; text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="width:120px; height:80px; background-color:<?= $primary ?>; border-radius:12px; text-align:center; vertical-align:middle; font-size:40px; color:#ffffff;">
                    &#9993;
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 確認方法カード + CTA -->
          <tr>
            <td style="padding:8px 28px 4px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:<?= $bg ?>; border:1px solid <?= $border ?>; border-radius:12px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:14px; font-weight:bold; color:<?= $textDark ?>; margin-bottom:6px;">
                      &#128279; 診断結果の確認方法
                    </div>
                    <div style="font-size:12px; color:<?= $textGray ?>; line-height:1.7;">
                      下記のボタンまたはリンクより、診断結果の詳細にいつでもアクセスできます。
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTAボタン -->
          <tr>
            <td style="padding:18px 28px 6px 28px; text-align:center;">
              <a href="<?= $e($resultUrl) ?>" target="_blank"
                 style="display:inline-block; background-color:<?= $primary ?>; color:#ffffff; font-size:16px; font-weight:bold; text-decoration:none; padding:16px 48px; border-radius:10px;">
                <?= $e($ctaLabel) ?> &nbsp;&rarr;
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 8px 28px; text-align:center; font-size:11px; color:<?= $textGray ?>;">
              <?php if ($permanent): ?>
              ※上記のボタンは買い切りプランのため、期限なくいつでもご利用いただけます。
              <?php else: ?>
              ※上記のボタンは、本メール送信後7日間有効です。
              <?php endif; ?>
            </td>
          </tr>

          <!-- 診断内容サマリー -->
          <tr>
            <td style="padding:16px 28px;">
              <div style="font-size:14px; font-weight:bold; color:<?= $textDark ?>; margin-bottom:12px;">
                <?= $e($summaryNote) ?>
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid <?= $border ?>; border-radius:12px;">
                <tr>
                  <td width="33%" style="padding:16px 8px; text-align:center; border-right:1px solid <?= $border ?>;">
                    <div style="font-size:11px; color:<?= $textGray ?>; margin-bottom:6px;">総合スコア</div>
                    <div style="font-size:22px; font-weight:bold; color:<?= $primary ?>;"><?= (int) $score ?><span style="font-size:12px; color:<?= $textGray ?>;">/100</span></div>
                  </td>
                  <td width="33%" style="padding:16px 8px; text-align:center; border-right:1px solid <?= $border ?>;">
                    <div style="font-size:11px; color:<?= $textGray ?>; margin-bottom:6px;">総合ランク</div>
                    <div style="font-size:22px; font-weight:bold; color:<?= $textDark ?>;"><?= $e($grade) ?> ランク</div>
                  </td>
                  <td width="33%" style="padding:16px 8px; text-align:center;">
                    <div style="font-size:11px; color:<?= $textGray ?>; margin-bottom:6px;">ライフプラン充実度</div>
                    <div style="font-size:16px; font-weight:bold; color:<?= $textDark ?>;"><?= $e($gradeLabel) ?></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

<?php if (!empty($purchaseUrl)): ?>
          <!-- アップセル: 500円プラン（無料導線のみ表示） -->
          <tr>
            <td style="padding:12px 28px 8px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:<?= $primary ?>; border-radius:14px;">
                <tr>
                  <td style="padding:24px 24px;">
                    <div style="font-size:12px; color:#dce6f6; font-weight:600; margin-bottom:6px; text-align:center;">
                      ＼ もっと詳しく知りたい方へ ／
                    </div>
                    <div style="font-size:21px; font-weight:bold; color:#ffffff; text-align:center; line-height:1.5; margin-bottom:8px;">
                      500円で詳細レポートをGET！
                    </div>
                    <div style="font-size:13px; color:#eaf1fb; text-align:center; line-height:1.8; margin-bottom:16px;">
                      あなたの資産形成のフル診断結果と<br>
                      具体的な改善アドバイスをすべて公開します。
                    </div>
                    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
                      <tr><td style="font-size:13px; color:#ffffff; padding:3px 0;">&#10003;&nbsp; フル診断結果の解放</td></tr>
                      <tr><td style="font-size:13px; color:#ffffff; padding:3px 0;">&#10003;&nbsp; 改善ポイントの詳しい解説</td></tr>
                      <tr><td style="font-size:13px; color:#ffffff; padding:3px 0;">&#10003;&nbsp; 専門家への相談予約</td></tr>
                    </table>
                    <div style="text-align:center; margin-top:20px;">
                      <a href="<?= $e($purchaseUrl) ?>" target="_blank"
                         style="display:inline-block; background-color:#ffffff; color:<?= $primaryDark ?>; font-size:16px; font-weight:bold; text-decoration:none; padding:15px 44px; border-radius:10px;">
                        500円で詳細を見る &nbsp;&rarr;
                      </a>
                    </div>
                    <div style="text-align:center; font-size:11px; color:#cdd9ef; margin-top:10px;">
                      税込・買い切り
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
<?php endif; ?>

          <!-- セキュリティ注意ボックス -->
          <tr>
            <td style="padding:8px 28px 20px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f6ff; border:1px solid #d6e4f7; border-radius:12px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <div style="font-size:13px; font-weight:bold; color:<?= $textDark ?>; margin-bottom:6px;">
                      &#128274; 安心・安全のお取り扱い
                    </div>
                    <div style="font-size:12px; color:<?= $textGray ?>; line-height:1.7;">
                      本診断結果ページは、お客様だけがアクセスできるセキュアなプライベートURLです。
                      第三者に共有しないようご注意ください。
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- フッター -->
          <tr>
            <td style="padding:20px 28px; background-color:<?= $bg ?>; border-top:1px solid <?= $border ?>; text-align:center;">
              <div style="margin-bottom:8px;">
                <img src="<?= $e($logoUrl) ?>" alt="<?= $e($brandName) ?>" width="120" height="39" style="display:inline-block; width:120px; height:auto; border:0; outline:none; text-decoration:none;">
              </div>
              <div style="font-size:11px; color:<?= $textGray ?>; margin-bottom:8px;">
                プライバシーポリシー&nbsp;&nbsp;|&nbsp;&nbsp;利用規約&nbsp;&nbsp;|&nbsp;&nbsp;お問い合わせ
              </div>
              <div style="font-size:11px; color:#9ca3af;">
                &copy; <?= $e($brandName) ?> Inc. All rights reserved.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
