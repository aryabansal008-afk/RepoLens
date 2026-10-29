import { useEffect, useId, useState } from 'react';

export default function FAQAccordion({ items, mode = 'keep', modeNonce = 0 }) {
  const baseId = useId();
  const [open, setOpen] = useState(() => new Set());

  useEffect(() => {
    if (mode === 'all') setOpen(new Set(items.map((item) => item.id)));
    else if (mode === 'none') setOpen(new Set());
  }, [items, mode, modeNonce]);

  function toggle(id) {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (!items.length) {
    return <p className="lede">No questions match that search.</p>;
  }

  return (
    <div className="accordion">
      {items.map((item) => {
        const expanded = open.has(item.id);
        const panelId = `${baseId}-${item.id}`;
        return (
          <div className={`accordion-item ${expanded ? 'open' : ''}`} key={item.id}>
            <h3>
              <button
                type="button"
                id={`${panelId}-button`}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
              >
                <span>{item.question}</span>
                <span aria-hidden="true">{expanded ? '–' : '+'}</span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={`${panelId}-button`}
              className="accordion-panel"
              aria-hidden={!expanded}
            >
              <div className="accordion-panel-inner">
                <p>{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
