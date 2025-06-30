"use client";

import { useState } from "react";

/**
 * シンプルな録音機能を提供するコンポーネント
 * TODO: 今後デッドコードになる(想定)。なったら削除必須。
 *
 * @returns {JSX.Element} 録音ボタンと録音状態を表示するコンポーネント
 */
export function SimpleRecorder() {
	const { isRecording, error, handleClick } = useSimpleRecorder();

	return (
		<div className="fixed top-20 left-4 z-50 rounded-lg bg-white p-4 shadow-lg">
			<h3 className="mb-2 font-bold text-sm">録音テスト</h3>
			<button
				type="button"
				onClick={handleClick}
				className={`rounded px-4 py-2 ${
					isRecording ? "bg-red-500 text-white" : "bg-gray-800 text-white"
				}`}
			>
				{isRecording ? "録音中..." : "録音開始"}
			</button>
			{error && (
				<div className="mt-2 text-red-500 text-xs">エラー: {error}</div>
			)}
		</div>
	);
}

/**
 * シンプルな録音機能を提供するカスタムフック
 *
 * @returns {Object} 録音状態とエラー情報
 * @returns {boolean} isRecording 録音中かどうか
 * @returns {string} error エラーメッセージ
 * @returns {function} handleClick 録音ボタンのクリックハンドラー
 */

export default function useSimpleRecorder() {
	const [isRecording, setIsRecording] = useState(false);
	const [error, setError] = useState<string>("");

	const handleClick = async () => {
		if (!isRecording) {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: true,
				});
				setIsRecording(true);
				setError("");

				// 5秒後に停止
				setTimeout(() => {
					for (const track of stream.getTracks()) {
						track.stop();
					}
					setIsRecording(false);
				}, 5000);
			} catch (err) {
				console.error("マイクアクセスエラー:", err);
				setError(
					err instanceof Error ? err.message : "マイクアクセスに失敗しました",
				);
			}
		}
	};
	return {
		isRecording,
		error,
		handleClick,
	};
}
