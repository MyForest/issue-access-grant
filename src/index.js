import {
  login,
  handleIncomingRedirect,
  getDefaultSession
} from "@inrupt/solid-client-authn-browser";

import { getAccessGrantAll, approveAccessRequest } from "@inrupt/solid-client-access-grants";
import "./responsive.css";
import "./sortable-theme-bootstrap.css";
import { getLabel } from "./labels"
import { getImageURL } from "./images"

const buttonLogin = document.querySelector("#btnLogin");
const buttonIssue = document.querySelector("#btnIssue");
const inputRequestorWebId = document.querySelector("#input-requestor-webid");
const inputResource = document.querySelector("#input-resource");
const accessGrantBody = document.querySelector("#accessGrantBody");
const accessgrants = document.querySelector("#accessgrants");
const loading = document.querySelector("#accessgrants-loading-status");
const idp = document.querySelector("#input-idp");

async function cellContentForURL(url, defaultLabel = (url) => url) {
  const label = getLabel(url) ?? defaultLabel(url);
  var result = "";
  if (label == url) {
    result += "<span>";
  } else {
    result += "<span title='" + url + "'>";
  }

  const imageURL =await getImageURL(url);
  if(imageURL){
    result +="<img style='vertical-align:middle; height: 1.3em;' src='" + imageURL + "' /> ";
  }

  result += "<a  target='_blank' rel='noopener noreferrer' href='" + url + "'>";
  result += label;
  result += "</a>";
  result += "</span>";
  return result;
}

async function cellContentForArray(array, defaultLabel) {

  if (array == null || array.length==0) {
    return "<span title='Nothing specified'>" + defaultLabel + "</span>";
  }
  var result="";
  var comma = "";
  var actuallyAnArray = array;
  if (!Array.isArray(array)) {
    actuallyAnArray = Array(array);
  }
  actuallyAnArray=actuallyAnArray.filter(item=>item.length>0)
  if (actuallyAnArray.length==0) {
    return "<span title='Nothing specified'>" + defaultLabel + "</span>";
  }

  for (const item of actuallyAnArray) {
    if (item.length) {
      result += comma;
      result += await cellContentForURL(item);
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
    oidcIssuer: idp.value,
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
    buttonIssue.removeAttribute("disabled");
    listAccessGrants();
  } else {
    console.log("Not logged in")
  }
}



async function getRequestOverride() {
  const access = {
    read: document.querySelector("#access-mode-read").checked,
    write: document.querySelector("#access-mode-write").checked,
    append: document.querySelector("#access-mode-append").checked
  }

  const requestOverride = {
    status: "https://w3id.org/GConsent#ConsentStatusExplicitlyGiven",
    requestor: inputRequestorWebId.value,
    access,
    purpose: [document.querySelector("#purpose").value.split(",")],
    resources: [inputResource.value],
    inherit: document.querySelector("#inherit").checked
  }

  const expirationDateValue = document.querySelector("#expiration-date").value
  const expirationTimeValue = document.querySelector("#expiration-time").value
  if (expirationDateValue.length > 0) {
    var dateExpression = expirationDateValue + "T";
    if (expirationTimeValue.length > 0) {
      dateExpression += expirationTimeValue;
    } else {
      dateExpression += "00:00";
    }
    requestOverride.expirationDate = new Date(dateExpression);
  }

  document.querySelector("#requestBody").innerText = JSON.stringify(requestOverride, null, 2);
  return requestOverride;
}

async function issueGrant() {
  try {
    const requestOverride = await getRequestOverride();
    // const grant = { "example": true, "moment": new Date() };
    const grant = await approveAccessRequest(undefined, requestOverride)
    accessGrantBody.innerText = JSON.stringify(grant, null, 2);
    listAccessGrants()
  } catch (error) {
    console.log(error);
    accessGrantBody.textContent = "Error: " + error;
  }
}



async function listAccessGrants() {
  const defaultTitle = "Issue Access Grant";
  try {
    loading.innerText = "(loading...)";
    const params = { resource: inputResource.value }
    const accessGrants = await getAccessGrantAll(params);

    if (accessGrants.length > 0) {
      accessgrants.innerHTML = ""
      for (let i = 0; i < accessGrants.length; i++) {
        const vc = accessGrants[i];
        var row = ""
        row += "<tr>"
        row += "<td class='priority-5' title='" + vc.id + "'>" + i + "</td>"

        row += "<td class='priority-4' data-value='" + vc.issuanceDate + "' title='" + vc.issuanceDate + "'>" + new Date(vc.issuanceDate).toLocaleDateString() + "</td>"

        if (vc.expirationDate == null) {
          row += "<td class='priority-4'>" + (vc.expirationDate ?? "Never") + "</td>"
        } else {
          row += "<td class='priority-4' data-value='" + vc.expirationDate + "' title='" + vc.expirationDate + "'>" + new Date(vc.expirationDate).toLocaleDateString() + "</td>"
        }

        row += "<td class='priority-5'>";
        row += await cellContentForURL(vc.issuer);
        row += "</td>"

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
          row += "data-value='" + checked + "' "
          row += "title='" + mode + "'"
          row += ">";
          row += "<input disabled type='checkbox' ";

          if (checked) {
            row += "checked";
          }
          row += "/></td>"
        }

        row += "<td class='priority-3' title='Inherit'>";
        row += "<input class='disabled' disabled type='checkbox' ";
        if (providedConsent.inherit) {
          row += "checked";
        }
        row += "/></td>"

        row += "<td class='priority-3'>";

        row +=await cellContentForArray(providedConsent.forPurpose,"Anything")
        row += "</td>";
      

      row += "</tr>"
      accessgrants.innerHTML += row
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
  loading.innerText = "Loaded at " + new Date().toLocaleTimeString();
}

}

buttonLogin.onclick = function () { loginToIdP(); };
buttonIssue.onclick = function () { issueGrant(); };

inputRequestorWebId.onclick = function () { getRequestOverride() };
inputResource.onclick = function () { getRequestOverride() };
document.querySelector("#inherit").onclick = function () { getRequestOverride() };
document.querySelector("#access-mode-read").onclick = function () { getRequestOverride() };
document.querySelector("#access-mode-write").onclick = function () { getRequestOverride() };
document.querySelector("#access-mode-append").onclick = function () { getRequestOverride() };

document.querySelector("#input-requestor-webid").oninput = async function () { document.querySelector("#to-description").innerHTML = await cellContentForURL(document.querySelector("#input-requestor-webid").value) };
document.querySelector("#purpose").oninput = async function () { document.querySelector("#purpose-description").innerHTML = await cellContentForArray(document.querySelector("#purpose").value.split(","),"Anything") };

getRequestOverride();

handleRedirectAfterLogin();