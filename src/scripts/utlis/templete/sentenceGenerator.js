'use strict';
function sentenceGenerator(text) {
  var template = Handlebars.templates.li;
  var rendered = template({"sentence": text});

  return rendered.trim();
}

module.exports = sentenceGenerator;
