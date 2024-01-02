import { UrlSummaryComponent } from "./url-summary-component"
class ResourceSummaryComponent extends UrlSummaryComponent {
  constructor(...args) {
    super(...args);
    this.isArray = true;
    this.missingLabelFunction = simpleResourceLabel;
    this.valueIfNothingSpecified = "No Resources";
  }
}

function simpleResourceLabel(resourceURI) {
  if (resourceURI.endsWith("/")) {
    return resourceURI.split("/").at(-2) + "/";
  }
  return resourceURI.split("/").at(-1);
}

customElements.define('resource-summary-component', ResourceSummaryComponent);