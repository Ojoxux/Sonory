"use client";

import { motion } from "framer-motion";
import { MdMic } from "react-icons/md";
import type { RecordingInitialStateProps } from "./types";

/**
 * 録音初期状態コンポーネント
 *
 * @description
 * 録音開始前の初期状態を表示するコンポーネント
 *
 * @param onClick 録音ボタンクリック時のコールバック
 */
export function RecordingInitialState({ onClick }: RecordingInitialStateProps) {
	return (
		<motion.button
			onClick={onClick}
			className="w-48 h-16 sm:w-20 sm:h-20 mb-5 rounded-full bg-black hover:bg-gray-800 flex items-center justify-center shadow-2xl transition-all duration-300 touch-manipulation"
			whileTap={{ scale: 0.95 }}
			whileHover={{ scale: 1.05 }}
		>
			<MdMic className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
		</motion.button>
	);
}
