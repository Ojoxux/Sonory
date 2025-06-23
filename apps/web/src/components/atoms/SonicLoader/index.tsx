"use client";

import { motion } from "framer-motion";
import { CpuIcon } from "lucide-react";
import type { SonicLoaderProps } from "./types";

/**
 * 音響的なローディングコンポーネント
 *
 * @description
 * AI分析中の美しいローディングアニメーション
 * CPUアイコンと光の波紋エフェクトを組み合わせた高品質な演出
 *
 * @param isLoading ローディング中かどうか
 * @param text 表示テキスト
 * @param className 追加のCSSクラス
 *
 * @example
 * ```tsx
 * <SonicLoader isLoading={true} text="音声を分析中..." />
 * ```
 */
export function SonicLoader({
	isLoading = false,
	text = "AIが音を分析しています",
	className = "",
}: SonicLoaderProps) {
	console.log("🔄 SonicLoader レンダリング:", { isLoading, text, className });
	console.log("🔄 SonicLoader CPUアイコン確認:", { CpuIcon: !!CpuIcon });

	// 中央の光のコアの呼吸アニメーションバリアント
	const coreGlowVariants = {
		animate: {
			scale: [1, 1.05, 1], // わずかに拡大・縮小する呼吸効果
			opacity: [0.8, 1, 0.8], // 透明度も呼吸するように変化
			boxShadow: [
				"0 0 20px rgba(0, 170, 255, 0.5), 0 0 10px rgba(0, 255, 255, 0.3)", // 微かなベースの光 (青とシアン)
				"0 0 80px rgba(0, 170, 255, 0.9), 0 0 30px rgba(0, 255, 255, 0.7)", // 強い光 (青とシアン)
				"0 0 20px rgba(0, 170, 255, 0.5), 0 0 10px rgba(0, 255, 255, 0.3)", // 微かなベースの光に戻る
			],
		},
	};

	// 内側の脈動するリングのアニメーションバリアント
	const innerRingVariants = {
		animate: {
			scale: [1, 1.1, 1],
			opacity: [0.8, 1, 0.8],
			transition: {
				duration: 1.5,
				repeat: Number.POSITIVE_INFINITY,
				ease: "easeInOut",
			},
		},
	};

	// 拡張する光の波紋のアニメーションバリアント
	const rippleVariants = {
		initial: { scale: 0.5, opacity: 0.7, rotate: 0 },
		animate: (i: number) => ({
			scale: 3.5, // さらに大きく広がる
			opacity: 0,
			rotate: 360, // 360度回転しながら広がる
			transition: {
				duration: 6, // アニメーションの持続時間を6秒に延長
				ease: "easeOut",
				repeat: Number.POSITIVE_INFINITY,
				repeatDelay: 0.3, // 繰り返し間の遅延
				delay: i * 0.7, // 各波紋の開始をずらす
			},
		}),
	};

	if (!isLoading) {
		console.log("🔄 SonicLoader: isLoadingがfalseのため非表示");
		return null;
	}

	console.log("🔄 SonicLoader: レンダリング開始");

	return (
		<div
			className={`flex flex-col items-center justify-center h-full w-full text-white p-4 rounded-xl shadow-2xl overflow-hidden relative ${className}`}
			style={{
				background:
					"radial-gradient(circle at center, #0A192F 0%, #000000 100%)", // 深い青みがかった放射状グラデーション
			}}
			aria-live="polite"
		>
			{/* 背景の抽象的な光の動き（Sonoryの「記憶」や「データ」の表現） */}
			<motion.div
				className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-cyan-900/20" // 青とシアンのグラデーション
				animate={{
					x: ["-10%", "10%", "-10%"],
					y: ["-10%", "10%", "-10%"],
					opacity: [0.05, 0.15, 0.05],
				}}
				transition={{
					duration: 30, // 30秒に延長
					repeat: Number.POSITIVE_INFINITY,
					ease: "linear",
				}}
				style={{ filter: "blur(10px)" }} // 強くぼかす
			/>

			<div className="relative flex items-center justify-center w-56 h-56">
				{/* コンテナをさらに大きく */}
				{/* 拡張する光の波紋 */}
				{[0, 1, 2, 3, 4].map((i) => (
					<motion.div
						key={i}
						className="absolute inset-0 rounded-full border-2 border-blue-400/40" // 柔らかい青のボーダー
						variants={rippleVariants}
						initial="initial"
						animate="animate"
						custom={i}
						style={{
							filter: "blur(2px)", // ぼかし効果を調整
						}}
					/>
				))}
				{/* 中央の光のコア（CPUアイコンの背後で脈動） */}
				<motion.div
					className="absolute z-10 w-36 h-36 rounded-full bg-transparent" // 背景を透明に
					variants={coreGlowVariants}
					initial="initial"
					animate="animate"
					transition={{
						duration: 2.5,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
				/>
				{/* 内側の脈動するリング */}
				<motion.div
					className="absolute z-15 w-20 h-20 rounded-full border-2 border-cyan-500/70" // シアンのリング
					variants={innerRingVariants}
					initial="initial"
					animate="animate"
				/>
				{/* CPUアイコン（最前面に配置） */}
				<div className="relative z-20 flex items-center justify-center">
					<CpuIcon className="w-14 h-14 text-white" />
					{/* デバッグ用：アイコンが表示されない場合の代替表示 */}
					<div className="absolute inset-0 flex items-center justify-center text-white text-xs opacity-20">
						CPU
					</div>
				</div>
			</div>
			<p className="mt-8 text-lg font-medium text-gray-100 text-center tracking-wide">
				<span className="sr-only">AIが音を分析中...</span>
				{text}
			</p>
		</div>
	);
}
