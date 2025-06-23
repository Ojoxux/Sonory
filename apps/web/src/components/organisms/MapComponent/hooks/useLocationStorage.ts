/**
 * 位置情報ストレージ管理フック
 *
 * @description
 * ユーザーの位置情報をローカルストレージに保存・復元し、
 * アプリ再起動時の位置情報復旧を提供する
 *
 * @returns 位置情報の保存・復元機能
 */

import { useCallback, useEffect, useState } from "react";
import type { LocationData } from "../type";

const STORAGE_KEY = "sonory_last_position";
const POSITION_EXPIRY_HOURS = 24;

/**
 * 位置情報ストレージ管理フックの戻り値型
 */
interface UseLocationStorageReturn {
	/** 保存された位置情報 */
	savedPosition: LocationData | null;
	/** 位置情報を保存する関数 */
	savePosition: (position: LocationData) => void;
	/** 保存された位置情報をクリアする関数 */
	clearSavedPosition: () => void;
}

/**
 * マップ位置情報ストレージ管理フック
 */
export function useLocationStorage(): UseLocationStorageReturn {
	const [savedPosition, setSavedPosition] = useState<LocationData | null>(null);

	/**
	 * 位置情報を保存する関数
	 */
	const savePosition = useCallback((position: LocationData): void => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
			if (process.env.NODE_ENV === "development") {
				console.log("位置情報をローカルストレージに保存しました");
			}
		} catch (error) {
			console.error("位置情報の保存に失敗:", error);
		}
	}, []);

	/**
	 * 保存された位置情報をクリアする関数
	 */
	const clearSavedPosition = useCallback((): void => {
		try {
			localStorage.removeItem(STORAGE_KEY);
			setSavedPosition(null);
			if (process.env.NODE_ENV === "development") {
				console.log("保存された位置情報をクリアしました");
			}
		} catch (error) {
			console.error("位置情報のクリアに失敗:", error);
		}
	}, []);

	/**
	 * 保存された位置情報を読み込む
	 */
	const loadSavedPosition = useCallback((): void => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const parsedPosition = JSON.parse(saved) as LocationData;
				// 24時間以内の位置情報のみ使用
				const isRecent =
					Date.now() - parsedPosition.timestamp <
					POSITION_EXPIRY_HOURS * 60 * 60 * 1000;

				if (isRecent) {
					if (process.env.NODE_ENV === "development") {
						console.log("保存された位置情報を読み込みました:", parsedPosition);
					}
					setSavedPosition(parsedPosition);
				} else {
					if (process.env.NODE_ENV === "development") {
						console.log("保存された位置情報が古いため使用しません");
					}
					localStorage.removeItem(STORAGE_KEY);
				}
			}
		} catch (error) {
			console.error("保存された位置情報の読み込みに失敗:", error);
		}
	}, []);

	// 初回読み込み
	useEffect(() => {
		loadSavedPosition();
	}, [loadSavedPosition]);

	return {
		savedPosition,
		savePosition,
		clearSavedPosition,
	};
}
