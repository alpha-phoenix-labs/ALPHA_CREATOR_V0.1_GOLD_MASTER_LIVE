const DEFAULT_BACKEND = "http://127.0.0.1:8000";
const ALLOWED_METHODS = new Set(["GET", "POST"]);

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function backendOrigin() {
  const raw = process.env.ALPHA_BACKEND_URL || DEFAULT_BACKEND;
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("Invalid backend origin");
  }
  return raw.replace(/\/$/, "");
}

async function proxy(request: Request, context: RouteContext) {
  if (!ALLOWED_METHODS.has(request.method)) {
    return Response.json({ detail: "Method not allowed" }, { status: 405 });
  }

  try {
    const { path } = await context.params;
    const sourceUrl = new URL(request.url);
    const target = new URL(`${backendOrigin()}/api/v1/${path.join("/")}`);
    target.search = sourceUrl.search;

    const headers = new Headers({ Accept: "application/json" });

    if (request.method === "POST") {
      const apiToken = process.env.ALPHA_API_TOKEN;
      if (apiToken) {
        headers.set("authorization", `Bearer ${apiToken}`);
      }
    }

    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    const requestId = request.headers.get("x-request-id");
    if (requestId) headers.set("x-request-id", requestId);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    const response = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" ? undefined : await request.arrayBuffer(),
      signal: controller.signal,
      cache: "no-store",
    }).finally(() => clearTimeout(timeout));

    const responseHeaders = new Headers();
    responseHeaders.set(
      "content-type",
      response.headers.get("content-type") || "application/json",
    );
    const responseRequestId = response.headers.get("x-request-id");
    if (responseRequestId) responseHeaders.set("x-request-id", responseRequestId);
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      { detail: "The intelligence service is currently unavailable." },
      { status: 503 },
    );
  }
}

export async function GET(request: Request, context: RouteContext) {
  return proxy(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return proxy(request, context);
}

