"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { DropRippleEffectProps } from "./types";

/**
 * 雫が落ちるような波紋エフェクトコンポーネント
 *
 * @description
 * スライダーが右端に到達した時に、雫が落ちて波紋が広がるアニメーション
 * 録音開始のトリガー時に使用される視覚的フィードバック
 * 多層の波紋とネオンエフェクトで視覚的インパクトを強化
 *
 * @param isActive エフェクトの有効状態
 * @param color 波紋の色（デフォルト: blue）
 * @param size 波紋のサイズ（デフォルト: medium）
 * @param className 追加のCSSクラス
 *
 * @example
 * ```tsx
 * <DropRippleEffect
 *   isActive={isSlideCompleted}
 *   color="blue"
 *   size="large"
 * />
 * ```
 */
export function DropRippleEffect({
	isActive,
	color = "blue",
	size = "medium",
	className = "",
}: DropRippleEffectProps) {
	if (!isActive) return null;

	const sizeMultiplier = {
		small: 0.7,
		medium: 1,
		large: 1.3,
	};

	const multiplier = sizeMultiplier[size];

	// 色設定をネオン系に調整
	const colorConfig = {
		blue: {
			primary: "rgba(0, 255, 255, 0.5)", // cyan-400/50
			border1: "rgba(6, 182, 212, 0.7)", // cyan-500/70
			border2: "rgba(34, 211, 238, 0.6)", // cyan-400/60
			border3: "rgba(103, 232, 249, 0.5)", // cyan-300/50
			border4: "rgba(165, 243, 252, 0.4)", // cyan-200/40
			shadow:
				"0 0 15px rgba(0, 255, 255, 0.9), 0 0 30px rgba(0, 200, 255, 0.7)",
		},
		white: {
			primary: "rgba(255, 255, 255, 0.5)",
			border1: "rgba(229, 231, 235, 0.7)", // gray-200/70
			border2: "rgba(243, 244, 246, 0.6)", // gray-100/60
			border3: "rgba(249, 250, 251, 0.5)", // gray-50/50
			border4: "rgba(255, 255, 255, 0.4)",
			shadow:
				"0 0 15px rgba(255, 255, 255, 0.9), 0 0 30px rgba(243, 244, 246, 0.7)",
		},
		green: {
			primary: "rgba(34, 197, 94, 0.5)", // green-500/50
			border1: "rgba(34, 197, 94, 0.7)", // green-500/70
			border2: "rgba(74, 222, 128, 0.6)", // green-400/60
			border3: "rgba(134, 239, 172, 0.5)", // green-300/50
			border4: "rgba(187, 247, 208, 0.4)", // green-200/40
			shadow:
				"0 0 15px rgba(34, 197, 94, 0.9), 0 0 30px rgba(16, 185, 129, 0.7)",
		},
		red: {
			primary: "rgba(239, 68, 68, 0.5)", // red-500/50
			border1: "rgba(239, 68, 68, 0.7)", // red-500/70
			border2: "rgba(248, 113, 113, 0.6)", // red-400/60
			border3: "rgba(252, 165, 165, 0.5)", // red-300/50
			border4: "rgba(254, 202, 202, 0.4)", // red-200/40
			shadow:
				"0 0 15px rgba(239, 68, 68, 0.9), 0 0 30px rgba(220, 38, 127, 0.7)",
		},
	};

	const colors =
		colorConfig[color as keyof typeof colorConfig] || colorConfig.blue;

	return (
		<div className={`absolute inset-0 pointer-events-none ${className}`}>
			<AnimatePresence>
				{/* 最内層: 最初の衝撃（塗りつぶし、すぐに消える） */}
				<motion.div
					key="ripple-core"
					className="absolute rounded-full"
					style={{
						right: "4px",
						top: "40%",
						transform: "translate(50%, -50%)",
						backgroundColor: colors.primary,
						boxShadow: colors.shadow,
					}}
					initial={{
						width: 0,
						height: 0,
						opacity: 1,
					}}
					animate={{
						width: 150 * multiplier,
						height: 150 * multiplier,
						opacity: 0,
					}}
					exit={{
						opacity: 0,
					}}
					transition={{
						duration: 0.6,
						ease: "easeOut",
					}}
				/>

				{/* 第2層: 最初の波紋（線） */}
				<motion.div
					key="ripple-layer-1"
					className="absolute rounded-full border-2"
					style={{
						right: "4px",
						top: "40%",
						transform: "translate(50%, -50%)",
						borderColor: colors.border1,
						boxShadow: colors.shadow,
					}}
					initial={{
						width: 0,
						height: 0,
						opacity: 0.9,
					}}
					animate={{
						width: 400 * multiplier,
						height: 400 * multiplier,
						opacity: 0,
					}}
					exit={{
						opacity: 0,
					}}
					transition={{
						duration: 1.2,
						ease: "easeOut",
						delay: 0.05,
					}}
				/>

				{/* 第3層: 中間の波紋（線） */}
				<motion.div
					key="ripple-layer-2"
					className="absolute rounded-full border"
					style={{
						right: "4px",
						top: "40%",
						transform: "translate(50%, -50%)",
						borderColor: colors.border2,
						boxShadow: colors.shadow,
					}}
					initial={{
						width: 0,
						height: 0,
						opacity: 0.7,
					}}
					animate={{
						width: 700 * multiplier,
						height: 700 * multiplier,
						opacity: 0,
					}}
					exit={{
						opacity: 0,
					}}
					transition={{
						duration: 1.7,
						ease: "easeOut",
						delay: 0.15,
					}}
				/>

				{/* 第4層: 広がる波紋（線） */}
				<motion.div
					key="ripple-layer-3"
					className="absolute rounded-full border"
					style={{
						right: "4px",
						top: "40%",
						transform: "translate(50%, -50%)",
						borderColor: colors.border3,
						boxShadow: colors.shadow,
					}}
					initial={{
						width: 0,
						height: 0,
						opacity: 0.5,
					}}
					animate={{
						width: 1200 * multiplier,
						height: 1200 * multiplier,
						opacity: 0,
					}}
					exit={{
						opacity: 0,
					}}
					transition={{
						duration: 2.1,
						ease: "easeOut",
						delay: 0.25,
					}}
				/>

				{/* 第5層: 最も外側の波紋（線） */}
				<motion.div
					key="ripple-layer-4"
					className="absolute rounded-full border"
					style={{
						right: "4px",
						top: "40%",
						transform: "translate(50%, -50%)",
						borderColor: colors.border4,
						boxShadow: colors.shadow,
					}}
					initial={{
						width: 0,
						height: 0,
						opacity: 0.3,
					}}
					animate={{
						width: 2000 * multiplier,
						height: 2000 * multiplier,
						opacity: 0,
					}}
					exit={{
						opacity: 0,
					}}
					transition={{
						duration: 2.5,
						ease: "easeOut",
						delay: 0.35,
					}}
				/>
			</AnimatePresence>
		</div>
	);
}
