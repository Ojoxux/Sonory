/**
 * 太陽の位置計算ユーティリティ
 *
 * 時刻と位置情報から太陽の方位角と高度を計算
 */

/**
 * 度をラジアンに変換
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * ラジアンを度に変換
 */
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI)
}

/**
 * ユリウス日を計算
 */
function getJulianDay(date: Date): number {
  const a = Math.floor((14 - (date.getMonth() + 1)) / 12)
  const y = date.getFullYear() + 4800 - a
  const m = date.getMonth() + 1 + 12 * a - 3

  return (
    date.getDate() +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045 +
    (date.getHours() - 12) / 24 +
    date.getMinutes() / 1440 +
    date.getSeconds() / 86400
  )
}

/**
 * 太陽の位置を計算
 * @param date 日時
 * @param latitude 緯度
 * @param longitude 経度
 * @returns 太陽の方位角（azimuth）と高度（altitude）
 */
export function calculateSunPosition(
  date: Date,
  latitude: number,
  longitude: number,
): { azimuth: number; altitude: number } {
  const jd = getJulianDay(date)
  const n = jd - 2451545.0

  // 平均近点角
  const M = toRadians((357.5291 + 0.98560028 * n) % 360)

  // 真近点角
  const C = toRadians(
    1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M),
  )

  // 黄道経度
  const λ = toRadians((280.4665 + 0.98564736 * n + toDegrees(C)) % 360)

  // 黄道傾斜角
  const ε = toRadians(23.4393 - 0.0000004 * n)

  // 赤経
  const α = Math.atan2(Math.cos(ε) * Math.sin(λ), Math.cos(λ))

  // 赤緯
  const δ = Math.asin(Math.sin(ε) * Math.sin(λ))

  // 恒星時
  const θ0 = toRadians((280.16 + 360.9856235 * n) % 360)
  const θ = θ0 + toRadians(longitude) - α

  // 時角
  const H = θ

  // 方位角と高度を計算
  const φ = toRadians(latitude)

  const altitude = Math.asin(
    Math.sin(φ) * Math.sin(δ) + Math.cos(φ) * Math.cos(δ) * Math.cos(H),
  )
  const azimuth = Math.atan2(
    Math.sin(H),
    Math.cos(H) * Math.sin(φ) - Math.tan(δ) * Math.cos(φ),
  )

  return {
    azimuth: toDegrees(azimuth) + 180, // 0-360度に正規化
    altitude: toDegrees(altitude),
  }
}

/**
 * 時間帯に基づいた光の設定を取得
 */
export interface LightingConfig {
  sunIntensity: number
  ambientIntensity: number
  sunColor: string
  ambientColor: string
  fogColor: string
  fogDensity: number
  shadowIntensity: number
}

/**
 * 太陽の高度に基づいて光の設定を計算
 */
export function getLightingConfig(sunAltitude: number): LightingConfig {
  // 夜間（太陽が地平線下）
  if (sunAltitude < -6) {
    return {
      sunIntensity: 0,
      ambientIntensity: 0.3,
      sunColor: '#000033',
      ambientColor: '#1a1a3e',
      fogColor: '#0a0a1f',
      fogDensity: 0.8,
      shadowIntensity: 0,
    }
  }

  // 薄明（市民薄明）
  if (sunAltitude < 0) {
    const factor = (sunAltitude + 6) / 6
    return {
      sunIntensity: 0.2 * factor,
      ambientIntensity: 0.4 + 0.2 * factor,
      sunColor: '#ff6b6b',
      ambientColor: '#4a5568',
      fogColor: '#2d3748',
      fogDensity: 0.6,
      shadowIntensity: 0.1 * factor,
    }
  }

  // 日の出・日の入り（0-10度）
  if (sunAltitude < 10) {
    const factor = sunAltitude / 10
    return {
      sunIntensity: 0.3 + 0.4 * factor,
      ambientIntensity: 0.6 + 0.2 * factor,
      sunColor: interpolateColor('#ff6347', '#ffd700', factor),
      ambientColor: interpolateColor('#ff7f50', '#87ceeb', factor),
      fogColor: interpolateColor('#ff6347', '#87ceeb', factor),
      fogDensity: 0.4 - 0.2 * factor,
      shadowIntensity: 0.3 + 0.3 * factor,
    }
  }

  // 朝・夕方（10-30度）
  if (sunAltitude < 30) {
    const factor = (sunAltitude - 10) / 20
    return {
      sunIntensity: 0.7 + 0.2 * factor,
      ambientIntensity: 0.8 + 0.1 * factor,
      sunColor: interpolateColor('#ffd700', '#ffffff', factor),
      ambientColor: interpolateColor('#87ceeb', '#b0e0e6', factor),
      fogColor: '#87ceeb',
      fogDensity: 0.2 - 0.1 * factor,
      shadowIntensity: 0.6 + 0.2 * factor,
    }
  }

  // 昼間（30度以上）
  return {
    sunIntensity: 1.0,
    ambientIntensity: 0.9,
    sunColor: '#ffffff',
    ambientColor: '#b0e0e6',
    fogColor: '#e0f2fe',
    fogDensity: 0.1,
    shadowIntensity: 0.8,
  }
}

/**
 * 2つの色を補間
 */
function interpolateColor(
  color1: string,
  color2: string,
  factor: number,
): string {
  const c1 = hexToRgb(color1)
  const c2 = hexToRgb(color2)

  if (!c1 || !c2) return color1

  const r = Math.round(c1.r + (c2.r - c1.r) * factor)
  const g = Math.round(c1.g + (c2.g - c1.g) * factor)
  const b = Math.round(c1.b + (c2.b - c1.b) * factor)

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

/**
 * HEX色をRGBに変換
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * 天候に基づいた効果を取得
 */
export interface WeatherEffects {
  precipitation: number // 0-1
  cloudCoverage: number // 0-1
  windSpeed: number // m/s
  visibility: number // 0-1
}

/**
 * デフォルトの天候（晴れ）
 */
export const defaultWeather: WeatherEffects = {
  precipitation: 0,
  cloudCoverage: 0.2,
  windSpeed: 2,
  visibility: 1,
}

/**
 * 天候効果を光の設定に適用
 */
export function applyWeatherEffects(
  lighting: LightingConfig,
  weather: WeatherEffects,
): LightingConfig {
  return {
    ...lighting,
    sunIntensity: lighting.sunIntensity * (1 - weather.cloudCoverage * 0.7),
    ambientIntensity: lighting.ambientIntensity + weather.cloudCoverage * 0.2,
    fogDensity:
      lighting.fogDensity +
      weather.precipitation * 0.5 +
      (1 - weather.visibility) * 0.3,
    shadowIntensity:
      lighting.shadowIntensity * (1 - weather.cloudCoverage * 0.5),
  }
}
