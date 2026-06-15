// Side panel showing full details for the clicked state, including its
// incoming and outgoing transitions.
const DOC_STATUS = { "0": "Draft (0)", "1": "Submitted (1)", "2": "Cancelled (2)" };

export default function DetailsPanel({ workflow, stateName, onClose }) {
  if (!workflow || !stateName) return null;

  const state = workflow.states.find((s) => s.name === stateName);
  if (!state) return null;

  const outgoing = workflow.transitions.filter((t) => t.from === stateName);
  const incoming = workflow.transitions.filter((t) => t.to === stateName);

  return (
    <aside className="panel">
      <div className="panel-head">
        <h3>{state.name}</h3>
        <button className="panel-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <dl className="panel-meta">
        <dt>Allowed to edit</dt>
        <dd>{state.allowEdit || "—"}</dd>
        <dt>Doc status</dt>
        <dd>{DOC_STATUS[state.docStatus] || state.docStatus || "—"}</dd>
        <dt>Optional state</dt>
        <dd>{state.optional ? "Yes" : "No"}</dd>
      </dl>

      <section>
        <h4>Outgoing actions ({outgoing.length})</h4>
        {outgoing.length === 0 && <p className="muted">None — terminal state.</p>}
        {outgoing.map((t, i) => (
          <div className="trans" key={`o${i}`}>
            <div className="trans-line">
              <span className="action">{t.action}</span> →{" "}
              <strong>{t.to}</strong>
            </div>
            {t.allowed && <div className="trans-sub">by {t.allowed}</div>}
            {t.condition && (
              <code className="trans-cond">{t.condition}</code>
            )}
          </div>
        ))}
      </section>

      <section>
        <h4>Incoming ({incoming.length})</h4>
        {incoming.length === 0 && <p className="muted">None — entry state.</p>}
        {incoming.map((t, i) => (
          <div className="trans" key={`i${i}`}>
            <div className="trans-line">
              <strong>{t.from}</strong>{" "}
              <span className="action">{t.action}</span> →
            </div>
          </div>
        ))}
      </section>
    </aside>
  );
}
