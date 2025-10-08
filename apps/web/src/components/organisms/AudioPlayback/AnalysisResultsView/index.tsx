"use client"

import { motion } from "framer-motion"
import { useCallback } from "react"
import { WaveformPlayer } from "../../../molecules/WaveformPlayer"
import type { AnalysisResultsViewProps } from "./types"

/**
 * AI分析結果表示画面コンポーネント
 *
 * @description
 * AI分析の結果を表示し、マップへのピン配置または閉じる操作を提供
 * エラー状態やフォールバック状態の表示も含む
 *
 * @param audioData 音声データ
 * @param results AI分析結果
 * @param error エラーメッセージ
 * @param uploadError アップロードエラーメッセージ
 * @param pinCreationError ピン作成エラーメッセージ
 * @param fallbackUsed フォールバック結果が使用されたか
 * @param backendAnalysisResult バックエンドAI分析結果
 * @param onPlacePin ピン配置ボタンのクリックハンドラー
 * @param onClose 閉じるボタンのクリックハンドラー
 * @param pinCreationStatus ピン作成ステータス
 * @param hasPosition 現在位置が存在するか
 * @param onWaveformReady 波形プレイヤーの準備完了時のコールバック
 * @param onWaveformFinish 波形プレイヤーの再生完了時のコールバック
 *
 * @example
 * ```tsx
 * <AnalysisResultsView
 *   audioData={audioData}
 *   results={results}
 *   onPlacePin={handlePlacePin}
 *   onClose={handleClose}
 *   hasPosition={true}
 * />
 * ```
 */
export function AnalysisResultsView({
	audioData,
	results,
	error,
	uploadError,
	pinCreationError,
	fallbackUsed,
	backendAnalysisResult,
	onPlacePin,
	onClose,
	pinCreationStatus = "idle",
	hasPosition,
	onWaveformReady,
	onWaveformFinish,
}: AnalysisResultsViewProps) {
	/**
	 * 信頼度をパーセンテージでフォーマット
	 */
	const formatConfidence = useCallback((confidence: number): string => {
		return `${Math.round(confidence * 100)}%`
	}, [])

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.1 }}
		>
			<div className="mb-6">
				<h3 className="mb-3 font-semibold text-lg text-white">AI音分類結果</h3>

				{/* エラー表示 */}
				{(error || uploadError || pinCreationError) && (
					<motion.div
						className="mb-4 rounded-lg border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-sm"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
					>
						<span className="font-medium text-red-300">
							エラー: {pinCreationError || uploadError || error?.message}
						</span>
					</motion.div>
				)}

				{/* フォールバック警告 */}
				{fallbackUsed && (
					<motion.div
						className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/20 p-4 backdrop-blur-sm"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
					>
						<span className="font-medium text-yellow-300">
							⚠️ バックエンドAPI接続失敗。オフライン分析結果を表示しています。
						</span>
					</motion.div>
				)}

				{/* 分析結果リスト */}
				{results.length > 0 && (
					<div className="mb-6 space-y-2">
						{results.map((result, index) => (
							<motion.div
								key={`${result.label}-${index}`}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.1 }}
								className={`flex items-center justify-between rounded-lg border p-3 backdrop-blur-sm ${
									index === 0
										? "border-green-500/30 bg-green-500/20"
										: "border-white/10 bg-white/5"
								}`}
							>
								<span
									className={`font-medium ${
										index === 0 ? "text-green-300" : "text-neutral-200"
									}`}
								>
									{result.label}
								</span>
								<span
									className={`text-sm ${
										index === 0 ? "text-green-400" : "text-neutral-400"
									}`}
								>
									{formatConfidence(result.confidence)}
								</span>
							</motion.div>
						))}
					</div>
				)}

				{/* バックエンド環境情報 */}
				{backendAnalysisResult?.environment && (
					<motion.div
						className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/20 p-4 backdrop-blur-sm"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
					>
						<span className="font-medium text-blue-300">
							環境:{" "}
							{backendAnalysisResult.environment.description ||
								backendAnalysisResult.environment.primary_type}
						</span>
					</motion.div>
				)}
			</div>

			{/* 録音音声プレイヤー */}
			<div className="mb-6">
				<h3 className="mb-3 font-semibold text-lg text-white">録音音声</h3>
				<WaveformPlayer
					audioData={audioData}
					height={120}
					waveColor="#9ca3af"
					progressColor="#dc2626"
					className="w-full"
					onReady={onWaveformReady}
					onFinish={onWaveformFinish}
				/>
			</div>

			{/* アクションボタン */}
			<div className="flex gap-3">
				{results.length > 0 ? (
					<>
						{/* ピン配置ボタン */}
						<motion.button
							onClick={onPlacePin}
							disabled={pinCreationStatus === "creating" || !hasPosition}
							className={`flex-1 touch-manipulation rounded-xl border px-4 py-3 font-semibold text-white backdrop-blur-sm transition-all duration-300 ${
								pinCreationStatus === "creating" || !hasPosition
									? "cursor-not-allowed border-gray-500/30 bg-gray-600/80"
									: "border-green-500/30 bg-green-600/80 shadow-[0_4px_20px_rgba(34,197,94,0.4)] hover:bg-green-600 hover:shadow-[0_8px_32px_rgba(34,197,94,0.6)]"
							}`}
							whileHover={
								pinCreationStatus === "creating" || !hasPosition
									? {}
									: { scale: 1.02 }
							}
							whileTap={
								pinCreationStatus === "creating" || !hasPosition
									? {}
									: { scale: 0.98 }
							}
						>
							{pinCreationStatus === "creating"
								? "ピン作成中..."
								: !hasPosition
									? "位置情報が必要です"
									: "マップにピンを配置"}
						</motion.button>

						{/* 閉じるボタン */}
						<motion.button
							onClick={onClose}
							className="flex-1 touch-manipulation rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-semibold text-white shadow-[0_4px_20px_rgba(255,255,255,0.1)] backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:shadow-[0_8px_32px_rgba(255,255,255,0.2)]"
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
						>
							閉じる
						</motion.button>
					</>
				) : (
					<motion.button
						onClick={onClose}
						className="w-full touch-manipulation rounded-xl border border-blue-500/30 bg-blue-600/80 px-4 py-3 font-semibold text-white shadow-[0_4px_20px_rgba(59,130,246,0.4)] backdrop-blur-sm transition-all duration-300 hover:bg-blue-600 hover:shadow-[0_8px_32px_rgba(59,130,246,0.6)]"
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
					>
						閉じる
					</motion.button>
				)}
			</div>
		</motion.div>
	)
}

