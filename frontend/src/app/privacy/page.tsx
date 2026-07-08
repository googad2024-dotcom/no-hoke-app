import type { Metadata } from "next";
import LegalLayout, { LegalSection, Todo } from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "プライバシーポリシー | NoHoKe",
  description: "NoHoKe（資産形成診断）における個人情報の取扱いについて。",
};

/**
 * プライバシーポリシー（雛形）。
 * 本文は事業／法務側で確定のうえ、<Todo> 箇所を実値へ差し替えること。
 */
export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="プライバシーポリシー" updatedAt="2026-07-06">
      <p className="text-sm leading-relaxed text-gray-600">
        <Todo>事業者名</Todo>
        （以下「当社」といいます）は、資産形成診断サービス「NoHoKe」（以下「本サービス」といいます）における
        利用者の個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
      </p>

      <LegalSection heading="1. 事業者情報">
        <p>事業者名：<Todo>事業者名</Todo></p>
        <p>所在地：<Todo>所在地</Todo></p>
        <p>個人情報保護管理責任者：<Todo>責任者名・役職</Todo></p>
      </LegalSection>

      <LegalSection heading="2. 取得する情報">
        <p>本サービスは、以下の情報を取得します。</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>メールアドレス（診断結果の配信・購入時の連絡のため）</li>
          <li>
            診断入力データ（年齢、未成年の扶養人数、手取り月収、毎月固定費、現預金額、毎月保険料）
          </li>
          <li>
            決済関連情報（購入履歴・決済ステータス等。カード情報は当社では保持せず、決済代行事業者
            Stripe が取り扱います）
          </li>
          <li>アクセスログ等の技術情報</li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. 利用目的">
        <ul className="list-disc space-y-1 pl-5">
          <li>診断結果の生成・表示・メール配信のため</li>
          <li>有料プランの決済・本人への連絡のため</li>
          <li>専門家相談（TimeRex）への予約連携のため</li>
          <li>お問い合わせ対応、本サービスの改善・不正防止のため</li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. 第三者提供">
        <p>
          当社は、法令に基づく場合を除き、あらかじめ利用者の同意を得ることなく個人情報を第三者に提供しません。
        </p>
      </LegalSection>

      <LegalSection heading="5. 外部サービスへの提供・委託">
        <p>本サービスは、以下の外部サービスを利用します。各社への情報の取扱いは各社の定めに従います。</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Stripe（決済処理）：メールアドレス等</li>
          <li>Google（診断ログの記録・スプレッドシート連携）：メールアドレス等</li>
          <li>メール配信（SMTP）：メールアドレス</li>
          <li>TimeRex（相談予約）：予約に必要な情報</li>
        </ul>
      </LegalSection>

      <LegalSection heading="6. 個人情報の保管期間">
        <p>
          当社は、利用目的の達成に必要な期間、個人情報を保管します。保管期間の上限は
          <Todo>保持期間（例：90日）</Todo>とし、期間経過後は遅滞なく削除または匿名化します。
        </p>
      </LegalSection>

      <LegalSection heading="7. 開示・訂正・利用停止・消去等の請求">
        <p>
          利用者は、当社が保有する自己の個人情報について、開示・訂正・追加・削除・利用停止・第三者提供の停止を
          請求できます。請求は下記のお問い合わせ窓口までご連絡ください。本人確認のうえ、法令に従い対応します。
        </p>
      </LegalSection>

      <LegalSection heading="8. 安全管理措置">
        <p>
          当社は、取得した個人情報の漏えい・滅失・毀損の防止その他の安全管理のため、必要かつ適切な措置を講じます。
        </p>
      </LegalSection>

      <LegalSection heading="9. お問い合わせ窓口">
        <p id="contact">
          本ポリシーおよび個人情報の取扱いに関するお問い合わせは、下記までご連絡ください。
        </p>
        <p>お問い合わせ先：<Todo>メールアドレス または フォームURL</Todo></p>
      </LegalSection>

      <LegalSection heading="10. 本ポリシーの改定">
        <p>
          当社は、必要に応じて本ポリシーを改定することがあります。重要な変更を行う場合は、本サービス上でお知らせします。
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
