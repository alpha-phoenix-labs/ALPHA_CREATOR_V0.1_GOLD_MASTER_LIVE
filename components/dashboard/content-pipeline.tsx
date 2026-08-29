"use client";

import { CheckCircle2, CircleDot, FileCheck2, Lightbulb, Send, Sparkles, XCircle } from "lucide-react";

import { AlphaCard, SectionHeading } from "@/components/alpha/alpha-ui";
import { cn } from "@/lib/utils";
import type { PipelineStage, PipelineStageId } from "@/types/dashboard";

const stageIcons = {
  ideas: Lightbulb,
  generated: Sparkles,
  review: CircleDot,
  approved: FileCheck2,
  rejected: XCircle,
  scheduled: Send,
  published: CheckCircle2,
};

export function ContentPipeline({
  stages,
  activeStage,
  onSelect,
}: {
  stages: PipelineStage[];
  activeStage?: PipelineStageId;
  onSelect: (stage?: PipelineStageId) => void;
}) {
  return (
    <AlphaCard className="alpha-pipeline-card">
      <SectionHeading
        eyebrow="CONTENT OPERATIONS"
        title="Content Pipeline"
        description={activeStage ? `Filtering loaded content by ${activeStage}.` : "Real Core states; unavailable V0.1 stages are explicitly marked."}
        action={
          activeStage ? (
            <button className="alpha-text-action" onClick={() => onSelect(undefined)}>
              Clear filter
            </button>
          ) : undefined
        }
      />
      <div className="alpha-pipeline" role="list" aria-label="Content pipeline stages">
        {stages.map((stage, index) => {
          const Icon = stageIcons[stage.id];
          const active = activeStage === stage.id;
          return (
            <div className="alpha-pipeline-node-wrap" key={stage.id}>
              <button
                className={cn("alpha-pipeline-node", active && "alpha-pipeline-node-active")}
                onClick={() => onSelect(active ? undefined : stage.id)}
                aria-pressed={active}
                disabled={stage.availability === "unavailable"}
                title={stage.note}
              >
                <span className="alpha-pipeline-icon">
                  <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span>
                  <small>{stage.label}</small>
                  <strong>{stage.count ?? "-"}</strong>
                </span>
                {stage.status === "attention" ? <i aria-label="Needs attention" /> : null}
              </button>
              {index < stages.length - 1 ? <span className="alpha-pipeline-link" aria-hidden="true" /> : null}
            </div>
          );
        })}
      </div>
    </AlphaCard>
  );
}
