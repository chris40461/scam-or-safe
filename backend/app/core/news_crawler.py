"""뉴스 크롤링 모듈"""
import asyncio
import json
import re
from pathlib import Path
from datetime import datetime, timezone
from difflib import SequenceMatcher
from urllib.parse import urlparse, urlunparse
import httpx
import trafilatura
import litellm

from app.config import settings
from app.models.news import RawArticle, PhishingArticle

CACHE_DIR = Path(__file__).parent.parent / "data" / "news_cache"


class NaverNewsClient:
    """네이버 검색 Open API 클라이언트"""
    BASE_URL = "https://openapi.naver.com/v1/search/news.json"

    def __init__(self, client_id: str, client_secret: str):
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "X-Naver-Client-Id": client_id,
                "X-Naver-Client-Secret": client_secret,
            }
        )

    def _strip_html(self, text: str) -> str:
        """HTML 태그 제거"""
        return re.sub(r"<[^>]+>", "", text)

    async def search(
        self,
        keyword: str,
        display: int = 10,
        sort: str = "date"
    ) -> list[RawArticle]:
        """뉴스 검색 (일 25,000회 무료)"""
        try:
            response = await self.client.get(
                self.BASE_URL,
                params={
                    "query": keyword,
                    "display": display,
                    "sort": sort,
                }
            )
            response.raise_for_status()
            items = response.json().get("items", [])

            return [
                RawArticle(
                    title=self._strip_html(item["title"]),
                    url=item.get("originallink") or item.get("link", ""),
                    description=self._strip_html(item["description"]),
                    pub_date=item.get("pubDate", ""),
                    source="naver",
                )
                for item in items
            ]
        except Exception:
            return []

    async def close(self):
        await self.client.aclose()


class ArticleBodyExtractor:
    """개별 뉴스 사이트에서 기사 본문 추출"""

    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            follow_redirects=True,
        )

    async def extract(self, url: str) -> str | None:
        """URL에서 기사 본문 추출"""
        try:
            response = await self.client.get(url)
            body = trafilatura.extract(response.text)
            if body and len(body) > 100:
                return body[:3000]
            return None
        except Exception:
            return None

    async def close(self):
        await self.client.aclose()


def normalize_url(url: str) -> str:
    """URL 정규화 (쿼리 파라미터 제거)"""
    parsed = urlparse(url)
    return urlunparse((parsed.scheme, parsed.netloc, parsed.path, "", "", ""))


def is_duplicate(article: RawArticle, existing: list[RawArticle]) -> bool:
    """중복 기사 확인"""
    normalized = normalize_url(article.url)
    for ex in existing:
        # URL 비교
        if normalize_url(ex.url) == normalized:
            return True
        # 제목 유사도 비교
        ratio = SequenceMatcher(None, article.title, ex.title).ratio()
        if ratio >= 0.8:
            return True
    return False


class NewsCrawler:
    """뉴스 크롤링 오케스트레이터"""

    DEFAULT_KEYWORDS = [
        "보이스피싱 사례",
        "스미싱 피해",
        "로맨스 스캠",
        "피싱 메일 사기",
        "SNS 부업 사기",
    ]

    def __init__(self):
        self.naver_client = NaverNewsClient(
            settings.naver_client_id,
            settings.naver_client_secret,
        )
        self.body_extractor = ArticleBodyExtractor()

    async def crawl(
        self,
        keywords: list[str] | None = None
    ) -> list[RawArticle]:
        """키워드로 뉴스 크롤링"""
        keywords = keywords or self.DEFAULT_KEYWORDS
        articles: list[RawArticle] = []

        for keyword in keywords:
            results = await self.naver_client.search(keyword, display=10)

            for article in results:
                if not is_duplicate(article, articles):
                    articles.append(article)

            await asyncio.sleep(0.1)  # API 레이트 리밋 방지

        # 기사 본문 크롤링
        articles = await self._fetch_bodies(articles)

        return articles

    async def _fetch_bodies(
        self,
        articles: list[RawArticle]
    ) -> list[RawArticle]:
        """기사 본문 추출"""
        for article in articles:
            body = await self.body_extractor.extract(article.url)
            article.body = body
            await asyncio.sleep(1)  # 본문 크롤링 간격
        return articles

    async def close(self):
        await self.naver_client.close()
        await self.body_extractor.close()


async def analyze_article(article: RawArticle) -> PhishingArticle | None:
    """LLM으로 기사 내용 분석"""
    content = article.body or article.description

    if not content or len(content) < 50:
        return None

    prompt = f"""다음 뉴스 기사를 분석하여 피싱/사기 정보를 추출하세요.

기사 제목: {article.title}
기사 내용: {content[:2000]}

JSON 형식으로 응답:
{{
  "content_summary": "기사 요약 (2-3문장)",
  "phishing_type": "피싱 유형 (보이스피싱/스미싱/로맨스스캠/이메일피싱/SNS사기 등)",
  "methods": ["사용된 수법1", "사용된 수법2"],
  "damage_amount": "피해 금액 (있으면)"
}}"""

    for attempt in range(settings.retry_count + 1):
        try:
            response = await litellm.acompletion(
                model=settings.llm_model,
                messages=[
                    {"role": "system", "content": "뉴스 기사를 분석하여 피싱 정보를 JSON으로 추출하세요."},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                timeout=settings.llm_timeout,
                api_key=settings.gemini_api_key,
            )

            data = json.loads(response.choices[0].message.content)

            return PhishingArticle(
                url=article.url,
                title=article.title,
                source=article.source,
                published_at=None,
                content_summary=data.get("content_summary", ""),
                phishing_type=data.get("phishing_type", "기타"),
                methods=data.get("methods", []),
                damage_amount=data.get("damage_amount"),
            )

        except Exception:
            if attempt == settings.retry_count:
                return None
            await asyncio.sleep(1)

    return None


async def crawl_and_analyze(
    keywords: list[str] | None = None
) -> list[PhishingArticle]:
    """크롤링 + 분석 전체 파이프라인"""
    crawler = NewsCrawler()

    try:
        # 1. 크롤링
        raw_articles = await crawler.crawl(keywords)

        # 2. 병렬 분석 (세마포어로 동시 호출 제한)
        semaphore = asyncio.Semaphore(5)

        async def analyze_with_limit(article: RawArticle):
            async with semaphore:
                return await analyze_article(article)

        results = await asyncio.gather(
            *[analyze_with_limit(a) for a in raw_articles],
            return_exceptions=True
        )

        # 성공한 결과만 필터링
        analyzed = [r for r in results if isinstance(r, PhishingArticle)]

        return analyzed

    finally:
        await crawler.close()


def group_by_phishing_type(
    articles: list[PhishingArticle]
) -> dict[str, list[PhishingArticle]]:
    """피싱 유형별 그룹핑"""
    grouped: dict[str, list[PhishingArticle]] = {}
    for article in articles:
        ptype = article.phishing_type
        if ptype not in grouped:
            grouped[ptype] = []
        grouped[ptype].append(article)
    return grouped


def format_articles_as_seed(articles: list[PhishingArticle]) -> str:
    """분석된 기사들을 시드 정보로 포맷"""
    lines = []
    for i, article in enumerate(articles[:5], 1):
        lines.append(f"{i}. {article.title}")
        lines.append(f"   요약: {article.content_summary}")
        lines.append(f"   수법: {', '.join(article.methods)}")
        if article.damage_amount:
            lines.append(f"   피해액: {article.damage_amount}")
        lines.append("")
    return "\n".join(lines)
