"use client";

import type { AppTitleProps } from "./type";

/**
 * アプリケーションタイトルコンポーネント
 *
 * @description
 * Sonoryアプリケーションのタイトルを表示するAtomコンポーネント
 * 音の波形をイメージしたグラデーションとアニメーションを含む
 *
 * @param className クラス名
 *
 * @example
 * ```tsx
 * <AppTitle />
 * ```
 */
export function AppTitle({ className = "" }: AppTitleProps) {
	return (
		<div className={`relative ${className}`}>
			{/* 音波エフェクト */}
			<div className="absolute inset-0 -z-10">
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-blue-400/20 rounded-full blur-2xl animate-pulse" />
			</div>

			{/* タイトル */}
			<h1 className="relative text-3xl font-bold tracking-tight">
				<span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
					Sonory
				</span>
				<span className="absolute -bottom-1 left-0 w-full h-px bg-gradient-to-r from-purple-400/50 to-blue-400/50 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
			</h1>

			{/* サブテキスト */}
			<p className="text-xs text-gray-500 mt-1 font-medium tracking-wider">
				10秒の軌跡印
			</p>
		</div>
	);
}
