import type { Metadata } from "next";
import LegalLayout, { LegalSection, Todo } from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | NoHoKe",
  description: "NoHoKe 有料プランに関する特定商取引法に基づく表記。",
};

/**
 * 特定商取引法に基づく表記（雛形）。
 * 有料販売（500円プラン）があるため掲示は法的必須。
 * <Todo> 箇所は事業者情報として必ず実値へ差し替えること。
 */
export default function TokushohoPage() {
  return (
    <LegalLayout title="特定商取引法に基づく表記" updatedAt="2026-07-06">
      <LegalSection heading="販売事業者">
        <p><Todo>事業者名 / 屋号</Todo></p>
      </LegalSection>

      <LegalSection heading="運営統括責任者">
        <p><Todo>責任者氏名</Todo></p>
      </LegalSection>

      <LegalSection heading="所在地">
        <p><Todo>所在地（住所）</Todo></p>
      </LegalSection>

      <LegalSection heading="電話番号">
        <p>
          <Todo>電話番号</Todo>
          （受付時間：<Todo>受付時間</Todo>）
        </p>
      </LegalSection>

      <LegalSection heading="メールアドレス">
        <p><Todo>連絡先メールアドレス</Todo></p>
      </LegalSection>

      <LegalSection heading="販売価格">
        <p>500円（税込）／買い切り。各商品ページに表示します。</p>
      </LegalSection>

      <LegalSection heading="商品代金以外の必要料金">
        <p>本サービスの利用・閲覧に必要なインターネット接続料金、通信料金等はお客様のご負担となります。</p>
      </LegalSection>

      <LegalSection heading="支払方法">
        <p>クレジットカード決済（決済代行：Stripe）。</p>
      </LegalSection>

      <LegalSection heading="支払時期">
        <p>お申し込み時（決済確定時）にお支払いが確定します。</p>
      </LegalSection>

      <LegalSection heading="役務の提供時期">
        <p>
          決済完了後ただちに、フル診断結果を閲覧できるURLを画面に表示し、登録メールアドレス宛に送信します。
        </p>
      </LegalSection>

      <LegalSection heading="返品・キャンセル（返金）について">
        <p>
          商品の性質上、決済完了後の返品・キャンセルは原則お受けできません。ただし
          <Todo>返金対応の条件（例：正常に閲覧できない場合等）</Todo>
          については、上記お問い合わせ先までご連絡ください。
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
