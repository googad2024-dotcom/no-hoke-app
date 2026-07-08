"use client";

import { Button } from "@/components/ui/button";
import { useColorMode } from "@/components/ColorProvider";

/**
 * 各ヘッダーに設置する画像カラー／グレー切り替えボタン。
 * 見た目は非表示（opacity:0）だがクリックは有効なまま。
 */
export default function ColorButton() {
  const { gray, toggle } = useColorMode();
  return (
    <Button
      variant="outline"
      onClick={toggle}
      aria-pressed={gray}
      aria-label="カラー／グレー切り替え"
      tabIndex={-1}
      className="opacity-0"
    >
      {gray ? "Color: OFF" : "Color"}
    </Button>
  );
}
