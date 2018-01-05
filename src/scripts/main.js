'use strict';
module.exports = (function init() {
  var DB = require('indexeddb-crud');
  var listDBConfig = require('./db/listConfig.js');
  var aphorismConfig = require('./db/aphorismConfig.js');
  var addEvents = require('./utlis/addEvents.js');
  // open DB, and when DB open succeed, invoke initial function
  var aphorismDBHandler = new DB(aphorismConfig, function aphorism() { console.log('aphorismDB is ready'); });
  var listDBHandler = new DB(listDBConfig, addEvents.dbSuccess, addEvents.dbFail);

  return {
    aphorismDBHandler: aphorismDBHandler,
    listDBHandler: listDBHandler
  };
}());
