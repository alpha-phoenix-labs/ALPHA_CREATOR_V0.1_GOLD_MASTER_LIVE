import { ArrowLeft, Construction, Sparkles } from "lucide-react";
import Link from "next/link";

import { AlphaCard, AlphaPrimaryButton, StatusBadge } from "@/components/alpha/alpha-ui";

const screenCopy: Record<string, { title: string; description: string; contract: string }> = {
  discover: {
    title: "Dedicated discovery route pending",
    description: "Real ranked Core stories are already available in Top Opportunities on the Dashboard. A separate discovery workspace is outside V0.1.",
    contract: "DashboardApiAdapter → GET /api/v1/stories",
  },
  create: {
    title: "V0.1 Create Flow is available as a dialog",
    description: "Use the button below to select a real ranked story and generate a source-grounded review package through ALPHA Core.",
    contract: "DashboardService → POST /api/v1/stories/{story_id}/generate",
  },
  content: {
    title: "Persistent Content Library active",
    description: "The Content route uses the integrated Dashboard surface for opening packages and storing real approve/reject decisions.",
    contract: "DashboardApiAdapter → GET/POST /api/v1/content",
  },
  experiments: {
    title: "Experiments unavailable in V0.1",
    description: "No experiment service or persistence contract exists in the current Core, so this route does not simulate one.",
    contract: "Pending future scope - no active adapter",
  },
  analytics: {
    title: "Instagram analytics unavailable in V0.1",
    description: "The integrated dashboard shows real Core workflow counters only. Reach, views, saves, shares and follows are not mocked.",
    contract: "Pending Instagram analytics scope - no active adapter",
  },
  intelligence: {
    title: "Dedicated intelligence route pending",
    description: "The Dashboard intelligence panel already maps stored Core packages into preview, heuristic score and grounded insights.",
    contract: "DashboardApiAdapter → persisted ContentItem payload",
  },
  settings: {
    title: "Settings unavailable in V0.1",
    description: "Account connections and workspace policy have no current Core contract and are not simulated.",
    contract: "Pending future scope - no active adapter",
  },
};

export function PlaceholderScreen({ route, onNewContent }: { route: string; onNewContent: () => void }) {
  const copy = screenCopy[route] ?? screenCopy.content;
  return (
    <div className="alpha-placeholder-screen">
      <AlphaCard className="alpha-placeholder-card">
        <div className="alpha-placeholder-symbol" aria-hidden="true">
          <Construction size={24} />
        </div>
        <StatusBadge label="Pending V0.1" tone="warning" />
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
        <div className="alpha-contract-note">
          <Sparkles size={18} aria-hidden="true" />
          <div>
            <strong>Current contract status</strong>
            <p>{copy.contract}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <AlphaPrimaryButton onClick={onNewContent}>Open real V0.1 Create Flow</AlphaPrimaryButton>
          <Link href="/dashboard" className="alpha-link-button">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Dashboard
          </Link>
        </div>
      </AlphaCard>
    </div>
  );
}
