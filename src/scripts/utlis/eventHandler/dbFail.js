'use strict';
var dbFail = (function dbFailGenerator() {
  var refresh = require('../refresh.js');
  var createLi = require('../createLi.js');
  var general = require('./general.js');
  var _id = -1; // so the first item's id is 0

  function add() {
    var inputValue = document.querySelector('#input').value;
    var list;
    var newData;
    var newLi;

    if (inputValue === '') {
      alert('please input a real data~');
      return 0;
    }
    general.ifEmpty.removeInit();
    newData = _integrateNewData(inputValue);
    newLi = createLi(newData);
    list = document.querySelector('#list');
    list.insertBefore(newLi, list.firstChild); // push newLi to first
    document.querySelector('#input').value = '';  // reset input's values

    return 0;
  }

  function enterAdd(e) {
    if (e.keyCode === 13) {
      add();
    }
  }

  // li's [x]'s delete
  function removeLi(e) {
    var id;

    if (e.target.className === 'close') { // use event delegation
      // use previously stored data
      id = parseInt(e.target.parentNode.getAttribute('data-id'), 10);
      _traverseListItems(function disappearItem(element, index) {
        if (parseInt(element.getAttribute('data-id'), 10) === id) {
          _remove(index);
          general.ifEmpty.addRandom();
        }
      });
    }
  }

  function _traverseListItems(func) {
    Array.prototype.forEach.call(document.querySelectorAll('#list li'), func);
  }

  function _remove(index) {
    var list = document.querySelector('#list');

    list.removeChild(list.childNodes[index]);
  }

  function showInit() {
    refresh.clear();
    refresh.init();
  }

  function showAll() {
    var finished = [];

    _traverseListItems(function appearAll(element, index) {
      refresh.appear(element);
      if (element.classList.contains('finished')) {
        document.querySelector('#list').appendChild(element);
        finished.push(index);
      }
    });
    finished.forEach(function removeFinished(element) {
      _remove(element);
    });
  }

  function showClear() {
    refresh.clear(); // clear nodes visually
    refresh.random();
  }

  function showDone() {
    _showWhetherDone(true);
  }

  function showTodo() {
    _showWhetherDone(false);
  }

  function clickLi(e) {
    var targetLi = e.target;
    var id = parseInt(targetLi.getAttribute('data-id'), 10);
    // use event delegation

    if (id !== void 0) {
      _toggleLi(targetLi, id);
    }
  }

  function _integrateNewData(value) {
    return {
      id: (_id += 1),
      event: value,
      finished: false,
      userDate: general.getNewDate('yyyy年MM月dd日 hh:mm')
    };
  }

  function _showWhetherDone(whetherDone) {
    _traverseListItems(function whetherDoneAppear(element, index) {
      if (whetherDone) {
        element.classList.contains('finished') ? refresh.appear(element) : refresh.disappear(element);
      } else {
        element.classList.contains('finished') ? refresh.disappear(element) : refresh.appear(element);
      }
    });
  }

  function _toggleLi(targetLi, id) {
    targetLi.classList.toggle('finished');
    if (targetLi.classList.contains('finished')) {
      _remove(id);
      document.querySelector('#list').appendChild(targetLi);
    }
  }

  return {
    add: add,
    enterAdd: enterAdd,
    clickLi: clickLi,
    removeLi: removeLi,
    showInit: showInit,
    showAll: showAll,
    showClear: showClear,
    showDone: showDone,
    showTodo: showTodo
  };
}());

module.exports = dbFail;
