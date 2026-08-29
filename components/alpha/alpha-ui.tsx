"use client";

import type { ReactNode } from "react";
import { AlertTriangle, ArrowRight, Inbox, LoaderCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function AlphaCard({
  children,
  className,
  selected = false,
}: {
  children: ReactNode;
  className?: string;
  selected?: boolean;
}) {
  return (
    <section
      className={cn("alpha-card", selected && "alpha-card-selected", className)}
    >
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? <p className="alpha-eyebrow">{eyebrow}</p> : null}
        <h2 className="alpha-section-title">{title}</h2>
        {description ? <p className="alpha-section-description">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function AlphaPrimaryButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button className={cn("alpha-button-primary", className)} {...props}>
      {children}
    </Button>
  );
}

export function AlphaSecondaryButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" className={cn("alpha-button-secondary", className)} {...props}>
      {children}
    </Button>
  );
}

export function AlphaTertiaryButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="ghost" className={cn("alpha-button-tertiary", className)} {...props}>
      {children}
    </Button>
  );
}

export function StatusBadge({
  label,
  tone = "neutral",
  pulse = false,
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "cyan" | "violet";
  pulse?: boolean;
}) {
  return (
    <span className={cn("alpha-status-badge", `alpha-status-${tone}`)}>
      <span className={cn("alpha-status-dot", pulse && "alpha-status-pulse")} aria-hidden="true" />
      {label}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="alpha-state-panel" role="status">
      <div className="alpha-state-icon">
        <Inbox size={20} aria-hidden="true" />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction ? (
        <AlphaSecondaryButton size="sm" onClick={onAction}>
          {actionLabel}
          <ArrowRight size={15} aria-hidden="true" />
        </AlphaSecondaryButton>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title = "Dashboard data unavailable",
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry: () => void;
}) {
  return (
    <div className="alpha-state-panel alpha-error-panel" role="alert">
      <div className="alpha-state-icon">
        <AlertTriangle size={20} aria-hidden="true" />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <AlphaSecondaryButton size="sm" onClick={onRetry}>
        <RefreshCw size={15} aria-hidden="true" />
        Retry
      </AlphaSecondaryButton>
    </div>
  );
}

export function LoadingPanel({ label = "Loading intelligence" }: { label?: string }) {
  return (
    <div className="alpha-state-panel min-h-64" role="status" aria-live="polite">
      <LoaderCircle className="animate-spin text-[var(--alpha-cyan)]" size={24} />
      <h3>{label}</h3>
      <p>Preparing the current content signals and recommendations.</p>
    </div>
  );
}

export function AlphaCardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="alpha-card space-y-4" aria-hidden="true">
      <Skeleton className="h-3 w-28 bg-[var(--alpha-surface-3)]" />
      <Skeleton className="h-8 w-36 bg-[var(--alpha-surface-3)]" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-3 bg-[var(--alpha-surface-3)]"
          style={{ width: `${92 - index * 12}%` }}
        />
      ))}
    </div>
  );
}

export function TrendSparkline({ values }: { values: number[] }) {
  if (!values.length) {
    return <div className="h-8 w-full rounded-md bg-[var(--alpha-surface-2)]" aria-label="No trend data" />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 28 - ((value - min) / range) * 24;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      className="alpha-sparkline"
      viewBox="0 0 100 32"
      role="img"
      aria-label={`Trend from ${values[0]} to ${values[values.length - 1]}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="alphaSparkline" x1="0" x2="1">
          <stop offset="0" stopColor="var(--alpha-cyan)" />
          <stop offset="1" stopColor="var(--alpha-violet)" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke="url(#alphaSparkline)" strokeWidth="2" />
    </svg>
  );
}

export function ScoreRing({ score, size = 104 }: { score: number; size?: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="alpha-score-ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" role="img" aria-label={`Heuristic score ${score} out of 100`}>
        <defs>
          <linearGradient id="alphaScoreGradient" x1="0" x2="1">
            <stop offset="0" stopColor="var(--alpha-cyan)" />
            <stop offset="0.5" stopColor="var(--alpha-blue)" />
            <stop offset="1" stopColor="var(--alpha-violet)" />
          </linearGradient>
        </defs>
        <circle className="alpha-score-track" cx="50" cy="50" r={radius} />
        <circle
          className="alpha-score-value"
          cx="50"
          cy="50"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="alpha-score-copy">
        <strong>{score}</strong>
        <span>/100</span>
      </div>
    </div>
  );
}
