import { updateSummary } from "./summary"
export class UrlSummaryComponent extends HTMLElement {
  constructor(...args) {
    super(...args);
    this.isArray = false;
    this.missingLabelFunction = (url) => url;
    this.valueIfNothingSpecified = "";
  }

  connectedCallback() {
    this.render(true);
  }

  async render(first=false) {
    const value = this.getAttribute("data-value");
    if(first){
      // Try to avoid flickering on refresh
      if(value==null || value.length==0){
        // Leave it alone
        return;
      }
    }
    await updateSummary(value, this.isArray, this.missingLabelFunction, this.valueIfNothingSpecified, this);
  }

  static get observedAttributes() {
    return ["data-value"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if(oldValue!=newValue){
      if(name=="data-value"){
        this.render();
      }      
    }
    
  }
}

customElements.define('url-summary-component', UrlSummaryComponent);