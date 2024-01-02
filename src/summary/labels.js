export function getLabel(url) {
  const knownLabels = new Map([
    ["https://w3id.org/dpv#ResearchAndDevelopment", "Research and Development"],
    ["https://w3id.org/dpv#AcademicResearch", "Academic Research"],

    ["https://vc.inrupt.com", "PodSpaces"],

    ["https://id.inrupt.com/davidbowen", "David Bowen 🦉"],
    ["https://id.inrupt.com/myforest", "MyForest 🦆"],

  ]);

  return knownLabels.get(url);
};
