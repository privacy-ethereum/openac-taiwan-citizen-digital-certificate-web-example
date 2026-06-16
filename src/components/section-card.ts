// Hairline-bordered container with optional title, body, actions. The
// status prop maps to a data-status attribute the CSS themes.

export type SectionCardStatus = "default" | "ok" | "warn" | "error";

export interface SectionCardOptions {
  /** Optional uppercase mono title rendered above the body. */
  title?: string;
  /** Body content — text or a node graph the caller has already built. */
  body?: string | Node;
  /** Optional right-side action node (button group, status badge, etc.). */
  actions?: Node;
  /** Affects border + bg via [data-status]. */
  status?: SectionCardStatus;
  /** Extra class name appended to the root, for one-off targeting. */
  extraClass?: string;
}

export interface SectionCardHandle {
  el: HTMLElement;
  setStatus(status: SectionCardStatus): void;
  setBody(body: string | Node): void;
  setActions(actions: Node | null): void;
}

export function createSectionCard(opts: SectionCardOptions = {}): SectionCardHandle {
  const el = document.createElement("section");
  el.className = `section-card${opts.extraClass ? ` ${opts.extraClass}` : ""}`;
  el.dataset.status = opts.status ?? "default";

  const header = document.createElement("div");
  header.className = "section-card-header";
  if (opts.title) {
    const titleEl = document.createElement("div");
    titleEl.className = "section-card-title";
    titleEl.textContent = opts.title;
    header.appendChild(titleEl);
  }
  const actionsEl = document.createElement("div");
  actionsEl.className = "section-card-actions";
  if (opts.actions) actionsEl.appendChild(opts.actions);
  header.appendChild(actionsEl);

  const bodyEl = document.createElement("div");
  bodyEl.className = "section-card-body";

  el.append(header, bodyEl);

  function setBody(body: string | Node): void {
    if (typeof body === "string") {
      bodyEl.textContent = body;
    } else {
      bodyEl.replaceChildren(body);
    }
  }
  if (opts.body !== undefined) setBody(opts.body);

  return {
    el,
    setStatus(status) {
      el.dataset.status = status;
    },
    setBody,
    setActions(node) {
      actionsEl.replaceChildren(...(node ? [node] : []));
    },
  };
}
