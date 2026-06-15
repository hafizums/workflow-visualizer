import dagre from "@dagrejs/dagre";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 64;

// Map a Frappe doc_status to a colour theme for the node.
function themeFor(state) {
  const n = state.name.toLowerCase();
  if (n.includes("draft")) return "draft";
  if (n.includes("reject")) return "rejected";
  if (n.includes("cancel")) return "cancelled";
  if (n.includes("approved") || state.docStatus === "1") return "approved";
  if (n.includes("pending")) return "pending";
  return "default";
}

// Build React Flow nodes + edges for a workflow and run dagre layout on them.
export function buildGraph(workflow, direction = "TB", theme = "dark") {
  const edgeColor = theme === "dark" ? "#94a3b8" : "#64748b";
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 90 });

  workflow.states.forEach((s) => {
    g.setNode(s.name, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });
  workflow.transitions.forEach((t) => {
    g.setEdge(t.from, t.to);
  });

  dagre.layout(g);

  const horizontal = direction === "LR";

  const nodes = workflow.states.map((s) => {
    const { x, y } = g.node(s.name);
    return {
      id: s.name,
      type: "state",
      position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
      data: { ...s, theme: themeFor(s) },
      sourcePosition: horizontal ? "right" : "bottom",
      targetPosition: horizontal ? "left" : "top",
    };
  });

  const edges = workflow.transitions.map((t, i) => ({
    id: `e${i}`,
    source: t.from,
    target: t.to,
    label: t.action || "",
    type: "smoothstep",
    animated: true,
    style: { stroke: edgeColor, strokeWidth: 2 },
    markerEnd: {
      type: "arrowclosed",
      width: 18,
      height: 18,
      color: edgeColor,
    },
    data: { condition: t.condition, allowed: t.allowed },
    labelBgPadding: [6, 3],
    labelBgBorderRadius: 4,
    labelStyle: { fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: "#fff", fillOpacity: 0.9 },
  }));

  return { nodes, edges };
}
