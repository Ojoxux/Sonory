"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { MdArrowForward } from "react-icons/md";
import { DropRippleEffect } from "../../atoms/DropRippleEffect";
import type { SlideToStartProps } from "./types";

/**
 * スライドして開始するコンポーネント
 *
 * @description
 * ドラッグ操作で特定のアクションを実行するスライドバー
 *
 * @param onComplete スライド完了時のコールバック
 * @param disabled 無効状態
 * @param text 表示テキスト
 * @param className 追加のCSSクラス
 */
export function SlideToStart({
	onComplete,
	disabled = false,
	text = "スライドして開始",
	className = "",
}: SlideToStartProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [slideDistance, setSlideDistance] = useState(160);
	const [showDropEffect, setShowDropEffect] = useState(false);
	const x = useMotionValue(0);
	const opacity = useTransform(x, [0, slideDistance], [1, 0]);

	// コンテナの幅を取得して安全な可動域を計算
	useEffect(() => {
		const updateSlideDistance = () => {
			if (containerRef.current) {
				const containerWidth = containerRef.current.offsetWidth;
				// コンテナ幅 - 左右パディング(8px) - スライダーボタン幅(64px) - 安全マージン(4px)
				const safeDistance = containerWidth - 8 - 64 - 0.5;
				setSlideDistance(Math.max(safeDistance, 50)); // 最小50px
			}
		};

		updateSlideDistance();
		window.addEventListener("resize", updateSlideDistance);
		return () => window.removeEventListener("resize", updateSlideDistance);
	}, []);

	const resetSlider = () => {
		x.set(0);
	};

	const handleSlideComplete = () => {
		// 雫エフェクトを発動
		setShowDropEffect(true);

		// 波紋エフェクトが完了してから画面遷移（2.5秒後）
		setTimeout(() => {
			onComplete();
		}, 2500);

		// エフェクト完了後にリセット
		setTimeout(() => {
			setShowDropEffect(false);
		}, 3000);
	};

	return (
		<div className={`mb-4 ${className}`}>
			<div
				ref={containerRef}
				className={`
          relative isolate h-14 w-full rounded-full p-1 transition-all duration-300
          ${
						!disabled
							? "bg-white shadow-[0_8px_24px_rgba(255,255,255,0.4)]"
							: "bg-neutral-700 cursor-not-allowed"
					}
        `}
			>
				{/* 雫の波紋エフェクト */}
				<DropRippleEffect
					isActive={showDropEffect}
					color="white"
					size="medium"
				/>

				<motion.div
					drag={!disabled ? "x" : false}
					dragConstraints={{ left: 0, right: slideDistance }}
					dragElastic={{ left: 0, right: 0 }}
					dragMomentum={false}
					dragTransition={{
						bounceStiffness: 600,
						bounceDamping: 20,
						power: 0.3,
						timeConstant: 200,
					}}
					onDragEnd={(_, info) => {
						if (
							!disabled &&
							(info.offset.x >= slideDistance * 0.98 || info.velocity.x > 500)
						) {
							handleSlideComplete();
						} else {
							resetSlider();
						}
					}}
					whileTap={!disabled ? { scale: 1.05 } : {}}
					style={{ x }}
					className={`
            relative z-10 grid h-full w-16 place-items-center rounded-full
            ${
							!disabled
								? "bg-black cursor-grab active:cursor-grabbing"
								: "bg-neutral-600 cursor-not-allowed"
						}
          `}
				>
					<MdArrowForward
						className={`
              w-5 h-5 transition-colors duration-300
              ${!disabled ? "text-white" : "text-neutral-400"}
            `}
					/>
				</motion.div>
				<motion.p
					style={{ opacity }}
					className={`
            absolute right-5 top-1/2 -translate-y-1/2 text-sm font-semibold tracking-tight transition-colors duration-300
            ${!disabled ? "text-black" : "text-neutral-400"}
          `}
				>
					{text}
				</motion.p>
			</div>
		</div>
	);
}
