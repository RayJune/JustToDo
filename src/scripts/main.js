'use strict';
(function init() {
  var DB = require('indexeddb-crud');
  var dbConfig = require('./dbConfig.js');
  var handler = require('./eventHandler.js');
  var show = require('./show.js');

  // open DB, and when DB open succeed, invoke initial function
  DB.init(dbConfig, addEventListeners);

  // when db is opened succeed, add EventListeners
  function addEventListeners() {
    var list = document.querySelector('#list');

    show.init(DB);
    // add all eventListener
    list.addEventListener('click', handler.li, false);
    list.addEventListener('click', handler.delete, false);
    document.querySelector('#add').addEventListener('click', handler.add, false);
    document.addEventListener('keydown', handler.enter, false);
    document.querySelector('#done').addEventListener('click', handler.showDone, false);
    document.querySelector('#todo').addEventListener('click', handler.showToDo, false);
    document.querySelector('#show').addEventListener('click', handler.show, false);
    document.querySelector('#clear').addEventListener('click', handler.clear, false);
  }
}());
