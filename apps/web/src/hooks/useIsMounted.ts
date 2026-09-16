"use client"

import { useSyncExternalStore } from "react"

function subscribe(): () => void {
   return () => {}
}

function getSnapshot(): boolean {
   return true
}

function getServerSnapshot(): boolean {
   return false
}

/**
 * クライアントでのマウント完了を検知するフック
 *
 * @description
 * `persist` で localStorage から復元される値など、SSR の初期値とズレうる
 * 状態をシートで描画する前にガードするために使う。
 * `useEffect` 内で `setState` すると余分な再レンダーとして警告されるため、
 * `useSyncExternalStore` でサーバー/クライアントのスナップショットの差分として扱う。
 *
 * @returns クライアントでマウント済みかどうか
 */
export function useIsMounted(): boolean {
   return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
