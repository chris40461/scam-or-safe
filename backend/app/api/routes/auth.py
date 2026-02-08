"""관리자 인증 API 라우트"""
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Response, Cookie, Request
from pydantic import BaseModel

from app.config import settings
from app.api.deps import limiter

router = APIRouter(prefix="/auth", tags=["auth"])

# 토큰 저장소 (메모리 기반, 프로덕션에서는 Redis 권장)
valid_tokens: dict[str, datetime] = {}
TOKEN_EXPIRY_HOURS = 24


class LoginRequest(BaseModel):
    """로그인 요청"""
    password: str


class LoginResponse(BaseModel):
    """로그인 응답"""
    success: bool
    message: str


def generate_token() -> str:
    """안전한 토큰 생성"""
    return secrets.token_urlsafe(32)


def cleanup_expired_tokens():
    """만료된 토큰 정리"""
    now = datetime.now(timezone.utc)
    expired = [token for token, expiry in valid_tokens.items() if expiry < now]
    for token in expired:
        del valid_tokens[token]


@router.post("/login")
@limiter.limit("3/minute")
async def admin_login(request: Request, body: LoginRequest, response: Response) -> LoginResponse:
    """관리자 로그인

    비밀번호 검증 후 HTTP-only 쿠키 발급
    """
    # 관리자 비밀번호 설정 확인
    if not settings.admin_password:
        raise HTTPException(
            status_code=500,
            detail="관리자 비밀번호가 설정되지 않았습니다"
        )

    # 비밀번호 검증 (타이밍 공격 방지)
    if not secrets.compare_digest(body.password, settings.admin_password):
        raise HTTPException(
            status_code=401,
            detail="비밀번호가 올바르지 않습니다"
        )

    # 만료 토큰 정리
    cleanup_expired_tokens()

    # 토큰 생성
    token = generate_token()
    expiry = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS)
    valid_tokens[token] = expiry

    # HTTP-only 쿠키 설정
    response.set_cookie(
        key="admin_token",
        value=token,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=TOKEN_EXPIRY_HOURS * 3600,
    )

    return LoginResponse(success=True, message="로그인 성공")


@router.post("/logout")
async def admin_logout(
    response: Response,
    admin_token: Optional[str] = Cookie(None)
) -> LoginResponse:
    """관리자 로그아웃"""
    if admin_token and admin_token in valid_tokens:
        del valid_tokens[admin_token]

    response.delete_cookie(key="admin_token")

    return LoginResponse(success=True, message="로그아웃 완료")


@router.get("/verify")
async def verify_admin(
    admin_token: Optional[str] = Cookie(None)
) -> dict:
    """관리자 세션 검증

    쿠키의 토큰을 검증하여 관리자 여부 확인
    """
    if not admin_token:
        return {"is_admin": False}

    cleanup_expired_tokens()

    if admin_token not in valid_tokens:
        return {"is_admin": False}

    # 만료 확인
    if valid_tokens[admin_token] < datetime.now(timezone.utc):
        del valid_tokens[admin_token]
        return {"is_admin": False}

    return {"is_admin": True}
