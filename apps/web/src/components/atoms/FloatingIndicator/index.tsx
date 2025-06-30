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
				<div className="h-4 w-1 animate-wave-1 rounded-full bg-gradient-to-t from-purple-400/60 to-purple-600/60" />
				<div className="h-6 w-1 animate-wave-2 rounded-full bg-gradient-to-t from-blue-400/60 to-blue-600/60" />
				<div className="h-5 w-1 animate-wave-3 rounded-full bg-gradient-to-t from-purple-400/60 to-purple-600/60" />
				<div className="h-7 w-1 animate-wave-4 rounded-full bg-gradient-to-t from-blue-400/60 to-blue-600/60" />
				<div className="h-4 w-1 animate-wave-5 rounded-full bg-gradient-to-t from-purple-400/60 to-purple-600/60" />
			</div>
		</div>
	);
}
