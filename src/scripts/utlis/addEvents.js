'use strict';
var addEvents = (function addEventsGenerator() {
  function _whetherSuccess(whetherSuccess) {
    console.log(whetherSuccess);

    function _whetherSuccessHandler(whether) {
      var eventHandler = require('./eventHandler.js');
      var handler = whether ? eventHandler.success : eventHandler.fail;
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

    return function () {
      _whetherSuccessHandler(whetherSuccess);
    };
  }

  return {
    success: _whetherSuccess(true),
    fail: _whetherSuccess(false)
  };
}());
console.dir(addEvents);
// console.log(addEvents.fail());
// console.log(addEvents.success());

module.exports = addEvents;
