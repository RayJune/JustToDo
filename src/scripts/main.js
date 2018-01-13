'use strict';
(function init() {
  var DB = require('indexeddb-crud');
  var config = require('./db/config.js');
  var loadWithoutDB = require('./utlis/loadWithoutDB.js');
  var addEvents = require('./utlis/addEvents/dbSuccess');

  // open DB, and when DB open succeed, invoke initial function
  DB.open(config, addEvents, loadWithoutDB);
}());
