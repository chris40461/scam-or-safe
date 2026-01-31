"""교육 콘텐츠 생성 모듈"""
import json
import litellm

from app.config import settings
from app.models.scenario import EducationalContent
from app.pipeline.prompts import EDUCATIONAL_SYSTEM_PROMPT, build_educational_prompt


async def enrich_node_with_education(
    node_text: str,
    choice_text: str,
    phishing_type: str
) -> EducationalContent | None:
    """노드에 대한 교육 콘텐츠 생성"""
    user_prompt = build_educational_prompt(node_text, choice_text, phishing_type)

    for attempt in range(settings.retry_count + 1):
        try:
            response = await litellm.acompletion(
                model=settings.llm_model,
                messages=[
                    {"role": "system", "content": EDUCATIONAL_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                timeout=settings.llm_timeout,
                api_key=settings.gemini_api_key,
            )

            content = response.choices[0].message.content
            data = json.loads(content)
            return EducationalContent.model_validate(data)

        except Exception:
            if attempt == settings.retry_count:
                # 폴백: 기본 교육 콘텐츠
                return EducationalContent(
                    title="주의하세요",
                    explanation=f"이것은 {phishing_type}의 전형적인 수법입니다. 항상 의심하고 확인하세요.",
                    prevention_tips=[
                        "의심스러운 연락은 먼저 끊으세요",
                        "공식 채널로 직접 확인하세요",
                    ],
                    warning_signs=[
                        "급하게 결정을 요구",
                        "개인정보나 금전 요구",
                    ],
                )

    return None
