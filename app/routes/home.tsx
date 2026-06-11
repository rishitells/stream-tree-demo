import { Suspense, useState, useEffect } from "react";
import { Await } from "react-router";
import type { Route } from "./+types/home";
import { loadNode, type StreamedNode } from "../tree.server";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Streamed async tree" }];
}

// Return ONE un-awaited promise. turbo-stream (Single Fetch) walks the nested
// promises it resolves to and flushes each as it settles.
export function loader() {
  return { root: loadNode("root") };
}

// Stamp the moment this node actually revealed on the client, relative to page
// load. Staggered values across nodes = proof each streamed in independently.
function RevealBadge() {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => setMs(Math.round(performance.now())), []);
  return (
    <span className="badge" data-revealed-ms={ms ?? ""}>
      {ms === null ? "" : ` · revealed @ ${ms}ms`}
    </span>
  );
}

function Node({ promise }: { promise: Promise<StreamedNode> }) {
  return (
    <li>
      <Suspense fallback={<span className="pending">⏳ loading…</span>}>
        <Await resolve={promise}>
          {(node) => (
            <>
              <span className="ready">✅ {node.label}</span>
              <RevealBadge />
              {node.children.length > 0 && (
                <ul>
                  {node.children.map((child, i) => (
                    <Node key={i} promise={child} />
                  ))}
                </ul>
              )}
            </>
          )}
        </Await>
      </Suspense>
    </li>
  );
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>Streamed async tree</h1>
      <p style={{ color: "#666" }}>
        Each node fetches independently and pops in as its own promise settles.
      </p>
      <ul style={{ lineHeight: 1.9 }}>
        <Node promise={loaderData.root} />
      </ul>
      <style>{`
        .pending{color:#b58900}
        .ready{color:#1a7f37;font-weight:600}
        .badge{color:#999;font-size:.85em}
        ul{list-style:none;margin:0;padding:0}
        li{padding-left:0}
        li ul{margin-left:.6rem;padding-left:1rem;border-left:2px solid #e2e2e2}
      `}</style>
    </main>
  );
}
