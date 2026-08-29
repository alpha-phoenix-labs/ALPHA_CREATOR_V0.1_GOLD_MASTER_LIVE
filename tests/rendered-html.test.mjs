import assert from "node:assert/strict";
import test from "node:test";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
}

const environment = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};

const context = {
  waitUntil() {},
  passThroughOnException() {},
};

async function render(pathname) {
  const worker = await loadWorker();
  const response = await worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    environment,
    context,
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  return response.text();
}

test("renders integrated metadata and premium dashboard shell", async () => {
  const html = await render("/dashboard");
  assert.match(html, /<title>ALPHA CREATOR V0\.1/i);
  assert.match(html, /Dashboard/);
  assert.match(html, /Overview of your content intelligence engine/);
  assert.match(html, /Scan Sources/);
  assert.match(html, /ALPHA CREATOR/);
  assert.doesNotMatch(html, /Starter Project/);
  assert.doesNotMatch(html, /Live mock/);
});

test("renders content library route in the shared real-data dashboard", async () => {
  const html = await render("/content");
  assert.match(html, /Open and review your persistent Core content library/);
  assert.match(html, /Scan Sources/);
  assert.doesNotMatch(html, /ContentRepositoryAdapter/);
});

test("renders honest pending route states without simulated features", async () => {
  const html = await render("/analytics");
  assert.match(html, /Instagram analytics unavailable in V0\.1/);
  assert.match(html, /not mocked/);
  assert.match(html, /Pending V0\.1/);
});
