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
        if (cursor.value[condition] === whether) {
          result.push(cursor.value);
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
        if (cursor.value[condition] === whether) {
          cursor.delete();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5kZXhlZGRiLWNydWQvZGlzdC9pbmRleGVkZGItY3J1ZC5qcyIsIm5vZGVfbW9kdWxlcy9pbmRleGVkZGItY3J1ZC9pbmRleC5qcyIsInNyYy9zY3JpcHRzL2RiL2NvbmZpZy5qcyIsInNyYy9zY3JpcHRzL21haW4uanMiLCJzcmMvc2NyaXB0cy91dGxpcy9jbGVhckNoaWxkTm9kZXMuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkdlbmVyYWwvYWRkRXZlbnRzR2VuZXJhdG9yLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJHZW5lcmFsL2V2ZW50c0hhbmRsZXJHZW5lcmFsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJHZW5lcmFsL3JlZnJlc2hHZW5lcmFsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJTdWNjZXNzL2FkZEV2ZW50cy5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2RiU3VjY2Vzcy9ldmVudHNIYW5kbGVyLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJTdWNjZXNzL3JlZnJlc2guanMiLCJzcmMvc2NyaXB0cy91dGxpcy9nZXRGb3JtYXREYXRlLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvbGF6eUxvYWRXaXRob3V0REIuanMiLCJzcmMvc2NyaXB0cy91dGxpcy90ZW1wbGV0ZS9pdGVtR2VuZXJhdG9yLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvdGVtcGxldGUvc2VudGVuY2VHZW5lcmF0b3IuanMiLCJ0ZW1wbGV0ZS90ZW1wbGF0ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUFxQixJQUFyQixFQUEyQixDQUEzQixDQUE1QixFQUEwRCxXQUFVLFVBQVUsT0FBVixDQUFrQixDQUFsQixFQUFxQixJQUFyQixFQUEyQixDQUEzQixDQUFwRSxFQUFrRyxRQUFPLElBQXpHLEVBQXZILENBQVYsS0FBcVAsSUFBclAsR0FBNFAsTUFBNVAsR0FBcVEsRUFBN1E7QUFDRCxLQXRDMEIsRUFzQ3pCLFdBQVUsSUF0Q2UsRUFBVCxDQUFsQjtBQXVDQzs7a0JBRWMsUSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG52YXIgSW5kZXhlZERCSGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIF9kYiA9IHZvaWQgMDtcbiAgdmFyIF9kZWZhdWx0U3RvcmVOYW1lID0gdm9pZCAwO1xuICB2YXIgX3ByZXNlbnRLZXkgPSB7fTsgLy8gc3RvcmUgbXVsdGktb2JqZWN0U3RvcmUncyBwcmVzZW50S2V5XG5cbiAgZnVuY3Rpb24gb3Blbihjb25maWcsIG9wZW5TdWNjZXNzQ2FsbGJhY2ssIG9wZW5GYWlsQ2FsbGJhY2spIHtcbiAgICAvLyBpbml0IG9wZW4gaW5kZXhlZERCXG4gICAgaWYgKCF3aW5kb3cuaW5kZXhlZERCKSB7XG4gICAgICAvLyBmaXJzdGx5IGluc3BlY3QgYnJvd3NlcidzIHN1cHBvcnQgZm9yIGluZGV4ZWREQlxuICAgICAgaWYgKG9wZW5GYWlsQ2FsbGJhY2spIHtcbiAgICAgICAgb3BlbkZhaWxDYWxsYmFjaygpOyAvLyBQVU5DSExJTkU6IG9mZmVyIHdpdGhvdXQtREIgaGFuZGxlclxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2luZG93LmFsZXJ0KCdcXHUyNzE0IFlvdXIgYnJvd3NlciBkb2VzblxcJ3Qgc3VwcG9ydCBhIHN0YWJsZSB2ZXJzaW9uIG9mIEluZGV4ZWREQi4gWW91IGNhbiBpbnN0YWxsIGxhdGVzdCBDaHJvbWUgb3IgRmlyZUZveCB0byBoYW5kbGVyIGl0Jyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBfb3BlbkhhbmRsZXIoY29uZmlnLCBvcGVuU3VjY2Vzc0NhbGxiYWNrKTtcblxuICAgIHJldHVybiAwO1xuICB9XG5cbiAgZnVuY3Rpb24gX29wZW5IYW5kbGVyKGNvbmZpZywgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIG9wZW5SZXF1ZXN0ID0gd2luZG93LmluZGV4ZWREQi5vcGVuKGNvbmZpZy5uYW1lLCBjb25maWcudmVyc2lvbik7IC8vIG9wZW4gaW5kZXhlZERCXG5cbiAgICAvLyBhbiBvbmJsb2NrZWQgZXZlbnQgaXMgZmlyZWQgdW50aWwgdGhleSBhcmUgY2xvc2VkIG9yIHJlbG9hZGVkXG4gICAgb3BlblJlcXVlc3Qub25ibG9ja2VkID0gZnVuY3Rpb24gYmxvY2tlZFNjaGVtZVVwKCkge1xuICAgICAgLy8gSWYgc29tZSBvdGhlciB0YWIgaXMgbG9hZGVkIHdpdGggdGhlIGRhdGFiYXNlLCB0aGVuIGl0IG5lZWRzIHRvIGJlIGNsb3NlZCBiZWZvcmUgd2UgY2FuIHByb2NlZWQuXG4gICAgICB3aW5kb3cuYWxlcnQoJ1BsZWFzZSBjbG9zZSBhbGwgb3RoZXIgdGFicyB3aXRoIHRoaXMgc2l0ZSBvcGVuJyk7XG4gICAgfTtcblxuICAgIC8vIENyZWF0aW5nIG9yIHVwZGF0aW5nIHRoZSB2ZXJzaW9uIG9mIHRoZSBkYXRhYmFzZVxuICAgIG9wZW5SZXF1ZXN0Lm9udXBncmFkZW5lZWRlZCA9IGZ1bmN0aW9uIHNjaGVtYVVwKGUpIHtcbiAgICAgIC8vIEFsbCBvdGhlciBkYXRhYmFzZXMgaGF2ZSBiZWVuIGNsb3NlZC4gU2V0IGV2ZXJ5dGhpbmcgdXAuXG4gICAgICBfZGIgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBvbnVwZ3JhZGVuZWVkZWQgaW4nKTtcbiAgICAgIF9jcmVhdGVPYmplY3RTdG9yZUhhbmRsZXIoY29uZmlnLnN0b3JlQ29uZmlnKTtcbiAgICB9O1xuXG4gICAgb3BlblJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gb3BlblN1Y2Nlc3MoZSkge1xuICAgICAgX2RiID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgX2RiLm9udmVyc2lvbmNoYW5nZSA9IGZ1bmN0aW9uIHZlcnNpb25jaGFuZ2VIYW5kbGVyKCkge1xuICAgICAgICBfZGIuY2xvc2UoKTtcbiAgICAgICAgd2luZG93LmFsZXJ0KCdBIG5ldyB2ZXJzaW9uIG9mIHRoaXMgcGFnZSBpcyByZWFkeS4gUGxlYXNlIHJlbG9hZCcpO1xuICAgICAgfTtcbiAgICAgIF9vcGVuU3VjY2Vzc0NhbGxiYWNrSGFuZGxlcihjb25maWcuc3RvcmVDb25maWcsIHN1Y2Nlc3NDYWxsYmFjayk7XG4gICAgfTtcblxuICAgIC8vIHVzZSBlcnJvciBldmVudHMgYnViYmxlIHRvIGhhbmRsZSBhbGwgZXJyb3IgZXZlbnRzXG4gICAgb3BlblJlcXVlc3Qub25lcnJvciA9IGZ1bmN0aW9uIG9wZW5FcnJvcihlKSB7XG4gICAgICB3aW5kb3cuYWxlcnQoJ1NvbWV0aGluZyBpcyB3cm9uZyB3aXRoIGluZGV4ZWREQiwgZm9yIG1vcmUgaW5mb3JtYXRpb24sIGNoZWNrb3V0IGNvbnNvbGUnKTtcbiAgICAgIGNvbnNvbGUubG9nKGUudGFyZ2V0LmVycm9yKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihlLnRhcmdldC5lcnJvcik7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9vcGVuU3VjY2Vzc0NhbGxiYWNrSGFuZGxlcihjb25maWdTdG9yZUNvbmZpZywgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIG9iamVjdFN0b3JlTGlzdCA9IF9wYXJzZUpTT05EYXRhKGNvbmZpZ1N0b3JlQ29uZmlnLCAnc3RvcmVOYW1lJyk7XG5cbiAgICBvYmplY3RTdG9yZUxpc3QuZm9yRWFjaChmdW5jdGlvbiAoc3RvcmVDb25maWcsIGluZGV4KSB7XG4gICAgICBpZiAoaW5kZXggPT09IDApIHtcbiAgICAgICAgX2RlZmF1bHRTdG9yZU5hbWUgPSBzdG9yZUNvbmZpZy5zdG9yZU5hbWU7IC8vIFBVTkNITElORTogdGhlIGxhc3Qgc3RvcmVOYW1lIGlzIGRlZmF1bHRTdG9yZU5hbWVcbiAgICAgIH1cbiAgICAgIGlmIChpbmRleCA9PT0gb2JqZWN0U3RvcmVMaXN0Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgX2dldFByZXNlbnRLZXkoc3RvcmVDb25maWcuc3RvcmVOYW1lLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKCk7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgb3BlbiBpbmRleGVkREIgc3VjY2VzcycpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF9nZXRQcmVzZW50S2V5KHN0b3JlQ29uZmlnLnN0b3JlTmFtZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvLyBzZXQgcHJlc2VudCBrZXkgdmFsdWUgdG8gX3ByZXNlbnRLZXkgKHRoZSBwcml2YXRlIHByb3BlcnR5KVxuICBmdW5jdGlvbiBfZ2V0UHJlc2VudEtleShzdG9yZU5hbWUsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSk7XG5cbiAgICBfcHJlc2VudEtleVtzdG9yZU5hbWVdID0gMDtcbiAgICBfZ2V0QWxsUmVxdWVzdCh0cmFuc2FjdGlvbiwgc3RvcmVOYW1lKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRBbGxTdWNjZXNzKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgX3ByZXNlbnRLZXlbc3RvcmVOYW1lXSA9IGN1cnNvci52YWx1ZS5pZDtcbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gY29tcGxldGVHZXRQcmVzZW50S2V5KCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgbm93ICcgKyBzdG9yZU5hbWUgKyAnIFxcJ3MgbWF4IGtleSBpcyAnICsgX3ByZXNlbnRLZXlbc3RvcmVOYW1lXSk7IC8vIGluaXRpYWwgdmFsdWUgaXMgMFxuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2soKTtcbiAgICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgb3BlblN1Y2Nlc3NDYWxsYmFjayBmaW5pc2hlZCcpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfY3JlYXRlT2JqZWN0U3RvcmVIYW5kbGVyKGNvbmZpZ1N0b3JlQ29uZmlnKSB7XG4gICAgX3BhcnNlSlNPTkRhdGEoY29uZmlnU3RvcmVDb25maWcsICdzdG9yZU5hbWUnKS5mb3JFYWNoKGZ1bmN0aW9uIChzdG9yZUNvbmZpZykge1xuICAgICAgaWYgKCFfZGIub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucyhzdG9yZUNvbmZpZy5zdG9yZU5hbWUpKSB7XG4gICAgICAgIF9jcmVhdGVPYmplY3RTdG9yZShzdG9yZUNvbmZpZyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBfY3JlYXRlT2JqZWN0U3RvcmUoc3RvcmVDb25maWcpIHtcbiAgICB2YXIgc3RvcmUgPSBfZGIuY3JlYXRlT2JqZWN0U3RvcmUoc3RvcmVDb25maWcuc3RvcmVOYW1lLCB7IGtleVBhdGg6IHN0b3JlQ29uZmlnLmtleSwgYXV0b0luY3JlbWVudDogdHJ1ZSB9KTtcblxuICAgIC8vIFVzZSB0cmFuc2FjdGlvbiBvbmNvbXBsZXRlIHRvIG1ha2Ugc3VyZSB0aGUgb2JqZWN0IFN0b3JlIGNyZWF0aW9uIGlzIGZpbmlzaGVkXG4gICAgc3RvcmUudHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGFkZGluaXRpYWxEYXRhKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgY3JlYXRlICcgKyBzdG9yZUNvbmZpZy5zdG9yZU5hbWUgKyAnIFxcJ3Mgb2JqZWN0IHN0b3JlIHN1Y2NlZWQnKTtcbiAgICAgIGlmIChzdG9yZUNvbmZpZy5pbml0aWFsRGF0YSkge1xuICAgICAgICAvLyBTdG9yZSBpbml0aWFsIHZhbHVlcyBpbiB0aGUgbmV3bHkgY3JlYXRlZCBvYmplY3Qgc3RvcmUuXG4gICAgICAgIF9pbml0aWFsRGF0YUhhbmRsZXIoc3RvcmVDb25maWcuc3RvcmVOYW1lLCBzdG9yZUNvbmZpZy5pbml0aWFsRGF0YSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9pbml0aWFsRGF0YUhhbmRsZXIoc3RvcmVOYW1lLCBpbml0aWFsRGF0YSkge1xuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuICAgIHZhciBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHN0b3JlTmFtZSk7XG5cbiAgICBfcGFyc2VKU09ORGF0YShpbml0aWFsRGF0YSwgJ2luaXRpYWwnKS5mb3JFYWNoKGZ1bmN0aW9uIChkYXRhLCBpbmRleCkge1xuICAgICAgdmFyIGFkZFJlcXVlc3QgPSBvYmplY3RTdG9yZS5hZGQoZGF0YSk7XG5cbiAgICAgIGFkZFJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gYWRkSW5pdGlhbFN1Y2Nlc3MoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGFkZCBpbml0aWFsIGRhdGFbJyArIGluZGV4ICsgJ10gc3VjY2Vzc2VkJyk7XG4gICAgICB9O1xuICAgIH0pO1xuICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSBmdW5jdGlvbiBhZGRBbGxEYXRhRG9uZSgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGFkZCBhbGwgJyArIHN0b3JlTmFtZSArICcgXFwncyBpbml0aWFsIGRhdGEgZG9uZSA6KScpO1xuICAgICAgX2dldFByZXNlbnRLZXkoc3RvcmVOYW1lKTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gX3BhcnNlSlNPTkRhdGEocmF3ZGF0YSwgbmFtZSkge1xuICAgIHRyeSB7XG4gICAgICB2YXIgcGFyc2VkRGF0YSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkocmF3ZGF0YSkpO1xuXG4gICAgICByZXR1cm4gcGFyc2VkRGF0YTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgd2luZG93LmFsZXJ0KCdwbGVhc2Ugc2V0IGNvcnJlY3QgJyArIG5hbWUgKyAnIGFycmF5IG9iamVjdCA6KScpO1xuICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TGVuZ3RoKCkge1xuICAgIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuXG4gICAgcmV0dXJuIF9wcmVzZW50S2V5W3N0b3JlTmFtZV07XG4gIH1cblxuICBmdW5jdGlvbiBnZXROZXdLZXkoKSB7XG4gICAgdmFyIHN0b3JlTmFtZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogX2RlZmF1bHRTdG9yZU5hbWU7XG5cbiAgICBfcHJlc2VudEtleVtzdG9yZU5hbWVdICs9IDE7XG5cbiAgICByZXR1cm4gX3ByZXNlbnRLZXlbc3RvcmVOYW1lXTtcbiAgfVxuXG4gIC8qIENSVUQgKi9cblxuICBmdW5jdGlvbiBhZGRJdGVtKG5ld0RhdGEsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuXG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdLCAncmVhZHdyaXRlJyk7XG4gICAgdmFyIGFkZFJlcXVlc3QgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpLmFkZChuZXdEYXRhKTtcblxuICAgIGFkZFJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gYWRkU3VjY2VzcygpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGFkZCAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgJyArIGFkZFJlcXVlc3Quc291cmNlLmtleVBhdGggKyAnICA9ICcgKyBuZXdEYXRhW2FkZFJlcXVlc3Quc291cmNlLmtleVBhdGhdICsgJyBkYXRhIHN1Y2NlZWQgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKG5ld0RhdGEpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBnZXRJdGVtKGtleSwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHN0b3JlTmFtZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDogX2RlZmF1bHRTdG9yZU5hbWU7XG5cbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0pO1xuICAgIHZhciBnZXRSZXF1ZXN0ID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKS5nZXQocGFyc2VJbnQoa2V5LCAxMCkpOyAvLyBnZXQgaXQgYnkgaW5kZXhcblxuICAgIGdldFJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0U3VjY2VzcygpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGdldCAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgJyArIGdldFJlcXVlc3Quc291cmNlLmtleVBhdGggKyAnID0gJyArIGtleSArICcgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhnZXRSZXF1ZXN0LnJlc3VsdCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8vIGdldCBjb25kaXRpb25hbCBkYXRhIChib29sZWFuIGNvbmRpdGlvbilcbiAgZnVuY3Rpb24gZ2V0V2hldGhlckNvbmRpdGlvbkl0ZW0oY29uZGl0aW9uLCB3aGV0aGVyLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgc3RvcmVOYW1lID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgYXJndW1lbnRzWzNdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbM10gOiBfZGVmYXVsdFN0b3JlTmFtZTtcblxuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSk7XG4gICAgdmFyIHJlc3VsdCA9IFtdOyAvLyB1c2UgYW4gYXJyYXkgdG8gc3RvcmFnZSBlbGlnaWJsZSBkYXRhXG5cbiAgICBfZ2V0QWxsUmVxdWVzdCh0cmFuc2FjdGlvbiwgc3RvcmVOYW1lKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRBbGxTdWNjZXNzKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgaWYgKGN1cnNvci52YWx1ZVtjb25kaXRpb25dID09PSB3aGV0aGVyKSB7XG4gICAgICAgICAgcmVzdWx0LnB1c2goY3Vyc29yLnZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSBmdW5jdGlvbiBjb21wbGV0ZUFkZEFsbCgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGdldCAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgJyArIGNvbmRpdGlvbiArICcgPSAnICsgd2hldGhlciArICcgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXN1bHQpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBnZXRBbGwoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHN0b3JlTmFtZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogX2RlZmF1bHRTdG9yZU5hbWU7XG5cbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0pO1xuICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgIF9nZXRBbGxSZXF1ZXN0KHRyYW5zYWN0aW9uLCBzdG9yZU5hbWUpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGdldEFsbFN1Y2Nlc3MoZSkge1xuICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICByZXN1bHQucHVzaChjdXJzb3IudmFsdWUpO1xuICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSBmdW5jdGlvbiBjb21wbGV0ZUdldEFsbCgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGdldCAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgYWxsIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzdWx0KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlSXRlbShrZXksIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuXG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdLCAncmVhZHdyaXRlJyk7XG4gICAgdmFyIGRlbGV0ZVJlcXVlc3QgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpLmRlbGV0ZShrZXkpO1xuXG4gICAgZGVsZXRlUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBkZWxldGVTdWNjZXNzKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgcmVtb3ZlICcgKyBzdG9yZU5hbWUgKyAnXFwncyAgJyArIGRlbGV0ZVJlcXVlc3Quc291cmNlLmtleVBhdGggKyAnID0gJyArIGtleSArICcgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhrZXkpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmVXaGV0aGVyQ29uZGl0aW9uSXRlbShjb25kaXRpb24sIHdoZXRoZXIsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMyAmJiBhcmd1bWVudHNbM10gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1szXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuXG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdLCAncmVhZHdyaXRlJyk7XG5cbiAgICBfZ2V0QWxsUmVxdWVzdCh0cmFuc2FjdGlvbiwgc3RvcmVOYW1lKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRBbGxTdWNjZXNzKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgaWYgKGN1cnNvci52YWx1ZVtjb25kaXRpb25dID09PSB3aGV0aGVyKSB7XG4gICAgICAgICAgY3Vyc29yLmRlbGV0ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfVxuICAgIH07XG4gICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGNvbXBsZXRlUmVtb3ZlV2hldGhlcigpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIHJlbW92ZSAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgJyArIGNvbmRpdGlvbiArICcgPSAnICsgd2hldGhlciArICcgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjaygpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhcihzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgc3RvcmVOYW1lID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiBfZGVmYXVsdFN0b3JlTmFtZTtcblxuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuXG4gICAgX2dldEFsbFJlcXVlc3QodHJhbnNhY3Rpb24sIHN0b3JlTmFtZSkub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0QWxsU3VjY2VzcyhlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIGN1cnNvci5kZWxldGUoKTtcbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gY29tcGxldGVDbGVhcigpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGNsZWFyICcgKyBzdG9yZU5hbWUgKyAnXFwncyBhbGwgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjaygnY2xlYXIgYWxsIGRhdGEgc3VjY2VzcycpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyB1cGRhdGUgb25lXG4gIGZ1bmN0aW9uIHVwZGF0ZUl0ZW0obmV3RGF0YSwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHN0b3JlTmFtZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDogX2RlZmF1bHRTdG9yZU5hbWU7XG5cbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcbiAgICB2YXIgcHV0UmVxdWVzdCA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHN0b3JlTmFtZSkucHV0KG5ld0RhdGEpO1xuXG4gICAgcHV0UmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBwdXRTdWNjZXNzKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgdXBkYXRlICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgcHV0UmVxdWVzdC5zb3VyY2Uua2V5UGF0aCArICcgID0gJyArIG5ld0RhdGFbcHV0UmVxdWVzdC5zb3VyY2Uua2V5UGF0aF0gKyAnIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2sobmV3RGF0YSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9nZXRBbGxSZXF1ZXN0KHRyYW5zYWN0aW9uLCBzdG9yZU5hbWUpIHtcbiAgICByZXR1cm4gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKS5vcGVuQ3Vyc29yKElEQktleVJhbmdlLmxvd2VyQm91bmQoMSksICduZXh0Jyk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG9wZW46IG9wZW4sXG4gICAgZ2V0TGVuZ3RoOiBnZXRMZW5ndGgsXG4gICAgZ2V0TmV3S2V5OiBnZXROZXdLZXksXG4gICAgZ2V0SXRlbTogZ2V0SXRlbSxcbiAgICBnZXRXaGV0aGVyQ29uZGl0aW9uSXRlbTogZ2V0V2hldGhlckNvbmRpdGlvbkl0ZW0sXG4gICAgZ2V0QWxsOiBnZXRBbGwsXG4gICAgYWRkSXRlbTogYWRkSXRlbSxcbiAgICByZW1vdmVJdGVtOiByZW1vdmVJdGVtLFxuICAgIHJlbW92ZVdoZXRoZXJDb25kaXRpb25JdGVtOiByZW1vdmVXaGV0aGVyQ29uZGl0aW9uSXRlbSxcbiAgICBjbGVhcjogY2xlYXIsXG4gICAgdXBkYXRlSXRlbTogdXBkYXRlSXRlbVxuICB9O1xufSgpO1xuXG5leHBvcnRzLmRlZmF1bHQgPSBJbmRleGVkREJIYW5kbGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXhlZGRiLWNydWQuanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2Rpc3QvaW5kZXhlZGRiLWNydWQnKVsnZGVmYXVsdCddO1xuIiwiZXhwb3J0IGRlZmF1bHQge1xuICBuYW1lOiAnSnVzdFRvRG8nLFxuICB2ZXJzaW9uOiAnMjMnLFxuICBzdG9yZUNvbmZpZzogW1xuICAgIHtcbiAgICAgIHN0b3JlTmFtZTogJ2xpc3QnLFxuICAgICAga2V5OiAnaWQnLFxuICAgICAgaW5pdGlhbERhdGE6IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAwLCBldmVudDogJ0p1c3REZW1vJywgZmluaXNoZWQ6IHRydWUsIGRhdGU6IDAsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgc3RvcmVOYW1lOiAnYXBob3Jpc20nLFxuICAgICAga2V5OiAnaWQnLFxuICAgICAgaW5pdGlhbERhdGE6IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAxLFxuICAgICAgICAgIGNvbnRlbnQ6IFwiWW91J3JlIGJldHRlciB0aGFuIHRoYXRcIixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAyLFxuICAgICAgICAgIGNvbnRlbnQ6ICdZZXN0ZXJkYXkgWW91IFNhaWQgVG9tb3Jyb3cnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IDMsXG4gICAgICAgICAgY29udGVudDogJ1doeSBhcmUgd2UgaGVyZT8nLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IDQsXG4gICAgICAgICAgY29udGVudDogJ0FsbCBpbiwgb3Igbm90aGluZycsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogNSxcbiAgICAgICAgICBjb250ZW50OiAnWW91IE5ldmVyIFRyeSwgWW91IE5ldmVyIEtub3cnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IDYsXG4gICAgICAgICAgY29udGVudDogJ1RoZSB1bmV4YW1pbmVkIGxpZmUgaXMgbm90IHdvcnRoIGxpdmluZy4gLS0gU29jcmF0ZXMnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IDcsXG4gICAgICAgICAgY29udGVudDogJ1RoZXJlIGlzIG9ubHkgb25lIHRoaW5nIHdlIHNheSB0byBsYXp5OiBOT1QgVE9EQVknLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICBdLFxufTtcbiIsImltcG9ydCB7IG9wZW4gYXMgb3BlbkRCIH0gZnJvbSAnaW5kZXhlZGRiLWNydWQnO1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuL2RiL2NvbmZpZyc7XG5pbXBvcnQgdGVtcGxldGUgZnJvbSAnLi4vLi4vdGVtcGxldGUvdGVtcGxhdGUnO1xuaW1wb3J0IGFkZEV2ZW50cyBmcm9tICcuL3V0bGlzL2RiU3VjY2Vzcy9hZGRFdmVudHMnO1xuaW1wb3J0IGxhenlMb2FkV2l0aG91dERCIGZyb20gJy4vdXRsaXMvbGF6eUxvYWRXaXRob3V0REInO1xuXG5cbnRlbXBsZXRlKCk7XG4vLyBvcGVuIERCLCBhbmQgd2hlbiBEQiBvcGVuIHN1Y2NlZWQsIGludm9rZSBpbml0aWFsIGZ1bmN0aW9uXG5vcGVuREIoY29uZmlnLCBhZGRFdmVudHMsIGxhenlMb2FkV2l0aG91dERCKTtcbiIsImZ1bmN0aW9uIGNsZWFyQ2hpbGROb2Rlcyhyb290KSB7XG4gIHdoaWxlIChyb290Lmhhc0NoaWxkTm9kZXMoKSkgeyAvLyBvciByb290LmZpcnN0Q2hpbGQgb3Igcm9vdC5sYXN0Q2hpbGRcbiAgICByb290LnJlbW92ZUNoaWxkKHJvb3QuZmlyc3RDaGlsZCk7XG4gIH1cbiAgLy8gb3Igcm9vdC5pbm5lckhUTUwgPSAnJ1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGVhckNoaWxkTm9kZXM7XG4iLCJmdW5jdGlvbiBhZGRFdmVudHNHZW5lcmF0b3IoaGFuZGxlcikge1xuICBoYW5kbGVyLnNob3dJbml0KCk7XG4gIC8vIGFkZCBhbGwgZXZlbnRMaXN0ZW5lclxuICBjb25zdCBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcblxuICBsaXN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5jbGlja0xpLCBmYWxzZSk7XG4gIGxpc3QuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnJlbW92ZUxpLCBmYWxzZSk7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVyLmVudGVyQWRkLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhZGQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuYWRkLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93RG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93RG9uZSwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd1RvZG8nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd1RvZG8sIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dBbGwnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0FsbCwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0NsZWFyRG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93Q2xlYXJEb25lLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93Q2xlYXInKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0NsZWFyLCBmYWxzZSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFkZEV2ZW50c0dlbmVyYXRvcjtcbiIsImltcG9ydCBnZXRGb3JtYXREYXRlIGZyb20gJy4uL2dldEZvcm1hdERhdGUnO1xuXG5jb25zdCBldmVudHNIYW5kbGVyR2VuZXJhbCA9ICgoKSA9PiB7XG4gIGZ1bmN0aW9uIHJlc2V0SW5wdXQoKSB7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWUgPSAnJztcbiAgfVxuXG4gIGZ1bmN0aW9uIGRhdGFHZW5lcmF0b3Ioa2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiB7XG4gICAgICBpZDoga2V5LFxuICAgICAgZXZlbnQ6IHZhbHVlLFxuICAgICAgZmluaXNoZWQ6IGZhbHNlLFxuICAgICAgZGF0ZTogZ2V0Rm9ybWF0RGF0ZSgnTU3mnIhkZOaXpWhoOm1tJyksXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcmVzZXRJbnB1dCxcbiAgICBkYXRhR2VuZXJhdG9yLFxuICB9O1xufSkoKTtcblxuZXhwb3J0IGRlZmF1bHQgZXZlbnRzSGFuZGxlckdlbmVyYWw7XG4iLCJpbXBvcnQgaXRlbUdlbmVyYXRvciBmcm9tICcuLi90ZW1wbGV0ZS9pdGVtR2VuZXJhdG9yJztcbmltcG9ydCBzZW50ZW5jZUdlbmVyYXRvciBmcm9tICcuLi90ZW1wbGV0ZS9zZW50ZW5jZUdlbmVyYXRvcic7XG5pbXBvcnQgY2xlYXJDaGlsZE5vZGVzIGZyb20gJy4uL2NsZWFyQ2hpbGROb2Rlcyc7XG5cbmNvbnN0IHJlZnJlc2hHZW5lcmFsID0gKCgpID0+IHtcbiAgZnVuY3Rpb24gaW5pdChkYXRhQXJyKSB7XG4gICAgX3Nob3coZGF0YUFyciwgX2luaXRTZW50ZW5jZSwgX3JlbmRlckFsbCk7XG4gIH1cblxuICBmdW5jdGlvbiBfc2hvdyhkYXRhQXJyLCBzaG93U2VudGVuY2VGdW5jLCBnZW5lcmF0ZUZ1bmMpIHtcbiAgICBpZiAoIWRhdGFBcnIgfHwgZGF0YUFyci5sZW5ndGggPT09IDApIHtcbiAgICAgIHNob3dTZW50ZW5jZUZ1bmMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5pbm5lckhUTUwgPSBnZW5lcmF0ZUZ1bmMoZGF0YUFycik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX2luaXRTZW50ZW5jZSgpIHtcbiAgICBjb25zdCB0ZXh0ID0gJ1dlbGNvbWV+LCB0cnkgdG8gYWRkIHlvdXIgZmlyc3QgdG8tZG8gbGlzdCA6ICknO1xuXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5pbm5lckhUTUwgPSBzZW50ZW5jZUdlbmVyYXRvcih0ZXh0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFsbChyYW5kb21BcGhvcmlzbSwgZGF0YUFycikge1xuICAgIF9zaG93KGRhdGFBcnIsIHJhbmRvbUFwaG9yaXNtLCBfcmVuZGVyQWxsKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9yZW5kZXJBbGwoZGF0YUFycikge1xuICAgIGNvbnN0IGNsYXNzaWZpZWREYXRhID0gX2NsYXNzaWZ5RGF0YShkYXRhQXJyKTtcblxuICAgIHJldHVybiBpdGVtR2VuZXJhdG9yKGNsYXNzaWZpZWREYXRhKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9jbGFzc2lmeURhdGEoZGF0YUFycikge1xuICAgIGNvbnN0IGZpbmlzaGVkID0gW107XG4gICAgY29uc3QgdW5maXNoaWVkID0gW107XG5cbiAgICAvLyBwdXQgdGhlIGZpbmlzaGVkIGl0ZW0gdG8gdGhlIGJvdHRvbVxuICAgIGRhdGFBcnIuZm9yRWFjaChkYXRhID0+IChkYXRhLmZpbmlzaGVkID8gZmluaXNoZWQudW5zaGlmdChkYXRhKSA6IHVuZmlzaGllZC51bnNoaWZ0KGRhdGEpKSk7XG5cbiAgICByZXR1cm4gdW5maXNoaWVkLmNvbmNhdChmaW5pc2hlZCk7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJ0KHJhbmRvbUFwaG9yaXNtLCBkYXRhQXJyKSB7XG4gICAgX3Nob3coZGF0YUFyciwgcmFuZG9tQXBob3Jpc20sIF9yZW5kZXJQYXJ0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9yZW5kZXJQYXJ0KGRhdGFBcnIpIHtcbiAgICByZXR1cm4gaXRlbUdlbmVyYXRvcihkYXRhQXJyLnJldmVyc2UoKSk7XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICBjbGVhckNoaWxkTm9kZXMoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKSk7XG4gIH1cblxuICBmdW5jdGlvbiBzZW50ZW5jZUhhbmRsZXIodGV4dCkge1xuICAgIGNvbnN0IHJlbmRlcmVkID0gc2VudGVuY2VHZW5lcmF0b3IodGV4dCk7XG5cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmlubmVySFRNTCA9IHJlbmRlcmVkO1xuICB9XG5cblxuICByZXR1cm4ge1xuICAgIGluaXQsXG4gICAgYWxsLFxuICAgIHBhcnQsXG4gICAgY2xlYXIsXG4gICAgc2VudGVuY2VIYW5kbGVyLFxuICB9O1xufSkoKTtcblxuZXhwb3J0IGRlZmF1bHQgcmVmcmVzaEdlbmVyYWw7XG4iLCJpbXBvcnQgYWRkRXZlbnRzR2VuZXJhdG9yIGZyb20gJy4uL2RiR2VuZXJhbC9hZGRFdmVudHNHZW5lcmF0b3InO1xuaW1wb3J0IGV2ZW50c0hhbmRsZXIgZnJvbSAnLi4vZGJTdWNjZXNzL2V2ZW50c0hhbmRsZXInO1xuXG5mdW5jdGlvbiBhZGRFdmVudHMoKSB7XG4gIGFkZEV2ZW50c0dlbmVyYXRvcihldmVudHNIYW5kbGVyKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYWRkRXZlbnRzO1xuIiwiaW1wb3J0IERCIGZyb20gJ2luZGV4ZWRkYi1jcnVkJztcbmltcG9ydCBSZWZyZXNoIGZyb20gJy4uL2RiU3VjY2Vzcy9yZWZyZXNoJztcbmltcG9ydCBHZW5lcmFsIGZyb20gJy4uL2RiR2VuZXJhbC9ldmVudHNIYW5kbGVyR2VuZXJhbCc7XG5pbXBvcnQgaXRlbUdlbmVyYXRvciBmcm9tICcuLi90ZW1wbGV0ZS9pdGVtR2VuZXJhdG9yJztcblxuY29uc3QgZXZlbnRzSGFuZGxlciA9ICgoKSA9PiB7XG4gIGZ1bmN0aW9uIGFkZCgpIHtcbiAgICBjb25zdCBpbnB1dFZhbHVlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWU7XG5cbiAgICBpZiAoaW5wdXRWYWx1ZSA9PT0gJycpIHtcbiAgICAgIHdpbmRvdy5hbGVydCgncGxlYXNlIGlucHV0IGEgcmVhbCBkYXRhficpO1xuICAgIH0gZWxzZSB7XG4gICAgICBfYWRkSGFuZGxlcihpbnB1dFZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfYWRkSGFuZGxlcihpbnB1dFZhbHVlKSB7XG4gICAgY29uc3QgbmV3RGF0YSA9IEdlbmVyYWwuZGF0YUdlbmVyYXRvcihEQi5nZXROZXdLZXkoKSwgaW5wdXRWYWx1ZSk7XG4gICAgY29uc3QgcmVuZGVyZWQgPSBpdGVtR2VuZXJhdG9yKG5ld0RhdGEpO1xuXG4gICAgcmVtb3ZlSW5pdCgpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuaW5zZXJ0QWRqYWNlbnRIVE1MKCdhZnRlcmJlZ2luJywgcmVuZGVyZWQpOyAvLyBQVU5DSExJTkU6IHVzZSBpbnNlcnRBZGphY2VudEhUTUxcbiAgICBHZW5lcmFsLnJlc2V0SW5wdXQoKTtcbiAgICBEQi5hZGRJdGVtKG5ld0RhdGEpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlSW5pdCgpIHtcbiAgICBjb25zdCBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcblxuICAgIGlmIChsaXN0LmZpcnN0Q2hpbGQuY2xhc3NOYW1lID09PSAnYXBob3Jpc20nKSB7XG4gICAgICBsaXN0LnJlbW92ZUNoaWxkKGxpc3QuZmlyc3RDaGlsZCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZW50ZXJBZGQoZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzKSB7XG4gICAgICBhZGQoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjbGlja0xpKGUpIHtcbiAgICBjb25zdCB0YXJnZXRMaSA9IGUudGFyZ2V0O1xuICAgIC8vIHVzZSBldmVudCBkZWxlZ2F0aW9uXG5cbiAgICBpZiAoIXRhcmdldExpLmNsYXNzTGlzdC5jb250YWlucygnYXBob3Jpc20nKSkge1xuICAgICAgaWYgKHRhcmdldExpLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpKSB7IC8vIHRlc3Qgd2hldGhlciBpcyB4XG4gICAgICAgIHRhcmdldExpLmNsYXNzTGlzdC50b2dnbGUoJ2ZpbmlzaGVkJyk7IC8vIHRvZ2dsZSBhcHBlYXJhbmNlXG5cbiAgICAgICAgLy8gdXNlIHByZXZpb3VzbHkgc3RvcmVkIGRhdGEtaWQgYXR0cmlidXRlXG4gICAgICAgIGNvbnN0IGlkID0gcGFyc2VJbnQodGFyZ2V0TGkuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyksIDEwKTtcblxuICAgICAgICBEQi5nZXRJdGVtKGlkLCBfdG9nZ2xlTGkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF90b2dnbGVMaShkYXRhKSB7XG4gICAgY29uc3QgbmV3RGF0YSA9IGRhdGE7XG5cbiAgICBuZXdEYXRhLmZpbmlzaGVkID0gIWRhdGEuZmluaXNoZWQ7XG4gICAgREIudXBkYXRlSXRlbShuZXdEYXRhLCBzaG93QWxsKTtcbiAgfVxuXG4gIC8vIGxpJ3MgW3hdJ3MgZGVsZXRlXG4gIGZ1bmN0aW9uIHJlbW92ZUxpKGUpIHtcbiAgICBpZiAoZS50YXJnZXQuY2xhc3NOYW1lID09PSAnY2xvc2UnKSB7IC8vIHVzZSBldmVudCBkZWxlZ2F0aW9uXG4gICAgICAvLyBkZWxldGUgdmlzdWFsbHlcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykucmVtb3ZlQ2hpbGQoZS50YXJnZXQucGFyZW50Tm9kZSk7XG4gICAgICBfYWRkUmFuZG9tKCk7XG4gICAgICAvLyB1c2UgcHJldmlvdXNseSBzdG9yZWQgZGF0YVxuICAgICAgY29uc3QgaWQgPSBwYXJzZUludChlLnRhcmdldC5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpLCAxMCk7XG4gICAgICAvLyBkZWxldGUgYWN0dWFsbHlcbiAgICAgIERCLnJlbW92ZUl0ZW0oaWQpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGZvciBTZW1hbnRpY1xuICBmdW5jdGlvbiBfYWRkUmFuZG9tKCkge1xuICAgIGNvbnN0IGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gICAgaWYgKCFsaXN0Lmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgUmVmcmVzaC5yYW5kb20oKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzaG93SW5pdCgpIHtcbiAgICBEQi5nZXRBbGwoUmVmcmVzaC5pbml0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dBbGwoKSB7XG4gICAgREIuZ2V0QWxsKFJlZnJlc2guYWxsKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dEb25lKCkge1xuICAgIF9zaG93V2hldGhlckRvbmUodHJ1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93VG9kbygpIHtcbiAgICBfc2hvd1doZXRoZXJEb25lKGZhbHNlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zaG93V2hldGhlckRvbmUod2hldGhlckRvbmUpIHtcbiAgICBjb25zdCBjb25kaXRpb24gPSAnZmluaXNoZWQnO1xuXG4gICAgREIuZ2V0V2hldGhlckNvbmRpdGlvbkl0ZW0oY29uZGl0aW9uLCB3aGV0aGVyRG9uZSwgUmVmcmVzaC5wYXJ0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dDbGVhckRvbmUoKSB7XG4gICAgY29uc3QgY29uZGl0aW9uID0gJ2ZpbmlzaGVkJztcblxuICAgIERCLnJlbW92ZVdoZXRoZXJDb25kaXRpb25JdGVtKGNvbmRpdGlvbiwgdHJ1ZSwgKCkgPT4ge1xuICAgICAgREIuZ2V0QWxsKFJlZnJlc2gucGFydCk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93Q2xlYXIoKSB7XG4gICAgUmVmcmVzaC5jbGVhcigpOyAvLyBjbGVhciBub2RlcyB2aXN1YWxseVxuICAgIFJlZnJlc2gucmFuZG9tKCk7XG4gICAgREIuY2xlYXIoKTsgLy8gY2xlYXIgZGF0YSBpbmRlZWRcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYWRkLFxuICAgIGVudGVyQWRkLFxuICAgIGNsaWNrTGksXG4gICAgcmVtb3ZlTGksXG4gICAgc2hvd0luaXQsXG4gICAgc2hvd0FsbCxcbiAgICBzaG93RG9uZSxcbiAgICBzaG93VG9kbyxcbiAgICBzaG93Q2xlYXJEb25lLFxuICAgIHNob3dDbGVhcixcbiAgfTtcbn0pKCk7XG5cbmV4cG9ydCBkZWZhdWx0IGV2ZW50c0hhbmRsZXI7XG4iLCJpbXBvcnQgREIgZnJvbSAnaW5kZXhlZGRiLWNydWQnO1xuaW1wb3J0IEdlbmVyYWwgZnJvbSAnLi4vZGJHZW5lcmFsL3JlZnJlc2hHZW5lcmFsJztcblxuY29uc3QgUmVmcmVzaCA9ICgoKSA9PiB7XG4gIGZ1bmN0aW9uIHJhbmRvbUFwaG9yaXNtKCkge1xuICAgIGNvbnN0IHN0b3JlTmFtZSA9ICdhcGhvcmlzbSc7XG4gICAgY29uc3QgcmFuZG9tSW5kZXggPSBNYXRoLmNlaWwoTWF0aC5yYW5kb20oKSAqIERCLmdldExlbmd0aChzdG9yZU5hbWUpKTtcblxuICAgIERCLmdldEl0ZW0ocmFuZG9tSW5kZXgsIF9wYXJzZVRleHQsIHN0b3JlTmFtZSk7XG4gIH1cblxuICBmdW5jdGlvbiBfcGFyc2VUZXh0KGRhdGEpIHtcbiAgICBjb25zdCB0ZXh0ID0gZGF0YS5jb250ZW50O1xuXG4gICAgR2VuZXJhbC5zZW50ZW5jZUhhbmRsZXIodGV4dCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGluaXQ6IEdlbmVyYWwuaW5pdCxcbiAgICBhbGw6IEdlbmVyYWwuYWxsLmJpbmQobnVsbCwgcmFuZG9tQXBob3Jpc20pLCAvLyBQVU5DSExJTkU6IHVzZSBiaW5kIHRvIHBhc3MgcGFyYW10ZXJcbiAgICBwYXJ0OiBHZW5lcmFsLnBhcnQuYmluZChudWxsLCByYW5kb21BcGhvcmlzbSksXG4gICAgY2xlYXI6IEdlbmVyYWwuY2xlYXIsXG4gICAgcmFuZG9tOiByYW5kb21BcGhvcmlzbSxcbiAgfTtcbiAgLy8gcmV0dXJuIHtcbiAgLy8gICBpbml0OiBHZW5lcmFsLmluaXQsXG4gIC8vICAgRklYTUU6IHdoeSB0aGlzIG1ldGhvZCBjYW4ndCB3b3JrXG4gIC8vICAgYWxsOiAoKSA9PiBHZW5lcmFsLmFsbChyYW5kb21BcGhvcmlzbSksXG4gIC8vICAgcGFydDogKCkgPT4gR2VuZXJhbC5wYXJ0KHJhbmRvbUFwaG9yaXNtKSxcbiAgLy8gICBjbGVhcjogR2VuZXJhbC5jbGVhcixcbiAgLy8gICByYW5kb206IHJhbmRvbUFwaG9yaXNtLFxuICAvLyB9O1xufSkoKTtcblxuZXhwb3J0IGRlZmF1bHQgUmVmcmVzaDtcbiIsImZ1bmN0aW9uIGdldEZvcm1hdERhdGUoZm10KSB7XG4gIGNvbnN0IG5ld0RhdGUgPSBuZXcgRGF0ZSgpO1xuICBjb25zdCBvID0ge1xuICAgICd5Kyc6IG5ld0RhdGUuZ2V0RnVsbFllYXIoKSxcbiAgICAnTSsnOiBuZXdEYXRlLmdldE1vbnRoKCkgKyAxLFxuICAgICdkKyc6IG5ld0RhdGUuZ2V0RGF0ZSgpLFxuICAgICdoKyc6IG5ld0RhdGUuZ2V0SG91cnMoKSxcbiAgICAnbSsnOiBuZXdEYXRlLmdldE1pbnV0ZXMoKSxcbiAgfTtcbiAgbGV0IG5ld2ZtdCA9IGZtdDtcblxuICBPYmplY3Qua2V5cyhvKS5mb3JFYWNoKChrKSA9PiB7XG4gICAgaWYgKG5ldyBSZWdFeHAoYCgke2t9KWApLnRlc3QobmV3Zm10KSkge1xuICAgICAgaWYgKGsgPT09ICd5KycpIHtcbiAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoYCR7b1trXX1gKS5zdWJzdHIoNCAtIFJlZ0V4cC4kMS5sZW5ndGgpKTtcbiAgICAgIH0gZWxzZSBpZiAoayA9PT0gJ1MrJykge1xuICAgICAgICBsZXQgbGVucyA9IFJlZ0V4cC4kMS5sZW5ndGg7XG4gICAgICAgIGxlbnMgPSBsZW5zID09PSAxID8gMyA6IGxlbnM7XG4gICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKGAwMCR7b1trXX1gKS5zdWJzdHIoKGAke29ba119YCkubGVuZ3RoIC0gMSwgbGVucykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoUmVnRXhwLiQxLmxlbmd0aCA9PT0gMSkgPyAob1trXSkgOiAoKGAwMCR7b1trXX1gKS5zdWJzdHIoKGAke29ba119YCkubGVuZ3RoKSkpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIC8vIGZvciAoY29uc3QgayBpbiBvKSB7XG4gIC8vICAgaWYgKG5ldyBSZWdFeHAoYCgke2t9KWApLnRlc3QobmV3Zm10KSkge1xuICAvLyAgICAgaWYgKGsgPT09ICd5KycpIHtcbiAgLy8gICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoYCR7b1trXX1gKS5zdWJzdHIoNCAtIFJlZ0V4cC4kMS5sZW5ndGgpKTtcbiAgLy8gICAgIH0gZWxzZSBpZiAoayA9PT0gJ1MrJykge1xuICAvLyAgICAgICBsZXQgbGVucyA9IFJlZ0V4cC4kMS5sZW5ndGg7XG4gIC8vICAgICAgIGxlbnMgPSBsZW5zID09PSAxID8gMyA6IGxlbnM7XG4gIC8vICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKGAwMCR7b1trXX1gKS5zdWJzdHIoKGAke29ba119YCkubGVuZ3RoIC0gMSwgbGVucykpO1xuICAvLyAgICAgfSBlbHNlIHtcbiAgLy8gICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoUmVnRXhwLiQxLmxlbmd0aCA9PT0gMSkgPyAob1trXSkgOiAoKGAwMCR7b1trXX1gKS5zdWJzdHIoKGAke29ba119YCkubGVuZ3RoKSkpO1xuICAvLyAgICAgfVxuICAvLyAgIH1cbiAgLy8gfVxuXG4gIHJldHVybiBuZXdmbXQ7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGdldEZvcm1hdERhdGU7XG4iLCJmdW5jdGlvbiBsYXp5TG9hZFdpdGhvdXREQigpIHtcbiAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuXG4gIGVsZW1lbnQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xuICBlbGVtZW50LmFzeW5jID0gdHJ1ZTtcbiAgZWxlbWVudC5zcmMgPSAnLi9kaXN0L3NjcmlwdHMvbGF6eUxvYWQubWluLmpzJztcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbGVtZW50KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgbGF6eUxvYWRXaXRob3V0REI7XG4iLCJmdW5jdGlvbiBpdGVtR2VuZXJhdG9yKGRhdGFBcnIpIHtcbiAgY29uc3QgdGVtcGxhdGUgPSBIYW5kbGViYXJzLnRlbXBsYXRlcy5saTtcbiAgbGV0IHJlc3VsdCA9IGRhdGFBcnI7XG5cbiAgaWYgKCFBcnJheS5pc0FycmF5KGRhdGFBcnIpKSB7XG4gICAgcmVzdWx0ID0gW2RhdGFBcnJdO1xuICB9XG4gIGNvbnN0IHJlbmRlcmVkID0gdGVtcGxhdGUoeyBsaXN0SXRlbXM6IHJlc3VsdCB9KTtcblxuICByZXR1cm4gcmVuZGVyZWQudHJpbSgpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBpdGVtR2VuZXJhdG9yO1xuIiwiZnVuY3Rpb24gc2VudGVuY2VHZW5lcmF0b3IodGV4dCkge1xuICBjb25zdCB0ZW1wbGF0ZSA9IEhhbmRsZWJhcnMudGVtcGxhdGVzLmxpO1xuICBjb25zdCByZW5kZXJlZCA9IHRlbXBsYXRlKHsgc2VudGVuY2U6IHRleHQgfSk7XG5cbiAgcmV0dXJuIHJlbmRlcmVkLnRyaW0oKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgc2VudGVuY2VHZW5lcmF0b3I7XG4iLCJmdW5jdGlvbiB0ZW1wbGF0ZSAoKSB7XG4gIHZhciB0ZW1wbGF0ZSA9IEhhbmRsZWJhcnMudGVtcGxhdGUsIHRlbXBsYXRlcyA9IEhhbmRsZWJhcnMudGVtcGxhdGVzID0gSGFuZGxlYmFycy50ZW1wbGF0ZXMgfHwge307XG50ZW1wbGF0ZXNbJ2xpJ10gPSB0ZW1wbGF0ZSh7XCIxXCI6ZnVuY3Rpb24oY29udGFpbmVyLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgICB2YXIgaGVscGVyO1xuXG4gIHJldHVybiBcIiAgPGxpIGNsYXNzPVxcXCJhcGhvcmlzbVxcXCI+XCJcbiAgICArIGNvbnRhaW5lci5lc2NhcGVFeHByZXNzaW9uKCgoaGVscGVyID0gKGhlbHBlciA9IGhlbHBlcnMuc2VudGVuY2UgfHwgKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLnNlbnRlbmNlIDogZGVwdGgwKSkgIT0gbnVsbCA/IGhlbHBlciA6IGhlbHBlcnMuaGVscGVyTWlzc2luZyksKHR5cGVvZiBoZWxwZXIgPT09IFwiZnVuY3Rpb25cIiA/IGhlbHBlci5jYWxsKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwIDogKGNvbnRhaW5lci5udWxsQ29udGV4dCB8fCB7fSkse1wibmFtZVwiOlwic2VudGVuY2VcIixcImhhc2hcIjp7fSxcImRhdGFcIjpkYXRhfSkgOiBoZWxwZXIpKSlcbiAgICArIFwiPC9saT5cXG5cIjtcbn0sXCIzXCI6ZnVuY3Rpb24oY29udGFpbmVyLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgICB2YXIgc3RhY2sxO1xuXG4gIHJldHVybiAoKHN0YWNrMSA9IGhlbHBlcnMuZWFjaC5jYWxsKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwIDogKGNvbnRhaW5lci5udWxsQ29udGV4dCB8fCB7fSksKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmxpc3RJdGVtcyA6IGRlcHRoMCkse1wibmFtZVwiOlwiZWFjaFwiLFwiaGFzaFwiOnt9LFwiZm5cIjpjb250YWluZXIucHJvZ3JhbSg0LCBkYXRhLCAwKSxcImludmVyc2VcIjpjb250YWluZXIubm9vcCxcImRhdGFcIjpkYXRhfSkpICE9IG51bGwgPyBzdGFjazEgOiBcIlwiKTtcbn0sXCI0XCI6ZnVuY3Rpb24oY29udGFpbmVyLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgICB2YXIgc3RhY2sxO1xuXG4gIHJldHVybiAoKHN0YWNrMSA9IGhlbHBlcnNbXCJpZlwiXS5jYWxsKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwIDogKGNvbnRhaW5lci5udWxsQ29udGV4dCB8fCB7fSksKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmZpbmlzaGVkIDogZGVwdGgwKSx7XCJuYW1lXCI6XCJpZlwiLFwiaGFzaFwiOnt9LFwiZm5cIjpjb250YWluZXIucHJvZ3JhbSg1LCBkYXRhLCAwKSxcImludmVyc2VcIjpjb250YWluZXIucHJvZ3JhbSg3LCBkYXRhLCAwKSxcImRhdGFcIjpkYXRhfSkpICE9IG51bGwgPyBzdGFjazEgOiBcIlwiKTtcbn0sXCI1XCI6ZnVuY3Rpb24oY29udGFpbmVyLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgICB2YXIgaGVscGVyLCBhbGlhczE9ZGVwdGgwICE9IG51bGwgPyBkZXB0aDAgOiAoY29udGFpbmVyLm51bGxDb250ZXh0IHx8IHt9KSwgYWxpYXMyPWhlbHBlcnMuaGVscGVyTWlzc2luZywgYWxpYXMzPVwiZnVuY3Rpb25cIiwgYWxpYXM0PWNvbnRhaW5lci5lc2NhcGVFeHByZXNzaW9uO1xuXG4gIHJldHVybiBcIiAgICAgIDxsaSBjbGFzcz1cXFwiZmluaXNoZWRcXFwiIGRhdGEtaWQ9XCJcbiAgICArIGFsaWFzNCgoKGhlbHBlciA9IChoZWxwZXIgPSBoZWxwZXJzLmlkIHx8IChkZXB0aDAgIT0gbnVsbCA/IGRlcHRoMC5pZCA6IGRlcHRoMCkpICE9IG51bGwgPyBoZWxwZXIgOiBhbGlhczIpLCh0eXBlb2YgaGVscGVyID09PSBhbGlhczMgPyBoZWxwZXIuY2FsbChhbGlhczEse1wibmFtZVwiOlwiaWRcIixcImhhc2hcIjp7fSxcImRhdGFcIjpkYXRhfSkgOiBoZWxwZXIpKSlcbiAgICArIFwiPlxcbiAgICAgICAgXCJcbiAgICArIGFsaWFzNCgoKGhlbHBlciA9IChoZWxwZXIgPSBoZWxwZXJzLmRhdGUgfHwgKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmRhdGUgOiBkZXB0aDApKSAhPSBudWxsID8gaGVscGVyIDogYWxpYXMyKSwodHlwZW9mIGhlbHBlciA9PT0gYWxpYXMzID8gaGVscGVyLmNhbGwoYWxpYXMxLHtcIm5hbWVcIjpcImRhdGVcIixcImhhc2hcIjp7fSxcImRhdGFcIjpkYXRhfSkgOiBoZWxwZXIpKSlcbiAgICArIFwiIDogXFxuICAgICAgICA8c3Bhbj5cIlxuICAgICsgYWxpYXM0KCgoaGVscGVyID0gKGhlbHBlciA9IGhlbHBlcnMuZXZlbnQgfHwgKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmV2ZW50IDogZGVwdGgwKSkgIT0gbnVsbCA/IGhlbHBlciA6IGFsaWFzMiksKHR5cGVvZiBoZWxwZXIgPT09IGFsaWFzMyA/IGhlbHBlci5jYWxsKGFsaWFzMSx7XCJuYW1lXCI6XCJldmVudFwiLFwiaGFzaFwiOnt9LFwiZGF0YVwiOmRhdGF9KSA6IGhlbHBlcikpKVxuICAgICsgXCI8L3NwYW4+XFxuICAgICAgICA8c3BhbiBjbGFzcz1cXFwiY2xvc2VcXFwiPsOXPC9zcGFuPlxcbiAgICAgIDwvbGk+XFxuXCI7XG59LFwiN1wiOmZ1bmN0aW9uKGNvbnRhaW5lcixkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gICAgdmFyIGhlbHBlciwgYWxpYXMxPWRlcHRoMCAhPSBudWxsID8gZGVwdGgwIDogKGNvbnRhaW5lci5udWxsQ29udGV4dCB8fCB7fSksIGFsaWFzMj1oZWxwZXJzLmhlbHBlck1pc3NpbmcsIGFsaWFzMz1cImZ1bmN0aW9uXCIsIGFsaWFzND1jb250YWluZXIuZXNjYXBlRXhwcmVzc2lvbjtcblxuICByZXR1cm4gXCIgICAgICA8bGkgZGF0YS1pZD1cIlxuICAgICsgYWxpYXM0KCgoaGVscGVyID0gKGhlbHBlciA9IGhlbHBlcnMuaWQgfHwgKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmlkIDogZGVwdGgwKSkgIT0gbnVsbCA/IGhlbHBlciA6IGFsaWFzMiksKHR5cGVvZiBoZWxwZXIgPT09IGFsaWFzMyA/IGhlbHBlci5jYWxsKGFsaWFzMSx7XCJuYW1lXCI6XCJpZFwiLFwiaGFzaFwiOnt9LFwiZGF0YVwiOmRhdGF9KSA6IGhlbHBlcikpKVxuICAgICsgXCI+XFxuICAgICAgICBcIlxuICAgICsgYWxpYXM0KCgoaGVscGVyID0gKGhlbHBlciA9IGhlbHBlcnMuZGF0ZSB8fCAoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuZGF0ZSA6IGRlcHRoMCkpICE9IG51bGwgPyBoZWxwZXIgOiBhbGlhczIpLCh0eXBlb2YgaGVscGVyID09PSBhbGlhczMgPyBoZWxwZXIuY2FsbChhbGlhczEse1wibmFtZVwiOlwiZGF0ZVwiLFwiaGFzaFwiOnt9LFwiZGF0YVwiOmRhdGF9KSA6IGhlbHBlcikpKVxuICAgICsgXCIgOiBcXG4gICAgICAgIDxzcGFuPlwiXG4gICAgKyBhbGlhczQoKChoZWxwZXIgPSAoaGVscGVyID0gaGVscGVycy5ldmVudCB8fCAoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuZXZlbnQgOiBkZXB0aDApKSAhPSBudWxsID8gaGVscGVyIDogYWxpYXMyKSwodHlwZW9mIGhlbHBlciA9PT0gYWxpYXMzID8gaGVscGVyLmNhbGwoYWxpYXMxLHtcIm5hbWVcIjpcImV2ZW50XCIsXCJoYXNoXCI6e30sXCJkYXRhXCI6ZGF0YX0pIDogaGVscGVyKSkpXG4gICAgKyBcIjwvc3Bhbj5cXG4gICAgICAgIDxzcGFuIGNsYXNzPVxcXCJjbG9zZVxcXCI+w5c8L3NwYW4+XFxuICAgICAgPC9saT5cXG5cIjtcbn0sXCJjb21waWxlclwiOls3LFwiPj0gNC4wLjBcIl0sXCJtYWluXCI6ZnVuY3Rpb24oY29udGFpbmVyLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgICB2YXIgc3RhY2sxO1xuXG4gIHJldHVybiAoKHN0YWNrMSA9IGhlbHBlcnNbXCJpZlwiXS5jYWxsKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwIDogKGNvbnRhaW5lci5udWxsQ29udGV4dCB8fCB7fSksKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLnNlbnRlbmNlIDogZGVwdGgwKSx7XCJuYW1lXCI6XCJpZlwiLFwiaGFzaFwiOnt9LFwiZm5cIjpjb250YWluZXIucHJvZ3JhbSgxLCBkYXRhLCAwKSxcImludmVyc2VcIjpjb250YWluZXIucHJvZ3JhbSgzLCBkYXRhLCAwKSxcImRhdGFcIjpkYXRhfSkpICE9IG51bGwgPyBzdGFjazEgOiBcIlwiKTtcbn0sXCJ1c2VEYXRhXCI6dHJ1ZX0pO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgdGVtcGxhdGU7XG4iXX0=
