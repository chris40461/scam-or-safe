"""LLM 노드 생성 모듈"""
import json
import asyncio
from pydantic import BaseModel
import litellm

from app.config import settings
from app.models.scenario import Resources, ResourceDelta, ScenarioNode, Choice
from app.pipeline.prompts import (
    ROOT_SYSTEM_PROMPT,
    NODE_SYSTEM_PROMPT,
    build_root_prompt,
    build_node_prompt,
)


class ChoiceResult(BaseModel):
    """LLM이 생성한 선택지"""
    text: str
    is_dangerous: bool
    resource_effect: dict[str, int]


class GenerationResult(BaseModel):
    """LLM이 생성한 노드"""
    node_type: str
    narrative_text: str
    choices: list[ChoiceResult]
    image_prompt: str | None = None
    reasoning: str


class GenerationContext(BaseModel):
    """노드 생성 컨텍스트"""
    phishing_type: str
    difficulty: str
    story_path: str
    choice_taken: str
    current_resources: Resources
    current_depth: int
    max_depth: int
    should_end: bool
    force_end: bool
    ending_type_hint: str | None = None


def infer_ending(resources: Resources) -> str:
    """자원 상태 기반 엔딩 추론"""
    good_score = (5 - resources.trust) + resources.awareness
    bad_score = resources.trust + (5 - resources.money)
    return "good" if good_score >= bad_score else "bad"


async def generate_root_node(
    phishing_type: str,
    difficulty: str,
    seed_info: str | None = None
) -> GenerationResult:
    """루트 노드 생성"""
    user_prompt = build_root_prompt(phishing_type, difficulty, seed_info)

    for attempt in range(settings.retry_count + 1):
        try:
            response = await litellm.acompletion(
                model=settings.llm_model,
                messages=[
                    {"role": "system", "content": ROOT_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                timeout=settings.llm_timeout,
                api_key=settings.gemini_api_key,
            )

            content = response.choices[0].message.content
            data = json.loads(content)
            return GenerationResult.model_validate(data)

        except Exception as e:
            if attempt == settings.retry_count:
                # 폴백: 기본 루트 노드
                return GenerationResult(
                    node_type="narrative",
                    narrative_text=f"당신의 휴대폰에 알 수 없는 번호로 연락이 왔습니다. {phishing_type} 관련 의심스러운 내용입니다.",
                    choices=[
                        ChoiceResult(text="응답한다", is_dangerous=True, resource_effect={"trust": 1, "money": 0, "awareness": 0}),
                        ChoiceResult(text="무시한다", is_dangerous=False, resource_effect={"trust": -1, "money": 0, "awareness": 1}),
                    ],
                    image_prompt="A person in a modern Korean apartment receiving a suspicious phone call, tense atmosphere, dark lighting, webtoon style illustration",
                    reasoning=f"LLM 호출 실패로 폴백 노드 생성: {str(e)}"
                )
            await asyncio.sleep(1)


async def generate_node(context: GenerationContext) -> GenerationResult:
    """다음 노드 생성"""
    user_prompt = build_node_prompt(
        phishing_type=context.phishing_type,
        difficulty=context.difficulty,
        story_path=context.story_path,
        choice_taken=context.choice_taken,
        current_resources=context.current_resources.model_dump(),
        current_depth=context.current_depth,
        max_depth=context.max_depth,
        should_end=context.should_end,
        force_end=context.force_end,
        ending_type_hint=context.ending_type_hint,
    )

    for attempt in range(settings.retry_count + 1):
        try:
            response = await litellm.acompletion(
                model=settings.llm_model,
                messages=[
                    {"role": "system", "content": NODE_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                timeout=settings.llm_timeout,
                api_key=settings.gemini_api_key,
            )

            content = response.choices[0].message.content
            data = json.loads(content)
            return GenerationResult.model_validate(data)

        except Exception as e:
            if attempt == settings.retry_count:
                # 폴백: 엔딩 노드
                ending_type = context.ending_type_hint or infer_ending(context.current_resources)
                image_prompt = (
                    "A relieved person realizing they avoided a scam, bright lighting, hopeful atmosphere, Korean urban setting, webtoon style"
                    if ending_type == "good"
                    else "A distressed person realizing they fell victim to a scam, dark atmosphere, regret and despair, Korean urban setting, webtoon style"
                )
                return GenerationResult(
                    node_type=f"ending_{ending_type}",
                    narrative_text="상황이 마무리되었습니다." if ending_type == "good" else "안타깝게도 피해가 발생했습니다.",
                    choices=[],
                    image_prompt=image_prompt,
                    reasoning=f"LLM 호출 실패로 폴백 엔딩 생성: {str(e)}"
                )
            await asyncio.sleep(1)


def result_to_node(
    result: GenerationResult,
    node_id: str,
    depth: int,
    parent_node_id: str | None = None,
    parent_choice_id: str | None = None,
) -> ScenarioNode:
    """GenerationResult를 ScenarioNode로 변환"""
    choices = []
    for i, choice_result in enumerate(result.choices):
        choice_id = f"{node_id}_c{i+1}"
        choices.append(Choice(
            id=choice_id,
            text=choice_result.text,
            is_dangerous=choice_result.is_dangerous,
            resource_effect=ResourceDelta(
                trust=max(-2, min(2, choice_result.resource_effect.get("trust", 0))),
                money=max(-2, min(2, choice_result.resource_effect.get("money", 0))),
                awareness=max(-2, min(2, choice_result.resource_effect.get("awareness", 0))),
            ),
        ))

    return ScenarioNode(
        id=node_id,
        type=result.node_type,
        text=result.narrative_text,
        choices=choices,
        image_prompt=result.image_prompt,
        depth=depth,
        parent_node_id=parent_node_id,
        parent_choice_id=parent_choice_id,
    )
