'use strict';
var refresh = (function dbSuccessGenerator() {
  var storeName = 'aphorism';
  var DB = require('indexeddb-crud');
  var general = require('./general');

  function randomAphorism() {
    var randomIndex = Math.ceil(Math.random() * DB.getLength(storeName));

    DB.getItem(storeName, randomIndex, _parseText);
  }

  function _parseText(data) {
    var text = data.content;

    general.sentenceHandler(text);
  }

  return {
    init: general.init,
    all: general.all.bind(null, randomAphorism),  // PUNCHLINE: use bind to pass paramter
    part: general.part.bind(null, randomAphorism),
    clear: general.clear,
    random: randomAphorism
  };
}());

module.exports = refresh;
