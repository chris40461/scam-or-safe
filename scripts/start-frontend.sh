#!/bin/bash
# 프론트엔드 서버 시작 스크립트

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

cd "$FRONTEND_DIR"

# node_modules 확인
if [ ! -d "node_modules" ]; then
    echo "의존성 패키지가 없습니다. 설치합니다..."
    npm install
fi

echo "프론트엔드 서버 시작 (포트: 3000)..."
npm run dev
