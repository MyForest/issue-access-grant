import { login, handleIncomingRedirect, getDefaultSession } from "@inrupt/solid-client-authn-browser";

import { getAccessGrantAll, approveAccessRequest } from "@inrupt/solid-client-access-grants";

import { getLabel } from "./labels"
import { getImageURL } from "./images"

import "./responsive.css";
import "./sortable-theme-bootstrap.css";


async function cellContentForURL(url, missingLabelFunction = (url) => url) {
  const label = getLabel(url) ?? missingLabelFunction(url);
  var result = "";
  if (label == url) {
    result += "<span>";
  } else {
    result += "<span title='" + url + "'>";
  }

  const imageURL = await getImageURL(url);
  if (imageURL) {
    result += "<img style='vertical-align:middle; height: 1.3em;' src='" + imageURL + "' /> ";
  }

  result += "<a  target='_blank' rel='noopener noreferrer' href='" + url + "'>";
  result += label;
  result += "</a>";
  result += "</span>";
  return result;
}

async function cellContentForArray(array, missingLabelFunction= (url) => url) {

  if (array == null || array.length == 0) {
    return "<span title='Nothing specified'>" + missingLabelFunction + "</span>";
  }
  var result = "";
  var comma = "";
  var actuallyAnArray = array;
  if (!Array.isArray(array)) {
    actuallyAnArray = Array(array);
  }
  actuallyAnArray = actuallyAnArray.filter(item => item.length > 0)
  if (actuallyAnArray.length == 0) {
    return "<span title='Nothing specified'>" + missingLabelFunction + "</span>";
  }

  for (const item of actuallyAnArray) {
    if (item.length) {
      result += comma;
      result += await cellContentForURL(item,missingLabelFunction);
      comma = ", ";
    }
  }
  return result;
}


function simpleResourceLabel(resourceURI) {
  if (resourceURI.endsWith("/")) {
    return resourceURI.split("/").at(-2) + "/";
  }
  return resourceURI.split("/").at(-1);
}

function loginToIdP() {
  const loginOptions = {
    oidcIssuer: document.querySelector("#input-idp").value,
    redirectUrl: new URL(".", window.location.href).toString(),
    clientId: "https://myforest.com/issue-access-grant/client-identifier.json"
  }
  console.info(JSON.stringify(loginOptions, null, 2))
  return login(loginOptions);
}

// 1b. Login Redirect. Call handleIncomingRedirect() function.
// When redirected after login, finish the process by retrieving session information.
async function handleRedirectAfterLogin() {
  // Use session restore: https://docs.inrupt.com/developer-tools/javascript/client-libraries/tutorial/restore-session-browser-refresh/
  await handleIncomingRedirect({ restorePreviousSession: true }); // no-op if not part of login redirect

  const session = getDefaultSession();
  if (session.info.isLoggedIn) {
    // Update the page with the status.
    document.getElementById("myWebID").innerHTML = await cellContentForURL(session.info.webId);
    // buttonIssue.removeAttribute("disabled");
    listAccessGrants();
  } else {
    console.log("Not logged in")
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
    purpose: [...new Set(document.querySelector("#input-purpose").value.split(","))],
    resources: [...new Set(document.querySelector("#input-resource").value.split(","))],
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

/**
 * Create a user-friendly summary of the field and present it to the user in the summary node
 * @param {Node} node 
 * @param {Node} summaryNode 
 * @returns 
 */
async function updateSummary(node, summaryNode) {
  const value = node.value;
  if (value == null) {
    summaryNode.innerHTML = "&nbsp;";
    return;
  }

  var missingLabelFunction=undefined;
  if(summaryNode.dataset.summaryUsesSimpleResourceLabel!=null){
    missingLabelFunction=simpleResourceLabel
  }

  if (node.dataset.isArray == null) {
    summaryNode.innerHTML = await cellContentForURL(value,missingLabelFunction)
  } else {
    summaryNode.innerHTML = await cellContentForArray([...new Set(value.split(","))],missingLabelFunction)
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
  row += await cellContentForURL(vc.issuer);
  row += "</td>";

  const providedConsent = vc.credentialSubject.providedConsent;

  row += "<td>" + await cellContentForURL(providedConsent.isProvidedTo) + "</td>";

  row += "<td>";
  var comma = "";
  for (const resourceURI of providedConsent.forPersonalData) {
    row += comma;
    row += await cellContentForURL(resourceURI, simpleResourceLabel);
    comma = ", ";
  }
  row += "</td>";

  for (const mode of ["Read", "Write", "Append"]) {
    const checked = providedConsent.mode.includes(mode);
    row += "<td ";
    row += "data-value='" + checked + "' ";
    row += "title='" + mode + "'";
    row += ">";
    row += "<input disabled type='checkbox' ";

    if (checked) {
      row += "checked";
    }
    row += "/></td>";
  }

  row += "<td class='priority-3' title='Inherit'>";
  row += "<input class='disabled' disabled type='checkbox' ";
  if (providedConsent.inherit) {
    row += "checked";
  }
  row += "/></td>";

  row += "<td class='priority-3'>";

  row += await cellContentForArray(providedConsent.forPurpose, "Anything");
  row += "</td>";


  row += "</tr>";
  return row;
}



document.querySelector("#btnLogin").onclick = function () { loginToIdP(); };
document.querySelector("#btnIssue").onclick = function () { issueGrant(); };

// Update the Access Grant preview when the user changes the input state
for (const item of document.querySelectorAll('[data-access-request-state]')) {
  item.addEventListener("input", getRequestOverrideAndUpdatePreview);
}

// Update the field summary when the user changes the underlying data
for (const summaryNode of document.querySelectorAll('[data-summary-for]')) {
  const item = document.getElementById(summaryNode.dataset.summaryFor)
  if (item == null) {
    console.warn("Unable to find item element with id " + summaryNode.dataset.summaryFor)
    continue;
  }
  item.addEventListener("input", async () => { await updateSummary(item, summaryNode); });
  await updateSummary(item, summaryNode);
}

getRequestOverrideAndUpdatePreview();

handleRedirectAfterLogin();
