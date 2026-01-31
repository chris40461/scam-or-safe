"""FastAPI 애플리케이션 엔트리포인트"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes import scenario, crawler, images

app = FastAPI(
    title="PhishGuard API",
    description="피싱 예방 교육 게임 시나리오 API",
    version="1.0.0",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(scenario.router, prefix="/api/v1")
app.include_router(crawler.router, prefix="/api/v1")
app.include_router(images.router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """헬스체크 엔드포인트"""
    return {"status": "ok"}
