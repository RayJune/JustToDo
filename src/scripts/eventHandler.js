'use strict';
var eventHandler = (function handlerGenerator() {
  var DB = require('indexeddb-crud');
  var show = require('./show.js');
  var createNode = require('./createNode');

  /* add event handler */
  function add() {
    var inputValue = document.querySelector('#input').value;
    var parent;
    var newData;
    var newNode;

    if (inputValue === '') {
      alert('please input a real data~');
      return false;
    }
    _ifEmpty();
    newData = _integrateNewData(inputValue);
    newNode = createNode(newData);
    parent = document.querySelector('#list');
    parent.insertBefore(newNode, parent.firstChild); // push newNode to first
    document.querySelector('#input').value = '';  // reset input's values
    DB.add(newData);

    return 0;
  }

  function _ifEmpty() {
    if (document.querySelector('#list').className === 'aphorism') {
      show.random();
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

  /* enter's add */
  function enterAdd(e) {
    if (e.keyCode === 13) {
      add();
    }
  }


  /* li's [x]'s delete */
  // use event-delegation
  function deleteLi(e) {
    var id;

    if (e.target.className === 'close') {
      // use previously stored data
      id = parseInt(e.target.getAttribute('data-x'), 10); // #TODO: Does parentNode can do this?
      DB.delete(id, show.all); // delete in DB and show list again
    }
  }


  /* clear */
  function clear() {
    show.clear(); // clear nodes visually
    DB.clear(); // clear data indeed
  }

  /* show done & show todo */
  function showDone() {
    _showWhetherDone(true);
  }

  function showTodo() {
    _showWhetherDone(false);
  }

  function _showWhetherDone(whether) {
    var condition = 'finished'; // set 'finished' as condition

    DB.getWhether(whether, condition, show.all); // pass refresh as callback function
    console.log('Aha, show data succeed');
  }


  /* li */
  // use event-delegation, too
  function clickLi(e) {
    var targetLi = e.target;
    var id;

    if (targetLi.getAttribute('data-id')) {
      id = parseInt(targetLi.getAttribute('data-id'), 10); // use previously stored data
      DB.get(id, _switchLi, [targetLi]); // pass _switchLi and param [e.target] as callback
    }
  }

  function _switchLi(data, targetLi) {
    targetLi.finished = !data.finished;
    if (targetLi.finished) {
      targetLi.classList.add('checked');
    } else {
      targetLi.classList.remove('checked');
    }
    data.finished = targetLi.finished;  // toggle data.finished
    DB.update(data, show.all);
  }

  return {
    add: add,
    enter: enterAdd,
    delete: deleteLi,
    clear: clear,
    showDone: showDone,
    showTodo: showTodo,
    li: clickLi
  };
}());

module.exports = eventHandler;
