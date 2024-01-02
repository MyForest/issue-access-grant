import { login, handleIncomingRedirect, getDefaultSession } from "@inrupt/solid-client-authn-browser";

import { getAccessGrantAll, approveAccessRequest } from "@inrupt/solid-client-access-grants";

import { cleanArray } from "./clean-array"

import "./summary/boolean-summary-component.js";
import "./summary/purpose-summary-component.js";
import "./summary/resource-summary-component.js";
import "./summary/url-summary-component.js";

import "./responsive.css";
import "./sortable-theme-bootstrap.css";

function loginToIdP() {
  const loginOptions = {
    oidcIssuer: document.querySelector("#input-idp").value,
    redirectUrl: new URL(".", window.location.href).toString(),
    clientId: "https://myforest.com/issue-access-grant/client-identifier.json"
  }
  return login(loginOptions);
}

// 1b. Login Redirect. Call handleIncomingRedirect() function.
// When redirected after login, finish the process by retrieving session information.
async function handleRedirectAfterLogin() {

  var session = getDefaultSession();
  if (!session.info.isLoggedIn) {
    // This causes page flicker
    // Use session restore: https://docs.inrupt.com/developer-tools/javascript/client-libraries/tutorial/restore-session-browser-refresh/
    await handleIncomingRedirect({ restorePreviousSession: true }); // no-op if not part of login redirect
  }

  session = getDefaultSession();
  if (session.info.isLoggedIn) {
    document.getElementById("session-webid").dataset.value = session.info.webId;
    listAccessGrants();
  }
}

/**
 * Gather the input state so we can preview it and return it in the case we actually want to issue the Access Grant
 * @returns An object that can be used to issue an Access Grant
 */
async function getRequestOverrideAndUpdatePreview() {
  const access = {};
  for (const mode of ["read", "write", "append"]) {
    access[mode] = document.querySelector("#input-access-mode-" + mode).checked
  }

  const requestOverride = {
    status: "https://w3id.org/GConsent#ConsentStatusExplicitlyGiven",
    requestor: document.querySelector("#input-requestor-webid").value,
    access,
    purpose: cleanArray(document.querySelector("#input-purpose").value),
    resources: cleanArray(document.querySelector("#input-resource").value),
    inherit: document.querySelector("#input-inherit").checked
  }

  const expirationDateValue = document.querySelector("#input-expiration-date").value
  const expirationTimeValue = document.querySelector("#input-expiration-time").value
  if (expirationDateValue.length > 0) {
    var dateExpression = expirationDateValue + "T";
    if (expirationTimeValue.length > 0) {
      dateExpression += expirationTimeValue;
    } else {
      dateExpression += "00:00";
    }
    requestOverride.expirationDate = new Date(dateExpression);
  }

  // Show pretty-printed preview
  document.querySelector("#request-body").innerText = JSON.stringify(requestOverride, null, 2);
  return requestOverride;
}

async function issueGrant() {
  const accessGrantBody = document.querySelector("#access-grant-body");

  try {
    const requestOverride = await getRequestOverrideAndUpdatePreview();
    const grant = await approveAccessRequest(undefined, requestOverride)
    accessGrantBody.innerText = JSON.stringify(grant, null, 2);
    listAccessGrants()
  } catch (error) {
    console.log(error);
    accessGrantBody.innerText = "Error: " + error;
  }
}

async function listAccessGrants() {
  const defaultTitle = "Issue Access Grant";
  const loading = document.querySelector("#accessgrants-loading-status");

  try {
    loading.innerText = "(loading...)";
    const params = { includeExpired: true, resource: document.querySelector("#input-resource").value }
    const accessGrants = await getAccessGrantAll(params);

    if (accessGrants.length > 0) {
      accessgrants.innerHTML = ""
      for (let i = 0; i < accessGrants.length; i++) {
        accessgrants.innerHTML += await accessGrantAsTableRow(accessGrants, i);
      }

      document.title = "(" + accessGrants.length + ") " + defaultTitle;
    } else {
      accessgrants.innerHTML = "<tr><td>No access grants found</td></tr>"
      document.title = defaultTitle;
    }

  } catch (error) {
    console.log(error);
    accessgrants.innerHTML = "Error" + error;
  } finally {
    loading.innerText = "Loaded at " + new Date().toLocaleTimeString([], { timeStyle: 'short' });
  }

}


async function accessGrantAsTableRow(accessGrants, i) {
  const vc = accessGrants[i];
  var row = "";
  row += "<tr>";
  row += "<td class='priority-5' title='" + vc.id + "'>" + i + "</td>";

  row += "<td class='priority-4' data-value='" + vc.issuanceDate + "' title='" + vc.issuanceDate + "'>" + new Date(vc.issuanceDate).toLocaleDateString() + "</td>";

  if (vc.expirationDate == null) {
    row += "<td class='priority-4'>" + (vc.expirationDate ?? "Never") + "</td>";
  } else {
    row += "<td class='priority-4' data-value='" + vc.expirationDate + "' title='" + vc.expirationDate + "'>" + new Date(vc.expirationDate).toLocaleDateString() + "</td>";
  }

  row += "<td class='priority-5'>";
  row += "<url-summary-component data-value='" + (vc.issuer ?? "") + "'</summary-component></td>";

  const providedConsent = vc.credentialSubject.providedConsent;
  row += "<td><url-summary-component data-value='" + (providedConsent.isProvidedTo ?? "") + "'></webid-component></td>";
  row += "<td><resource-summary-component data-value='" + (providedConsent.forPersonalData ?? "") + "'></resource-summary-component></td>";

  for (const mode of ["Read", "Write", "Append"]) {
    const checked = providedConsent.mode.includes(mode);
    // td data-value is for sorting
    row += "<td data-value='" + checked + "'>";
    row += "<boolean-summary-component data-value='" + checked + "'></boolean-summary-component></td>";
  }

  const inherit = providedConsent.inherit ?? false;
  // td data-value is for sorting
  row += "<td class='priority-3' data-value='" + inherit + "'>";
  row += "<boolean-summary-component data-value='" + inherit + "'></boolean-summary-component></td>";

  row += "<td class='priority-3'>";
  row += "<purpose-summary-component data-value='" + (providedConsent.forPurpose ?? "") + "'></purpose-summary-component></td>";

  row += "</tr>";
  return row;
}

document.querySelector("#btnLogin").onclick = function () { loginToIdP(); };
document.querySelector("#btnIssue").onclick = function () { issueGrant(); };

// Update the Access Grant preview when the user changes the input state
for (const item of document.querySelectorAll('[data-access-request-state]')) {
  item.addEventListener("input", getRequestOverrideAndUpdatePreview);
}

for (const summaryNode of document.querySelectorAll('[data-summary-component-for]')) {
  const item = document.getElementById(summaryNode.dataset.summaryComponentFor)
  if (item == null) {
    console.warn("Unable to find item element with id " + summaryNode.dataset.summaryFor)
    continue;
  }
  item.addEventListener("input", async () => { summaryNode.dataset.value = item.value });
  summaryNode.dataset.value = item.value;
}

// Update the list of Access Grants when the resource changes because we filter by that
let timeout = null;
document.querySelector("#input-resource").addEventListener("input", async () => {
  clearTimeout(timeout);
  timeout = setTimeout(async function () {
    await listAccessGrants();
  }, 500);
});

getRequestOverrideAndUpdatePreview();

handleRedirectAfterLogin();
