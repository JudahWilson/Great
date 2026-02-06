/**
 * <home-page> – Home: project selector and Add project (folder picker).
 */
const template = document.createElement("template");
template.innerHTML = `
  <style>
    .project-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 480px;
    }
    .project-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .project-section label {
      font: 500 14px/20px Roboto, sans-serif;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      display: block;
      margin-bottom: 4px;
    }
    .project-section select {
      flex: 1;
      min-width: 200px;
      padding: 10px 12px;
      font: 400 16px/24px Roboto, sans-serif;
      color: var(--md-sys-color-on-surface, #1d1b20);
      background: var(--md-sys-color-surface-container-high, #ece6f0);
      border: 1px solid var(--md-sys-color-outline-variant, #e7e0ec);
      border-radius: 8px;
      cursor: pointer;
    }
    .project-section select:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
    }
    .btn-add {
      padding: 10px 20px;
      font: 500 14px/20px Roboto, sans-serif;
      color: var(--md-sys-color-on-primary, #fff);
      background: var(--md-sys-color-primary, #6750a4);
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }
    .btn-add:hover {
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }
    .project-section p {
      font: 400 14px/20px Roboto, sans-serif;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin: 0;
    }
  </style>
  <page-wrapper title="Home">
    <div class="project-section">
      <label for="project-select">Project</label>
      <div class="project-row">
        <select id="project-select" aria-label="Select project">
          <option value="">Select a project…</option>
        </select>
        <button type="button" class="btn-add" id="add-project-btn">Add project</button>
      </div>
      <p id="project-hint">Choose a project or add one with the folder picker.</p>
    </div>
  </page-wrapper>
`;

customElements.define(
  "home-page",
  class HomePage extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
      this._projects = [];
    }

    connectedCallback() {
      const select = this.shadowRoot.getElementById("project-select");
      const addBtn = this.shadowRoot.getElementById("add-project-btn");
      select.addEventListener("change", () => this._onSelectChange());
      addBtn.addEventListener("click", () => this._onAddProject());
      this._onProjectsUpdated = () => this._loadProjects();
      document.addEventListener("projects-updated", this._onProjectsUpdated);
      this._loadProjects();
    }

    disconnectedCallback() {
      document.removeEventListener("projects-updated", this._onProjectsUpdated);
    }

    async _loadProjects() {
      const invoke = window.__TAURI__?.core?.invoke;
      if (!invoke) {
        this._renderSelect([]);
        return;
      }
      try {
        const list = await invoke("list_projects");
        this._projects = list || [];
        this._renderSelect(this._projects);
        const currentPath = await invoke("get_current_project_path");
        const match = this._projects.find(
          (p) => p.path != null && p.path === currentPath
        );
        if (match) {
          this.shadowRoot.getElementById("project-select").value = String(
            match.id
          );
          this.dispatchEvent(
            new CustomEvent("project-changed", {
              bubbles: true,
              composed: true,
              detail: {
                id: match.id,
                name: match.name,
                path: match.path,
              },
            })
          );
        }
      } catch (_) {
        this._projects = [];
        this._renderSelect([]);
      }
    }

    _renderSelect(projects) {
      const select = this.shadowRoot.getElementById("project-select");
      const currentValue = select.value;
      select.innerHTML = '<option value="">Select a project…</option>';
      for (const p of projects) {
        const opt = document.createElement("option");
        opt.value = String(p.id);
        opt.textContent = p.name;
        select.appendChild(opt);
      }
      if (currentValue && projects.some((p) => String(p.id) === currentValue)) {
        select.value = currentValue;
      }
    }

    _onSelectChange() {
      const select = this.shadowRoot.getElementById("project-select");
      const id = select.value;
      const project = id
        ? this._projects.find((p) => String(p.id) === id)
        : null;
      this.dispatchEvent(
        new CustomEvent("project-changed", {
          bubbles: true,
          composed: true,
          detail: project
            ? { id: project.id, name: project.name, path: project.path }
            : null,
        })
      );
    }

    async _onAddProject() {
      const invoke = window.__TAURI__?.core?.invoke;
      if (!invoke) return;
      try {
        const path = await invoke("pick_project_folder");
        if (path == null) return;
        await invoke("add_project", { path, name: null });
        await this._loadProjects();
        const list = this._projects;
        const added = list[list.length - 1];
        if (added) {
          this.shadowRoot.getElementById("project-select").value = String(
            added.id
          );
          this._onSelectChange();
        }
        document.dispatchEvent(new CustomEvent("projects-updated"));
      } catch (e) {
        console.error("Add project failed", e);
      }
    }
  }
);
