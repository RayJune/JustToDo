function sentenceGenerator(text) {
  const template = Handlebars.templates.li;
  const rendered = template({ sentence: text });

  return rendered.trim();
}

export default sentenceGenerator;
