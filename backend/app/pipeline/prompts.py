"""LLM 프롬프트 템플릿"""

# 이미지 프롬프트 가이드라인
IMAGE_PROMPT_GUIDE = """
image_prompt 작성 규칙 (매우 중요):
- 반드시 영문으로 작성
- 스타일을 프롬프트 앞과 끝에 모두 명시 (중요!)
  * 형식: "Korean webtoon style illustration: [장면 묘사]. Webtoon art style."
- 구체적인 장면, 인물, 감정, 환경을 묘사
- 다양한 시각적 요소를 포함:
  * 장소: 거실, 사무실, 지하철, 카페, 은행, 경찰서, 병원 대기실 등
  * 시간대: 밤, 새벽, 점심시간, 퇴근길 등
  * 날씨/분위기: 비 오는 날, 어두운 골목, 밝은 오피스 등
  * 인물 특징: 나이대, 복장, 표정, 자세 등
  * 기기/소품: 스마트폰, 노트북, ATM, 서류, 현금 등
- 감정과 분위기를 구체적으로:
  * 긴장: worried expression, sweating, biting nails
  * 혼란: confused look, furrowed brow
  * 공포: wide eyes, pale face, trembling hands
  * 안도: relieved expression, deep breath, relaxed shoulders
  * 후회: head in hands, tears, looking down
- 한국적 요소 포함: Korean text on signs, Korean apartment, Korean cafe
- 매 장면마다 다른 구도와 시점 사용
"""

ROOT_SYSTEM_PROMPT = f"""당신은 피싱 예방 교육을 위한 텍스트 어드벤처 게임 시나리오 작가입니다.
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
- 선택지 텍스트는 1-2문장으로 간결하게
{IMAGE_PROMPT_GUIDE}"""

NODE_SYSTEM_PROMPT = f"""당신은 피싱 시나리오의 다음 장면을 생성합니다.
이전 이야기 맥락과 플레이어의 선택을 바탕으로 자연스러운 다음 장면을 작성합니다.
반드시 JSON 형식으로만 응답하세요.

서사 일관성 규칙 (매우 중요):
- 이전 이야기의 등장인물, 상황, 수법을 그대로 이어가세요
- 갑작스러운 주제 전환이나 새로운 사기 수법 등장은 금지합니다
- 플레이어의 선택에 대한 직접적인 결과/반응으로 다음 장면을 시작하세요
- 사기범의 말투, 태도, 전략이 이전 장면과 일관되어야 합니다
- 선택의 결과가 논리적으로 자연스러워야 합니다 (예: 의심하는 선택 → 사기범이 더 교묘하게 설득 시도)

종료 신호 처리:
- should_end=true이고 force=true: 반드시 엔딩(ending_good 또는 ending_bad)으로 작성, choices는 빈 리스트
- should_end=true이고 force=false: 엔딩을 권장하지만, 내러티브상 자연스럽지 않으면 계속 가능
- should_end=false: narrative 타입으로 계속 진행

엔딩 작성 규칙:
- ending_good: 피싱을 간파하고 피해를 예방한 결말. 어떻게 위기를 벗어났는지 구체적으로 서술하세요.
- ending_bad: 피싱에 당해 금전적/개인정보 피해를 입은 결말. 어떤 피해가 발생했는지 구체적으로 서술하세요.
- 엔딩 텍스트는 4-6문장으로, 상황의 결과와 교훈을 포함하세요.
- 엔딩은 이전 이야기의 자연스러운 결말이어야 합니다.
{IMAGE_PROMPT_GUIDE}"""

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
        prompt += f"""시나리오 상세 설정:
{seed_info}

"""

    prompt += """JSON 형식:
{
  "protagonist": {
    "age_group": "young adult|middle-aged|elderly",
    "gender": "man|woman",
    "description": "영문 한 줄 설명",
    "appearance": "외모 디테일 영문"
  },
  "node_type": "narrative",
  "narrative_text": "2인칭 시점 나레이션 (한국어, 3-5문장)",
  "choices": [
    {
      "text": "선택지 텍스트",
      "is_dangerous": true/false,
      "resource_effect": {"trust": 0, "money": 0, "awareness": 0}
    }
  ],
  "image_prompt": "상세한 영문 이미지 프롬프트 (주인공 설명 포함)",
  "reasoning": "이 장면 설계의 근거"
}

protagonist 생성 지침:
- 피싱 유형과 상황에 맞는 주인공을 자유롭게 생성하세요.
- 나이대, 성별, 외모, 복장 등을 시나리오에 맞게 다양하게 설정하세요.
- 생성한 주인공은 모든 이미지에서 일관되게 유지됩니다.

protagonist 예시 (참고용):
- 중년 여성: {"age_group": "middle-aged", "gender": "woman", "description": "A middle-aged Korean woman in her 50s", "appearance": "short black hair, wearing casual home clothes, glasses"}
- 청년 남성: {"age_group": "young adult", "gender": "man", "description": "A young Korean man in his late 20s", "appearance": "neat short hair, wearing office suit, clean-shaven"}
- 노년 남성: {"age_group": "elderly", "gender": "man", "description": "An elderly Korean man in his 60s", "appearance": "gray hair, wearing comfortable sweater, reading glasses hanging from neck"}
- 청년 여성: {"age_group": "young adult", "gender": "woman", "description": "A young Korean woman in her 20s", "appearance": "long straight hair, casual stylish clothes, carrying a bag"}

image_prompt 작성 시:
- 스타일을 프롬프트 앞과 끝에 모두 명시 (스타일 일관성을 위해 매우 중요!)
- 예시 형식: "Korean webtoon style illustration: [주인공 description], [주인공 appearance], [장면 묘사]. Webtoon art style."
- 주인공의 description과 appearance를 정확히 포함
- 장면, 감정, 배경을 구체적으로 묘사

IMPORTANT:
1. 주인공은 시나리오에 맞게 자유롭게 생성하되, 한 번 생성한 후 모든 노드에서 동일하게 유지
2. image_prompt에 주인공의 description과 appearance를 반드시 포함
3. image_prompt는 반드시 "Korean webtoon style illustration:" 로 시작해야 함"""
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
    ending_type_hint: str | None,
    protagonist = None
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
이전 이야기의 흐름을 자연스럽게 마무리하는 엔딩을 작성하세요.

"""
        else:
            prompt += f"""종료 신호: 엔딩 권장 (선택적)
권장 엔딩 유형: {ending_type_hint}
내러티브상 자연스러우면 엔딩으로, 아니면 계속 진행 가능합니다.

"""
    else:
        prompt += """종료 신호: 계속 진행
2-3개의 선택지를 제공하세요.

중요: 이전 이야기에서 이어지는 자연스러운 다음 장면을 작성하세요.
플레이어의 선택에 대한 직접적인 결과로 시작하세요.

"""

    # 주인공 정보 추가
    if protagonist:
        prompt += f"""
주인공 정보 (모든 이미지에 일관되게 포함):
- 나이대: {protagonist.age_group}
- 성별: {protagonist.gender}
- 설명: {protagonist.description}
- 외모: {protagonist.appearance}

"""

    prompt += """JSON 형식:
{
  "node_type": "narrative" | "ending_good" | "ending_bad",
  "narrative_text": "2인칭 시점 나레이션 (한국어)",
  "choices": [{"text": "...", "is_dangerous": true/false, "resource_effect": {"trust": 0, "money": 0, "awareness": 0}}],
  "image_prompt": "상세한 영문 이미지 프롬프트",
  "reasoning": "이 장면 설계의 근거"
}
"""

    if protagonist:
        prompt += f"""
CRITICAL: image_prompt 작성 시 주인공을 반드시 포함하세요:
- 반드시 \"Korean webtoon style illustration:\" 로 시작
- 주인공: {protagonist.description}, {protagonist.appearance}
- 주인공의 외모와 특징을 정확히 유지하면서 다른 장면, 배경, 감정을 묘사
- 프롬프트 끝에도 스타일 명시: \"Webtoon art style.\"

image_prompt 예시 (주인공 정보 포함):
- "Korean webtoon style illustration: {protagonist.description}, {protagonist.appearance}, sitting in a modern Korean cafe, staring at phone screen with confused expression, coffee cup on table, afternoon sunlight through window. Webtoon art style."
- "Korean webtoon style illustration: {protagonist.description}, {protagonist.appearance}, standing at ATM machine in convenience store at night, sweating nervously, harsh fluorescent lighting, tense atmosphere. Webtoon art style."
- "Korean webtoon style illustration: {protagonist.description}, {protagonist.appearance}, in a living room at home, holding smartphone, worried expression, family photos on wall, warm lamp light. Webtoon art style."
"""
    else:
        prompt += """
image_prompt 예시 (이전 장면과 다르게 작성):
- narrative: "A stressed Korean person hunched over a laptop in a dimly lit home office at midnight, multiple browser tabs open, empty coffee cups on desk, worried expression, blue screen light illuminating face, webtoon style"
- ending_good: "A relieved Korean person sitting at a police station, officer in uniform taking notes, bright fluorescent lights, certificates on wall, showing phone screen as evidence, hopeful expression, Korean text visible on documents, manhwa style illustration"
- ending_bad: "A devastated Korean person sitting alone on a park bench at dusk, head in hands, crumpled bank statement on the ground, autumn leaves falling, empty wallet visible, tears on cheeks, melancholic atmosphere, webtoon style"
"""

    prompt += "\nIMPORTANT: image_prompt는 필수. 이전 노드와 중복되지 않는 새로운 장면을 묘사하세요."
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
