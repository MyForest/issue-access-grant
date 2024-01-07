import { getLabel } from "./labels"
import { getImageURL } from "./images"
import { cleanArray } from "../clean-array"

/**
 * Create a user-friendly summary of the field and present it to the user in the summary node
 */
export async function updateSummary(value, isArray, missingLabelFunction, valueIfNothingSpecified, summaryNode) {

  if (value == null) {
    summaryNode.innerHTML = "&nbsp;";
    return;
  }

  if (isArray) {
    summaryNode.innerHTML = await cellContentForArray(cleanArray(value), missingLabelFunction, valueIfNothingSpecified)
  } else {
    summaryNode.innerHTML = await cellContentForURL(value, missingLabelFunction)
  }

}

async function cellContentForURL(url, missingLabelFunction = (url) => url) {
  var result = "";

  const imageURL = await getImageURL(url);
  if (imageURL) {
    result += "<img style='vertical-align:middle; height: 1.3em;' src='" + imageURL + "' /> ";
  }

  const labels = getLabel(url) ?? [[url, missingLabelFunction(url)]];
  var space="";
  // [ [url,label]  ]
  for (const parts of labels) {
    result+=space;
    const url = parts[0];
    const label = parts[1];
    if (label == url) {
      result += "<span>";
    } else {
      result += "<span title='" + url + "'>";
    }

    result += "<a  target='_blank' rel='noopener noreferrer' href='" + url + "'>";
    result += label;
    result += "</a>";
    result += "</span>";
    space=" ";
  }
  return result;
}

async function cellContentForArray(array, missingLabelFunction = (url) => url, valueIfNothingSpecified) {

  if (array == null || array.length == 0) {
    return "<span title='Nothing specified'>" + valueIfNothingSpecified + "</span>";
  }
  var result = "";
  var comma = "";
  var actuallyAnArray = array;
  if (!Array.isArray(array)) {
    actuallyAnArray = Array(array);
  }
  actuallyAnArray = actuallyAnArray.filter(item => item.length > 0)
  if (actuallyAnArray.length == 0) {
    return "<span title='Nothing specified'>" + valueIfNothingSpecified + "</span>";
  }

  for (const item of actuallyAnArray) {
    if (item.length) {
      result += comma;
      result += await cellContentForURL(item, missingLabelFunction);
      comma = ", ";
    }
  }
  return result;
}
