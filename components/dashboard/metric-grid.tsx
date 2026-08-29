import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

import { AlphaCard, StatusBadge, TrendSparkline } from "@/components/alpha/alpha-ui";
import { cn } from "@/lib/utils";
import type { MetricCardData } from "@/types/dashboard";

export function MetricGrid({ metrics }: { metrics: MetricCardData[] }) {
  return (
    <div className="alpha-metric-grid" aria-label="Content performance metrics">
      {metrics.map((metric) => (
        <MetricCard key={metric.id} metric={metric} />
      ))}
    </div>
  );
}

function MetricCard({ metric }: { metric: MetricCardData }) {
  const TrendIcon =
    metric.deltaDirection === "up" ? ArrowUpRight : metric.deltaDirection === "down" ? ArrowDownRight : ArrowRight;

  return (
    <AlphaCard className="alpha-metric-card">
      <p>{metric.label}</p>
      <div className="alpha-metric-value">
        <strong>{metric.value}</strong>
        {metric.unit ? <span>{metric.unit}</span> : null}
      </div>
      <div className="alpha-metric-footer">
        {metric.delta !== undefined ? (
          <span
            className={cn(
              "alpha-delta",
              metric.deltaDirection === "up" && "alpha-delta-up",
              metric.deltaDirection === "down" && "alpha-delta-down",
            )}
          >
            <TrendIcon size={13} aria-hidden="true" />
            {Math.abs(metric.delta)}%
          </span>
        ) : (
          <StatusBadge
            label={metric.availability === "unavailable" ? "Unavailable" : "Core data"}
            tone={metric.availability === "unavailable" ? "warning" : "cyan"}
          />
        )}
        <span>{metric.note ?? "No comparison period available"}</span>
      </div>
      {metric.sparkline?.length ? <TrendSparkline values={metric.sparkline} /> : null}
    </AlphaCard>
  );
}
