"use client";

import { ArrowUpRight, ChevronRight, ExternalLink, Radar, Sparkles, TrendingUp } from "lucide-react";

import {
  AlphaCard,
  AlphaPrimaryButton,
  EmptyState,
  SectionHeading,
  StatusBadge,
} from "@/components/alpha/alpha-ui";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { DataAvailability, Opportunity } from "@/types/dashboard";

const potentialLabels: Record<Opportunity["potential"], string> = {
  low: "Low score band",
  medium: "Medium score band",
  high: "High score band",
  high_potential: "Top score band",
  exceptional: "Exceptional score band",
};

export function Opportunities({
  opportunities,
  selectedOpportunity,
  onSelectOpportunity,
  onCreate,
  onRefresh,
  availability,
}: {
  opportunities: Opportunity[];
  selectedOpportunity?: Opportunity;
  onSelectOpportunity: (opportunity?: Opportunity) => void;
  onCreate: (opportunity: Opportunity) => void;
  onRefresh: () => void;
  availability: DataAvailability;
}) {
  return (
    <>
      <AlphaCard className="alpha-opportunity-card">
        <SectionHeading
          eyebrow="MARKET SIGNALS"
          title="Top Opportunities"
          description="Ranked from real Core story signals with a transparent heuristic score."
          action={<Radar className="text-[var(--alpha-violet)]" size={19} aria-hidden="true" />}
        />
        {opportunities.length ? (
          <div className="alpha-opportunity-list">
            {opportunities.map((opportunity, index) => (
              <button
                key={opportunity.id}
                className="alpha-opportunity-row"
                onClick={() => onSelectOpportunity(opportunity)}
              >
                <span className="alpha-opportunity-rank">{String(index + 1).padStart(2, "0")}</span>
                <span className="alpha-opportunity-copy">
                  <strong>{opportunity.title}</strong>
                  <small>{opportunity.summary}</small>
                  <span>
                    <StatusBadge
                      label={potentialLabels[opportunity.potential]}
                      tone={opportunity.potential === "exceptional" ? "violet" : "cyan"}
                    />
                    {opportunity.category ? <i>{opportunity.category}</i> : null}
                  </span>
                </span>
                <span className="alpha-opportunity-score">
                  <strong>{opportunity.score}</strong>
                  <small>score</small>
                </span>
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            ))}
          </div>
        ) : availability === "unavailable" ? (
          <EmptyState
            title="Ranked stories unavailable"
            description="The dashboard is partially available, but the Core stories request did not complete."
            actionLabel="Retry Core request"
            onAction={onRefresh}
          />
        ) : (
          <EmptyState
            title="No ranked stories yet"
            description="Run a real RSS scan to load and rank current AI source signals."
            actionLabel="Run RSS scan"
            onAction={onRefresh}
          />
        )}
      </AlphaCard>

      <Sheet open={Boolean(selectedOpportunity)} onOpenChange={(open) => !open && onSelectOpportunity(undefined)}>
        <SheetContent className="alpha-sheet sm:max-w-md">
          {selectedOpportunity ? (
            <>
              <SheetHeader className="p-0">
                <p className="alpha-eyebrow">OPPORTUNITY INTELLIGENCE</p>
                <SheetTitle className="text-xl leading-7">{selectedOpportunity.title}</SheetTitle>
                <SheetDescription>{selectedOpportunity.summary}</SheetDescription>
              </SheetHeader>
              <div className="alpha-opportunity-detail-score">
                <span>
                  <Sparkles size={18} aria-hidden="true" />
                  Core content score
                </span>
                <strong>{selectedOpportunity.score}<small>/100</small></strong>
                <StatusBadge label={potentialLabels[selectedOpportunity.potential]} tone="violet" />
              </div>
              <div className="space-y-4">
                <OpportunitySignal label="Topic momentum" value={selectedOpportunity.topicMomentum ?? 0} />
                <OpportunitySignal label="Audience fit" value={selectedOpportunity.audienceFit ?? 0} />
                <OpportunitySignal label="Visual demonstrability" value={selectedOpportunity.visualDemonstrability ?? 0} />
              </div>
              <div className="alpha-intelligence-note">
                <TrendingUp size={17} aria-hidden="true" />
                <p>
                  {selectedOpportunity.scoringVersion} · {selectedOpportunity.sourceCount} source
                  {selectedOpportunity.sourceCount === 1 ? "" : "s"} · This is a heuristic content score,
                  not a viral probability.
                </p>
              </div>
              <a
                className="alpha-text-action inline-flex items-center gap-2"
                href={selectedOpportunity.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open original source
                <ExternalLink size={14} aria-hidden="true" />
              </a>
              <AlphaPrimaryButton className="mt-auto w-full" onClick={() => onCreate(selectedOpportunity)}>
                Generate from this story
                <ArrowUpRight size={16} aria-hidden="true" />
              </AlphaPrimaryButton>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

function OpportunitySignal({ label, value }: { label: string; value: number }) {
  return (
    <div className="alpha-signal-row">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <Progress value={value} className="alpha-progress" />
    </div>
  );
}
