"use client";

import { motion } from "framer-motion";
import type { RecordingTimerProps } from "./types";

/**
 * 録音タイマーコンポーネント
 *
 * @description
 * 録音時間を大きく表示するコンポーネント
 *
 * @param time 録音時間（秒）
 * @param formatTime 時間フォーマット関数
 */
export function RecordingTimer({ time, formatTime }: RecordingTimerProps) {
	return (
		<motion.div
			initial={{ scale: 0.8, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			transition={{ delay: 0.1 }}
			className="mt-8 sm:mt-10 mb-8 sm:mb-10"
		>
			<div className="font-mono text-6xl sm:text-7xl lg:text-8xl font-light text-gray-900 tracking-wider">
				{formatTime(time)}
			</div>
		</motion.div>
	);
}
