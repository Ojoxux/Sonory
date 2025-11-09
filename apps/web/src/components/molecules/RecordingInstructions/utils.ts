/**
 * デスクトップ用の高さを取得する
 */
export function getDesktopHeight(): string {
   return typeof window !== "undefined" && window.innerWidth >= 640
      ? "5rem"
      : "4rem"
}

/**
 * コンテナの初期アニメーション設定を取得
 */
export function getInitialAnimation() {
   return {
      width: "12rem",
      height: getDesktopHeight(),
      backgroundColor: "rgba(0, 0, 0, 0.95)",
      borderRadius: "2rem",
      scale: 1,
   }
}

/**
 * 閉じる時のアニメーション設定を取得
 */
export function getClosingAnimation() {
   return {
      height: ["auto", getDesktopHeight()],
      width: ["90vw", "12rem"],
      backgroundColor: ["rgba(30, 30, 30, 0.95)", "rgba(0, 0, 0, 0.95)"],
      borderRadius: ["2rem", "2rem"],
      scale: [1, 0.98, 1],
   }
}

/**
 * 開く時のアニメーション設定を取得
 */
export function getOpeningAnimation() {
   return {
      width: ["12rem", "90vw"],
      height: [getDesktopHeight(), "auto"],
      backgroundColor: [
         "rgba(0, 0, 0, 0.95)",
         "rgba(20, 20, 20, 0.96)",
         "rgba(30, 30, 30, 0.95)",
      ],
      borderRadius: ["2rem", "1.9rem", "2rem"],
      scale: [1, 1.02, 1],
   }
}

/**
 * 閉じる時のトランジション設定を取得
 */
export function getClosingTransition() {
   return {
      height: {
         duration: 0.6,
         ease: [0.4, 0, 0.2, 1] as const,
      },
      width: {
         duration: 0.6,
         delay: 0.6,
         ease: [0.4, 0, 0.2, 1] as const,
      },
      backgroundColor: {
         duration: 1.2,
         ease: [0.4, 0, 0.2, 1] as const,
      },
      borderRadius: {
         duration: 1.2,
         ease: [0.4, 0, 0.2, 1] as const,
      },
      scale: {
         duration: 1.2,
         ease: [0.4, 0, 0.2, 1] as const,
      },
   }
}

/**
 * 開く時のトランジション設定を取得
 */
export function getOpeningTransition() {
   return {
      width: {
         duration: 0.5,
         ease: [0.4, 0, 0.2, 1] as const,
      },
      height: {
         duration: 0.5,
         delay: 0.5,
         ease: [0.4, 0, 0.2, 1] as const,
      },
      backgroundColor: {
         duration: 1.0,
         ease: [0.4, 0, 0.2, 1] as const,
      },
      borderRadius: {
         duration: 1.0,
         ease: [0.4, 0, 0.2, 1] as const,
      },
      scale: {
         duration: 1.0,
         ease: [0.4, 0, 0.2, 1] as const,
      },
   }
}
