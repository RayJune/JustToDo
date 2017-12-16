'use strict';
(function init() {
  var DB = require('indexeddb-crud');
  var dbConfig = require('./db/listConfig');
  var addEvents = require('./utlis/addEvents.js');

  // open DB, and when DB open succeed, invoke initial function
  DB.init(dbConfig, addEvents);
}());
