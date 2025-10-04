/**
 * マップ通知管理フック
 */

import { useCallback } from "react"

export interface UseMapNotificationsReturn {
	showNotification: (
		message: string,
		type: "success" | "error" | "warning",
	) => void
}

/**
 * マップの通知機能を管理するフック
 * @returns 通知表示関数
 */
export const useMapNotifications = (): UseMapNotificationsReturn => {
	// 通知オブジェクト作成
	const createNotification = useCallback(
		(message: string, type: "success" | "error" | "warning") =>
			({
				message,
				type,
				timestamp: Date.now(),
			}) as const,
		[],
	)

	// 副作用を実行する関数（分離された副作用）
	const executeNotification = useCallback(
		(_notification: ReturnType<typeof createNotification>) => {
			// HACK: 将来的にはtoast通知などに拡張可能
		},
		[],
	)

	// 通知の実行
	const showNotification = useCallback(
		(message: string, type: "success" | "error" | "warning") => {
			const notification = createNotification(message, type)
			executeNotification(notification)
		},
		[createNotification, executeNotification],
	)

	return {
		showNotification,
	}
}
