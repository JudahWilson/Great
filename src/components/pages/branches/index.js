/**
 * <branches-page> – Branches page. Hosts branch-graph-interactive; data from Tauri/sample via gitparse.
 */
import "../../shared/branch-graph-base.js";
import "./branch-graph-interactive.js";
import {
  getBranchTreeFromBackend,
  parseBranchTree,
} from "../../../gitparse.js";

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
      this._graph = this.shadowRoot.querySelector("branch-graph-interactive");
      if (!this._graph) return;
      this._onProjectOrViewChanged = () => this._loadTreeIntoGraph(this._graph);
      document.addEventListener(
        "project-changed",
        this._onProjectOrViewChanged
      );
      document.addEventListener("view-changed", (e) => {
        if (e.detail?.view === "branches") this._loadTreeIntoGraph(this._graph);
      });
      this._loadTreeIntoGraph(this._graph);
    }

    disconnectedCallback() {
      document.removeEventListener(
        "project-changed",
        this._onProjectOrViewChanged
      );
    }

    async _loadTreeIntoGraph(graph) {
      if (!graph) return;
      let tree;
      if (window.__TAURI__?.core?.invoke) {
        try {
          tree = await getBranchTreeFromBackend();
        } catch (_) {
          tree = parseBranchTree("");
        }
      } else {
        tree = parseBranchTree("");
      }
      graph.setAttribute("data", JSON.stringify(tree));
    }
  }
);
