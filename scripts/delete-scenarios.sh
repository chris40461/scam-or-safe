#!/bin/bash
# 생성된 시나리오 및 이미지 삭제 스크립트
# 주의: seed_scenarios는 삭제하지 않습니다.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

SCENARIOS_DIR="$BACKEND_DIR/app/data/scenarios"
IMAGES_DIR="$BACKEND_DIR/app/data/images"

echo "=== 생성된 데이터 삭제 ==="
echo ""

# 시나리오 파일 수 확인
if [ -d "$SCENARIOS_DIR" ]; then
    SCENARIO_COUNT=$(ls -1 "$SCENARIOS_DIR"/*.json 2>/dev/null | wc -l | tr -d ' ')
else
    SCENARIO_COUNT=0
fi

# 이미지 파일 수 확인
if [ -d "$IMAGES_DIR" ]; then
    IMAGE_COUNT=$(ls -1 "$IMAGES_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ')
else
    IMAGE_COUNT=0
fi

echo "삭제 대상:"
echo "  - 시나리오: $SCENARIO_COUNT 개"
echo "  - 이미지: $IMAGE_COUNT 개"
echo ""

if [ "$SCENARIO_COUNT" -eq 0 ] && [ "$IMAGE_COUNT" -eq 0 ]; then
    echo "삭제할 파일이 없습니다."
    exit 0
fi

# 확인 프롬프트
read -p "정말 삭제하시겠습니까? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "취소되었습니다."
    exit 0
fi

# 삭제 실행
echo "삭제 중..."

if [ -d "$SCENARIOS_DIR" ]; then
    rm -f "$SCENARIOS_DIR"/*.json 2>/dev/null
    echo "시나리오 삭제 완료"
fi

if [ -d "$IMAGES_DIR" ]; then
    rm -f "$IMAGES_DIR"/*.png 2>/dev/null
    echo "이미지 삭제 완료"
fi

echo ""
echo "=== 삭제 완료 ==="
