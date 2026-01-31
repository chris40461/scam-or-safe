"""종료 신호 판단 모듈"""
from dataclasses import dataclass

from app.models.scenario import Resources, Choice


@dataclass
class EndSignal:
    """종료 신호"""
    should_end: bool
    ending_type: str | None  # "good" | "bad" | None
    reason: str
    force: bool  # True면 LLM 판단 무시


def infer_ending(resources: Resources) -> str:
    """자원 상태 기반 엔딩 추론"""
    good_score = (5 - resources.trust) + resources.awareness
    bad_score = resources.trust + (5 - resources.money)
    return "good" if good_score >= bad_score else "bad"


def compute_end_signal(
    resources: Resources,
    depth: int,
    max_depth: int,
    path_choices: list[Choice]
) -> EndSignal:
    """종료 신호 계산 (우선순위 순)"""

    # Rule 1: 최대 깊이 도달 → 강제 종료
    if depth >= max_depth:
        return EndSignal(
            should_end=True,
            ending_type=infer_ending(resources),
            reason="max_depth",
            force=True
        )

    # Rule 2: money=0 → 강제 BAD (금전 피해)
    if resources.money <= 0:
        return EndSignal(
            should_end=True,
            ending_type="bad",
            reason="money_depleted",
            force=True
        )

    # Rule 3: awareness=5 → 강제 GOOD (피싱 간파)
    if resources.awareness >= 5:
        return EndSignal(
            should_end=True,
            ending_type="good",
            reason="full_awareness",
            force=True
        )

    # Rule 4: trust=0 → 강제 GOOD (사기범 불신)
    if resources.trust <= 0:
        return EndSignal(
            should_end=True,
            ending_type="good",
            reason="zero_trust",
            force=True
        )

    # Rule 5: trust=5 → 강제 BAD (완전 속음)
    if resources.trust >= 5:
        return EndSignal(
            should_end=True,
            ending_type="bad",
            reason="full_trust",
            force=True
        )

    # Rule 6 & 7: 연속 선택 패턴
    if len(path_choices) >= 3:
        recent = path_choices[-3:]

        # Rule 6: 위험 선택 3연속 → BAD 제안
        if all(c.is_dangerous for c in recent):
            return EndSignal(
                should_end=True,
                ending_type="bad",
                reason="3x_dangerous",
                force=False
            )

        # Rule 7: 안전 선택 3연속 → GOOD 제안
        if all(not c.is_dangerous for c in recent):
            return EndSignal(
                should_end=True,
                ending_type="good",
                reason="3x_safe",
                force=False
            )

    # 계속 진행
    return EndSignal(
        should_end=False,
        ending_type=None,
        reason="continue",
        force=False
    )
