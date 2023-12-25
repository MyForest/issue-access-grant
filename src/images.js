export function getImageURL(url) {
  const knownImages= new Map([
    ["https://vc.inrupt.com", "https://vc.inrupt.com/inrupt.png"],

    ["https://id.inrupt.com/davidbowen", "https://www.gravatar.com/avatar/0d1362b8ddbc4c0d52092b3c7dd4849a"],
    ["https://id.inrupt.com/myforest", "https://www.gravatar.com/avatar/2cf8ca44a4b7d7893667bd2aa91d0bf7"],

  ]);

  return knownImages.get(url);
};
