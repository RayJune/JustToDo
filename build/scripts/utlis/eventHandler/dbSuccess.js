'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _indexeddbCrud = require('indexeddb-crud');

var _indexeddbCrud2 = _interopRequireDefault(_indexeddbCrud);

var _dbSuccess = require('../refresh/dbSuccess');

var _dbSuccess2 = _interopRequireDefault(_dbSuccess);

var _general = require('./general');

var _general2 = _interopRequireDefault(_general);

var _itemGenerator = require('../templete/itemGenerator');

var _itemGenerator2 = _interopRequireDefault(_itemGenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var EventHandler = function () {
  var storeName = 'list';

  function add() {
    var inputValue = document.querySelector('#input').value;

    if (inputValue === '') {
      window.alert('please input a real data~');
    } else {
      _addHandler(inputValue);
    }
  }

  function _addHandler(inputValue) {
    var newData = _general2.default.dataGenerator(_indexeddbCrud2.default.getNewKey(storeName), inputValue);
    var rendered = (0, _itemGenerator2.default)(newData);

    _general2.default.ifEmpty.removeInit();
    document.querySelector('#list').insertAdjacentHTML('afterbegin', rendered); // PUNCHLINE: use insertAdjacentHTML
    _general2.default.resetInput();
    _indexeddbCrud2.default.addItem(storeName, newData);
  }

  function enterAdd(e) {
    if (e.keyCode === 13) {
      add();
    }
  }

  function clickLi(e) {
    var targetLi = e.target;
    // use event delegation

    if (!targetLi.classList.contains('aphorism')) {
      if (targetLi.getAttribute('data-id')) {
        targetLi.classList.toggle('finished'); // toggle appearance
        var id = parseInt(targetLi.getAttribute('data-id'), 10); // use previously stored data-id attribute
        _indexeddbCrud2.default.getItem(storeName, id, _toggleLi);
      }
    }
  }

  function _toggleLi(data) {
    var newData = data;

    newData.finished = !data.finished;
    _indexeddbCrud2.default.updateItem(storeName, newData, showAll);
  }

  // li's [x]'s delete
  function removeLi(e) {
    if (e.target.className === 'close') {
      // use event delegation
      // delete visually
      document.querySelector('#list').removeChild(e.target.parentNode);
      addRandom();
      // use previously stored data
      var id = parseInt(e.target.parentNode.getAttribute('data-id'), 10);
      // delete actually
      _indexeddbCrud2.default.removeItem(storeName, id);
    }
  }

  // for Semantic
  function addRandom() {
    var list = document.querySelector('#list');

    if (!list.hasChildNodes()) {
      _dbSuccess2.default.random();
    }
  }

  function showInit() {
    _indexeddbCrud2.default.getAll(storeName, _dbSuccess2.default.init);
  }

  function showAll() {
    _indexeddbCrud2.default.getAll(storeName, _dbSuccess2.default.all);
  }

  function showDone() {
    _showWhetherDone(true);
  }

  function showTodo() {
    _showWhetherDone(false);
  }

  function _showWhetherDone(whetherDone) {
    var condition = 'finished';

    _indexeddbCrud2.default.getWhetherConditionItem(storeName, condition, whetherDone, _dbSuccess2.default.part);
  }

  function showClearDone() {
    var condition = 'finished';

    _indexeddbCrud2.default.removeWhetherConditionItem(storeName, condition, true, function () {
      _indexeddbCrud2.default.getAll(storeName, _dbSuccess2.default.part);
    });
  }

  function showClear() {
    _dbSuccess2.default.clear(); // clear nodes visually
    _dbSuccess2.default.random();
    _indexeddbCrud2.default.clear(storeName); // clear data indeed
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

exports.default = EventHandler;
//# sourceMappingURL=dbSuccess.js.map