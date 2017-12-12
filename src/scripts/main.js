'use strict';
(function init() {
  var DB = require('indexeddb-crud');
  var dbConfig = require('./dbConfig.js');
  var handler = require('./eventHandler.js');

  // open DB, and when DB open succeed, invoke initial function
  DB.init(dbConfig, addEventListeners);

  // when db is opened succeed, add EventListeners
  function addEventListeners() {
    var list;

    handler.showInit(); // init show
    // add all eventListener
    list = document.querySelector('#list');
    list.addEventListener('click', handler.clickLi, false);
    list.addEventListener('click', handler.deleteLi, false);
    document.addEventListener('keydown', handler.enter, false);
    document.querySelector('#add').addEventListener('click', handler.add, false);
    document.querySelector('#showDone').addEventListener('click', handler.showDone, false);
    document.querySelector('#showTodo').addEventListener('click', handler.showTodo, false);
    document.querySelector('#showAll').addEventListener('click', handler.show, false);
    document.querySelector('#showClear').addEventListener('click', handler.showClear, false);
  }
}());
