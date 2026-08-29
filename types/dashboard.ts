export type TimeRange = "today" | "7d" | "30d" | "90d" | "custom";

export type DataAvailability = "real" | "derived" | "unavailable";

export type PipelineStageId =
  | "ideas"
  | "generated"
  | "review"
  | "approved"
  | "rejected"
  | "scheduled"
  | "published";

export type PipelineStage = {
  id: PipelineStageId;
  label: string;
  count?: number;
  status?: "normal" | "attention" | "blocked";
  availability: DataAvailability;
  note?: string;
};

export type MetricCardData = {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  deltaDirection?: "up" | "down" | "flat";
  sparkline?: number[];
  availability: DataAvailability;
  note?: string;
};

export type Opportunity = {
  id: string;
  title: string;
  summary: string;
  score: number;
  potential: "low" | "medium" | "high" | "high_potential" | "exceptional";
  category?: string;
  topicMomentum?: number;
  audienceFit?: number;
  visualDemonstrability?: number;
  sourceName: string;
  sourceCount: number;
  sourceUrl: string;
  publishedAt?: string;
  scoringVersion: string;
};

export type AlphaInsight = {
  id: string;
  type: "positive" | "recommendation" | "warning" | "risk" | "opportunity";
  title: string;
  description?: string;
  confidence?: number;
  impact?: "low" | "medium" | "high";
  action?: {
    label: string;
    actionId: string;
  };
  availability: "real" | "derived";
};

export type ViralPrediction = {
  score: number;
  level:
    | "weak"
    | "low"
    | "moderate"
    | "strong"
    | "high_potential"
    | "exceptional";
  hookStrength: number;
  retention?: number;
  sharePotential: number;
  savePotential: number;
  followConversion: number;
  novelty: number;
  confidence?: number;
  generatedAt?: string;
  basis: string;
  disclaimer: string;
};

export type ContentPerformance = {
  id: string;
  title: string;
  thumbnailTone?: "cyan" | "violet" | "blue" | "green" | "amber";
  type: "reel" | "carousel" | "image" | "story";
  platform: "instagram";
  pipelineStageId: PipelineStageId;
  viralScore?: number;
  views?: number;
  saves?: number;
  shares?: number;
  follows?: number;
  publishedAt?: string;
  updatedAt: string;
  validationStatus: string;
  analyticsAvailability: "unavailable";
};

export type ContentPreview = {
  contentId: string;
  eyebrow: string;
  headline: string;
  subline: string;
  format: "reel" | "carousel" | "image";
  frame: string;
  renderStatus: "structured-preview";
};

export type ContentDetails = {
  caption: string;
  cta: string;
  reelScript: string;
  validationStatus: string;
  sourceBasis: string[];
  generationProvider?: string;
  generationWarning?: string;
};

export type ContentIntelligence = {
  preview: ContentPreview;
  prediction: ViralPrediction;
  insights: AlphaInsight[];
  details: ContentDetails;
  contentStatus: "review" | "approved" | "rejected";
};

export type NextBestAction = {
  id: string;
  type:
    | "schedule"
    | "optimize"
    | "publish"
    | "generate_variant"
    | "create_followup"
    | "repurpose"
    | "review"
    | "test_hook";
  title: string;
  reason?: string;
  actionLabel: string;
  secondaryActionLabel?: string;
  targetId?: string;
  availability: "real" | "unavailable";
};

export type SystemStatus = {
  state: "operational" | "syncing" | "partial" | "disconnected" | "error";
  label: string;
  detail: string;
};

export type DashboardAvailability = {
  stats: DataAvailability;
  stories: DataAvailability;
  content: DataAvailability;
  instagramAnalytics: "unavailable";
};

export type DashboardState = {
  timeRange: TimeRange;
  selectedContentId?: string;
  pipeline: PipelineStage[];
  metrics: MetricCardData[];
  opportunities: Opportunity[];
  recentContent: ContentPerformance[];
  intelligenceByContentId: Record<string, ContentIntelligence>;
  nextBestAction?: NextBestAction;
  systemStatus: SystemStatus;
  availability: DashboardAvailability;
};

export type ScanActionResult = {
  scanId: string;
  sourcesSucceeded: number;
  sourcesTotal: number;
  rawItems: number;
  uniqueClusters: number;
  newStories: number;
  updatedStories: number;
};

export type GenerationActionResult = {
  contentId: string;
  status: "review";
  warning?: string;
};

export type DecisionActionResult = {
  contentId: string;
  status: "approved" | "rejected";
};

export type DataScenario = "live" | "loading" | "empty" | "partial" | "error";
