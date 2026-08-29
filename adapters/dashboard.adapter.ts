import type {
  DashboardState,
  DecisionActionResult,
  GenerationActionResult,
  ScanActionResult,
  TimeRange,
} from "@/types/dashboard";

export interface DashboardAdapter {
  getDashboard(timeRange: TimeRange): Promise<DashboardState>;
  scanRadar(): Promise<ScanActionResult>;
  generateFromOpportunity(storyId: string): Promise<GenerationActionResult>;
  decideContent(
    contentId: string,
    decision: "approved" | "rejected",
    reason?: string,
  ): Promise<DecisionActionResult>;
}
