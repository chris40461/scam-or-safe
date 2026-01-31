"""LLM 프롬프트 템플릿"""

ROOT_SYSTEM_PROMPT = """당신은 피싱 예방 교육을 위한 텍스트 어드벤처 게임 시나리오 작가입니다.
2인칭 시점("당신은...")으로 현실적인 피싱 시나리오를 작성합니다.
반드시 JSON 형식으로만 응답하세요.

자원 변동 규칙:
- 각 선택지의 resource_effect는 -2 ~ +2 범위로 제한
- trust(신뢰도): 사기범에게 동조하면 +, 의심하면 -
- money(자산): 송금/결제하면 -, 거부하면 변동 없음
- awareness(경각심): 경고 신호를 인지하면 +, 무시하면 -

선택지 작성 규칙:
- 각 노드에 2-3개의 선택지 제공
- 최소 1개는 위험한 선택(is_dangerous=true), 1개는 안전한 선택
- 선택지 텍스트는 1-2문장으로 간결하게"""

NODE_SYSTEM_PROMPT = """당신은 피싱 시나리오의 다음 장면을 생성합니다.
이전 이야기 맥락과 플레이어의 선택을 바탕으로 자연스러운 다음 장면을 작성합니다.
반드시 JSON 형식으로만 응답하세요.

종료 신호 처리:
- should_end=true이고 force=true: 반드시 엔딩(ending_good 또는 ending_bad)으로 작성, choices는 빈 리스트
- should_end=true이고 force=false: 엔딩을 권장하지만, 내러티브상 자연스럽지 않으면 계속 가능
- should_end=false: narrative 타입으로 계속 진행

엔딩 작성 규칙:
- ending_good: 피싱을 간파하고 피해를 예방한 결말
- ending_bad: 피싱에 당해 금전적/개인정보 피해를 입은 결말
- 엔딩 텍스트는 상황의 결과와 교훈을 포함"""

EDUCATIONAL_SYSTEM_PROMPT = """당신은 피싱 예방 교육 전문가입니다.
주어진 피싱 시나리오 상황에 대해 교육적 콘텐츠를 작성합니다.
반드시 JSON 형식으로만 응답하세요.

교육 콘텐츠 구성:
- title: 간결한 제목 (10자 이내)
- explanation: 왜 위험한지 설명 (2-3문장)
- warning_signs: 놓친 경고 신호들 (2-4개)
- prevention_tips: 예방 방법 (2-4개)"""

CONTEXT_SUMMARY_PROMPT = """다음 피싱 시나리오 경과를 3-4문장으로 요약하세요.
핵심 상황과 사용자의 선택만 간결하게 포함하세요."""


def build_root_prompt(phishing_type: str, difficulty: str, seed_info: str | None = None) -> str:
    """루트 노드 생성용 프롬프트"""
    prompt = f"""피싱 유형: {phishing_type}
난이도: {difficulty}

이 피싱 유형의 첫 장면을 작성하세요.
- 피해자가 피싱 시도를 처음 접하는 상황
- 전화, 문자, 이메일 등 접촉 방식 포함
- 2-3개의 선택지 제공

"""
    if seed_info:
        prompt += f"""참고할 실제 사례 정보:
{seed_info}

"""

    prompt += """JSON 형식:
{
  "node_type": "narrative",
  "narrative_text": "2인칭 시점 나레이션 (한국어, 3-5문장)",
  "choices": [
    {
      "text": "선택지 텍스트",
      "is_dangerous": true/false,
      "resource_effect": {"trust": 0, "money": 0, "awareness": 0}
    }
  ],
  "image_prompt": "A person receiving a suspicious phone call in a modern Korean apartment, tense atmosphere, webtoon style illustration, dark lighting",
  "reasoning": "이 장면 설계의 근거"
}

IMPORTANT: image_prompt는 필수입니다. 반드시 영문으로 장면을 묘사하는 이미지 프롬프트를 포함하세요."""
    return prompt


def build_node_prompt(
    phishing_type: str,
    difficulty: str,
    story_path: str,
    choice_taken: str,
    current_resources: dict,
    current_depth: int,
    max_depth: int,
    should_end: bool,
    force_end: bool,
    ending_type_hint: str | None
) -> str:
    """다음 노드 생성용 프롬프트"""
    prompt = f"""피싱 유형: {phishing_type}
난이도: {difficulty}
현재 깊이: {current_depth}/{max_depth}

이전 이야기:
{story_path}

플레이어의 선택: "{choice_taken}"

현재 자원 상태:
- 신뢰도(trust): {current_resources['trust']}/5
- 자산(money): {current_resources['money']}/5
- 경각심(awareness): {current_resources['awareness']}/5

"""

    if should_end:
        if force_end:
            prompt += f"""종료 신호: 반드시 엔딩으로 작성 (강제)
권장 엔딩 유형: {ending_type_hint}
choices는 빈 리스트 []로 작성하세요.

"""
        else:
            prompt += f"""종료 신호: 엔딩 권장 (선택적)
권장 엔딩 유형: {ending_type_hint}
내러티브상 자연스러우면 엔딩으로, 아니면 계속 진행 가능합니다.

"""
    else:
        prompt += """종료 신호: 계속 진행
2-3개의 선택지를 제공하세요.

"""

    prompt += """JSON 형식:
{
  "node_type": "narrative" | "ending_good" | "ending_bad",
  "narrative_text": "2인칭 시점 나레이션 (한국어)",
  "choices": [{"text": "...", "is_dangerous": true/false, "resource_effect": {"trust": 0, "money": 0, "awareness": 0}}],
  "image_prompt": "English image prompt describing the scene, webtoon style, Korean urban setting",
  "reasoning": "이 장면 설계의 근거"
}

IMPORTANT: image_prompt는 필수입니다. 특히 엔딩 노드(ending_good/ending_bad)는 반드시 이미지 프롬프트를 포함하세요."""
    return prompt


def build_educational_prompt(
    node_text: str,
    choice_text: str,
    phishing_type: str
) -> str:
    """교육 콘텐츠 생성용 프롬프트"""
    return f"""피싱 유형: {phishing_type}

상황:
{node_text}

위험한 선택: "{choice_text}"

이 상황과 선택에 대한 교육 콘텐츠를 작성하세요.

JSON 형식:
{{
  "title": "제목 (10자 이내)",
  "explanation": "왜 위험한지 설명 (2-3문장)",
  "warning_signs": ["경고 신호 1", "경고 신호 2"],
  "prevention_tips": ["예방 방법 1", "예방 방법 2"]
}}"""
