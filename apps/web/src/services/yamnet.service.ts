import * as tf from '@tensorflow/tfjs'
import type { AudioData, InferenceResult } from '../store/types'

/**
 * YAMNet音響分類結果の型定義
 */
export interface YAMNetClassification {
   /** AudioSetクラス名 */
   className: string
   /** 信頼度 (0-1) */
   confidence: number
   /** AudioSetクラスID */
   classId: number
}

/**
 * 音響環境の分類結果
 */
export interface SoundEnvironmentResult {
   /** 主要な音の種類 */
   primarySound: InferenceResult
   /** 環境タイプ */
   environment: 'indoor' | 'outdoor' | 'urban' | 'natural' | 'unknown'
   /** 全分類結果（上位5つ） */
   allClassifications: YAMNetClassification[]
}

/**
 * YAMNet音響分類サービス
 *
 * @description
 * TensorFlow.jsとYAMNetモデルを使用して音響分類を実行
 * AudioSetの521クラスから環境音を分類し、Sonory用の結果に変換
 */
export class YAMNetService {
   private model: tf.GraphModel | null = null
   private classNames: string[] = []
   private isLoading = false

   /**
    * YAMNetモデルのURL
    */
   private readonly modelUrl = 'https://tfhub.dev/google/yamnet/1'

   /**
    * 対象となる環境音のマッピング（日本語対応）
    */
   private readonly soundMapping: Record<string, string> = {
      Vehicle: '車の音',
      Car: '車の音',
      'Motor vehicle': '車の音',
      Truck: 'トラックの音',
      Bus: 'バスの音',
      Motorcycle: 'バイクの音',
      Bicycle: '自転車の音',
      'Traffic noise': '交通音',
      Train: '電車の音',
      Subway: '地下鉄の音',
      Aircraft: '飛行機の音',
      Helicopter: 'ヘリコプターの音',

      Rain: '雨音',
      Thunderstorm: '雷雨',
      Wind: '風の音',
      'Rain on surface': '雨音',
      Drip: '水滴の音',

      Bird: '鳥の鳴き声',
      'Bird vocalization': '鳥の鳴き声',
      Crow: 'カラスの鳴き声',
      Pigeon: '鳩の鳴き声',
      Seagull: 'カモメの鳴き声',

      Dog: '犬の鳴き声',
      Cat: '猫の鳴き声',
      Animal: '動物の声',

      'Construction noise': '工事の音',
      Jackhammer: 'ドリルの音',
      Hammer: 'ハンマーの音',
      'Power tool': '電動工具の音',

      Music: '音楽',
      Speech: '人の声',
      Crowd: '人混みの音',
      Footsteps: '足音',
      Door: 'ドアの音',
      Bell: 'ベルの音',
      Siren: 'サイレン',

      Water: '水の音',
      Stream: '川の音',
      Ocean: '海の音',
      Wave: '波の音',
   }

   /**
    * モデルを初期化
    */
   async initialize(): Promise<void> {
      if (this.model || this.isLoading) return

      try {
         this.isLoading = true
         console.log('🤖 YAMNetモデルを読み込み中...')

         // TensorFlow.jsのバックエンドを初期化
         await tf.ready()

         // YAMNetモデルをロード
         this.model = await tf.loadGraphModel(this.modelUrl)

         // クラス名を取得（AudioSetのクラスマップ）
         await this.loadClassNames()

         console.log('✅ YAMNetモデルの初期化完了')
         console.log(`📊 対応クラス数: ${this.classNames.length}`)
      } catch (error) {
         console.error('❌ YAMNetモデルの初期化に失敗:', error)
         throw new Error('YAMNetモデルの初期化に失敗しました')
      } finally {
         this.isLoading = false
      }
   }

   /**
    * AudioSetのクラス名を読み込み
    */
   private async loadClassNames(): Promise<void> {
      try {
         // AudioSetのクラスマップを取得
         const response = await fetch(
            'https://raw.githubusercontent.com/tensorflow/models/master/research/audioset/yamnet/yamnet_class_map.csv'
         )
         const csvText = await response.text()

         // CSVをパース
         const lines = csvText.trim().split('\n')
         this.classNames = lines.slice(1).map(line => {
            const parts = line.split(',')
            return parts[2]?.replace(/"/g, '') || '' // display_name列
         })
      } catch (error) {
         console.warn('⚠️ クラス名の読み込みに失敗、デフォルトクラス名を使用:', error)
         // フォールバック: 代表的なクラス名を手動定義
         this.classNames = this.getDefaultClassNames()
      }
   }

   /**
    * デフォルトクラス名（クラスマップ取得失敗時）
    */
   private getDefaultClassNames(): string[] {
      return [
         'Speech',
         'Male speech',
         'Female speech',
         'Child speech',
         'Conversation',
         'Narration',
         'Babbling',
         'Speech synthesizer',
         'Shout',
         'Bellow',
         'Music',
         'Musical instrument',
         'Piano',
         'Guitar',
         'Drum',
         'Vehicle',
         'Car',
         'Motor vehicle',
         'Truck',
         'Bus',
         'Motorcycle',
         'Traffic noise',
         'Train',
         'Aircraft',
         'Helicopter',
         'Animal',
         'Dog',
         'Cat',
         'Bird',
         'Bird vocalization',
         'Water',
         'Rain',
         'Thunder',
         'Wind',
         'Stream',
         'Construction noise',
         'Power tool',
         'Hammer',
         'Jackhammer',
         'Bell',
         'Siren',
         'Alarm',
         'Footsteps',
         'Door',
      ]
   }

   /**
    * 音声データから音響分類を実行
    */
   async classifyAudio(audioData: AudioData): Promise<SoundEnvironmentResult> {
      if (!this.model) {
         await this.initialize()
      }

      if (!this.model) {
         throw new Error('YAMNetモデルが初期化されていません')
      }

      try {
         console.log('🎵 音響分析を開始...')

         // 音声データを処理
         const audioTensor = await this.preprocessAudio(audioData.blob)

         // YAMNetで推論実行
         const predictions = this.model.predict(audioTensor) as tf.Tensor
         const scores = await predictions.data()

         // 結果を解析
         const classifications = this.parseClassifications(Array.from(scores))
         const result = this.createSoundEnvironmentResult(classifications)

         // メモリ解放
         audioTensor.dispose()
         predictions.dispose()

         console.log('✅ 音響分析完了:', result.primarySound)
         return result
      } catch (error) {
         console.error('❌ 音響分析に失敗:', error)
         throw new Error('音響分析に失敗しました')
      }
   }

   /**
    * 音声データを前処理（YAMNet用）
    */
   private async preprocessAudio(audioBlob: Blob): Promise<tf.Tensor> {
      return new Promise((resolve, reject) => {
         const audio = new Audio()
         const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
         const audioContext = new AudioContextClass()

         const reader = new FileReader()
         reader.onload = async e => {
            try {
               const arrayBuffer = e.target?.result as ArrayBuffer
               const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

               // モノラル化
               const channelData = audioBuffer.getChannelData(0)

               // 16kHzにリサンプリング（YAMNet要件）
               const targetSampleRate = 16000
               const resampledData = this.resampleAudio(
                  channelData,
                  audioBuffer.sampleRate,
                  targetSampleRate
               )

               // テンソルに変換
               const audioTensor = tf.tensor1d(resampledData)
               resolve(audioTensor)
            } catch (error) {
               reject(error)
            }
         }

         reader.onerror = () => reject(new Error('音声ファイルの読み込みに失敗'))
         reader.readAsArrayBuffer(audioBlob)
      })
   }

   /**
    * 音声をリサンプリング
    */
   private resampleAudio(
      audioData: Float32Array,
      originalSampleRate: number,
      targetSampleRate: number
   ): Float32Array {
      if (originalSampleRate === targetSampleRate) {
         return audioData
      }

      const ratio = originalSampleRate / targetSampleRate
      const newLength = Math.round(audioData.length / ratio)
      const result = new Float32Array(newLength)

      for (let i = 0; i < newLength; i++) {
         const index = i * ratio
         const lowerIndex = Math.floor(index)
         const upperIndex = Math.min(lowerIndex + 1, audioData.length - 1)
         const fraction = index - lowerIndex

         result[i] = audioData[lowerIndex] * (1 - fraction) + audioData[upperIndex] * fraction
      }

      return result
   }

   /**
    * 分類結果をパース
    */
   private parseClassifications(scores: number[]): YAMNetClassification[] {
      const classifications: YAMNetClassification[] = []

      for (let i = 0; i < scores.length && i < this.classNames.length; i++) {
         if (scores[i] > 0.01) {
            // 信頼度1%以上のみ
            classifications.push({
               className: this.classNames[i] || `Class_${i}`,
               confidence: scores[i],
               classId: i,
            })
         }
      }

      // 信頼度順でソート
      return classifications.sort((a, b) => b.confidence - a.confidence)
   }

   /**
    * Sonory用の結果に変換
    */
   private createSoundEnvironmentResult(
      classifications: YAMNetClassification[]
   ): SoundEnvironmentResult {
      const topClassifications = classifications.slice(0, 5)

      // 最も信頼度の高い分類を日本語に変換
      const primaryClassification = topClassifications[0]
      const japaneseLabel = this.mapToJapanese(primaryClassification?.className || 'Unknown')

      // 環境タイプを推定
      const environment = this.detectEnvironment(topClassifications)

      return {
         primarySound: {
            label: japaneseLabel,
            confidence: primaryClassification?.confidence || 0,
         },
         environment,
         allClassifications: topClassifications,
      }
   }

   /**
    * 英語クラス名を日本語にマッピング
    */
   public mapToJapanese(className: string): string {
      // 完全一致を探す
      if (this.soundMapping[className]) {
         return this.soundMapping[className]
      }

      // 部分一致を探す
      for (const [key, value] of Object.entries(this.soundMapping)) {
         if (
            className.toLowerCase().includes(key.toLowerCase()) ||
            key.toLowerCase().includes(className.toLowerCase())
         ) {
            return value
         }
      }

      // マッピングが見つからない場合は元の名前を返す
      return className
   }

   /**
    * 音響環境を推定
    */
   private detectEnvironment(
      classifications: YAMNetClassification[]
   ): 'indoor' | 'outdoor' | 'urban' | 'natural' | 'unknown' {
      const classNames = classifications.map(c => c.className.toLowerCase())

      // 自然環境の音
      if (
         classNames.some(
            name =>
               name.includes('bird') ||
               name.includes('water') ||
               name.includes('rain') ||
               name.includes('wind') ||
               name.includes('thunder') ||
               name.includes('stream')
         )
      ) {
         return 'natural'
      }

      // 都市環境の音
      if (
         classNames.some(
            name =>
               name.includes('vehicle') ||
               name.includes('traffic') ||
               name.includes('car') ||
               name.includes('construction') ||
               name.includes('siren') ||
               name.includes('horn')
         )
      ) {
         return 'urban'
      }

      // 屋内の音
      if (
         classNames.some(
            name =>
               name.includes('speech') ||
               name.includes('music') ||
               name.includes('door') ||
               name.includes('footsteps')
         )
      ) {
         return 'indoor'
      }

      // その他は屋外として分類
      return 'outdoor'
   }

   /**
    * モデルの状態を取得
    */
   get isReady(): boolean {
      return this.model !== null
   }

   /**
    * リソースを解放
    */
   dispose(): void {
      if (this.model) {
         this.model.dispose()
         this.model = null
      }
   }
}
