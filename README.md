# Workflow Visualizer

Interactive viewer for Frappe/ERPNext workflow exports, built with React + React Flow.
Pick a workflow from the searchable list (or upload your own CSV) to see its states and
transitions laid out automatically, inspect any state, export PNG/SVG, and **simulate** a
document moving through the workflow by clicking transition actions.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
```

The CSV at the project root is converted to `src/workflows.json` automatically before
`dev`/`build` (see `scripts/convert-csv.js`). Drop in a new `*.csv` and restart, or use
the in-app **Upload CSV** button.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repo (default branch `main`).
2. In the repo: **Settings → Pages → Build and deployment → Source = GitHub Actions**.
3. Every push to `main` builds and publishes via `.github/workflows/deploy.yml`.

The site URL appears in the Actions run and under Settings → Pages
(`https://<user>.github.io/<repo>/`).
