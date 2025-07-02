"use client";

import { motion } from "framer-motion";
import type { RecordingContainerProps } from "./types";

/**
 * 録音コンテナコンポーネント
 *
 * @description
 * 録音中のUIをラップするコンテナコンポーネント
 *
 * @param children 子要素
 * @param isExpanded 展開されているかどうか
 * @param constraintsRef ドラッグ制約用のref
 * @param onDragEnd ドラッグ終了時のコールバック
 * @param onToggleExpand 展開/折りたたみ切り替え時のコールバック
 */
export function RecordingContainer({
	children,
	isExpanded,
	constraintsRef,
	onDragEnd,
	onToggleExpand,
}: RecordingContainerProps) {
	return (
		<motion.div
			ref={constraintsRef}
			initial={{ y: "100%" }}
			animate={{ y: isExpanded ? "5vh" : "calc(100% - 110px)" }}
			exit={{ y: "100%" }}
			transition={{ type: "spring", stiffness: 300, damping: 30 }}
			className="fixed inset-x-0 bottom-0"
			style={{ height: isExpanded ? "95vh" : "auto" }}
		>
			<motion.div
				drag="y"
				dragConstraints={constraintsRef}
				dragElastic={0.2}
				onDragEnd={onDragEnd}
				className="h-full bg-white/98 backdrop-blur-xl rounded-t-3xl sm:rounded-t-[2rem] shadow-2xl overflow-hidden"
			>
				{/* ドラッグハンドル */}
				<button
					onClick={(e) => {
						e.stopPropagation();
						onToggleExpand();
					}}
					className="w-full flex justify-center py-3 hover:bg-gray-50/50 transition-colors cursor-grab active:cursor-grabbing touch-manipulation"
					aria-label={isExpanded ? "収縮" : "展開"}
				>
					<div className="w-10 h-1 bg-gray-300 rounded-full" />
				</button>

				{/* メインコンテンツ */}
				<div
					className={`${isExpanded ? "h-full flex flex-col" : "px-4 sm:px-6 pb-6"}`}
				>
					{children}
				</div>
			</motion.div>
		</motion.div>
	);
}
