'use strict';
(function init() {
  var DB = require('indexeddb-crud');
  var DBConfig = require('./db/config.js');
  var addEvents = require('./utlis/addEvents.js');

  // open DB, and when DB open succeed, invoke initial function
  DB.open(DBConfig, addEvents.dbFail, addEvents.dbFail);
}());
