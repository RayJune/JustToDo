'use strict';
(function init() {
  var DB = require('indexeddb-crud');
  var DBConfig = require('./db/DBConfig.js');
  var addEvents = require('./utlis/addEvents.js');

  // open DB, and when DB open succeed, invoke initial function
  DB.open(DBConfig, addEvents.dbSuccess, addEvents.dbFail);
}());
