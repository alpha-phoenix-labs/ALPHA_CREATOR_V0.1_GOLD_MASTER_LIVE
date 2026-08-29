import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

test("premium dashboard wires the complete V0.1 workflow through service and adapter layers", async () => {
  const dashboard = await readFile(path.join(root, "components/dashboard/alpha-creator-app.tsx"), "utf8");
  const service = await readFile(path.join(root, "services/dashboard.service.ts"), "utf8");
  const adapter = await readFile(path.join(root, "adapters/dashboard.api.adapter.ts"), "utf8");
  const proxy = await readFile(path.join(root, "app/api/v1/[...path]/route.ts"), "utf8");

  assert.match(dashboard, /dashboardService\.scanRadar/);
  assert.match(dashboard, /dashboardService\.generateFromOpportunity/);
  assert.match(dashboard, /dashboardService\.decideContent/);
  assert.match(dashboard, /ContentReviewDetails/);
  assert.doesNotMatch(dashboard, /dashboard\.mock/);
  assert.match(service, /DashboardApiAdapter/);
  assert.match(adapter, /\/radar\/scan/);
  assert.match(adapter, /\/stories\/\$\{encodeURIComponent\(storyId\)\}\/generate/);
  assert.match(adapter, /\/content\/\$\{encodeURIComponent\(contentId\)\}\/decision/);
  assert.match(adapter, /Instagram analytics unavailable/);
  assert.match(proxy, /ALPHA_BACKEND_URL/);
  assert.match(proxy, /\/api\/v1\//);
});

test("integration leaves backend Core contracts unchanged", async () => {
  const router = await readFile(path.join(root, "backend/app/api/router.py"), "utf8");
  const schemas = await readFile(path.join(root, "backend/app/schemas/content.py"), "utf8");

  for (const endpoint of [
    '"/radar/scan"',
    '"/stories"',
    '"/stories/{story_id}/generate"',
    '"/content"',
    '"/content/{content_id}/decision"',
    '"/dashboard/stats"',
  ]) {
    assert.match(router, new RegExp(endpoint.replace(/[{}]/g, "\\$&")));
  }
  assert.match(schemas, /class ContentPackage/);
  assert.match(schemas, /class DecisionInput/);
});
