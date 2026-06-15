// Converts the Frappe/ERPNext workflow CSV export into workflows.json
// consumed by the React app. Run automatically before `dev`/`build`.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { workflowsFromCsv } from "../src/parseWorkflows.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Find the CSV (handles the "Workflow (1).csv" name or any *.csv at root).
const csvFile = readdirSync(root).find((f) => f.toLowerCase().endsWith(".csv"));
if (!csvFile) {
  console.error("No .csv file found in project root.");
  process.exit(1);
}

const workflows = workflowsFromCsv(readFileSync(join(root, csvFile), "utf8"));

const outDir = join(root, "src");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "workflows.json"), JSON.stringify(workflows, null, 2));

console.log(
  `Parsed ${workflows.length} workflows from "${csvFile}" -> src/workflows.json`
);
