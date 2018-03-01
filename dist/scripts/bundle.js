(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
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

var _template = require('../templete/template');

var _template2 = _interopRequireDefault(_template);

var _addEvents = require('./utlis/dbSuccess/addEvents');

var _addEvents2 = _interopRequireDefault(_addEvents);

var _lazyLoadWithoutDB = require('./utlis/lazyLoadWithoutDB');

var _lazyLoadWithoutDB2 = _interopRequireDefault(_lazyLoadWithoutDB);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _template2.default)();
// open DB, and when DB open succeed, invoke initial function
(0, _indexeddbCrud.open)(_config2.default, _addEvents2.default, _lazyLoadWithoutDB2.default);

},{"../templete/template":16,"./db/config":3,"./utlis/dbSuccess/addEvents":9,"./utlis/lazyLoadWithoutDB":13,"indexeddb-crud":2}],5:[function(require,module,exports){
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

  function clickLi(_ref) {
    var target = _ref.target;

    // use event delegation
    if (!target.classList.contains('aphorism')) {
      if (target.getAttribute('data-id')) {
        // test whether is x
        target.classList.toggle('finished'); // toggle appearance

        // use previously stored data-id attribute
        var id = parseInt(target.getAttribute('data-id'), 10);

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
  function removeLi(_ref2) {
    var target = _ref2.target;

    if (target.className === 'close') {
      // use event delegation
      // delete visually
      document.querySelector('#list').removeChild(target.parentNode);
      _addRandom();
      // use previously stored data
      var id = parseInt(target.parentNode.getAttribute('data-id'), 10);
      // delete actually
      _indexeddbCrud2.default.removeItem(id);
    }
  }

  // for Semantic
  function _addRandom() {
    var list = document.querySelector('#list');

    // because of the handlerbas.templete, add this inspect
    if (!list.lastChild || list.lastChild.nodeName === '#text') {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5kZXhlZGRiLWNydWQvZGlzdC9pbmRleGVkZGItY3J1ZC5qcyIsIm5vZGVfbW9kdWxlcy9pbmRleGVkZGItY3J1ZC9pbmRleC5qcyIsInNyYy9zY3JpcHRzL2RiL2NvbmZpZy5qcyIsInNyYy9zY3JpcHRzL21haW4uanMiLCJzcmMvc2NyaXB0cy91dGxpcy9jbGVhckNoaWxkTm9kZXMuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkdlbmVyYWwvYWRkRXZlbnRzR2VuZXJhdG9yLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJHZW5lcmFsL2V2ZW50c0hhbmRsZXJHZW5lcmFsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJHZW5lcmFsL3JlZnJlc2hHZW5lcmFsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJTdWNjZXNzL2FkZEV2ZW50cy5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2RiU3VjY2Vzcy9ldmVudHNIYW5kbGVyLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJTdWNjZXNzL3JlZnJlc2guanMiLCJzcmMvc2NyaXB0cy91dGxpcy9nZXRGb3JtYXREYXRlLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvbGF6eUxvYWRXaXRob3V0REIuanMiLCJzcmMvc2NyaXB0cy91dGxpcy90ZW1wbGV0ZS9pdGVtR2VuZXJhdG9yLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvdGVtcGxldGUvc2VudGVuY2VHZW5lcmF0b3IuanMiLCJzcmMvdGVtcGxldGUvdGVtcGxhdGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QUFrQixDQUFsQixFQUFxQixJQUFyQixFQUEyQixDQUEzQixDQUE1QixFQUEwRCxXQUFVLFVBQVUsT0FBVixDQUFrQixDQUFsQixFQUFxQixJQUFyQixFQUEyQixDQUEzQixDQUFwRSxFQUFrRyxRQUFPLElBQXpHLEVBQXZILENBQVYsS0FBcVAsSUFBclAsR0FBNFAsTUFBNVAsR0FBcVEsRUFBN1E7QUFDRCxLQXRDMEIsRUFzQ3pCLFdBQVUsSUF0Q2UsRUFBVCxDQUFsQjtBQXVDQzs7a0JBRWMsUSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9cmV0dXJuIGV9KSgpIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xudmFyIEluZGV4ZWREQkhhbmRsZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBfZGIgPSB2b2lkIDA7XG4gIHZhciBfZGVmYXVsdFN0b3JlTmFtZSA9IHZvaWQgMDtcbiAgdmFyIF9wcmVzZW50S2V5ID0ge307IC8vIHN0b3JlIG11bHRpLW9iamVjdFN0b3JlJ3MgcHJlc2VudEtleVxuXG4gIGZ1bmN0aW9uIG9wZW4oY29uZmlnLCBvcGVuU3VjY2Vzc0NhbGxiYWNrLCBvcGVuRmFpbENhbGxiYWNrKSB7XG4gICAgLy8gaW5pdCBvcGVuIGluZGV4ZWREQlxuICAgIGlmICghd2luZG93LmluZGV4ZWREQikge1xuICAgICAgLy8gZmlyc3RseSBpbnNwZWN0IGJyb3dzZXIncyBzdXBwb3J0IGZvciBpbmRleGVkREJcbiAgICAgIGlmIChvcGVuRmFpbENhbGxiYWNrKSB7XG4gICAgICAgIG9wZW5GYWlsQ2FsbGJhY2soKTsgLy8gUFVOQ0hMSU5FOiBvZmZlciB3aXRob3V0LURCIGhhbmRsZXJcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdpbmRvdy5hbGVydCgnXFx1MjcxNCBZb3VyIGJyb3dzZXIgZG9lc25cXCd0IHN1cHBvcnQgYSBzdGFibGUgdmVyc2lvbiBvZiBJbmRleGVkREIuIFlvdSBjYW4gaW5zdGFsbCBsYXRlc3QgQ2hyb21lIG9yIEZpcmVGb3ggdG8gaGFuZGxlciBpdCcpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgX29wZW5IYW5kbGVyKGNvbmZpZywgb3BlblN1Y2Nlc3NDYWxsYmFjayk7XG5cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9vcGVuSGFuZGxlcihjb25maWcsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBvcGVuUmVxdWVzdCA9IHdpbmRvdy5pbmRleGVkREIub3Blbihjb25maWcubmFtZSwgY29uZmlnLnZlcnNpb24pOyAvLyBvcGVuIGluZGV4ZWREQlxuXG4gICAgLy8gYW4gb25ibG9ja2VkIGV2ZW50IGlzIGZpcmVkIHVudGlsIHRoZXkgYXJlIGNsb3NlZCBvciByZWxvYWRlZFxuICAgIG9wZW5SZXF1ZXN0Lm9uYmxvY2tlZCA9IGZ1bmN0aW9uIGJsb2NrZWRTY2hlbWVVcCgpIHtcbiAgICAgIC8vIElmIHNvbWUgb3RoZXIgdGFiIGlzIGxvYWRlZCB3aXRoIHRoZSBkYXRhYmFzZSwgdGhlbiBpdCBuZWVkcyB0byBiZSBjbG9zZWQgYmVmb3JlIHdlIGNhbiBwcm9jZWVkLlxuICAgICAgd2luZG93LmFsZXJ0KCdQbGVhc2UgY2xvc2UgYWxsIG90aGVyIHRhYnMgd2l0aCB0aGlzIHNpdGUgb3BlbicpO1xuICAgIH07XG5cbiAgICAvLyBDcmVhdGluZyBvciB1cGRhdGluZyB0aGUgdmVyc2lvbiBvZiB0aGUgZGF0YWJhc2VcbiAgICBvcGVuUmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSBmdW5jdGlvbiBzY2hlbWFVcChlKSB7XG4gICAgICAvLyBBbGwgb3RoZXIgZGF0YWJhc2VzIGhhdmUgYmVlbiBjbG9zZWQuIFNldCBldmVyeXRoaW5nIHVwLlxuICAgICAgX2RiID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgb251cGdyYWRlbmVlZGVkIGluJyk7XG4gICAgICBfY3JlYXRlT2JqZWN0U3RvcmVIYW5kbGVyKGNvbmZpZy5zdG9yZUNvbmZpZyk7XG4gICAgfTtcblxuICAgIG9wZW5SZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIG9wZW5TdWNjZXNzKGUpIHtcbiAgICAgIF9kYiA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgIF9kYi5vbnZlcnNpb25jaGFuZ2UgPSBmdW5jdGlvbiB2ZXJzaW9uY2hhbmdlSGFuZGxlcigpIHtcbiAgICAgICAgX2RiLmNsb3NlKCk7XG4gICAgICAgIHdpbmRvdy5hbGVydCgnQSBuZXcgdmVyc2lvbiBvZiB0aGlzIHBhZ2UgaXMgcmVhZHkuIFBsZWFzZSByZWxvYWQnKTtcbiAgICAgIH07XG4gICAgICBfb3BlblN1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoY29uZmlnLnN0b3JlQ29uZmlnLCBzdWNjZXNzQ2FsbGJhY2spO1xuICAgIH07XG5cbiAgICAvLyB1c2UgZXJyb3IgZXZlbnRzIGJ1YmJsZSB0byBoYW5kbGUgYWxsIGVycm9yIGV2ZW50c1xuICAgIG9wZW5SZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbiBvcGVuRXJyb3IoZSkge1xuICAgICAgd2luZG93LmFsZXJ0KCdTb21ldGhpbmcgaXMgd3Jvbmcgd2l0aCBpbmRleGVkREIsIGZvciBtb3JlIGluZm9ybWF0aW9uLCBjaGVja291dCBjb25zb2xlJyk7XG4gICAgICBjb25zb2xlLmxvZyhlLnRhcmdldC5lcnJvcik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZS50YXJnZXQuZXJyb3IpO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfb3BlblN1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoY29uZmlnU3RvcmVDb25maWcsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBvYmplY3RTdG9yZUxpc3QgPSBfcGFyc2VKU09ORGF0YShjb25maWdTdG9yZUNvbmZpZywgJ3N0b3JlTmFtZScpO1xuXG4gICAgb2JqZWN0U3RvcmVMaXN0LmZvckVhY2goZnVuY3Rpb24gKHN0b3JlQ29uZmlnLCBpbmRleCkge1xuICAgICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICAgIF9kZWZhdWx0U3RvcmVOYW1lID0gc3RvcmVDb25maWcuc3RvcmVOYW1lOyAvLyBQVU5DSExJTkU6IHRoZSBsYXN0IHN0b3JlTmFtZSBpcyBkZWZhdWx0U3RvcmVOYW1lXG4gICAgICB9XG4gICAgICBpZiAoaW5kZXggPT09IG9iamVjdFN0b3JlTGlzdC5sZW5ndGggLSAxKSB7XG4gICAgICAgIF9nZXRQcmVzZW50S2V5KHN0b3JlQ29uZmlnLnN0b3JlTmFtZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjaygpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIG9wZW4gaW5kZXhlZERCIHN1Y2Nlc3MnKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfZ2V0UHJlc2VudEtleShzdG9yZUNvbmZpZy5zdG9yZU5hbWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8gc2V0IHByZXNlbnQga2V5IHZhbHVlIHRvIF9wcmVzZW50S2V5ICh0aGUgcHJpdmF0ZSBwcm9wZXJ0eSlcbiAgZnVuY3Rpb24gX2dldFByZXNlbnRLZXkoc3RvcmVOYW1lLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0pO1xuXG4gICAgX3ByZXNlbnRLZXlbc3RvcmVOYW1lXSA9IDA7XG4gICAgX2dldEFsbFJlcXVlc3QodHJhbnNhY3Rpb24sIHN0b3JlTmFtZSkub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0QWxsU3VjY2VzcyhlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIF9wcmVzZW50S2V5W3N0b3JlTmFtZV0gPSBjdXJzb3IudmFsdWUuaWQ7XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfVxuICAgIH07XG4gICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGNvbXBsZXRlR2V0UHJlc2VudEtleSgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIG5vdyAnICsgc3RvcmVOYW1lICsgJyBcXCdzIG1heCBrZXkgaXMgJyArIF9wcmVzZW50S2V5W3N0b3JlTmFtZV0pOyAvLyBpbml0aWFsIHZhbHVlIGlzIDBcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIG9wZW5TdWNjZXNzQ2FsbGJhY2sgZmluaXNoZWQnKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gX2NyZWF0ZU9iamVjdFN0b3JlSGFuZGxlcihjb25maWdTdG9yZUNvbmZpZykge1xuICAgIF9wYXJzZUpTT05EYXRhKGNvbmZpZ1N0b3JlQ29uZmlnLCAnc3RvcmVOYW1lJykuZm9yRWFjaChmdW5jdGlvbiAoc3RvcmVDb25maWcpIHtcbiAgICAgIGlmICghX2RiLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoc3RvcmVDb25maWcuc3RvcmVOYW1lKSkge1xuICAgICAgICBfY3JlYXRlT2JqZWN0U3RvcmUoc3RvcmVDb25maWcpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gX2NyZWF0ZU9iamVjdFN0b3JlKHN0b3JlQ29uZmlnKSB7XG4gICAgdmFyIHN0b3JlID0gX2RiLmNyZWF0ZU9iamVjdFN0b3JlKHN0b3JlQ29uZmlnLnN0b3JlTmFtZSwgeyBrZXlQYXRoOiBzdG9yZUNvbmZpZy5rZXksIGF1dG9JbmNyZW1lbnQ6IHRydWUgfSk7XG5cbiAgICAvLyBVc2UgdHJhbnNhY3Rpb24gb25jb21wbGV0ZSB0byBtYWtlIHN1cmUgdGhlIG9iamVjdCBTdG9yZSBjcmVhdGlvbiBpcyBmaW5pc2hlZFxuICAgIHN0b3JlLnRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSBmdW5jdGlvbiBhZGRpbml0aWFsRGF0YSgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGNyZWF0ZSAnICsgc3RvcmVDb25maWcuc3RvcmVOYW1lICsgJyBcXCdzIG9iamVjdCBzdG9yZSBzdWNjZWVkJyk7XG4gICAgICBpZiAoc3RvcmVDb25maWcuaW5pdGlhbERhdGEpIHtcbiAgICAgICAgLy8gU3RvcmUgaW5pdGlhbCB2YWx1ZXMgaW4gdGhlIG5ld2x5IGNyZWF0ZWQgb2JqZWN0IHN0b3JlLlxuICAgICAgICBfaW5pdGlhbERhdGFIYW5kbGVyKHN0b3JlQ29uZmlnLnN0b3JlTmFtZSwgc3RvcmVDb25maWcuaW5pdGlhbERhdGEpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfaW5pdGlhbERhdGFIYW5kbGVyKHN0b3JlTmFtZSwgaW5pdGlhbERhdGEpIHtcbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcbiAgICB2YXIgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpO1xuXG4gICAgX3BhcnNlSlNPTkRhdGEoaW5pdGlhbERhdGEsICdpbml0aWFsJykuZm9yRWFjaChmdW5jdGlvbiAoZGF0YSwgaW5kZXgpIHtcbiAgICAgIHZhciBhZGRSZXF1ZXN0ID0gb2JqZWN0U3RvcmUuYWRkKGRhdGEpO1xuXG4gICAgICBhZGRSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGFkZEluaXRpYWxTdWNjZXNzKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBhZGQgaW5pdGlhbCBkYXRhWycgKyBpbmRleCArICddIHN1Y2Nlc3NlZCcpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gYWRkQWxsRGF0YURvbmUoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBhZGQgYWxsICcgKyBzdG9yZU5hbWUgKyAnIFxcJ3MgaW5pdGlhbCBkYXRhIGRvbmUgOiknKTtcbiAgICAgIF9nZXRQcmVzZW50S2V5KHN0b3JlTmFtZSk7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9wYXJzZUpTT05EYXRhKHJhd2RhdGEsIG5hbWUpIHtcbiAgICB0cnkge1xuICAgICAgdmFyIHBhcnNlZERhdGEgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHJhd2RhdGEpKTtcblxuICAgICAgcmV0dXJuIHBhcnNlZERhdGE7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHdpbmRvdy5hbGVydCgncGxlYXNlIHNldCBjb3JyZWN0ICcgKyBuYW1lICsgJyBhcnJheSBvYmplY3QgOiknKTtcbiAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldExlbmd0aCgpIHtcbiAgICB2YXIgc3RvcmVOYW1lID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiBfZGVmYXVsdFN0b3JlTmFtZTtcblxuICAgIHJldHVybiBfcHJlc2VudEtleVtzdG9yZU5hbWVdO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TmV3S2V5KCkge1xuICAgIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuXG4gICAgX3ByZXNlbnRLZXlbc3RvcmVOYW1lXSArPSAxO1xuXG4gICAgcmV0dXJuIF9wcmVzZW50S2V5W3N0b3JlTmFtZV07XG4gIH1cblxuICAvKiBDUlVEICovXG5cbiAgZnVuY3Rpb24gYWRkSXRlbShuZXdEYXRhLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgc3RvcmVOYW1lID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiBfZGVmYXVsdFN0b3JlTmFtZTtcblxuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuICAgIHZhciBhZGRSZXF1ZXN0ID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKS5hZGQobmV3RGF0YSk7XG5cbiAgICBhZGRSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGFkZFN1Y2Nlc3MoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBhZGQgJyArIHN0b3JlTmFtZSArICdcXCdzICcgKyBhZGRSZXF1ZXN0LnNvdXJjZS5rZXlQYXRoICsgJyAgPSAnICsgbmV3RGF0YVthZGRSZXF1ZXN0LnNvdXJjZS5rZXlQYXRoXSArICcgZGF0YSBzdWNjZWVkIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhuZXdEYXRhKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0SXRlbShrZXksIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuXG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdKTtcbiAgICB2YXIgZ2V0UmVxdWVzdCA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHN0b3JlTmFtZSkuZ2V0KHBhcnNlSW50KGtleSwgMTApKTsgLy8gZ2V0IGl0IGJ5IGluZGV4XG5cbiAgICBnZXRSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGdldFN1Y2Nlc3MoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBnZXQgJyArIHN0b3JlTmFtZSArICdcXCdzICcgKyBnZXRSZXF1ZXN0LnNvdXJjZS5rZXlQYXRoICsgJyA9ICcgKyBrZXkgKyAnIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2soZ2V0UmVxdWVzdC5yZXN1bHQpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyBnZXQgY29uZGl0aW9uYWwgZGF0YSAoYm9vbGVhbiBjb25kaXRpb24pXG4gIGZ1bmN0aW9uIGdldFdoZXRoZXJDb25kaXRpb25JdGVtKGNvbmRpdGlvbiwgd2hldGhlciwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHN0b3JlTmFtZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDogX2RlZmF1bHRTdG9yZU5hbWU7XG5cbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0pO1xuICAgIHZhciByZXN1bHQgPSBbXTsgLy8gdXNlIGFuIGFycmF5IHRvIHN0b3JhZ2UgZWxpZ2libGUgZGF0YVxuXG4gICAgX2dldEFsbFJlcXVlc3QodHJhbnNhY3Rpb24sIHN0b3JlTmFtZSkub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0QWxsU3VjY2VzcyhlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIGlmIChjdXJzb3IudmFsdWVbY29uZGl0aW9uXSA9PT0gd2hldGhlcikge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKGN1cnNvci52YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gY29tcGxldGVBZGRBbGwoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBnZXQgJyArIHN0b3JlTmFtZSArICdcXCdzICcgKyBjb25kaXRpb24gKyAnID0gJyArIHdoZXRoZXIgKyAnIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzdWx0KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0QWxsKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuXG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdKTtcbiAgICB2YXIgcmVzdWx0ID0gW107XG5cbiAgICBfZ2V0QWxsUmVxdWVzdCh0cmFuc2FjdGlvbiwgc3RvcmVOYW1lKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRBbGxTdWNjZXNzKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goY3Vyc29yLnZhbHVlKTtcbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gY29tcGxldGVHZXRBbGwoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBnZXQgJyArIHN0b3JlTmFtZSArICdcXCdzIGFsbCBkYXRhIHN1Y2Nlc3MgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3VsdCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZUl0ZW0oa2V5LCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgc3RvcmVOYW1lID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiBfZGVmYXVsdFN0b3JlTmFtZTtcblxuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuICAgIHZhciBkZWxldGVSZXF1ZXN0ID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKS5kZWxldGUoa2V5KTtcblxuICAgIGRlbGV0ZVJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gZGVsZXRlU3VjY2VzcygpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIHJlbW92ZSAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgICcgKyBkZWxldGVSZXF1ZXN0LnNvdXJjZS5rZXlQYXRoICsgJyA9ICcgKyBrZXkgKyAnIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2soa2V5KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlV2hldGhlckNvbmRpdGlvbkl0ZW0oY29uZGl0aW9uLCB3aGV0aGVyLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgc3RvcmVOYW1lID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgYXJndW1lbnRzWzNdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbM10gOiBfZGVmYXVsdFN0b3JlTmFtZTtcblxuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuXG4gICAgX2dldEFsbFJlcXVlc3QodHJhbnNhY3Rpb24sIHN0b3JlTmFtZSkub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0QWxsU3VjY2VzcyhlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIGlmIChjdXJzb3IudmFsdWVbY29uZGl0aW9uXSA9PT0gd2hldGhlcikge1xuICAgICAgICAgIGN1cnNvci5kZWxldGUoKTtcbiAgICAgICAgfVxuICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSBmdW5jdGlvbiBjb21wbGV0ZVJlbW92ZVdoZXRoZXIoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyByZW1vdmUgJyArIHN0b3JlTmFtZSArICdcXCdzICcgKyBjb25kaXRpb24gKyAnID0gJyArIHdoZXRoZXIgKyAnIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2soKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHN0b3JlTmFtZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogX2RlZmF1bHRTdG9yZU5hbWU7XG5cbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcblxuICAgIF9nZXRBbGxSZXF1ZXN0KHRyYW5zYWN0aW9uLCBzdG9yZU5hbWUpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGdldEFsbFN1Y2Nlc3MoZSkge1xuICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICBjdXJzb3IuZGVsZXRlKCk7XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfVxuICAgIH07XG4gICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGNvbXBsZXRlQ2xlYXIoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBjbGVhciAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgYWxsIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2soJ2NsZWFyIGFsbCBkYXRhIHN1Y2Nlc3MnKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLy8gdXBkYXRlIG9uZVxuICBmdW5jdGlvbiB1cGRhdGVJdGVtKG5ld0RhdGEsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuXG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdLCAncmVhZHdyaXRlJyk7XG4gICAgdmFyIHB1dFJlcXVlc3QgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpLnB1dChuZXdEYXRhKTtcblxuICAgIHB1dFJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gcHV0U3VjY2VzcygpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIHVwZGF0ZSAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgJyArIHB1dFJlcXVlc3Quc291cmNlLmtleVBhdGggKyAnICA9ICcgKyBuZXdEYXRhW3B1dFJlcXVlc3Quc291cmNlLmtleVBhdGhdICsgJyBkYXRhIHN1Y2Nlc3MgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKG5ld0RhdGEpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfZ2V0QWxsUmVxdWVzdCh0cmFuc2FjdGlvbiwgc3RvcmVOYW1lKSB7XG4gICAgcmV0dXJuIHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHN0b3JlTmFtZSkub3BlbkN1cnNvcihJREJLZXlSYW5nZS5sb3dlckJvdW5kKDEpLCAnbmV4dCcpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvcGVuOiBvcGVuLFxuICAgIGdldExlbmd0aDogZ2V0TGVuZ3RoLFxuICAgIGdldE5ld0tleTogZ2V0TmV3S2V5LFxuICAgIGdldEl0ZW06IGdldEl0ZW0sXG4gICAgZ2V0V2hldGhlckNvbmRpdGlvbkl0ZW06IGdldFdoZXRoZXJDb25kaXRpb25JdGVtLFxuICAgIGdldEFsbDogZ2V0QWxsLFxuICAgIGFkZEl0ZW06IGFkZEl0ZW0sXG4gICAgcmVtb3ZlSXRlbTogcmVtb3ZlSXRlbSxcbiAgICByZW1vdmVXaGV0aGVyQ29uZGl0aW9uSXRlbTogcmVtb3ZlV2hldGhlckNvbmRpdGlvbkl0ZW0sXG4gICAgY2xlYXI6IGNsZWFyLFxuICAgIHVwZGF0ZUl0ZW06IHVwZGF0ZUl0ZW1cbiAgfTtcbn0oKTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gSW5kZXhlZERCSGFuZGxlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4ZWRkYi1jcnVkLmpzLm1hcCIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9kaXN0L2luZGV4ZWRkYi1jcnVkJylbJ2RlZmF1bHQnXTtcbiIsImV4cG9ydCBkZWZhdWx0IHtcbiAgbmFtZTogJ0p1c3RUb0RvJyxcbiAgdmVyc2lvbjogJzIzJyxcbiAgc3RvcmVDb25maWc6IFtcbiAgICB7XG4gICAgICBzdG9yZU5hbWU6ICdsaXN0JyxcbiAgICAgIGtleTogJ2lkJyxcbiAgICAgIGluaXRpYWxEYXRhOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogMCwgZXZlbnQ6ICdKdXN0RGVtbycsIGZpbmlzaGVkOiB0cnVlLCBkYXRlOiAwLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHN0b3JlTmFtZTogJ2FwaG9yaXNtJyxcbiAgICAgIGtleTogJ2lkJyxcbiAgICAgIGluaXRpYWxEYXRhOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogMSxcbiAgICAgICAgICBjb250ZW50OiBcIllvdSdyZSBiZXR0ZXIgdGhhbiB0aGF0XCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogMixcbiAgICAgICAgICBjb250ZW50OiAnWWVzdGVyZGF5IFlvdSBTYWlkIFRvbW9ycm93JyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAzLFxuICAgICAgICAgIGNvbnRlbnQ6ICdXaHkgYXJlIHdlIGhlcmU/JyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiA0LFxuICAgICAgICAgIGNvbnRlbnQ6ICdBbGwgaW4sIG9yIG5vdGhpbmcnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IDUsXG4gICAgICAgICAgY29udGVudDogJ1lvdSBOZXZlciBUcnksIFlvdSBOZXZlciBLbm93JyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiA2LFxuICAgICAgICAgIGNvbnRlbnQ6ICdUaGUgdW5leGFtaW5lZCBsaWZlIGlzIG5vdCB3b3J0aCBsaXZpbmcuIC0tIFNvY3JhdGVzJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiA3LFxuICAgICAgICAgIGNvbnRlbnQ6ICdUaGVyZSBpcyBvbmx5IG9uZSB0aGluZyB3ZSBzYXkgdG8gbGF6eTogTk9UIFRPREFZJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgXSxcbn07XG4iLCJpbXBvcnQgeyBvcGVuIGFzIG9wZW5EQiB9IGZyb20gJ2luZGV4ZWRkYi1jcnVkJztcbmltcG9ydCBjb25maWcgZnJvbSAnLi9kYi9jb25maWcnO1xuaW1wb3J0IHRlbXBsZXRlIGZyb20gJy4uL3RlbXBsZXRlL3RlbXBsYXRlJztcbmltcG9ydCBhZGRFdmVudHMgZnJvbSAnLi91dGxpcy9kYlN1Y2Nlc3MvYWRkRXZlbnRzJztcbmltcG9ydCBsYXp5TG9hZFdpdGhvdXREQiBmcm9tICcuL3V0bGlzL2xhenlMb2FkV2l0aG91dERCJztcblxuXG50ZW1wbGV0ZSgpO1xuLy8gb3BlbiBEQiwgYW5kIHdoZW4gREIgb3BlbiBzdWNjZWVkLCBpbnZva2UgaW5pdGlhbCBmdW5jdGlvblxub3BlbkRCKGNvbmZpZywgYWRkRXZlbnRzLCBsYXp5TG9hZFdpdGhvdXREQik7XG4iLCJmdW5jdGlvbiBjbGVhckNoaWxkTm9kZXMocm9vdCkge1xuICB3aGlsZSAocm9vdC5oYXNDaGlsZE5vZGVzKCkpIHsgLy8gb3Igcm9vdC5maXJzdENoaWxkIG9yIHJvb3QubGFzdENoaWxkXG4gICAgcm9vdC5yZW1vdmVDaGlsZChyb290LmZpcnN0Q2hpbGQpO1xuICB9XG4gIC8vIG9yIHJvb3QuaW5uZXJIVE1MID0gJydcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xlYXJDaGlsZE5vZGVzO1xuIiwiZnVuY3Rpb24gYWRkRXZlbnRzR2VuZXJhdG9yKGhhbmRsZXIpIHtcbiAgaGFuZGxlci5zaG93SW5pdCgpO1xuICAvLyBhZGQgYWxsIGV2ZW50TGlzdGVuZXJcbiAgY29uc3QgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG5cbiAgbGlzdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuY2xpY2tMaSwgZmFsc2UpO1xuICBsaXN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5yZW1vdmVMaSwgZmFsc2UpO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlci5lbnRlckFkZCwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWRkJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLmFkZCwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0RvbmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0RvbmUsIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dUb2RvJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dUb2RvLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93QWxsJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dBbGwsIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dDbGVhckRvbmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0NsZWFyRG9uZSwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0NsZWFyJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dDbGVhciwgZmFsc2UpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBhZGRFdmVudHNHZW5lcmF0b3I7XG4iLCJpbXBvcnQgZ2V0Rm9ybWF0RGF0ZSBmcm9tICcuLi9nZXRGb3JtYXREYXRlJztcblxuY29uc3QgZXZlbnRzSGFuZGxlckdlbmVyYWwgPSAoKCkgPT4ge1xuICBmdW5jdGlvbiByZXNldElucHV0KCkge1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNpbnB1dCcpLnZhbHVlID0gJyc7XG4gIH1cblxuICBmdW5jdGlvbiBkYXRhR2VuZXJhdG9yKGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IGtleSxcbiAgICAgIGV2ZW50OiB2YWx1ZSxcbiAgICAgIGZpbmlzaGVkOiBmYWxzZSxcbiAgICAgIGRhdGU6IGdldEZvcm1hdERhdGUoJ01N5pyIZGTml6VoaDptbScpLFxuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHJlc2V0SW5wdXQsXG4gICAgZGF0YUdlbmVyYXRvcixcbiAgfTtcbn0pKCk7XG5cbmV4cG9ydCBkZWZhdWx0IGV2ZW50c0hhbmRsZXJHZW5lcmFsO1xuIiwiaW1wb3J0IGl0ZW1HZW5lcmF0b3IgZnJvbSAnLi4vdGVtcGxldGUvaXRlbUdlbmVyYXRvcic7XG5pbXBvcnQgc2VudGVuY2VHZW5lcmF0b3IgZnJvbSAnLi4vdGVtcGxldGUvc2VudGVuY2VHZW5lcmF0b3InO1xuaW1wb3J0IGNsZWFyQ2hpbGROb2RlcyBmcm9tICcuLi9jbGVhckNoaWxkTm9kZXMnO1xuXG5jb25zdCByZWZyZXNoR2VuZXJhbCA9ICgoKSA9PiB7XG4gIGZ1bmN0aW9uIGluaXQoZGF0YUFycikge1xuICAgIF9zaG93KGRhdGFBcnIsIF9pbml0U2VudGVuY2UsIF9yZW5kZXJBbGwpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3Nob3coZGF0YUFyciwgc2hvd1NlbnRlbmNlRnVuYywgZ2VuZXJhdGVGdW5jKSB7XG4gICAgaWYgKCFkYXRhQXJyIHx8IGRhdGFBcnIubGVuZ3RoID09PSAwKSB7XG4gICAgICBzaG93U2VudGVuY2VGdW5jKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuaW5uZXJIVE1MID0gZ2VuZXJhdGVGdW5jKGRhdGFBcnIpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9pbml0U2VudGVuY2UoKSB7XG4gICAgY29uc3QgdGV4dCA9ICdXZWxjb21lfiwgdHJ5IHRvIGFkZCB5b3VyIGZpcnN0IHRvLWRvIGxpc3QgOiApJztcblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuaW5uZXJIVE1MID0gc2VudGVuY2VHZW5lcmF0b3IodGV4dCk7XG4gIH1cblxuICBmdW5jdGlvbiBhbGwocmFuZG9tQXBob3Jpc20sIGRhdGFBcnIpIHtcbiAgICBfc2hvdyhkYXRhQXJyLCByYW5kb21BcGhvcmlzbSwgX3JlbmRlckFsbCk7XG4gIH1cblxuICBmdW5jdGlvbiBfcmVuZGVyQWxsKGRhdGFBcnIpIHtcbiAgICBjb25zdCBjbGFzc2lmaWVkRGF0YSA9IF9jbGFzc2lmeURhdGEoZGF0YUFycik7XG5cbiAgICByZXR1cm4gaXRlbUdlbmVyYXRvcihjbGFzc2lmaWVkRGF0YSk7XG4gIH1cblxuICBmdW5jdGlvbiBfY2xhc3NpZnlEYXRhKGRhdGFBcnIpIHtcbiAgICBjb25zdCBmaW5pc2hlZCA9IFtdO1xuICAgIGNvbnN0IHVuZmlzaGllZCA9IFtdO1xuXG4gICAgLy8gcHV0IHRoZSBmaW5pc2hlZCBpdGVtIHRvIHRoZSBib3R0b21cbiAgICBkYXRhQXJyLmZvckVhY2goZGF0YSA9PiAoZGF0YS5maW5pc2hlZCA/IGZpbmlzaGVkLnVuc2hpZnQoZGF0YSkgOiB1bmZpc2hpZWQudW5zaGlmdChkYXRhKSkpO1xuXG4gICAgcmV0dXJuIHVuZmlzaGllZC5jb25jYXQoZmluaXNoZWQpO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFydChyYW5kb21BcGhvcmlzbSwgZGF0YUFycikge1xuICAgIF9zaG93KGRhdGFBcnIsIHJhbmRvbUFwaG9yaXNtLCBfcmVuZGVyUGFydCk7XG4gIH1cblxuICBmdW5jdGlvbiBfcmVuZGVyUGFydChkYXRhQXJyKSB7XG4gICAgcmV0dXJuIGl0ZW1HZW5lcmF0b3IoZGF0YUFyci5yZXZlcnNlKCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgY2xlYXJDaGlsZE5vZGVzKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2VudGVuY2VIYW5kbGVyKHRleHQpIHtcbiAgICBjb25zdCByZW5kZXJlZCA9IHNlbnRlbmNlR2VuZXJhdG9yKHRleHQpO1xuXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5pbm5lckhUTUwgPSByZW5kZXJlZDtcbiAgfVxuXG5cbiAgcmV0dXJuIHtcbiAgICBpbml0LFxuICAgIGFsbCxcbiAgICBwYXJ0LFxuICAgIGNsZWFyLFxuICAgIHNlbnRlbmNlSGFuZGxlcixcbiAgfTtcbn0pKCk7XG5cbmV4cG9ydCBkZWZhdWx0IHJlZnJlc2hHZW5lcmFsO1xuIiwiaW1wb3J0IGFkZEV2ZW50c0dlbmVyYXRvciBmcm9tICcuLi9kYkdlbmVyYWwvYWRkRXZlbnRzR2VuZXJhdG9yJztcbmltcG9ydCBldmVudHNIYW5kbGVyIGZyb20gJy4uL2RiU3VjY2Vzcy9ldmVudHNIYW5kbGVyJztcblxuZnVuY3Rpb24gYWRkRXZlbnRzKCkge1xuICBhZGRFdmVudHNHZW5lcmF0b3IoZXZlbnRzSGFuZGxlcik7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFkZEV2ZW50cztcbiIsImltcG9ydCBEQiBmcm9tICdpbmRleGVkZGItY3J1ZCc7XG5pbXBvcnQgUmVmcmVzaCBmcm9tICcuLi9kYlN1Y2Nlc3MvcmVmcmVzaCc7XG5pbXBvcnQgR2VuZXJhbCBmcm9tICcuLi9kYkdlbmVyYWwvZXZlbnRzSGFuZGxlckdlbmVyYWwnO1xuaW1wb3J0IGl0ZW1HZW5lcmF0b3IgZnJvbSAnLi4vdGVtcGxldGUvaXRlbUdlbmVyYXRvcic7XG5cbmNvbnN0IGV2ZW50c0hhbmRsZXIgPSAoKCkgPT4ge1xuICBmdW5jdGlvbiBhZGQoKSB7XG4gICAgY29uc3QgaW5wdXRWYWx1ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNpbnB1dCcpLnZhbHVlO1xuXG4gICAgaWYgKGlucHV0VmFsdWUgPT09ICcnKSB7XG4gICAgICB3aW5kb3cuYWxlcnQoJ3BsZWFzZSBpbnB1dCBhIHJlYWwgZGF0YX4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgX2FkZEhhbmRsZXIoaW5wdXRWYWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX2FkZEhhbmRsZXIoaW5wdXRWYWx1ZSkge1xuICAgIGNvbnN0IG5ld0RhdGEgPSBHZW5lcmFsLmRhdGFHZW5lcmF0b3IoREIuZ2V0TmV3S2V5KCksIGlucHV0VmFsdWUpO1xuICAgIGNvbnN0IHJlbmRlcmVkID0gaXRlbUdlbmVyYXRvcihuZXdEYXRhKTtcblxuICAgIHJlbW92ZUluaXQoKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmluc2VydEFkamFjZW50SFRNTCgnYWZ0ZXJiZWdpbicsIHJlbmRlcmVkKTsgLy8gUFVOQ0hMSU5FOiB1c2UgaW5zZXJ0QWRqYWNlbnRIVE1MXG4gICAgR2VuZXJhbC5yZXNldElucHV0KCk7XG4gICAgREIuYWRkSXRlbShuZXdEYXRhKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZUluaXQoKSB7XG4gICAgY29uc3QgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG5cbiAgICBpZiAobGlzdC5maXJzdENoaWxkLmNsYXNzTmFtZSA9PT0gJ2FwaG9yaXNtJykge1xuICAgICAgbGlzdC5yZW1vdmVDaGlsZChsaXN0LmZpcnN0Q2hpbGQpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGVudGVyQWRkKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgYWRkKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY2xpY2tMaSh7IHRhcmdldCB9KSB7XG4gICAgLy8gdXNlIGV2ZW50IGRlbGVnYXRpb25cbiAgICBpZiAoIXRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2FwaG9yaXNtJykpIHtcbiAgICAgIGlmICh0YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJykpIHsgLy8gdGVzdCB3aGV0aGVyIGlzIHhcbiAgICAgICAgdGFyZ2V0LmNsYXNzTGlzdC50b2dnbGUoJ2ZpbmlzaGVkJyk7IC8vIHRvZ2dsZSBhcHBlYXJhbmNlXG5cbiAgICAgICAgLy8gdXNlIHByZXZpb3VzbHkgc3RvcmVkIGRhdGEtaWQgYXR0cmlidXRlXG4gICAgICAgIGNvbnN0IGlkID0gcGFyc2VJbnQodGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpLCAxMCk7XG5cbiAgICAgICAgREIuZ2V0SXRlbShpZCwgX3RvZ2dsZUxpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfdG9nZ2xlTGkoZGF0YSkge1xuICAgIGNvbnN0IG5ld0RhdGEgPSBkYXRhO1xuXG4gICAgbmV3RGF0YS5maW5pc2hlZCA9ICFkYXRhLmZpbmlzaGVkO1xuICAgIERCLnVwZGF0ZUl0ZW0obmV3RGF0YSwgc2hvd0FsbCk7XG4gIH1cblxuICAvLyBsaSdzIFt4XSdzIGRlbGV0ZVxuICBmdW5jdGlvbiByZW1vdmVMaSh7IHRhcmdldCB9KSB7XG4gICAgaWYgKHRhcmdldC5jbGFzc05hbWUgPT09ICdjbG9zZScpIHsgLy8gdXNlIGV2ZW50IGRlbGVnYXRpb25cbiAgICAgIC8vIGRlbGV0ZSB2aXN1YWxseVxuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5yZW1vdmVDaGlsZCh0YXJnZXQucGFyZW50Tm9kZSk7XG4gICAgICBfYWRkUmFuZG9tKCk7XG4gICAgICAvLyB1c2UgcHJldmlvdXNseSBzdG9yZWQgZGF0YVxuICAgICAgY29uc3QgaWQgPSBwYXJzZUludCh0YXJnZXQucGFyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSwgMTApO1xuICAgICAgLy8gZGVsZXRlIGFjdHVhbGx5XG4gICAgICBEQi5yZW1vdmVJdGVtKGlkKTtcbiAgICB9XG4gIH1cblxuICAvLyBmb3IgU2VtYW50aWNcbiAgZnVuY3Rpb24gX2FkZFJhbmRvbSgpIHtcbiAgICBjb25zdCBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcblxuICAgIC8vIGJlY2F1c2Ugb2YgdGhlIGhhbmRsZXJiYXMudGVtcGxldGUsIGFkZCB0aGlzIGluc3BlY3RcbiAgICBpZiAoIWxpc3QubGFzdENoaWxkIHx8IGxpc3QubGFzdENoaWxkLm5vZGVOYW1lID09PSAnI3RleHQnKSB7XG4gICAgICBSZWZyZXNoLnJhbmRvbSgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dJbml0KCkge1xuICAgIERCLmdldEFsbChSZWZyZXNoLmluaXQpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0FsbCgpIHtcbiAgICBEQi5nZXRBbGwoUmVmcmVzaC5hbGwpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0RvbmUoKSB7XG4gICAgX3Nob3dXaGV0aGVyRG9uZSh0cnVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dUb2RvKCkge1xuICAgIF9zaG93V2hldGhlckRvbmUoZmFsc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3Nob3dXaGV0aGVyRG9uZSh3aGV0aGVyRG9uZSkge1xuICAgIGNvbnN0IGNvbmRpdGlvbiA9ICdmaW5pc2hlZCc7XG5cbiAgICBEQi5nZXRXaGV0aGVyQ29uZGl0aW9uSXRlbShjb25kaXRpb24sIHdoZXRoZXJEb25lLCBSZWZyZXNoLnBhcnQpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0NsZWFyRG9uZSgpIHtcbiAgICBjb25zdCBjb25kaXRpb24gPSAnZmluaXNoZWQnO1xuXG4gICAgREIucmVtb3ZlV2hldGhlckNvbmRpdGlvbkl0ZW0oY29uZGl0aW9uLCB0cnVlLCAoKSA9PiB7XG4gICAgICBEQi5nZXRBbGwoUmVmcmVzaC5wYXJ0KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dDbGVhcigpIHtcbiAgICBSZWZyZXNoLmNsZWFyKCk7IC8vIGNsZWFyIG5vZGVzIHZpc3VhbGx5XG4gICAgUmVmcmVzaC5yYW5kb20oKTtcbiAgICBEQi5jbGVhcigpOyAvLyBjbGVhciBkYXRhIGluZGVlZFxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBhZGQsXG4gICAgZW50ZXJBZGQsXG4gICAgY2xpY2tMaSxcbiAgICByZW1vdmVMaSxcbiAgICBzaG93SW5pdCxcbiAgICBzaG93QWxsLFxuICAgIHNob3dEb25lLFxuICAgIHNob3dUb2RvLFxuICAgIHNob3dDbGVhckRvbmUsXG4gICAgc2hvd0NsZWFyLFxuICB9O1xufSkoKTtcblxuZXhwb3J0IGRlZmF1bHQgZXZlbnRzSGFuZGxlcjtcbiIsImltcG9ydCBEQiBmcm9tICdpbmRleGVkZGItY3J1ZCc7XG5pbXBvcnQgR2VuZXJhbCBmcm9tICcuLi9kYkdlbmVyYWwvcmVmcmVzaEdlbmVyYWwnO1xuXG5jb25zdCBSZWZyZXNoID0gKCgpID0+IHtcbiAgZnVuY3Rpb24gcmFuZG9tQXBob3Jpc20oKSB7XG4gICAgY29uc3Qgc3RvcmVOYW1lID0gJ2FwaG9yaXNtJztcbiAgICBjb25zdCByYW5kb21JbmRleCA9IE1hdGguY2VpbChNYXRoLnJhbmRvbSgpICogREIuZ2V0TGVuZ3RoKHN0b3JlTmFtZSkpO1xuXG4gICAgREIuZ2V0SXRlbShyYW5kb21JbmRleCwgX3BhcnNlVGV4dCwgc3RvcmVOYW1lKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9wYXJzZVRleHQoZGF0YSkge1xuICAgIGNvbnN0IHRleHQgPSBkYXRhLmNvbnRlbnQ7XG5cbiAgICBHZW5lcmFsLnNlbnRlbmNlSGFuZGxlcih0ZXh0KTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaW5pdDogR2VuZXJhbC5pbml0LFxuICAgIGFsbDogR2VuZXJhbC5hbGwuYmluZChudWxsLCByYW5kb21BcGhvcmlzbSksIC8vIFBVTkNITElORTogdXNlIGJpbmQgdG8gcGFzcyBwYXJhbXRlclxuICAgIHBhcnQ6IEdlbmVyYWwucGFydC5iaW5kKG51bGwsIHJhbmRvbUFwaG9yaXNtKSxcbiAgICBjbGVhcjogR2VuZXJhbC5jbGVhcixcbiAgICByYW5kb206IHJhbmRvbUFwaG9yaXNtLFxuICB9O1xuICAvLyByZXR1cm4ge1xuICAvLyAgIGluaXQ6IEdlbmVyYWwuaW5pdCxcbiAgLy8gICBGSVhNRTogd2h5IHRoaXMgbWV0aG9kIGNhbid0IHdvcmtcbiAgLy8gICBhbGw6ICgpID0+IEdlbmVyYWwuYWxsKHJhbmRvbUFwaG9yaXNtKSxcbiAgLy8gICBwYXJ0OiAoKSA9PiBHZW5lcmFsLnBhcnQocmFuZG9tQXBob3Jpc20pLFxuICAvLyAgIGNsZWFyOiBHZW5lcmFsLmNsZWFyLFxuICAvLyAgIHJhbmRvbTogcmFuZG9tQXBob3Jpc20sXG4gIC8vIH07XG59KSgpO1xuXG5leHBvcnQgZGVmYXVsdCBSZWZyZXNoO1xuIiwiZnVuY3Rpb24gZ2V0Rm9ybWF0RGF0ZShmbXQpIHtcbiAgY29uc3QgbmV3RGF0ZSA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IG8gPSB7XG4gICAgJ3krJzogbmV3RGF0ZS5nZXRGdWxsWWVhcigpLFxuICAgICdNKyc6IG5ld0RhdGUuZ2V0TW9udGgoKSArIDEsXG4gICAgJ2QrJzogbmV3RGF0ZS5nZXREYXRlKCksXG4gICAgJ2grJzogbmV3RGF0ZS5nZXRIb3VycygpLFxuICAgICdtKyc6IG5ld0RhdGUuZ2V0TWludXRlcygpLFxuICB9O1xuICBsZXQgbmV3Zm10ID0gZm10O1xuXG4gIE9iamVjdC5rZXlzKG8pLmZvckVhY2goKGspID0+IHtcbiAgICBpZiAobmV3IFJlZ0V4cChgKCR7a30pYCkudGVzdChuZXdmbXQpKSB7XG4gICAgICBpZiAoayA9PT0gJ3krJykge1xuICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChgJHtvW2tdfWApLnN1YnN0cig0IC0gUmVnRXhwLiQxLmxlbmd0aCkpO1xuICAgICAgfSBlbHNlIGlmIChrID09PSAnUysnKSB7XG4gICAgICAgIGxldCBsZW5zID0gUmVnRXhwLiQxLmxlbmd0aDtcbiAgICAgICAgbGVucyA9IGxlbnMgPT09IDEgPyAzIDogbGVucztcbiAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoYDAwJHtvW2tdfWApLnN1YnN0cigoYCR7b1trXX1gKS5sZW5ndGggLSAxLCBsZW5zKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChSZWdFeHAuJDEubGVuZ3RoID09PSAxKSA/IChvW2tdKSA6ICgoYDAwJHtvW2tdfWApLnN1YnN0cigoYCR7b1trXX1gKS5sZW5ndGgpKSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgLy8gZm9yIChjb25zdCBrIGluIG8pIHtcbiAgLy8gICBpZiAobmV3IFJlZ0V4cChgKCR7a30pYCkudGVzdChuZXdmbXQpKSB7XG4gIC8vICAgICBpZiAoayA9PT0gJ3krJykge1xuICAvLyAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChgJHtvW2tdfWApLnN1YnN0cig0IC0gUmVnRXhwLiQxLmxlbmd0aCkpO1xuICAvLyAgICAgfSBlbHNlIGlmIChrID09PSAnUysnKSB7XG4gIC8vICAgICAgIGxldCBsZW5zID0gUmVnRXhwLiQxLmxlbmd0aDtcbiAgLy8gICAgICAgbGVucyA9IGxlbnMgPT09IDEgPyAzIDogbGVucztcbiAgLy8gICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoYDAwJHtvW2tdfWApLnN1YnN0cigoYCR7b1trXX1gKS5sZW5ndGggLSAxLCBsZW5zKSk7XG4gIC8vICAgICB9IGVsc2Uge1xuICAvLyAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChSZWdFeHAuJDEubGVuZ3RoID09PSAxKSA/IChvW2tdKSA6ICgoYDAwJHtvW2tdfWApLnN1YnN0cigoYCR7b1trXX1gKS5sZW5ndGgpKSk7XG4gIC8vICAgICB9XG4gIC8vICAgfVxuICAvLyB9XG5cbiAgcmV0dXJuIG5ld2ZtdDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZ2V0Rm9ybWF0RGF0ZTtcbiIsImZ1bmN0aW9uIGxhenlMb2FkV2l0aG91dERCKCkge1xuICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG5cbiAgZWxlbWVudC50eXBlID0gJ3RleHQvamF2YXNjcmlwdCc7XG4gIGVsZW1lbnQuYXN5bmMgPSB0cnVlO1xuICBlbGVtZW50LnNyYyA9ICcuL2Rpc3Qvc2NyaXB0cy9sYXp5TG9hZC5taW4uanMnO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBsYXp5TG9hZFdpdGhvdXREQjtcbiIsImZ1bmN0aW9uIGl0ZW1HZW5lcmF0b3IoZGF0YUFycikge1xuICBjb25zdCB0ZW1wbGF0ZSA9IEhhbmRsZWJhcnMudGVtcGxhdGVzLmxpO1xuICBsZXQgcmVzdWx0ID0gZGF0YUFycjtcblxuICBpZiAoIUFycmF5LmlzQXJyYXkoZGF0YUFycikpIHtcbiAgICByZXN1bHQgPSBbZGF0YUFycl07XG4gIH1cbiAgY29uc3QgcmVuZGVyZWQgPSB0ZW1wbGF0ZSh7IGxpc3RJdGVtczogcmVzdWx0IH0pO1xuXG4gIHJldHVybiByZW5kZXJlZC50cmltKCk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGl0ZW1HZW5lcmF0b3I7XG4iLCJmdW5jdGlvbiBzZW50ZW5jZUdlbmVyYXRvcih0ZXh0KSB7XG4gIGNvbnN0IHRlbXBsYXRlID0gSGFuZGxlYmFycy50ZW1wbGF0ZXMubGk7XG4gIGNvbnN0IHJlbmRlcmVkID0gdGVtcGxhdGUoeyBzZW50ZW5jZTogdGV4dCB9KTtcblxuICByZXR1cm4gcmVuZGVyZWQudHJpbSgpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBzZW50ZW5jZUdlbmVyYXRvcjtcbiIsImZ1bmN0aW9uIHRlbXBsYXRlICgpIHtcbiAgdmFyIHRlbXBsYXRlID0gSGFuZGxlYmFycy50ZW1wbGF0ZSwgdGVtcGxhdGVzID0gSGFuZGxlYmFycy50ZW1wbGF0ZXMgPSBIYW5kbGViYXJzLnRlbXBsYXRlcyB8fCB7fTtcbnRlbXBsYXRlc1snbGknXSA9IHRlbXBsYXRlKHtcIjFcIjpmdW5jdGlvbihjb250YWluZXIsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICAgIHZhciBoZWxwZXI7XG5cbiAgcmV0dXJuIFwiICA8bGkgY2xhc3M9XFxcImFwaG9yaXNtXFxcIj5cIlxuICAgICsgY29udGFpbmVyLmVzY2FwZUV4cHJlc3Npb24oKChoZWxwZXIgPSAoaGVscGVyID0gaGVscGVycy5zZW50ZW5jZSB8fCAoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuc2VudGVuY2UgOiBkZXB0aDApKSAhPSBudWxsID8gaGVscGVyIDogaGVscGVycy5oZWxwZXJNaXNzaW5nKSwodHlwZW9mIGhlbHBlciA9PT0gXCJmdW5jdGlvblwiID8gaGVscGVyLmNhbGwoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAgOiAoY29udGFpbmVyLm51bGxDb250ZXh0IHx8IHt9KSx7XCJuYW1lXCI6XCJzZW50ZW5jZVwiLFwiaGFzaFwiOnt9LFwiZGF0YVwiOmRhdGF9KSA6IGhlbHBlcikpKVxuICAgICsgXCI8L2xpPlxcblwiO1xufSxcIjNcIjpmdW5jdGlvbihjb250YWluZXIsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICAgIHZhciBzdGFjazE7XG5cbiAgcmV0dXJuICgoc3RhY2sxID0gaGVscGVycy5lYWNoLmNhbGwoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAgOiAoY29udGFpbmVyLm51bGxDb250ZXh0IHx8IHt9KSwoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAubGlzdEl0ZW1zIDogZGVwdGgwKSx7XCJuYW1lXCI6XCJlYWNoXCIsXCJoYXNoXCI6e30sXCJmblwiOmNvbnRhaW5lci5wcm9ncmFtKDQsIGRhdGEsIDApLFwiaW52ZXJzZVwiOmNvbnRhaW5lci5ub29wLFwiZGF0YVwiOmRhdGF9KSkgIT0gbnVsbCA/IHN0YWNrMSA6IFwiXCIpO1xufSxcIjRcIjpmdW5jdGlvbihjb250YWluZXIsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICAgIHZhciBzdGFjazE7XG5cbiAgcmV0dXJuICgoc3RhY2sxID0gaGVscGVyc1tcImlmXCJdLmNhbGwoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAgOiAoY29udGFpbmVyLm51bGxDb250ZXh0IHx8IHt9KSwoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuZmluaXNoZWQgOiBkZXB0aDApLHtcIm5hbWVcIjpcImlmXCIsXCJoYXNoXCI6e30sXCJmblwiOmNvbnRhaW5lci5wcm9ncmFtKDUsIGRhdGEsIDApLFwiaW52ZXJzZVwiOmNvbnRhaW5lci5wcm9ncmFtKDcsIGRhdGEsIDApLFwiZGF0YVwiOmRhdGF9KSkgIT0gbnVsbCA/IHN0YWNrMSA6IFwiXCIpO1xufSxcIjVcIjpmdW5jdGlvbihjb250YWluZXIsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICAgIHZhciBoZWxwZXIsIGFsaWFzMT1kZXB0aDAgIT0gbnVsbCA/IGRlcHRoMCA6IChjb250YWluZXIubnVsbENvbnRleHQgfHwge30pLCBhbGlhczI9aGVscGVycy5oZWxwZXJNaXNzaW5nLCBhbGlhczM9XCJmdW5jdGlvblwiLCBhbGlhczQ9Y29udGFpbmVyLmVzY2FwZUV4cHJlc3Npb247XG5cbiAgcmV0dXJuIFwiICAgICAgPGxpIGNsYXNzPVxcXCJmaW5pc2hlZFxcXCIgZGF0YS1pZD1cIlxuICAgICsgYWxpYXM0KCgoaGVscGVyID0gKGhlbHBlciA9IGhlbHBlcnMuaWQgfHwgKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmlkIDogZGVwdGgwKSkgIT0gbnVsbCA/IGhlbHBlciA6IGFsaWFzMiksKHR5cGVvZiBoZWxwZXIgPT09IGFsaWFzMyA/IGhlbHBlci5jYWxsKGFsaWFzMSx7XCJuYW1lXCI6XCJpZFwiLFwiaGFzaFwiOnt9LFwiZGF0YVwiOmRhdGF9KSA6IGhlbHBlcikpKVxuICAgICsgXCI+XFxuICAgICAgICBcIlxuICAgICsgYWxpYXM0KCgoaGVscGVyID0gKGhlbHBlciA9IGhlbHBlcnMuZGF0ZSB8fCAoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuZGF0ZSA6IGRlcHRoMCkpICE9IG51bGwgPyBoZWxwZXIgOiBhbGlhczIpLCh0eXBlb2YgaGVscGVyID09PSBhbGlhczMgPyBoZWxwZXIuY2FsbChhbGlhczEse1wibmFtZVwiOlwiZGF0ZVwiLFwiaGFzaFwiOnt9LFwiZGF0YVwiOmRhdGF9KSA6IGhlbHBlcikpKVxuICAgICsgXCIgOiBcXG4gICAgICAgIDxzcGFuPlwiXG4gICAgKyBhbGlhczQoKChoZWxwZXIgPSAoaGVscGVyID0gaGVscGVycy5ldmVudCB8fCAoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuZXZlbnQgOiBkZXB0aDApKSAhPSBudWxsID8gaGVscGVyIDogYWxpYXMyKSwodHlwZW9mIGhlbHBlciA9PT0gYWxpYXMzID8gaGVscGVyLmNhbGwoYWxpYXMxLHtcIm5hbWVcIjpcImV2ZW50XCIsXCJoYXNoXCI6e30sXCJkYXRhXCI6ZGF0YX0pIDogaGVscGVyKSkpXG4gICAgKyBcIjwvc3Bhbj5cXG4gICAgICAgIDxzcGFuIGNsYXNzPVxcXCJjbG9zZVxcXCI+w5c8L3NwYW4+XFxuICAgICAgPC9saT5cXG5cIjtcbn0sXCI3XCI6ZnVuY3Rpb24oY29udGFpbmVyLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgICB2YXIgaGVscGVyLCBhbGlhczE9ZGVwdGgwICE9IG51bGwgPyBkZXB0aDAgOiAoY29udGFpbmVyLm51bGxDb250ZXh0IHx8IHt9KSwgYWxpYXMyPWhlbHBlcnMuaGVscGVyTWlzc2luZywgYWxpYXMzPVwiZnVuY3Rpb25cIiwgYWxpYXM0PWNvbnRhaW5lci5lc2NhcGVFeHByZXNzaW9uO1xuXG4gIHJldHVybiBcIiAgICAgIDxsaSBkYXRhLWlkPVwiXG4gICAgKyBhbGlhczQoKChoZWxwZXIgPSAoaGVscGVyID0gaGVscGVycy5pZCB8fCAoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuaWQgOiBkZXB0aDApKSAhPSBudWxsID8gaGVscGVyIDogYWxpYXMyKSwodHlwZW9mIGhlbHBlciA9PT0gYWxpYXMzID8gaGVscGVyLmNhbGwoYWxpYXMxLHtcIm5hbWVcIjpcImlkXCIsXCJoYXNoXCI6e30sXCJkYXRhXCI6ZGF0YX0pIDogaGVscGVyKSkpXG4gICAgKyBcIj5cXG4gICAgICAgIFwiXG4gICAgKyBhbGlhczQoKChoZWxwZXIgPSAoaGVscGVyID0gaGVscGVycy5kYXRlIHx8IChkZXB0aDAgIT0gbnVsbCA/IGRlcHRoMC5kYXRlIDogZGVwdGgwKSkgIT0gbnVsbCA/IGhlbHBlciA6IGFsaWFzMiksKHR5cGVvZiBoZWxwZXIgPT09IGFsaWFzMyA/IGhlbHBlci5jYWxsKGFsaWFzMSx7XCJuYW1lXCI6XCJkYXRlXCIsXCJoYXNoXCI6e30sXCJkYXRhXCI6ZGF0YX0pIDogaGVscGVyKSkpXG4gICAgKyBcIiA6IFxcbiAgICAgICAgPHNwYW4+XCJcbiAgICArIGFsaWFzNCgoKGhlbHBlciA9IChoZWxwZXIgPSBoZWxwZXJzLmV2ZW50IHx8IChkZXB0aDAgIT0gbnVsbCA/IGRlcHRoMC5ldmVudCA6IGRlcHRoMCkpICE9IG51bGwgPyBoZWxwZXIgOiBhbGlhczIpLCh0eXBlb2YgaGVscGVyID09PSBhbGlhczMgPyBoZWxwZXIuY2FsbChhbGlhczEse1wibmFtZVwiOlwiZXZlbnRcIixcImhhc2hcIjp7fSxcImRhdGFcIjpkYXRhfSkgOiBoZWxwZXIpKSlcbiAgICArIFwiPC9zcGFuPlxcbiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImNsb3NlXFxcIj7Dlzwvc3Bhbj5cXG4gICAgICA8L2xpPlxcblwiO1xufSxcImNvbXBpbGVyXCI6WzcsXCI+PSA0LjAuMFwiXSxcIm1haW5cIjpmdW5jdGlvbihjb250YWluZXIsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICAgIHZhciBzdGFjazE7XG5cbiAgcmV0dXJuICgoc3RhY2sxID0gaGVscGVyc1tcImlmXCJdLmNhbGwoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAgOiAoY29udGFpbmVyLm51bGxDb250ZXh0IHx8IHt9KSwoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuc2VudGVuY2UgOiBkZXB0aDApLHtcIm5hbWVcIjpcImlmXCIsXCJoYXNoXCI6e30sXCJmblwiOmNvbnRhaW5lci5wcm9ncmFtKDEsIGRhdGEsIDApLFwiaW52ZXJzZVwiOmNvbnRhaW5lci5wcm9ncmFtKDMsIGRhdGEsIDApLFwiZGF0YVwiOmRhdGF9KSkgIT0gbnVsbCA/IHN0YWNrMSA6IFwiXCIpO1xufSxcInVzZURhdGFcIjp0cnVlfSk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCB0ZW1wbGF0ZTtcbiJdfQ==
