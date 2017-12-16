'use strict';
var addEvents = (function addEventsGenerator() {
  function _whetherSuccess(whetherSuccess) {
    var eventHandler = require('./eventHandler.js');
    var handler = whetherSuccess ? eventHandler.success : eventHandler.fail;
    var list;

    handler.refreshInit();
    // add all eventListener
    list = document.querySelector('#list');
    list.addEventListener('click', handler.clickLi, false);
    list.addEventListener('click', handler.removeLi, false);
    document.addEventListener('keydown', handler.enterAdd, false);
    document.querySelector('#add').addEventListener('click', handler.add, false);
    document.querySelector('#showDone').addEventListener('click', handler.refreshDone, false);
    document.querySelector('#showTodo').addEventListener('click', handler.refreshTodo, false);
    document.querySelector('#showAll').addEventListener('click', handler.refreshAll, false);
    document.querySelector('#showClear').addEventListener('click', handler.refreshClear, false);
  }

  return {
    success: _whetherSuccess(true),
    fail: _whetherSuccess(false)
  };
}());

module.exports = addEvents;
