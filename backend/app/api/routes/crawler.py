"""뉴스 크롤링 API 라우트"""
import asyncio
from uuid import uuid4
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, BackgroundTasks

from app.core.news_crawler import (
    crawl_and_analyze,
    group_by_phishing_type,
    format_articles_as_seed,
)
from app.models.news import PhishingArticle
from app.pipeline.tree_builder import ScenarioTreeBuilder
from app.api.routes.scenario import _save_scenario

router = APIRouter(prefix="/crawler", tags=["crawler"])

# 크롤링 작업 상태 저장
crawler_tasks: dict[str, dict] = {}

# 분석된 기사 캐시
analyzed_articles: list[PhishingArticle] = []


class CrawlRequest(BaseModel):
    """크롤링 요청"""
    keywords: list[str] | None = None
    generate_scenarios: bool = False


async def _run_crawl(task_id: str, request: CrawlRequest):
    """백그라운드에서 크롤링 실행"""
    global analyzed_articles

    try:
        crawler_tasks[task_id]["status"] = "crawling"

        # 1. 크롤링 + 분석
        articles = await crawl_and_analyze(request.keywords)
        analyzed_articles = articles

        crawler_tasks[task_id]["articles_count"] = len(articles)
        crawler_tasks[task_id]["status"] = "analyzed"

        # 2. 시나리오 생성 (옵션)
        if request.generate_scenarios and articles:
            crawler_tasks[task_id]["status"] = "generating"

            grouped = group_by_phishing_type(articles)
            scenario_ids = []

            for phishing_type, type_articles in grouped.items():
                seed_info = format_articles_as_seed(type_articles)

                builder = ScenarioTreeBuilder()
                scenario = await builder.build(
                    phishing_type=phishing_type,
                    difficulty="medium",
                    seed_info=seed_info,
                )

                _save_scenario(scenario)
                scenario_ids.append(scenario.id)

            crawler_tasks[task_id]["scenario_ids"] = scenario_ids

        crawler_tasks[task_id]["status"] = "completed"

    except Exception as e:
        crawler_tasks[task_id]["status"] = "failed"
        crawler_tasks[task_id]["error"] = str(e)


@router.post("/run")
async def run_crawler(
    request: CrawlRequest,
    background_tasks: BackgroundTasks
) -> dict:
    """뉴스 크롤링 트리거"""
    task_id = f"crawl_{uuid4().hex[:8]}"

    crawler_tasks[task_id] = {
        "status": "pending",
        "keywords": request.keywords,
        "generate_scenarios": request.generate_scenarios,
    }

    background_tasks.add_task(_run_crawl, task_id, request)

    return {"task_id": task_id, "status": "started"}


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
    """분석된 기사 목록 조회"""
    articles = analyzed_articles

    if phishing_type:
        articles = [a for a in articles if a.phishing_type == phishing_type]

    articles = articles[:limit]

    return {
        "articles": [a.model_dump() for a in articles],
        "total": len(analyzed_articles),
    }
