module.exports = (function addEventsGenerator() {
  var handler = require('./eventHandler');

  return function addEvents() {
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
    document.querySelector('#showAll').addEventListener('click', handler.showAll, false);
    document.querySelector('#showClear').addEventListener('click', handler.showClear, false);
  };
}());
