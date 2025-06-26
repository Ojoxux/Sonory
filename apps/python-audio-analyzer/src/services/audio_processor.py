"""
Audio preprocessing pipeline for YAMNet inference.

音声データの前処理パイプライン。
音声ファイル読み込み、サンプリングレート正規化、YAMNet形式変換を行います。
"""

import io
import tempfile
import subprocess
from typing import Optional, Tuple, Union
from pathlib import Path
import numpy as np
import librosa
import soundfile as sf
import httpx
import structlog
from pydantic import BaseModel, Field
import ffmpeg

logger = structlog.get_logger(__name__)


class AudioMetadata(BaseModel):
    """
    音声メタデータ
    
    音声ファイルの基本情報を格納します。
    """
    duration: float = Field(..., description="音声長さ（秒）")
    sample_rate: int = Field(..., description="サンプリングレート（Hz）")
    channels: int = Field(..., description="チャンネル数")
    format: Optional[str] = Field(None, description="音声フォーマット")
    file_size: Optional[int] = Field(None, description="ファイルサイズ（バイト）")


class ProcessedAudio(BaseModel):
    """
    処理済み音声データ
    
    YAMNet推論用に前処理された音声データとメタデータ。
    """
    waveform: np.ndarray = Field(..., description="正規化済み音声波形")
    sample_rate: int = Field(..., description="サンプリングレート（16kHz）")
    original_metadata: AudioMetadata = Field(..., description="元音声のメタデータ")
    processing_info: dict = Field(default_factory=dict, description="処理情報")

    class Config:
        arbitrary_types_allowed = True


class AudioProcessor:
    """
    音声前処理クラス
    
    音声ファイルの読み込み、正規化、YAMNet用前処理を行います。
    """
    
    # YAMNetの仕様
    TARGET_SAMPLE_RATE = 16000  # Hz
    MAX_DURATION = 30.0  # 秒（長すぎる音声の制限）
    MIN_DURATION = 0.1   # 秒（短すぎる音声の制限）
    
    # サポートする音声フォーマット
    SUPPORTED_FORMATS = {'.wav', '.mp3', '.webm', '.m4a', '.flac', '.ogg'}
    
    def __init__(self, timeout: float = 30.0):
        """
        AudioProcessorを初期化
        
        Args:
            timeout: HTTP音声取得のタイムアウト（秒）
        """
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)
    
    async def process_audio_from_url(
        self,
        audio_url: str,
        max_retries: int = 3
    ) -> ProcessedAudio:
        """
        URLから音声を取得して処理
        
        Args:
            audio_url: 音声ファイルのURL
            max_retries: 最大リトライ回数
            
        Returns:
            処理済み音声データ
            
        Raises:
            ValueError: URL形式が不正またはサポートされていない形式
            RuntimeError: 音声取得または処理に失敗
        """
        if not audio_url.startswith(('http://', 'https://')):
            raise ValueError("Invalid audio URL format")
        
        logger.info("Processing audio from URL", url=audio_url)
        
        for attempt in range(max_retries + 1):
            try:
                # 音声データを取得
                response = await self.client.get(audio_url)
                response.raise_for_status()
                
                audio_bytes = response.content
                content_type = response.headers.get('content-type', '')
                
                logger.info(
                    "Audio downloaded successfully",
                    size_bytes=len(audio_bytes),
                    content_type=content_type
                )
                
                # バイナリデータとして処理
                return await self.process_audio_from_bytes(
                    audio_bytes, 
                    filename_hint=self._extract_filename_from_url(audio_url)
                )
                
            except httpx.HTTPError as e:
                logger.warning(
                    "HTTP error downloading audio",
                    attempt=attempt + 1,
                    max_retries=max_retries,
                    error=str(e)
                )
                if attempt == max_retries:
                    raise RuntimeError(f"Failed to download audio after {max_retries + 1} attempts: {e}")
                continue
                
            except Exception as e:
                logger.error("Unexpected error processing audio from URL", error=str(e))
                raise RuntimeError(f"Audio processing failed: {e}")
    
    async def process_audio_from_bytes(
        self,
        audio_bytes: bytes,
        filename_hint: Optional[str] = None
    ) -> ProcessedAudio:
        """
        バイナリデータから音声を処理
        
        Args:
            audio_bytes: 音声ファイルのバイナリデータ
            filename_hint: ファイル名のヒント（拡張子判定用）
            
        Returns:
            処理済み音声データ
            
        Raises:
            ValueError: 音声データが不正
            RuntimeError: 音声処理に失敗
        """
        if not audio_bytes:
            raise ValueError("Empty audio data")
        
        logger.info(
            "Processing audio from bytes",
            size_bytes=len(audio_bytes),
            filename_hint=filename_hint
        )
        
        try:
            # 一時ファイルに保存して処理
            with tempfile.NamedTemporaryFile(
                suffix=self._determine_file_extension(filename_hint, audio_bytes),
                delete=False
            ) as temp_file:
                temp_file.write(audio_bytes)
                temp_file.flush()
                
                # ファイルパスで処理
                result = await self.process_audio_from_file(temp_file.name)
                
                # 元ファイルサイズを記録
                result.original_metadata.file_size = len(audio_bytes)
                
                return result
                
        except Exception as e:
            logger.error("Audio processing from bytes failed", error=str(e))
            raise RuntimeError(f"Audio processing failed: {e}")
        finally:
            # 一時ファイルをクリーンアップ
            try:
                Path(temp_file.name).unlink(missing_ok=True)
            except:
                pass
    
    async def process_audio_from_file(
        self,
        file_path: Union[str, Path]
    ) -> ProcessedAudio:
        """
        ファイルパスから音声を処理
        
        Args:
            file_path: 音声ファイルのパス
            
        Returns:
            処理済み音声データ
            
        Raises:
            FileNotFoundError: ファイルが存在しない
            ValueError: サポートされていない音声形式
            RuntimeError: 音声処理に失敗
        """
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"Audio file not found: {file_path}")
        
        if file_path.suffix.lower() not in self.SUPPORTED_FORMATS:
            raise ValueError(f"Unsupported audio format: {file_path.suffix}")
        
        logger.info("Processing audio from file", file_path=str(file_path))
        
        try:
            # WebM形式の場合はffmpegで変換
            if file_path.suffix.lower() == '.webm':
                file_path = await self._convert_webm_to_wav(file_path)
            
            # 音声ファイルを読み込み
            waveform, original_sr = librosa.load(
                str(file_path),
                sr=None,  # 元のサンプリングレートを保持
                mono=True  # モノラルに変換
            )
            
            # メタデータを取得
            with sf.SoundFile(str(file_path)) as f:
                original_metadata = AudioMetadata(
                    duration=len(waveform) / original_sr,
                    sample_rate=original_sr,
                    channels=f.channels,
                    format=file_path.suffix.lower(),
                    file_size=file_path.stat().st_size
                )
            
            # 音声データを検証
            self._validate_audio_data(waveform, original_metadata)
            
            # YAMNet用に前処理
            processed_waveform, processing_info = self._preprocess_for_yamnet(
                waveform, original_sr
            )
            
            result = ProcessedAudio(
                waveform=processed_waveform,
                sample_rate=self.TARGET_SAMPLE_RATE,
                original_metadata=original_metadata,
                processing_info=processing_info
            )
            
            logger.info(
                "Audio processing completed",
                original_duration=original_metadata.duration,
                processed_duration=len(processed_waveform) / self.TARGET_SAMPLE_RATE,
                original_sr=original_sr,
                target_sr=self.TARGET_SAMPLE_RATE
            )
            
            return result
            
        except Exception as e:
            logger.error("Audio file processing failed", error=str(e))
            raise RuntimeError(f"Audio processing failed: {e}")
    
    async def _convert_webm_to_wav(self, webm_path: Path) -> Path:
        """
        WebMファイルをWAV形式に変換
        
        Args:
            webm_path: WebMファイルのパス
            
        Returns:
            変換後のWAVファイルのパス
            
        Raises:
            RuntimeError: 変換に失敗した場合
        """
        try:
            # 一時WAVファイルを作成
            wav_path = webm_path.with_suffix('.wav')
            
            logger.info("Converting WebM to WAV", webm_path=str(webm_path), wav_path=str(wav_path))
            
            # ffmpegで変換
            (
                ffmpeg
                .input(str(webm_path))
                .output(str(wav_path), acodec='pcm_s16le', ac=1, ar=16000)
                .overwrite_output()
                .run(quiet=True)
            )
            
            if not wav_path.exists():
                raise RuntimeError("WAV conversion failed - output file not created")
            
            logger.info("WebM to WAV conversion completed", wav_path=str(wav_path))
            return wav_path
            
        except ffmpeg.Error as e:
            logger.error("FFmpeg conversion failed", error=str(e))
            raise RuntimeError(f"WebM to WAV conversion failed: {e}")
        except Exception as e:
            logger.error("Unexpected error in WebM conversion", error=str(e))
            raise RuntimeError(f"WebM conversion failed: {e}")
    
    def _validate_audio_data(
        self,
        waveform: np.ndarray,
        metadata: AudioMetadata
    ) -> None:
        """
        音声データを検証
        
        Args:
            waveform: 音声波形データ
            metadata: 音声メタデータ
            
        Raises:
            ValueError: 音声データが不正な場合
        """
        if len(waveform) == 0:
            raise ValueError("Empty audio waveform")
        
        if metadata.duration < self.MIN_DURATION:
            raise ValueError(f"Audio too short: {metadata.duration:.2f}s < {self.MIN_DURATION}s")
        
        if metadata.duration > self.MAX_DURATION:
            logger.warning(
                "Audio duration exceeds maximum, will be truncated",
                duration=metadata.duration,
                max_duration=self.MAX_DURATION
            )
        
        if np.all(waveform == 0):
            raise ValueError("Audio waveform contains only silence")
        
        if np.any(np.isnan(waveform)) or np.any(np.isinf(waveform)):
            raise ValueError("Audio waveform contains invalid values (NaN or Inf)")
    
    def _preprocess_for_yamnet(
        self,
        waveform: np.ndarray,
        original_sr: int
    ) -> Tuple[np.ndarray, dict]:
        """
        YAMNet用に音声を前処理
        
        Args:
            waveform: 元音声波形
            original_sr: 元サンプリングレート
            
        Returns:
            タプル：(前処理済み波形, 処理情報)
        """
        processing_info = {
            "original_sample_rate": original_sr,
            "target_sample_rate": self.TARGET_SAMPLE_RATE,
            "resampled": False,
            "normalized": False,
            "truncated": False
        }
        
        # サンプリングレート変換
        if original_sr != self.TARGET_SAMPLE_RATE:
            waveform = librosa.resample(
                waveform,
                orig_sr=original_sr,
                target_sr=self.TARGET_SAMPLE_RATE,
                res_type='kaiser_fast'
            )
            processing_info["resampled"] = True
            logger.info(f"Resampled from {original_sr}Hz to {self.TARGET_SAMPLE_RATE}Hz")
        
        # 長すぎる音声をトリミング
        max_samples = int(self.MAX_DURATION * self.TARGET_SAMPLE_RATE)
        if len(waveform) > max_samples:
            waveform = waveform[:max_samples]
            processing_info["truncated"] = True
            logger.info(f"Audio truncated to {self.MAX_DURATION}s")
        
        # 正規化
        if np.max(np.abs(waveform)) > 0:
            # RMS正規化（YAMNetに適した正規化）
            rms = np.sqrt(np.mean(waveform**2))
            if rms > 0:
                waveform = waveform / (rms * 10)  # 適切なレベルに調整
                waveform = np.clip(waveform, -1.0, 1.0)  # クリッピング防止
                processing_info["normalized"] = True
        
        # float32に変換（YAMNet要件）
        waveform = waveform.astype(np.float32)
        
        return waveform, processing_info
    
    def _extract_filename_from_url(self, url: str) -> Optional[str]:
        """
        URLからファイル名を抽出
        
        Args:
            url: 音声ファイルのURL
            
        Returns:
            ファイル名、抽出できない場合はNone
        """
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            filename = Path(parsed.path).name
            return filename if filename else None
        except:
            return None
    
    def _determine_file_extension(
        self,
        filename_hint: Optional[str],
        audio_bytes: bytes
    ) -> str:
        """
        ファイル拡張子を決定
        
        Args:
            filename_hint: ファイル名のヒント
            audio_bytes: 音声バイナリデータ
            
        Returns:
            適切な拡張子
        """
        # ファイル名ヒントから拡張子を取得
        if filename_hint:
            ext = Path(filename_hint).suffix.lower()
            if ext in self.SUPPORTED_FORMATS:
                return ext
        
        # バイナリデータからフォーマットを推定
        if audio_bytes.startswith(b'RIFF'):
            return '.wav'
        elif audio_bytes.startswith(b'\xff\xfb') or audio_bytes.startswith(b'\xff\xf3'):
            return '.mp3'
        elif b'webm' in audio_bytes[:100].lower():
            return '.webm'
        else:
            # デフォルト
            return '.wav'
    
    async def cleanup(self) -> None:
        """
        リソースをクリーンアップ
        """
        await self.client.aclose()
        logger.info("AudioProcessor cleanup completed") 