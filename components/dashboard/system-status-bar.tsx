"use client";

import { CalendarDays, CloudCog } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { SystemStatus, TimeRange } from "@/types/dashboard";

const rangeLabels: Record<TimeRange, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  custom: "Custom range",
};

export function SystemStatusBar({
  status,
  timeRange,
  onTimeRangeChange,
}: {
  status: SystemStatus;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}) {
  return (
    <footer className="alpha-system-bar">
      <div className="alpha-system-state">
        <CloudCog size={15} aria-hidden="true" />
        <span className={cn("alpha-system-dot", `alpha-system-dot-${status.state}`)} aria-hidden="true" />
        <strong>{status.label}</strong>
        <span>{status.detail}</span>
      </div>
      <div className="alpha-system-range">
        <CalendarDays size={14} aria-hidden="true" />
        <span>Presentation range · Core totals keep their stated basis</span>
        <Select value={timeRange} onValueChange={(value) => onTimeRangeChange(value as TimeRange)}>
          <SelectTrigger className="alpha-range-trigger" aria-label="Select dashboard time period">
            <SelectValue>{rangeLabels[timeRange]}</SelectValue>
          </SelectTrigger>
          <SelectContent className="alpha-menu">
            {Object.entries(rangeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </footer>
  );
}
