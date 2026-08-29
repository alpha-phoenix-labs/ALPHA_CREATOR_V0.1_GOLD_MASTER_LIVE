import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: {
    middlewareMode: true,
    hmr: false,
    watch: { ignored: ["**/.venv/**", "**/node_modules/**", "**/dist/**"] },
  },
});

after(async () => {
  await vite.close();
});

const stats = {
  sources_configured: 5,
  sources_online: 4,
  stories_total: 12,
  stories_last_24h: 7,
  content_in_review: 1,
  content_approved: 2,
  generation_mode: "Local grounded",
};

const story = {
  id: "story-1",
  title: "A grounded AI workflow update",
  summary: "The source describes a practical workflow and a visual demonstration.",
  source_name: "Official Source",
  source_type: "primary",
  url: "https://example.com/story",
  published_at: "2026-08-29T12:00:00.000Z",
  fetched_at: "2026-08-29T12:01:00.000Z",
  author: null,
  tags: ["AI Workflows"],
  entities: ["Example AI"],
  sources: [{ key: "official", name: "Official Source", url: "https://example.com/story" }],
  source_count: 1,
  status: "generated",
  score: {
    novelty: 90,
    viral_potential: 76,
    wow_factor: 70,
    practical_utility: 88,
    topic_momentum: 58,
    visual_demonstrability: 82,
    audience_fit: 91,
    originality: 80,
    share_potential: 75,
    save_potential: 84,
    alpha_relevance: 89,
    total_score: 83,
    scoring_version: "heuristic-v0.1",
    rationale: { method: "heuristic_content_score_not_viral_probability" },
  },
};

function content(status = "review") {
  return {
    id: "content-1",
    story_id: story.id,
    generation_id: "generation-1",
    status,
    content_type: "Instagram Reel",
    content_pillar: "AI Tools & Practical Workflows",
    hook: "A source-grounded hook with a practical outcome",
    caption: "A complete source-grounded caption for the integrated contract test.",
    validation_status: "VERIFIED / DEMONSTRABLE",
    pre_publish_viral_score: 81,
    payload: {
      content_type: "Instagram Reel",
      content_pillar: "AI Tools & Practical Workflows",
      target_audience: "AI-curious professionals",
      content_goal: "Explain a practical workflow",
      hook_family: "Practical proof",
      primary_viral_trigger: "Useful surprise",
      hook: "A source-grounded hook with a practical outcome",
      first_frame: "WHAT CAN YOU TEST?",
      core_idea: "Test the workflow against a bounded input.",
      reel_script: "Scene one establishes the source. Scene two shows the workflow. Scene three verifies the output.",
      scene_plan: [
        { scene: 1, duration_seconds: 3, visual: "Source", voiceover: "Source", on_screen_text: "SOURCE" },
        { scene: 2, duration_seconds: 7, visual: "Workflow", voiceover: "Workflow", on_screen_text: "WORKFLOW" },
        { scene: 3, duration_seconds: 7, visual: "Proof", voiceover: "Proof", on_screen_text: "VERIFY" },
      ],
      on_screen_text: ["SOURCE", "WORKFLOW", "VERIFY"],
      demo_proof: "Show the recorded output.",
      technology_tool: "Example AI",
      validation_status: "VERIFIED / DEMONSTRABLE",
      reel_template: "TEMPLATE A — DEMO",
      caption: "A complete source-grounded caption for the integrated contract test.",
      cta: "Save the test and verify the result.",
      hashtags: ["#AI", "#AITools", "#Workflow", "#Automation", "#Creator"],
      thumbnail_text: "TEST THE WORKFLOW",
      scores: {
        hook_strength: 86,
        wow_factor: 70,
        utility: 88,
        share_potential: 78,
        save_potential: 87,
        visual_demonstrability: 82,
        novelty: 90,
        audience_fit: 91,
        comment_potential: 66,
        follow_conversion: 72,
      },
      pre_publish_viral_score: 81,
      why_it_could_work: "It combines a current source with a concrete test.",
      what_is_being_tested: "Whether a source-first hook improves useful engagement.",
      primary_success_signal: "Sends / Reach",
      claim_check: {
        source_basis: ["https://example.com/story"],
        claims_to_verify: ["Any observed workflow improvement"],
        prohibited_claims_removed: true,
        notes: "Demonstration results still require human verification.",
      },
    },
    created_at: "2026-08-29T12:02:00.000Z",
    updated_at: "2026-08-29T12:02:00.000Z",
    generation: {
      id: "generation-1",
      provider: "local-grounded",
      model: "deterministic-v0.1",
      warning: "Local grounded mode is active.",
      created_at: "2026-08-29T12:02:00.000Z",
    },
    latest_decision: null,
  };
}

test("API adapter maps real Core contracts without inventing Instagram analytics", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).includes("/dashboard/stats")) return Response.json(stats);
    if (String(url).includes("/stories")) return Response.json([story]);
    if (String(url).includes("/content")) return Response.json([content()]);
    return Response.json({ detail: "Not found" }, { status: 404 });
  };

  const { DashboardApiAdapter } = await vite.ssrLoadModule("/adapters/dashboard.api.adapter.ts");
  const dashboard = await new DashboardApiAdapter("http://local.test/api/v1").getDashboard("7d");

  assert.equal(dashboard.metrics.find((metric) => metric.id === "stories").value, 12);
  assert.equal(dashboard.opportunities[0].id, story.id);
  assert.equal(dashboard.opportunities[0].visualDemonstrability, 82);
  assert.equal(dashboard.recentContent[0].analyticsAvailability, "unavailable");
  assert.equal(dashboard.recentContent[0].views, undefined);
  assert.equal(dashboard.intelligenceByContentId["content-1"].prediction.retention, undefined);
  assert.match(dashboard.intelligenceByContentId["content-1"].prediction.disclaimer, /not a probability/i);
  assert.equal(dashboard.pipeline.find((stage) => stage.id === "scheduled").availability, "unavailable");
  assert.equal(dashboard.nextBestAction.type, "review");
  assert.equal(dashboard.systemStatus.state, "partial");
  assert.ok(calls.some((url) => url.endsWith("/dashboard/stats")));
  assert.ok(calls.some((url) => url.endsWith("/stories?limit=10")));
  assert.ok(calls.some((url) => url.endsWith("/content?limit=100")));
});

test("API adapter preserves partial-data state when one Core request fails", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (url) => {
    if (String(url).includes("/dashboard/stats")) return Response.json(stats);
    if (String(url).includes("/stories")) return Response.json([story]);
    return Response.json({ detail: "Content unavailable" }, { status: 503 });
  };

  const { DashboardApiAdapter } = await vite.ssrLoadModule("/adapters/dashboard.api.adapter.ts");
  const dashboard = await new DashboardApiAdapter("http://local.test/api/v1").getDashboard("30d");
  assert.equal(dashboard.availability.content, "unavailable");
  assert.equal(dashboard.opportunities.length, 1);
  assert.equal(dashboard.recentContent.length, 0);
  assert.equal(dashboard.systemStatus.state, "partial");
});

test("service and API adapter execute scan, generation and persisted review decisions", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const requests = [];
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), init });
    if (String(url).endsWith("/radar/scan")) {
      return Response.json({
        scan_id: "scan-1",
        scanned_at: "2026-08-29T12:00:00.000Z",
        sources_total: 5,
        sources_succeeded: 5,
        sources_failed: 0,
        raw_items: 25,
        unique_clusters: 20,
        new_stories: 12,
        updated_stories: 8,
        collector_statuses: [],
        stories: [story],
      });
    }
    if (String(url).includes(`/stories/${story.id}/generate`)) return Response.json(content());
    if (String(url).includes("/content/content-1/decision")) {
      const body = JSON.parse(String(init.body));
      return Response.json(content(body.decision));
    }
    return Response.json({ detail: "Not found" }, { status: 404 });
  };

  const { DashboardApiAdapter } = await vite.ssrLoadModule("/adapters/dashboard.api.adapter.ts");
  const { DashboardService } = await vite.ssrLoadModule("/services/dashboard.service.ts");
  const service = new DashboardService(new DashboardApiAdapter("http://local.test/api/v1"));

  const scan = await service.scanRadar();
  assert.equal(scan.sourcesSucceeded, 5);
  assert.equal(scan.uniqueClusters, 20);
  const generated = await service.generateFromOpportunity(story.id);
  assert.equal(generated.status, "review");
  const approved = await service.decideContent("content-1", "approved", "Contract test");
  assert.equal(approved.status, "approved");
  const decisionRequest = requests.find((request) => request.url.includes("/decision"));
  assert.deepEqual(JSON.parse(String(decisionRequest.init.body)), {
    decision: "approved",
    reason: "Contract test",
  });
});

test("production UI stays isolated from fixtures and the service defaults to the API adapter", async () => {
  const dashboardUi = await readFile(path.join(root, "components/dashboard/alpha-creator-app.tsx"), "utf8");
  const service = await readFile(path.join(root, "services/dashboard.service.ts"), "utf8");
  const apiAdapter = await readFile(path.join(root, "adapters/dashboard.api.adapter.ts"), "utf8");

  assert.doesNotMatch(dashboardUi, /dashboard\.mock/);
  assert.match(service, /NEXT_PUBLIC_ALPHA_DASHBOARD_SOURCE === "mock"/);
  assert.match(service, /DashboardApiAdapter/);
  assert.match(apiAdapter, /\/api\/v1/);
  assert.match(apiAdapter, /Promise\.allSettled/);
});

test("mock-only adapter still covers empty, partial and error presentation states", async () => {
  const { DashboardService } = await vite.ssrLoadModule("/services/dashboard.service.ts");
  const { DashboardMockAdapter } = await vite.ssrLoadModule("/adapters/dashboard.mock.adapter.ts");
  const service = new DashboardService(new DashboardMockAdapter());

  const empty = await service.getDashboard("7d", "empty");
  assert.equal(empty.opportunities.length, 0);
  assert.equal(empty.recentContent.length, 0);

  const partial = await service.getDashboard("7d", "partial");
  assert.equal(partial.systemStatus.state, "partial");
  assert.equal(partial.availability.content, "unavailable");

  await assert.rejects(service.getDashboard("7d", "error"), /error-state preview/);
});

test("ALPHA V0.1 design tokens and responsive gates remain present", async () => {
  const css = await readFile(path.join(root, "app/globals.css"), "utf8");

  for (const token of [
    "--alpha-bg-0",
    "--alpha-surface-1",
    "--alpha-border-default",
    "--alpha-cyan",
    "--alpha-violet",
    "--alpha-space-6",
    "--alpha-radius-md",
    "--alpha-control-md",
    "--alpha-motion-default",
  ]) {
    assert.match(css, new RegExp(token));
  }

  assert.match(css, /@media \(max-width: 1320px\)/);
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
