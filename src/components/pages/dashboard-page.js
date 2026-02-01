/**
 * <dashboard-page> – Top-level Dashboard page.
 */
const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      padding: 24px;
    }
    h1 {
      font: 500 28px/36px Roboto, sans-serif;
      color: var(--md-sys-color-on-surface, #1d1b20);
      margin: 0 0 8px 0;
    }
    p {
      font: 400 16px/24px Roboto, sans-serif;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin: 0;
    }
  </style>
  <h1 class="md-typescale-headline-large">Welcome</h1>
  <p class="md-typescale-body-large">
    Side navbar and top navbar are web components. This is the main content area.
  </p>
`;

customElements.define(
  "dashboard-page",
  class DashboardPage extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  },
);
