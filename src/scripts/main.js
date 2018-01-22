'use strict';
(function init() {
  var DB = require('indexeddb-crud');
  var config = require('./db/config');
  var addEvents = require('./utlis/addEvents/dbSuccess');
  var lazyLoadWithoutDB = require('./utlis/lazyLoadWithoutDB');
  var templete = require('../../templete/template');

  templete();
  // open DB, and when DB open succeed, invoke initial function
  DB.open(config, addEvents, lazyLoadWithoutDB);
}());
