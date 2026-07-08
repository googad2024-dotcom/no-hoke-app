"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import {
  ArrowRight,
  Shield,
  Users,
  Star,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();

  const handleStartDiagnosis = () => {
    router.push("/diagnosis");
  };

  return (
    <div
      className={`flex-1 flex flex-col bg-gradient-to-b from-blue-50/30 to-white xl:flex-none xl:h-[calc(100dvh-81px)] xl:min-h-0 xl:overflow-hidden`}
    >
      <Header />

      {/* 1画面に収めるため、Header と Footer を除いた領域を Hero＋実績で分け合う */}
      <div className="flex-1 min-h-0 flex flex-col">
      {/* Hero Section */}
      <section
        className={`w-full flex-1 min-h-0 flex items-center py-6 ${styles.heroImage}`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid xl:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-700 hover:bg-blue-100"
              >
                <Shield className="w-3 h-3 mr-1" />
                5分で完了・無料診断
              </Badge>

              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-gray-900">
                  あなたの
                  <br />
                  お金の<span className="text-blue-600">流動性を</span>診断して
                  <br />
                  <span className="text-blue-600">自由に使えるお金</span>を
                  <br />
                  見える化
                </h1>

                <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                  将来のライフプランや資産状況をもとに、
                  <br />
                  あなたに最適な資産形成プランをご提案します。
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white h-16 px-20 text-lg rounded-full w-full md:w-auto"
                  onClick={handleStartDiagnosis}
                >
                  診断をはじめる
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <p className="flex items-center gap-2 text-sm text-gray-500">
                  <Shield className="w-4 h-4" />
                  入力内容は暗号化され、安全に保護されます
                </p>
              </div>
            </div>

            {/* Right Content - Illustration */}
            {/* デスクトップは heroImage の背景画像、モバイルは実画像で縦積み表示 */}
            <div className="relative">
              <img
                src="/images/s-001.png"
                alt=""
                className="w-full xl:hidden"
              />
            </div>
          </div>
        </div>
        <p className={`${styles.subText} hidden xl:block`}>
          多くの方にご利用いただいています。
        </p>
      </section>

      {/* Trust Section（1画面に収めるためコンパクト表示） */}
      <section className="shrink-0 bg-white py-4 border-t">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto">
            {/* Stat 1 */}
            <div className="flex flex-col items-center text-center gap-0.5">
              <div className="bg-blue-100 rounded-full p-2 mb-1">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-xs text-gray-600">診断実績</div>
              <div className="text-xl md:text-2xl font-bold text-blue-600">
                50,000
                <span className="text-xs font-normal text-gray-500 ml-1">
                  人突破
                </span>
              </div>
              <div className="text-[10px] text-gray-400">※2024年5月時点</div>
            </div>

            {/* Stat 2 */}
            <div className="flex flex-col items-center text-center gap-0.5">
              <div className="bg-blue-100 rounded-full p-2 mb-1">
                <Lock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-xs text-gray-600">セキュリティ</div>
              <div className="text-base md:text-lg font-bold text-blue-600">
                金融機関レベル
              </div>
              <div className="text-[10px] text-gray-400">の暗号化技術を採用</div>
            </div>

            {/* Stat 3 */}
            <div className="flex flex-col items-center text-center gap-0.5">
              <div className="bg-blue-100 rounded-full p-2 mb-1">
                <Star className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-xs text-gray-600">顧客満足度</div>
              <div className="text-xl md:text-2xl font-bold text-blue-600">
                4.8
                <span className="text-xs font-normal text-gray-500 ml-1">
                  / 5.0
                </span>
              </div>
              <div className="text-[10px] text-gray-400">※自社調べ</div>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
