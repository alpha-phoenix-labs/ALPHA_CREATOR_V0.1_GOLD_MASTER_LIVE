"use client";

import { CheckCircle2, Ellipsis, ExternalLink, Sparkles, XCircle } from "lucide-react";
import Link from "next/link";

import { AlphaCard, EmptyState, SectionHeading } from "@/components/alpha/alpha-ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ContentPerformance, DataAvailability, PipelineStageId } from "@/types/dashboard";

function compactNumber(value?: number) {
  if (value === undefined) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return value.toLocaleString("en-US");
}

export function RecentContent({
  content,
  selectedContentId,
  activeStage,
  onSelectContent,
  onAction,
  onCreate,
  onRetry,
  availability,
}: {
  content: ContentPerformance[];
  selectedContentId?: string;
  activeStage?: PipelineStageId;
  onSelectContent: (contentId: string) => void;
  onAction: (action: string, content: ContentPerformance) => void;
  onCreate: () => void;
  onRetry: () => void;
  availability: DataAvailability;
}) {
  const filtered = activeStage ? content.filter((item) => item.pipelineStageId === activeStage) : content;

  return (
    <AlphaCard className="alpha-content-card">
      <SectionHeading
        eyebrow="RECENT SIGNALS"
        title={activeStage ? `${activeStage[0].toUpperCase()}${activeStage.slice(1)} Content` : "Recent Content Performance"}
        description="Persisted Core content; Instagram performance fields remain unavailable in V0.1."
        action={
          <Link href="/content" className="alpha-text-action">
            View all
          </Link>
        }
      />
      {filtered.length ? (
        <div className="alpha-table-wrap">
          <Table>
            <TableHeader>
              <TableRow className="alpha-table-header">
                <TableHead>Content</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Heuristic</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Saves</TableHead>
                <TableHead>Shares</TableHead>
                <TableHead>Follows</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const selected = item.id === selectedContentId;
                return (
                  <TableRow
                    key={item.id}
                    className={cn("alpha-content-row", selected && "alpha-content-row-selected")}
                    tabIndex={0}
                    aria-selected={selected}
                    onClick={() => onSelectContent(item.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelectContent(item.id);
                      }
                    }}
                  >
                    <TableCell>
                      <div className="alpha-content-cell">
                        <span className={cn("alpha-thumbnail", `alpha-thumbnail-${item.thumbnailTone ?? "cyan"}`)}>
                          <Sparkles size={14} aria-hidden="true" />
                        </span>
                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.pipelineStageId} · Instagram target</small>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{item.type}</TableCell>
                    <TableCell>
                      <span className="alpha-table-score">{item.viralScore ?? "-"}</span>
                    </TableCell>
                    <TableCell>{compactNumber(item.views)}</TableCell>
                    <TableCell>{compactNumber(item.saves)}</TableCell>
                    <TableCell>{compactNumber(item.shares)}</TableCell>
                    <TableCell>{compactNumber(item.follows)}</TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="alpha-row-action" aria-label={`Actions for ${item.title}`}>
                            <Ellipsis size={17} aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="alpha-menu w-48">
                          <DropdownMenuItem onSelect={() => onAction("Open", item)}>
                            <ExternalLink size={15} aria-hidden="true" />
                            Open
                          </DropdownMenuItem>
                          {item.pipelineStageId === "review" ? (
                            <>
                              <DropdownMenuItem onSelect={() => onAction("Approve", item)}>
                                <CheckCircle2 size={15} aria-hidden="true" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem variant="destructive" onSelect={() => onAction("Reject", item)}>
                                <XCircle size={15} aria-hidden="true" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : availability === "unavailable" ? (
        <EmptyState
          title="Content library unavailable"
          description="The Core content request did not complete. Other dashboard sections may still be live."
          actionLabel="Retry Core request"
          onAction={onRetry}
        />
      ) : (
        <EmptyState
          title={activeStage ? `No ${activeStage} content loaded` : "No generated content yet"}
          description="Generate a package from a ranked story to start the persistent review workflow."
          actionLabel="Open Create Flow"
          onAction={onCreate}
        />
      )}
    </AlphaCard>
  );
}
