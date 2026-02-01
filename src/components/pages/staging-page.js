/**
 * <staging-page> – Top-level Staging page.
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
  <h1 class="md-typescale-headline-large">Staging</h1>
  <p class="md-typescale-body-large">
    Staged and unstaged changes will appear here.
  </p>
`;

customElements.define(
  "staging-page",
  class StagingPage extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  },
);
