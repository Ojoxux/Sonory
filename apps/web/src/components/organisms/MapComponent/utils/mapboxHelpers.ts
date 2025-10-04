/**
 * Mapboxヘルパー関数
 */

import { pipe } from "fp-ts/function"
import type { MapboxExtendedMap, MapboxNonStandardMethods } from "../type"
import { supportsMethod } from "./mapboxSupport"

/**
 * Mapboxの非標準メソッドを安全に呼び出すヘルパー関数群を作成
 * @returns Mapboxヘルパーメソッド群
 */
export const createMapboxHelpers = (): MapboxNonStandardMethods => ({
   setConfigProperty: (map, namespace, property, value) =>
      pipe(supportsMethod(map, "setConfigProperty"), (isSupported) => {
         if (isSupported && map.isStyleLoaded()) {
            try {
               const extendedMap = map as MapboxExtendedMap
               if (extendedMap.setConfigProperty) {
                  extendedMap.setConfigProperty(namespace, property, value)
               }
            } catch (error) {
               if (process.env.NODE_ENV === "development") {
                  console.warn("⚠️ setConfigProperty実行エラー:", error)
               }
            }
         } else if (process.env.NODE_ENV === "development") {
            console.warn(
               "⚠️ setConfigProperty: スタイル未読み込みまたは非サポート",
            )
         }
      }),

   setTerrain: (map, config) =>
      pipe(supportsMethod(map, "setTerrain"), (isSupported) => {
         if (isSupported && map.isStyleLoaded()) {
            try {
               const extendedMap = map as MapboxExtendedMap
               if (extendedMap.setTerrain) {
                  extendedMap.setTerrain(config)
               }
            } catch (error) {
               if (process.env.NODE_ENV === "development") {
                  console.warn("⚠️ setTerrain実行エラー:", error)
               }
               // 他のヘルパーメソッドと統一してエラーを再スローしない
            }
         } else if (process.env.NODE_ENV === "development") {
            console.warn("⚠️ setTerrain: スタイル未読み込みまたは非サポート")
         }
      }),

   setLight: (map, config) =>
      pipe(supportsMethod(map, "setLight"), (isSupported) => {
         if (isSupported && map.isStyleLoaded()) {
            try {
               const extendedMap = map as MapboxExtendedMap
               if (extendedMap.setLight) {
                  extendedMap.setLight(config)
               }
            } catch (error) {
               if (process.env.NODE_ENV === "development") {
                  console.warn("⚠️ setLight実行エラー:", error)
               }
            }
         } else if (process.env.NODE_ENV === "development") {
            console.warn("⚠️ setLight: スタイル未読み込みまたは非サポート")
         }
      }),

   setFog: (map, config) =>
      pipe(supportsMethod(map, "setFog"), (isSupported) => {
         if (isSupported && map.isStyleLoaded()) {
            try {
               const extendedMap = map as MapboxExtendedMap
               if (extendedMap.setFog) {
                  extendedMap.setFog(config)
               }
            } catch (error) {
               if (process.env.NODE_ENV === "development") {
                  console.warn("⚠️ setFog実行エラー:", error)
               }
            }
         } else if (process.env.NODE_ENV === "development") {
            console.warn("⚠️ setFog: スタイル未読み込みまたは非サポート")
         }
      }),
})

/**
 * Mapboxヘルパーのシングルトンインスタンス
 */
export const mapboxHelpers = createMapboxHelpers()
