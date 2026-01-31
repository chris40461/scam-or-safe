#!/bin/bash
# 백엔드 서버 시작 스크립트

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

cd "$BACKEND_DIR"

# 가상환경 확인 및 활성화
if [ ! -d "venv" ]; then
    echo "가상환경이 없습니다. 생성합니다..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# 환경변수 파일 확인
if [ ! -f ".env" ]; then
    echo "경고: .env 파일이 없습니다. .env.example을 참고하여 생성하세요."
fi

echo "백엔드 서버 시작 (포트: 8000)..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
