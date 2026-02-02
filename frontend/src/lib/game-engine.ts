import type {
  ScenarioTree,
  ScenarioNode,
  GameSession,
  GameResult,
  Resources,
  EducationalContent,
} from "./types";

/** 자원값을 0-5 범위로 제한 */
function clamp(value: number, min = 0, max = 5): number {
  return Math.max(min, Math.min(max, value));
}

/** 고유 ID 생성 */
function generateId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** 게임 세션 생성 */
export function createSession(tree: ScenarioTree): GameSession {
  return {
    id: generateId(),
    scenarioTree: tree,
    currentNodeId: tree.root_node_id,
    resources: { trust: 3, money: 3, awareness: 1 },
    choiceHistory: [],
    isFinished: false,
    startedAt: new Date().toISOString(),
  };
}

/** 현재 노드 조회 */
export function getCurrentNode(session: GameSession): ScenarioNode {
  return session.scenarioTree.nodes[session.currentNodeId];
}

/** 게임 종료 여부 확인 */
export function isFinished(session: GameSession): boolean {
  const node = getCurrentNode(session);
  return node.type === "ending_good" || node.type === "ending_bad";
}

/** 선택 처리 및 상태 전이 */
export function processChoice(
  session: GameSession,
  choiceId: string
): GameSession {
  const currentNode = getCurrentNode(session);
  const choice = currentNode.choices.find((c) => c.id === choiceId);

  if (!choice) {
    throw new Error(`Choice not found: ${choiceId}`);
  }

  if (!choice.next_node_id) {
    throw new Error(`Choice has no next node: ${choiceId}`);
  }

  // 자원 변동 적용
  const newResources: Resources = {
    trust: clamp(session.resources.trust + choice.resource_effect.trust),
    money: clamp(session.resources.money + choice.resource_effect.money),
    awareness: clamp(
      session.resources.awareness + choice.resource_effect.awareness
    ),
  };

  // 선택 이력 추가
  const newHistory = [
    ...session.choiceHistory,
    {
      nodeId: currentNode.id,
      choiceId: choice.id,
      choiceText: choice.text,
      isDangerous: choice.is_dangerous,
    },
  ];

  // 새 세션 반환
  const newSession: GameSession = {
    ...session,
    currentNodeId: choice.next_node_id,
    resources: newResources,
    choiceHistory: newHistory,
  };

  newSession.isFinished = isFinished(newSession);
  return newSession;
}

/** 게임 결과 생성 */
export function getResult(session: GameSession): GameResult {
  const currentNode = getCurrentNode(session);
  const ending = currentNode.type === "ending_good" ? "good" : "bad";

  // 모든 교육 콘텐츠 수집
  const educationalSummary: EducationalContent[] = [];
  for (const item of session.choiceHistory) {
    const node = session.scenarioTree.nodes[item.nodeId];
    if (node?.educational_content) {
      educationalSummary.push(node.educational_content);
    }
  }
  // 마지막 노드의 교육 콘텐츠 추가
  if (currentNode.educational_content) {
    educationalSummary.push(currentNode.educational_content);
  }

  return {
    ending,
    endingText: currentNode.text,
    endingImageUrl: currentNode.image_url,
    finalResources: session.resources,
    choiceHistory: session.choiceHistory,
    educationalSummary,
  };
}
