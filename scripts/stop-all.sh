#!/bin/bash
# 모든 서버 종료 스크립트

echo "=== 서버 종료 중 ==="

# 백엔드 종료 (uvicorn)
echo "[1/2] 백엔드 서버 종료..."
pkill -f "uvicorn" 2>/dev/null

# 프론트엔드 종료 (포트 3000 사용하는 모든 프로세스)
echo "[2/2] 프론트엔드 서버 종료..."
# Next.js 관련 프로세스 종료
pkill -f "next" 2>/dev/null
# 포트 3000을 직접 점유하는 프로세스 강제 종료
lsof -ti :3000 | xargs kill -9 2>/dev/null

# 포트 확인
sleep 1

echo ""
if lsof -i :8080 >/dev/null 2>&1; then
    echo "[!] 경고: 포트 8080이 아직 사용 중"
    echo "    수동 종료: kill -9 \$(lsof -ti :8080)"
else
    echo "[OK] 백엔드 종료 완료 (포트 8080)"
fi

if lsof -i :3000 >/dev/null 2>&1; then
    echo "[!] 경고: 포트 3000이 아직 사용 중"
    echo "    수동 종료: kill -9 \$(lsof -ti :3000)"
else
    echo "[OK] 프론트엔드 종료 완료 (포트 3000)"
fi

echo ""
echo "=== 종료 완료 ==="
