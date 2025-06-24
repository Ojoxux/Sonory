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
        
        # 鉄道関連
        "Train": "電車の音",
        "Rail transport": "電車の音",
        "Train horn": "電車の音",
        
        # 自然音
        "Bird": "鳥の鳴き声",
        "Bird vocalization, bird call, bird song": "鳥の鳴き声",
        "Rain": "雨音",
        "Rainfall": "雨音",
        "Rain on surface": "雨音",
        "Wind": "風の音",
        "Wind noise (microphone)": "風の音",
        
        # 人間の声
        "Speech": "人の声",
        "Human voice": "人の声",
        "Conversation": "人の声",
        "Child speech, kid speaking": "人の声",
        "Male speech, man speaking": "人の声",
        "Female speech, woman speaking": "人の声",
        
        # 音楽
        "Music": "音楽",
        "Musical instrument": "音楽",
        "Singing": "音楽",
        
        # 工事・作業音
        "Construction noise": "工事の音",
        "Jackhammer": "工事の音",
        "Tools": "工事の音",
        "Power tool": "工事の音",
        "Drilling": "工事の音",
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
            クラス名のリスト
        """
        with tf.io.gfile.GFile(class_map_path) as f:
            class_names = [line.strip() for line in f.readlines()]
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
            # YAMNet推論実行
            scores, _, _ = self.model(audio_waveform)
            
            # 平均スコアを計算（複数のフレームから）
            mean_scores = np.mean(scores, axis=0)
            
            # 上位結果を取得
            top_indices = np.argsort(mean_scores)[-top_k:][::-1]
            top_scores = mean_scores[top_indices]
            
            # AudioSetクラス名を取得
            top_classes = [self.class_names[i] for i in top_indices]
            
            # 日本語カテゴリに変換
            japanese_results = self._convert_to_japanese(
                top_classes, top_scores
            )
            
            # 環境タイプを推定
            env_scores, primary_env = self._estimate_environment_type(
                top_classes, top_scores
            )
            
            logger.info(
                "Audio classification completed",
                japanese_results=japanese_results,
                primary_environment=primary_env
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
            日本語カテゴリと信頼度のリスト
        """
        japanese_categories: Dict[str, float] = {}
        
        # AudioSetクラスを日本語カテゴリにマッピング
        for class_name, score in zip(class_names, scores):
            japanese_category = self._find_japanese_category(class_name)
            
            if japanese_category:
                # 同じカテゴリの最高スコアを保持
                if (japanese_category not in japanese_categories or
                    score > japanese_categories[japanese_category]):
                    japanese_categories[japanese_category] = float(score)
        
        # 信頼度順にソート
        sorted_results = sorted(
            japanese_categories.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return [
            {"label": category, "confidence": confidence}
            for category, confidence in sorted_results
        ]
    
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
        
        # 部分一致で検索
        audioset_lower = audioset_class.lower()
        for audioset_key, japanese_category in self.AUDIOSET_TO_JAPANESE.items():
            if audioset_key.lower() in audioset_lower:
                return japanese_category
        
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
            タプル：(環境タイプ別信頼度, 主要環境タイプ)
        """
        env_scores = {"urban": 0.0, "natural": 0.0, "indoor": 0.0, "outdoor": 0.0}
        
        for class_name, score in zip(class_names, scores):
            class_lower = class_name.lower()
            
            for env_type, keywords in self.ENVIRONMENT_KEYWORDS.items():
                for keyword in keywords:
                    if keyword.lower() in class_lower:
                        env_scores[env_type] += float(score)
                        break
        
        # 正規化
        total_score = sum(env_scores.values())
        if total_score > 0:
            env_scores = {k: v / total_score for k, v in env_scores.items()}
        
        # 主要環境タイプを決定
        primary_env = max(env_scores.items(), key=lambda x: x[1])[0]
        
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