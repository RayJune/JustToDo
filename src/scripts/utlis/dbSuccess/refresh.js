'use strict';
var refresh = (function dbSuccessGenerator() {
  var DB = require('indexeddb-crud');
  var general = require('../dbGeneral/refreshGeneral');

  function randomAphorism() {
    var storeName = 'aphorism';
    var randomIndex = Math.ceil(Math.random() * DB.getLength(storeName));

    DB.getItem(randomIndex, _parseText, storeName);
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
