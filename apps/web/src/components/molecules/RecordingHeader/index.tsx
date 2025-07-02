"use client";

import { BlinkingIndicator } from "../../atoms/BlinkingIndicator";
import type { RecordingHeaderProps } from "./types";

/**
 * 録音インターフェースのヘッダーコンポーネント
 *
 * @description
 * 録音中の状態表示と操作ボタンを含むヘッダー
 *
 * @param isRecording 録音中かどうか
 * @param onCancel キャンセルボタンクリック時のコールバック
 * @param onNext 次へボタンクリック時のコールバック
 */
export function RecordingHeader({
	isRecording,
	onCancel,
	onNext,
}: RecordingHeaderProps) {
	return (
		<div className="flex justify-between items-center px-6 sm:px-8 py-4 pb-2 sm:pb-3 relative">
			<button
				onClick={onCancel}
				className="text-gray-600 hover:text-gray-900 font-medium text-base sm:text-lg transition-colors touch-manipulation"
			>
				キャンセル
			</button>

			<div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
				<BlinkingIndicator
					isActive={isRecording}
					size="w-2 h-2"
					color="bg-red-500"
				/>
				<span className="text-gray-900 font-medium text-base sm:text-lg">
					録音中
				</span>
			</div>

			<button
				onClick={onNext}
				className="text-gray-900 hover:text-gray-700 font-medium text-base sm:text-lg transition-colors touch-manipulation"
			>
				次へ
			</button>
		</div>
	);
}
