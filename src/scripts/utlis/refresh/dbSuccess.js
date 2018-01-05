module.exports = (function dbSuccessGenerator() {
  var DB = require('../../main.js').aphorismDBHandler;
  var general = require('./general.js');

  // open DB, and when DB open succeed, invoke initial function
  function randomAphorism() {
    var randomIndex = Math.ceil(Math.random() * DB.getLength());

    DB.getItem(randomIndex, _parseText);
  }

  function _parseText(data) {
    var text = data.content;

    general.sentenceGenerator(text);
  }

  return {
    init: general.init,
    all: general.all.bind(null, randomAphorism),  // PUNCHLINE: use bind to pass paramter
    part: general.part.bind(null, randomAphorism),
    clear: general.clear,
    random: randomAphorism
  };
}());
