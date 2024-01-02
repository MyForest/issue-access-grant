import { UrlSummaryComponent } from "./url-summary-component"
class PurposeSummaryComponent extends UrlSummaryComponent {
  constructor(...args) {
    super(...args);
    this.isArray = true;
    this.valueIfNothingSpecified = "Any purpose";
  }
}

customElements.define('purpose-summary-component', PurposeSummaryComponent);