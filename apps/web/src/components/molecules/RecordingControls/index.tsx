"use client";

import { motion } from "framer-motion";
import { RippleEffect } from "../../atoms/RippleEffect";
import type { RecordingControlsProps } from "./types";

/**
 * 録音コントロールコンポーネント
 *
 * @description
 * 録音の一時停止・停止ボタンを提供するコンポーネント
 *
 * @param onStop 停止ボタンクリック時のコールバック
 * @param isRecording 録音中かどうか
 */
export function RecordingControls({
	onStop,
	isRecording,
}: RecordingControlsProps) {
	return (
		<motion.div
			className="fixed left-0 right-0 bottom-20 sm:bottom-10 md:bottom-12 flex justify-center"
			initial={{ scale: 0 }}
			animate={{ scale: 1 }}
			transition={{
				delay: 0.3,
				type: "spring",
				stiffness: 200,
			}}
		>
			<motion.button
				onClick={onStop}
				className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-300 shadow-lg touch-manipulation z-50"
				whileTap={{ scale: 0.95 }}
			>
				{/* 一時停止アイコン */}
				<div className="flex items-center gap-1.5">
					<div className="w-1 h-8 sm:h-10 bg-gray-900 rounded-full" />
					<div className="w-1 h-8 sm:h-10 bg-gray-900 rounded-full" />
				</div>

				{/* リップルエフェクト */}
				<RippleEffect isActive={isRecording} borderColor="border-gray-400" />
			</motion.button>
		</motion.div>
	);
}
