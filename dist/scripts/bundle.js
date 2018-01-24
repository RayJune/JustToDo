(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var IndexedDBHandler = function () {
  var _db = void 0;
  var _defaultStoreName = void 0;
  var _presentKey = {}; // store multi-objectStore's presentKey

  function open(config, openSuccessCallback, openFailCallback) {
    // init open indexedDB
    if (!window.indexedDB) {
      // firstly inspect browser's support for indexedDB
      if (openFailCallback) {
        openFailCallback(); // PUNCHLINE: offer without-DB handler
      } else {
        window.alert('\u2714 Your browser doesn\'t support a stable version of IndexedDB. You can install latest Chrome or FireFox to handler it');
      }

      return 0;
    }
    _openHandler(config, openSuccessCallback);

    return 0;
  }

  function _openHandler(config, successCallback) {
    var openRequest = window.indexedDB.open(config.name, config.version); // open indexedDB

    // an onblocked event is fired until they are closed or reloaded
    openRequest.onblocked = function blockedSchemeUp() {
      // If some other tab is loaded with the database, then it needs to be closed before we can proceed.
      window.alert('Please close all other tabs with this site open');
    };

    // Creating or updating the version of the database
    openRequest.onupgradeneeded = function schemaUp(e) {
      // All other databases have been closed. Set everything up.
      _db = e.target.result;
      console.log('\u2713 onupgradeneeded in');
      _createObjectStoreHandler(config.storeConfig);
    };

    openRequest.onsuccess = function openSuccess(e) {
      _db = e.target.result;
      _db.onversionchange = function versionchangeHandler() {
        _db.close();
        window.alert('A new version of this page is ready. Please reload');
      };
      _openSuccessCallbackHandler(config.storeConfig, successCallback);
    };

    // use error events bubble to handle all error events
    openRequest.onerror = function openError(e) {
      window.alert('Something is wrong with indexedDB, for more information, checkout console');
      console.log(e.target.error);
      throw new Error(e.target.error);
    };
  }

  function _openSuccessCallbackHandler(configStoreConfig, successCallback) {
    var objectStoreList = _parseJSONData(configStoreConfig, 'storeName');

    objectStoreList.forEach(function (storeConfig, index) {
      if (index === 0) {
        _defaultStoreName = storeConfig.storeName; // PUNCHLINE: the last storeName is defaultStoreName
      }
      if (index === objectStoreList.length - 1) {
        _getPresentKey(storeConfig.storeName, function () {
          successCallback();
          console.log('\u2713 open indexedDB success');
        });
      } else {
        _getPresentKey(storeConfig.storeName);
      }
    });
  }

  // set present key value to _presentKey (the private property)
  function _getPresentKey(storeName, successCallback) {
    var transaction = _db.transaction([storeName]);

    _presentKey[storeName] = 0;
    _getAllRequest(transaction, storeName).onsuccess = function getAllSuccess(e) {
      var cursor = e.target.result;

      if (cursor) {
        _presentKey[storeName] = cursor.value.id;
        cursor.continue();
      }
    };
    transaction.oncomplete = function completeGetPresentKey() {
      console.log('\u2713 now ' + storeName + ' \'s max key is ' + _presentKey[storeName]); // initial value is 0
      if (successCallback) {
        successCallback();
        console.log('\u2713 openSuccessCallback finished');
      }
    };
  }

  function _createObjectStoreHandler(configStoreConfig) {
    _parseJSONData(configStoreConfig, 'storeName').forEach(function (storeConfig) {
      if (!_db.objectStoreNames.contains(storeConfig.storeName)) {
        _createObjectStore(storeConfig);
      }
    });
  }

  function _createObjectStore(storeConfig) {
    var store = _db.createObjectStore(storeConfig.storeName, { keyPath: storeConfig.key, autoIncrement: true });

    // Use transaction oncomplete to make sure the object Store creation is finished
    store.transaction.oncomplete = function addinitialData() {
      console.log('\u2713 create ' + storeConfig.storeName + ' \'s object store succeed');
      if (storeConfig.initialData) {
        // Store initial values in the newly created object store.
        _initialDataHandler(storeConfig.storeName, storeConfig.initialData);
      }
    };
  }

  function _initialDataHandler(storeName, initialData) {
    var transaction = _db.transaction([storeName], 'readwrite');
    var objectStore = transaction.objectStore(storeName);

    _parseJSONData(initialData, 'initial').forEach(function (data, index) {
      var addRequest = objectStore.add(data);

      addRequest.onsuccess = function addInitialSuccess() {
        console.log('\u2713 add initial data[' + index + '] successed');
      };
    });
    transaction.oncomplete = function addAllDataDone() {
      console.log('\u2713 add all ' + storeName + ' \'s initial data done :)');
      _getPresentKey(storeName);
    };
  }

  function _parseJSONData(rawdata, name) {
    try {
      var parsedData = JSON.parse(JSON.stringify(rawdata));

      return parsedData;
    } catch (error) {
      window.alert('please set correct ' + name + ' array object :)');
      console.log(error);
      throw error;
    }
  }

  function getLength() {
    var storeName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _defaultStoreName;

    return _presentKey[storeName];
  }

  function getNewKey() {
    var storeName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _defaultStoreName;

    _presentKey[storeName] += 1;

    return _presentKey[storeName];
  }

  /* CRUD */

  function addItem(newData, successCallback) {
    var storeName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _defaultStoreName;

    var transaction = _db.transaction([storeName], 'readwrite');
    var addRequest = transaction.objectStore(storeName).add(newData);

    addRequest.onsuccess = function addSuccess() {
      console.log('\u2713 add ' + storeName + '\'s ' + addRequest.source.keyPath + '  = ' + newData[addRequest.source.keyPath] + ' data succeed :)');
      if (successCallback) {
        successCallback(newData);
      }
    };
  }

  function getItem(key, successCallback) {
    var storeName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _defaultStoreName;

    var transaction = _db.transaction([storeName]);
    var getRequest = transaction.objectStore(storeName).get(parseInt(key, 10)); // get it by index

    getRequest.onsuccess = function getSuccess() {
      console.log('\u2713 get ' + storeName + '\'s ' + getRequest.source.keyPath + ' = ' + key + ' data success :)');
      if (successCallback) {
        successCallback(getRequest.result);
      }
    };
  }

  // get conditional data (boolean condition)
  function getWhetherConditionItem(condition, whether, successCallback) {
    var storeName = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : _defaultStoreName;

    var transaction = _db.transaction([storeName]);
    var result = []; // use an array to storage eligible data

    _getAllRequest(transaction, storeName).onsuccess = function getAllSuccess(e) {
      var cursor = e.target.result;

      if (cursor) {
        if (whether) {
          if (cursor.value[condition]) {
            result.push(cursor.value);
          }
        } else if (!whether) {
          if (!cursor.value[condition]) {
            result.push(cursor.value);
          }
        }
        cursor.continue();
      }
    };
    transaction.oncomplete = function completeAddAll() {
      console.log('\u2713 get ' + storeName + '\'s ' + condition + ' = ' + whether + ' data success :)');
      if (successCallback) {
        successCallback(result);
      }
    };
  }

  function getAll(successCallback) {
    var storeName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _defaultStoreName;

    var transaction = _db.transaction([storeName]);
    var result = [];

    _getAllRequest(transaction, storeName).onsuccess = function getAllSuccess(e) {
      var cursor = e.target.result;

      if (cursor) {
        result.push(cursor.value);
        cursor.continue();
      }
    };
    transaction.oncomplete = function completeGetAll() {
      console.log('\u2713 get ' + storeName + '\'s all data success :)');
      if (successCallback) {
        successCallback(result);
      }
    };
  }

  function removeItem(key, successCallback) {
    var storeName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _defaultStoreName;

    var transaction = _db.transaction([storeName], 'readwrite');
    var deleteRequest = transaction.objectStore(storeName).delete(key);

    deleteRequest.onsuccess = function deleteSuccess() {
      console.log('\u2713 remove ' + storeName + '\'s  ' + deleteRequest.source.keyPath + ' = ' + key + ' data success :)');
      if (successCallback) {
        successCallback(key);
      }
    };
  }

  function removeWhetherConditionItem(condition, whether, successCallback) {
    var storeName = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : _defaultStoreName;

    var transaction = _db.transaction([storeName], 'readwrite');

    _getAllRequest(transaction, storeName).onsuccess = function getAllSuccess(e) {
      var cursor = e.target.result;

      if (cursor) {
        if (whether) {
          if (cursor.value[condition]) {
            cursor.delete();
          }
        } else if (!whether) {
          if (!cursor.value[condition]) {
            cursor.delete();
          }
        }
        cursor.continue();
      }
    };
    transaction.oncomplete = function completeRemoveWhether() {
      console.log('\u2713 remove ' + storeName + '\'s ' + condition + ' = ' + whether + ' data success :)');
      if (successCallback) {
        successCallback();
      }
    };
  }

  function clear(successCallback) {
    var storeName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _defaultStoreName;

    var transaction = _db.transaction([storeName], 'readwrite');

    _getAllRequest(transaction, storeName).onsuccess = function getAllSuccess(e) {
      var cursor = e.target.result;

      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    transaction.oncomplete = function completeClear() {
      console.log('\u2713 clear ' + storeName + '\'s all data success :)');
      if (successCallback) {
        successCallback('clear all data success');
      }
    };
  }

  // update one
  function updateItem(newData, successCallback) {
    var storeName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _defaultStoreName;

    var transaction = _db.transaction([storeName], 'readwrite');
    var putRequest = transaction.objectStore(storeName).put(newData);

    putRequest.onsuccess = function putSuccess() {
      console.log('\u2713 update ' + storeName + '\'s ' + putRequest.source.keyPath + '  = ' + newData[putRequest.source.keyPath] + ' data success :)');
      if (successCallback) {
        successCallback(newData);
      }
    };
  }

  function _getAllRequest(transaction, storeName) {
    return transaction.objectStore(storeName).openCursor(IDBKeyRange.lowerBound(1), 'next');
  }

  return {
    open: open,
    getLength: getLength,
    getNewKey: getNewKey,
    getItem: getItem,
    getWhetherConditionItem: getWhetherConditionItem,
    getAll: getAll,
    addItem: addItem,
    removeItem: removeItem,
    removeWhetherConditionItem: removeWhetherConditionItem,
    clear: clear,
    updateItem: updateItem
  };
}();

exports.default = IndexedDBHandler;

},{}],2:[function(require,module,exports){
'use strict';
module.exports = require('./dist/indexeddb-crud')['default'];

},{"./dist/indexeddb-crud":1}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  name: 'JustToDo',
  version: '23',
  storeConfig: [{
    storeName: 'list',
    key: 'id',
    initialData: [{
      id: 0, event: 'JustDemo', finished: true, date: 0
    }]
  }, {
    storeName: 'aphorism',
    key: 'id',
    initialData: [{
      id: 1,
      content: "You're better than that"
    }, {
      id: 2,
      content: 'Yesterday You Said Tomorrow'
    }, {
      id: 3,
      content: 'Why are we here?'
    }, {
      id: 4,
      content: 'All in, or nothing'
    }, {
      id: 5,
      content: 'You Never Try, You Never Know'
    }, {
      id: 6,
      content: 'The unexamined life is not worth living. -- Socrates'
    }, {
      id: 7,
      content: 'There is only one thing we say to lazy: NOT TODAY'
    }]
  }]
};

},{}],4:[function(require,module,exports){
'use strict';

var _indexeddbCrud = require('indexeddb-crud');

var _config = require('./db/config');

var _config2 = _interopRequireDefault(_config);

var _template = require('../../templete/template');

var _template2 = _interopRequireDefault(_template);

var _addEvents = require('./utlis/dbSuccess/addEvents');

var _addEvents2 = _interopRequireDefault(_addEvents);

var _lazyLoadWithoutDB = require('./utlis/lazyLoadWithoutDB');

var _lazyLoadWithoutDB2 = _interopRequireDefault(_lazyLoadWithoutDB);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _template2.default)();
// open DB, and when DB open succeed, invoke initial function
(0, _indexeddbCrud.open)(_config2.default, _addEvents2.default, _lazyLoadWithoutDB2.default);

},{"../../templete/template":16,"./db/config":3,"./utlis/dbSuccess/addEvents":9,"./utlis/lazyLoadWithoutDB":13,"indexeddb-crud":2}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
function clearChildNodes(root) {
  while (root.hasChildNodes()) {
    // or root.firstChild or root.lastChild
    root.removeChild(root.firstChild);
  }
  // or root.innerHTML = ''
}

exports.default = clearChildNodes;

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
function addEventsGenerator(handler) {
  handler.showInit();
  // add all eventListener
  var list = document.querySelector('#list');
  list.addEventListener('click', handler.clickLi, false);
  list.addEventListener('click', handler.removeLi, false);
  document.addEventListener('keydown', handler.enterAdd, false);
  document.querySelector('#add').addEventListener('click', handler.add, false);
  document.querySelector('#showDone').addEventListener('click', handler.showDone, false);
  document.querySelector('#showTodo').addEventListener('click', handler.showTodo, false);
  document.querySelector('#showAll').addEventListener('click', handler.showAll, false);
  document.querySelector('#showClearDone').addEventListener('click', handler.showClearDone, false);
  document.querySelector('#showClear').addEventListener('click', handler.showClear, false);
}

exports.default = addEventsGenerator;

},{}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getFormatDate = require('../getFormatDate');

var _getFormatDate2 = _interopRequireDefault(_getFormatDate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var eventsHandlerGeneral = function () {
  function resetInput() {
    document.querySelector('#input').value = '';
  }

  function dataGenerator(key, value) {
    return {
      id: key,
      event: value,
      finished: false,
      date: (0, _getFormatDate2.default)('MM月dd日hh:mm')
    };
  }

  return {
    resetInput: resetInput,
    dataGenerator: dataGenerator
  };
}();

exports.default = eventsHandlerGeneral;

},{"../getFormatDate":12}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _itemGenerator = require('../templete/itemGenerator');

var _itemGenerator2 = _interopRequireDefault(_itemGenerator);

var _sentenceGenerator = require('../templete/sentenceGenerator');

var _sentenceGenerator2 = _interopRequireDefault(_sentenceGenerator);

var _clearChildNodes = require('../clearChildNodes');

var _clearChildNodes2 = _interopRequireDefault(_clearChildNodes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var refreshGeneral = function () {
  function init(dataArr) {
    _show(dataArr, _initSentence, _renderAll);
  }

  function _show(dataArr, showSentenceFunc, generateFunc) {
    if (!dataArr || dataArr.length === 0) {
      showSentenceFunc();
    } else {
      document.querySelector('#list').innerHTML = generateFunc(dataArr);
    }
  }

  function _initSentence() {
    var text = 'Welcome~, try to add your first to-do list : )';

    document.querySelector('#list').innerHTML = (0, _sentenceGenerator2.default)(text);
  }

  function all(randomAphorism, dataArr) {
    _show(dataArr, randomAphorism, _renderAll);
  }

  function _renderAll(dataArr) {
    var classifiedData = _classifyData(dataArr);

    return (0, _itemGenerator2.default)(classifiedData);
  }

  function _classifyData(dataArr) {
    var finished = [];
    var unfishied = [];

    // put the finished item to the bottom
    dataArr.forEach(function (data) {
      return data.finished ? finished.unshift(data) : unfishied.unshift(data);
    });

    return unfishied.concat(finished);
  }

  function part(randomAphorism, dataArr) {
    _show(dataArr, randomAphorism, _renderPart);
  }

  function _renderPart(dataArr) {
    return (0, _itemGenerator2.default)(dataArr.reverse());
  }

  function clear() {
    (0, _clearChildNodes2.default)(document.querySelector('#list'));
  }

  function sentenceHandler(text) {
    var rendered = (0, _sentenceGenerator2.default)(text);

    document.querySelector('#list').innerHTML = rendered;
  }

  return {
    init: init,
    all: all,
    part: part,
    clear: clear,
    sentenceHandler: sentenceHandler
  };
}();

exports.default = refreshGeneral;

},{"../clearChildNodes":5,"../templete/itemGenerator":14,"../templete/sentenceGenerator":15}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _addEventsGenerator = require('../dbGeneral/addEventsGenerator');

var _addEventsGenerator2 = _interopRequireDefault(_addEventsGenerator);

var _eventsHandler = require('../dbSuccess/eventsHandler');

var _eventsHandler2 = _interopRequireDefault(_eventsHandler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function addEvents() {
  (0, _addEventsGenerator2.default)(_eventsHandler2.default);
}

exports.default = addEvents;

},{"../dbGeneral/addEventsGenerator":6,"../dbSuccess/eventsHandler":10}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _indexeddbCrud = require('indexeddb-crud');

var _indexeddbCrud2 = _interopRequireDefault(_indexeddbCrud);

var _refresh = require('../dbSuccess/refresh');

var _refresh2 = _interopRequireDefault(_refresh);

var _eventsHandlerGeneral = require('../dbGeneral/eventsHandlerGeneral');

var _eventsHandlerGeneral2 = _interopRequireDefault(_eventsHandlerGeneral);

var _itemGenerator = require('../templete/itemGenerator');

var _itemGenerator2 = _interopRequireDefault(_itemGenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var eventsHandler = function () {
  function add() {
    var inputValue = document.querySelector('#input').value;

    if (inputValue === '') {
      window.alert('please input a real data~');
    } else {
      _addHandler(inputValue);
    }
  }

  function _addHandler(inputValue) {
    var newData = _eventsHandlerGeneral2.default.dataGenerator(_indexeddbCrud2.default.getNewKey(), inputValue);
    var rendered = (0, _itemGenerator2.default)(newData);

    removeInit();
    document.querySelector('#list').insertAdjacentHTML('afterbegin', rendered); // PUNCHLINE: use insertAdjacentHTML
    _eventsHandlerGeneral2.default.resetInput();
    _indexeddbCrud2.default.addItem(newData);
  }

  function removeInit() {
    var list = document.querySelector('#list');

    if (list.firstChild.className === 'aphorism') {
      list.removeChild(list.firstChild);
    }
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
        // test whether is x
        targetLi.classList.toggle('finished'); // toggle appearance

        // use previously stored data-id attribute
        var id = parseInt(targetLi.getAttribute('data-id'), 10);

        _indexeddbCrud2.default.getItem(id, _toggleLi);
      }
    }
  }

  function _toggleLi(data) {
    var newData = data;

    newData.finished = !data.finished;
    _indexeddbCrud2.default.updateItem(newData, showAll);
  }

  // li's [x]'s delete
  function removeLi(e) {
    if (e.target.className === 'close') {
      // use event delegation
      // delete visually
      document.querySelector('#list').removeChild(e.target.parentNode);
      _addRandom();
      // use previously stored data
      var id = parseInt(e.target.parentNode.getAttribute('data-id'), 10);
      // delete actually
      _indexeddbCrud2.default.removeItem(id);
    }
  }

  // for Semantic
  function _addRandom() {
    var list = document.querySelector('#list');

    if (!list.hasChildNodes()) {
      _refresh2.default.random();
    }
  }

  function showInit() {
    _indexeddbCrud2.default.getAll(_refresh2.default.init);
  }

  function showAll() {
    _indexeddbCrud2.default.getAll(_refresh2.default.all);
  }

  function showDone() {
    _showWhetherDone(true);
  }

  function showTodo() {
    _showWhetherDone(false);
  }

  function _showWhetherDone(whetherDone) {
    var condition = 'finished';

    _indexeddbCrud2.default.getWhetherConditionItem(condition, whetherDone, _refresh2.default.part);
  }

  function showClearDone() {
    var condition = 'finished';

    _indexeddbCrud2.default.removeWhetherConditionItem(condition, true, function () {
      _indexeddbCrud2.default.getAll(_refresh2.default.part);
    });
  }

  function showClear() {
    _refresh2.default.clear(); // clear nodes visually
    _refresh2.default.random();
    _indexeddbCrud2.default.clear(); // clear data indeed
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

},{"../dbGeneral/eventsHandlerGeneral":7,"../dbSuccess/refresh":11,"../templete/itemGenerator":14,"indexeddb-crud":2}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _indexeddbCrud = require('indexeddb-crud');

var _indexeddbCrud2 = _interopRequireDefault(_indexeddbCrud);

var _refreshGeneral = require('../dbGeneral/refreshGeneral');

var _refreshGeneral2 = _interopRequireDefault(_refreshGeneral);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Refresh = function () {
  function randomAphorism() {
    var storeName = 'aphorism';
    var randomIndex = Math.ceil(Math.random() * _indexeddbCrud2.default.getLength(storeName));

    _indexeddbCrud2.default.getItem(randomIndex, _parseText, storeName);
  }

  function _parseText(data) {
    var text = data.content;

    _refreshGeneral2.default.sentenceHandler(text);
  }

  return {
    init: _refreshGeneral2.default.init,
    all: _refreshGeneral2.default.all.bind(null, randomAphorism), // PUNCHLINE: use bind to pass paramter
    part: _refreshGeneral2.default.part.bind(null, randomAphorism),
    clear: _refreshGeneral2.default.clear,
    random: randomAphorism
  };
  // return {
  //   init: General.init,
  //   FIXME: why this method can't work
  //   all: () => General.all(randomAphorism),
  //   part: () => General.part(randomAphorism),
  //   clear: General.clear,
  //   random: randomAphorism,
  // };
}();

exports.default = Refresh;

},{"../dbGeneral/refreshGeneral":8,"indexeddb-crud":2}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
function getFormatDate(fmt) {
  var newDate = new Date();
  var o = {
    'y+': newDate.getFullYear(),
    'M+': newDate.getMonth() + 1,
    'd+': newDate.getDate(),
    'h+': newDate.getHours(),
    'm+': newDate.getMinutes()
  };
  var newfmt = fmt;

  Object.keys(o).forEach(function (k) {
    if (new RegExp('(' + k + ')').test(newfmt)) {
      if (k === 'y+') {
        newfmt = newfmt.replace(RegExp.$1, ('' + o[k]).substr(4 - RegExp.$1.length));
      } else if (k === 'S+') {
        var lens = RegExp.$1.length;
        lens = lens === 1 ? 3 : lens;
        newfmt = newfmt.replace(RegExp.$1, ('00' + o[k]).substr(('' + o[k]).length - 1, lens));
      } else {
        newfmt = newfmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length));
      }
    }
  });
  // for (const k in o) {
  //   if (new RegExp(`(${k})`).test(newfmt)) {
  //     if (k === 'y+') {
  //       newfmt = newfmt.replace(RegExp.$1, (`${o[k]}`).substr(4 - RegExp.$1.length));
  //     } else if (k === 'S+') {
  //       let lens = RegExp.$1.length;
  //       lens = lens === 1 ? 3 : lens;
  //       newfmt = newfmt.replace(RegExp.$1, (`00${o[k]}`).substr((`${o[k]}`).length - 1, lens));
  //     } else {
  //       newfmt = newfmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : ((`00${o[k]}`).substr((`${o[k]}`).length)));
  //     }
  //   }
  // }

  return newfmt;
}

exports.default = getFormatDate;

},{}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
function lazyLoadWithoutDB() {
  var element = document.createElement('script');

  element.type = 'text/javascript';
  element.async = true;
  element.src = './dist/scripts/lazyLoad.min.js';
  document.body.appendChild(element);
}

exports.default = lazyLoadWithoutDB;

},{}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
function itemGenerator(dataArr) {
  var template = Handlebars.templates.li;
  var result = dataArr;

  if (!Array.isArray(dataArr)) {
    result = [dataArr];
  }
  var rendered = template({ listItems: result });

  return rendered.trim();
}

exports.default = itemGenerator;

},{}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
function sentenceGenerator(text) {
  var template = Handlebars.templates.li;
  var rendered = template({ sentence: text });

  return rendered.trim();
}

exports.default = sentenceGenerator;

},{}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function template() {
  var template = Handlebars.template,
      templates = Handlebars.templates = Handlebars.templates || {};
  templates['li'] = template({ "1": function _(container, depth0, helpers, partials, data) {
      var helper;

      return "  <li class=\"aphorism\">" + container.escapeExpression((helper = (helper = helpers.sentence || (depth0 != null ? depth0.sentence : depth0)) != null ? helper : helpers.helperMissing, typeof helper === "function" ? helper.call(depth0 != null ? depth0 : container.nullContext || {}, { "name": "sentence", "hash": {}, "data": data }) : helper)) + "</li>\n";
    }, "3": function _(container, depth0, helpers, partials, data) {
      var stack1;

      return (stack1 = helpers.each.call(depth0 != null ? depth0 : container.nullContext || {}, depth0 != null ? depth0.listItems : depth0, { "name": "each", "hash": {}, "fn": container.program(4, data, 0), "inverse": container.noop, "data": data })) != null ? stack1 : "";
    }, "4": function _(container, depth0, helpers, partials, data) {
      var stack1;

      return (stack1 = helpers["if"].call(depth0 != null ? depth0 : container.nullContext || {}, depth0 != null ? depth0.finished : depth0, { "name": "if", "hash": {}, "fn": container.program(5, data, 0), "inverse": container.program(7, data, 0), "data": data })) != null ? stack1 : "";
    }, "5": function _(container, depth0, helpers, partials, data) {
      var helper,
          alias1 = depth0 != null ? depth0 : container.nullContext || {},
          alias2 = helpers.helperMissing,
          alias3 = "function",
          alias4 = container.escapeExpression;

      return "      <li class=\"finished\" data-id=" + alias4((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias2, (typeof helper === "undefined" ? "undefined" : _typeof(helper)) === alias3 ? helper.call(alias1, { "name": "id", "hash": {}, "data": data }) : helper)) + ">\n        " + alias4((helper = (helper = helpers.date || (depth0 != null ? depth0.date : depth0)) != null ? helper : alias2, (typeof helper === "undefined" ? "undefined" : _typeof(helper)) === alias3 ? helper.call(alias1, { "name": "date", "hash": {}, "data": data }) : helper)) + " : \n        <span>" + alias4((helper = (helper = helpers.event || (depth0 != null ? depth0.event : depth0)) != null ? helper : alias2, (typeof helper === "undefined" ? "undefined" : _typeof(helper)) === alias3 ? helper.call(alias1, { "name": "event", "hash": {}, "data": data }) : helper)) + "</span>\n        <span class=\"close\">×</span>\n      </li>\n";
    }, "7": function _(container, depth0, helpers, partials, data) {
      var helper,
          alias1 = depth0 != null ? depth0 : container.nullContext || {},
          alias2 = helpers.helperMissing,
          alias3 = "function",
          alias4 = container.escapeExpression;

      return "      <li data-id=" + alias4((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias2, (typeof helper === "undefined" ? "undefined" : _typeof(helper)) === alias3 ? helper.call(alias1, { "name": "id", "hash": {}, "data": data }) : helper)) + ">\n        " + alias4((helper = (helper = helpers.date || (depth0 != null ? depth0.date : depth0)) != null ? helper : alias2, (typeof helper === "undefined" ? "undefined" : _typeof(helper)) === alias3 ? helper.call(alias1, { "name": "date", "hash": {}, "data": data }) : helper)) + " : \n        <span>" + alias4((helper = (helper = helpers.event || (depth0 != null ? depth0.event : depth0)) != null ? helper : alias2, (typeof helper === "undefined" ? "undefined" : _typeof(helper)) === alias3 ? helper.call(alias1, { "name": "event", "hash": {}, "data": data }) : helper)) + "</span>\n        <span class=\"close\">×</span>\n      </li>\n";
    }, "compiler": [7, ">= 4.0.0"], "main": function main(container, depth0, helpers, partials, data) {
      var stack1;

      return (stack1 = helpers["if"].call(depth0 != null ? depth0 : container.nullContext || {}, depth0 != null ? depth0.sentence : depth0, { "name": "if", "hash": {}, "fn": container.program(1, data, 0), "inverse": container.program(3, data, 0), "data": data })) != null ? stack1 : "";
    }, "useData": true });
};

exports.default = template;

},{}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5kZXhlZGRiLWNydWQvZGlzdC9pbmRleGVkZGItY3J1ZC5qcyIsIm5vZGVfbW9kdWxlcy9pbmRleGVkZGItY3J1ZC9pbmRleC5qcyIsInNyYy9zY3JpcHRzL2RiL2NvbmZpZy5qcyIsInNyYy9zY3JpcHRzL21haW4uanMiLCJzcmMvc2NyaXB0cy91dGxpcy9jbGVhckNoaWxkTm9kZXMuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkdlbmVyYWwvYWRkRXZlbnRzR2VuZXJhdG9yLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJHZW5lcmFsL2V2ZW50c0hhbmRsZXJHZW5lcmFsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJHZW5lcmFsL3JlZnJlc2hHZW5lcmFsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJTdWNjZXNzL2FkZEV2ZW50cy5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2RiU3VjY2Vzcy9ldmVudHNIYW5kbGVyLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJTdWNjZXNzL3JlZnJlc2guanMiLCJzcmMvc2NyaXB0cy91dGxpcy9nZXRGb3JtYXREYXRlLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvbGF6eUxvYWRXaXRob3V0REIuanMiLCJzcmMvc2NyaXB0cy91dGxpcy90ZW1wbGV0ZS9pdGVtR2VuZXJhdG9yLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvdGVtcGxldGUvc2VudGVuY2VHZW5lcmF0b3IuanMiLCJ0ZW1wbGV0ZS90ZW1wbGF0ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QU8sSUFBUixFQUFhLFFBQU8sRUFBcEIsRUFBdUIsTUFBSyxVQUFVLE9BQVYsQ0FBa0IsQ0FBbEIsRUFBcUIsSUFBckIsRUFBMkIsQ0FBM0IsQ0FBNUIsRUFBMEQsV0FBVSxVQUFVLE9BQVYsQ0FBa0IsQ0FBbEIsRUFBcUIsSUFBckIsRUFBMkIsQ0FBM0IsQ0FBcEUsRUFBa0csUUFBTyxJQUF6RyxFQUF2SCxDQUFWLEtBQXFQLElBQXJQLEdBQTRQLE1BQTVQLEdBQXFRLEVBQTdRO0FBQ0QsS0F0QzBCLEVBc0N6QixXQUFVLElBdENlLEVBQVQsQ0FBbEI7QUF1Q0M7O2tCQUVjLFEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xudmFyIEluZGV4ZWREQkhhbmRsZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBfZGIgPSB2b2lkIDA7XG4gIHZhciBfZGVmYXVsdFN0b3JlTmFtZSA9IHZvaWQgMDtcbiAgdmFyIF9wcmVzZW50S2V5ID0ge307IC8vIHN0b3JlIG11bHRpLW9iamVjdFN0b3JlJ3MgcHJlc2VudEtleVxuXG4gIGZ1bmN0aW9uIG9wZW4oY29uZmlnLCBvcGVuU3VjY2Vzc0NhbGxiYWNrLCBvcGVuRmFpbENhbGxiYWNrKSB7XG4gICAgLy8gaW5pdCBvcGVuIGluZGV4ZWREQlxuICAgIGlmICghd2luZG93LmluZGV4ZWREQikge1xuICAgICAgLy8gZmlyc3RseSBpbnNwZWN0IGJyb3dzZXIncyBzdXBwb3J0IGZvciBpbmRleGVkREJcbiAgICAgIGlmIChvcGVuRmFpbENhbGxiYWNrKSB7XG4gICAgICAgIG9wZW5GYWlsQ2FsbGJhY2soKTsgLy8gUFVOQ0hMSU5FOiBvZmZlciB3aXRob3V0LURCIGhhbmRsZXJcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdpbmRvdy5hbGVydCgnXFx1MjcxNCBZb3VyIGJyb3dzZXIgZG9lc25cXCd0IHN1cHBvcnQgYSBzdGFibGUgdmVyc2lvbiBvZiBJbmRleGVkREIuIFlvdSBjYW4gaW5zdGFsbCBsYXRlc3QgQ2hyb21lIG9yIEZpcmVGb3ggdG8gaGFuZGxlciBpdCcpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgX29wZW5IYW5kbGVyKGNvbmZpZywgb3BlblN1Y2Nlc3NDYWxsYmFjayk7XG5cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9vcGVuSGFuZGxlcihjb25maWcsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBvcGVuUmVxdWVzdCA9IHdpbmRvdy5pbmRleGVkREIub3Blbihjb25maWcubmFtZSwgY29uZmlnLnZlcnNpb24pOyAvLyBvcGVuIGluZGV4ZWREQlxuXG4gICAgLy8gYW4gb25ibG9ja2VkIGV2ZW50IGlzIGZpcmVkIHVudGlsIHRoZXkgYXJlIGNsb3NlZCBvciByZWxvYWRlZFxuICAgIG9wZW5SZXF1ZXN0Lm9uYmxvY2tlZCA9IGZ1bmN0aW9uIGJsb2NrZWRTY2hlbWVVcCgpIHtcbiAgICAgIC8vIElmIHNvbWUgb3RoZXIgdGFiIGlzIGxvYWRlZCB3aXRoIHRoZSBkYXRhYmFzZSwgdGhlbiBpdCBuZWVkcyB0byBiZSBjbG9zZWQgYmVmb3JlIHdlIGNhbiBwcm9jZWVkLlxuICAgICAgd2luZG93LmFsZXJ0KCdQbGVhc2UgY2xvc2UgYWxsIG90aGVyIHRhYnMgd2l0aCB0aGlzIHNpdGUgb3BlbicpO1xuICAgIH07XG5cbiAgICAvLyBDcmVhdGluZyBvciB1cGRhdGluZyB0aGUgdmVyc2lvbiBvZiB0aGUgZGF0YWJhc2VcbiAgICBvcGVuUmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSBmdW5jdGlvbiBzY2hlbWFVcChlKSB7XG4gICAgICAvLyBBbGwgb3RoZXIgZGF0YWJhc2VzIGhhdmUgYmVlbiBjbG9zZWQuIFNldCBldmVyeXRoaW5nIHVwLlxuICAgICAgX2RiID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgb251cGdyYWRlbmVlZGVkIGluJyk7XG4gICAgICBfY3JlYXRlT2JqZWN0U3RvcmVIYW5kbGVyKGNvbmZpZy5zdG9yZUNvbmZpZyk7XG4gICAgfTtcblxuICAgIG9wZW5SZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIG9wZW5TdWNjZXNzKGUpIHtcbiAgICAgIF9kYiA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgIF9kYi5vbnZlcnNpb25jaGFuZ2UgPSBmdW5jdGlvbiB2ZXJzaW9uY2hhbmdlSGFuZGxlcigpIHtcbiAgICAgICAgX2RiLmNsb3NlKCk7XG4gICAgICAgIHdpbmRvdy5hbGVydCgnQSBuZXcgdmVyc2lvbiBvZiB0aGlzIHBhZ2UgaXMgcmVhZHkuIFBsZWFzZSByZWxvYWQnKTtcbiAgICAgIH07XG4gICAgICBfb3BlblN1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoY29uZmlnLnN0b3JlQ29uZmlnLCBzdWNjZXNzQ2FsbGJhY2spO1xuICAgIH07XG5cbiAgICAvLyB1c2UgZXJyb3IgZXZlbnRzIGJ1YmJsZSB0byBoYW5kbGUgYWxsIGVycm9yIGV2ZW50c1xuICAgIG9wZW5SZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbiBvcGVuRXJyb3IoZSkge1xuICAgICAgd2luZG93LmFsZXJ0KCdTb21ldGhpbmcgaXMgd3Jvbmcgd2l0aCBpbmRleGVkREIsIGZvciBtb3JlIGluZm9ybWF0aW9uLCBjaGVja291dCBjb25zb2xlJyk7XG4gICAgICBjb25zb2xlLmxvZyhlLnRhcmdldC5lcnJvcik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZS50YXJnZXQuZXJyb3IpO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfb3BlblN1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoY29uZmlnU3RvcmVDb25maWcsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBvYmplY3RTdG9yZUxpc3QgPSBfcGFyc2VKU09ORGF0YShjb25maWdTdG9yZUNvbmZpZywgJ3N0b3JlTmFtZScpO1xuXG4gICAgb2JqZWN0U3RvcmVMaXN0LmZvckVhY2goZnVuY3Rpb24gKHN0b3JlQ29uZmlnLCBpbmRleCkge1xuICAgICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICAgIF9kZWZhdWx0U3RvcmVOYW1lID0gc3RvcmVDb25maWcuc3RvcmVOYW1lOyAvLyBQVU5DSExJTkU6IHRoZSBsYXN0IHN0b3JlTmFtZSBpcyBkZWZhdWx0U3RvcmVOYW1lXG4gICAgICB9XG4gICAgICBpZiAoaW5kZXggPT09IG9iamVjdFN0b3JlTGlzdC5sZW5ndGggLSAxKSB7XG4gICAgICAgIF9nZXRQcmVzZW50S2V5KHN0b3JlQ29uZmlnLnN0b3JlTmFtZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjaygpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIG9wZW4gaW5kZXhlZERCIHN1Y2Nlc3MnKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfZ2V0UHJlc2VudEtleShzdG9yZUNvbmZpZy5zdG9yZU5hbWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8gc2V0IHByZXNlbnQga2V5IHZhbHVlIHRvIF9wcmVzZW50S2V5ICh0aGUgcHJpdmF0ZSBwcm9wZXJ0eSlcbiAgZnVuY3Rpb24gX2dldFByZXNlbnRLZXkoc3RvcmVOYW1lLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0pO1xuXG4gICAgX3ByZXNlbnRLZXlbc3RvcmVOYW1lXSA9IDA7XG4gICAgX2dldEFsbFJlcXVlc3QodHJhbnNhY3Rpb24sIHN0b3JlTmFtZSkub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0QWxsU3VjY2VzcyhlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIF9wcmVzZW50S2V5W3N0b3JlTmFtZV0gPSBjdXJzb3IudmFsdWUuaWQ7XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfVxuICAgIH07XG4gICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGNvbXBsZXRlR2V0UHJlc2VudEtleSgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIG5vdyAnICsgc3RvcmVOYW1lICsgJyBcXCdzIG1heCBrZXkgaXMgJyArIF9wcmVzZW50S2V5W3N0b3JlTmFtZV0pOyAvLyBpbml0aWFsIHZhbHVlIGlzIDBcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIG9wZW5TdWNjZXNzQ2FsbGJhY2sgZmluaXNoZWQnKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gX2NyZWF0ZU9iamVjdFN0b3JlSGFuZGxlcihjb25maWdTdG9yZUNvbmZpZykge1xuICAgIF9wYXJzZUpTT05EYXRhKGNvbmZpZ1N0b3JlQ29uZmlnLCAnc3RvcmVOYW1lJykuZm9yRWFjaChmdW5jdGlvbiAoc3RvcmVDb25maWcpIHtcbiAgICAgIGlmICghX2RiLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoc3RvcmVDb25maWcuc3RvcmVOYW1lKSkge1xuICAgICAgICBfY3JlYXRlT2JqZWN0U3RvcmUoc3RvcmVDb25maWcpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gX2NyZWF0ZU9iamVjdFN0b3JlKHN0b3JlQ29uZmlnKSB7XG4gICAgdmFyIHN0b3JlID0gX2RiLmNyZWF0ZU9iamVjdFN0b3JlKHN0b3JlQ29uZmlnLnN0b3JlTmFtZSwgeyBrZXlQYXRoOiBzdG9yZUNvbmZpZy5rZXksIGF1dG9JbmNyZW1lbnQ6IHRydWUgfSk7XG5cbiAgICAvLyBVc2UgdHJhbnNhY3Rpb24gb25jb21wbGV0ZSB0byBtYWtlIHN1cmUgdGhlIG9iamVjdCBTdG9yZSBjcmVhdGlvbiBpcyBmaW5pc2hlZFxuICAgIHN0b3JlLnRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSBmdW5jdGlvbiBhZGRpbml0aWFsRGF0YSgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGNyZWF0ZSAnICsgc3RvcmVDb25maWcuc3RvcmVOYW1lICsgJyBcXCdzIG9iamVjdCBzdG9yZSBzdWNjZWVkJyk7XG4gICAgICBpZiAoc3RvcmVDb25maWcuaW5pdGlhbERhdGEpIHtcbiAgICAgICAgLy8gU3RvcmUgaW5pdGlhbCB2YWx1ZXMgaW4gdGhlIG5ld2x5IGNyZWF0ZWQgb2JqZWN0IHN0b3JlLlxuICAgICAgICBfaW5pdGlhbERhdGFIYW5kbGVyKHN0b3JlQ29uZmlnLnN0b3JlTmFtZSwgc3RvcmVDb25maWcuaW5pdGlhbERhdGEpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfaW5pdGlhbERhdGFIYW5kbGVyKHN0b3JlTmFtZSwgaW5pdGlhbERhdGEpIHtcbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcbiAgICB2YXIgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpO1xuXG4gICAgX3BhcnNlSlNPTkRhdGEoaW5pdGlhbERhdGEsICdpbml0aWFsJykuZm9yRWFjaChmdW5jdGlvbiAoZGF0YSwgaW5kZXgpIHtcbiAgICAgIHZhciBhZGRSZXF1ZXN0ID0gb2JqZWN0U3RvcmUuYWRkKGRhdGEpO1xuXG4gICAgICBhZGRSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGFkZEluaXRpYWxTdWNjZXNzKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBhZGQgaW5pdGlhbCBkYXRhWycgKyBpbmRleCArICddIHN1Y2Nlc3NlZCcpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gYWRkQWxsRGF0YURvbmUoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBhZGQgYWxsICcgKyBzdG9yZU5hbWUgKyAnIFxcJ3MgaW5pdGlhbCBkYXRhIGRvbmUgOiknKTtcbiAgICAgIF9nZXRQcmVzZW50S2V5KHN0b3JlTmFtZSk7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9wYXJzZUpTT05EYXRhKHJhd2RhdGEsIG5hbWUpIHtcbiAgICB0cnkge1xuICAgICAgdmFyIHBhcnNlZERhdGEgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHJhd2RhdGEpKTtcblxuICAgICAgcmV0dXJuIHBhcnNlZERhdGE7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHdpbmRvdy5hbGVydCgncGxlYXNlIHNldCBjb3JyZWN0ICcgKyBuYW1lICsgJyBhcnJheSBvYmplY3QgOiknKTtcbiAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldExlbmd0aCgpIHtcbiAgICB2YXIgc3RvcmVOYW1lID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiBfZGVmYXVsdFN0b3JlTmFtZTtcblxuICAgIHJldHVybiBfcHJlc2VudEtleVtzdG9yZU5hbWVdO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TmV3S2V5KCkge1xuICAgIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuXG4gICAgX3ByZXNlbnRLZXlbc3RvcmVOYW1lXSArPSAxO1xuXG4gICAgcmV0dXJuIF9wcmVzZW50S2V5W3N0b3JlTmFtZV07XG4gIH1cblxuICAvKiBDUlVEICovXG5cbiAgZnVuY3Rpb24gYWRkSXRlbShuZXdEYXRhLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgc3RvcmVOYW1lID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiBfZGVmYXVsdFN0b3JlTmFtZTtcblxuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuICAgIHZhciBhZGRSZXF1ZXN0ID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKS5hZGQobmV3RGF0YSk7XG5cbiAgICBhZGRSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGFkZFN1Y2Nlc3MoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBhZGQgJyArIHN0b3JlTmFtZSArICdcXCdzICcgKyBhZGRSZXF1ZXN0LnNvdXJjZS5rZXlQYXRoICsgJyAgPSAnICsgbmV3RGF0YVthZGRSZXF1ZXN0LnNvdXJjZS5rZXlQYXRoXSArICcgZGF0YSBzdWNjZWVkIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhuZXdEYXRhKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0SXRlbShrZXksIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuXG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdKTtcbiAgICB2YXIgZ2V0UmVxdWVzdCA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHN0b3JlTmFtZSkuZ2V0KHBhcnNlSW50KGtleSwgMTApKTsgLy8gZ2V0IGl0IGJ5IGluZGV4XG5cbiAgICBnZXRSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGdldFN1Y2Nlc3MoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBnZXQgJyArIHN0b3JlTmFtZSArICdcXCdzICcgKyBnZXRSZXF1ZXN0LnNvdXJjZS5rZXlQYXRoICsgJyA9ICcgKyBrZXkgKyAnIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2soZ2V0UmVxdWVzdC5yZXN1bHQpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyBnZXQgY29uZGl0aW9uYWwgZGF0YSAoYm9vbGVhbiBjb25kaXRpb24pXG4gIGZ1bmN0aW9uIGdldFdoZXRoZXJDb25kaXRpb25JdGVtKGNvbmRpdGlvbiwgd2hldGhlciwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHN0b3JlTmFtZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDogX2RlZmF1bHRTdG9yZU5hbWU7XG5cbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0pO1xuICAgIHZhciByZXN1bHQgPSBbXTsgLy8gdXNlIGFuIGFycmF5IHRvIHN0b3JhZ2UgZWxpZ2libGUgZGF0YVxuXG4gICAgX2dldEFsbFJlcXVlc3QodHJhbnNhY3Rpb24sIHN0b3JlTmFtZSkub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0QWxsU3VjY2VzcyhlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIGlmICh3aGV0aGVyKSB7XG4gICAgICAgICAgaWYgKGN1cnNvci52YWx1ZVtjb25kaXRpb25dKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChjdXJzb3IudmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghd2hldGhlcikge1xuICAgICAgICAgIGlmICghY3Vyc29yLnZhbHVlW2NvbmRpdGlvbl0pIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGN1cnNvci52YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfVxuICAgIH07XG4gICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGNvbXBsZXRlQWRkQWxsKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgZ2V0ICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgY29uZGl0aW9uICsgJyA9ICcgKyB3aGV0aGVyICsgJyBkYXRhIHN1Y2Nlc3MgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3VsdCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEFsbChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgc3RvcmVOYW1lID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiBfZGVmYXVsdFN0b3JlTmFtZTtcblxuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSk7XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgX2dldEFsbFJlcXVlc3QodHJhbnNhY3Rpb24sIHN0b3JlTmFtZSkub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0QWxsU3VjY2VzcyhlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGN1cnNvci52YWx1ZSk7XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfVxuICAgIH07XG4gICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGNvbXBsZXRlR2V0QWxsKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgZ2V0ICcgKyBzdG9yZU5hbWUgKyAnXFwncyBhbGwgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXN1bHQpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmVJdGVtKGtleSwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHN0b3JlTmFtZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDogX2RlZmF1bHRTdG9yZU5hbWU7XG5cbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcbiAgICB2YXIgZGVsZXRlUmVxdWVzdCA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHN0b3JlTmFtZSkuZGVsZXRlKGtleSk7XG5cbiAgICBkZWxldGVSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGRlbGV0ZVN1Y2Nlc3MoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyByZW1vdmUgJyArIHN0b3JlTmFtZSArICdcXCdzICAnICsgZGVsZXRlUmVxdWVzdC5zb3VyY2Uua2V5UGF0aCArICcgPSAnICsga2V5ICsgJyBkYXRhIHN1Y2Nlc3MgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKGtleSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZVdoZXRoZXJDb25kaXRpb25JdGVtKGNvbmRpdGlvbiwgd2hldGhlciwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHN0b3JlTmFtZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDogX2RlZmF1bHRTdG9yZU5hbWU7XG5cbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcblxuICAgIF9nZXRBbGxSZXF1ZXN0KHRyYW5zYWN0aW9uLCBzdG9yZU5hbWUpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGdldEFsbFN1Y2Nlc3MoZSkge1xuICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICBpZiAod2hldGhlcikge1xuICAgICAgICAgIGlmIChjdXJzb3IudmFsdWVbY29uZGl0aW9uXSkge1xuICAgICAgICAgICAgY3Vyc29yLmRlbGV0ZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghd2hldGhlcikge1xuICAgICAgICAgIGlmICghY3Vyc29yLnZhbHVlW2NvbmRpdGlvbl0pIHtcbiAgICAgICAgICAgIGN1cnNvci5kZWxldGUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gY29tcGxldGVSZW1vdmVXaGV0aGVyKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgcmVtb3ZlICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgY29uZGl0aW9uICsgJyA9ICcgKyB3aGV0aGVyICsgJyBkYXRhIHN1Y2Nlc3MgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuXG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdLCAncmVhZHdyaXRlJyk7XG5cbiAgICBfZ2V0QWxsUmVxdWVzdCh0cmFuc2FjdGlvbiwgc3RvcmVOYW1lKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRBbGxTdWNjZXNzKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgY3Vyc29yLmRlbGV0ZSgpO1xuICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSBmdW5jdGlvbiBjb21wbGV0ZUNsZWFyKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgY2xlYXIgJyArIHN0b3JlTmFtZSArICdcXCdzIGFsbCBkYXRhIHN1Y2Nlc3MgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKCdjbGVhciBhbGwgZGF0YSBzdWNjZXNzJyk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8vIHVwZGF0ZSBvbmVcbiAgZnVuY3Rpb24gdXBkYXRlSXRlbShuZXdEYXRhLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgc3RvcmVOYW1lID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiBfZGVmYXVsdFN0b3JlTmFtZTtcblxuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuICAgIHZhciBwdXRSZXF1ZXN0ID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKS5wdXQobmV3RGF0YSk7XG5cbiAgICBwdXRSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIHB1dFN1Y2Nlc3MoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyB1cGRhdGUgJyArIHN0b3JlTmFtZSArICdcXCdzICcgKyBwdXRSZXF1ZXN0LnNvdXJjZS5rZXlQYXRoICsgJyAgPSAnICsgbmV3RGF0YVtwdXRSZXF1ZXN0LnNvdXJjZS5rZXlQYXRoXSArICcgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhuZXdEYXRhKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gX2dldEFsbFJlcXVlc3QodHJhbnNhY3Rpb24sIHN0b3JlTmFtZSkge1xuICAgIHJldHVybiB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpLm9wZW5DdXJzb3IoSURCS2V5UmFuZ2UubG93ZXJCb3VuZCgxKSwgJ25leHQnKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb3Blbjogb3BlbixcbiAgICBnZXRMZW5ndGg6IGdldExlbmd0aCxcbiAgICBnZXROZXdLZXk6IGdldE5ld0tleSxcbiAgICBnZXRJdGVtOiBnZXRJdGVtLFxuICAgIGdldFdoZXRoZXJDb25kaXRpb25JdGVtOiBnZXRXaGV0aGVyQ29uZGl0aW9uSXRlbSxcbiAgICBnZXRBbGw6IGdldEFsbCxcbiAgICBhZGRJdGVtOiBhZGRJdGVtLFxuICAgIHJlbW92ZUl0ZW06IHJlbW92ZUl0ZW0sXG4gICAgcmVtb3ZlV2hldGhlckNvbmRpdGlvbkl0ZW06IHJlbW92ZVdoZXRoZXJDb25kaXRpb25JdGVtLFxuICAgIGNsZWFyOiBjbGVhcixcbiAgICB1cGRhdGVJdGVtOiB1cGRhdGVJdGVtXG4gIH07XG59KCk7XG5cbmV4cG9ydHMuZGVmYXVsdCA9IEluZGV4ZWREQkhhbmRsZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleGVkZGItY3J1ZC5qcy5tYXAiLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZGlzdC9pbmRleGVkZGItY3J1ZCcpWydkZWZhdWx0J107XG4iLCJleHBvcnQgZGVmYXVsdCB7XG4gIG5hbWU6ICdKdXN0VG9EbycsXG4gIHZlcnNpb246ICcyMycsXG4gIHN0b3JlQ29uZmlnOiBbXG4gICAge1xuICAgICAgc3RvcmVOYW1lOiAnbGlzdCcsXG4gICAgICBrZXk6ICdpZCcsXG4gICAgICBpbml0aWFsRGF0YTogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6IDAsIGV2ZW50OiAnSnVzdERlbW8nLCBmaW5pc2hlZDogdHJ1ZSwgZGF0ZTogMCxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICBzdG9yZU5hbWU6ICdhcGhvcmlzbScsXG4gICAgICBrZXk6ICdpZCcsXG4gICAgICBpbml0aWFsRGF0YTogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6IDEsXG4gICAgICAgICAgY29udGVudDogXCJZb3UncmUgYmV0dGVyIHRoYW4gdGhhdFwiLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IDIsXG4gICAgICAgICAgY29udGVudDogJ1llc3RlcmRheSBZb3UgU2FpZCBUb21vcnJvdycsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogMyxcbiAgICAgICAgICBjb250ZW50OiAnV2h5IGFyZSB3ZSBoZXJlPycsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogNCxcbiAgICAgICAgICBjb250ZW50OiAnQWxsIGluLCBvciBub3RoaW5nJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiA1LFxuICAgICAgICAgIGNvbnRlbnQ6ICdZb3UgTmV2ZXIgVHJ5LCBZb3UgTmV2ZXIgS25vdycsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogNixcbiAgICAgICAgICBjb250ZW50OiAnVGhlIHVuZXhhbWluZWQgbGlmZSBpcyBub3Qgd29ydGggbGl2aW5nLiAtLSBTb2NyYXRlcycsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogNyxcbiAgICAgICAgICBjb250ZW50OiAnVGhlcmUgaXMgb25seSBvbmUgdGhpbmcgd2Ugc2F5IHRvIGxhenk6IE5PVCBUT0RBWScsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0sXG4gIF0sXG59O1xuIiwiaW1wb3J0IHsgb3BlbiBhcyBvcGVuREIgfSBmcm9tICdpbmRleGVkZGItY3J1ZCc7XG5pbXBvcnQgY29uZmlnIGZyb20gJy4vZGIvY29uZmlnJztcbmltcG9ydCB0ZW1wbGV0ZSBmcm9tICcuLi8uLi90ZW1wbGV0ZS90ZW1wbGF0ZSc7XG5pbXBvcnQgYWRkRXZlbnRzIGZyb20gJy4vdXRsaXMvZGJTdWNjZXNzL2FkZEV2ZW50cyc7XG5pbXBvcnQgbGF6eUxvYWRXaXRob3V0REIgZnJvbSAnLi91dGxpcy9sYXp5TG9hZFdpdGhvdXREQic7XG5cblxudGVtcGxldGUoKTtcbi8vIG9wZW4gREIsIGFuZCB3aGVuIERCIG9wZW4gc3VjY2VlZCwgaW52b2tlIGluaXRpYWwgZnVuY3Rpb25cbm9wZW5EQihjb25maWcsIGFkZEV2ZW50cywgbGF6eUxvYWRXaXRob3V0REIpO1xuIiwiZnVuY3Rpb24gY2xlYXJDaGlsZE5vZGVzKHJvb3QpIHtcbiAgd2hpbGUgKHJvb3QuaGFzQ2hpbGROb2RlcygpKSB7IC8vIG9yIHJvb3QuZmlyc3RDaGlsZCBvciByb290Lmxhc3RDaGlsZFxuICAgIHJvb3QucmVtb3ZlQ2hpbGQocm9vdC5maXJzdENoaWxkKTtcbiAgfVxuICAvLyBvciByb290LmlubmVySFRNTCA9ICcnXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsZWFyQ2hpbGROb2RlcztcbiIsImZ1bmN0aW9uIGFkZEV2ZW50c0dlbmVyYXRvcihoYW5kbGVyKSB7XG4gIGhhbmRsZXIuc2hvd0luaXQoKTtcbiAgLy8gYWRkIGFsbCBldmVudExpc3RlbmVyXG4gIGNvbnN0IGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICBsaXN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5jbGlja0xpLCBmYWxzZSk7XG4gIGxpc3QuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnJlbW92ZUxpLCBmYWxzZSk7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVyLmVudGVyQWRkLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhZGQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuYWRkLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93RG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93RG9uZSwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd1RvZG8nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd1RvZG8sIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dBbGwnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0FsbCwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0NsZWFyRG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93Q2xlYXJEb25lLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93Q2xlYXInKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0NsZWFyLCBmYWxzZSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFkZEV2ZW50c0dlbmVyYXRvcjtcbiIsImltcG9ydCBnZXRGb3JtYXREYXRlIGZyb20gJy4uL2dldEZvcm1hdERhdGUnO1xuXG5jb25zdCBldmVudHNIYW5kbGVyR2VuZXJhbCA9ICgoKSA9PiB7XG4gIGZ1bmN0aW9uIHJlc2V0SW5wdXQoKSB7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWUgPSAnJztcbiAgfVxuXG4gIGZ1bmN0aW9uIGRhdGFHZW5lcmF0b3Ioa2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiB7XG4gICAgICBpZDoga2V5LFxuICAgICAgZXZlbnQ6IHZhbHVlLFxuICAgICAgZmluaXNoZWQ6IGZhbHNlLFxuICAgICAgZGF0ZTogZ2V0Rm9ybWF0RGF0ZSgnTU3mnIhkZOaXpWhoOm1tJyksXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcmVzZXRJbnB1dCxcbiAgICBkYXRhR2VuZXJhdG9yLFxuICB9O1xufSkoKTtcblxuZXhwb3J0IGRlZmF1bHQgZXZlbnRzSGFuZGxlckdlbmVyYWw7XG4iLCJpbXBvcnQgaXRlbUdlbmVyYXRvciBmcm9tICcuLi90ZW1wbGV0ZS9pdGVtR2VuZXJhdG9yJztcbmltcG9ydCBzZW50ZW5jZUdlbmVyYXRvciBmcm9tICcuLi90ZW1wbGV0ZS9zZW50ZW5jZUdlbmVyYXRvcic7XG5pbXBvcnQgY2xlYXJDaGlsZE5vZGVzIGZyb20gJy4uL2NsZWFyQ2hpbGROb2Rlcyc7XG5cbmNvbnN0IHJlZnJlc2hHZW5lcmFsID0gKCgpID0+IHtcbiAgZnVuY3Rpb24gaW5pdChkYXRhQXJyKSB7XG4gICAgX3Nob3coZGF0YUFyciwgX2luaXRTZW50ZW5jZSwgX3JlbmRlckFsbCk7XG4gIH1cblxuICBmdW5jdGlvbiBfc2hvdyhkYXRhQXJyLCBzaG93U2VudGVuY2VGdW5jLCBnZW5lcmF0ZUZ1bmMpIHtcbiAgICBpZiAoIWRhdGFBcnIgfHwgZGF0YUFyci5sZW5ndGggPT09IDApIHtcbiAgICAgIHNob3dTZW50ZW5jZUZ1bmMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5pbm5lckhUTUwgPSBnZW5lcmF0ZUZ1bmMoZGF0YUFycik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX2luaXRTZW50ZW5jZSgpIHtcbiAgICBjb25zdCB0ZXh0ID0gJ1dlbGNvbWV+LCB0cnkgdG8gYWRkIHlvdXIgZmlyc3QgdG8tZG8gbGlzdCA6ICknO1xuXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5pbm5lckhUTUwgPSBzZW50ZW5jZUdlbmVyYXRvcih0ZXh0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFsbChyYW5kb21BcGhvcmlzbSwgZGF0YUFycikge1xuICAgIF9zaG93KGRhdGFBcnIsIHJhbmRvbUFwaG9yaXNtLCBfcmVuZGVyQWxsKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9yZW5kZXJBbGwoZGF0YUFycikge1xuICAgIGNvbnN0IGNsYXNzaWZpZWREYXRhID0gX2NsYXNzaWZ5RGF0YShkYXRhQXJyKTtcblxuICAgIHJldHVybiBpdGVtR2VuZXJhdG9yKGNsYXNzaWZpZWREYXRhKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9jbGFzc2lmeURhdGEoZGF0YUFycikge1xuICAgIGNvbnN0IGZpbmlzaGVkID0gW107XG4gICAgY29uc3QgdW5maXNoaWVkID0gW107XG5cbiAgICAvLyBwdXQgdGhlIGZpbmlzaGVkIGl0ZW0gdG8gdGhlIGJvdHRvbVxuICAgIGRhdGFBcnIuZm9yRWFjaChkYXRhID0+IChkYXRhLmZpbmlzaGVkID8gZmluaXNoZWQudW5zaGlmdChkYXRhKSA6IHVuZmlzaGllZC51bnNoaWZ0KGRhdGEpKSk7XG5cbiAgICByZXR1cm4gdW5maXNoaWVkLmNvbmNhdChmaW5pc2hlZCk7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJ0KHJhbmRvbUFwaG9yaXNtLCBkYXRhQXJyKSB7XG4gICAgX3Nob3coZGF0YUFyciwgcmFuZG9tQXBob3Jpc20sIF9yZW5kZXJQYXJ0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9yZW5kZXJQYXJ0KGRhdGFBcnIpIHtcbiAgICByZXR1cm4gaXRlbUdlbmVyYXRvcihkYXRhQXJyLnJldmVyc2UoKSk7XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICBjbGVhckNoaWxkTm9kZXMoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKSk7XG4gIH1cblxuICBmdW5jdGlvbiBzZW50ZW5jZUhhbmRsZXIodGV4dCkge1xuICAgIGNvbnN0IHJlbmRlcmVkID0gc2VudGVuY2VHZW5lcmF0b3IodGV4dCk7XG5cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmlubmVySFRNTCA9IHJlbmRlcmVkO1xuICB9XG5cblxuICByZXR1cm4ge1xuICAgIGluaXQsXG4gICAgYWxsLFxuICAgIHBhcnQsXG4gICAgY2xlYXIsXG4gICAgc2VudGVuY2VIYW5kbGVyLFxuICB9O1xufSkoKTtcblxuZXhwb3J0IGRlZmF1bHQgcmVmcmVzaEdlbmVyYWw7XG4iLCJpbXBvcnQgYWRkRXZlbnRzR2VuZXJhdG9yIGZyb20gJy4uL2RiR2VuZXJhbC9hZGRFdmVudHNHZW5lcmF0b3InO1xuaW1wb3J0IGV2ZW50c0hhbmRsZXIgZnJvbSAnLi4vZGJTdWNjZXNzL2V2ZW50c0hhbmRsZXInO1xuXG5mdW5jdGlvbiBhZGRFdmVudHMoKSB7XG4gIGFkZEV2ZW50c0dlbmVyYXRvcihldmVudHNIYW5kbGVyKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYWRkRXZlbnRzO1xuIiwiaW1wb3J0IERCIGZyb20gJ2luZGV4ZWRkYi1jcnVkJztcbmltcG9ydCBSZWZyZXNoIGZyb20gJy4uL2RiU3VjY2Vzcy9yZWZyZXNoJztcbmltcG9ydCBHZW5lcmFsIGZyb20gJy4uL2RiR2VuZXJhbC9ldmVudHNIYW5kbGVyR2VuZXJhbCc7XG5pbXBvcnQgaXRlbUdlbmVyYXRvciBmcm9tICcuLi90ZW1wbGV0ZS9pdGVtR2VuZXJhdG9yJztcblxuY29uc3QgZXZlbnRzSGFuZGxlciA9ICgoKSA9PiB7XG4gIGZ1bmN0aW9uIGFkZCgpIHtcbiAgICBjb25zdCBpbnB1dFZhbHVlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWU7XG5cbiAgICBpZiAoaW5wdXRWYWx1ZSA9PT0gJycpIHtcbiAgICAgIHdpbmRvdy5hbGVydCgncGxlYXNlIGlucHV0IGEgcmVhbCBkYXRhficpO1xuICAgIH0gZWxzZSB7XG4gICAgICBfYWRkSGFuZGxlcihpbnB1dFZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfYWRkSGFuZGxlcihpbnB1dFZhbHVlKSB7XG4gICAgY29uc3QgbmV3RGF0YSA9IEdlbmVyYWwuZGF0YUdlbmVyYXRvcihEQi5nZXROZXdLZXkoKSwgaW5wdXRWYWx1ZSk7XG4gICAgY29uc3QgcmVuZGVyZWQgPSBpdGVtR2VuZXJhdG9yKG5ld0RhdGEpO1xuXG4gICAgcmVtb3ZlSW5pdCgpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuaW5zZXJ0QWRqYWNlbnRIVE1MKCdhZnRlcmJlZ2luJywgcmVuZGVyZWQpOyAvLyBQVU5DSExJTkU6IHVzZSBpbnNlcnRBZGphY2VudEhUTUxcbiAgICBHZW5lcmFsLnJlc2V0SW5wdXQoKTtcbiAgICBEQi5hZGRJdGVtKG5ld0RhdGEpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlSW5pdCgpIHtcbiAgICBjb25zdCBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcblxuICAgIGlmIChsaXN0LmZpcnN0Q2hpbGQuY2xhc3NOYW1lID09PSAnYXBob3Jpc20nKSB7XG4gICAgICBsaXN0LnJlbW92ZUNoaWxkKGxpc3QuZmlyc3RDaGlsZCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZW50ZXJBZGQoZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzKSB7XG4gICAgICBhZGQoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjbGlja0xpKGUpIHtcbiAgICBjb25zdCB0YXJnZXRMaSA9IGUudGFyZ2V0O1xuICAgIC8vIHVzZSBldmVudCBkZWxlZ2F0aW9uXG5cbiAgICBpZiAoIXRhcmdldExpLmNsYXNzTGlzdC5jb250YWlucygnYXBob3Jpc20nKSkge1xuICAgICAgaWYgKHRhcmdldExpLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpKSB7IC8vIHRlc3Qgd2hldGhlciBpcyB4XG4gICAgICAgIHRhcmdldExpLmNsYXNzTGlzdC50b2dnbGUoJ2ZpbmlzaGVkJyk7IC8vIHRvZ2dsZSBhcHBlYXJhbmNlXG5cbiAgICAgICAgLy8gdXNlIHByZXZpb3VzbHkgc3RvcmVkIGRhdGEtaWQgYXR0cmlidXRlXG4gICAgICAgIGNvbnN0IGlkID0gcGFyc2VJbnQodGFyZ2V0TGkuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyksIDEwKTtcblxuICAgICAgICBEQi5nZXRJdGVtKGlkLCBfdG9nZ2xlTGkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF90b2dnbGVMaShkYXRhKSB7XG4gICAgY29uc3QgbmV3RGF0YSA9IGRhdGE7XG5cbiAgICBuZXdEYXRhLmZpbmlzaGVkID0gIWRhdGEuZmluaXNoZWQ7XG4gICAgREIudXBkYXRlSXRlbShuZXdEYXRhLCBzaG93QWxsKTtcbiAgfVxuXG4gIC8vIGxpJ3MgW3hdJ3MgZGVsZXRlXG4gIGZ1bmN0aW9uIHJlbW92ZUxpKGUpIHtcbiAgICBpZiAoZS50YXJnZXQuY2xhc3NOYW1lID09PSAnY2xvc2UnKSB7IC8vIHVzZSBldmVudCBkZWxlZ2F0aW9uXG4gICAgICAvLyBkZWxldGUgdmlzdWFsbHlcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykucmVtb3ZlQ2hpbGQoZS50YXJnZXQucGFyZW50Tm9kZSk7XG4gICAgICBfYWRkUmFuZG9tKCk7XG4gICAgICAvLyB1c2UgcHJldmlvdXNseSBzdG9yZWQgZGF0YVxuICAgICAgY29uc3QgaWQgPSBwYXJzZUludChlLnRhcmdldC5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpLCAxMCk7XG4gICAgICAvLyBkZWxldGUgYWN0dWFsbHlcbiAgICAgIERCLnJlbW92ZUl0ZW0oaWQpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGZvciBTZW1hbnRpY1xuICBmdW5jdGlvbiBfYWRkUmFuZG9tKCkge1xuICAgIGNvbnN0IGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gICAgaWYgKCFsaXN0Lmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgUmVmcmVzaC5yYW5kb20oKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzaG93SW5pdCgpIHtcbiAgICBEQi5nZXRBbGwoUmVmcmVzaC5pbml0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dBbGwoKSB7XG4gICAgREIuZ2V0QWxsKFJlZnJlc2guYWxsKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dEb25lKCkge1xuICAgIF9zaG93V2hldGhlckRvbmUodHJ1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93VG9kbygpIHtcbiAgICBfc2hvd1doZXRoZXJEb25lKGZhbHNlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zaG93V2hldGhlckRvbmUod2hldGhlckRvbmUpIHtcbiAgICBjb25zdCBjb25kaXRpb24gPSAnZmluaXNoZWQnO1xuXG4gICAgREIuZ2V0V2hldGhlckNvbmRpdGlvbkl0ZW0oY29uZGl0aW9uLCB3aGV0aGVyRG9uZSwgUmVmcmVzaC5wYXJ0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dDbGVhckRvbmUoKSB7XG4gICAgY29uc3QgY29uZGl0aW9uID0gJ2ZpbmlzaGVkJztcblxuICAgIERCLnJlbW92ZVdoZXRoZXJDb25kaXRpb25JdGVtKGNvbmRpdGlvbiwgdHJ1ZSwgKCkgPT4ge1xuICAgICAgREIuZ2V0QWxsKFJlZnJlc2gucGFydCk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93Q2xlYXIoKSB7XG4gICAgUmVmcmVzaC5jbGVhcigpOyAvLyBjbGVhciBub2RlcyB2aXN1YWxseVxuICAgIFJlZnJlc2gucmFuZG9tKCk7XG4gICAgREIuY2xlYXIoKTsgLy8gY2xlYXIgZGF0YSBpbmRlZWRcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYWRkLFxuICAgIGVudGVyQWRkLFxuICAgIGNsaWNrTGksXG4gICAgcmVtb3ZlTGksXG4gICAgc2hvd0luaXQsXG4gICAgc2hvd0FsbCxcbiAgICBzaG93RG9uZSxcbiAgICBzaG93VG9kbyxcbiAgICBzaG93Q2xlYXJEb25lLFxuICAgIHNob3dDbGVhcixcbiAgfTtcbn0pKCk7XG5cbmV4cG9ydCBkZWZhdWx0IGV2ZW50c0hhbmRsZXI7XG4iLCJpbXBvcnQgREIgZnJvbSAnaW5kZXhlZGRiLWNydWQnO1xuaW1wb3J0IEdlbmVyYWwgZnJvbSAnLi4vZGJHZW5lcmFsL3JlZnJlc2hHZW5lcmFsJztcblxuY29uc3QgUmVmcmVzaCA9ICgoKSA9PiB7XG4gIGZ1bmN0aW9uIHJhbmRvbUFwaG9yaXNtKCkge1xuICAgIGNvbnN0IHN0b3JlTmFtZSA9ICdhcGhvcmlzbSc7XG4gICAgY29uc3QgcmFuZG9tSW5kZXggPSBNYXRoLmNlaWwoTWF0aC5yYW5kb20oKSAqIERCLmdldExlbmd0aChzdG9yZU5hbWUpKTtcblxuICAgIERCLmdldEl0ZW0ocmFuZG9tSW5kZXgsIF9wYXJzZVRleHQsIHN0b3JlTmFtZSk7XG4gIH1cblxuICBmdW5jdGlvbiBfcGFyc2VUZXh0KGRhdGEpIHtcbiAgICBjb25zdCB0ZXh0ID0gZGF0YS5jb250ZW50O1xuXG4gICAgR2VuZXJhbC5zZW50ZW5jZUhhbmRsZXIodGV4dCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGluaXQ6IEdlbmVyYWwuaW5pdCxcbiAgICBhbGw6IEdlbmVyYWwuYWxsLmJpbmQobnVsbCwgcmFuZG9tQXBob3Jpc20pLCAvLyBQVU5DSExJTkU6IHVzZSBiaW5kIHRvIHBhc3MgcGFyYW10ZXJcbiAgICBwYXJ0OiBHZW5lcmFsLnBhcnQuYmluZChudWxsLCByYW5kb21BcGhvcmlzbSksXG4gICAgY2xlYXI6IEdlbmVyYWwuY2xlYXIsXG4gICAgcmFuZG9tOiByYW5kb21BcGhvcmlzbSxcbiAgfTtcbiAgLy8gcmV0dXJuIHtcbiAgLy8gICBpbml0OiBHZW5lcmFsLmluaXQsXG4gIC8vICAgRklYTUU6IHdoeSB0aGlzIG1ldGhvZCBjYW4ndCB3b3JrXG4gIC8vICAgYWxsOiAoKSA9PiBHZW5lcmFsLmFsbChyYW5kb21BcGhvcmlzbSksXG4gIC8vICAgcGFydDogKCkgPT4gR2VuZXJhbC5wYXJ0KHJhbmRvbUFwaG9yaXNtKSxcbiAgLy8gICBjbGVhcjogR2VuZXJhbC5jbGVhcixcbiAgLy8gICByYW5kb206IHJhbmRvbUFwaG9yaXNtLFxuICAvLyB9O1xufSkoKTtcblxuZXhwb3J0IGRlZmF1bHQgUmVmcmVzaDtcbiIsImZ1bmN0aW9uIGdldEZvcm1hdERhdGUoZm10KSB7XG4gIGNvbnN0IG5ld0RhdGUgPSBuZXcgRGF0ZSgpO1xuICBjb25zdCBvID0ge1xuICAgICd5Kyc6IG5ld0RhdGUuZ2V0RnVsbFllYXIoKSxcbiAgICAnTSsnOiBuZXdEYXRlLmdldE1vbnRoKCkgKyAxLFxuICAgICdkKyc6IG5ld0RhdGUuZ2V0RGF0ZSgpLFxuICAgICdoKyc6IG5ld0RhdGUuZ2V0SG91cnMoKSxcbiAgICAnbSsnOiBuZXdEYXRlLmdldE1pbnV0ZXMoKSxcbiAgfTtcbiAgbGV0IG5ld2ZtdCA9IGZtdDtcblxuICBPYmplY3Qua2V5cyhvKS5mb3JFYWNoKChrKSA9PiB7XG4gICAgaWYgKG5ldyBSZWdFeHAoYCgke2t9KWApLnRlc3QobmV3Zm10KSkge1xuICAgICAgaWYgKGsgPT09ICd5KycpIHtcbiAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoYCR7b1trXX1gKS5zdWJzdHIoNCAtIFJlZ0V4cC4kMS5sZW5ndGgpKTtcbiAgICAgIH0gZWxzZSBpZiAoayA9PT0gJ1MrJykge1xuICAgICAgICBsZXQgbGVucyA9IFJlZ0V4cC4kMS5sZW5ndGg7XG4gICAgICAgIGxlbnMgPSBsZW5zID09PSAxID8gMyA6IGxlbnM7XG4gICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKGAwMCR7b1trXX1gKS5zdWJzdHIoKGAke29ba119YCkubGVuZ3RoIC0gMSwgbGVucykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoUmVnRXhwLiQxLmxlbmd0aCA9PT0gMSkgPyAob1trXSkgOiAoKGAwMCR7b1trXX1gKS5zdWJzdHIoKGAke29ba119YCkubGVuZ3RoKSkpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIC8vIGZvciAoY29uc3QgayBpbiBvKSB7XG4gIC8vICAgaWYgKG5ldyBSZWdFeHAoYCgke2t9KWApLnRlc3QobmV3Zm10KSkge1xuICAvLyAgICAgaWYgKGsgPT09ICd5KycpIHtcbiAgLy8gICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoYCR7b1trXX1gKS5zdWJzdHIoNCAtIFJlZ0V4cC4kMS5sZW5ndGgpKTtcbiAgLy8gICAgIH0gZWxzZSBpZiAoayA9PT0gJ1MrJykge1xuICAvLyAgICAgICBsZXQgbGVucyA9IFJlZ0V4cC4kMS5sZW5ndGg7XG4gIC8vICAgICAgIGxlbnMgPSBsZW5zID09PSAxID8gMyA6IGxlbnM7XG4gIC8vICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKGAwMCR7b1trXX1gKS5zdWJzdHIoKGAke29ba119YCkubGVuZ3RoIC0gMSwgbGVucykpO1xuICAvLyAgICAgfSBlbHNlIHtcbiAgLy8gICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoUmVnRXhwLiQxLmxlbmd0aCA9PT0gMSkgPyAob1trXSkgOiAoKGAwMCR7b1trXX1gKS5zdWJzdHIoKGAke29ba119YCkubGVuZ3RoKSkpO1xuICAvLyAgICAgfVxuICAvLyAgIH1cbiAgLy8gfVxuXG4gIHJldHVybiBuZXdmbXQ7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGdldEZvcm1hdERhdGU7XG4iLCJmdW5jdGlvbiBsYXp5TG9hZFdpdGhvdXREQigpIHtcbiAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuXG4gIGVsZW1lbnQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xuICBlbGVtZW50LmFzeW5jID0gdHJ1ZTtcbiAgZWxlbWVudC5zcmMgPSAnLi9kaXN0L3NjcmlwdHMvbGF6eUxvYWQubWluLmpzJztcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbGVtZW50KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgbGF6eUxvYWRXaXRob3V0REI7XG4iLCJmdW5jdGlvbiBpdGVtR2VuZXJhdG9yKGRhdGFBcnIpIHtcbiAgY29uc3QgdGVtcGxhdGUgPSBIYW5kbGViYXJzLnRlbXBsYXRlcy5saTtcbiAgbGV0IHJlc3VsdCA9IGRhdGFBcnI7XG5cbiAgaWYgKCFBcnJheS5pc0FycmF5KGRhdGFBcnIpKSB7XG4gICAgcmVzdWx0ID0gW2RhdGFBcnJdO1xuICB9XG4gIGNvbnN0IHJlbmRlcmVkID0gdGVtcGxhdGUoeyBsaXN0SXRlbXM6IHJlc3VsdCB9KTtcblxuICByZXR1cm4gcmVuZGVyZWQudHJpbSgpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBpdGVtR2VuZXJhdG9yO1xuIiwiZnVuY3Rpb24gc2VudGVuY2VHZW5lcmF0b3IodGV4dCkge1xuICBjb25zdCB0ZW1wbGF0ZSA9IEhhbmRsZWJhcnMudGVtcGxhdGVzLmxpO1xuICBjb25zdCByZW5kZXJlZCA9IHRlbXBsYXRlKHsgc2VudGVuY2U6IHRleHQgfSk7XG5cbiAgcmV0dXJuIHJlbmRlcmVkLnRyaW0oKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgc2VudGVuY2VHZW5lcmF0b3I7XG4iLCJmdW5jdGlvbiB0ZW1wbGF0ZSAoKSB7XG4gIHZhciB0ZW1wbGF0ZSA9IEhhbmRsZWJhcnMudGVtcGxhdGUsIHRlbXBsYXRlcyA9IEhhbmRsZWJhcnMudGVtcGxhdGVzID0gSGFuZGxlYmFycy50ZW1wbGF0ZXMgfHwge307XG50ZW1wbGF0ZXNbJ2xpJ10gPSB0ZW1wbGF0ZSh7XCIxXCI6ZnVuY3Rpb24oY29udGFpbmVyLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgICB2YXIgaGVscGVyO1xuXG4gIHJldHVybiBcIiAgPGxpIGNsYXNzPVxcXCJhcGhvcmlzbVxcXCI+XCJcbiAgICArIGNvbnRhaW5lci5lc2NhcGVFeHByZXNzaW9uKCgoaGVscGVyID0gKGhlbHBlciA9IGhlbHBlcnMuc2VudGVuY2UgfHwgKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLnNlbnRlbmNlIDogZGVwdGgwKSkgIT0gbnVsbCA/IGhlbHBlciA6IGhlbHBlcnMuaGVscGVyTWlzc2luZyksKHR5cGVvZiBoZWxwZXIgPT09IFwiZnVuY3Rpb25cIiA/IGhlbHBlci5jYWxsKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwIDogKGNvbnRhaW5lci5udWxsQ29udGV4dCB8fCB7fSkse1wibmFtZVwiOlwic2VudGVuY2VcIixcImhhc2hcIjp7fSxcImRhdGFcIjpkYXRhfSkgOiBoZWxwZXIpKSlcbiAgICArIFwiPC9saT5cXG5cIjtcbn0sXCIzXCI6ZnVuY3Rpb24oY29udGFpbmVyLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgICB2YXIgc3RhY2sxO1xuXG4gIHJldHVybiAoKHN0YWNrMSA9IGhlbHBlcnMuZWFjaC5jYWxsKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwIDogKGNvbnRhaW5lci5udWxsQ29udGV4dCB8fCB7fSksKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmxpc3RJdGVtcyA6IGRlcHRoMCkse1wibmFtZVwiOlwiZWFjaFwiLFwiaGFzaFwiOnt9LFwiZm5cIjpjb250YWluZXIucHJvZ3JhbSg0LCBkYXRhLCAwKSxcImludmVyc2VcIjpjb250YWluZXIubm9vcCxcImRhdGFcIjpkYXRhfSkpICE9IG51bGwgPyBzdGFjazEgOiBcIlwiKTtcbn0sXCI0XCI6ZnVuY3Rpb24oY29udGFpbmVyLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgICB2YXIgc3RhY2sxO1xuXG4gIHJldHVybiAoKHN0YWNrMSA9IGhlbHBlcnNbXCJpZlwiXS5jYWxsKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwIDogKGNvbnRhaW5lci5udWxsQ29udGV4dCB8fCB7fSksKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmZpbmlzaGVkIDogZGVwdGgwKSx7XCJuYW1lXCI6XCJpZlwiLFwiaGFzaFwiOnt9LFwiZm5cIjpjb250YWluZXIucHJvZ3JhbSg1LCBkYXRhLCAwKSxcImludmVyc2VcIjpjb250YWluZXIucHJvZ3JhbSg3LCBkYXRhLCAwKSxcImRhdGFcIjpkYXRhfSkpICE9IG51bGwgPyBzdGFjazEgOiBcIlwiKTtcbn0sXCI1XCI6ZnVuY3Rpb24oY29udGFpbmVyLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgICB2YXIgaGVscGVyLCBhbGlhczE9ZGVwdGgwICE9IG51bGwgPyBkZXB0aDAgOiAoY29udGFpbmVyLm51bGxDb250ZXh0IHx8IHt9KSwgYWxpYXMyPWhlbHBlcnMuaGVscGVyTWlzc2luZywgYWxpYXMzPVwiZnVuY3Rpb25cIiwgYWxpYXM0PWNvbnRhaW5lci5lc2NhcGVFeHByZXNzaW9uO1xuXG4gIHJldHVybiBcIiAgICAgIDxsaSBjbGFzcz1cXFwiZmluaXNoZWRcXFwiIGRhdGEtaWQ9XCJcbiAgICArIGFsaWFzNCgoKGhlbHBlciA9IChoZWxwZXIgPSBoZWxwZXJzLmlkIHx8IChkZXB0aDAgIT0gbnVsbCA/IGRlcHRoMC5pZCA6IGRlcHRoMCkpICE9IG51bGwgPyBoZWxwZXIgOiBhbGlhczIpLCh0eXBlb2YgaGVscGVyID09PSBhbGlhczMgPyBoZWxwZXIuY2FsbChhbGlhczEse1wibmFtZVwiOlwiaWRcIixcImhhc2hcIjp7fSxcImRhdGFcIjpkYXRhfSkgOiBoZWxwZXIpKSlcbiAgICArIFwiPlxcbiAgICAgICAgXCJcbiAgICArIGFsaWFzNCgoKGhlbHBlciA9IChoZWxwZXIgPSBoZWxwZXJzLmRhdGUgfHwgKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmRhdGUgOiBkZXB0aDApKSAhPSBudWxsID8gaGVscGVyIDogYWxpYXMyKSwodHlwZW9mIGhlbHBlciA9PT0gYWxpYXMzID8gaGVscGVyLmNhbGwoYWxpYXMxLHtcIm5hbWVcIjpcImRhdGVcIixcImhhc2hcIjp7fSxcImRhdGFcIjpkYXRhfSkgOiBoZWxwZXIpKSlcbiAgICArIFwiIDogXFxuICAgICAgICA8c3Bhbj5cIlxuICAgICsgYWxpYXM0KCgoaGVscGVyID0gKGhlbHBlciA9IGhlbHBlcnMuZXZlbnQgfHwgKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmV2ZW50IDogZGVwdGgwKSkgIT0gbnVsbCA/IGhlbHBlciA6IGFsaWFzMiksKHR5cGVvZiBoZWxwZXIgPT09IGFsaWFzMyA/IGhlbHBlci5jYWxsKGFsaWFzMSx7XCJuYW1lXCI6XCJldmVudFwiLFwiaGFzaFwiOnt9LFwiZGF0YVwiOmRhdGF9KSA6IGhlbHBlcikpKVxuICAgICsgXCI8L3NwYW4+XFxuICAgICAgICA8c3BhbiBjbGFzcz1cXFwiY2xvc2VcXFwiPsOXPC9zcGFuPlxcbiAgICAgIDwvbGk+XFxuXCI7XG59LFwiN1wiOmZ1bmN0aW9uKGNvbnRhaW5lcixkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gICAgdmFyIGhlbHBlciwgYWxpYXMxPWRlcHRoMCAhPSBudWxsID8gZGVwdGgwIDogKGNvbnRhaW5lci5udWxsQ29udGV4dCB8fCB7fSksIGFsaWFzMj1oZWxwZXJzLmhlbHBlck1pc3NpbmcsIGFsaWFzMz1cImZ1bmN0aW9uXCIsIGFsaWFzND1jb250YWluZXIuZXNjYXBlRXhwcmVzc2lvbjtcblxuICByZXR1cm4gXCIgICAgICA8bGkgZGF0YS1pZD1cIlxuICAgICsgYWxpYXM0KCgoaGVscGVyID0gKGhlbHBlciA9IGhlbHBlcnMuaWQgfHwgKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmlkIDogZGVwdGgwKSkgIT0gbnVsbCA/IGhlbHBlciA6IGFsaWFzMiksKHR5cGVvZiBoZWxwZXIgPT09IGFsaWFzMyA/IGhlbHBlci5jYWxsKGFsaWFzMSx7XCJuYW1lXCI6XCJpZFwiLFwiaGFzaFwiOnt9LFwiZGF0YVwiOmRhdGF9KSA6IGhlbHBlcikpKVxuICAgICsgXCI+XFxuICAgICAgICBcIlxuICAgICsgYWxpYXM0KCgoaGVscGVyID0gKGhlbHBlciA9IGhlbHBlcnMuZGF0ZSB8fCAoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuZGF0ZSA6IGRlcHRoMCkpICE9IG51bGwgPyBoZWxwZXIgOiBhbGlhczIpLCh0eXBlb2YgaGVscGVyID09PSBhbGlhczMgPyBoZWxwZXIuY2FsbChhbGlhczEse1wibmFtZVwiOlwiZGF0ZVwiLFwiaGFzaFwiOnt9LFwiZGF0YVwiOmRhdGF9KSA6IGhlbHBlcikpKVxuICAgICsgXCIgOiBcXG4gICAgICAgIDxzcGFuPlwiXG4gICAgKyBhbGlhczQoKChoZWxwZXIgPSAoaGVscGVyID0gaGVscGVycy5ldmVudCB8fCAoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuZXZlbnQgOiBkZXB0aDApKSAhPSBudWxsID8gaGVscGVyIDogYWxpYXMyKSwodHlwZW9mIGhlbHBlciA9PT0gYWxpYXMzID8gaGVscGVyLmNhbGwoYWxpYXMxLHtcIm5hbWVcIjpcImV2ZW50XCIsXCJoYXNoXCI6e30sXCJkYXRhXCI6ZGF0YX0pIDogaGVscGVyKSkpXG4gICAgKyBcIjwvc3Bhbj5cXG4gICAgICAgIDxzcGFuIGNsYXNzPVxcXCJjbG9zZVxcXCI+w5c8L3NwYW4+XFxuICAgICAgPC9saT5cXG5cIjtcbn0sXCJjb21waWxlclwiOls3LFwiPj0gNC4wLjBcIl0sXCJtYWluXCI6ZnVuY3Rpb24oY29udGFpbmVyLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgICB2YXIgc3RhY2sxO1xuXG4gIHJldHVybiAoKHN0YWNrMSA9IGhlbHBlcnNbXCJpZlwiXS5jYWxsKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwIDogKGNvbnRhaW5lci5udWxsQ29udGV4dCB8fCB7fSksKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLnNlbnRlbmNlIDogZGVwdGgwKSx7XCJuYW1lXCI6XCJpZlwiLFwiaGFzaFwiOnt9LFwiZm5cIjpjb250YWluZXIucHJvZ3JhbSgxLCBkYXRhLCAwKSxcImludmVyc2VcIjpjb250YWluZXIucHJvZ3JhbSgzLCBkYXRhLCAwKSxcImRhdGFcIjpkYXRhfSkpICE9IG51bGwgPyBzdGFjazEgOiBcIlwiKTtcbn0sXCJ1c2VEYXRhXCI6dHJ1ZX0pO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgdGVtcGxhdGU7XG4iXX0=
