'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _refresh = require('../dbFail/refresh');

var _refresh2 = _interopRequireDefault(_refresh);

var _eventsHandlerGeneral = require('../dbGeneral/eventsHandlerGeneral');

var _eventsHandlerGeneral2 = _interopRequireDefault(_eventsHandlerGeneral);

var _itemGenerator = require('../templete/itemGenerator');

var _itemGenerator2 = _interopRequireDefault(_itemGenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var eventsHandler = function () {
  var _id = 0; // so the first item's id is 1

  function add() {
    var inputValue = document.querySelector('#input').value;

    if (inputValue === '') {
      window.alert('please input a real data~');
    } else {
      addHandler(inputValue);
    }
  }

  function addHandler(inputValue) {
    var list = document.querySelector('#list');

    _removeRandom(list);
    _id += 1;
    var newData = _eventsHandlerGeneral2.default.dataGenerator(_id, inputValue);
    list.insertBefore((0, _itemGenerator2.default)(newData), list.firstChild); // push newLi to first
    _eventsHandlerGeneral2.default.resetInput();
  }

  function _removeRandom(list) {
    var listItems = list.childNodes;

    [].concat(_toConsumableArray(listItems)).forEach(function (item) {
      if (item.classList.contains('aphorism')) {
        list.removeChild(item);
      }
    });
  }
  // or use for...in
  // for (const index in listItems) {
  //   if (listItems.hasOwnProperty(index)) {
  //     if (listItems[index].classList.contains('aphorism')) {
  //       list.removeChild(listItems[index]);
  //     }
  //   }
  // }

  function enterAdd(e) {
    if (e.keyCode === 13) {
      add();
    }
  }

  function showAll() {
    var list = document.querySelector('#list');
    var listItems = list.childNodes;

    [].concat(_toConsumableArray(listItems)).forEach(function (item) {
      _whetherAppear(item, true);
      if (item.classList.contains('finished')) {
        list.removeChild(item);
        list.appendChild(item); // PUNCHLINE: drop done item
      }
    });
  }

  function _whetherAppear(element, whether) {
    element.style.display = whether ? 'block' : 'none';
  }

  function clickLi(e) {
    var targetLi = e.target;
    // use event delegation

    if (targetLi.getAttribute('data-id')) {
      targetLi.classList.toggle('finished');
      showAll();
    }
  }

  // li's [x]'s delete
  function removeLi(e) {
    if (e.target.className === 'close') {
      // use event delegation
      _removeLiHandler(e.target);
      _addRandom();
    }
  }

  function _removeLiHandler(element) {
    // use previously stored data
    var list = document.querySelector('#list');
    var listItems = list.childNodes;
    var id = element.parentNode.getAttribute('data-id');

    try {
      [].concat(_toConsumableArray(listItems)).forEach(function (item) {
        if (item.getAttribute('data-id') === id) {
          list.removeChild(item);
        }
      });
    } catch (error) {
      console.log('Wrong id, not found in DOM tree');
      throw new Error(error);
    }
  }

  function _addRandom() {
    var list = document.querySelector('#list');

    if (!list.hasChildNodes() || _allDisappear(list)) {
      _refresh2.default.random();
    }
  }

  function _allDisappear(list) {
    var listItems = list.childNodes;

    return Array.prototype.every.call(listItems, function (item) {
      return item.style.display === 'none';
    });
  }

  function showInit() {
    _refresh2.default.init();
  }

  function showDone() {
    _showWhetherDone(true);
  }

  function showTodo() {
    _showWhetherDone(false);
  }

  function _showWhetherDone(whetherDone) {
    var list = document.querySelector('#list');
    var listItems = list.childNodes;

    _removeRandom(list);
    [].concat(_toConsumableArray(listItems)).forEach(function (item) {
      item.classList.contains('finished') ? _whetherAppear(item, whetherDone) : _whetherAppear(item, !whetherDone);
    });
    _addRandom();
  }

  function showClearDone() {
    var list = document.querySelector('#list');
    var listItems = list.childNodes;

    _removeRandom(list);
    [].concat(_toConsumableArray(listItems)).forEach(function (item) {
      if (item.classList.contains('finished')) {
        list.removeChild(item);
      }
    });
    _addRandom();
  }

  function showClear() {
    _refresh2.default.clear(); // clear nodes visually
    _refresh2.default.random();
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
}();

exports.default = eventsHandler;
//# sourceMappingURL=eventsHandler.js.map