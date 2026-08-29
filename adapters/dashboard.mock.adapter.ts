import type { DashboardAdapter } from "@/adapters/dashboard.adapter";
import { createDashboardFixture } from "@/data/dashboard.mock";
import type {
  DashboardState,
  DecisionActionResult,
  GenerationActionResult,
  ScanActionResult,
  TimeRange,
} from "@/types/dashboard";

export class DashboardMockAdapter implements DashboardAdapter {
  async getDashboard(timeRange: TimeRange): Promise<DashboardState> {
    return createDashboardFixture(timeRange);
  }

  async scanRadar(): Promise<ScanActionResult> {
    throw new Error("Mock-only adapter does not execute Core scans.");
  }

  async generateFromOpportunity(): Promise<GenerationActionResult> {
    throw new Error("Mock-only adapter does not execute Core generation.");
  }

  async decideContent(): Promise<DecisionActionResult> {
    throw new Error("Mock-only adapter does not persist review decisions.");
  }
}
