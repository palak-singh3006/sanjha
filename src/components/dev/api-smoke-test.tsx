"use client";

import { useCallback, useState } from "react";

type CheckState = "idle" | "loading" | "ok" | "error";

function errorMessageFromResponse(body: Record<string, unknown>, statusText: string) {
  const hint = body.hint;
  const e = body.error;
  let base: string;
  if (typeof e === "string") base = e;
  else if (e && typeof e === "object" && "message" in e) {
    base = String((e as { message: unknown }).message);
  } else if (typeof body.message === "string") base = body.message;
  else {
    const s = JSON.stringify(body);
    base = s !== "{}" ? s : statusText;
  }
  if (typeof hint === "string" && hint.length > 0) {
    return `${base} — ${hint}`;
  }
  return base;
}

function JsonBlock({ label, data }: { label: string; data: unknown }) {
  return (
    <details className="rounded-lg border border-[var(--foreground)]/15 bg-[var(--foreground)]/5 p-3 text-left">
      <summary className="cursor-pointer text-sm font-medium">{label}</summary>
      <pre className="mt-2 max-h-48 overflow-auto text-xs text-[var(--foreground)]/80">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

export function ApiSmokeTest() {
  const [weather, setWeather] = useState<unknown>(null);
  const [listings, setListings] = useState<unknown>(null);
  const [mandi, setMandi] = useState<unknown>(null);
  const [states, setStates] = useState({
    weather: "idle" as CheckState,
    listings: "idle" as CheckState,
    mandi: "idle" as CheckState,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const runChecks = useCallback(async () => {
    setErrors({});
    setStates({ weather: "loading", listings: "loading", mandi: "loading" });

    const w = fetch("/api/weather?lat=13.13&lng=78.13").then(async (r) => {
      const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      if (!r.ok) throw new Error(errorMessageFromResponse(j, r.statusText));
      return j;
    });
    const l = fetch("/api/listings").then(async (r) => {
      const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      if (!r.ok) throw new Error(errorMessageFromResponse(j, r.statusText));
      return j;
    });
    const m = fetch("/api/mandi?crop=Tomato&state=Karnataka").then(async (r) => {
      const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      if (!r.ok) throw new Error(errorMessageFromResponse(j, r.statusText));
      return j;
    });

    try {
      setWeather(await w);
      setStates((s) => ({ ...s, weather: "ok" }));
    } catch (err) {
      setStates((s) => ({ ...s, weather: "error" }));
      setErrors((prev) => ({
        ...prev,
        weather: err instanceof Error ? err.message : "Weather request failed",
      }));
    }

    try {
      setListings(await l);
      setStates((s) => ({ ...s, listings: "ok" }));
    } catch (err) {
      setStates((s) => ({ ...s, listings: "error" }));
      setErrors((prev) => ({
        ...prev,
        listings: err instanceof Error ? err.message : "Listings request failed",
      }));
    }

    try {
      setMandi(await m);
      setStates((s) => ({ ...s, mandi: "ok" }));
    } catch (err) {
      setStates((s) => ({ ...s, mandi: "error" }));
      setErrors((prev) => ({
        ...prev,
        mandi: err instanceof Error ? err.message : "Mandi request failed",
      }));
    }
  }, []);

  const badge = (key: keyof typeof states) => {
    const st = states[key];
    const cls =
      st === "ok"
        ? "bg-emerald-500/20 text-emerald-200"
        : st === "error"
          ? "bg-red-500/20 text-red-200"
          : st === "loading"
            ? "bg-amber-500/20 text-amber-200"
            : "bg-[var(--foreground)]/10 text-[var(--foreground)]/60";
    return <span className={`rounded px-2 py-0.5 text-xs font-medium ${cls}`}>{st}</span>;
  };

  return (
    <section className="w-full max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runChecks}
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Run API checks
        </button>
        <p className="text-sm text-[var(--foreground)]/60">
          Calls <code className="rounded bg-[var(--foreground)]/10 px-1">/api/weather</code>,{" "}
          <code className="rounded bg-[var(--foreground)]/10 px-1">/api/listings</code>,{" "}
          <code className="rounded bg-[var(--foreground)]/10 px-1">/api/mandi</code>
        </p>
      </div>

      <ul className="flex flex-wrap gap-4 text-sm">
        <li className="flex items-center gap-2">
          Weather {badge("weather")}
        </li>
        <li className="flex items-center gap-2">
          Listings {badge("listings")}
        </li>
        <li className="flex items-center gap-2">Mandi {badge("mandi")}</li>
      </ul>

      {Object.keys(errors).length > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {Object.entries(errors).map(([k, msg]) => (
            <p key={k}>
              <strong>{k}:</strong> {msg}
            </p>
          ))}
        </div>
      )}

      {states.weather === "ok" && weather != null ? <JsonBlock label="Weather response" data={weather} /> : null}
      {states.listings === "ok" && listings != null ? (
        <JsonBlock label="Listings response" data={listings} />
      ) : null}
      {states.mandi === "ok" && mandi != null ? <JsonBlock label="Mandi response" data={mandi} /> : null}

      <p className="text-xs text-[var(--foreground)]/50">
        <a className="text-emerald-400 underline" href="/api/debug-env" target="_blank" rel="noreferrer">
          debug-env
        </a>{" "}
        ·{" "}
        <a className="text-emerald-400 underline" href="/api/debug-supabase" target="_blank" rel="noreferrer">
          debug-supabase
        </a>
      </p>
    </section>
  );
}
