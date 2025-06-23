"use client";

import type { FloatingIndicatorProps } from "./type";

/**
 * フローティングインジケーターコンポーネント
 *
 * @description
 * 音の波形をイメージした浮遊するアニメーション効果を持つインジケーター
 * 録音ボタンの下に配置され、UIに動きと深みを与える
 *
 * @param className クラス名
 *
 * @example
 * ```tsx
 * <FloatingIndicator />
 * ```
 */
export function FloatingIndicator({ className = "" }: FloatingIndicatorProps) {
	return (
		<div className={`flex items-center justify-center gap-1 ${className}`}>
			{/* 音波バー */}
			<div className="flex items-center gap-1">
				<div className="w-1 h-4 bg-gradient-to-t from-purple-400/60 to-purple-600/60 rounded-full animate-wave-1" />
				<div className="w-1 h-6 bg-gradient-to-t from-blue-400/60 to-blue-600/60 rounded-full animate-wave-2" />
				<div className="w-1 h-5 bg-gradient-to-t from-purple-400/60 to-purple-600/60 rounded-full animate-wave-3" />
				<div className="w-1 h-7 bg-gradient-to-t from-blue-400/60 to-blue-600/60 rounded-full animate-wave-4" />
				<div className="w-1 h-4 bg-gradient-to-t from-purple-400/60 to-purple-600/60 rounded-full animate-wave-5" />
			</div>
		</div>
	);
}
