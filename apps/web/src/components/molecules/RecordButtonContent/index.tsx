"use client";

import { LoadingSpinner } from "@/components/atoms/LoadingSpinner";
import { RecordButtonIcon } from "@/components/atoms/RecordButtonIcon";
import { RecordButtonText } from "@/components/atoms/RecordButtonText";
import type { RecordButtonContentProps } from "./type";

/**
 * 録音ボタンコンテンツコンポーネント
 *
 * @description
 * 録音ボタンの内部コンテンツを管理するMoleculeコンポーネント
 * 状態に応じてアイコン、テキスト、ローディングスピナーを表示
 *
 * @param status 録音の状態
 *
 * @example
 * ```tsx
 * <RecordButtonContent status="recording" />
 * ```
 */
export function RecordButtonContent({ status }: RecordButtonContentProps) {
	if (status === "processing") {
		return (
			<div className="flex flex-col items-center justify-center gap-2">
				<LoadingSpinner />
				<span className="text-xs font-medium text-white/90">分析中...</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center gap-1">
			<RecordButtonIcon status={status} />
			<RecordButtonText status={status} />
		</div>
	);
}
