// Interactive run-through of a workflow: shows the current state and its
// available transition buttons. Clicking one advances the simulation.
export default function SimulatorPanel({
  workflow,
  current,
  history,
  onAction,
  onReset,
  onExit,
}) {
  if (!workflow || !current) return null;

  const actions = workflow.transitions.filter((t) => t.from === current);
  const state = workflow.states.find((s) => s.name === current);

  return (
    <aside className="panel sim">
      <div className="panel-head">
        <h3>▶ Simulation</h3>
        <button className="panel-close" onClick={onExit} aria-label="Exit">
          ×
        </button>
      </div>

      <div className="sim-current">
        <span className="sim-label">Current state</span>
        <span className="sim-state-name">{current}</span>
        {state?.allowEdit && (
          <span className="sim-role">handled by {state.allowEdit}</span>
        )}
      </div>

      <section>
        <h4>Available actions</h4>
        {actions.length === 0 ? (
          <p className="muted">Terminal state — no further actions.</p>
        ) : (
          <div className="sim-actions">
            {actions.map((t, i) => (
              <button
                key={i}
                className="sim-action-btn"
                onClick={() => onAction(t)}
                title={t.condition ? `Condition: ${t.condition}` : undefined}
              >
                <span className="sim-action-name">{t.action}</span>
                <span className="sim-action-to">→ {t.to}</span>
                {t.condition && (
                  <span className="sim-action-cond">if {t.condition}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <h4>History ({history.length})</h4>
        <ol className="sim-history">
          <li className="sim-step start">
            {history[0]?.from ?? current}
          </li>
          {history.map((h, i) => (
            <li key={i} className="sim-step">
              <span className="sim-step-action">{h.action}</span>
              <span className="sim-step-state">{h.to}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="sim-controls">
        <button onClick={onReset}>↺ Restart</button>
        <button onClick={onExit}>Exit</button>
      </div>
    </aside>
  );
}
