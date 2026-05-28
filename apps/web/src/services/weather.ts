/**
 * 天気情報取得サービス
 *
 * Open-Meteo APIから天気情報を取得し、日本語の天気状態に変換する
 */

import type { WeatherData } from "@sonory/shared-types"
import { type ApiClient, defaultApiClient } from "./api-client"

const WEATHER_CONDITIONS: Readonly<Record<number, string>> = {
   0: "晴れ",
   1: "ほぼ晴れ",
   2: "部分的に曇り",
   3: "曇り",
   45: "霧",
   48: "霧氷",
   51: "小雨",
   53: "雨",
   55: "大雨",
   61: "小雨",
   63: "雨",
   65: "大雨",
   71: "小雪",
   73: "雪",
   75: "大雪",
   95: "雷雨",
}

/**
 * 天気コードから日本語の天気状態を取得
 */
export function getWeatherCondition(weatherCode: number): string {
   return WEATHER_CONDITIONS[weatherCode] ?? "不明"
}

interface OpenMeteoResponse {
   current_weather?: {
      temperature: number
      weathercode: number
      windspeed: number
      humidity?: number
   }
}

/**
 * Open-Meteo APIから天気情報を取得
 *
 * @param lat - 緯度
 * @param lng - 経度
 * @param client - APIクライアント（テスト時に差し替え可能）
 * @returns 天気データ（取得失敗時はundefined）
 */
export async function fetchWeatherData(
   lat: number,
   lng: number,
   client: ApiClient = defaultApiClient,
): Promise<WeatherData | undefined> {
   try {
      const data = await client.get<OpenMeteoResponse>(
         `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=auto`,
      )

      if (data.current_weather) {
         return {
            temperature: data.current_weather.temperature,
            condition: getWeatherCondition(data.current_weather.weathercode),
            windSpeed: data.current_weather.windspeed,
            humidity: data.current_weather.humidity || undefined,
         }
      }

      return undefined
   } catch (error) {
      console.warn("天気情報の取得に失敗:", error)
      return undefined
   }
}
