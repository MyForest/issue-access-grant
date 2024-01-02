export class BooleanSummaryComponent extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  async render() {
    var content = "<input class='disabled' disabled type='checkbox'"
    if (this.dataset.value == "true") {
      content += "checked";
    }
    content += "/>"
    this.innerHTML = content;
  }

  static get observedAttributes() {
    return ["data-value"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.render();
  }
}

customElements.define('boolean-summary-component', BooleanSummaryComponent);