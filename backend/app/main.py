"""FastAPI 애플리케이션 엔트리포인트"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.api.deps import limiter
from app.api.routes import scenario, crawler, images, auth

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)
# pipeline 하위 모듈 DEBUG 레벨 허용 (기본 INFO, 필요시 환경변수로 조정)
logging.getLogger("pipeline").setLevel(logging.DEBUG)

_docs_kwargs = {}
if settings.is_production:
    _docs_kwargs = {"docs_url": None, "redoc_url": None, "openapi_url": None}

app = FastAPI(
    title="PhishGuard API",
    description="피싱 예방 교육 게임 시나리오 API",
    version="1.0.0",
    **_docs_kwargs,
)

# Rate Limiter 등록
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

# 라우터 등록
app.include_router(scenario.router, prefix="/api/v1")
app.include_router(crawler.router, prefix="/api/v1")
app.include_router(images.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """헬스체크 엔드포인트"""
    return {"status": "ok"}
