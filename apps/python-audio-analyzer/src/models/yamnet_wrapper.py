"""
YAMNet model wrapper for environmental sound classification.

YAMNetを使用した環境音分類のためのラッパークラス。
AudioSetの521クラスを日本語12カテゴリに変換し、環境タイプを推定します。
"""

import asyncio
import logging
from typing import Dict, List, Optional, Tuple
import numpy as np
import tensorflow as tf
import tensorflow_hub as hub
import structlog

logger = structlog.get_logger(__name__)


class YAMNetClassifier:
    """
    YAMNetモデルを使用した音響分類クラス
    
    AudioSetの521クラスを日本語12カテゴリにマッピングし、
    環境タイプ（urban/natural/indoor/outdoor）も推定します。
    """
    
    # AudioSetクラスから日本語カテゴリへのマッピング
    AUDIOSET_TO_JAPANESE = {
        # 交通関連
        "Motor vehicle (road)": "車の音",
        "Car": "車の音", 
        "Vehicle horn, car horn, honking": "車の音",
        "Truck": "トラックの音",
        "Motorcycle": "バイクの音",
        "Bus": "バスの音",
        "Traffic noise, roadway noise": "交通音",
        "Engine": "エンジン音",
        "Accelerating, revving, vroom": "車の音",
        "Car alarm": "車の音",
        "Tire squeal": "車の音",
        
        # 鉄道関連
        "Train": "電車の音",
        "Rail transport": "電車の音",
        "Train horn": "電車の音",
        "Railroad car, train wagon": "電車の音",
        
        # 航空機
        "Aircraft": "飛行機の音",
        "Airplane": "飛行機の音",
        "Helicopter": "ヘリコプターの音",
        
        # 自然音
        "Bird": "鳥の鳴き声",
        "Bird vocalization, bird call, bird song": "鳥の鳴き声",
        "Chirp, tweet": "鳥の鳴き声",
        "Rain": "雨音",
        "Rainfall": "雨音",
        "Rain on surface": "雨音",
        "Wind": "風の音",
        "Wind noise (microphone)": "風の音",
        "Thunder": "雷の音",
        "Thunderstorm": "雷の音",
        "Water": "水の音",
        "Stream": "水の音",
        "Ocean": "海の音",
        "Waves, surf": "海の音",
        
        # 動物
        "Animal": "動物の声",
        "Dog": "犬の鳴き声",
        "Cat": "猫の鳴き声",
        "Bark": "犬の鳴き声",
        "Meow": "猫の鳴き声",
        "Roar": "動物の声",
        
        # 人間の声・活動
        "Speech": "人の声",
        "Human voice": "人の声",
        "Conversation": "人の声",
        "Child speech, kid speaking": "人の声",
        "Male speech, man speaking": "人の声",
        "Female speech, woman speaking": "人の声",
        "Laughter": "笑い声",
        "Crying, sobbing": "泣き声",
        "Shout": "叫び声",
        "Whispering": "ささやき声",
        "Sneeze": "くしゃみ",
        "Cough": "咳",
        
        # 音楽・楽器
        "Music": "音楽",
        "Musical instrument": "音楽",
        "Singing": "音楽",
        "Piano": "音楽",
        "Guitar": "音楽",
        "Drum": "音楽",
        "Bass drum": "音楽",
        "Electronic music": "音楽",
        "Rock music": "音楽",
        "Pop music": "音楽",
        
        # 工事・作業音
        "Construction noise": "工事の音",
        "Jackhammer": "工事の音",
        "Tools": "工事の音",
        "Power tool": "工事の音",
        "Drilling": "工事の音",
        "Hammer": "工事の音",
        "Saw": "工事の音",
        
        # 家庭・屋内音
        "Door": "ドアの音",
        "Doorbell": "ベルの音",
        "Footsteps": "足音",
        "Typing": "タイピング音",
        "Clapping": "拍手",
        "Microwave oven": "電子機器音",
        "Vacuum cleaner": "掃除機の音",
        "Air conditioning": "エアコンの音",
        "Television": "テレビの音",
        "Radio": "ラジオの音",
        
        # 警報・サイレン
        "Siren": "サイレン",
        "Emergency vehicle": "緊急車両",
        "Fire alarm": "火災警報",
        "Smoke detector": "煙感知器",
        "Alarm": "警報音",
        
        # 電子音・機械音
        "Beep, bleep": "電子音",
        "Click": "クリック音",
        "Tick": "時計の音",
        "Buzz": "ブザー音",
        "Dial tone": "電話音",
        "Phone": "電話音",
        "Ringtone": "着信音",
        
        # その他の環境音
        "Silence": "静寂",
        "White noise": "ホワイトノイズ",
        "Static": "雑音",
        "Hum": "うなり音",
        "Rumble": "低音の響き",
        "Explosion": "爆発音",
        "Gunshot, gunfire": "銃声",
        "Fireworks": "花火の音",
    }
    
    # 環境タイプ分類のためのキーワード
    ENVIRONMENT_KEYWORDS = {
        "urban": [
            "Motor vehicle", "Car", "Truck", "Motorcycle", "Bus", "Traffic",
            "Train", "Construction", "Power tool", "Siren"
        ],
        "natural": [
            "Bird", "Rain", "Wind", "Water", "Stream", "Ocean", "Thunder",
            "Insect", "Animal"
        ],
        "indoor": [
            "Speech", "Music", "Television", "Radio", "Air conditioning",
            "Door", "Footsteps", "Typing"
        ],
        "outdoor": [
            "Bird", "Rain", "Wind", "Traffic", "Construction", "Aircraft",
            "Thunder", "Water"
        ]
    }
    
    def __init__(self, model_url: str = "https://tfhub.dev/google/yamnet/1"):
        """
        YAMNetClassifierを初期化
        
        Args:
            model_url: TensorFlow HubのYAMNetモデルURL
        """
        self.model_url = model_url
        self.model: Optional[tf.keras.Model] = None
        self.class_names: Optional[List[str]] = None
        self._initialized = False
        
    async def initialize(self) -> None:
        """
        モデルを非同期で初期化
        
        Raises:
            RuntimeError: モデル初期化に失敗した場合
        """
        if self._initialized:
            logger.info("YAMNet model already initialized")
            return
            
        try:
            logger.info("Initializing YAMNet model", model_url=self.model_url)
            
            # 非同期でモデルを読み込み
            loop = asyncio.get_event_loop()
            self.model = await loop.run_in_executor(
                None, hub.load, self.model_url
            )
            
            # クラス名を読み込み
            class_map_path = self.model.class_map_path().numpy()
            self.class_names = await loop.run_in_executor(
                None, self._load_class_names, class_map_path.decode('utf-8')
            )
            
            self._initialized = True
            logger.info(
                "YAMNet model initialized successfully",
                num_classes=len(self.class_names) if self.class_names else 0
            )
            
        except Exception as e:
            logger.error("Failed to initialize YAMNet model", error=str(e))
            raise RuntimeError(f"YAMNet initialization failed: {e}")
    
    def _load_class_names(self, class_map_path: str) -> List[str]:
        """
        クラス名リストを読み込み
        
        Args:
            class_map_path: クラスマップファイルのパス
            
        Returns:
            クラス名のリスト（display_nameのみ）
        """
        class_names = []
        
        with tf.io.gfile.GFile(class_map_path) as f:
            for line_num, line in enumerate(f.readlines()):
                line = line.strip()
                if not line:
                    continue
                    
                # CSVファイルの場合、index,mid,display_name の形式
                # display_name（最後の列）のみを抽出
                parts = line.split(',', 2)  # 最大3つに分割（index, mid, display_name）
                
                if len(parts) >= 3:
                    # display_nameの部分を取得（引用符を除去）
                    display_name = parts[2].strip().strip('"')
                    class_names.append(display_name)
                elif len(parts) == 1:
                    # 単一の名前の場合はそのまま使用
                    class_names.append(parts[0])
                else:
                    # 想定外の形式の場合はログ出力
                    logger.warning(
                        "Unexpected class map format",
                        line_num=line_num,
                        line=line,
                        parts_count=len(parts)
                    )
                    class_names.append(line)  # フォールバック
        
        logger.info(
            "YAMNet class names loaded",
            total_classes=len(class_names),
            sample_classes=class_names[:5] if class_names else []
        )
        
        return class_names
    
    def classify_audio(
        self,
        audio_waveform: np.ndarray,
        sample_rate: int = 16000,
        top_k: int = 5
    ) -> Tuple[List[Dict[str, float]], Dict[str, float], str]:
        """
        音声の分類を実行
        
        Args:
            audio_waveform: 音声波形データ（1次元numpy配列）
            sample_rate: サンプリングレート（YAMNetは16kHzを想定）
            top_k: 返却する上位結果数
            
        Returns:
            タプル：(日本語分類結果, 環境タイプ信頼度, 主要環境タイプ)
            
        Raises:
            RuntimeError: モデルが初期化されていない場合
            ValueError: 音声データが不正な場合
        """
        if not self._initialized or self.model is None:
            raise RuntimeError("YAMNet model not initialized")
            
        if audio_waveform.ndim != 1:
            raise ValueError("Audio waveform must be 1-dimensional")
            
        if sample_rate != 16000:
            logger.warning(
                "Sample rate is not 16kHz, may affect accuracy",
                sample_rate=sample_rate
            )
        
        try:
            # 音声データの詳細解析（デバッグ用）
            audio_stats = {
                "length_samples": len(audio_waveform),
                "duration_seconds": len(audio_waveform) / sample_rate,
                "max_amplitude": float(np.max(np.abs(audio_waveform))),
                "rms_energy": float(np.sqrt(np.mean(audio_waveform**2))),
                "mean_amplitude": float(np.mean(np.abs(audio_waveform))),
                "zero_crossings": int(np.sum(np.diff(np.sign(audio_waveform)) != 0)),
            }
            
            logger.info(
                "Audio waveform analysis",
                audio_stats=audio_stats
            )
            
            # 音声が静寂すぎる場合の警告
            if audio_stats["max_amplitude"] < 0.001:
                logger.warning(
                    "Audio amplitude is very low - may affect classification accuracy",
                    max_amplitude=audio_stats["max_amplitude"]
                )
            
            # YAMNet推論実行
            scores, _, _ = self.model(audio_waveform)
            
            # 推論結果の詳細解析
            mean_scores = np.mean(scores, axis=0)
            
            # 生スコアの統計情報
            score_stats = {
                "total_frames": scores.shape[0],
                "total_classes": scores.shape[1],
                "max_score": float(np.max(mean_scores)),
                "min_score": float(np.min(mean_scores)),
                "mean_score": float(np.mean(mean_scores)),
                "std_score": float(np.std(mean_scores)),
                "scores_above_1percent": int(np.sum(mean_scores > 0.01)),
                "scores_above_5percent": int(np.sum(mean_scores > 0.05)),
            }
            
            logger.info(
                "YAMNet inference statistics",
                score_stats=score_stats
            )
            
            # 上位結果を取得（より多くの候補を確認）
            extended_top_k = min(20, len(mean_scores))  # 最大20件
            top_indices = np.argsort(mean_scores)[-extended_top_k:][::-1]
            top_scores = mean_scores[top_indices]
            
            # AudioSetクラス名を取得
            top_classes = [self.class_names[i] for i in top_indices]
            
            # 生の上位結果をログ出力
            raw_results = [
                {"class": class_name, "score": float(score)}
                for class_name, score in zip(top_classes, top_scores)
            ]
            
            logger.info(
                "Raw YAMNet top results",
                raw_results=raw_results[:10]  # 上位10件のみ表示
            )
            
            # 実際のtop_k分だけを返却用に調整
            final_top_indices = top_indices[:top_k]
            final_top_scores = top_scores[:top_k]
            final_top_classes = [self.class_names[i] for i in final_top_indices]
            
            # 日本語カテゴリに変換
            japanese_results = self._convert_to_japanese(
                final_top_classes, final_top_scores
            )
            
            # 環境タイプを推定
            env_scores, primary_env = self._estimate_environment_type(
                final_top_classes, final_top_scores
            )
            
            logger.info(
                "Audio classification completed",
                japanese_results=japanese_results,
                primary_environment=primary_env,
                audio_quality=audio_stats,
                inference_quality=score_stats
            )
            
            return japanese_results, env_scores, primary_env
            
        except Exception as e:
            logger.error("Audio classification failed", error=str(e))
            raise RuntimeError(f"Classification failed: {e}")
    
    def _convert_to_japanese(
        self,
        class_names: List[str],
        scores: np.ndarray
    ) -> List[Dict[str, float]]:
        """
        AudioSetクラスを日本語カテゴリに変換
        
        Args:
            class_names: AudioSetクラス名リスト
            scores: 各クラスの信頼度
            
        Returns:
            日本語カテゴリと信頼度のリスト（100%ベースに正規化）
        """
        japanese_categories: Dict[str, float] = {}
        unmapped_classes = []
        
        # デバッグ: 検出されたAudioSetクラスをログ出力
        logger.info(
            "Detected AudioSet classes",
            detected_classes=[
                {"class": class_name, "score": float(score)}
                for class_name, score in zip(class_names, scores)
                if score > 0.01  # 1%以上の信頼度のみ
            ]
        )
        
        # AudioSetクラスを日本語カテゴリにマッピング
        for class_name, score in zip(class_names, scores):
            # 最低閾値を設定（0.1%以上に緩和）
            if score < 0.001:  # 0.005から0.001に変更
                continue
                
            japanese_category = self._find_japanese_category(class_name)
            
            if japanese_category:
                # 同じカテゴリの最高スコアを保持
                if (japanese_category not in japanese_categories or
                    score > japanese_categories[japanese_category]):
                    japanese_categories[japanese_category] = float(score)
            else:
                # マッピングされないクラスも記録
                unmapped_classes.append({
                    "class": class_name,
                    "score": float(score)
                })
        
        # マッピングされないクラスをログ出力
        if unmapped_classes:
            logger.info(
                "Unmapped AudioSet classes found",
                unmapped_classes=unmapped_classes[:5]  # 上位5件のみ
            )
        
        # 結果が空の場合のフォールバック
        if not japanese_categories:
            logger.warning("No Japanese categories mapped, using default")
            japanese_categories["不明な音"] = 1.0
        
        # 信頼度の合計を計算
        total_confidence = sum(japanese_categories.values())
        
        # 100%ベースに正規化
        if total_confidence > 0:
            normalized_categories = {
                category: (confidence / total_confidence)
                for category, confidence in japanese_categories.items()
            }
        else:
            # 合計が0の場合は均等に分配
            num_categories = len(japanese_categories)
            normalized_categories = {
                category: 1.0 / num_categories
                for category in japanese_categories.keys()
            }
        
        # 信頼度順にソート
        sorted_results = sorted(
            normalized_categories.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        result = [
            {"label": category, "confidence": confidence}
            for category, confidence in sorted_results
        ]
        
        # 正規化後の合計を確認（デバッグ用）
        normalized_total = sum(r["confidence"] for r in result)
        
        logger.info(
            "Japanese classification results",
            results=result,
            total_mapped=len(result),
            original_total=total_confidence,
            normalized_total=normalized_total
        )
        
        return result
    
    def _find_japanese_category(self, audioset_class: str) -> Optional[str]:
        """
        AudioSetクラス名から対応する日本語カテゴリを検索
        
        Args:
            audioset_class: AudioSetクラス名
            
        Returns:
            対応する日本語カテゴリ、見つからない場合はNone
        """
        # 完全一致を優先
        if audioset_class in self.AUDIOSET_TO_JAPANESE:
            return self.AUDIOSET_TO_JAPANESE[audioset_class]
        
        # 部分一致で検索（双方向）
        audioset_lower = audioset_class.lower()
        
        # AudioSetキーがクラス名に含まれる場合
        for audioset_key, japanese_category in self.AUDIOSET_TO_JAPANESE.items():
            audioset_key_lower = audioset_key.lower()
            
            # 双方向の部分一致チェック
            if (audioset_key_lower in audioset_lower or 
                audioset_lower in audioset_key_lower):
                return japanese_category
        
        # キーワードベースの追加マッピング
        keyword_mappings = {
            # 交通・車両
            ("car", "vehicle", "motor", "auto"): "車の音",
            ("truck", "lorry"): "トラックの音", 
            ("bike", "motorcycle", "motorbike"): "バイクの音",
            ("bus",): "バスの音",
            ("train", "rail", "locomotive"): "電車の音",
            ("traffic", "road"): "交通音",
            ("aircraft", "plane", "airplane", "jet"): "飛行機の音",
            ("helicopter", "chopper"): "ヘリコプターの音",
            
            # 自然・動物
            ("bird", "chirp", "tweet", "song"): "鳥の鳴き声",
            ("rain", "rainfall", "drizzle"): "雨音",
            ("wind", "breeze", "gust"): "風の音",
            ("water", "stream", "river", "ocean", "wave", "surf"): "水の音",
            ("thunder", "storm"): "雷の音",
            ("dog", "bark", "woof"): "犬の鳴き声",
            ("cat", "meow", "purr"): "猫の鳴き声",
            ("animal", "creature"): "動物の声",
            
            # 人の声・活動
            ("speech", "voice", "speak", "talk", "conversation"): "人の声",
            ("laugh", "giggle", "chuckle"): "笑い声",
            ("cry", "weep", "sob"): "泣き声",
            ("shout", "yell", "scream"): "叫び声",
            ("whisper",): "ささやき声",
            ("sneeze",): "くしゃみ",
            ("cough",): "咳",
            
            # 音楽・楽器
            ("music", "musical", "song", "melody"): "音楽",
            ("sing", "vocal", "choir"): "音楽",
            ("piano", "keyboard"): "音楽",
            ("guitar", "bass"): "音楽",
            ("drum", "percussion"): "音楽",
            
            # 工事・作業
            ("construction", "building", "work"): "工事の音",
            ("drill", "drilling"): "工事の音",
            ("hammer", "hammering"): "工事の音",
            ("saw", "sawing", "cutting"): "工事の音",
            ("tool", "power tool"): "工事の音",
            
            # 家庭・電子機器
            ("door", "gate"): "ドアの音",
            ("bell", "doorbell", "chime"): "ベルの音",
            ("foot", "step", "walk"): "足音",
            ("type", "typing", "keyboard"): "タイピング音",
            ("clap", "applause"): "拍手",
            ("microwave", "oven"): "電子機器音",
            ("vacuum", "cleaner"): "掃除機の音",
            ("air conditioning", "ac", "hvac"): "エアコンの音",
            ("tv", "television"): "テレビの音",
            ("radio",): "ラジオの音",
            
            # 警報・緊急
            ("siren", "alarm", "warning"): "警報音",
            ("emergency", "ambulance", "fire truck"): "緊急車両",
            ("beep", "bleep", "buzz", "buzzer"): "電子音",
            ("phone", "telephone", "ring", "ringtone"): "電話音",
            
            # その他
            ("silence", "quiet"): "静寂",
            ("noise", "static", "hiss"): "雑音",
            ("tick", "clock"): "時計の音",
            ("explosion", "blast", "bang"): "爆発音",
            ("gunshot", "gun", "shot"): "銃声",
            ("firework", "firecracker"): "花火の音",
        }
        
        # キーワードマッチング
        for keywords, category in keyword_mappings.items():
            for keyword in keywords:
                if keyword in audioset_lower:
                    return category
        
        return None
    
    def _estimate_environment_type(
        self,
        class_names: List[str],
        scores: np.ndarray
    ) -> Tuple[Dict[str, float], str]:
        """
        環境タイプを推定
        
        Args:
            class_names: AudioSetクラス名リスト
            scores: 各クラスの信頼度
            
        Returns:
            タプル：(環境タイプ別信頼度（100%ベースに正規化）, 主要環境タイプ)
        """
        env_scores = {"urban": 0.0, "natural": 0.0, "indoor": 0.0, "outdoor": 0.0}
        
        for class_name, score in zip(class_names, scores):
            class_lower = class_name.lower()
            
            for env_type, keywords in self.ENVIRONMENT_KEYWORDS.items():
                for keyword in keywords:
                    if keyword.lower() in class_lower:
                        env_scores[env_type] += float(score)
                        break
        
        # 正規化（100%ベース）
        total_score = sum(env_scores.values())
        if total_score > 0:
            env_scores = {k: v / total_score for k, v in env_scores.items()}
        else:
            # スコアがすべて0の場合は均等に分配
            num_env_types = len(env_scores)
            env_scores = {k: 1.0 / num_env_types for k in env_scores.keys()}
        
        # 主要環境タイプを決定
        primary_env = max(env_scores.items(), key=lambda x: x[1])[0]
        
        # 正規化後の合計を確認（デバッグ用）
        normalized_total = sum(env_scores.values())
        logger.info(
            "Environment type estimation",
            env_scores=env_scores,
            primary_env=primary_env,
            original_total=total_score,
            normalized_total=normalized_total
        )
        
        return env_scores, primary_env
    
    async def cleanup(self) -> None:
        """
        リソースをクリーンアップ
        """
        logger.info("Cleaning up YAMNet resources")
        self.model = None
        self.class_names = None
        self._initialized = False


class YAMNetManager:
    """
    YAMNetClassifierの管理クラス
    
    シングルトンパターンでモデルインスタンスを管理し、
    アプリケーション全体で共有します。
    """
    
    def __init__(self):
        """YAMNetManagerを初期化"""
        self.classifier: Optional[YAMNetClassifier] = None
        self._initialized = False
    
    async def initialize(self) -> None:
        """
        YAMNetClassifierを初期化
        
        Raises:
            RuntimeError: 初期化に失敗した場合
        """
        if self._initialized:
            logger.info("YAMNetManager already initialized")
            return
        
        try:
            logger.info("Initializing YAMNetManager")
            self.classifier = YAMNetClassifier()
            await self.classifier.initialize()
            self._initialized = True
            logger.info("YAMNetManager initialized successfully")
            
        except Exception as e:
            logger.error("YAMNetManager initialization failed", error=str(e))
            raise RuntimeError(f"YAMNetManager initialization failed: {e}")
    
    def get_classifier(self) -> YAMNetClassifier:
        """
        YAMNetClassifierインスタンスを取得
        
        Returns:
            初期化済みのYAMNetClassifierインスタンス
            
        Raises:
            RuntimeError: まだ初期化されていない場合
        """
        if not self._initialized or self.classifier is None:
            raise RuntimeError("YAMNetManager not initialized")
        
        return self.classifier
    
    async def cleanup(self) -> None:
        """
        リソースをクリーンアップ
        """
        if self.classifier:
            await self.classifier.cleanup()
        self._initialized = False
        logger.info("YAMNetManager cleanup completed") 