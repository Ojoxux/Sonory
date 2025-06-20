/**
 * WaveformPlayerコンポーネント用のユーティリティ関数
 */

/**
 * 音声データから波形の振幅データを抽出
 * @param audioBuffer - Web Audio APIのAudioBuffer
 * @param samples - 生成する波形サンプル数
 * @returns 正規化された振幅データの配列
 */
export function extractWaveformPeaks(
  audioBuffer: AudioBuffer,
  samples: number,
): number[] {
  const channelData = audioBuffer.getChannelData(0)
  const blockSize = Math.floor(channelData.length / samples)
  const peaks: number[] = []

  for (let i = 0; i < samples; i++) {
    const start = i * blockSize
    const end = Math.min(start + blockSize, channelData.length)

    // RMS（Root Mean Square）を使用してより自然な波形を生成
    let sum = 0
    let count = 0

    for (let j = start; j < end; j++) {
      const value = channelData[j]
      sum += value * value
      count++
    }

    // RMS値を計算
    const rms = count > 0 ? Math.sqrt(sum / count) : 0
    peaks.push(rms)
  }

  // 正規化: 最大値を1.0にスケール
  const maxPeak = Math.max(...peaks)
  if (maxPeak > 0) {
    return peaks.map((peak) => peak / maxPeak)
  }

  return peaks
}

/**
 * 時間を MM:SS 形式でフォーマット
 * @param timeInSeconds - 秒単位の時間
 * @returns フォーマットされた時間文字列
 */
const SECONDS_IN_MINUTE = 60
export function formatTime(timeInSeconds: number): string {
  const minutes = Math.floor(timeInSeconds / SECONDS_IN_MINUTE)
  const seconds = Math.round(timeInSeconds % SECONDS_IN_MINUTE)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Canvasの高DPI対応設定
 * @param canvas - Canvas要素
 * @param width - 論理幅
 * @param height - 論理高さ
 * @returns CanvasRenderingContext2D
 */
export function setupHighDPICanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const dpr = window.devicePixelRatio || 1

  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  ctx.scale(dpr, dpr)

  return ctx
}

/**
 * 波形バーを描画
 * @param ctx - Canvas描画コンテキスト
 * @param x - X座標
 * @param y - Y座標
 * @param width - バー幅
 * @param height - バー高さ
 * @param color - バーの色
 */
export function drawWaveformBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
): void {
  ctx.fillStyle = color
  ctx.fillRect(x, y, Math.max(1, width), height)
}

/**
 * プログレスカーソルを描画
 * @param ctx - Canvas描画コンテキスト
 * @param x - X座標
 * @param canvasHeight - Canvas高さ
 * @param color - カーソルの色
 * @param width - カーソル幅
 */
export function drawProgressCursor(
  ctx: CanvasRenderingContext2D,
  x: number,
  canvasHeight: number,
  color: string,
  width = 2,
): void {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x, 0)
  ctx.lineTo(x, canvasHeight)
  ctx.stroke()
}

/**
 * 進捗率を計算
 * @param currentTime - 現在時間
 * @param duration - 総時間
 * @returns 0-1の範囲の進捗率
 */
export function calculateProgress(
  currentTime: number,
  duration: number,
): number {
  if (duration <= 0) return 0
  return Math.min(1, Math.max(0, currentTime / duration))
}

/**
 * クリック位置から進捗率を計算
 * @param clickX - クリックのX座標
 * @param containerWidth - コンテナの幅
 * @returns 0-1の範囲の進捗率
 */
export function calculateProgressFromClick(
  clickX: number,
  containerWidth: number,
): number {
  if (containerWidth <= 0) return 0
  return Math.min(1, Math.max(0, clickX / containerWidth))
}

/**
 * 音声ファイルの形式を検証
 * @param blob - 音声データのBlob
 * @returns 対応している形式かどうか
 */
export function validateAudioFormat(blob: Blob): boolean {
  const supportedTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
  ]

  return supportedTypes.some((type) => blob.type.includes(type))
}

/**
 * エラーメッセージを日本語化
 * @param error - エラーオブジェクト
 * @returns 日本語のエラーメッセージ
 */
export function getLocalizedErrorMessage(error: Error): string {
  const message = error.message.toLowerCase()

  if (message.includes('decode')) {
    return '音声ファイルの形式が対応していません'
  }
  if (message.includes('network')) {
    return 'ネットワークエラーが発生しました'
  }
  if (message.includes('permission')) {
    return '音声の再生権限がありません'
  }
  if (message.includes('not supported')) {
    return 'この音声形式はサポートされていません'
  }

  return error.message || '不明なエラーが発生しました'
}

/**
 * 波形背景を一度だけ描画（静的な波形）
 * @param canvas - Canvas要素
 * @param peaks - 波形データ
 * @param waveColor - 波形の色
 * @param barGap - バー間の隙間
 */
export function drawWaveformBackground(
  canvas: HTMLCanvasElement,
  peaks: number[],
  waveColor = '#1f2937',
  barGap = 1,
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx || peaks.length === 0) return

  // Canvas要素のサイズを設定
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1

  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr

  ctx.scale(dpr, dpr)

  const width = rect.width
  const height = rect.height
  const centerY = height / 2
  const barWidth = Math.max(
    1,
    (width - (peaks.length - 1) * barGap) / peaks.length,
  )

  // キャンバスをクリア
  ctx.clearRect(0, 0, width, height)

  // 波形背景を描画
  peaks.forEach((peak, index) => {
    const x = index * (barWidth + barGap)

    // 波形の高さを計算（最小高さを2px、最大高さを80%に制限）
    const normalizedPeak = Math.max(0.02, Math.min(0.9, peak))
    const barHeight = normalizedPeak * centerY * 0.9
    const y = centerY - barHeight / 2

    ctx.fillStyle = waveColor

    // 角丸の矩形を描画
    ctx.beginPath()
    ctx.roundRect(x, y, barWidth, barHeight, Math.min(barWidth / 2, 2))
    ctx.fill()
  })
}

/**
 * 高品質な波形描画（プログレス付き）
 * @param canvas - Canvas要素
 * @param peaks - 波形データ
 * @param progress - 再生進捗（0-1）
 * @param waveColor - 波形の色
 * @param progressColor - 進捗の色
 * @param barGap - バー間の隙間
 */
export function drawHighQualityWaveform(
  canvas: HTMLCanvasElement,
  peaks: number[],
  progress = 0,
  waveColor = '#1f2937',
  progressColor = '#dc2626',
  barGap = 1,
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx || peaks.length === 0) return

  // Canvas要素のサイズを設定
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1

  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr

  ctx.scale(dpr, dpr)

  const width = rect.width
  const height = rect.height
  const centerY = height / 2
  const barWidth = Math.max(
    1,
    (width - (peaks.length - 1) * barGap) / peaks.length,
  )
  const progressX = progress * width

  // キャンバスをクリア
  ctx.clearRect(0, 0, width, height)

  // 波形を描画
  peaks.forEach((peak, index) => {
    const x = index * (barWidth + barGap)

    // 波形の高さを計算（最小高さを2px、最大高さを80%に制限）
    const normalizedPeak = Math.max(0.02, Math.min(0.9, peak))
    const barHeight = normalizedPeak * centerY * 0.9
    const y = centerY - barHeight / 2

    // プログレス位置より前は progressColor、後は waveColor
    ctx.fillStyle = x < progressX ? progressColor : waveColor

    // 角丸の矩形を描画
    ctx.beginPath()
    ctx.roundRect(x, y, barWidth, barHeight, Math.min(barWidth / 2, 2))
    ctx.fill()
  })

  // 滑らかなプログレスカーソルを描画
  if (progress > 0) {
    ctx.save()

    // 滑らかなカーソルライン
    ctx.strokeStyle = progressColor
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    ctx.moveTo(progressX, 0)
    ctx.lineTo(progressX, height)
    ctx.stroke()

    // カーソル上部のハンドル
    ctx.fillStyle = progressColor
    ctx.globalAlpha = 1
    ctx.beginPath()
    ctx.arc(progressX, 8, 4, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}

/**
 * スムーズな波形データを生成（補間処理）
 * @param peaks - 元の波形データ
 * @param targetSamples - 目標サンプル数
 * @returns 補間された波形データ
 */
export function smoothWaveformData(
  peaks: number[],
  targetSamples: number,
): number[] {
  if (peaks.length === 0) return []
  if (peaks.length >= targetSamples) return peaks.slice(0, targetSamples)

  const smoothed: number[] = []
  const ratio = (peaks.length - 1) / (targetSamples - 1)

  for (let i = 0; i < targetSamples; i++) {
    const index = i * ratio
    const lowerIndex = Math.floor(index)
    const upperIndex = Math.min(lowerIndex + 1, peaks.length - 1)
    const fraction = index - lowerIndex

    // 線形補間
    const interpolated =
      peaks[lowerIndex] * (1 - fraction) + peaks[upperIndex] * fraction
    smoothed.push(interpolated)
  }

  return smoothed
}

/**
 * 波形データにスムージングフィルターを適用
 * @param peaks - 波形データ
 * @param windowSize - スムージングウィンドウサイズ
 * @returns スムージングされた波形データ
 */
export function applyWaveformSmoothing(
  peaks: number[],
  windowSize = 3,
): number[] {
  if (peaks.length === 0 || windowSize <= 1) return peaks

  const smoothed: number[] = []
  const halfWindow = Math.floor(windowSize / 2)

  for (let i = 0; i < peaks.length; i++) {
    let sum = 0
    let count = 0

    for (
      let j = Math.max(0, i - halfWindow);
      j <= Math.min(peaks.length - 1, i + halfWindow);
      j++
    ) {
      sum += peaks[j]
      count++
    }

    smoothed.push(sum / count)
  }

  return smoothed
}
