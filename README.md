# BSCS Semester 2 Study Companion

A mobile-first, syllabus-led study site for seven BSCS courses. Phase 1 is a fully static Vite + React application: it has no account system, API keys, backend, database, AI chat, remote grading, analytics, or tracking.

## Run locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open the URL printed by Vite. The production build uses the repository base path `/bscs-semester-2-ai-tutor/` and hash routes, so subject links and direct refreshes work on GitHub Pages without server rewrites.

## Quality commands

```bash
npm run generate  # rebuild checked-in curriculum JSON from root Markdown
npm test          # unit and interaction regression tests
npm run build     # regenerate curriculum and create the static dist/ output
npm run check     # generation, tests, and production build
```

## Curriculum data

The seven Markdown files in the repository root are authoritative and must remain unchanged. `scripts/build-syllabus-data.mjs` reads every required file and writes deterministic JSON to `src/data/syllabi/`.

The normalizer:

- retains week, topic, and nested subtopic order;
- presents exam headings as curriculum milestones;
- stores quizzes, assignments, and presentations as assessment metadata rather than lessons;
- fails when a required weekly plan or its topics are missing.

Commit regenerated JSON whenever a root syllabus changes.

## Deployment

`.github/workflows/deploy-pages.yml` tests and builds every push to `main`, then uploads `dist/` to GitHub Pages. In the repository settings, set **Pages → Source** to **GitHub Actions**. No secrets are required.

## Accessibility and responsive checklist

The UI is designed and checked for 320px mobile, tablet, and desktop widths:

- semantic header, main, footer, navigation, headings, buttons, fieldsets, and status feedback;
- a keyboard-visible skip link and high-contrast focus outline;
- native keyboard-operable details, links, radio controls, and buttons;
- non-color-only quiz feedback using text and symbols;
- wrapping/min-width safeguards to prevent horizontal page overflow;
- reduced-motion support.

Before publishing, run `npm run check`, then inspect the built site at 320px, 768px, and 1280px using browser responsive tools and complete a keyboard-only pass (Tab, Shift+Tab, Enter, Space, arrow keys for radio choices).
