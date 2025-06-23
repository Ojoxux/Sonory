"use client";

/**
 * ローディングスピナーコンポーネント
 *
 * @description
 * 処理中を示すスピナーアニメーションのAtomコンポーネント
 *
 * @example
 * ```tsx
 * <LoadingSpinner />
 * ```
 */
export function LoadingSpinner() {
	return (
		<div className="relative w-10 h-10 mx-auto">
			<div className="absolute inset-0 rounded-full border-[3px] border-white/20 border-t-white animate-spin" />
		</div>
	);
}
