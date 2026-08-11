# Used Goods Marketplace — Documentation Repository

This repo is the documentation home for the **Used Goods Marketplace**, the VinTech Challenge 2026 submission, and now also hosts the web application code. It is the single source of truth for the product, architecture, engineering, and design — and the tracker config that drives build work.

## Repo layout

```
app/                      Web application (Next.js App Router, Tailwind, shadcn/ui)
docs/
├── 00-strategy/          Winning strategy + product vision
├── 01-prd/               PRD: overview, goals, personas, stories, FR/NFR, features, flows, IA
├── 02-architecture/      System architecture, ADRs, domain model, DB/API/backend/frontend/security specs
├── 03-engineering/       Performance, testing, CI/CD, git workflow, coding standard, observability, roadmap, DoR/DoD, risk register
├── 04-design/            Design system: foundations, component standards, patterns, library, UX
└── agents/               Agent working notes (tracker conventions)
```

**Application run command:** `cd app && npm run dev` (see `app/README.md` for setup, Supabase local stack, and scripts). CI workflows live in `.github/workflows/`.

**Numbering contract.** Every folder's files are numbered from `00` upward. The folder name's leading number is the doc family; the file's leading number is its position within the family. Never introduce a gap or a duplicate when adding a doc. Design-series family prefixes (`vds`/`vcl`/`vux`) were retired; do not reintroduce them.

## Document conventions

- Each doc opens with a metadata block: `# <Doc Title>` then `> **Project:**`, `> **Version:**`, `> **Owner:**`, `> **Status:**`.
- Cross-folder links are written as relative paths from the current file, e.g. a doc in `01-prd/` links to `../02-architecture/00-system-architecture.md`. Same-folder links are bare filenames.
- Content is deliberately compact: exploded one-value-per-line formatting was collapsed into tables and inline `**Label:** value` pairs. Keep it dense; do not re-expand it.
- All files are UTF-8 and follow a loose markdown style with `#` headings and blank-separated blocks.

## Canonical references

- PRD: `docs/01-prd/00-overview.md` (entry point, with a full related-documents list)
- Build plan: `docs/03-engineering/06-implementation-roadmap.md`
- Design authority: `docs/04-design/00-design-foundations.md` (primary accent `#2563EB`)
- Decisions: `docs/02-architecture/01-architecture-decision-records.md` (ADR-001…)

## Tracker / work

- The source of truth for deliverable work is the **GitHub issue tracker** on `hamdi-ab/used-goods-marketplace`, not filenames here.
- Use the `gh` CLI for all GitHub operations. Conventions (map issue, child tickets, native blocking) live in `docs/agents/issue-tracker.md`.
- Do not change the tracker's documented conventions without also updating `issue-tracker.md`.

## Rules of thumb

- When editing a doc, keep prose dense, preserve every fact/code/token, and fix or update any relative cross-reference you affect.
- Keep the metadata block and the numbering scheme intact.
- Only create or remove docs that touch the tracker with a recorded reason; a change to a numbered file is a change the tracker may reference.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
