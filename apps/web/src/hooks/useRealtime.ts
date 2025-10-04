"use client";

import { useRealtimeStore } from "@/store/useRealtimeStore";
import type { LocationData, MapBounds } from "@/store/useSoundPinStore";
import {
	requestNotificationPermission,
	sendNewPinNotification,
} from "@/utils/notifications";
import { useCallback, useEffect, useRef } from "react";
import { useEffectEvent } from "use-effect-event";

/**
 * リアルタイム統合フックのオプション型定義
 */
export interface UseRealtimeOptions {
	/** 自動接続を有効にするか */
	autoConnect?: boolean;
	/** 通知権限を自動要求するか */
	autoRequestPermission?: boolean;
	/** 地図範囲変更時の購読更新を有効にするか */
	autoSubscribeOnBoundsChange?: boolean;
	/** デバッグログを有効にするか */
	enableDebugLog?: boolean;
}

/**
 * リアルタイム統合フックの戻り値型定義
 */
export interface UseRealtimeReturn {
	/** 接続状態 */
	isConnected: boolean;
	/** 接続状態の詳細 */
	connectionStatus: string;
	/** 接続エラー */
	connectionError: string | null;
	/** 未読通知数 */
	unreadCount: number;
	/** リアルタイム接続を開始 */
	connect: () => Promise<void>;
	/** リアルタイム接続を切断 */
	disconnect: () => void;
	/** 地図範囲での購読を開始 */
	subscribeToMapArea: (bounds: MapBounds, userLocation: LocationData) => void;
	/** 購読を停止 */
	unsubscribeAll: () => void;
	/** 通知権限を要求 */
	requestPermission: () => Promise<boolean>;
	/** 通知設定を更新 */
	updateSettings: (
		settings: Partial<{
			enabled: boolean;
			soundEnabled: boolean;
			vibrationEnabled: boolean;
			maxDistance: number;
		}>,
	) => void;
}

/**
 * 地図境界から中心点と半径を計算
 *
 * @param bounds - 地図境界
 * @returns 中心点と半径
 */
function calculateCenterAndRadius(bounds: MapBounds): {
	center: LocationData;
	radius: number;
} {
	const centerLat = (bounds.north + bounds.south) / 2;
	const centerLng = (bounds.east + bounds.west) / 2;

	// 境界の対角線距離を計算（簡易版）
	const latDiff = bounds.north - bounds.south;
	const lngDiff = bounds.east - bounds.west;
	const diagonal = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

	// 半径は対角線の半分（度をメートルに概算変換）
	const radius = Math.min((diagonal * 111000) / 2, 5000); // 最大5km

	return {
		center: {
			latitude: centerLat,
			longitude: centerLng,
		},
		radius,
	};
}

/**
 * リアルタイム機能統合フック
 *
 * @description
 * Supabase Realtimeとの接続、通知管理、地図連携を統合します。
 * 地図範囲変更時の自動購読更新、通知権限管理、エラーハンドリングを提供します。
 *
 * @param options - フックオプション
 * @returns リアルタイム機能のインターフェース
 */
export function useRealtime(
	options: UseRealtimeOptions = {},
): UseRealtimeReturn {
	const {
		autoConnect = true,
		autoRequestPermission = true,
		enableDebugLog = false,
	} = options;

	// Zustandストア
	const {
		isConnected,
		connectionStatus,
		connectionError,
		recentNotifications,
		notificationSettings,
		connectRealtime,
		disconnectRealtime,
		subscribeToNearbyPins,
		unsubscribeFromChannel,
		updateNotificationSettings,
		updateUserLocation,
	} = useRealtimeStore();

	// const { mergeLocalAndPersistedPins } = useSoundPinStore()

	// 前回の購読情報を保持
	const lastSubscriptionRef = useRef<{
		channelId: string;
		bounds: MapBounds;
	} | null>(null);

	// デバッグログ
	const debugLog = useCallback(
		(message: string, ...args: unknown[]) => {
			if (enableDebugLog) {
				console.log(`[useRealtime] ${message}`, ...args);
			}
		},
		[enableDebugLog],
	);

	// 未読通知数を計算
	const unreadCount = recentNotifications.filter((n) => !n.isRead).length;

	// 接続処理
	const connect = useCallback(async (): Promise<void> => {
		try {
			debugLog("リアルタイム接続開始");
			await connectRealtime();
			debugLog("リアルタイム接続完了");
		} catch (error) {
			debugLog("リアルタイム接続エラー:", error);
			throw error;
		}
	}, [connectRealtime, debugLog]);

	// 切断処理
	const disconnect = useCallback((): void => {
		debugLog("リアルタイム切断開始");
		disconnectRealtime();
		lastSubscriptionRef.current = null;
		debugLog("リアルタイム切断完了");
	}, [disconnectRealtime, debugLog]);

	// 地図範囲での購読
	const subscribeToMapArea = useCallback(
		(bounds: MapBounds, userLocation: LocationData): void => {
			if (!isConnected || !notificationSettings.enabled) {
				debugLog("購読スキップ: 未接続または通知無効");
				return;
			}

			const { center, radius } = calculateCenterAndRadius(bounds);

			// 前回と同じ範囲の場合はスキップ
			const currentChannelId = `sound-pins-${center.latitude.toFixed(4)}-${center.longitude.toFixed(4)}`;
			if (lastSubscriptionRef.current?.channelId === currentChannelId) {
				debugLog("購読スキップ: 同じ範囲");
				return;
			}

			// 前回の購読を解除
			if (lastSubscriptionRef.current) {
				unsubscribeFromChannel(lastSubscriptionRef.current.channelId);
			}

			// 新しい購読を開始
			debugLog("地図範囲購読開始:", { bounds, center, radius });
			updateUserLocation(userLocation);
			subscribeToNearbyPins(center, radius);

			// 購読情報を保存
			lastSubscriptionRef.current = {
				channelId: currentChannelId,
				bounds,
			};
		},
		[
			isConnected,
			notificationSettings.enabled,
			unsubscribeFromChannel,
			updateUserLocation,
			subscribeToNearbyPins,
			debugLog,
		],
	);

	// 全購読停止
	const unsubscribeAll = useCallback((): void => {
		if (lastSubscriptionRef.current) {
			debugLog("全購読停止");
			unsubscribeFromChannel(lastSubscriptionRef.current.channelId);
			lastSubscriptionRef.current = null;
		}
	}, [unsubscribeFromChannel, debugLog]);

	// 通知権限要求
	const requestPermission = useCallback(async (): Promise<boolean> => {
		try {
			debugLog("通知権限要求開始");
			const granted = await requestNotificationPermission();
			debugLog("通知権限要求結果:", granted);
			return granted;
		} catch (error) {
			debugLog("通知権限要求エラー:", error);
			return false;
		}
	}, [debugLog]);

	// 設定更新
	const updateSettings = useCallback(
		(
			settings: Partial<{
				enabled: boolean;
				soundEnabled: boolean;
				vibrationEnabled: boolean;
				maxDistance: number;
			}>,
		): void => {
			debugLog("通知設定更新:", settings);
			updateNotificationSettings(settings);
		},
		[updateNotificationSettings, debugLog],
	);

	// 自動接続
	const connectEvent = useEffectEvent(() => {
		debugLog("自動接続実行");
		connect().catch((error) => {
			debugLog("自動接続失敗:", error);
		});
	});

	useEffect(() => {
		if (autoConnect && !isConnected && connectionStatus === "disconnected") {
			connectEvent();
		}
	}, [autoConnect, isConnected, connectionStatus]);

	// 自動通知権限要求
	const requestPermissionEvent = useEffectEvent(() => {
		requestPermission().catch((error) => {
			debugLog("自動通知権限要求失敗:", error);
		});
	});

	useEffect(() => {
		if (autoRequestPermission && isConnected) {
			requestPermissionEvent();
		}
	}, [autoRequestPermission, isConnected]);

	// 新しい通知の処理
	useEffect(() => {
		const unreadNotifications = recentNotifications.filter((n) => !n.isRead);

		for (const notification of unreadNotifications) {
			if (notification.type === "new_pin" && notification.data) {
				// PWA通知を送信
				sendNewPinNotification(
					{
						id: notification.pinId,
						title: notification.data.title,
						primaryLabel: notification.data.primaryLabel,
						location: notification.location,
					},
					notification.distance,
				);
			}
		}
	}, [recentNotifications]);

	// クリーンアップ
	const disconnectEvent = useEffectEvent(() => {
		debugLog("クリーンアップ: 接続切断");
		disconnect();
	});

	useEffect(() => {
		return () => {
			if (isConnected) {
				disconnectEvent();
			}
		};
	}, [isConnected]);

	return {
		isConnected,
		connectionStatus,
		connectionError,
		unreadCount,
		connect,
		disconnect,
		subscribeToMapArea,
		unsubscribeAll,
		requestPermission,
		updateSettings,
	};
}

/**
 * 地図コンポーネント用のリアルタイムフック
 *
 * @description
 * 地図の表示範囲変更に応じて自動的に購読を更新します。
 * 地図コンポーネントで使用することを想定しています。
 *
 * @param userLocation - ユーザーの現在位置
 * @returns 地図用リアルタイム機能
 */
export function useMapRealtime(userLocation: LocationData | null) {
	const realtime = useRealtime({
		autoConnect: true,
		autoRequestPermission: true,
		autoSubscribeOnBoundsChange: true,
		enableDebugLog: process.env.NODE_ENV === "development",
	});

	// 地図範囲変更時の購読更新
	const updateSubscription = useCallback(
		(bounds: MapBounds): void => {
			if (userLocation) {
				realtime.subscribeToMapArea(bounds, userLocation);
			}
		},
		[realtime, userLocation],
	);

	return {
		...realtime,
		updateSubscription,
	};
}

/**
 * 通知のみのリアルタイムフック
 *
 * @description
 * 地図表示を伴わない通知のみの機能を提供します。
 * 設定画面やバックグラウンド処理で使用することを想定しています。
 */
export function useNotificationRealtime() {
	return useRealtime({
		autoConnect: true,
		autoRequestPermission: false,
		autoSubscribeOnBoundsChange: false,
		enableDebugLog: false,
	});
}
