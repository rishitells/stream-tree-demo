// Fake "content" graph. Stands in for the Content API.
// One node = { label, childIds }. Think of it as an entry with scalar fields
// (label) and component fields (children) that are themselves entries.
type RawNode = { label: string; childIds: string[] };

const TREE: Record<string, RawNode> = {
  root: { label: "Root", childIds: ["a", "b"] },
  a: { label: "Node A", childIds: ["a1", "a2"] },
  b: { label: "Node B", childIds: [] },
  a1: { label: "Node A.1", childIds: [] },
  a2: { label: "Node A.2", childIds: ["a2x"] },
  a2x: { label: "Node A.2.x", childIds: [] },
};

// Deterministic-ish staggered latency per id so the reveal is visibly gradual:
// deeper / later nodes take longer, but each fetch is independent.
const DELAYS: Record<string, number> = {
  root: 800,
  a: 2500,
  b: 5000,
  a1: 7000,
  a2: 3500,
  a2x: 9000,
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Fetch ONE node, independently, with latency. The Content API analogue.
export async function fetchNode(id: string): Promise<RawNode> {
  await sleep(DELAYS[id] ?? 500);
  const node = TREE[id];
  if (!node) throw new Response(`Unknown node: ${id}`, { status: 404 });
  return node;
}

// What a resolved, streamed node looks like on the client: scalar fields
// plus an array of *promises*, one per child, each streamed independently.
export type StreamedNode = {
  id: string;
  label: string;
  children: Promise<StreamedNode>[];
};

// The recursive promise tree. Never `await` in here — that would collapse a
// branch into a single blocking chunk instead of streaming per-node.
//
// For a real graph (cycles / shared nodes) this is where a `visited` Set +
// depth cap + memoized fetch-by-id would go. A static tree needs none of that.
export function loadNode(id: string): Promise<StreamedNode> {
  return fetchNode(id).then((node) => ({
    id,
    label: node.label,
    children: node.childIds.map(loadNode), // promises, NOT awaited
  }));
}
