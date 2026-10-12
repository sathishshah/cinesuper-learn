# CineSuper DBMS Learning Lab

Interactive, buildless learning site for first-year BCA Database Design (26BCA0C07), Modules 1 and 2. The original assignment files in the parent directory are unchanged.

## Content

- Module 1: database concepts, architecture, data models, keys/constraints, ER/EER, and mapping to relations.
- Module 2: relational algebra, functional dependencies, 1NF–BCNF, decomposition, and denormalisation.
- 14 interactive activities and 14 knowledge checks, glossary, teacher guide, and local progress export/reset.
- The real CineSuper genres → movies → reviews schema is retained. Hypothetical extensions and teaching assumptions are labelled.
- Original explanations reference Silberschatz, Korth, and Sudarshan, Database System Concepts, 7th edition, Chapters 1, 2, 6, and 7. Scope follows the user-provided syllabus PDF.

## Run

Serve `dist/` with any static HTTP server. No build, API keys, database connection, or student sign-in is required. For example: `python3 -m http.server 4173 --directory dist`.

The optional Google Fonts stylesheet falls back to system sans-serif when unavailable. All learning activities run locally. Progress is stored in localStorage for the current origin/browser, not a faculty gradebook. Practice data never changes Supabase.

## Files

- `dist/index.html`: accessible application shell.
- `dist/style.css`: responsive layout and visual design.
- `dist/lessons.js`: course content, small teaching dataset, glossary.
- `dist/app.js`: routes, exercises, feedback, and persistence.
- `dist/interactive.js`: hands-on labs that replace two app.js labs. Lesson 2: an animated 1-, 2- and 3-tier request simulator, a drag-to-sort scenario activity, and the abstraction-levels check. Lesson 4: a 1:1 / 1:N / M:N playground with real rows, plus a drag-and-drop CineSuper ER builder with crow's-foot notation that converts the diagram into tables and SQL as students edit it.
- `dist/questions.js`: the Model Questions page (`#questions`, or `#questions-q1` … `#questions-q7` for one question). It covers seven Module 1 exam questions in 28 parts. Each part has a think-first prompt, a hidden model answer (“write this in the exam” plus “understand it”) and a self-rating saved in the browser. Every question ends with an activity, and ER diagrams use Chen notation.
- `.openai/hosting.json`: Sites identity and static deployment settings.

## Validation

`tests/model-questions.cjs` checks every Model Questions activity. `tests/learning-flow.cjs` uses the locally supplied Playwright library and installed Chrome in an isolated browser. Adjust the two environment-specific library/browser paths for another machine. It verifies every lab and quiz, wrong-answer feedback, primary/foreign key and domain failures, projection, joins, lossless/lossy outputs, persistence, glossary search, export/reset, and mobile overflow. All checks passed on 9 October 2026. No browser JavaScript errors were observed.

Live site: https://sathishshah.github.io/cinesuper-learn/ — deployed from `dist/` by `.github/workflows/pages.yml` on every push to main.
