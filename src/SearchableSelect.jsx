import { useEffect, useMemo, useRef, useState } from "react";

// A lightweight searchable combobox: type to filter, click / Enter to select.
export default function SearchableSelect({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const ref = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  // Close when clicking outside.
  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const choose = (name) => {
    onChange(name);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) choose(filtered[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="combo" ref={ref}>
      <input
        className="combo-input"
        value={open ? query : value}
        placeholder="Search workflows…"
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul className="combo-list">
          {filtered.length === 0 && <li className="combo-empty">No matches</li>}
          {filtered.map((o, i) => (
            <li
              key={o}
              className={
                "combo-item" +
                (o === value ? " selected" : "") +
                (i === active ? " active" : "")
              }
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(o);
              }}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
