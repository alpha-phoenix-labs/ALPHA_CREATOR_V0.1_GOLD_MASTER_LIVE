"use client";

import { useEffect, useMemo, useState } from "react";
import { Compass, FileStack, Gauge, MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { AlphaCard, AlphaCardSkeleton, ErrorState, StatusBadge } from "@/components/alpha/alpha-ui";
import { CreateContentDialog } from "@/components/alpha/create-dialog";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { ContentPipeline } from "@/components/dashboard/content-pipeline";
import { IntelligencePanel, LivePreviewCard } from "@/components/dashboard/intelligence-panel";
import { MetricGrid } from "@/components/dashboard/metric-grid";
import { Opportunities } from "@/components/dashboard/opportunities";
import { PlaceholderScreen } from "@/components/dashboard/placeholder-screen";
import { RecentContent } from "@/components/dashboard/recent-content";
import { SystemStatusBar } from "@/components/dashboard/system-status-bar";
import { TopBar } from "@/components/dashboard/top-bar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { dashboardService } from "@/services/dashboard.service";
import type {
  AlphaInsight,
  ContentIntelligence,
  ContentPerformance,
  DashboardState,
  DataScenario,
  NextBestAction,
  Opportunity,
  PipelineStageId,
  TimeRange,
} from "@/types/dashboard";

const knownRoutes = new Set([
  "dashboard",
  "discover",
  "create",
  "content",
  "experiments",
  "analytics",
  "intelligence",
  "settings",
]);

const fallbackStatus: DashboardState["systemStatus"] = {
  state: "syncing",
  label: "Loading workspace",
  detail: "Preparing frontend intelligence state",
};

export function AlphaCreatorApp({ initialRoute = "dashboard" }: { initialRoute?: string }) {
  const route = knownRoutes.has(initialRoute) ? initialRoute : "dashboard";
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [scenario, setScenario] = useState<DataScenario>("live");
  const [dashboard, setDashboard] = useState<DashboardState>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [activeStage, setActiveStage] = useState<PipelineStageId>();
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity>();
  const [createOpen, setCreateOpen] = useState(false);
  const [seedOpportunityId, setSeedOpportunityId] = useState<string>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [intelligenceOpen, setIntelligenceOpen] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [scanning, setScanning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [decisionPending, setDecisionPending] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    if (scenario === "loading") return () => { active = false; };

    async function load() {
      try {
        const nextDashboard = await dashboardService.getDashboard(timeRange, scenario);
        if (active) {
          setDashboard(nextDashboard);
          setError(undefined);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Dashboard data unavailable.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [reloadToken, scenario, timeRange]);

  const selectedIntelligence = useMemo(() => {
    if (!dashboard?.selectedContentId) return undefined;
    return dashboard.intelligenceByContentId[dashboard.selectedContentId];
  }, [dashboard]);

  const selectedNextBestAction = useMemo<NextBestAction | undefined>(() => {
    if (!dashboard?.selectedContentId) return undefined;
    const selected = dashboard.recentContent.find((item) => item.id === dashboard.selectedContentId);
    if (!selected || selected.pipelineStageId !== "review") return undefined;
    return {
      id: `review-${selected.id}`,
      type: "review",
      title: "Complete the human review",
      reason: "The generated package is stored in review and requires an explicit approve or reject decision.",
      actionLabel: "Approve content",
      secondaryActionLabel: "Reject content",
      targetId: selected.id,
      availability: "real",
    };
  }, [dashboard]);

  function openCreate(opportunityId?: string) {
    setSeedOpportunityId(opportunityId);
    setCreateOpen(true);
    setSelectedOpportunity(undefined);
  }

  function selectContent(contentId: string) {
    setDashboard((current) => {
      if (!current) return current;
      const intelligence = current.intelligenceByContentId[contentId];
      const nextBestAction: NextBestAction | undefined = intelligence?.contentStatus === "review"
        ? {
            id: `review-${contentId}`,
            type: "review",
            title: "Complete the human review",
            reason: "The generated package is stored in review and requires an explicit approve or reject decision.",
            actionLabel: "Approve content",
            secondaryActionLabel: "Reject content",
            targetId: contentId,
            availability: "real",
          }
        : undefined;
      return { ...current, selectedContentId: contentId, nextBestAction };
    });
    toast.info("Intelligence context updated", {
      description: "Preview, prediction and insights now reflect the selected content.",
    });
  }

  async function handleContentAction(action: string, content: ContentPerformance) {
    if (action === "Open") {
      selectContent(content.id);
      setPreviewOpen(true);
      return;
    }
    if (action === "Approve" || action === "Reject") {
      await handleDecision(content.id, action === "Approve" ? "approved" : "rejected");
    }
  }

  function applyInsight(insight: AlphaInsight) {
    toast.info("Insight actions are unavailable in V0.1.", { description: insight.title });
  }

  function handlePrimaryAction(action: NextBestAction) {
    toast.info("This action is unavailable in V0.1.", {
      description: action.reason ?? action.title,
    });
  }

  async function handleScan() {
    setScanning(true);
    setSaveState("saving");
    toast.loading("Scanning real RSS sources", { id: "alpha-core-action" });
    try {
      const result = await dashboardService.scanRadar();
      toast.success("RSS scan completed", {
        id: "alpha-core-action",
        description: `${result.sourcesSucceeded}/${result.sourcesTotal} sources · ${result.rawItems} items · ${result.uniqueClusters} clusters`,
      });
      setSaveState("saved");
      setLoading(true);
      setReloadToken((token) => token + 1);
    } catch (scanError) {
      setSaveState("error");
      toast.error("RSS scan failed", {
        id: "alpha-core-action",
        description: scanError instanceof Error ? scanError.message : "Core scan unavailable.",
      });
    } finally {
      setScanning(false);
    }
  }

  async function handleGenerate(opportunity: Opportunity) {
    setGenerating(true);
    setSaveState("saving");
    toast.loading("Generating a source-grounded package", { id: "alpha-core-action" });
    try {
      const result = await dashboardService.generateFromOpportunity(opportunity.id);
      setCreateOpen(false);
      toast.success("Content package stored in review", {
        id: "alpha-core-action",
        description: result.warning ?? opportunity.title,
      });
      setSaveState("saved");
      setLoading(true);
      setReloadToken((token) => token + 1);
    } catch (generationError) {
      setSaveState("error");
      toast.error("Generation failed", {
        id: "alpha-core-action",
        description: generationError instanceof Error ? generationError.message : "Core generation unavailable.",
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handleDecision(contentId: string, decision: "approved" | "rejected") {
    setDecisionPending(true);
    setSaveState("saving");
    toast.loading(`${decision === "approved" ? "Approving" : "Rejecting"} content`, { id: "alpha-core-action" });
    try {
      await dashboardService.decideContent(
        contentId,
        decision,
        `${decision === "approved" ? "Approved" : "Rejected"} from integrated premium frontend V0.1`,
      );
      toast.success(`Content ${decision}`, {
        id: "alpha-core-action",
        description: "The review decision was persisted by ALPHA Core.",
      });
      setSaveState("saved");
      setLoading(true);
      setReloadToken((token) => token + 1);
    } catch (decisionError) {
      setSaveState("error");
      toast.error("Review decision failed", {
        id: "alpha-core-action",
        description: decisionError instanceof Error ? decisionError.message : "Core decision unavailable.",
      });
    } finally {
      setDecisionPending(false);
    }
  }

  function handleScenarioChange(nextScenario: DataScenario) {
    setLoading(true);
    setError(undefined);
    setScenario(nextScenario);
    toast.info(`UI state preview: ${nextScenario}`);
  }

  function retry() {
    setLoading(true);
    setError(undefined);
    if (scenario === "error" || scenario === "loading") {
      setScenario("live");
      return;
    }
    setReloadToken((token) => token + 1);
  }

  function changeTimeRange(nextRange: TimeRange) {
    setLoading(true);
    setError(undefined);
    setTimeRange(nextRange);
  }

  return (
    <SidebarProvider
      defaultOpen
      className="alpha-app"
      style={
        {
          "--sidebar-width": "232px",
          "--sidebar-width-icon": "88px",
        } as React.CSSProperties
      }
    >
      <AppSidebar activeRoute={route} onNewContent={() => openCreate()} />
      <SidebarInset className="alpha-shell">
        <TopBar
          route={route}
          saveState={saveState}
          scenario={scenario}
          onScenarioChange={handleScenarioChange}
          onNewContent={() => openCreate()}
          onPreview={() => setPreviewOpen(true)}
          onOpenIntelligence={() => setIntelligenceOpen(true)}
          onScan={handleScan}
          scanning={scanning}
        />

        {route === "dashboard" || route === "content" ? (
          <DashboardSurface
            dashboard={dashboard}
            loading={loading}
            error={error}
            activeStage={activeStage}
            selectedOpportunity={selectedOpportunity}
            selectedIntelligence={selectedIntelligence}
            selectedNextBestAction={selectedNextBestAction}
            onSelectStage={setActiveStage}
            onSelectOpportunity={setSelectedOpportunity}
            onCreateFromOpportunity={(opportunity) => openCreate(opportunity.id)}
            onRefreshOpportunities={handleScan}
            onSelectContent={selectContent}
            onContentAction={handleContentAction}
            onNewContent={() => openCreate()}
            onApplyInsight={applyInsight}
            onPrimaryAction={handlePrimaryAction}
            onDecision={handleDecision}
            decisionPending={decisionPending}
            onRetry={retry}
          />
        ) : (
          <PlaceholderScreen route={route} onNewContent={() => openCreate()} />
        )}

        <SystemStatusBar
          status={dashboard?.systemStatus ?? fallbackStatus}
          timeRange={timeRange}
          onTimeRangeChange={changeTimeRange}
        />
        <MobileNavigation activeRoute={route} onNewContent={() => openCreate()} />
      </SidebarInset>

      <CreateContentDialog
        key={seedOpportunityId ?? "default-create-flow"}
        open={createOpen}
        onOpenChange={setCreateOpen}
        opportunities={dashboard?.opportunities ?? []}
        seedOpportunityId={seedOpportunityId}
        generating={generating}
        onGenerate={handleGenerate}
      />

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="alpha-dialog alpha-full-preview-dialog max-w-4xl">
          <DialogHeader>
            <p className="alpha-eyebrow">CONTENT PREVIEW</p>
            <DialogTitle>Selected content</DialogTitle>
            <DialogDescription>
              Structured Core package for human review. Video rendering is unavailable in V0.1.
            </DialogDescription>
          </DialogHeader>
          {selectedIntelligence ? (
            <div className="grid gap-5 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <LivePreviewCard intelligence={selectedIntelligence} />
              <ContentReviewDetails intelligence={selectedIntelligence} />
            </div>
          ) : (
            <p className="py-12 text-center text-[var(--alpha-text-muted)]">Select content to open a preview.</p>
          )}
        </DialogContent>
      </Dialog>

      <Sheet open={intelligenceOpen} onOpenChange={setIntelligenceOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn("alpha-sheet alpha-intelligence-drawer", isMobile && "max-h-[92svh] rounded-t-2xl")}
        >
          <SheetHeader className="p-0">
            <SheetTitle>ALPHA Intelligence</SheetTitle>
            <SheetDescription>Context, prediction, insight and recommended action.</SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto pr-1">
            <IntelligencePanel
              intelligence={selectedIntelligence}
              nextBestAction={selectedNextBestAction}
              loading={loading}
              onNewContent={() => openCreate()}
              onApplyInsight={applyInsight}
              onPrimaryAction={handlePrimaryAction}
              onDecision={handleDecision}
              decisionPending={decisionPending}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Toaster position="top-right" richColors closeButton />
    </SidebarProvider>
  );
}

function DashboardSurface({
  dashboard,
  loading,
  error,
  activeStage,
  selectedOpportunity,
  selectedIntelligence,
  selectedNextBestAction,
  onSelectStage,
  onSelectOpportunity,
  onCreateFromOpportunity,
  onRefreshOpportunities,
  onSelectContent,
  onContentAction,
  onNewContent,
  onApplyInsight,
  onPrimaryAction,
  onDecision,
  decisionPending,
  onRetry,
}: {
  dashboard?: DashboardState;
  loading: boolean;
  error?: string;
  activeStage?: PipelineStageId;
  selectedOpportunity?: Opportunity;
  selectedIntelligence?: DashboardState["intelligenceByContentId"][string];
  selectedNextBestAction?: NextBestAction;
  onSelectStage: (stage?: PipelineStageId) => void;
  onSelectOpportunity: (opportunity?: Opportunity) => void;
  onCreateFromOpportunity: (opportunity: Opportunity) => void;
  onRefreshOpportunities: () => void;
  onSelectContent: (contentId: string) => void;
  onContentAction: (action: string, content: ContentPerformance) => void;
  onNewContent: () => void;
  onApplyInsight: (insight: AlphaInsight) => void;
  onPrimaryAction: (action: NextBestAction) => void;
  onDecision: (contentId: string, decision: "approved" | "rejected") => void;
  decisionPending: boolean;
  onRetry: () => void;
}) {
  if (error) {
    return (
      <main className="alpha-main alpha-main-error">
        <ErrorState description={error} onRetry={onRetry} />
      </main>
    );
  }

  if (loading || !dashboard) {
    return (
      <main className="alpha-main">
        <div className="alpha-dashboard-grid">
          <div className="space-y-6">
            <AlphaCardSkeleton rows={3} />
            <div className="alpha-metric-grid">
              {Array.from({ length: 5 }).map((_, index) => <AlphaCardSkeleton key={index} rows={1} />)}
            </div>
            <div className="alpha-lower-grid">
              <AlphaCardSkeleton rows={5} />
              <AlphaCardSkeleton rows={6} />
            </div>
          </div>
          <aside className="alpha-intelligence-panel">
            <IntelligencePanel
              loading
              onNewContent={onNewContent}
              onApplyInsight={onApplyInsight}
              onPrimaryAction={onPrimaryAction}
              onDecision={onDecision}
              decisionPending={decisionPending}
            />
          </aside>
        </div>
      </main>
    );
  }

  return (
    <main className="alpha-main">
      <div className="alpha-dashboard-grid">
        <div className="alpha-workspace">
          <ContentPipeline stages={dashboard.pipeline} activeStage={activeStage} onSelect={onSelectStage} />
          <MetricGrid metrics={dashboard.metrics} />
          <div className="alpha-lower-grid">
            <Opportunities
              opportunities={dashboard.opportunities}
              selectedOpportunity={selectedOpportunity}
              onSelectOpportunity={onSelectOpportunity}
              onCreate={onCreateFromOpportunity}
              onRefresh={onRefreshOpportunities}
              availability={dashboard.availability.stories}
            />
            <RecentContent
              content={dashboard.recentContent}
              selectedContentId={dashboard.selectedContentId}
              activeStage={activeStage}
              onSelectContent={onSelectContent}
              onAction={onContentAction}
              onCreate={onNewContent}
              onRetry={onRetry}
              availability={dashboard.availability.content}
            />
          </div>
        </div>
        <aside className="alpha-intelligence-panel" aria-label="ALPHA Intelligence panel">
          <IntelligencePanel
            intelligence={selectedIntelligence}
            nextBestAction={selectedNextBestAction}
            onNewContent={onNewContent}
            onApplyInsight={onApplyInsight}
            onPrimaryAction={onPrimaryAction}
            onDecision={onDecision}
            decisionPending={decisionPending}
          />
        </aside>
      </div>
    </main>
  );
}

function ContentReviewDetails({ intelligence }: { intelligence: ContentIntelligence }) {
  const details = intelligence.details;
  return (
    <AlphaCard className="max-h-[68svh] space-y-5 overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="alpha-eyebrow">REVIEW PACKAGE</p>
          <h3 className="alpha-section-title">Generated content details</h3>
        </div>
        <StatusBadge
          label={intelligence.contentStatus}
          tone={intelligence.contentStatus === "approved" ? "success" : intelligence.contentStatus === "rejected" ? "danger" : "warning"}
        />
      </div>
      <div>
        <p className="alpha-eyebrow">VALIDATION</p>
        <p className="mt-2 text-sm text-[var(--alpha-text-secondary)]">{details.validationStatus}</p>
      </div>
      <div>
        <p className="alpha-eyebrow">REEL SCRIPT</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--alpha-text-secondary)]">{details.reelScript}</p>
      </div>
      <div>
        <p className="alpha-eyebrow">CAPTION</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--alpha-text-secondary)]">{details.caption}</p>
      </div>
      <div>
        <p className="alpha-eyebrow">CTA</p>
        <p className="mt-2 text-sm text-[var(--alpha-text-secondary)]">{details.cta}</p>
      </div>
      <div>
        <p className="alpha-eyebrow">SOURCE BASIS</p>
        <div className="mt-2 flex flex-col gap-2">
          {details.sourceBasis.map((source) => (
            <a key={source} href={source} target="_blank" rel="noreferrer" className="alpha-text-action break-all">
              {source}
            </a>
          ))}
        </div>
      </div>
    </AlphaCard>
  );
}

function MobileNavigation({ activeRoute, onNewContent }: { activeRoute: string; onNewContent: () => void }) {
  const items = [
    ["dashboard", "Dashboard", Gauge],
    ["discover", "Discover", Compass],
    ["create", "Create", Plus],
    ["content", "Content", FileStack],
    ["settings", "More", MoreHorizontal],
  ] as const;

  return (
    <nav className="alpha-mobile-nav" aria-label="Mobile navigation">
      {items.map(([id, label, Icon]) =>
        id === "create" ? (
          <button key={id} onClick={onNewContent} className="alpha-mobile-create">
            <span><Icon size={18} aria-hidden="true" /></span>
            {label}
          </button>
        ) : (
          <Link key={id} href={`/${id}`} className={cn(activeRoute === id && "alpha-mobile-nav-active")}>
            <Icon size={18} aria-hidden="true" />
            {label}
          </Link>
        ),
      )}
    </nav>
  );
}
