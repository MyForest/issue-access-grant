export function cleanArray(csv){
  const cleaned = csv.split(",").map(x=>x.trim());
  const nonEmpty=cleaned.filter(x=>x.length>0);
  return [...new Set(nonEmpty)]
}
