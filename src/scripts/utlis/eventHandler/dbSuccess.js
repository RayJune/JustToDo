'use strict';
var dbSuccess = (function dbSuccessGenerator() {
  var storeName = 'list';
  var DB = require('indexeddb-crud');
  var refresh = require('../refresh/dbSuccess');
  var itemGenerator = require('../templete/itemGenerator.js');
  var general = require('./general.js');

  function add() {
    var inputValue = document.querySelector('#input').value;

    if (inputValue === '') {
      window.alert('please input a real data~');
    } else {
      _addHandler(inputValue);
    }
  }

  function _addHandler(inputValue) {
    var newData = general.dataGenerator(DB.getNewKey(storeName), inputValue);
    var rendered = itemGenerator(newData);

    general.ifEmpty.removeInit();
    document.querySelector('#list').insertAdjacentHTML('afterbegin', rendered); // PUNCHLINE: use insertAdjacentHTML
    general.resetInput();
    DB.addItem(storeName, newData);
  }

  function enterAdd(e) {
    if (e.keyCode === 13) {
      add();
    }
  }

  function clickLi(e) {
    var id;
    var targetLi = e.target;
    // use event delegation

    if (!targetLi.classList.contains('aphorism')) {
      if (targetLi.getAttribute('data-id')) {
        targetLi.classList.toggle('finished'); // toggle appearance
        id = parseInt(targetLi.getAttribute('data-id'), 10); // use previously stored data-id attribute
        DB.getItem(storeName, id, _toggleLi);
      }
    }
  }

  function _toggleLi(data) {
    data.finished = !data.finished;
    DB.updateItem(storeName, data, showAll);
  }

  // li's [x]'s delete
  function removeLi(e) {
    var id;

    if (e.target.className === 'close') { // use event delegation
      // delete visually
      document.querySelector('#list').removeChild(e.target.parentNode);
      general.ifEmpty.addRandom();
      // use previously stored data
      id = parseInt(e.target.parentNode.getAttribute('data-id'), 10);
      // delete actually
      DB.removeItem(storeName, id);
    }
  }

  // for Semantic
  general.ifEmpty.addRandom = function addRandom() {
    var list = document.querySelector('#list');

    if (!list.hasChildNodes()) {
      refresh.random();
    }
  };

  function showInit() {
    DB.getAll(storeName, refresh.init);
  }

  function showAll() {
    DB.getAll(storeName, refresh.all);
  }

  function showDone() {
    _showWhetherDone(true);
  }

  function showTodo() {
    _showWhetherDone(false);
  }

  function _showWhetherDone(whetherDone) {
    var condition = 'finished';

    DB.getWhetherConditionItem(storeName, condition, whetherDone, refresh.part);
  }

  function showClearDone() {
    var condition = 'finished';

    DB.removeWhetherConditionItem(storeName, condition, true, function showLeftData() {
      DB.getAll(storeName, refresh.part);
    });
  }

  function showClear() {
    refresh.clear(); // clear nodes visually
    refresh.random();
    DB.clear(storeName); // clear data indeed
  }

  return {
    add: add,
    enterAdd: enterAdd,
    clickLi: clickLi,
    removeLi: removeLi,
    showInit: showInit,
    showAll: showAll,
    showDone: showDone,
    showTodo: showTodo,
    showClearDone: showClearDone,
    showClear: showClear
  };
}());

module.exports = dbSuccess;
