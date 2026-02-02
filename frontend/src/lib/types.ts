/** 게임 자원 상태 */
export interface Resources {
  trust: number;
  money: number;
  awareness: number;
}

/** 선택지의 자원 변동값 */
export interface ResourceDelta {
  trust: number;
  money: number;
  awareness: number;
}

/** 교육 콘텐츠 */
export interface EducationalContent {
  title: string;
  explanation: string;
  prevention_tips: string[];
  warning_signs: string[];
}

/** 선택지 */
export interface Choice {
  id: string;
  text: string;
  next_node_id: string | null;
  is_dangerous: boolean;
  resource_effect: ResourceDelta;
}

/** 시나리오 노드 */
export interface ScenarioNode {
  id: string;
  type: "narrative" | "ending_good" | "ending_bad";
  text: string;
  choices: Choice[];
  educational_content: EducationalContent | null;
  image_url: string | null;
  image_prompt: string | null;
  depth: number;
  parent_node_id: string | null;
  parent_choice_id: string | null;
}

/** 시나리오 트리 */
export interface ScenarioTree {
  id: string;
  title: string;
  description: string;
  phishing_type: string;
  difficulty: "easy" | "medium" | "hard";
  root_node_id: string;
  nodes: Record<string, ScenarioNode>;
  created_at: string;
  metadata: Record<string, unknown>;
}

/** 시나리오 목록 아이템 */
export interface ScenarioListItem {
  id: string;
  title: string;
  description: string;
  phishing_type: string;
  difficulty: "easy" | "medium" | "hard";
  created_at: string;
}

/** 선택 이력 */
export interface ChoiceHistoryItem {
  nodeId: string;
  choiceId: string;
  choiceText: string;
  isDangerous: boolean;
}

/** 게임 세션 */
export interface GameSession {
  id: string;
  scenarioTree: ScenarioTree;
  currentNodeId: string;
  resources: Resources;
  choiceHistory: ChoiceHistoryItem[];
  isFinished: boolean;
  startedAt: string;
}

/** 게임 결과 */
export interface GameResult {
  ending: "good" | "bad";
  endingText: string;
  endingImageUrl: string | null;
  finalResources: Resources;
  choiceHistory: ChoiceHistoryItem[];
  educationalSummary: EducationalContent[];
}
