# Scam Or Safe - 피싱 예방 교육 게임

텍스트 어드벤처 형식의 피싱 예방 교육 시뮬레이터입니다. 실제 피싱 사례를 기반으로 한 시나리오를 통해 피싱 수법을 체험하고 대응 방법을 학습합니다.

## 기술 스택

- **Backend**: FastAPI, Pydantic v2, LiteLLM
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS 4, Zustand
- **LLM**: Google Gemini (gemini-3-flash-preview)
- **Image Generation**: Google Imagen (imagen-4.0-fast-generate-001)
- **News API**: Naver Search API

## 프로젝트 구조

```
scamsimulator/
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── api/routes/      # API 엔드포인트
│   │   ├── core/            # 뉴스 크롤러, 이미지 생성
│   │   ├── data/            # 시나리오 데이터
│   │   ├── models/          # Pydantic 모델
│   │   └── pipeline/        # LLM 시나리오 생성 파이프라인
│   └── requirements.txt
│
└── frontend/                # Next.js 프론트엔드
    └── src/
        ├── app/             # 페이지
        ├── components/      # React 컴포넌트
        ├── hooks/           # 커스텀 훅
        └── lib/             # 유틸리티
```

## 설치 및 실행

### 1. 백엔드

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일에 API 키 입력

# 서버 실행
uvicorn app.main:app --reload --port 8000
```

### 2. 프론트엔드

```bash
cd frontend

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local

# 개발 서버 실행
npm run dev
```

### 3. 접속

- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:8000
- API 문서: http://localhost:8000/docs

## API 키 발급

### Gemini API (필수)

1. https://aistudio.google.com/apikey 접속
2. "Create API Key" 클릭
3. `.env`의 `GEMINI_API_KEY`에 입력

### Naver Search API (뉴스 크롤링용)

1. https://developers.naver.com 접속
2. 애플리케이션 등록 → 검색 API 사용 신청
3. `.env`의 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`에 입력

## 주요 기능

### 게임 플레이
- 시드 시나리오로 즉시 플레이 가능
- 선택에 따라 스토리 분기
- 리소스 시스템 (신뢰도, 자산, 경각심)
- GOOD/BAD 엔딩 및 교육 콘텐츠

### LLM 시나리오 생성
```bash
# 새 시나리오 생성 요청
curl -X POST http://localhost:8000/api/v1/scenarios/generate \
  -H "Content-Type: application/json" \
  -d '{"phishing_type": "로맨스스캠", "difficulty": "medium"}'
```

### 뉴스 기반 시나리오 생성
```bash
# 뉴스 크롤링 + 분석 + 시나리오 생성
curl -X POST http://localhost:8000/api/v1/crawler/run \
  -H "Content-Type: application/json" \
  -d '{"generate_scenarios": true}'
```

## API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /health | 헬스체크 |
| GET | /api/v1/scenarios | 시나리오 목록 |
| GET | /api/v1/scenarios/{id} | 시나리오 상세 |
| POST | /api/v1/scenarios/generate | 시나리오 생성 |
| POST | /api/v1/crawler/run | 뉴스 크롤링 |
| GET | /api/v1/crawler/status/{task_id} | 크롤링 상태 |
| GET | /api/v1/crawler/articles | 분석된 기사 목록 |
| GET | /api/v1/scenarios/{task_id}/status | 생성 작업 상태 |
| GET | /api/v1/images/{filename} | 이미지 서빙 |

## Docker 실행

```bash
# 전체 스택 실행
docker-compose up --build

# 개별 실행
docker-compose up backend
docker-compose up frontend
```
