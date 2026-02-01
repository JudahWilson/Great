/**
 * <page-wrapper> – Generic page shell with title and consistent spacing.
 * Use attribute: title="Page Title". Slotted content appears below the title.
 * Spacing keeps content clear of navbar and viewport edges.
 */
const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      padding: 24px 32px;
      box-sizing: border-box;
      min-height: 100%;
    }
    h1 {
      font: 500 28px/36px Roboto, sans-serif;
      color: var(--md-sys-color-on-surface, #1d1b20);
      margin: 0 0 16px 0;
    }
    .content {
      margin: 0;
    }
    ::slotted(*) {
      font: 400 16px/24px Roboto, sans-serif;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    ::slotted(p) {
      margin: 0 0 8px 0;
    }
    ::slotted(p:last-child) {
      margin-bottom: 0;
    }
  </style>
  <h1 id="title"></h1>
  <div class="content">
    <slot></slot>
  </div>
`;

customElements.define(
  "page-wrapper",
  class PageWrapper extends HTMLElement {
    static get observedAttributes() {
      return ["title"];
    }

    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
      this._updateTitle();
    }

    attributeChangedCallback(name, _oldVal, newVal) {
      if (name === "title") this._updateTitle();
    }

    _updateTitle() {
      const el = this.shadowRoot.getElementById("title");
      if (el) el.textContent = this.getAttribute("title") || "";
    }
  }
);
