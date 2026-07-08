"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "color-gray-mode";

/** グレー版が存在しない（404）と分かった画像URL。再試行ループを防ぐ。 */
const missingGray = new Set<string>();

/** 1つの画像URLをグレー版（同名 + "-gray"）へ／から変換する。 */
function swapSrc(src: string, gray: boolean): string {
  if (!src) return src;

  // next/image の最適化URL（url= に元パスがエンコードされている）
  if (src.includes("/_next/image") && src.includes("url=")) {
    try {
      const u = new URL(src, window.location.origin);
      const inner = u.searchParams.get("url");
      if (inner) {
        u.searchParams.set("url", swapSrc(inner, gray));
        return u.pathname + "?" + u.searchParams.toString();
      }
    } catch {
      /* noop */
    }
    return src;
  }

  if (gray) {
    if (/-gray(\.[a-zA-Z0-9]+)$/.test(src)) return src; // すでにグレー
    return src.replace(/(\.[a-zA-Z0-9]+)$/, "-gray$1");
  }
  return src.replace(/-gray(\.[a-zA-Z0-9]+)$/, "$1");
}

/** srcset 全体を変換 */
function swapSrcset(srcset: string, gray: boolean): string {
  return srcset
    .split(",")
    .map((part) => {
      const seg = part.trim();
      const sp = seg.indexOf(" ");
      const url = sp === -1 ? seg : seg.slice(0, sp);
      const desc = sp === -1 ? "" : seg.slice(sp);
      return swapSrc(url, gray) + desc;
    })
    .join(", ");
}

/** background-image の url(...) を全て変換 */
function swapBg(bg: string, gray: boolean): string {
  return bg.replace(
    /url\((['"]?)(.*?)\1\)/g,
    (_m, q: string, url: string) => `url(${q}${swapSrc(url, gray)}${q})`
  );
}

/** /images/ 配下を参照する画像URLか（next/image の最適化URL含む） */
function isTargetSrc(src: string): boolean {
  const s = src.toLowerCase();
  return s.includes("/images/") || s.includes("%2fimages%2f");
}

/**
 * ドキュメント全体の画像（<img> / srcset / CSS・インライン background-image）を
 * グレー⇔カラーで切り替える。
 * 状態は持たず、常に「現在の src」を基準に変換するため、
 * ステップ切り替え等で src が変わっても正しく追従する（idempotent）。
 * 実際に値が変わるときだけ書き込み、MutationObserver のループを防ぐ。
 */
function applyGray(on: boolean) {
  // <img>（next/image を含む）
  document.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    const src = img.getAttribute("src");
    if (!src || !isTargetSrc(src)) return;

    // グレー版が無いと分かっている画像（ロゴ等）はカラーのまま
    const colorKey = swapSrc(src, false);
    if (on && missingGray.has(colorKey)) return;

    const targetSrc = swapSrc(src, on);
    if (targetSrc !== src) {
      if (on) {
        // グレー画像が 404 ならカラーへ戻し、以後は再試行しない
        img.onerror = () => {
          img.onerror = null;
          missingGray.add(colorKey);
          img.setAttribute("src", colorKey);
          const ss = img.getAttribute("srcset");
          if (ss) img.setAttribute("srcset", swapSrcset(ss, false));
        };
      } else {
        img.onerror = null;
      }
      img.setAttribute("src", targetSrc);
    }

    const srcset = img.getAttribute("srcset");
    if (srcset) {
      const targetSet = swapSrcset(srcset, on);
      if (targetSet !== srcset) img.setAttribute("srcset", targetSet);
    }
  });

  // CSS / インラインの background-image
  document.querySelectorAll<HTMLElement>("*").forEach((el) => {
    if (on) {
      const bg = getComputedStyle(el).backgroundImage;
      if (!bg || bg === "none" || !bg.includes("/images/")) return;
      const target = swapBg(bg, true);
      if (target !== bg) el.style.backgroundImage = target;
    } else if (el.style.backgroundImage.includes("-gray")) {
      // 自前で付けたグレー上書きを除去 → スタイルシートのカラー値へ戻す
      el.style.backgroundImage = "";
    }
  });
}

type ColorContextValue = {
  gray: boolean;
  toggle: () => void;
};

const ColorContext = createContext<ColorContextValue>({
  gray: false,
  toggle: () => {},
});

/** 各ヘッダーの Color ボタンから状態を共有するためのフック */
export function useColorMode() {
  return useContext(ColorContext);
}

export default function ColorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [gray, setGray] = useState(false);
  const grayRef = useRef(false);

  // 初期化（localStorage から復元）
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) === "1";
    grayRef.current = saved;
    setGray(saved);
  }, []);

  // 状態が変わったら適用＋保存
  useEffect(() => {
    grayRef.current = gray;
    applyGray(gray);
    // 青系を含む全色をグレー化（CSS: html.gray-mode body { filter: grayscale(1) }）
    document.documentElement.classList.toggle("gray-mode", gray);
    localStorage.setItem(STORAGE_KEY, gray ? "1" : "0");
  }, [gray]);

  // 画面遷移・再レンダリングで DOM が差し替わっても再適用
  useEffect(() => {
    let raf = 0;
    const observer = new MutationObserver(() => {
      if (!grayRef.current) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => applyGray(true));
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "style", "class"],
    });
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  const toggle = useCallback(() => setGray((g) => !g), []);

  return (
    <ColorContext.Provider value={{ gray, toggle }}>
      {children}
    </ColorContext.Provider>
  );
}
