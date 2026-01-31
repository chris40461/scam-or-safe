#!/bin/bash
# 모든 서버 종료 스크립트

echo "=== 서버 종료 중 ==="

# uvicorn 프로세스 종료
echo "[1/2] 백엔드 서버 종료..."
pkill -f "uvicorn app.main:app" 2>/dev/null

# Next.js 개발 서버 종료
echo "[2/2] 프론트엔드 서버 종료..."
pkill -f "next-server" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null

# 포트 확인
sleep 1
if lsof -i :8000 >/dev/null 2>&1; then
    echo "경고: 포트 8000이 아직 사용 중입니다."
else
    echo "백엔드 종료 완료 (포트 8000)"
fi

if lsof -i :3000 >/dev/null 2>&1; then
    echo "경고: 포트 3000이 아직 사용 중입니다."
else
    echo "프론트엔드 종료 완료 (포트 3000)"
fi

echo "=== 종료 완료 ==="
