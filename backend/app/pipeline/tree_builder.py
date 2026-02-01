"""시나리오 트리 빌더 (메인 오케스트레이터)"""
import asyncio
from datetime import datetime, timezone
from uuid import uuid4

from app.config import settings
from app.models.scenario import ScenarioTree, ScenarioNode, Choice, Resources
from app.pipeline.node_generator import (
    generate_root_node,
    generate_node,
    result_to_node,
    GenerationContext,
)
from app.pipeline.context_manager import build_story_path
from app.pipeline.end_sequence import compute_end_signal
from app.pipeline.enrichment import enrich_node_with_education
from app.pipeline.validation import validate_structure, ValidationError
from app.pipeline.repair import repair_tree
from app.core.image_generator import generate_image


class ScenarioTreeBuilder:
    """Agentic 시나리오 트리 빌더"""

    def __init__(self):
        self.semaphore = asyncio.Semaphore(settings.semaphore_limit)
        self.node_counter = 0

    def _next_node_id(self) -> str:
        self.node_counter += 1
        return f"node_{self.node_counter:03d}"

    async def build(
        self,
        phishing_type: str,
        difficulty: str = "medium",
        seed_info: str | None = None
    ) -> ScenarioTree:
        """전체 시나리오 트리 생성"""
        self.node_counter = 0

        try:
            async with asyncio.timeout(settings.pipeline_timeout):
                # Phase 1: Seed (루트 노드 생성)
                root = await self._generate_root(phishing_type, difficulty, seed_info)

                tree = ScenarioTree(
                    id=f"scenario_{uuid4().hex[:8]}",
                    title=f"{phishing_type} 시나리오",
                    description=f"{phishing_type}을 체험하는 교육 시나리오입니다.",
                    phishing_type=phishing_type,
                    difficulty=difficulty,
                    root_node_id=root.id,
                    nodes={root.id: root},
                    created_at=datetime.now(timezone.utc),
                )

                # Phase 2: BFS Expand (병렬 확장)
                frontier = [(root, choice) for choice in root.choices]
                while frontier:
                    frontier = await self._expand_level(tree, phishing_type, difficulty, frontier)

                # Phase 3: Enrich (교육 콘텐츠)
                await self._enrich_endings(tree, phishing_type)

                # Phase 4: Image 생성 (주요 노드만)
                await self._generate_images(tree)

                # Phase 5: Validate & Repair
                tree = await self._validate_and_repair(tree)

                return tree

        except asyncio.TimeoutError:
            raise RuntimeError("Pipeline timeout exceeded")

    async def _generate_root(
        self,
        phishing_type: str,
        difficulty: str,
        seed_info: str | None
    ) -> ScenarioNode:
        """루트 노드 생성"""
        result = await generate_root_node(phishing_type, difficulty, seed_info)
        return result_to_node(result, self._next_node_id(), depth=0)

    async def _expand_level(
        self,
        tree: ScenarioTree,
        phishing_type: str,
        difficulty: str,
        frontier: list[tuple[ScenarioNode, Choice]]
    ) -> list[tuple[ScenarioNode, Choice]]:
        """BFS 레벨 확장 (병렬)"""
        tasks = [
            self._expand_single_branch(tree, phishing_type, difficulty, parent, choice)
            for parent, choice in frontier
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        next_frontier = []
        for result in results:
            if isinstance(result, Exception):
                continue
            node, new_choices = result
            next_frontier.extend(new_choices)

        return next_frontier

    async def _expand_single_branch(
        self,
        tree: ScenarioTree,
        phishing_type: str,
        difficulty: str,
        parent: ScenarioNode,
        choice: Choice
    ) -> tuple[ScenarioNode, list[tuple[ScenarioNode, Choice]]]:
        """개별 브랜치 확장"""
        async with self.semaphore:
            # 1. 경로 추적
            path = self._trace_path_to(tree, parent.id)
            path.append((parent, choice))

            # 2. 자원 계산
            resources = self._compute_resources(path)

            # 3. 선택 목록 추출
            path_choices = [c for _, c in path if c is not None]

            # 4. 종료 신호
            depth = parent.depth + 1
            end_signal = compute_end_signal(
                resources, depth, settings.max_depth, path_choices
            )

            # 5. 컨텍스트 압축
            story_path = await build_story_path(path, depth)

            # 6. 노드 생성
            context = GenerationContext(
                phishing_type=phishing_type,
                difficulty=difficulty,
                story_path=story_path,
                choice_taken=choice.text,
                current_resources=resources,
                current_depth=depth,
                max_depth=settings.max_depth,
                should_end=end_signal.should_end,
                force_end=end_signal.force,
                ending_type_hint=end_signal.ending_type,
            )

            result = await generate_node(context)
            node = result_to_node(
                result,
                self._next_node_id(),
                depth=depth,
                parent_node_id=parent.id,
                parent_choice_id=choice.id,
            )

            # 7. 트리에 추가
            tree.nodes[node.id] = node
            choice.next_node_id = node.id

            # 다음 프론티어 반환
            if node.type == "narrative" and node.choices:
                return node, [(node, c) for c in node.choices]
            return node, []

    def _trace_path_to(
        self,
        tree: ScenarioTree,
        node_id: str
    ) -> list[tuple[ScenarioNode, Choice | None]]:
        """루트에서 지정 노드까지 경로 추적"""
        path = []
        current_id = node_id

        while current_id:
            node = tree.nodes.get(current_id)
            if not node:
                break

            # 부모에서 이 노드로 온 선택지 찾기
            chosen_choice = None
            if node.parent_node_id and node.parent_choice_id:
                parent = tree.nodes.get(node.parent_node_id)
                if parent:
                    for c in parent.choices:
                        if c.id == node.parent_choice_id:
                            chosen_choice = c
                            break

            path.append((node, chosen_choice))
            current_id = node.parent_node_id

        path.reverse()
        return path

    def _compute_resources(
        self,
        path: list[tuple[ScenarioNode, Choice | None]]
    ) -> Resources:
        """경로의 자원 변동 계산"""
        resources = Resources()  # 기본값: trust=3, money=3, awareness=1

        for _, choice in path:
            if choice and choice.resource_effect:
                resources.trust = max(0, min(5,
                    resources.trust + choice.resource_effect.trust
                ))
                resources.money = max(0, min(5,
                    resources.money + choice.resource_effect.money
                ))
                resources.awareness = max(0, min(5,
                    resources.awareness + choice.resource_effect.awareness
                ))

        return resources

    async def _enrich_endings(self, tree: ScenarioTree, phishing_type: str):
        """엔딩 노드에 교육 콘텐츠 추가"""
        tasks = []

        for node in tree.nodes.values():
            # 엔딩 노드이거나 위험 선택지가 있는 노드
            if node.type.startswith("ending_") or any(c.is_dangerous for c in node.choices):
                tasks.append(self._enrich_single_node(node, phishing_type))

        await asyncio.gather(*tasks, return_exceptions=True)

    async def _enrich_single_node(self, node: ScenarioNode, phishing_type: str):
        """단일 노드에 교육 콘텐츠 추가"""
        async with self.semaphore:
            # 위험 선택지 텍스트 찾기
            dangerous_choice_text = None
            for choice in node.choices:
                if choice.is_dangerous:
                    dangerous_choice_text = choice.text
                    break

            if dangerous_choice_text or node.type.startswith("ending_"):
                content = await enrich_node_with_education(
                    node.text,
                    dangerous_choice_text or "상황 종료",
                    phishing_type
                )
                if content:
                    node.educational_content = content

    async def _generate_images(self, tree: ScenarioTree):
        """주요 노드(루트, 엔딩)에 이미지 생성"""
        tasks = []

        for node in tree.nodes.values():
            # 루트 노드 또는 엔딩 노드에만 이미지 생성
            if node.image_prompt and not node.image_url:
                if node.depth == 0 or node.type.startswith("ending_"):
                    tasks.append(self._generate_single_image(node, tree.id))

        await asyncio.gather(*tasks, return_exceptions=True)

    async def _generate_single_image(self, node: ScenarioNode, scenario_id: str):
        """단일 노드에 이미지 생성"""
        async with self.semaphore:
            if node.image_prompt:
                url = await generate_image(node.image_prompt, node.id, scenario_id)
                if url:
                    node.image_url = url

    async def _validate_and_repair(self, tree: ScenarioTree) -> ScenarioTree:
        """구조 검증 및 복구"""
        for _ in range(3):  # 최대 3회 복구 시도
            errors = validate_structure(tree)
            if not errors:
                return tree

            tree = repair_tree(tree, errors)

        return tree
