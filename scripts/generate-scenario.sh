#!/bin/bash
# 시나리오 생성 스크립트
# 사용법: ./scripts/generate-scenario.sh [피싱유형] [난이도]
# 예시: ./scripts/generate-scenario.sh "보이스피싱" "hard"

PHISHING_TYPE="${1:-보이스피싱}"
DIFFICULTY="${2:-medium}"
BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"

echo "=== 시나리오 생성 ==="
echo "피싱 유형: $PHISHING_TYPE"
echo "난이도: $DIFFICULTY"
echo ""

# 백엔드 서버 확인
if ! curl -s "$BACKEND_URL/health" >/dev/null 2>&1; then
    echo "오류: 백엔드 서버가 실행 중이 아닙니다."
    echo "먼저 ./scripts/start-backend.sh 를 실행하세요."
    exit 1
fi

# 시나리오 생성 요청
echo "시나리오 생성 요청 중..."
RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/scenarios/generate" \
    -H "Content-Type: application/json" \
    -d "{\"phishing_type\": \"$PHISHING_TYPE\", \"difficulty\": \"$DIFFICULTY\"}")

TASK_ID=$(echo "$RESPONSE" | grep -o '"task_id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TASK_ID" ]; then
    echo "오류: 시나리오 생성 요청 실패"
    echo "$RESPONSE"
    exit 1
fi

echo "작업 ID: $TASK_ID"
echo "생성 중... (최대 10분 소요)"
echo ""

# 상태 폴링
while true; do
    STATUS_RESPONSE=$(curl -s "$BACKEND_URL/api/v1/scenarios/$TASK_ID/status" 2>/dev/null)
    STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

    case "$STATUS" in
        "completed")
            SCENARIO_ID=$(echo "$STATUS_RESPONSE" | grep -o '"scenario_id":"[^"]*"' | cut -d'"' -f4)
            echo "=== 생성 완료 ==="
            echo "시나리오 ID: $SCENARIO_ID"
            echo "API: $BACKEND_URL/api/v1/scenarios/$SCENARIO_ID"
            break
            ;;
        "failed")
            ERROR=$(echo "$STATUS_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
            echo "=== 생성 실패 ==="
            echo "오류: $ERROR"
            exit 1
            ;;
        "generating"|"pending")
            echo -n "."
            sleep 5
            ;;
        *)
            echo -n "."
            sleep 5
            ;;
    esac
done
