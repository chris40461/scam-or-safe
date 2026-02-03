"""뉴스 크롤링 API 라우트 (RSS 기반)"""
import asyncio
import logging
from uuid import uuid4
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, BackgroundTasks

from app.core.news_crawler import (
    crawl_and_analyze,
    group_by_phishing_type,
    format_articles_as_seed,
)
from app.models.news import PhishingArticle
from app.pipeline.tree_builder import ScenarioTreeBuilder
from app.api.routes.scenario import _save_scenario

logger = logging.getLogger("api.crawler")
router = APIRouter(prefix="/crawler", tags=["crawler"])

# 크롤링 작업 상태 저장
crawler_tasks: dict[str, dict] = {}

# 분석된 기사 캐시 (id -> PhishingArticle)
analyzed_articles: dict[str, PhishingArticle] = {}


class RefreshRequest(BaseModel):
    """크롤링 새로고침 요청"""
    keywords: list[str] | None = None


class GenerateFromArticleRequest(BaseModel):
    """선택한 기사 기반 시나리오 생성 요청"""
    article_id: str = Field(description="선택한 기사 ID")
    difficulty: str = Field(
        default="medium",
        description="시나리오 난이도 (easy/medium/hard)"
    )


class GenerateScenariosRequest(BaseModel):
    """크롤링 기반 시나리오 자동 생성 요청"""
    keywords: list[str] | None = Field(
        default=None,
        description="검색 키워드 (없으면 기본 키워드 사용)"
    )
    phishing_type: str | None = Field(
        default=None,
        description="특정 피싱 유형으로 필터링 (없으면 모든 유형)"
    )
    difficulty: str = Field(
        default="medium",
        description="시나리오 난이도 (easy/medium/hard)"
    )
    max_scenarios: int = Field(
        default=3,
        ge=1,
        le=10,
        description="생성할 최대 시나리오 수"
    )


async def _run_refresh(task_id: str, keywords: list[str] | None):
    """백그라운드에서 크롤링 + 필터링 실행"""
    global analyzed_articles

    try:
        crawler_tasks[task_id]["status"] = "crawling"

        # 크롤링 + LLM 분석 (피싱 관련만 필터링)
        articles = await crawl_and_analyze(keywords)

        # dict로 저장 (id -> article)
        analyzed_articles = {a.id: a for a in articles}

        crawler_tasks[task_id]["articles_count"] = len(articles)
        crawler_tasks[task_id]["status"] = "completed"

        # 유형별 통계
        grouped = group_by_phishing_type(articles)
        crawler_tasks[task_id]["phishing_types"] = {
            ptype: len(arts) for ptype, arts in grouped.items()
        }

        logger.info("[%s] 크롤링 완료: %d개 피싱 관련 기사", task_id, len(articles))

    except Exception as e:
        crawler_tasks[task_id]["status"] = "failed"
        crawler_tasks[task_id]["error"] = str(e)
        logger.error("[%s] 크롤링 실패: %s", task_id, str(e))


@router.post("/refresh")
async def refresh_articles(
    request: RefreshRequest,
    background_tasks: BackgroundTasks
) -> dict:
    """뉴스 크롤링 새로고침 (RSS 기반)

    최신 뉴스를 크롤링하고 LLM으로 피싱 관련 기사만 필터링합니다.
    결과는 /articles 엔드포인트에서 조회할 수 있습니다.
    """
    task_id = f"crawl_{uuid4().hex[:8]}"

    crawler_tasks[task_id] = {
        "status": "pending",
        "keywords": request.keywords,
    }

    background_tasks.add_task(_run_refresh, task_id, request.keywords)

    logger.info("[%s] 크롤링 새로고침 시작", task_id)

    return {
        "task_id": task_id,
        "status": "started",
        "message": "뉴스 크롤링이 시작되었습니다. /status/{task_id}에서 상태를 확인하세요.",
    }


@router.get("/status/{task_id}")
async def get_crawl_status(task_id: str) -> dict:
    """크롤링 작업 상태 조회"""
    if task_id not in crawler_tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    return crawler_tasks[task_id]


@router.get("/articles")
async def get_articles(
    phishing_type: str | None = None,
    limit: int = 20
) -> dict:
    """분석된 기사 목록 조회 (Frontend에서 사용자 선택용)"""
    articles = list(analyzed_articles.values())

    if phishing_type:
        articles = [a for a in articles if phishing_type.lower() in a.phishing_type.lower()]

    articles = articles[:limit]

    return {
        "articles": [a.model_dump() for a in articles],
        "total": len(analyzed_articles),
    }


@router.get("/articles/{article_id}")
async def get_article(article_id: str) -> dict:
    """개별 기사 상세 조회"""
    if article_id not in analyzed_articles:
        raise HTTPException(status_code=404, detail="Article not found")

    return analyzed_articles[article_id].model_dump()


@router.post("/generate-from-article")
async def generate_from_article(
    request: GenerateFromArticleRequest,
    background_tasks: BackgroundTasks
) -> dict:
    """선택한 기사 기반 시나리오 생성

    Frontend에서 사용자가 기사를 선택하면, 해당 기사의 정보를 활용하여 시나리오 생성
    """
    if request.article_id not in analyzed_articles:
        raise HTTPException(status_code=404, detail="Article not found")

    article = analyzed_articles[request.article_id]
    task_id = f"gen_{uuid4().hex[:8]}"

    crawler_tasks[task_id] = {
        "status": "pending",
        "article_id": request.article_id,
        "article_title": article.title,
        "difficulty": request.difficulty,
    }

    background_tasks.add_task(
        _run_generate_from_article, task_id, article, request.difficulty
    )

    logger.info("[%s] 기사 기반 시나리오 생성 시작: %s", task_id, article.title)

    return {
        "task_id": task_id,
        "status": "started",
        "message": f"'{article.title}' 기사를 기반으로 시나리오 생성 중...",
    }


async def _run_generate_from_article(
    task_id: str,
    article: PhishingArticle,
    difficulty: str
):
    """백그라운드에서 기사 기반 시나리오 생성"""
    try:
        crawler_tasks[task_id]["status"] = "generating"

        # 기사 정보를 seed_info로 구성
        seed_info = format_article_as_seed(article)

        builder = ScenarioTreeBuilder()
        scenario = await builder.build(
            phishing_type=article.phishing_type,
            difficulty=difficulty,
            seed_info=seed_info,
        )

        _save_scenario(scenario)

        crawler_tasks[task_id]["status"] = "completed"
        crawler_tasks[task_id]["scenario_id"] = scenario.id
        logger.info("[%s] 시나리오 생성 완료: %s", task_id, scenario.id)

    except Exception as e:
        crawler_tasks[task_id]["status"] = "failed"
        crawler_tasks[task_id]["error"] = str(e)
        logger.error("[%s] 시나리오 생성 실패: %s", task_id, str(e))


def format_article_as_seed(article: PhishingArticle) -> str:
    """단일 기사를 시나리오 생성용 시드 정보로 포맷"""
    lines = [
        f"다음 실제 피싱 사례를 기반으로 교육용 시나리오를 생성하세요:",
        "",
        f"## 사례: {article.title}",
        f"- 사기 유형: {article.phishing_type}",
    ]

    if article.victim_profile:
        lines.append(f"- 피해자 특성: {article.victim_profile}")
    if article.scammer_persona:
        lines.append(f"- 사기범 역할: {article.scammer_persona}")
    if article.initial_contact:
        lines.append(f"- 최초 접근: {article.initial_contact}")
    if article.persuasion_tactics:
        lines.append(f"- 설득 수법: {', '.join(article.persuasion_tactics)}")
    if article.requested_actions:
        lines.append(f"- 요구 행동: {', '.join(article.requested_actions)}")
    if article.red_flags:
        lines.append(f"- 경고 신호: {', '.join(article.red_flags)}")
    if article.damage_amount:
        lines.append(f"- 피해 금액: {article.damage_amount}")
    if article.scenario_seed:
        lines.append(f"")
        lines.append(f"## 시나리오 핵심")
        lines.append(article.scenario_seed)

    lines.append("")
    lines.append("위 사례의 수법과 상황을 활용하여 현실적인 시뮬레이션 시나리오를 생성하세요.")

    return "\n".join(lines)


def format_articles_as_seed_enhanced(articles: list[PhishingArticle]) -> str:
    """여러 기사를 시나리오 생성용 시드 정보로 포맷 (향상된 버전)"""
    lines = [
        "다음 실제 피싱 사례들을 기반으로 교육용 시나리오를 생성하세요:",
        "",
    ]

    for i, article in enumerate(articles[:3], 1):
        lines.append(f"## 사례 {i}: {article.title}")
        lines.append(f"- 사기 유형: {article.phishing_type}")

        if article.victim_profile:
            lines.append(f"- 피해자 특성: {article.victim_profile}")
        if article.scammer_persona:
            lines.append(f"- 사기범 역할: {article.scammer_persona}")
        if article.initial_contact:
            lines.append(f"- 최초 접근: {article.initial_contact}")
        if article.persuasion_tactics:
            lines.append(f"- 설득 수법: {', '.join(article.persuasion_tactics)}")
        if article.requested_actions:
            lines.append(f"- 요구 행동: {', '.join(article.requested_actions)}")
        if article.red_flags:
            lines.append(f"- 경고 신호: {', '.join(article.red_flags)}")
        if article.damage_amount:
            lines.append(f"- 피해 금액: {article.damage_amount}")
        if article.scenario_seed:
            lines.append(f"- 핵심 스토리: {article.scenario_seed}")
        lines.append("")

    lines.append("위 사례들의 공통된 수법과 패턴을 활용하여 현실적인 시뮬레이션 시나리오를 생성하세요.")

    return "\n".join(lines)


async def _run_generate_scenarios(task_id: str, request: GenerateScenariosRequest):
    """백그라운드에서 크롤링 + 시나리오 생성"""
    global analyzed_articles

    try:
        # Phase 1: 크롤링 + 분석
        crawler_tasks[task_id]["status"] = "crawling"
        logger.info("[%s] 크롤링 시작: keywords=%s", task_id, request.keywords)

        articles = await crawl_and_analyze(request.keywords)
        analyzed_articles = articles

        crawler_tasks[task_id]["articles_count"] = len(articles)
        logger.info("[%s] 분석 완료: %d개 기사", task_id, len(articles))

        if not articles:
            crawler_tasks[task_id]["status"] = "completed"
            crawler_tasks[task_id]["message"] = "분석된 기사가 없습니다"
            return

        # Phase 2: 유형별 그룹핑
        crawler_tasks[task_id]["status"] = "grouping"
        grouped = group_by_phishing_type(articles)

        # 특정 유형 필터링
        if request.phishing_type:
            if request.phishing_type in grouped:
                grouped = {request.phishing_type: grouped[request.phishing_type]}
            else:
                crawler_tasks[task_id]["status"] = "completed"
                crawler_tasks[task_id]["message"] = f"'{request.phishing_type}' 유형 기사 없음"
                crawler_tasks[task_id]["phishing_types"] = list(group_by_phishing_type(articles).keys())
                return

        crawler_tasks[task_id]["phishing_types"] = list(grouped.keys())
        logger.info("[%s] 그룹핑 완료: %s", task_id, list(grouped.keys()))

        # Phase 3: 시나리오 생성
        crawler_tasks[task_id]["status"] = "generating"
        scenario_ids = []
        scenarios_generated = 0

        for phishing_type, type_articles in grouped.items():
            if scenarios_generated >= request.max_scenarios:
                break

            # seed_info 구성
            seed_info = format_articles_as_seed_enhanced(type_articles)

            logger.info("[%s] 시나리오 생성 중: type=%s", task_id, phishing_type)

            builder = ScenarioTreeBuilder()
            scenario = await builder.build(
                phishing_type=phishing_type,
                difficulty=request.difficulty,
                seed_info=seed_info,
            )

            _save_scenario(scenario)
            scenario_ids.append(scenario.id)
            scenarios_generated += 1

            logger.info("[%s] 시나리오 생성 완료: %s", task_id, scenario.id)

        crawler_tasks[task_id]["scenario_ids"] = scenario_ids
        crawler_tasks[task_id]["status"] = "completed"
        logger.info("[%s] 전체 완료: %d개 시나리오", task_id, len(scenario_ids))

    except Exception as e:
        crawler_tasks[task_id]["status"] = "failed"
        crawler_tasks[task_id]["error"] = str(e)
        logger.error("[%s] 실패: %s", task_id, str(e))


@router.post("/generate-scenarios")
async def generate_scenarios_from_news(
    request: GenerateScenariosRequest,
    background_tasks: BackgroundTasks
) -> dict:
    """뉴스 크롤링 기반 시나리오 자동 생성

    1. 키워드로 뉴스 크롤링 (Google News RSS)
    2. LLM으로 기사 분석 (피싱 유형, 수법 추출)
    3. 유형별로 그룹핑
    4. 각 유형별 시나리오 생성
    """
    task_id = f"crawl_gen_{uuid4().hex[:8]}"

    crawler_tasks[task_id] = {
        "status": "pending",
        "keywords": request.keywords,
        "phishing_type": request.phishing_type,
        "difficulty": request.difficulty,
        "max_scenarios": request.max_scenarios,
    }

    background_tasks.add_task(_run_generate_scenarios, task_id, request)

    logger.info("[%s] 시나리오 생성 요청 시작", task_id)

    return {
        "task_id": task_id,
        "status": "started",
        "message": "뉴스 크롤링 및 시나리오 생성이 시작되었습니다.",
    }
