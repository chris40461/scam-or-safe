#!/bin/bash
# 백엔드 + 프론트엔드 서버 동시 시작 스크립트

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== PhishGuard 서버 시작 ==="
echo ""

# 백엔드 백그라운드 실행
echo "[1/2] 백엔드 서버 시작 중..."
"$SCRIPT_DIR/start-backend.sh" &
BACKEND_PID=$!

# 백엔드가 시작될 때까지 대기
sleep 3

# 프론트엔드 백그라운드 실행
echo "[2/2] 프론트엔드 서버 시작 중..."
"$SCRIPT_DIR/start-frontend.sh" &
FRONTEND_PID=$!

echo ""
echo "=== 서버 시작 완료 ==="
echo "백엔드:   http://localhost:8000"
echo "프론트엔드: http://localhost:3000"
echo ""
echo "종료하려면 Ctrl+C 또는 ./scripts/stop-all.sh 실행"

# 시그널 처리
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# 프로세스 대기
wait
