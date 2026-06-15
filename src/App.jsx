import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toPng, toSvg } from "html-to-image";

import bundledWorkflows from "./workflows.json";
import StateNode from "./StateNode.jsx";
import SearchableSelect from "./SearchableSelect.jsx";
import DetailsPanel from "./DetailsPanel.jsx";
import SimulatorPanel from "./SimulatorPanel.jsx";
import { buildGraph } from "./layout.js";
import { workflowsFromCsv } from "./parseWorkflows.js";

const nodeTypes = { state: StateNode };

function download(dataUrl, name) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = name;
  a.click();
}

// The state a document starts in: one with no incoming transitions, else a
// Draft-like state, else the first state.
function entryState(wf) {
  if (!wf?.states.length) return null;
  const targets = new Set(wf.transitions.map((t) => t.to));
  const noIncoming = wf.states.find((s) => !targets.has(s.name));
  if (noIncoming) return noIncoming.name;
  const draft = wf.states.find(
    (s) => s.docStatus === "0" || s.name.toLowerCase().includes("draft")
  );
  return (draft ?? wf.states[0]).name;
}

function Flow() {
  const [data, setData] = useState(bundledWorkflows);
  const [sourceName, setSourceName] = useState("Workflow (1).csv (bundled)");
  const [selected, setSelected] = useState(bundledWorkflows[0]?.name ?? "");
  const [direction, setDirection] = useState("LR");
  const [theme, setTheme] = useState("dark");
  const [collapsed, setCollapsed] = useState(false);
  const [activeNode, setActiveNode] = useState(null);
  const [simState, setSimState] = useState(null); // null = not simulating
  const [history, setHistory] = useState([]);
  const fileRef = useRef(null);

  const names = useMemo(() => data.map((w) => w.name), [data]);

  const workflow = useMemo(
    () => data.find((w) => w.name === selected),
    [data, selected]
  );

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () =>
      workflow
        ? buildGraph(workflow, direction, theme)
        : { nodes: [], edges: [] },
    [workflow, direction, theme]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);
  const { getNodes, fitView } = useReactFlow();

  // Re-sync the canvas whenever the selected workflow / direction changes.
  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
    setActiveNode(null);
    setSimState(null);
    setHistory([]);
  }, [layoutNodes, layoutEdges, setNodes, setEdges]);

  // Highlight the clicked node.
  useEffect(() => {
    setNodes((ns) => ns.map((n) => ({ ...n, selected: n.id === activeNode })));
  }, [activeNode, setNodes]);

  // Overlay the simulation state onto nodes and edges.
  useEffect(() => {
    const visited = new Set(history.flatMap((h) => [h.from, h.to]));
    const highlight = "#38bdf8";
    const base = theme === "dark" ? "#94a3b8" : "#64748b";
    setNodes((ns) =>
      ns.map((n) => {
        let sim;
        if (simState) {
          if (n.id === simState) sim = "current";
          else if (visited.has(n.id)) sim = "visited";
        }
        return { ...n, data: { ...n.data, sim } };
      })
    );
    setEdges((es) =>
      es.map((e) => {
        const active = Boolean(simState) && e.source === simState;
        return {
          ...e,
          animated: active,
          style: { stroke: active ? highlight : base, strokeWidth: active ? 3 : 2 },
          markerEnd: { ...e.markerEnd, color: active ? highlight : base },
          zIndex: active ? 10 : 0,
        };
      })
    );
  }, [simState, history, theme, layoutNodes, layoutEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((_, node) => setActiveNode(node.id), []);
  const onPaneClick = useCallback(() => setActiveNode(null), []);

  const startSim = useCallback(() => {
    setActiveNode(null);
    setHistory([]);
    setSimState(entryState(workflow));
  }, [workflow]);

  const doAction = useCallback(
    (t) => {
      setHistory((h) => [...h, { from: t.from, action: t.action, to: t.to }]);
      setSimState(t.to);
    },
    []
  );

  const resetSim = useCallback(() => {
    setHistory([]);
    setSimState(entryState(workflow));
  }, [workflow]);

  const exitSim = useCallback(() => {
    setSimState(null);
    setHistory([]);
  }, []);

  const onUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = workflowsFromCsv(String(reader.result));
        if (!parsed.length) {
          alert("No workflows found in that CSV.");
          return;
        }
        setData(parsed);
        setSelected(parsed[0].name);
        setSourceName(file.name);
      } catch (err) {
        alert("Could not parse that CSV: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // allow re-uploading the same file
  }, []);

  const exportImage = useCallback(
    async (fmt) => {
      const bounds = getNodesBounds(getNodes());
      const w = Math.max(bounds.width + 200, 800);
      const h = Math.max(bounds.height + 200, 600);
      const vp = getViewportForBounds(bounds, w, h, 0.3, 2, 0.1);
      const el = document.querySelector(".react-flow__viewport");
      const opts = {
        backgroundColor: theme === "dark" ? "#0b1220" : "#f8fafc",
        width: w,
        height: h,
        style: {
          width: `${w}px`,
          height: `${h}px`,
          transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})`,
        },
      };
      const fileBase = selected.replace(/[^\w-]+/g, "_");
      if (fmt === "png") {
        download(await toPng(el, opts), `${fileBase}.png`);
      } else {
        download(await toSvg(el, opts), `${fileBase}.svg`);
      }
    },
    [getNodes, selected, theme]
  );

  const dark = theme === "dark";

  return (
    <div className={`app ${theme}`}>
      <header className={`toolbar ${collapsed ? "collapsed" : ""}`}>
        <div className="title">
          <span className="logo">⤳</span>
          {!collapsed && <span className="title-text">Workflow Visualizer</span>}
          <button
            className="collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand menu" : "Collapse menu"}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        <div className="actions">
          <button onClick={() => fileRef.current?.click()}>⬆ Upload CSV</button>
          <button onClick={() => setTheme(dark ? "light" : "dark")}>
            {dark ? "☀ Light" : "🌙 Dark"}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onUpload}
          style={{ display: "none" }}
        />
        <div className="source" title={sourceName}>
          Source: {sourceName}
        </div>

        <label className="field">
          <span>Workflow</span>
          <SearchableSelect
            options={names}
            value={selected}
            onChange={setSelected}
          />
        </label>
        <label className="field">
          <span>Layout</span>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
          >
            <option value="LR">Left → Right</option>
            <option value="TB">Top → Bottom</option>
          </select>
        </label>

        <div className="actions">
          <button onClick={() => fitView({ padding: 0.2 })}>Fit</button>
          <button onClick={() => exportImage("png")}>PNG</button>
          <button onClick={() => exportImage("svg")}>SVG</button>
        </div>

        <button
          className={`sim-toggle ${simState ? "on" : ""}`}
          onClick={simState ? exitSim : startSim}
        >
          {simState ? "■ Stop simulation" : "▶ Simulate"}
        </button>

        {workflow ? (
          <div className="stats">
            {workflow.states.length} states · {workflow.transitions.length}{" "}
            transitions
          </div>
        ) : null}
      </header>

      <div className="body">
        <div className="canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={18} color={dark ? "#1e293b" : "#e2e8f0"} />
            <Controls />
            <MiniMap
              pannable
              zoomable
              maskColor={dark ? "rgba(2,6,23,0.6)" : "rgba(0,0,0,0.1)"}
              nodeColor={dark ? "#334155" : "#cbd5e1"}
              style={{ background: dark ? "#0f172a" : "#fff" }}
            />
          </ReactFlow>
        </div>
        {simState ? (
          <SimulatorPanel
            workflow={workflow}
            current={simState}
            history={history}
            onAction={doAction}
            onReset={resetSim}
            onExit={exitSim}
          />
        ) : activeNode ? (
          <DetailsPanel
            workflow={workflow}
            stateName={activeNode}
            onClose={() => setActiveNode(null)}
          />
        ) : null}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
