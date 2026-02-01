/**
 * <branch-graph-base> – Display-only git branch tree (D3). Renders nodes and links.
 * Extend this component to add behavior (e.g. drag-and-drop) via _afterRender(node, root).
 * Data comes from parsed output (Tauri or sample) set on the `data` attribute by the parent.
 */
/** Shadow DOM template (host + tree container). */
const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 0;
      background: var(--md-sys-color-surface-container, #f3edf7);
    }
    .tree-container {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }
  </style>
  <div class="tree-container"></div>
`;

customElements.define(
  "branch-graph-base",
  class BranchGraphBase extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
      /** DOM element that holds the SVG tree. */
      this._container = null;
      /** Loaded D3 module (used for layout and drawing). */
      this._d3 = null;
      /** Last rendered width (skip re-render if unchanged). */
      this._lastW = 0;
      /** Last rendered height (skip re-render if unchanged). */
      this._lastH = 0;
      /** D3 selection of node groups (for subclasses, e.g. drag). */
      this._nodeSelection = null;
      /** D3 hierarchy root (for subclasses). */
      this._root = null;
    }

    static get observedAttributes() {
      return ["data"];
    }

    attributeChangedCallback(name, _oldVal, _newVal) {
      if (name === "data") this._maybeRender();
    }

    connectedCallback() {
      this._container = this.shadowRoot.querySelector(".tree-container");
      import("https://esm.run/d3").then((d3) => {
        this._d3 = d3;
        this._maybeRender();
      });
      /** Re-render when the element is resized. */
      this._resizeObserver = new ResizeObserver(() => this._maybeRender());
      this._resizeObserver.observe(this);
    }

    disconnectedCallback() {
      this._resizeObserver?.disconnect();
    }

    _getData() {
      /** JSON string from `data` attribute (parsed output from Tauri/sample). */
      const raw = this.getAttribute("data");
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch (_) {
        return null;
      }
    }

    _maybeRender() {
      if (!this._d3 || !this._container) return;
      /** Current container width. */
      const w = this._container.clientWidth;
      /** Current container height. */
      const h = this._container.clientHeight;
      if (w <= 0 || h <= 0) return;
      if (w === this._lastW && h === this._lastH) return;
      this._lastW = w;
      this._lastH = h;
      this._render(w, h);
    }

    _render(width, height) {
      /** D3 module (alias for layout/drawing). */
      const d3 = this._d3;
      /** DOM container for the SVG tree. */
      const container = this._container;
      container.innerHTML = "";

      /** Tree data from parsed output (Tauri or sample) on `data` attribute. */
      const data = this._getData();
      if (!data) return;

      /** D3 hierarchy with x/y layout. */
      const root = d3.hierarchy(data, (d) => d.children);
      /** Tree layout; size leaves padding for labels. */
      const treeLayout = d3.tree().size([width - 120, height - 80]);
      treeLayout(root);

      /** Min/max x and y of all nodes (for centering). */
      const bounds = root.descendants().reduce(
        (acc, d) => ({
          x: [Math.min(acc.x[0], d.x), Math.max(acc.x[1], d.x)],
          y: [Math.min(acc.y[0], d.y), Math.max(acc.y[1], d.y)],
        }),
        { x: [Infinity, -Infinity], y: [Infinity, -Infinity] }
      );
      /** Span of layout in x (plus padding). */
      const dx = bounds.x[1] - bounds.x[0] + 80;
      /** Span of layout in y (plus padding). */
      const dy = bounds.y[1] - bounds.y[0] + 80;
      /** X offset to center the tree. */
      const tx = (width - dx) / 2 - bounds.x[0] + 40;
      /** Y offset to center the tree. */
      const ty = (height - dy) / 2 - bounds.y[0] + 40;

      root.each((d) => {
        d.x0 = d.x + tx;
        d.y0 = d.y + ty;
        d.x = d.x0;
        d.y = d.y0;
      });

      /** Root SVG (fills container; zoom applied here). */
      const svg = d3
        .select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height);
      /** Group that gets the zoom transform (links + nodes live inside). */
      const g = svg.append("g");

      /** Pan/zoom behavior. */
      const zoom = d3
        .zoom()
        .scaleExtent([0.2, 3])
        .on("zoom", (ev) => g.attr("transform", ev.transform));
      svg.call(zoom);

      /** Path generator for vertical links between nodes. */
      const linkGen = d3
        .linkVertical()
        .x((d) => d.x)
        .y((d) => d.y);
      g.append("g")
        .selectAll(".link")
        .data(root.links())
        .join("path")
        .attr("class", "link")
        .attr("d", linkGen)
        .attr("fill", "none")
        .attr("stroke", "#388bfd")
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 0.7);

      /** Radius of each branch node circle. */
      const nodeRadius = 48;
      /** D3 selection of node groups (circle + text). */
      const node = g
        .append("g")
        .selectAll(".node")
        .data(root.descendants())
        .join("g")
        .attr("class", (d) => (d.data.branch === "main" ? "node main" : "node"))
        .attr("transform", (d) => `translate(${d.x},${d.y})`);

      node
        .append("circle")
        .attr("r", nodeRadius)
        .attr("fill", (d) => (d.data.branch === "main" ? "#f0883e" : "#238636"))
        .attr("stroke", (d) =>
          d.data.branch === "main" ? "#f0a020" : "#2ea043"
        )
        .attr("stroke-width", 2);

      node
        .append("text")
        .attr("dy", 0)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("fill", "#1d1b20")
        .attr("font-size", 12)
        .attr("font-weight", 500)
        .attr("pointer-events", "none")
        .text((d) => d.data.name)
        .each(function (d) {
          /** Split branch name for multi-line label (e.g. "feature/auth"). */
          const words = d.data.name.split("/");
          if (words.length > 1) {
            d3.select(this)
              .selectAll("tspan")
              .data(words)
              .join("tspan")
              .attr("x", 0)
              .attr("dy", (_, i) => (i ? 14 : -(words.length - 1) * 7))
              .text((t) => t);
          }
        });

      this._nodeSelection = node;
      this._root = root;
      /** Main SVG group (for subclasses, e.g. appending ghost). */
      this._g = g;
      if (typeof this._afterRender === "function") {
        this._afterRender(node, root, g);
      }
    }
  }
);
