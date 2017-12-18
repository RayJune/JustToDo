'use strict';
var addEvents = (function addEventsGenerator() {
  function _whetherSuccess(whetherSuccess) {
    function _whetherSuccessHandler(whether) {
      var eventHandler = require('./eventHandler/eventHandler.js');
      var handler = whether ? eventHandler.dbSuccess : eventHandler.dbFail;
      var list;

      handler.showInit();
      // add all eventListener
      list = document.querySelector('#list');
      list.addEventListener('click', handler.clickLi, false);
      list.addEventListener('click', handler.removeLi, false);
      document.addEventListener('keydown', handler.enterAdd, false);
      document.querySelector('#add').addEventListener('click', handler.add, false);
      document.querySelector('#showDone').addEventListener('click', handler.showDone, false);
      document.querySelector('#showTodo').addEventListener('click', handler.showTodo, false);
      document.querySelector('#showAll').addEventListener('click', handler.showAll, false);
      document.querySelector('#showClear').addEventListener('click', handler.showClear, false);
    }

    return function wrapHandler() {
      _whetherSuccessHandler(whetherSuccess);
    };
  }

  return {
    dbSuccess: _whetherSuccess(true),
    dbFail: _whetherSuccess(false)
  };
}());

module.exports = addEvents;
