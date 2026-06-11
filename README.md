# stream-tree-demo

A minimal proof-of-concept: **streaming a gradually-revealing tree of async nodes** to the browser with React Router v7 (framework mode, Single Fetch).

Each node is fetched independently with its own latency, and the loader returns a **recursive promise tree** — a promise that resolves to an object containing more promises. RR7's `turbo-stream` serialization walks those nested promises and flushes each as it settles, so every node pops into the UI the moment its own fetch lands, parents before children.

This models the shape of a content entry (model → component → nested component), to explore whether the whole tree could be streamed instead of lazy-loaded on expand.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

Open in a browser and watch nodes flip from ⏳ to ✅ over ~16s. Each resolved node shows `revealed @ <ms>` — the staggered values are the proof that nodes stream in independently rather than all at once.

## Key files

- **`app/tree.server.ts`** — the fake "content API": a static tree + per-node latency, and `loadNode(id)`, the recursive promise-tree builder. The discipline: never `await` inside it, or a branch collapses into one blocking chunk instead of streaming per-node.
- **`app/routes/home.tsx`** — the loader returns one un-awaited `root` promise; a recursive `<Node>` component renders each child with its own `<Suspense>` / `<Await>` boundary.
- **`app/entry.server.tsx`** — note `streamTimeout` is raised to 30s; the SSR stream stays open until the deepest branch resolves, and the server aborts (rejecting unresolved boundaries) past that.

## Things worth knowing

- A `navigate`/`goto` in browser-automation tooling waits for the `load` event, which for a streamed document fires only when the whole stream finishes — so a single post-load screenshot shows the final tree, not the reveal. The per-node `revealed @ ms` badges exist to make the staggered timing observable after the fact.
- `curl` is detected as a bot by `isbot`, so it gets the buffered `onAllReady` path (everything at once). Use a browser User-Agent to see the streamed `onShellReady` path.
- Identity-stable keys matter once a list can reorder; this demo uses index keys, which is fine only because the tree is append-only.
