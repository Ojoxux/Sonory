"""
Audio analysis service integrating YAMNet and audio processing.

YAMNetClassifierとAudioProcessorを統合した音響分析サービス。
音響分析の全体フローを管理し、パフォーマンス測定も行います。
"""

import time
from typing import Dict, List, Optional, Union, Any
from pathlib import Path
import structlog
from pydantic import BaseModel, Field

try:
    from ..models.yamnet_wrapper import YAMNetManager, YAMNetClassifier
    from .audio_processor import AudioProcessor, ProcessedAudio, AudioMetadata
except ImportError:
    from models.yamnet_wrapper import YAMNetManager, YAMNetClassifier
    from services.audio_processor import AudioProcessor, ProcessedAudio, AudioMetadata

logger = structlog.get_logger(__name__)


class ClassificationResult(BaseModel):
    """
    分類結果
    
    YAMNetによる音響分類の個別結果を表現します。
    """
    label: str = Field(..., description="分類ラベル（日本語）")
    confidence: float = Field(..., description="信頼度（0-1）", ge=0, le=1)


class EnvironmentAnalysis(BaseModel):
    """
    環境分析結果
    
    音響環境の特徴分析結果を表現します。
    """
    primary_type: str = Field(..., description="主要環境タイプ")
    type_scores: Dict[str, float] = Field(..., description="環境タイプ別信頼度")
    description: Optional[str] = Field(None, description="環境の説明")


class AnalysisResult(BaseModel):
    """
    総合分析結果
    
    音響分析の完全な結果を表現します。
    """
    classifications: List[ClassificationResult] = Field(..., description="分類結果リスト")
    environment: EnvironmentAnalysis = Field(..., description="環境分析結果")
    audio_metadata: AudioMetadata = Field(..., description="音声メタデータ")
    processing_info: Dict[str, Any] = Field(..., description="処理情報")
    performance_metrics: Dict[str, float] = Field(..., description="パフォーマンス指標")
    timestamp: float = Field(default_factory=time.time, description="分析実行時刻")


class AudioAnalyzer:
    """
    音響分析サービス
    
    YAMNetとAudioProcessorを統合し、音響分析の全体フローを管理します。
    """
    
    def __init__(self, yamnet_manager: YAMNetManager, audio_timeout: float = 30.0):
        """
        AudioAnalyzerを初期化
        
        Args:
            yamnet_manager: 初期化済みのYAMNetManager
            audio_timeout: 音声処理のタイムアウト（秒）
        """
        self.yamnet_manager = yamnet_manager
        self.audio_processor = AudioProcessor(timeout=audio_timeout)
        self._analyzer_stats = {
            "total_analyses": 0,
            "successful_analyses": 0,
            "failed_analyses": 0,
            "total_processing_time": 0.0
        }
    
    async def analyze_audio_from_url(
        self,
        audio_url: str,
        top_k: int = 5,
        max_retries: int = 3
    ) -> AnalysisResult:
        """
        URLから音声を取得して分析
        
        Args:
            audio_url: 音声ファイルのURL
            top_k: 返却する上位分類結果数
            max_retries: 最大リトライ回数
            
        Returns:
            音響分析結果
            
        Raises:
            ValueError: URL形式が不正
            RuntimeError: 分析処理に失敗
        """
        logger.info("Starting audio analysis from URL", url=audio_url, top_k=top_k)
        
        start_time = time.time()
        self._analyzer_stats["total_analyses"] += 1
        
        try:
            # 音声を前処理
            processed_audio = await self.audio_processor.process_audio_from_url(
                audio_url, max_retries=max_retries
            )
            
            # YAMNet分析を実行
            result = await self._perform_analysis(processed_audio, top_k)
            
            processing_time = time.time() - start_time
            result.performance_metrics["total_time"] = processing_time
            
            self._analyzer_stats["successful_analyses"] += 1
            self._analyzer_stats["total_processing_time"] += processing_time
            
            logger.info(
                "Audio analysis completed successfully",
                url=audio_url,
                processing_time=processing_time,
                classifications_count=len(result.classifications)
            )
            
            return result
            
        except Exception as e:
            self._analyzer_stats["failed_analyses"] += 1
            logger.error("Audio analysis failed", url=audio_url, error=str(e))
            raise RuntimeError(f"Audio analysis failed: {e}")
    
    async def analyze_audio_from_bytes(
        self,
        audio_bytes: bytes,
        filename_hint: Optional[str] = None,
        top_k: int = 5
    ) -> AnalysisResult:
        """
        バイナリデータから音声を分析
        
        Args:
            audio_bytes: 音声ファイルのバイナリデータ
            filename_hint: ファイル名のヒント
            top_k: 返却する上位分類結果数
            
        Returns:
            音響分析結果
            
        Raises:
            ValueError: 音声データが不正
            RuntimeError: 分析処理に失敗
        """
        logger.info(
            "Starting audio analysis from bytes",
            size_bytes=len(audio_bytes),
            filename_hint=filename_hint,
            top_k=top_k
        )
        
        start_time = time.time()
        self._analyzer_stats["total_analyses"] += 1
        
        try:
            # 音声を前処理
            processed_audio = await self.audio_processor.process_audio_from_bytes(
                audio_bytes, filename_hint=filename_hint
            )
            
            # YAMNet分析を実行
            result = await self._perform_analysis(processed_audio, top_k)
            
            processing_time = time.time() - start_time
            result.performance_metrics["total_time"] = processing_time
            
            self._analyzer_stats["successful_analyses"] += 1
            self._analyzer_stats["total_processing_time"] += processing_time
            
            logger.info(
                "Audio analysis completed successfully",
                size_bytes=len(audio_bytes),
                processing_time=processing_time,
                classifications_count=len(result.classifications)
            )
            
            return result
            
        except Exception as e:
            self._analyzer_stats["failed_analyses"] += 1
            logger.error("Audio analysis from bytes failed", error=str(e))
            raise RuntimeError(f"Audio analysis failed: {e}")
    
    async def analyze_audio_from_file(
        self,
        file_path: Union[str, Path],
        top_k: int = 5
    ) -> AnalysisResult:
        """
        ファイルから音声を分析
        
        Args:
            file_path: 音声ファイルのパス
            top_k: 返却する上位分類結果数
            
        Returns:
            音響分析結果
            
        Raises:
            FileNotFoundError: ファイルが存在しない
            RuntimeError: 分析処理に失敗
        """
        file_path = Path(file_path)
        logger.info("Starting audio analysis from file", file_path=str(file_path), top_k=top_k)
        
        start_time = time.time()
        self._analyzer_stats["total_analyses"] += 1
        
        try:
            # 音声を前処理
            processed_audio = await self.audio_processor.process_audio_from_file(file_path)
            
            # YAMNet分析を実行
            result = await self._perform_analysis(processed_audio, top_k)
            
            processing_time = time.time() - start_time
            result.performance_metrics["total_time"] = processing_time
            
            self._analyzer_stats["successful_analyses"] += 1
            self._analyzer_stats["total_processing_time"] += processing_time
            
            logger.info(
                "Audio analysis completed successfully",
                file_path=str(file_path),
                processing_time=processing_time,
                classifications_count=len(result.classifications)
            )
            
            return result
            
        except Exception as e:
            self._analyzer_stats["failed_analyses"] += 1
            logger.error("Audio analysis from file failed", file_path=str(file_path), error=str(e))
            raise RuntimeError(f"Audio analysis failed: {e}")
    
    async def _perform_analysis(
        self,
        processed_audio: ProcessedAudio,
        top_k: int
    ) -> AnalysisResult:
        """
        前処理済み音声に対してYAMNet分析を実行
        
        Args:
            processed_audio: 前処理済み音声データ
            top_k: 返却する上位分類結果数
            
        Returns:
            音響分析結果
            
        Raises:
            RuntimeError: YAMNet分析に失敗
        """
        try:
            classifier = self.yamnet_manager.get_classifier()
            
            # YAMNet分類を実行
            yamnet_start = time.time()
            japanese_results, env_scores, primary_env = classifier.classify_audio(
                processed_audio.waveform,
                sample_rate=processed_audio.sample_rate,
                top_k=top_k
            )
            yamnet_time = time.time() - yamnet_start
            
            # 結果を構造化
            classifications = [
                ClassificationResult(
                    label=result["label"],
                    confidence=result["confidence"]
                )
                for result in japanese_results
            ]
            
            environment = EnvironmentAnalysis(
                primary_type=primary_env,
                type_scores=env_scores,
                description=self._generate_environment_description(primary_env, env_scores)
            )
            
            performance_metrics = {
                "yamnet_inference_time": yamnet_time,
                "audio_duration": processed_audio.original_metadata.duration,
                "processing_ratio": yamnet_time / processed_audio.original_metadata.duration
            }
            performance_metrics.update(processed_audio.processing_info)
            
            return AnalysisResult(
                classifications=classifications,
                environment=environment,
                audio_metadata=processed_audio.original_metadata,
                processing_info=processed_audio.processing_info,
                performance_metrics=performance_metrics
            )
            
        except Exception as e:
            logger.error("YAMNet analysis failed", error=str(e))
            raise RuntimeError(f"YAMNet analysis failed: {e}")
    
    def _generate_environment_description(
        self,
        primary_env: str,
        env_scores: Dict[str, float]
    ) -> str:
        """
        環境タイプの説明を生成
        
        Args:
            primary_env: 主要環境タイプ
            env_scores: 環境タイプ別信頼度
            
        Returns:
            環境の説明文
        """
        env_descriptions = {
            "urban": "都市環境：交通音や人工的な音が支配的",
            "natural": "自然環境：鳥のさえずりや風音などの自然音が中心",
            "indoor": "屋内環境：人の声や室内活動音が主要",
            "outdoor": "屋外環境：開放的な音響空間での録音"
        }
        
        base_description = env_descriptions.get(primary_env, f"{primary_env}環境")
        
        # 信頼度が高い他の環境要素も含める
        significant_others = [
            env for env, score in env_scores.items()
            if env != primary_env and score > 0.2
        ]
        
        if significant_others:
            others_str = "、".join(significant_others)
            return f"{base_description}（{others_str}の要素も含む）"
        
        return base_description
    
    def get_analyzer_stats(self) -> Dict[str, Any]:
        """
        分析統計を取得
        
        Returns:
            分析統計情報
        """
        stats = self._analyzer_stats.copy()
        if stats["successful_analyses"] > 0:
            stats["average_processing_time"] = (
                stats["total_processing_time"] / stats["successful_analyses"]
            )
        else:
            stats["average_processing_time"] = 0.0
        
        if stats["total_analyses"] > 0:
            stats["success_rate"] = stats["successful_analyses"] / stats["total_analyses"]
        else:
            stats["success_rate"] = 0.0
        
        return stats
    
    async def health_check(self) -> Dict[str, Any]:
        """
        サービスのヘルスチェック
        
        Returns:
            ヘルスチェック結果
        """
        try:
            # YAMNetマネージャーの状態確認
            classifier = self.yamnet_manager.get_classifier()
            
            health_info = {
                "status": "healthy",
                "yamnet_initialized": True,
                "audio_processor_ready": True,
                "statistics": self.get_analyzer_stats()
            }
            
            logger.info("Health check passed", health_info=health_info)
            return health_info
            
        except Exception as e:
            health_info = {
                "status": "unhealthy",
                "error": str(e),
                "yamnet_initialized": False,
                "audio_processor_ready": False,
                "statistics": self.get_analyzer_stats()
            }
            
            logger.error("Health check failed", health_info=health_info)
            return health_info
    
    async def cleanup(self) -> None:
        """
        リソースをクリーンアップ
        """
        logger.info("Cleaning up AudioAnalyzer")
        await self.audio_processor.cleanup()
        logger.info("AudioAnalyzer cleanup completed") 