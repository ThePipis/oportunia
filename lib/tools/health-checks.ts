/**
 * Health checks per external tool.
 * Returns { ok: boolean, latencyMs: number, error?: string }
 */

export interface HealthCheckResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
  meta?: Record<string, unknown>;
}

async function checkWithTimeout(
  fn: () => Promise<Response>,
  timeoutMs: number = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fn();
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkGooglePlaces(
  apiKey: string
): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    // Use a text search with a generic query. This doesn't depend on any
    // specific Place ID (which can be retired by Google), and a 200
    // response — even with 0 results — confirms the API key + billing +
    // Places API (New) are all working.
    const res = await checkWithTimeout(() =>
      fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id",
        },
        body: JSON.stringify({
          textQuery: "test",
          maxResultCount: 1,
        }),
      })
    );
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        latencyMs,
        error: `HTTP ${res.status}: ${body.slice(0, 200)}`,
      };
    }
    const data = await res.json();
    return {
      ok: true,
      latencyMs,
      meta: { places_returned: data.places?.length ?? 0 },
    };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, error: e.message };
  }
}

export async function checkYelp(apiKey: string): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const res = await checkWithTimeout(() =>
      fetch(
        "https://api.yelp.com/v3/businesses/search?location=Eastvale,CA&limit=1",
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      )
    );
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        latencyMs,
        error: `HTTP ${res.status}: ${body.slice(0, 200)}`,
      };
    }
    return { ok: true, latencyMs, meta: { endpoint: "businesses/search" } };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, error: e.message };
  }
}

export async function checkTavily(apiKey: string): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const res = await checkWithTimeout(() =>
      fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query: "test",
          max_results: 1,
        }),
      })
    );
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        latencyMs,
        error: `HTTP ${res.status}: ${body.slice(0, 200)}`,
      };
    }
    return { ok: true, latencyMs, meta: { endpoint: "search" } };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, error: e.message };
  }
}

export async function checkFirecrawl(
  apiKey: string
): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const res = await checkWithTimeout(() =>
      fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url: "https://example.com",
          formats: ["markdown"],
          onlyMainContent: true,
        }),
      })
    );
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        latencyMs,
        error: `HTTP ${res.status}: ${body.slice(0, 200)}`,
      };
    }
    return { ok: true, latencyMs, meta: { endpoint: "scrape" } };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, error: e.message };
  }
}

export async function checkBraveSearch(
  apiKey: string
): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const res = await checkWithTimeout(() =>
      fetch(
        "https://api.search.brave.com/res/v1/web/search?q=test&count=1",
        {
          headers: {
            "X-Subscription-Token": apiKey,
            Accept: "application/json",
          },
        }
      )
    );
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        latencyMs,
        error: `HTTP ${res.status}: ${body.slice(0, 200)}`,
      };
    }
    return { ok: true, latencyMs, meta: { endpoint: "web/search" } };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, error: e.message };
  }
}

export async function checkGemini(apiKey: string): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const res = await checkWithTimeout(() =>
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      )
    );
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        latencyMs,
        error: `HTTP ${res.status}: ${body.slice(0, 200)}`,
      };
    }
    const data = await res.json();
    return {
      ok: true,
      latencyMs,
      meta: { models: data.models?.slice(0, 3).map((m: any) => m.name) ?? [] },
    };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, error: e.message };
  }
}

export async function checkLocalLLM(
  endpoint: string
): Promise<HealthCheckResult> {
  const start = Date.now();
  const candidates = [
    endpoint,
    "http://192.168.1.28:11434",
    "http://100.119.37.120:11434",
    "http://127.0.0.1:11434",
  ].filter(Boolean);

  // Deduplicate URLs
  const uniqueUrls = Array.from(new Set(candidates.map((u) => u.replace(/\/+$/, ""))));

  let lastError = "No se pudo conectar con el servidor local llama.cpp";

  for (const baseUrl of uniqueUrls) {
    try {
      const res = await checkWithTimeout(
        () =>
          fetch(`${baseUrl}/v1/models`, {
            method: "GET",
            headers: { Accept: "application/json" },
          }),
        4000
      );

      if (res.ok) {
        const latencyMs = Date.now() - start;
        const data = await res.json();
        const models = (
          data.models?.map((m: any) => m.name || m.model) ??
          data.data?.map((m: any) => m.id) ??
          []
        ).filter(Boolean);
        const activeModel = models[0] || "Qwen3.8-27B (VRAM Activo)";
        return {
          ok: true,
          latencyMs,
          meta: { activeModel, models, reachableEndpoint: baseUrl },
        };
      }
    } catch (e: any) {
      lastError = e.message;
    }
  }

  return { ok: false, latencyMs: Date.now() - start, error: lastError };
}

export async function checkAgentReach(
  _endpoint?: string
): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const res = await checkWithTimeout(() =>
      fetch("https://raw.githubusercontent.com/Panniantong/agent-reach/main/README.md", {
        method: "HEAD",
      })
    );
    const latencyMs = Date.now() - start;
    return {
      ok: res.ok,
      latencyMs,
      meta: {
        engine: "Agent-Reach CLI & Social Engine",
        channels: ["Twitter/X", "Reddit", "YouTube", "Web Scraper", "GitHub", "Instagram"],
        cost: "Zero API Fees ($0/mo)",
      },
    };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, error: e.message };
  }
}

export const HEALTH_CHECKS: Record<string, (key: string) => Promise<HealthCheckResult>> = {
  "google-places": checkGooglePlaces,
  "yelp-fusion": checkYelp,
  "tavily": checkTavily,
  "firecrawl": checkFirecrawl,
  "brave-search": checkBraveSearch,
  "gemini-pro": checkGemini,
  "llama-local": checkLocalLLM,
  "agent-reach": checkAgentReach,
};
