#!/bin/bash
# 특정 시나리오 및 관련 이미지 삭제 스크립트

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

SCENARIOS_DIR="$BACKEND_DIR/app/data/scenarios"
IMAGES_DIR="$BACKEND_DIR/app/data/images"

echo "=== 시나리오 삭제 ==="
echo ""

# 시나리오 디렉토리 확인
if [ ! -d "$SCENARIOS_DIR" ]; then
    echo "시나리오 디렉토리가 없습니다."
    exit 0
fi

# 시나리오 목록 수집
SCENARIOS=()
while IFS= read -r file; do
    if [ -f "$file" ]; then
        id=$(python3 -c "import json; print(json.load(open('$file'))['id'])" 2>/dev/null)
        title=$(python3 -c "import json; print(json.load(open('$file'))['title'])" 2>/dev/null)
        if [ -n "$id" ] && [ -n "$title" ]; then
            SCENARIOS+=("$file|$id|$title")
        fi
    fi
done < <(find "$SCENARIOS_DIR" -name "*.json" -type f 2>/dev/null | sort)

# 시나리오가 없는 경우
if [ ${#SCENARIOS[@]} -eq 0 ]; then
    echo "삭제할 시나리오가 없습니다."
    exit 0
fi

# 시나리오 목록 출력
echo "시나리오 목록:"
echo "-------------------------------------------"
printf "%-4s %-25s %s\n" "No." "ID" "Title"
echo "-------------------------------------------"

for i in "${!SCENARIOS[@]}"; do
    IFS='|' read -r file id title <<< "${SCENARIOS[$i]}"
    printf "%-4s %-25s %s\n" "$((i+1))." "$id" "$title"
done

echo "-------------------------------------------"
echo ""
echo "0. 전체 삭제"
echo "q. 취소"
echo ""

# 사용자 입력
read -p "삭제할 시나리오 번호를 입력하세요: " choice

# 취소
if [ "$choice" = "q" ] || [ "$choice" = "Q" ]; then
    echo "취소되었습니다."
    exit 0
fi

# 전체 삭제
if [ "$choice" = "0" ]; then
    read -p "정말 모든 시나리오를 삭제하시겠습니까? (y/N) " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "취소되었습니다."
        exit 0
    fi

    for scenario in "${SCENARIOS[@]}"; do
        IFS='|' read -r file id title <<< "$scenario"
        # 시나리오 파일 삭제
        rm -f "$file"
        # 관련 이미지 삭제
        rm -f "$IMAGES_DIR/${id}_"*.png 2>/dev/null
        echo "삭제됨: $id ($title)"
    done

    echo ""
    echo "=== 전체 삭제 완료 ==="
    exit 0
fi

# 숫자 검증
if ! [[ "$choice" =~ ^[0-9]+$ ]]; then
    echo "올바른 번호를 입력하세요."
    exit 1
fi

# 범위 검증
idx=$((choice - 1))
if [ $idx -lt 0 ] || [ $idx -ge ${#SCENARIOS[@]} ]; then
    echo "올바른 번호를 입력하세요. (1-${#SCENARIOS[@]})"
    exit 1
fi

# 선택된 시나리오 정보
IFS='|' read -r file id title <<< "${SCENARIOS[$idx]}"

echo ""
echo "선택된 시나리오:"
echo "  ID: $id"
echo "  제목: $title"

# 관련 이미지 확인
IMAGE_COUNT=$(ls -1 "$IMAGES_DIR/${id}_"*.png 2>/dev/null | wc -l | tr -d ' ')
echo "  이미지: ${IMAGE_COUNT}개"
echo ""

read -p "정말 삭제하시겠습니까? (y/N) " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "취소되었습니다."
    exit 0
fi

# 삭제 실행
echo ""
echo "삭제 중..."

# 시나리오 파일 삭제
rm -f "$file"
echo "  - 시나리오 파일 삭제됨"

# 관련 이미지 삭제
if [ "$IMAGE_COUNT" -gt 0 ]; then
    rm -f "$IMAGES_DIR/${id}_"*.png 2>/dev/null
    echo "  - 이미지 ${IMAGE_COUNT}개 삭제됨"
fi

echo ""
echo "=== 삭제 완료 ==="
