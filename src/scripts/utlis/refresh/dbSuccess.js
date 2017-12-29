module.exports = (function dbSuccessGenerator() {
  var general = require('./general.js');
  var DB = require('indexeddb-crud');
  var aphorismConfig = require('../../db/aphorismConfig.js');

  DB.open(aphorismConfig, _openSuccess);

  function _openSuccess() {
    console.log('open aphorism success');
  }

  function randomAphorism() {
    var randomIndex = Math.floor(Math.random() * DB.getNewKey());

    DB.getItem(randomIndex, general.sentenceGenerator);
  }

  /* interface */
  return {
    init: general.init,
    all: general.all.bind(null, randomAphorism),
    part: general.part.bind(null, randomAphorism),
    clear: general.clear,
    random: randomAphorism
  };
}());

