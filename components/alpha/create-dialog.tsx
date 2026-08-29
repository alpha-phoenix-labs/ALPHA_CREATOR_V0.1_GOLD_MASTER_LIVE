"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

import { AlphaPrimaryButton, AlphaSecondaryButton, StatusBadge } from "@/components/alpha/alpha-ui";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Opportunity } from "@/types/dashboard";

export function CreateContentDialog({
  open,
  onOpenChange,
  opportunities,
  seedOpportunityId,
  generating,
  onGenerate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunities: Opportunity[];
  seedOpportunityId?: string;
  generating: boolean;
  onGenerate: (opportunity: Opportunity) => void;
}) {
  const [manualSelectedId, setManualSelectedId] = useState<string>();
  const requestedId = manualSelectedId ?? seedOpportunityId;
  const selectedId = opportunities.some((opportunity) => opportunity.id === requestedId)
    ? requestedId
    : opportunities[0]?.id;

  const selected = useMemo(
    () => opportunities.find((opportunity) => opportunity.id === selectedId),
    [opportunities, selectedId],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="alpha-dialog max-h-[92svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <p className="alpha-eyebrow">CREATE FLOW · REAL CORE DATA</p>
          <DialogTitle className="text-xl">Generate a content package</DialogTitle>
          <DialogDescription>
            V0.1 generation starts from a ranked, source-grounded Core story. Free-form briefs are not supported by the current Core contract.
          </DialogDescription>
        </DialogHeader>

        {opportunities.length ? (
          <>
            <label className="alpha-field mt-2">
              <span>Ranked story</span>
              <Select value={selectedId} onValueChange={setManualSelectedId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a ranked story" />
                </SelectTrigger>
                <SelectContent>
                  {opportunities.map((opportunity) => (
                    <SelectItem key={opportunity.id} value={opportunity.id}>
                      {opportunity.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            {selected ? (
              <Tabs defaultValue="story" className="mt-3">
                <TabsList className="alpha-tabs-list">
                  <TabsTrigger value="story">Story</TabsTrigger>
                  <TabsTrigger value="signals">Core signals</TabsTrigger>
                  <TabsTrigger value="safety">Validation</TabsTrigger>
                </TabsList>
                <TabsContent value="story" className="pt-4">
                  <div className="alpha-contract-note">
                    <Sparkles size={18} aria-hidden="true" />
                    <div>
                      <strong>{selected.title}</strong>
                      <p>{selected.summary}</p>
                      <span className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge label={selected.sourceName} tone="cyan" />
                        <StatusBadge label={`${selected.sourceCount} source${selected.sourceCount === 1 ? "" : "s"}`} />
                      </span>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="signals" className="pt-4">
                  <div className="alpha-contract-note">
                    <Sparkles size={18} aria-hidden="true" />
                    <div>
                      <strong>Heuristic Core score: {selected.score}/100</strong>
                      <p>
                        Topic momentum {selected.topicMomentum ?? "-"} · Audience fit {selected.audienceFit ?? "-"} · Visual demonstrability {selected.visualDemonstrability ?? "-"}
                      </p>
                      <small>{selected.scoringVersion} · not a viral probability</small>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="safety" className="pt-4">
                  <div className="alpha-contract-note">
                    <ShieldCheck size={18} aria-hidden="true" />
                    <div>
                      <strong>Source-grounded V0.1 generation</strong>
                      <p>
                        The Core creates the structured package, enforces a source basis and keeps the result in review until an explicit human decision is stored.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : null}
          </>
        ) : (
          <div className="alpha-contract-note mt-3">
            <Sparkles size={18} aria-hidden="true" />
            <div>
              <strong>No ranked story available</strong>
              <p>Close this dialog and run the real RSS scan before starting generation.</p>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <AlphaSecondaryButton onClick={() => onOpenChange(false)}>Cancel</AlphaSecondaryButton>
          <AlphaPrimaryButton
            disabled={!selected || generating}
            onClick={() => selected && onGenerate(selected)}
          >
            {generating ? "Generating with Core..." : "Generate review package"}
            <ArrowRight size={16} aria-hidden="true" />
          </AlphaPrimaryButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
