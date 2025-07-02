"use client";

import { motion } from "framer-motion";
import { MdStop } from "react-icons/md";
import { PulseEffect } from "../../atoms/PulseEffect";
import { WaveformDisplay } from "../WaveformDisplay";
import type { RecordingMiniDisplayProps } from "./types";

/**
 * 録音ミニ表示コンポーネント
 *
 * @description
 * 録音インターフェースの非展開時に表示されるミニ表示コンポーネント
 *
 * @param status 録音状態
 * @param recordingTime 録音時間
 * @param waveformData 波形データ
 * @param formatTime 時間フォーマット関数
 * @param onStop 停止ボタンクリック時のコールバック
 */
export function RecordingMiniDisplay({
	status,
	recordingTime,
	waveformData,
	formatTime,
	onStop,
}: RecordingMiniDisplayProps) {
	return (
		<div className="flex items-center justify-between h-16">
			{/* 録音ボタン */}
			<motion.button
				onClick={() => {
					console.log("録音ボタンがクリックされました", { status });
					if (status === "recording") {
						onStop();
					}
				}}
				className={`
          relative rounded-full flex items-center justify-center
          transition-all duration-300 shadow-lg touch-manipulation
          w-14 h-14 sm:w-16 sm:h-16
          ${
						status === "recording"
							? "bg-red-600 hover:bg-red-700"
							: status === "completed"
								? "bg-gray-400 cursor-not-allowed"
								: "bg-gray-600 hover:bg-gray-700"
					}
        `}
				style={{
					cursor: status === "completed" ? "not-allowed" : "pointer",
				}}
				whileTap={status !== "completed" ? { scale: 0.95 } : {}}
				whileHover={status !== "completed" ? { scale: 1.05 } : {}}
				disabled={status === "completed"}
			>
				{status === "recording" ? (
					<MdStop className="text-white w-6 h-6 sm:w-8 sm:h-8" />
				) : status === "completed" ? (
					<motion.div
						className="w-6 h-6 sm:w-8 sm:h-8 border-3 border-white border-t-transparent rounded-full"
						animate={{ rotate: 360 }}
						transition={{
							duration: 1,
							repeat: Number.POSITIVE_INFINITY,
							ease: "linear",
						}}
					/>
				) : (
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						className="bg-white rounded-full w-5 h-5 sm:w-6 sm:h-6"
					/>
				)}

				{/* 録音中のパルスエフェクト */}
				<PulseEffect
					isActive={status === "recording"}
					borderColor="border-red-500"
				/>
			</motion.button>

			{/* 波形表示 */}
			<div className="flex-1 mx-3 sm:mx-6">
				<WaveformDisplay
					isRecording={status === "recording"}
					isCompleted={status === "completed"}
					recordingTime={recordingTime}
					waveformData={waveformData}
					height={48}
					className="h-12"
					waveColor="#000000"
					backgroundColor="#f3f4f6"
					key={`mini-${status}-${recordingTime}`}
				/>
			</div>

			{/* タイマー */}
			<motion.div
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				className="text-right min-w-[90px] sm:min-w-[100px]"
			>
				<div className="font-mono font-medium text-gray-900 text-xl sm:text-2xl">
					{formatTime(recordingTime)}
				</div>
				<div className="text-gray-500 text-xs">
					{status === "recording" ? "録音中" : "完了"}
				</div>
			</motion.div>
		</div>
	);
}
