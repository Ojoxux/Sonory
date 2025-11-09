/**
 * アニメーション設定を取得するヘルパー関数群
 */

type AnimationConfig = {
   initial: Record<string, number | string>
   animate: Record<string, number | string>
   transition: Record<string, number | string | readonly number[]>
}

/**
 * コンテナのアニメーション設定を取得
 */
export function getContainerAnimation(isClosing: boolean): AnimationConfig {
   return {
      initial: { opacity: 0, scale: 0.95 },
      animate: isClosing
         ? { opacity: 0, scale: 0.95 }
         : { opacity: 1, scale: 1 },
      transition: {
         duration: isClosing ? 0.3 : 0.4,
         ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
   }
}

/**
 * チェックマークコンテナのアニメーション設定を取得
 */
export function getCheckmarkContainerAnimation(
   isClosing: boolean,
): AnimationConfig {
   return {
      initial: { scale: 0, opacity: 0 },
      animate: isClosing ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 },
      transition: {
         delay: isClosing ? 0 : 0.1,
         duration: isClosing ? 0.2 : 0.5,
         ease: [0.175, 0.885, 0.32, 1.275] as const,
      },
   }
}

/**
 * 円形背景のアニメーション設定を取得
 */
export function getCircleBackgroundAnimation(
   isClosing: boolean,
): AnimationConfig {
   return {
      initial: { scale: 0 },
      animate: isClosing ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 },
      transition: {
         delay: isClosing ? 0 : 0.2,
         duration: isClosing ? 0.15 : 0.3,
      },
   }
}

/**
 * チェックマークアイコンのアニメーション設定を取得
 */
export function getCheckmarkIconAnimation(isClosing: boolean): AnimationConfig {
   return {
      initial: { scale: 0 },
      animate: isClosing ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 },
      transition: {
         delay: isClosing ? 0 : 0.3,
         duration: isClosing ? 0.2 : 0.4,
      },
   }
}

/**
 * チェックマークパスのアニメーション設定を取得
 */
export function getCheckmarkPathAnimation(isClosing: boolean): AnimationConfig {
   return {
      initial: { pathLength: 0, opacity: 0 },
      animate: isClosing
         ? { pathLength: 0, opacity: 0 }
         : { pathLength: 1, opacity: 1 },
      transition: {
         delay: isClosing ? 0 : 0.5,
         duration: isClosing ? 0.1 : 0.6,
         ease: "easeInOut" as const,
      },
   }
}

/**
 * メッセージのアニメーション設定を取得
 */
export function getMessageAnimation(isClosing: boolean): AnimationConfig {
   return {
      initial: { opacity: 0, y: 20 },
      animate: isClosing ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 },
      transition: {
         delay: isClosing ? 0 : 0.7,
         duration: isClosing ? 0.2 : 0.4,
      },
   }
}

/**
 * 段落のアニメーション設定を取得
 */
export function getParagraphAnimation(isClosing: boolean): AnimationConfig {
   return {
      initial: { opacity: 0 },
      animate: isClosing ? { opacity: 0 } : { opacity: 1 },
      transition: {
         delay: isClosing ? 0 : 0.9,
         duration: isClosing ? 0.1 : 0.4,
      },
   }
}
