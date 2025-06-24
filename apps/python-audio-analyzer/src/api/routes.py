"""
API routes for audio analysis service.

音響分析サービスのAPIエンドポイント実装。
POST /analyze/audio、GET /health、バリデーション、エラーハンドリングを提供します。
"""

import time
from typing import Optional, Union
import structlog
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, HttpUrl, validator

try:
    from ..services.analyzer import AudioAnalyzer, AnalysisResult
except ImportError:
    from services.analyzer import AudioAnalyzer, AnalysisResult

logger = structlog.get_logger(__name__)

# APIルーターを作成
router = APIRouter()


class AudioAnalysisRequest(BaseModel):
    """
    音響分析リクエスト（URL指定）
    
    音声URLを指定して分析を要求するためのスキーマ。
    """
    audio_url: HttpUrl = Field(..., description="音声ファイルのURL")
    top_k: int = Field(default=5, description="返却する上位分類結果数", ge=1, le=20)
    max_retries: int = Field(default=3, description="最大リトライ回数", ge=0, le=10)


class AudioUploadRequest(BaseModel):
    """
    音響分析リクエスト（ファイルアップロード）
    
    ファイルアップロードによる分析要求のメタデータ。
    """
    top_k: int = Field(default=5, description="返却する上位分類結果数", ge=1, le=20)
    
    @validator('top_k')
    def validate_top_k(cls, v):
        if not 1 <= v <= 20:
            raise ValueError('top_k must be between 1 and 20')
        return v


class HealthResponse(BaseModel):
    """
    ヘルスチェックレスポンス
    
    サービスの健全性情報を表現します。
    """
    status: str = Field(..., description="サービス状態")
    service: str = Field(..., description="サービス名")
    version: str = Field(..., description="バージョン")
    timestamp: float = Field(default_factory=time.time, description="チェック時刻")
    details: Optional[dict] = Field(None, description="詳細情報")


class ErrorResponse(BaseModel):
    """
    エラーレスポンス
    
    API エラーの詳細を表現します。
    """
    error: str = Field(..., description="エラーコード")
    message: str = Field(..., description="エラーメッセージ")
    details: Optional[dict] = Field(None, description="エラー詳細")
    timestamp: float = Field(default_factory=time.time, description="エラー発生時刻")
    request_id: Optional[str] = Field(None, description="リクエストID")


# 依存関係注入用の関数
def get_audio_analyzer(request: Request) -> AudioAnalyzer:
    """
    AudioAnalyzerインスタンスを取得
    
    Args:
        request: FastAPIリクエストオブジェクト
        
    Returns:
        AudioAnalyzerインスタンス
        
    Raises:
        HTTPException: AudioAnalyzerが初期化されていない場合
    """
    if not hasattr(request.app.state, 'audio_analyzer'):
        raise HTTPException(
            status_code=503,
            detail="Audio analyzer not initialized"
        )
    return request.app.state.audio_analyzer


@router.post(
    "/analyze/audio",
    response_model=AnalysisResult,
    summary="音響分析実行",
    description="音声ファイルをYAMNetで分析し、日本語カテゴリと環境タイプを返却します"
)
async def analyze_audio_url(
    request: AudioAnalysisRequest,
    analyzer: AudioAnalyzer = Depends(get_audio_analyzer)
) -> AnalysisResult:
    """
    URLから音声を取得して分析
    
    音声ファイルのURLを指定して音響分析を実行します。
    YAMNetによる分類結果を日本語12カテゴリにマッピングし、
    環境タイプ（urban/natural/indoor/outdoor）も推定します。
    
    Args:
        request: 音響分析リクエスト
        analyzer: AudioAnalyzerインスタンス（依存性注入）
        
    Returns:
        音響分析結果
        
    Raises:
        HTTPException: 分析処理に失敗した場合
    """
    start_time = time.time()
    request_id = f"req_{int(start_time * 1000)}"
    
    logger.info(
        "Audio analysis request received",
        request_id=request_id,
        audio_url=str(request.audio_url),
        top_k=request.top_k
    )
    
    try:
        # 音響分析を実行
        result = await analyzer.analyze_audio_from_url(
            audio_url=str(request.audio_url),
            top_k=request.top_k,
            max_retries=request.max_retries
        )
        
        processing_time = time.time() - start_time
        logger.info(
            "Audio analysis completed successfully",
            request_id=request_id,
            processing_time=processing_time,
            classifications_count=len(result.classifications)
        )
        
        return result
        
    except ValueError as e:
        logger.warning(
            "Invalid request parameters",
            request_id=request_id,
            error=str(e)
        )
        raise HTTPException(
            status_code=400,
            detail=f"Invalid request: {e}"
        )
        
    except Exception as e:
        logger.error(
            "Audio analysis failed",
            request_id=request_id,
            error=str(e)
        )
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {e}"
        )


@router.post(
    "/analyze/audio/upload",
    response_model=AnalysisResult,
    summary="音響分析実行（ファイルアップロード）",
    description="アップロードされた音声ファイルをYAMNetで分析します"
)
async def analyze_audio_upload(
    file: UploadFile = File(..., description="音声ファイル"),
    top_k: int = Form(default=5, description="返却する上位分類結果数"),
    analyzer: AudioAnalyzer = Depends(get_audio_analyzer)
) -> AnalysisResult:
    """
    アップロードされた音声ファイルを分析
    
    multipart/form-dataでアップロードされた音声ファイルを
    YAMNetで分析し、日本語カテゴリと環境タイプを返却します。
    
    Args:
        file: アップロードされた音声ファイル
        top_k: 返却する上位分類結果数
        analyzer: AudioAnalyzerインスタンス（依存性注入）
        
    Returns:
        音響分析結果
        
    Raises:
        HTTPException: 分析処理に失敗した場合
    """
    start_time = time.time()
    request_id = f"upload_{int(start_time * 1000)}"
    
    # バリデーション
    if not 1 <= top_k <= 20:
        raise HTTPException(
            status_code=400,
            detail="top_k must be between 1 and 20"
        )
    
    logger.info(
        "Audio upload analysis request received",
        request_id=request_id,
        filename=file.filename,
        content_type=file.content_type,
        top_k=top_k
    )
    
    try:
        # ファイル形式をチェック
        if file.content_type and not any(
            audio_type in file.content_type.lower()
            for audio_type in ['audio/', 'video/']
        ):
            raise ValueError(f"Unsupported file type: {file.content_type}")
        
        # ファイルサイズチェック（10MB制限）
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
        audio_bytes = await file.read()
        
        if len(audio_bytes) > MAX_FILE_SIZE:
            raise ValueError(f"File too large: {len(audio_bytes)} bytes (max: {MAX_FILE_SIZE})")
        
        if len(audio_bytes) == 0:
            raise ValueError("Empty file uploaded")
        
        # 音響分析を実行
        result = await analyzer.analyze_audio_from_bytes(
            audio_bytes=audio_bytes,
            filename_hint=file.filename,
            top_k=top_k
        )
        
        processing_time = time.time() - start_time
        logger.info(
            "Audio upload analysis completed successfully",
            request_id=request_id,
            processing_time=processing_time,
            file_size=len(audio_bytes),
            classifications_count=len(result.classifications)
        )
        
        return result
        
    except ValueError as e:
        logger.warning(
            "Invalid upload request",
            request_id=request_id,
            error=str(e)
        )
        raise HTTPException(
            status_code=400,
            detail=f"Invalid upload: {e}"
        )
        
    except Exception as e:
        logger.error(
            "Audio upload analysis failed",
            request_id=request_id,
            error=str(e)
        )
        raise HTTPException(
            status_code=500,
            detail=f"Upload analysis failed: {e}"
        )


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="ヘルスチェック",
    description="サービスの健全性を確認します"
)
async def health_check(
    request: Request,
    analyzer: AudioAnalyzer = Depends(get_audio_analyzer)
) -> HealthResponse:
    """
    サービスのヘルスチェック
    
    YAMNetモデルとAudioProcessorの状態を確認し、
    サービスの健全性情報を返却します。
    
    Args:
        request: FastAPIリクエストオブジェクト
        analyzer: AudioAnalyzerインスタンス（依存性注入）
        
    Returns:
        ヘルスチェック結果
    """
    try:
        # 詳細ヘルスチェックを実行
        health_details = await analyzer.health_check()
        
        response = HealthResponse(
            status=health_details["status"],
            service="sonory-audio-analyzer",
            version="0.1.0",
            details=health_details
        )
        
        # 健全でない場合は503を返す
        if health_details["status"] != "healthy":
            return JSONResponse(
                status_code=503,
                content=response.dict()
            )
        
        return response
        
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        
        error_response = HealthResponse(
            status="error",
            service="sonory-audio-analyzer",
            version="0.1.0",
            details={"error": str(e)}
        )
        
        return JSONResponse(
            status_code=503,
            content=error_response.dict()
        )


@router.get(
    "/stats",
    summary="分析統計取得",
    description="音響分析の統計情報を取得します"
)
async def get_analysis_stats(
    analyzer: AudioAnalyzer = Depends(get_audio_analyzer)
) -> dict:
    """
    分析統計を取得
    
    音響分析サービスの実行統計を返却します。
    
    Args:
        analyzer: AudioAnalyzerインスタンス（依存性注入）
        
    Returns:
        分析統計情報
    """
    try:
        stats = analyzer.get_analyzer_stats()
        logger.info("Analysis stats requested", stats=stats)
        return {
            "service": "sonory-audio-analyzer",
            "statistics": stats,
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error("Failed to get analysis stats", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get stats: {e}"
        )


# エラーハンドラー（FastAPIアプリに追加される）
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    HTTPExceptionの共通エラーハンドリング
    
    Args:
        request: FastAPIリクエストオブジェクト
        exc: HTTPException
        
    Returns:
        構造化されたエラーレスポンス
    """
    error_response = ErrorResponse(
        error=f"HTTP_{exc.status_code}",
        message=exc.detail,
        request_id=getattr(request.state, 'request_id', None)
    )
    
    logger.error(
        "HTTP exception occurred",
        status_code=exc.status_code,
        detail=exc.detail,
        request_id=error_response.request_id
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.dict()
    ) 