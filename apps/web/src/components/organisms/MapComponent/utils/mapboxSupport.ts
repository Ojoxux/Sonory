/**
 * Mapboxメソッドサポート確認ユーティリティ
 */

/**
 * オブジェクトが特定のメソッドをサポートしているか確認
 * @param obj - チェック対象のオブジェクト
 * @param method - メソッド名
 * @returns メソッドが存在し、関数型であればtrue
 */
export const supportsMethod = <T extends object>(
	obj: T,
	method: string,
): boolean =>
	method in obj &&
	typeof (obj as Record<string, unknown>)[method] === "function"
