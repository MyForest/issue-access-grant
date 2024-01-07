export function getLabel(url) {
  const knownLabels = new Map([
    ["https://w3id.org/dpv#ResearchAndDevelopment", "Research and Development"],
    ["https://w3id.org/dpv#AcademicResearch", "Academic Research"],
    ["https://w3id.org/dpv", "Data Privacy Vocabulary"],

    ["https://vc.inrupt.com", "PodSpaces Access Grants"],

    ["https://id.inrupt.com/davidbowen", "David Bowen 🦉"],
    ["https://id.inrupt.com/myforest", "MyForest 🦆"],
    ["https://myforest.solidcommunity.net/profile/card#me", "MyForest 🦢"],
    ["https://login.inrupt.com", "PodSpaces Login"],
    ["https://solidcommunity.net/", "Solidcommunity.net"],
    ["https://storage.inrupt.com/459bac9d-ecc7-4d6b-91a3-d228f042b941/", "My Pod"]
  ]);

  // Don't use URL class to canonicalize the URL because it adds a slash
  const found = knownLabels.get(url);
  if (found != null) {
    return [[url, found]];
  }

  // Don't show results when the clean URL would match because the value being suggested is not the correct one
  // const foundClean = knownLabels.get(new URL(url).toString());
  // if (foundClean != null) {
  //   return [[url, foundClean]];
  // }


  return null;
};
