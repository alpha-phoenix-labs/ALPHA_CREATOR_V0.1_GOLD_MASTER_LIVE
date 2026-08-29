"use client";

import {
  Bell,
  Check,
  ChevronDown,
  Clock3,
  FlaskConical,
  PanelRight,
  Play,
  Plus,
  RotateCcw,
  ScanSearch,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import {
  AlphaPrimaryButton,
  AlphaSecondaryButton,
  AlphaTertiaryButton,
  StatusBadge,
} from "@/components/alpha/alpha-ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { DataScenario } from "@/types/dashboard";

const routeCopy: Record<string, { title: string; description: string }> = {
  dashboard: { title: "Dashboard", description: "Overview of your content intelligence engine" },
  discover: { title: "Discover", description: "Find high-signal topics before they saturate" },
  create: { title: "Create", description: "Turn intelligence into content systems" },
  content: { title: "Content", description: "Open and review your persistent Core content library" },
  experiments: { title: "Experiments", description: "Test hooks, formats and creative variables" },
  analytics: { title: "Analytics", description: "Understand what drives durable audience growth" },
  intelligence: { title: "Intelligence", description: "Inspect ALPHA signals, predictions and decisions" },
  settings: { title: "Settings", description: "Configure data sources and workspace preferences" },
};

export function TopBar({
  route,
  saveState,
  scenario,
  onScenarioChange,
  onNewContent,
  onPreview,
  onOpenIntelligence,
  onScan,
  scanning,
}: {
  route: string;
  saveState: "saved" | "saving" | "error";
  scenario: DataScenario;
  onScenarioChange: (scenario: DataScenario) => void;
  onNewContent: () => void;
  onPreview: () => void;
  onOpenIntelligence: () => void;
  onScan: () => void;
  scanning: boolean;
}) {
  const copy = routeCopy[route] ?? routeCopy.dashboard;

  return (
    <header className="alpha-topbar">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="alpha-icon-button" aria-label="Toggle navigation" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1>{copy.title}</h1>
            <span className="alpha-version-chip">V0.1</span>
          </div>
          <p>{copy.description}</p>
        </div>
      </div>

      <div className="alpha-topbar-actions">
        {saveState === "saved" ? (
          <StatusBadge label="Core synced" tone="success" />
        ) : saveState === "saving" ? (
          <StatusBadge label="Saving…" tone="cyan" pulse />
        ) : (
          <StatusBadge label="Sync error" tone="danger" />
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <AlphaTertiaryButton className="alpha-icon-button" aria-label="Open UI state previews">
              <FlaskConical size={17} aria-hidden="true" />
            </AlphaTertiaryButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="alpha-menu w-56">
            <DropdownMenuLabel>UI state preview</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(
              [
                ["live", "Real Core", Check],
                ["loading", "Loading", Clock3],
                ["empty", "Empty", RotateCcw],
                ["partial", "Partial data", TriangleAlert],
                ["error", "Service error", TriangleAlert],
              ] as const
            ).map(([id, label, Icon]) => (
              <DropdownMenuItem key={id} onSelect={() => onScenarioChange(id)}>
                <Icon size={15} aria-hidden="true" />
                {label}
                {scenario === id ? <Check className="ml-auto" size={14} aria-hidden="true" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <AlphaTertiaryButton
          className="alpha-icon-button alpha-tablet-intelligence-trigger"
          onClick={onOpenIntelligence}
          aria-label="Open intelligence panel"
        >
          <PanelRight size={18} aria-hidden="true" />
        </AlphaTertiaryButton>

        <AlphaTertiaryButton
          className="alpha-icon-button alpha-history-button"
          onClick={() => toast.info("Revision history is unavailable in V0.1.")}
          aria-label="Open change history"
        >
          <Clock3 size={17} aria-hidden="true" />
        </AlphaTertiaryButton>

        <AlphaSecondaryButton className="alpha-preview-button" onClick={onPreview}>
          <Play size={16} aria-hidden="true" />
          Preview
        </AlphaSecondaryButton>

        <AlphaSecondaryButton className="alpha-scan-button" onClick={onScan} disabled={scanning}>
          <ScanSearch size={16} aria-hidden="true" />
          <span>{scanning ? "Scanning..." : "Scan Sources"}</span>
        </AlphaSecondaryButton>

        <AlphaPrimaryButton className="alpha-new-content-top" onClick={onNewContent}>
          <Plus size={17} aria-hidden="true" />
          New Content
        </AlphaPrimaryButton>

        <button className="alpha-notification-button" aria-label="Notifications unavailable in V0.1" disabled>
          <Bell size={17} aria-hidden="true" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="alpha-account-button" aria-label="Open account menu">
              <span className="alpha-avatar">AS</span>
              <span className="alpha-account-copy">
                <strong>ALPHA Studio</strong>
                <small>Creator workspace</small>
              </span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="alpha-menu w-56">
            <DropdownMenuLabel>ALPHA Studio</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Workspace settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast.info("Account connections are unavailable in V0.1.")}>Account connections</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
