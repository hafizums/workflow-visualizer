// Pure CSV → workflows parser shared by the build script (Node) and the
// in-browser upload feature. No platform-specific imports here.

// Minimal RFC-4180 CSV parser (handles quoted fields, escaped quotes, newlines).
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\r") {
      // ignore; handled by \n
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Turn parsed rows into the workflow objects the app renders.
export function buildWorkflows(rows) {
  if (!rows.length) return [];
  const header = rows[0];
  const body = rows.slice(1);

  const col = (name, fallback) => {
    const idx = header.findIndex((h) => h.trim() === name);
    return idx === -1 ? fallback : idx;
  };

  const C = {
    workflowName: col("Workflow Name", 0),
    docType: col("Document Type", 1),
    stateField: col("Workflow State Field", 2),
    state: col("State (Document States)", 7),
    allowEdit: col("Only Allow Edit For (Document States)", 8),
    docStatus: col("Doc Status (Document States)", 9),
    isOptional: col("Is Optional State (Document States)", 12),
    tState: col("State (Transitions)", 16),
    action: col("Action (Transitions)", 17),
    nextState: col("Next State (Transitions)", 18),
    allowed: col("Allowed (Transitions)", 19),
    condition: col("Condition (Transitions)", 21),
  };

  const get = (row, i) => (row[i] ?? "").trim();

  const workflows = [];
  let current = null;

  for (const row of body) {
    if (row.every((c) => (c ?? "").trim() === "")) continue;

    const name = get(row, C.workflowName);
    if (name) {
      current = {
        name,
        documentType: get(row, C.docType),
        stateField: get(row, C.stateField),
        states: [],
        transitions: [],
      };
      workflows.push(current);
    }
    if (!current) continue;

    const state = get(row, C.state);
    if (state) {
      current.states.push({
        name: state,
        allowEdit: get(row, C.allowEdit),
        docStatus: get(row, C.docStatus),
        optional: get(row, C.isOptional) === "1",
      });
    }

    const tState = get(row, C.tState);
    const nextState = get(row, C.nextState);
    if (tState && nextState) {
      current.transitions.push({
        from: tState,
        action: get(row, C.action),
        to: nextState,
        allowed: get(row, C.allowed),
        condition: get(row, C.condition),
      });
    }
  }

  // Ensure every state referenced by a transition exists as a node.
  for (const wf of workflows) {
    const known = new Set(wf.states.map((s) => s.name));
    for (const t of wf.transitions) {
      for (const s of [t.from, t.to]) {
        if (s && !known.has(s)) {
          known.add(s);
          wf.states.push({
            name: s,
            allowEdit: "",
            docStatus: "",
            optional: false,
          });
        }
      }
    }
  }

  workflows.sort((a, b) => a.name.localeCompare(b.name));
  return workflows;
}

export function workflowsFromCsv(text) {
  return buildWorkflows(parseCSV(text));
}
