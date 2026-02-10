# Scam Or Safe - 피싱 시나리오 시뮬레이터 

텍스트 어드벤처 형식의 피싱 예방 교육 시뮬레이터입니다. 실제 피싱 사례를 기반으로 한 시나리오를 통해 피싱 수법을 체험하고 대응 방법을 학습합니다.

## 기술 스택

- **Backend**: FastAPI, Pydantic v2, LiteLLM, SlowAPI
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4, Zustand, Motion
- **LLM**: Google Gemini (gemini-3-flash-preview)
- **Image Generation**: Google Imagen (imagen-4.0-fast-generate-001)
- **News Crawling**: Google News RSS (API 키 불필요)

## 프로젝트 구조

```
scam-or-safe/
├── backend/                     # FastAPI 백엔드
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py          # 의존성 주입
│   │   │   └── routes/          # API 엔드포인트
│   │   │       ├── auth.py      # 인증 API
│   │   │       ├── crawler.py   # 뉴스 크롤러 API
│   │   │       ├── images.py    # 이미지 서빙
│   │   │       └── scenario.py  # 시나리오 API
│   │   ├── core/                # 핵심 기능
│   │   │   ├── image_generator.py
│   │   │   └── news_crawler.py
│   │   ├── data/                # 데이터 저장소
│   │   │   ├── images/          # 생성된 이미지
│   │   │   ├── news_cache/      # 뉴스 기사 캐시
│   │   │   └── scenarios/       # 시나리오 JSON
│   │   ├── models/              # Pydantic 모델
│   │   │   ├── news.py
│   │   │   └── scenario.py
│   │   ├── pipeline/            # LLM 시나리오 생성 파이프라인
│   │   │   ├── context_manager.py
│   │   │   ├── end_sequence.py
│   │   │   ├── enrichment.py
│   │   │   ├── node_generator.py
│   │   │   ├── prompts.py
│   │   │   ├── repair.py
│   │   │   ├── tree_builder.py
│   │   │   └── validation.py
│   │   ├── config.py
│   │   └── main.py
│   ├── credentials/             # GCP 서비스 계정 키
│   ├── tests/                   # 테스트
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                    # Next.js 프론트엔드
│   └── src/
│       ├── app/                 # App Router 페이지
│       │   ├── api/game/        # 게임 API 라우트
│       │   ├── game/            # 게임 플레이 페이지
│       │   ├── generate/        # 시나리오 생성 페이지
│       │   ├── layout.tsx
│       │   └── page.tsx         # 메인 페이지
│       ├── components/
│       │   ├── admin/           # 관리자 컴포넌트
│       │   └── game/            # 게임 UI 컴포넌트
│       ├── hooks/               # 커스텀 훅
│       │   ├── useGameStore.ts
│       │   └── useTypingEffect.ts
│       └── lib/                 # 유틸리티
│           ├── admin-store.ts
│           ├── api.ts
│           ├── game-engine.ts
│           ├── session-store.ts
│           └── types.ts
│
├── scripts/                     # 실행 스크립트
│   ├── start-all.sh             # 전체 서비스 시작
│   ├── start-backend.sh         # 백엔드 시작
│   ├── start-frontend.sh        # 프론트엔드 시작
│   ├── stop-all.sh              # 전체 서비스 중지
│   ├── generate-scenario.sh     # 시나리오 생성
│   └── delete-scenarios.sh      # 시나리오 삭제
│
├── docs/                        # 개발 문서
│   ├── 0.MVP.md
│   ├── 1.Foundation.md
│   ├── 2.Frontend.md
│   ├── 3.AgenticPipeline.md
│   ├── 4.NewsCrawler.md
│   └── 5.Polish.md
│
├── docker-compose.yml
├── DEPLOY.md                    # 배포 가이드
└── README.md
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
uvicorn app.main:app --reload --port 8080
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

### 3. 스크립트로 실행

```bash
# 전체 서비스 시작
./scripts/start-all.sh

# 전체 서비스 중지
./scripts/stop-all.sh
```

### 4. 접속

- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:8080
- API 문서: http://localhost:8080/docs

## API 키 발급

### Gemini API (필수)

1. https://aistudio.google.com/apikey 접속
2. "Create API Key" 클릭
3. `.env`의 `GEMINI_API_KEY`에 입력

### Google Cloud Vertex AI (이미지 생성용, 선택)

1. Google Cloud Console에서 Vertex AI API 활성화
2. 서비스 계정 생성 후 JSON 키 다운로드
3. JSON 파일을 `backend/credentials/` 폴더에 복사
4. `.env`에 `GCP_PROJECT_ID` 입력

## 주요 기능

### 게임 플레이
- 시드 시나리오로 즉시 플레이 가능
- 선택에 따라 스토리 분기
- 리소스 시스템 (신뢰도, 자산, 경각심)
- GOOD/BAD 엔딩 및 교육 콘텐츠
- 위험한 선택에 대한 실시간 피드백

### LLM 시나리오 생성
```bash
# 새 시나리오 생성 요청
curl -X POST http://localhost:8080/api/v1/scenarios/generate \
  -H "Content-Type: application/json" \
  -d '{"phishing_type": "로맨스스캠", "difficulty": "medium"}'

# 또는 스크립트 사용
./scripts/generate-scenario.sh
```

### 뉴스 기반 시나리오 생성
```bash
# 뉴스 크롤링 + 분석 + 시나리오 생성
curl -X POST http://localhost:8080/api/v1/crawler/run \
  -H "Content-Type: application/json" \
  -d '{"generate_scenarios": true}'
```

## API 엔드포인트

### Backend API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /health | 헬스체크 |
| POST | /api/v1/auth/login | 관리자 로그인 |
| POST | /api/v1/auth/logout | 관리자 로그아웃 |
| GET | /api/v1/auth/verify | 관리자 세션 검증 |
| GET | /api/v1/scenarios | 시나리오 목록 |
| GET | /api/v1/scenarios/{id} | 시나리오 상세 |
| POST | /api/v1/scenarios/generate | 시나리오 생성 |
| GET | /api/v1/scenarios/{task_id}/status | 생성 작업 상태 |
| POST | /api/v1/crawler/run | 뉴스 크롤링 |
| GET | /api/v1/crawler/status/{task_id} | 크롤링 상태 |
| GET | /api/v1/crawler/articles | 분석된 기사 목록 |
| GET | /api/v1/images/{scenario_id}/{filename} | 시나리오 이미지 서빙 |
| GET | /api/v1/images/{filename} | 공통 이미지 서빙 |

### Frontend API (Next.js API Routes)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | /api/game | 새 게임 세션 시작 |
| GET | /api/game/{sessionId}/state | 게임 상태 조회 |
| POST | /api/game/{sessionId}/choose | 선택지 선택 |
| POST | /api/game/{sessionId}/undo | 선택 되돌리기 |

## Docker 실행

```bash
# 전체 스택 실행
docker-compose up --build

# 개별 실행
docker-compose up backend
docker-compose up frontend
```

## 테스트

```bash
cd backend
pytest tests/
```
