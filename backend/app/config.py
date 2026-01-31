"""애플리케이션 설정"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """환경변수 기반 설정"""
    # Google Gemini API (LLM용)
    gemini_api_key: str = ""
    llm_model: str = "gemini/gemini-3-pro-preview"
    image_model: str = "imagen-3.0-generate-002"

    # Google Cloud Vertex AI (Imagen 이미지 생성용)
    google_application_credentials: str = ""
    gcp_project_id: str = ""
    gcp_location: str = "us-central1"

    # 네이버 검색 Open API
    naver_client_id: str = ""
    naver_client_secret: str = ""

    # 서버 설정
    backend_port: int = 8000
    cors_origins: list[str] = ["http://localhost:3000"]

    # 파이프라인 설정
    max_depth: int = 5
    max_choices: int = 3
    semaphore_limit: int = 10
    retry_count: int = 2
    llm_timeout: int = 30
    pipeline_timeout: int = 300

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
