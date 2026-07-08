import type { Metadata } from "next";
import LegalLayout, { LegalSection, Todo } from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "利用規約 | NoHoKe",
  description: "NoHoKe（資産形成診断）の利用規約。",
};

/**
 * 利用規約（雛形）。本文は事業／法務側で確定のうえ差し替えること。
 */
export default function TermsPage() {
  return (
    <LegalLayout title="利用規約" updatedAt="2026-07-06">
      <p className="text-sm leading-relaxed text-gray-600">
        本利用規約（以下「本規約」といいます）は、
        <Todo>事業者名</Todo>
        （以下「当社」といいます）が提供する資産形成診断サービス「NoHoKe」（以下「本サービス」といいます）の
        利用条件を定めるものです。利用者は、本規約に同意のうえ本サービスを利用するものとします。
      </p>

      <LegalSection heading="第1条（適用）">
        <p>本規約は、本サービスの利用に関する当社と利用者との間の一切の関係に適用されます。</p>
      </LegalSection>

      <LegalSection heading="第2条（本サービスの内容）">
        <p>
          本サービスは、利用者が入力した情報に基づく資産形成に関する参考情報の提供を目的とします。
          診断結果は一般的な情報提供であり、特定の金融商品の推奨・投資助言・保険の募集を行うものではありません。
        </p>
      </LegalSection>

      <LegalSection heading="第3条（有料プラン）">
        <p>
          有料プラン（500円・買い切り）の対価、支払方法、提供時期および返金の取扱いは、
          「特定商取引法に基づく表記」の定めによります。
        </p>
      </LegalSection>

      <LegalSection heading="第4条（禁止事項）">
        <p>利用者は、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>法令または公序良俗に違反する行為</li>
          <li>当社または第三者の権利・利益を侵害する行為</li>
          <li>本サービスの運営を妨害する行為、不正アクセス行為</li>
          <li>虚偽の情報を登録する行為</li>
        </ul>
      </LegalSection>

      <LegalSection heading="第5条（本サービスの提供の停止等）">
        <p>
          当社は、保守・障害・その他運営上必要と判断した場合、利用者に事前に通知することなく本サービスの
          全部または一部の提供を停止または中断できるものとします。
        </p>
      </LegalSection>

      <LegalSection heading="第6条（免責事項）">
        <p>
          当社は、診断結果の正確性・完全性・有用性、および本サービスの利用によって生じた結果について、
          法令で許容される範囲で一切の責任を負いません。最終的な意思決定は利用者ご自身の判断と責任で行うものとします。
        </p>
      </LegalSection>

      <LegalSection heading="第7条（規約の変更）">
        <p>
          当社は、必要と判断した場合、利用者に通知することなく本規約を変更できるものとします。
          変更後の本規約は、本サービス上に表示した時点から効力を生じます。
        </p>
      </LegalSection>

      <LegalSection heading="第8条（準拠法・裁判管轄）">
        <p>
          本規約は日本法に準拠します。本サービスに関して紛争が生じた場合には、
          <Todo>管轄裁判所（例：〇〇地方裁判所）</Todo>
          を第一審の専属的合意管轄裁判所とします。
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
