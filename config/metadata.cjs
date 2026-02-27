const { author, repository, version } = require("../package.json");

module.exports = {
  name: "Itamae",
  namespace: "http://ryn.cx/",
  version: version,
  author: author,
  source: repository.url,
  description: " Crunchyroll history exporter. ",
  match: ["https://www.crunchyroll.com/*"],
  require: [],
  grant: "none",
  "run-at": "document-end",
};
