/**
 * 位置情報統合管理フック
 *
 * @description
 * 複数の位置情報ソース（Mapbox、ブラウザ、保存済み）を統合管理し、
 * 段階的フォールバック戦略で最適な位置情報を提供する
 *
 * @param map Mapboxマップインスタンス
 * @param onGeolocationReady 位置情報準備完了時のコールバック
 * @param onReturnToLocationReady 位置復帰準備完了時のコールバック
 * @returns 統合された位置情報と制御関数
 */

import type mapboxgl from "mapbox-gl";
import { useCallback, useState } from "react";
import type { LocationData } from "../mapbox.types";

export type UseMapGeolocationProps = {
	/** Mapboxのgeolocationコントロール */
	geolocateControl: mapboxgl.GeolocateControl | null;
	/** 位置情報取得の初期化状態 */
	geolocateInitialized: boolean;
	/** デバッグモードの状態 */
	debugMode: boolean;
	/** 通知表示関数 */
	showNotification: (
		message: string,
		type: "success" | "error" | "warning",
	) => void;
	/** 位置情報更新時のコールバック */
	onPositionUpdate: (position: LocationData) => void;
	/** マップインスタンス */
	map: mapboxgl.Map | null;
};

export type UseMapGeolocationReturn = {
	/** Mapboxから取得した位置情報 */
	mapboxPosition: LocationData | null;
	/** 位置情報取得の試行状態 */
	geolocateAttempted: boolean;
	/** 位置情報取得を試行する関数 */
	attemptGeolocation: () => void;
	/** 位置情報をリセットする関数 */
	resetGeolocation: () => void;
};

/**
 * マップ位置情報取得管理フック
 */
export function useLocationIntegration({
	geolocateControl,
	geolocateInitialized,
	debugMode,
	showNotification,
	onPositionUpdate,
	map,
}: UseMapGeolocationProps): UseMapGeolocationReturn {
	const [mapboxPosition, setMapboxPosition] = useState<LocationData | null>(
		null,
	);
	const [geolocateAttempted, setGeolocateAttempted] = useState<boolean>(false);

	/**
	 * 段階的フォールバック戦略による位置情報取得
	 */
	const attemptGeolocation = useCallback((): void => {
		setGeolocateAttempted(true);

		if (!("geolocation" in navigator)) {
			console.warn("Geolocation APIがサポートされていません");
			// 保存された位置情報があればそれを使用
			const savedPosition = localStorage.getItem("sonory_last_position");
			if (savedPosition) {
				try {
					const parsed = JSON.parse(savedPosition) as LocationData;
					setMapboxPosition(parsed);
					onPositionUpdate(parsed);
				} catch (error) {
					console.error("保存された位置情報の解析エラー:", error);
				}
			}
			return;
		}

		// 段階的フォールバック戦略
		const tryGeolocation = (
			options: PositionOptions,
			fallbackLevel: number,
		): void => {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const newPosition = {
						latitude: position.coords.latitude,
						longitude: position.coords.longitude,
						accuracy: position.coords.accuracy,
						timestamp: Date.now(),
					};
					setMapboxPosition(newPosition);

					// 位置情報を更新する前に録音データを保存
					const recordingData = localStorage.getItem("recording_data");

					// 位置情報を更新
					onPositionUpdate(newPosition);

					// 録音データを復元
					if (recordingData) {
						localStorage.setItem("recording_data", recordingData);
					}

					// デバッグモード時のみ成功通知
					if (debugMode) {
						showNotification("位置情報を更新しました", "success");
					}

					// マップの視点を更新（斜めから見下ろす視点を維持）
					if (map) {
						map.flyTo({
							center: [newPosition.longitude, newPosition.latitude],
							zoom: 18,
							pitch: 50,
							bearing: -20,
							essential: true,
							duration: 2000,
						});
					}
				},
				(error) => {
					// 段階的フォールバック
					if (fallbackLevel === 1 && error.code === 3) {
						tryGeolocation(
							{
								enableHighAccuracy: false,
								timeout: 15000,
								maximumAge: 300000, // 5分以内のキャッシュを許可
							},
							2,
						);
					} else if (fallbackLevel === 2) {
						const savedPosition = localStorage.getItem("sonory_last_position");
						if (savedPosition) {
							try {
								const parsed = JSON.parse(savedPosition) as LocationData;
								setMapboxPosition(parsed);

								// 位置情報を更新する前に録音データを保存
								const recordingData = localStorage.getItem("recording_data");

								// 位置情報を更新
								onPositionUpdate(parsed);

								// 録音データを復元
								if (recordingData) {
									localStorage.setItem("recording_data", recordingData);
								}

								if (debugMode) {
									showNotification(
										"保存された位置情報を使用しました",
										"warning",
									);
								}
								return;
							} catch (parseError) {
								console.error("保存された位置情報の解析エラー:", parseError);
							}
						}

						// レベル4: Mapboxのgeolocationコントロールを試行
						if (geolocateControl && geolocateInitialized) {
							try {
								geolocateControl.trigger();
							} catch (triggerError) {
								console.error("Mapbox trigger失敗:", triggerError);
							}
						} else {
							// TODO: Mapboxの位置情報取得が利用できない場合の処理を実装
						}
					} else {
						// TODO: 最終的なフォールバック処理を実装
					}
				},
				options,
			);
		};

		// レベル1: 高精度モード、短いタイムアウト
		tryGeolocation(
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 60000, // 1分以内のキャッシュを許可
			},
			1,
		);
	}, [
		geolocateControl,
		geolocateInitialized,
		debugMode,
		showNotification,
		onPositionUpdate,
		map,
	]);

	/**
	 * 位置情報をリセットする関数
	 */
	const resetGeolocation = useCallback((): void => {
		// 録音データを保存
		const recordingData = localStorage.getItem("recording_data");

		// 位置情報のみクリア
		localStorage.removeItem("sonory_last_position");

		// 録音データを復元
		if (recordingData) {
			localStorage.setItem("recording_data", recordingData);
		}

		setMapboxPosition(null);
		setGeolocateAttempted(false);

		// 現在の視点を保存
		const currentCenter = map?.getCenter();
		const currentZoom = map?.getZoom();
		const currentBearing = map?.getBearing();

		// 少し遅延させてから再取得
		setTimeout(() => {
			// 視点をリセット（斜めから見下ろす視点に戻す）
			if (map && currentCenter) {
				map.flyTo({
					center: [currentCenter.lng, currentCenter.lat],
					zoom: currentZoom || 18,
					pitch: 50, // 斜めから見下ろす視点
					bearing: currentBearing || -20,
					essential: true,
					duration: 1000,
				});
			}
			attemptGeolocation();
		}, 500);
	}, [map, attemptGeolocation]);

	return {
		mapboxPosition,
		geolocateAttempted,
		attemptGeolocation,
		resetGeolocation,
	};
}
