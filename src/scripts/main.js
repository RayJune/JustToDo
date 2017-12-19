'use strict';
(function init() {
  var DB = require('indexeddb-crud');
  var listDBConfig = require('./db/listConfig');
  var addEvents = require('./utlis/addEvents.js');

  // open DB, and when DB open succeed, invoke initial function
  DB.init(listDBConfig, addEvents.dbSuccess, addEvents.dbFail);
}());
