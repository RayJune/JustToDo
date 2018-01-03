'use strict';
module.exports = (function init() {
  var DB = require('indexeddb-crud');
  var listDBConfig = require('./db/listConfig.js');
  var aphorismConfig = require('./db/aphorismConfig.js');
  var addEvents = require('./utlis/addEvents.js');
  // open DB, and when DB open succeed, invoke initial function
  var aphorismDBHandler = new DB(aphorismConfig);
  var listDBHandler = new DB(listDBConfig, addEvents.dbSuccess, addEvents.dbFail);

  return {
    aphorismDBHandler,
    listDBHandler
  };
}());
