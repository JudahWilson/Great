/**
 * <branches-page> – Top-level Branches page. Placeholder hosts the reusable branch graph component.
 * Graph data comes from Tauri backend output (or sample), parsed by gitparse into the expected JSON.
 */
import "../branch-graph/branch-graph-base.js";
import "../branch-graph/branch-graph-interactive.js";
import {
  getBranchTreeFromBackend,
  parseBranchTree,
  SAMPLE_OUTPUT,
} from "../../gitparse.js";

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

    connectedCallback() {
      const graph = this.shadowRoot.querySelector("branch-graph-interactive");
      if (!graph) return;
      this._loadTreeIntoGraph(graph);
    }

    async _loadTreeIntoGraph(graph) {
      let tree;
      if (window.__TAURI__?.core?.invoke) {
        try {
          tree = await getBranchTreeFromBackend();
        } catch (_) {
          tree = parseBranchTree(SAMPLE_OUTPUT);
        }
      } else {
        tree = parseBranchTree(SAMPLE_OUTPUT);
      }
      graph.setAttribute("data", JSON.stringify(tree));
    }
  }
);
