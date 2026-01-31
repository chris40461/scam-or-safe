"""시나리오 API 라우트"""
import json
import asyncio
from pathlib import Path
from uuid import uuid4
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, BackgroundTasks

from app.models.scenario import ScenarioTree
from app.pipeline.tree_builder import ScenarioTreeBuilder

router = APIRouter(prefix="/scenarios", tags=["scenarios"])

SEED_SCENARIOS_DIR = Path(__file__).parent.parent.parent / "data" / "seed_scenarios"
SCENARIOS_DIR = Path(__file__).parent.parent.parent / "data" / "scenarios"

# 생성 작업 상태 저장
generation_tasks: dict[str, dict] = {}


class GenerateRequest(BaseModel):
    """시나리오 생성 요청"""
    phishing_type: str
    difficulty: str = "medium"
    seed_info: str | None = None


def _load_scenario(file_path: Path) -> ScenarioTree:
    """JSON 파일에서 시나리오 로드"""
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return ScenarioTree.model_validate(data)


def _save_scenario(scenario: ScenarioTree):
    """시나리오를 JSON 파일로 저장"""
    SCENARIOS_DIR.mkdir(parents=True, exist_ok=True)
    file_path = SCENARIOS_DIR / f"{scenario.id}.json"
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(scenario.model_dump(mode="json"), f, ensure_ascii=False, indent=2)


def _get_all_scenarios() -> list[ScenarioTree]:
    """모든 시나리오 로드 (시드 + 생성된 시나리오)"""
    scenarios = []

    # 시드 시나리오 로드
    if SEED_SCENARIOS_DIR.exists():
        for file_path in SEED_SCENARIOS_DIR.glob("*.json"):
            try:
                scenarios.append(_load_scenario(file_path))
            except Exception:
                continue

    # 생성된 시나리오 로드
    if SCENARIOS_DIR.exists():
        for file_path in SCENARIOS_DIR.glob("*.json"):
            try:
                scenarios.append(_load_scenario(file_path))
            except Exception:
                continue

    return scenarios


@router.get("")
async def list_scenarios() -> list[dict]:
    """시나리오 목록 조회"""
    scenarios = _get_all_scenarios()
    return [
        {
            "id": s.id,
            "title": s.title,
            "description": s.description,
            "phishing_type": s.phishing_type,
            "difficulty": s.difficulty,
            "created_at": s.created_at.isoformat(),
        }
        for s in scenarios
    ]


@router.get("/{scenario_id}")
async def get_scenario(scenario_id: str) -> ScenarioTree:
    """시나리오 상세 조회"""
    scenarios = _get_all_scenarios()
    for scenario in scenarios:
        if scenario.id == scenario_id:
            return scenario
    raise HTTPException(status_code=404, detail="Scenario not found")


async def _run_generation(task_id: str, request: GenerateRequest):
    """백그라운드에서 시나리오 생성 실행"""
    try:
        generation_tasks[task_id]["status"] = "generating"

        builder = ScenarioTreeBuilder()
        scenario = await builder.build(
            phishing_type=request.phishing_type,
            difficulty=request.difficulty,
            seed_info=request.seed_info,
        )

        _save_scenario(scenario)

        generation_tasks[task_id]["status"] = "completed"
        generation_tasks[task_id]["scenario_id"] = scenario.id

    except Exception as e:
        generation_tasks[task_id]["status"] = "failed"
        generation_tasks[task_id]["error"] = str(e)


@router.post("/generate")
async def generate_scenario(
    request: GenerateRequest,
    background_tasks: BackgroundTasks
) -> dict:
    """시나리오 자동 생성 (비동기)"""
    task_id = f"task_{uuid4().hex[:8]}"

    generation_tasks[task_id] = {
        "status": "pending",
        "phishing_type": request.phishing_type,
        "difficulty": request.difficulty,
    }

    background_tasks.add_task(_run_generation, task_id, request)

    return {"task_id": task_id, "status": "started"}


@router.get("/{scenario_id}/status")
async def get_generation_status(scenario_id: str) -> dict:
    """생성 작업 상태 조회 (task_id로 조회)"""
    if scenario_id not in generation_tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    task = generation_tasks[scenario_id]
    return task
