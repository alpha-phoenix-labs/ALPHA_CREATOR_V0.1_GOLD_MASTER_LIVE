export type StoryScore = {
  novelty: number;
  viral_potential: number;
  wow_factor: number;
  practical_utility: number;
  topic_momentum: number;
  visual_demonstrability: number;
  audience_fit: number;
  originality: number;
  share_potential: number;
  save_potential: number;
  alpha_relevance: number;
  total_score: number;
  scoring_version: string;
  rationale: Record<string, unknown>;
};

export type Story = {
  id: string;
  title: string;
  summary: string;
  source_name: string;
  source_type: string;
  url: string;
  published_at: string | null;
  fetched_at: string;
  author: string | null;
  tags: string[];
  entities: string[];
  sources: { key: string; name: string; url: string }[];
  source_count: number;
  status: string;
  score: StoryScore;
};

export type CollectorStatus = {
  source: string;
  status: "online" | "offline";
  item_count: number;
  duration_ms: number;
  error_code: string | null;
};

export type ScanResult = {
  scan_id: string;
  scanned_at: string;
  sources_total: number;
  sources_succeeded: number;
  sources_failed: number;
  raw_items: number;
  unique_clusters: number;
  new_stories: number;
  updated_stories: number;
  collector_statuses: CollectorStatus[];
  stories: Story[];
};

export type ReelScene = {
  scene: number;
  duration_seconds: number;
  visual: string;
  voiceover: string;
  on_screen_text: string;
};

export type ContentScores = {
  hook_strength: number;
  wow_factor: number;
  utility: number;
  share_potential: number;
  save_potential: number;
  visual_demonstrability: number;
  novelty: number;
  audience_fit: number;
  comment_potential: number;
  follow_conversion: number;
};

export type ContentPayload = {
  content_type: string;
  content_pillar: string;
  target_audience: string;
  content_goal: string;
  hook_family: string;
  primary_viral_trigger: string;
  hook: string;
  first_frame: string;
  core_idea: string;
  reel_script: string;
  scene_plan: ReelScene[];
  on_screen_text: string[];
  demo_proof: string;
  technology_tool: string;
  validation_status: string;
  reel_template: string;
  caption: string;
  cta: string;
  hashtags: string[];
  thumbnail_text: string;
  scores: ContentScores;
  pre_publish_viral_score: number;
  why_it_could_work: string;
  what_is_being_tested: string;
  primary_success_signal: string;
  claim_check: {
    source_basis: string[];
    claims_to_verify: string[];
    prohibited_claims_removed: boolean;
    notes: string;
  };
};

export type ContentItem = {
  id: string;
  story_id: string;
  generation_id: string;
  status: "review" | "approved" | "rejected";
  content_type: string;
  content_pillar: string;
  hook: string;
  caption: string;
  validation_status: string;
  pre_publish_viral_score: number;
  payload: ContentPayload;
  created_at: string;
  updated_at: string;
  generation: {
    id: string;
    provider: string;
    model: string;
    warning: string | null;
    created_at: string;
  } | null;
  latest_decision: {
    decision: string;
    reason: string | null;
    decided_at: string;
  } | null;
};

export type DashboardStats = {
  sources_configured: number;
  sources_online: number;
  stories_total: number;
  stories_last_24h: number;
  content_in_review: number;
  content_approved: number;
  generation_mode: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new ApiError(payload?.detail || "The request could not be completed.", response.status);
  }
  return (await response.json()) as T;
}

