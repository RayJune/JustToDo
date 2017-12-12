'use strict';
var eventHandler = (function handlerGenerator() {
  var DB = require('indexeddb-crud');
  var show = require('./show.js');
  var createNode = require('./createNode');

  function add() {
    var inputValue = document.querySelector('#input').value;
    var list;
    var newData;
    var newNode;

    if (inputValue === '') {
      alert('please input a real data~');
      return 0;
    }
    _ifEmpty();
    newData = _integrateNewData(inputValue);
    newNode = createNode(newData);
    list = document.querySelector('#list');
    list.insertBefore(newNode, list.firstChild); // push newNode to first
    document.querySelector('#input').value = '';  // reset input's values
    DB.add(newData);

    return 0;
  }

  function enterAdd(e) {
    if (e.keyCode === 13) {
      add();
    }
  }

  // li's [x]'s delete
  function deleteLi(e) {
    var id;

    if (e.target.className === 'close') { // use event delegation
      // use previously stored data
      id = parseInt(e.target.getAttribute('data-x'), 10); // #TODO: Does parentNode can do this?
      DB.delete(id, showAll); // delete in DB and show list again
    }
  }

  function showInit() {
    show.clear();
    DB.getAll(show.init);
  }

  function showAll() {
    show.clear();
    DB.getAll(show.all);
  }

  function showClear() {
    show.clear(); // clear nodes visually
    show.random();
    DB.clear(); // clear data indeed
  }

  function showDone() {
    _showWhetherDone(true);
  }

  function showTodo() {
    _showWhetherDone(false);
  }

  function clickLi(e) {
    var id;
    var targetLi = e.target;
    // use event delegation

    if (targetLi.getAttribute('data-id')) {
      id = parseInt(targetLi.getAttribute('data-id'), 10); // use previously stored data-id attribute
      DB.get(id, _switchLi, [targetLi]); // pass _switchLi and param [e.target] as callback
    }
  }


  /* private methods */
  function _ifEmpty() {
    var list = document.querySelector('#list');

    if (list.firstChild.className === 'aphorism') {
      list.removeChild(list.firstChild);
    }
  }

  function _integrateNewData(value) {
    return {
      id: DB.getNewDataKey(),
      event: value,
      finished: false,
      userDate: _getNewDate('yyyy年MM月dd日 hh:mm')
    };
  }

  // Format date
  function _getNewDate(fmt) {
    var newDate = new Date();
    var newfmt = fmt;
    var o = {
      'y+': newDate.getFullYear(),
      'M+': newDate.getMonth() + 1,
      'd+': newDate.getDate(),
      'h+': newDate.getHours(),
      'm+': newDate.getMinutes()
    };
    var lens;

    for (var k in o) {
      if (new RegExp('(' + k + ')').test(newfmt)) {
        if (k === 'y+') {
          newfmt = newfmt.replace(RegExp.$1, ('' + o[k]).substr(4 - RegExp.$1.length));
        } else if (k === 'S+') {
          lens = RegExp.$1.length;
          lens = lens === 1 ? 3 : lens;
          newfmt = newfmt.replace(RegExp.$1, ('00' + o[k]).substr(('' + o[k]).length - 1, lens));
        } else {
          newfmt = newfmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
        }
      }
    }

    return newfmt;
  }

  function _showWhetherDone(whether) {
    var condition = 'finished'; // set 'finished' as condition

    show.clear();
    DB.getWhether(whether, condition, show.part); // pass refresh as callback function
  }

  function _switchLi(data, targetLi) {
    targetLi.finished = !data.finished;
    if (targetLi.finished) {
      targetLi.classList.add('checked');
    } else {
      targetLi.classList.remove('checked');
    }
    data.finished = targetLi.finished;  // toggle data.finished
    DB.update(data, showAll);
  }

  /* interface */
  return {
    add: add,
    enter: enterAdd,
    deleteLi: deleteLi,
    showInit: showInit,
    showAll: showAll,
    showClear: showClear,
    showDone: showDone,
    showTodo: showTodo,
    clickLi: clickLi
  };
}());

module.exports = eventHandler;
