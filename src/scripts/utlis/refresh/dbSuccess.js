module.exports = (function dbSuccessGenerator() {
  var DB = require('../../main.js').aphorismDBHandler;
  var general = require('./general.js');

  console.log('refresh sccess in');
  // open DB, and when DB open succeed, invoke initial function
  function randomAphorism() {
    var randomIndex = Math.floor(Math.random() * DB.getLength());

    console.dir(DB);
    console.log(DB.getLength());
    console.log(randomIndex);
    DB.getItem(randomIndex, general.sentenceGenerator);
  }

  /* interface */
  return {
    init: general.init,
    all: general.all.bind(null, randomAphorism),  // PUNCHLINE: use bind to pass paramter
    part: general.part.bind(null, randomAphorism),
    clear: general.clear,
    random: randomAphorism
  };
}());
