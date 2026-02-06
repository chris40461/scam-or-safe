# Google Cloud Run 배포 가이드

## 사전 요구사항

- [Google Cloud SDK 설치](https://cloud.google.com/sdk/docs/install)
- [Docker 설치](https://docs.docker.com/get-docker/)
- GCP 프로젝트 접근 권한
- **서비스 계정 키**: `backend/credentials/service-account.json` (Vertex AI용)
- **환경변수 준비**: `backend/.env` 파일 참고하여 API 키 준비

## 설정

| 항목 | 값 |
|------|-----|
| GCP Project | `gen-lang-client-0831429551` |
| Region | `asia-northeast3` (서울) |

## 배포 순서

### 1. GCP 인증 및 프로젝트 설정

```bash
gcloud auth login
gcloud config set project gen-lang-client-0831429551
gcloud services enable run.googleapis.com artifactregistry.googleapis.com
gcloud auth configure-docker
```

### 2. 백엔드 배포

```bash
# 이미지 빌드
docker build -t gcr.io/gen-lang-client-0831429551/scam-or-safe-backend:latest \
  -f backend/Dockerfile ./backend

# 이미지 푸시
docker push gcr.io/gen-lang-client-0831429551/scam-or-safe-backend:latest

# Cloud Run 배포 (환경변수 설정 필수)
gcloud run deploy scam-or-safe-backend \
  --image gcr.io/gen-lang-client-0831429551/scam-or-safe-backend:latest \
  --region asia-northeast3 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --set-env-vars "CORS_ORIGINS=*" \
  --set-env-vars "GEMINI_API_KEY=<your-api-key>" \
  --set-env-vars "LLM_MODEL=gemini/gemini-2.0-flash" \
  --set-env-vars "IMAGE_MODEL=imagen-3.0-fast-generate-001" \
  --set-env-vars "GCP_PROJECT_ID=gen-lang-client-0831429551" \
  --set-env-vars "GCP_LOCATION=us-central1" \
  --set-env-vars "NAVER_CLIENT_ID=<your-naver-client-id>" \
  --set-env-vars "NAVER_CLIENT_SECRET=<your-naver-client-secret>" \
  --set-env-vars "ADMIN_PASSWORD=<your-admin-password>"
```

### 3. 백엔드 URL 확인

```bash
BACKEND_URL=$(gcloud run services describe scam-or-safe-backend \
  --region=asia-northeast3 --format='value(status.url)')
echo "Backend URL: $BACKEND_URL"
```

### 4. 프론트엔드 배포

```bash
# 이미지 빌드 (백엔드 URL 주입)
docker build \
  --build-arg BACKEND_URL=$BACKEND_URL \
  -t gcr.io/gen-lang-client-0831429551/scam-or-safe-frontend:latest \
  -f frontend/Dockerfile ./frontend

# 이미지 푸시
docker push gcr.io/gen-lang-client-0831429551/scam-or-safe-frontend:latest

# Cloud Run 배포 (API Route용 백엔드 URL 설정)
gcloud run deploy scam-or-safe-frontend \
  --image gcr.io/gen-lang-client-0831429551/scam-or-safe-frontend:latest \
  --region asia-northeast3 \
  --platform managed \
  --allow-unauthenticated \
  --memory 256Mi \
  --set-env-vars "BACKEND_URL=$BACKEND_URL"
```

### 5. CORS 설정 업데이트

```bash
# 프론트엔드 URL 확인
FRONTEND_URL=$(gcloud run services describe scam-or-safe-frontend \
  --region=asia-northeast3 --format='value(status.url)')
echo "Frontend URL: $FRONTEND_URL"

# 백엔드 CORS 설정 업데이트
gcloud run services update scam-or-safe-backend \
  --region asia-northeast3 \
  --set-env-vars "CORS_ORIGINS=[\"$FRONTEND_URL\"]"
```

## 배포 확인

1. `$FRONTEND_URL` 접속
2. "게임 시작하기" 클릭
3. 시나리오 목록 확인
4. 시나리오 플레이 테스트

## 주의사항

- **서비스 계정 키**: `backend/credentials/service-account.json` 파일이 있어야 이미지 생성 가능
- **시나리오 데이터**: `backend/app/data/`에 시나리오가 있어야 게임 플레이 가능
- **관리자 기능**: `ADMIN_PASSWORD` 환경변수 미설정 시 관리자 로그인 불가
- **재배포 시**: 백엔드 URL이 변경되면 프론트엔드 재빌드 필요
- **환경변수**: Cloud Run은 `.env` 파일을 읽지 않으므로 `--set-env-vars`로 전달 필수

## 서비스 삭제

```bash
gcloud run services delete scam-or-safe-frontend --region asia-northeast3
gcloud run services delete scam-or-safe-backend --region asia-northeast3
```
