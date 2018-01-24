function itemGenerator(dataArr) {
  const template = Handlebars.templates.li;
  let result = dataArr;

  if (!Array.isArray(dataArr)) {
    result = [dataArr];
  }
  const rendered = template({ listItems: result });

  return rendered.trim();
}

export default itemGenerator;
