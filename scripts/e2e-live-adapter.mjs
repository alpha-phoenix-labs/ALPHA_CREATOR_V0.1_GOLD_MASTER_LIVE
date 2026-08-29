import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const frontendOrigin = process.env.ALPHA_E2E_FRONTEND_ORIGIN || "http://127.0.0.1:4173";
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root: projectRoot,
  resolve: { alias: { "@": projectRoot } },
  server: {
    middlewareMode: true,
    hmr: false,
    watch: { ignored: ["**/.venv/**", "**/node_modules/**", "**/dist/**"] },
  },
});

try {
  const htmlResponse = await fetch(`${frontendOrigin}/dashboard`, {
    headers: { accept: "text/html" },
  });
  assert.equal(htmlResponse.status, 200);
  const html = await htmlResponse.text();
  assert.match(html, /ALPHA CREATOR/);
  assert.match(html, /Scan Sources/);

  const { DashboardApiAdapter } = await vite.ssrLoadModule("/adapters/dashboard.api.adapter.ts");
  const { DashboardService } = await vite.ssrLoadModule("/services/dashboard.service.ts");
  const service = new DashboardService(
    new DashboardApiAdapter(`${frontendOrigin}/api/v1`),
  );

  const scan = await service.scanRadar();
  assert.ok(scan.sourcesSucceeded >= 3, scan);
  assert.ok(scan.rawItems >= 5, scan);

  const rankedDashboard = await service.getDashboard("7d");
  assert.equal(rankedDashboard.availability.stories, "real");
  assert.ok(rankedDashboard.opportunities.length > 0, rankedDashboard);
  const storyId = rankedDashboard.opportunities[0].id;

  const generated = await service.generateFromOpportunity(storyId);
  assert.equal(generated.status, "review");

  const reviewDashboard = await service.getDashboard("7d");
  const reviewContent = reviewDashboard.recentContent.find(
    (item) => item.id === generated.contentId,
  );
  assert.ok(reviewContent, reviewDashboard);
  assert.equal(reviewContent.pipelineStageId, "review");
  assert.ok(reviewDashboard.intelligenceByContentId[generated.contentId]);
  assert.equal(reviewContent.analyticsAvailability, "unavailable");

  const approved = await service.decideContent(
    generated.contentId,
    "approved",
    "Automated integrated premium frontend live E2E verification",
  );
  assert.equal(approved.status, "approved");

  const reloadedService = new DashboardService(
    new DashboardApiAdapter(`${frontendOrigin}/api/v1`),
  );
  const reloadedDashboard = await reloadedService.getDashboard("7d");
  const storedContent = reloadedDashboard.recentContent.find(
    (item) => item.id === generated.contentId,
  );
  assert.ok(storedContent, reloadedDashboard);
  assert.equal(storedContent.pipelineStageId, "approved");

  console.log("LIVE_PREMIUM_E2E_OK", {
    sources: scan.sourcesSucceeded,
    rawItems: scan.rawItems,
    clusters: scan.uniqueClusters,
    storyId,
    contentId: generated.contentId,
    reloadedStatus: storedContent.pipelineStageId,
  });
} finally {
  await vite.close();
}
