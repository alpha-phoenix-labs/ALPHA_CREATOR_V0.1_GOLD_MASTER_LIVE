import type { DashboardAdapter } from "@/adapters/dashboard.adapter";
import { DashboardApiAdapter } from "@/adapters/dashboard.api.adapter";
import { DashboardMockAdapter } from "@/adapters/dashboard.mock.adapter";
import type {
  DashboardState,
  DataScenario,
  DecisionActionResult,
  GenerationActionResult,
  ScanActionResult,
  TimeRange,
} from "@/types/dashboard";

export class DashboardService {
  constructor(private readonly adapter: DashboardAdapter) {}

  async getDashboard(
    timeRange: TimeRange,
    scenario: DataScenario = "live",
  ): Promise<DashboardState> {
    if (scenario === "error") {
      throw new Error("Dashboard error-state preview is active.");
    }

    const dashboard = await this.adapter.getDashboard(timeRange);

    if (scenario === "empty") {
      return {
        ...dashboard,
        selectedContentId: undefined,
        opportunities: [],
        recentContent: [],
        intelligenceByContentId: {},
        nextBestAction: undefined,
      };
    }

    if (scenario === "partial") {
      return {
        ...dashboard,
        systemStatus: {
          state: "partial",
          label: "Partial-data state preview",
          detail: "Core data retained · one presentation section marked unavailable",
        },
        availability: {
          ...dashboard.availability,
          content: "unavailable",
        },
      };
    }

    return dashboard;
  }

  scanRadar(): Promise<ScanActionResult> {
    return this.adapter.scanRadar();
  }

  generateFromOpportunity(storyId: string): Promise<GenerationActionResult> {
    return this.adapter.generateFromOpportunity(storyId);
  }

  decideContent(
    contentId: string,
    decision: "approved" | "rejected",
    reason?: string,
  ): Promise<DecisionActionResult> {
    return this.adapter.decideContent(contentId, decision, reason);
  }
}

function defaultDashboardAdapter(): DashboardAdapter {
  return process.env.NEXT_PUBLIC_ALPHA_DASHBOARD_SOURCE === "mock"
    ? new DashboardMockAdapter()
    : new DashboardApiAdapter();
}

export const dashboardService = new DashboardService(defaultDashboardAdapter());
