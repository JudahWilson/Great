/**
 * <staging-page> – Top-level Staging page.
 */
const template = document.createElement("template");
template.innerHTML = `
  <page-wrapper title="Staging">
    <p>Staged and unstaged changes will appear here.</p>
  </page-wrapper>
`;

customElements.define(
  "staging-page",
  class StagingPage extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
);
