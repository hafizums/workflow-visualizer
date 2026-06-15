import { Handle, Position } from "@xyflow/react";

// A workflow state rendered as a card. Shows the role allowed to edit it.
export default function StateNode({ data, sourcePosition, targetPosition }) {
  const sim = data.sim ? ` sim-${data.sim}` : "";
  return (
    <div className={`state-node theme-${data.theme}${sim}`}>
      <Handle type="target" position={targetPosition || Position.Top} />
      <div className="state-name">{data.name}</div>
      {data.allowEdit ? (
        <div className="state-meta">{data.allowEdit}</div>
      ) : null}
      {data.optional ? <div className="state-badge">optional</div> : null}
      <Handle type="source" position={sourcePosition || Position.Bottom} />
    </div>
  );
}
