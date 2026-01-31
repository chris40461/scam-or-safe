"""뉴스 관련 Pydantic 모델"""
from datetime import datetime
from pydantic import BaseModel


class RawArticle(BaseModel):
    """크롤링된 원본 기사"""
    title: str
    url: str
    description: str
    pub_date: str
    source: str
    body: str | None = None


class PhishingArticle(BaseModel):
    """LLM 분석된 피싱 기사"""
    url: str
    title: str
    source: str
    published_at: datetime | None = None
    content_summary: str
    phishing_type: str
    methods: list[str]
    damage_amount: str | None = None
