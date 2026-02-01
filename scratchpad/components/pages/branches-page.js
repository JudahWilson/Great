/**
 * <branches-page> – Top-level Branches page. Placeholder hosts the reusable branch graph component.
 * Import branch-graph-interactive (and its base) so this page owns the dependency; graph is the reusable component.
 */
import "../branch-graph/branch-graph-base.js";
import "../branch-graph/branch-graph-interactive.js";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }
    .graph-placeholder {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
    .graph-placeholder branch-graph-interactive {
      flex: 1;
      min-height: 0;
    }
  </style>
  <div class="graph-placeholder">
    <branch-graph-interactive></branch-graph-interactive>
  </div>
`;

customElements.define(
  "branches-page",
  class BranchesPage extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
);
