"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
  Lightbulb,
  Play,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import {
  AlphaCard,
  AlphaCardSkeleton,
  AlphaPrimaryButton,
  AlphaSecondaryButton,
  EmptyState,
  ScoreRing,
  SectionHeading,
  StatusBadge,
} from "@/components/alpha/alpha-ui";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { AlphaInsight, ContentIntelligence, NextBestAction } from "@/types/dashboard";

const levelLabels = {
  weak: "Weak",
  low: "Low",
  moderate: "Moderate",
  strong: "Strong",
  high_potential: "High potential",
  exceptional: "Exceptional",
};

export function IntelligencePanel({
  intelligence,
  nextBestAction,
  loading = false,
  onNewContent,
  onApplyInsight,
  onPrimaryAction,
  onDecision,
  decisionPending = false,
}: {
  intelligence?: ContentIntelligence;
  nextBestAction?: NextBestAction;
  loading?: boolean;
  onNewContent: () => void;
  onApplyInsight: (insight: AlphaInsight) => void;
  onPrimaryAction: (action: NextBestAction) => void;
  onDecision: (contentId: string, decision: "approved" | "rejected") => void;
  decisionPending?: boolean;
}) {
  if (loading) {
    return (
      <div className="alpha-intelligence-stack">
        <AlphaCardSkeleton rows={4} />
        <AlphaCardSkeleton rows={5} />
        <AlphaCardSkeleton rows={3} />
      </div>
    );
  }

  if (!intelligence) {
    return (
      <div className="alpha-intelligence-stack">
        <AlphaCard>
          <SectionHeading eyebrow="CONTEXT PANEL" title="ALPHA Intelligence" />
          <EmptyState
            title="No content selected"
            description="Select content or start a new creation to activate prediction and insights."
            actionLabel="New Content"
            onAction={onNewContent}
          />
        </AlphaCard>
      </div>
    );
  }

  return (
    <div className="alpha-intelligence-stack">
      <LivePreviewCard intelligence={intelligence} />
      <ViralPredictionCard intelligence={intelligence} />
      <InsightsCard insights={intelligence.insights} onApply={onApplyInsight} />
      {nextBestAction ? (
        <NextActionCard
          action={nextBestAction}
          onAction={onPrimaryAction}
          onDecision={onDecision}
          pending={decisionPending}
        />
      ) : null}
    </div>
  );
}

export function LivePreviewCard({ intelligence }: { intelligence: ContentIntelligence }) {
  const { preview } = intelligence;
  return (
    <AlphaCard className="alpha-preview-card">
      <div className="flex items-center justify-between gap-3">
        <p className="alpha-eyebrow">LIVE PREVIEW</p>
        <StatusBadge label="Core draft loaded" tone="success" pulse />
      </div>
      <div className="alpha-phone-preview" aria-label={`${preview.format} preview: ${preview.headline}`}>
        <div className="alpha-phone-topline">
          <span>ALPHA CREATOR</span>
          <span>{preview.frame}</span>
        </div>
        <div className="alpha-preview-content">
          <span className="alpha-preview-orbit" aria-hidden="true" />
          <p>{preview.eyebrow}</p>
          <h3>{preview.headline}</h3>
          <span>{preview.subline}</span>
        </div>
        <div className="alpha-preview-footer">
          <span><Play size={12} fill="currentColor" aria-hidden="true" /> {preview.format}</span>
          <span>Structured preview · rendering unavailable</span>
        </div>
      </div>
    </AlphaCard>
  );
}

function ViralPredictionCard({ intelligence }: { intelligence: ContentIntelligence }) {
  const prediction = intelligence.prediction;
  const subMetrics = [
    ["Hook Strength", prediction.hookStrength],
    ["Retention", prediction.retention],
    ["Share Potential", prediction.sharePotential],
    ["Save Potential", prediction.savePotential],
    ["Follow Conversion", prediction.followConversion],
    ["Novelty", prediction.novelty],
  ] as const;

  return (
    <AlphaCard className="alpha-prediction-card">
      <SectionHeading
        eyebrow="PREDICTION LAYER"
        title="Viral Prediction"
        action={
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="alpha-info-button" aria-label="About viral prediction">
                <Info size={15} aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64 text-center">
              This is a probability estimate based on content signals, not a guarantee of reach.
            </TooltipContent>
          </Tooltip>
        }
      />
      <div className="alpha-prediction-summary">
        <ScoreRing score={prediction.score} />
        <div>
          <StatusBadge label={levelLabels[prediction.level]} tone="violet" />
          <p>{prediction.confidence === undefined ? "Confidence unavailable" : `${prediction.confidence}% confidence`}</p>
          <small>{prediction.basis} · {prediction.disclaimer}</small>
        </div>
      </div>
      <div className="alpha-prediction-metrics">
        {subMetrics.map(([label, value]) => (
          <div className="alpha-signal-row" key={label}>
            <div>
              <span>{label}</span>
              <strong>{value ?? "-"}</strong>
            </div>
            {value === undefined ? (
              <StatusBadge label="Unavailable in Core V0.1" tone="warning" />
            ) : (
              <Progress value={value} className="alpha-progress" />
            )}
          </div>
        ))}
      </div>
    </AlphaCard>
  );
}

function InsightsCard({ insights, onApply }: { insights: AlphaInsight[]; onApply: (insight: AlphaInsight) => void }) {
  return (
    <AlphaCard className="alpha-insights-card">
      <SectionHeading
        eyebrow="DERIVED INTELLIGENCE"
        title="ALPHA Insights"
        action={<Sparkles size={18} className="text-[var(--alpha-violet)]" aria-hidden="true" />}
      />
      <div className="alpha-insight-list">
        {insights.map((insight) => {
          const Icon =
            insight.type === "positive"
              ? CheckCircle2
              : insight.type === "warning" || insight.type === "risk"
                ? AlertTriangle
                : insight.type === "opportunity"
                  ? TrendingUp
                  : Lightbulb;
          return (
            <div className={cn("alpha-insight", `alpha-insight-${insight.type}`)} key={insight.id}>
              <Icon size={17} aria-hidden="true" />
              <div>
                <strong>{insight.title}</strong>
                {insight.description ? <p>{insight.description}</p> : null}
                <span>
                  {insight.confidence ? `Confidence ${insight.confidence}%` : null}
                  {insight.confidence && insight.impact ? " · " : null}
                  {insight.impact ? `${insight.impact} impact` : null}
                </span>
                {insight.action ? (
                  <button onClick={() => onApply(insight)}>{insight.action.label}</button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </AlphaCard>
  );
}

function NextActionCard({
  action,
  onAction,
  onDecision,
  pending,
}: {
  action: NextBestAction;
  onAction: (action: NextBestAction) => void;
  onDecision: (contentId: string, decision: "approved" | "rejected") => void;
  pending: boolean;
}) {
  const isReview = action.type === "review" && action.targetId && action.availability === "real";
  return (
    <AlphaCard className="alpha-next-action-card">
      <div className="alpha-next-action-icon">
        <Target size={19} aria-hidden="true" />
      </div>
      <p className="alpha-eyebrow">NEXT BEST ACTION</p>
      <h3>{action.title}</h3>
      {action.reason ? <p>{action.reason}</p> : null}
      <AlphaPrimaryButton
        className="w-full"
        disabled={pending || action.availability === "unavailable"}
        onClick={() => isReview ? onDecision(action.targetId!, "approved") : onAction(action)}
      >
        {action.actionLabel}
        <ArrowRight size={16} aria-hidden="true" />
      </AlphaPrimaryButton>
      {isReview && action.secondaryActionLabel ? (
        <AlphaSecondaryButton
          className="w-full"
          disabled={pending}
          onClick={() => onDecision(action.targetId!, "rejected")}
        >
          {action.secondaryActionLabel}
        </AlphaSecondaryButton>
      ) : null}
    </AlphaCard>
  );
}
