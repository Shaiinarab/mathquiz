# Adaptive Knowledge Quiz

Minimal, data-driven quiz that simulates broad knowledge probing with a manual setup wizard and a divide-and-conquer adaptive engine.

## Run

Open `index.html` in a browser (no build, no dependencies).

```bash
# from this directory
xdg-open index.html   # linux
# or: python3 -m http.server 8000  then visit http://localhost:8000
```

## How it works

1. **Wizard (manual setup):** choose profession/goal and skillset/domain, optionally bias focus topics.
2. **Seed probes:** asks mid-difficulty questions from different branches (e.g. integrals and matrices) to bisect the knowledge space.
3. **Divide-and-conquer narrowing:** tracks confidence per branch, raises/lowers target difficulty after correct/incorrect answers, and routes next questions to the most uncertain branch until confidence is sufficient or the budget is reached.
4. **Profile:** reports per-branch estimated level from accuracy weighted by difficulty faced, plus a method trace.

## Method notes (science/logic)

- **Divide and conquer:** partition domain into branches, probe each, then recurse into uncertain regions.
- **Difficulty bisection:** adaptive target difficulty moves up/down to bound ability (CAT-like heuristic).
- **Evidence model:** level ~ accuracy × average difficulty attempted; branch confidence grows with observations.
- **Data-driven:** domains, topic trees, and questions live in `data.js` so new professions/skillsets are added without changing engine logic.

## Extend

Edit `data.js`:

- Add a profession in `professions` and list its `domains`.
- Add a domain under `domains` with `label`, `description`, `tree` (branches/children), and `questions`.
- Question shape: `{ id, topic, parent, difficulty(1-5), prompt, choices, answer(index), concept }`.

Keep `parent` aligned with a tree node `id` so the engine can route probes correctly.

## Limits (by design, ponytail)

- Heuristic estimator, not calibrated IRT/Bayesian network.
- Small sample question bank per domain; add items to improve coverage.
- Client-side only; no persistence, no auth.
- Skipped: spaced repetition, prerequisite DAG inference, timed mode, analytics export — add when needed.
