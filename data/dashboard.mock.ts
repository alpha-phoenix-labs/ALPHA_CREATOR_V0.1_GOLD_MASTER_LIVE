import type { DashboardState, TimeRange } from "@/types/dashboard";

/**
 * Explicitly test-only fixture. Production code uses DashboardApiAdapter.
 */
export function createDashboardFixture(timeRange: TimeRange = "7d"): DashboardState {
  return {
    timeRange,
    pipeline: [
      { id: "ideas", label: "Ranked Ideas", count: 0, availability: "real" },
      { id: "generated", label: "Generated", count: 0, availability: "real" },
      { id: "review", label: "Review", count: 0, availability: "real" },
      { id: "approved", label: "Approved", count: 0, availability: "real" },
      { id: "rejected", label: "Rejected", count: 0, availability: "derived" },
      { id: "scheduled", label: "Scheduled", availability: "unavailable" },
      { id: "published", label: "Published", availability: "unavailable" },
    ],
    metrics: [
      { id: "sources", label: "Sources Online", value: "0/0", availability: "real" },
      { id: "stories", label: "Ranked Stories", value: 0, availability: "real" },
      { id: "stories-24h", label: "Stories Last 24h", value: 0, availability: "real" },
      { id: "review", label: "In Review", value: 0, availability: "real" },
      { id: "approved", label: "Approved", value: 0, availability: "real" },
    ],
    opportunities: [],
    recentContent: [],
    intelligenceByContentId: {},
    systemStatus: {
      state: "operational",
      label: "Test fixture operational",
      detail: "Mock-only adapter contract fixture",
    },
    availability: {
      stats: "real",
      stories: "real",
      content: "real",
      instagramAnalytics: "unavailable",
    },
  };
}
