import type { DashboardAdapter } from "@/adapters/dashboard.adapter";
import type { ContentItem, DashboardStats, ScanResult, Story } from "@/lib/alpha-api";
import type {
  AlphaInsight,
  ContentIntelligence,
  ContentPerformance,
  DashboardState,
  DataAvailability,
  DecisionActionResult,
  GenerationActionResult,
  MetricCardData,
  NextBestAction,
  Opportunity,
  PipelineStage,
  ScanActionResult,
  SystemStatus,
  TimeRange,
  ViralPrediction,
} from "@/types/dashboard";

type DashboardCoreResponses = {
  stats?: DashboardStats;
  stories?: Story[];
  content?: ContentItem[];
  timeRange: TimeRange;
  failedRequests: number;
};

function settledValue<T>(result: PromiseSettledResult<T>): T | undefined {
  return result.status === "fulfilled" ? result.value : undefined;
}

function scoreLevel(score: number): ViralPrediction["level"] {
  if (score >= 95) return "exceptional";
  if (score >= 85) return "high_potential";
  if (score >= 75) return "strong";
  if (score >= 60) return "moderate";
  if (score >= 40) return "low";
  return "weak";
}

function opportunityPotential(score: number): Opportunity["potential"] {
  if (score >= 90) return "exceptional";
  if (score >= 80) return "high_potential";
  if (score >= 70) return "high";
  if (score >= 55) return "medium";
  return "low";
}

function contentFormat(contentType: string): ContentPerformance["type"] {
  const normalized = contentType.toLowerCase();
  if (normalized.includes("carousel")) return "carousel";
  if (normalized.includes("image")) return "image";
  if (normalized.includes("story")) return "story";
  return "reel";
}

function previewFormat(contentType: string): ContentIntelligence["preview"]["format"] {
  const format = contentFormat(contentType);
  return format === "story" ? "image" : format;
}

export function mapStoryToOpportunity(story: Story): Opportunity {
  const summary = story.summary.trim()
    || `${story.source_count} ranked source signal${story.source_count === 1 ? "" : "s"} from ${story.source_name}.`;
  return {
    id: story.id,
    title: story.title,
    summary,
    score: story.score.total_score,
    potential: opportunityPotential(story.score.total_score),
    category: story.tags[0] ?? story.source_type,
    topicMomentum: story.score.topic_momentum,
    audienceFit: story.score.audience_fit,
    visualDemonstrability: story.score.visual_demonstrability,
    sourceName: story.source_name,
    sourceCount: story.source_count,
    sourceUrl: story.url,
    publishedAt: story.published_at ?? undefined,
    scoringVersion: story.score.scoring_version,
  };
}

export function mapContentToPerformance(
  content: ContentItem,
  index: number,
): ContentPerformance {
  const tones: NonNullable<ContentPerformance["thumbnailTone"]>[] = [
    "cyan",
    "violet",
    "blue",
    "green",
    "amber",
  ];
  return {
    id: content.id,
    title: content.payload.thumbnail_text || content.hook,
    thumbnailTone: tones[index % tones.length],
    type: contentFormat(content.content_type),
    platform: "instagram",
    pipelineStageId: content.status,
    viralScore: content.pre_publish_viral_score,
    updatedAt: content.updated_at,
    validationStatus: content.validation_status,
    analyticsAvailability: "unavailable",
  };
}

export function mapContentToIntelligence(content: ContentItem): ContentIntelligence {
  const payload = content.payload;
  const scores = payload.scores;
  const insights: AlphaInsight[] = [
    {
      id: `${content.id}-why`,
      type: "positive",
      title: "Why this concept could work",
      description: payload.why_it_could_work,
      impact: "high",
      availability: "derived",
    },
    {
      id: `${content.id}-test`,
      type: "recommendation",
      title: "What the content tests",
      description: payload.what_is_being_tested,
      impact: "medium",
      availability: "derived",
    },
    {
      id: `${content.id}-claims`,
      type: payload.claim_check.claims_to_verify.length ? "warning" : "positive",
      title: payload.claim_check.claims_to_verify.length
        ? "Claims still require human verification"
        : "Claim guard complete",
      description: payload.claim_check.notes,
      impact: payload.claim_check.claims_to_verify.length ? "high" : "medium",
      availability: "real",
    },
  ];

  if (content.generation?.warning) {
    insights.unshift({
      id: `${content.id}-generation`,
      type: "warning",
      title: "Generation mode notice",
      description: content.generation.warning,
      impact: "medium",
      availability: "real",
    });
  }

  const sceneCount = payload.scene_plan.length;
  return {
    preview: {
      contentId: content.id,
      eyebrow: payload.content_pillar.toUpperCase(),
      headline: payload.first_frame,
      subline: payload.hook,
      format: previewFormat(content.content_type),
      frame: sceneCount ? `01 / ${String(sceneCount).padStart(2, "0")}` : "STRUCTURED DRAFT",
      renderStatus: "structured-preview",
    },
    prediction: {
      score: content.pre_publish_viral_score,
      level: scoreLevel(content.pre_publish_viral_score),
      hookStrength: scores.hook_strength,
      sharePotential: scores.share_potential,
      savePotential: scores.save_potential,
      followConversion: scores.follow_conversion,
      novelty: scores.novelty,
      generatedAt: content.generation?.created_at,
      basis: "Core heuristic content score",
      disclaimer: "Pre-publish heuristic, not a probability or reach guarantee.",
    },
    insights,
    details: {
      caption: content.caption,
      cta: payload.cta,
      reelScript: payload.reel_script,
      validationStatus: content.validation_status,
      sourceBasis: payload.claim_check.source_basis,
      generationProvider: content.generation?.provider,
      generationWarning: content.generation?.warning ?? undefined,
    },
    contentStatus: content.status,
  };
}

function unavailableMetric(id: string, label: string, note: string): MetricCardData {
  return { id, label, value: "-", availability: "unavailable", note };
}

function mapMetrics(stats?: DashboardStats): MetricCardData[] {
  if (!stats) {
    return [
      unavailableMetric("sources", "Sources Online", "Core stats unavailable"),
      unavailableMetric("stories", "Ranked Stories", "Core stats unavailable"),
      unavailableMetric("stories-24h", "Stories Last 24h", "Core stats unavailable"),
      unavailableMetric("review", "In Review", "Core stats unavailable"),
      unavailableMetric("approved", "Approved", "Core stats unavailable"),
    ];
  }
  return [
    {
      id: "sources",
      label: "Sources Online",
      value: `${stats.sources_online}/${stats.sources_configured}`,
      availability: "real",
      note: "Latest persisted collector health",
    },
    {
      id: "stories",
      label: "Ranked Stories",
      value: stats.stories_total,
      availability: "real",
      note: "All-time Core total",
    },
    {
      id: "stories-24h",
      label: "Stories Last 24h",
      value: stats.stories_last_24h,
      availability: "real",
      note: "Core 24-hour window",
    },
    {
      id: "review",
      label: "In Review",
      value: stats.content_in_review,
      availability: "real",
      note: "Persisted content status",
    },
    {
      id: "approved",
      label: "Approved",
      value: stats.content_approved,
      availability: "real",
      note: "Persisted content status",
    },
  ];
}

function countStatus(content: ContentItem[] | undefined, status: ContentItem["status"]): number | undefined {
  return content?.filter((item) => item.status === status).length;
}

function stageAvailability(value: unknown, preferred: DataAvailability): DataAvailability {
  return value === undefined ? "unavailable" : preferred;
}

function mapPipeline(
  stats: DashboardStats | undefined,
  stories: Story[] | undefined,
  content: ContentItem[] | undefined,
): PipelineStage[] {
  const review = stats?.content_in_review ?? countStatus(content, "review");
  const approved = stats?.content_approved ?? countStatus(content, "approved");
  const reviewSource: DataAvailability = stats ? "real" : "derived";
  const approvedSource: DataAvailability = stats ? "real" : "derived";
  return [
    {
      id: "ideas",
      label: "Ranked Ideas",
      count: stories?.length,
      availability: stageAvailability(stories, "real"),
      note: "Top-ranked stories currently loaded",
    },
    {
      id: "generated",
      label: "Generated",
      count: content?.length,
      availability: stageAvailability(content, "real"),
      note: "Latest persisted content loaded from Core",
    },
    {
      id: "review",
      label: "Review",
      count: review,
      status: review ? "attention" : "normal",
      availability: stageAvailability(review, reviewSource),
      note: stats ? "Core dashboard total" : "Derived from loaded content",
    },
    {
      id: "approved",
      label: "Approved",
      count: approved,
      availability: stageAvailability(approved, approvedSource),
      note: stats ? "Core dashboard total" : "Derived from loaded content",
    },
    {
      id: "rejected",
      label: "Rejected",
      count: countStatus(content, "rejected"),
      availability: stageAvailability(content, "derived"),
      note: "Derived from the latest loaded content",
    },
    {
      id: "scheduled",
      label: "Scheduled",
      availability: "unavailable",
      note: "Scheduling is outside V0.1",
    },
    {
      id: "published",
      label: "Published",
      availability: "unavailable",
      note: "Publishing and Instagram data are outside V0.1",
    },
  ];
}

function mapSystemStatus(
  stats: DashboardStats | undefined,
  failedRequests: number,
): SystemStatus {
  if (failedRequests > 0) {
    return {
      state: "partial",
      label: "Core data partially available",
      detail: `${failedRequests} dashboard request${failedRequests === 1 ? "" : "s"} unavailable · Instagram analytics unavailable`,
    };
  }
  if (stats && stats.sources_online < stats.sources_configured) {
    return {
      state: "partial",
      label: "Core connected · source coverage partial",
      detail: `${stats.sources_online}/${stats.sources_configured} sources online · ${stats.generation_mode} generation`,
    };
  }
  return {
    state: "operational",
    label: "Core workflow operational",
    detail: `${stats?.generation_mode ?? "Core"} generation · Instagram analytics unavailable in V0.1`,
  };
}

function nextActionFor(content?: ContentItem): NextBestAction | undefined {
  if (!content || content.status !== "review") return undefined;
  return {
    id: `review-${content.id}`,
    type: "review",
    title: "Complete the human review",
    reason: "The generated package is stored in review and requires an explicit approve or reject decision.",
    actionLabel: "Approve content",
    secondaryActionLabel: "Reject content",
    targetId: content.id,
    availability: "real",
  };
}

export function mapDashboardResponses({
  stats,
  stories,
  content,
  timeRange,
  failedRequests,
}: DashboardCoreResponses): DashboardState {
  const opportunities = stories?.map(mapStoryToOpportunity) ?? [];
  const recentContent = content?.map(mapContentToPerformance) ?? [];
  const intelligenceByContentId = Object.fromEntries(
    (content ?? []).map((item) => [item.id, mapContentToIntelligence(item)]),
  );
  const selectedContent = content?.[0];
  return {
    timeRange,
    selectedContentId: selectedContent?.id,
    pipeline: mapPipeline(stats, stories, content),
    metrics: mapMetrics(stats),
    opportunities,
    recentContent,
    intelligenceByContentId,
    nextBestAction: nextActionFor(selectedContent),
    systemStatus: mapSystemStatus(stats, failedRequests),
    availability: {
      stats: stats ? "real" : "unavailable",
      stories: stories ? "real" : "unavailable",
      content: content ? "real" : "unavailable",
      instagramAnalytics: "unavailable",
    },
  };
}

export class DashboardApiAdapter implements DashboardAdapter {
  constructor(private readonly baseUrl = "/api/v1") {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
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
      throw new Error(payload?.detail || `Core request failed (${response.status}).`);
    }
    return (await response.json()) as T;
  }

  async getDashboard(timeRange: TimeRange): Promise<DashboardState> {
    const [statsResult, storiesResult, contentResult] = await Promise.allSettled([
      this.request<DashboardStats>("/dashboard/stats"),
      this.request<Story[]>("/stories?limit=10"),
      this.request<ContentItem[]>("/content?limit=100"),
    ]);
    const failedRequests = [statsResult, storiesResult, contentResult]
      .filter((result) => result.status === "rejected").length;
    if (failedRequests === 3) {
      throw new Error("ALPHA Core is unavailable. Start the local FastAPI service and retry.");
    }
    return mapDashboardResponses({
      stats: settledValue(statsResult),
      stories: settledValue(storiesResult),
      content: settledValue(contentResult),
      timeRange,
      failedRequests,
    });
  }

  async scanRadar(): Promise<ScanActionResult> {
    const result = await this.request<ScanResult>("/radar/scan", { method: "POST" });
    return {
      scanId: result.scan_id,
      sourcesSucceeded: result.sources_succeeded,
      sourcesTotal: result.sources_total,
      rawItems: result.raw_items,
      uniqueClusters: result.unique_clusters,
      newStories: result.new_stories,
      updatedStories: result.updated_stories,
    };
  }

  async generateFromOpportunity(storyId: string): Promise<GenerationActionResult> {
    const content = await this.request<ContentItem>(
      `/stories/${encodeURIComponent(storyId)}/generate`,
      { method: "POST" },
    );
    if (content.status !== "review") {
      throw new Error("Core generation did not return the expected review state.");
    }
    return {
      contentId: content.id,
      status: "review",
      warning: content.generation?.warning ?? undefined,
    };
  }

  async decideContent(
    contentId: string,
    decision: "approved" | "rejected",
    reason?: string,
  ): Promise<DecisionActionResult> {
    const content = await this.request<ContentItem>(
      `/content/${encodeURIComponent(contentId)}/decision`,
      {
        method: "POST",
        body: JSON.stringify({ decision, reason: reason || null }),
      },
    );
    if (content.status !== decision) {
      throw new Error("Core decision response did not match the requested state.");
    }
    return { contentId: content.id, status: content.status };
  }
}
