(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _log = require('./utlis/log');

var _log2 = _interopRequireDefault(_log);

var _crud = require('./utlis/crud');

var _crud2 = _interopRequireDefault(_crud);

var _getAllRequest = require('./utlis/getAllRequest');

var _getAllRequest2 = _interopRequireDefault(_getAllRequest);

var _parseJSONData = require('./utlis/parseJSONData');

var _parseJSONData2 = _interopRequireDefault(_parseJSONData);

var _promiseGenerator = require('./utlis/promiseGenerator');

var _promiseGenerator2 = _interopRequireDefault(_promiseGenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _db = void 0;
var _defaultStoreName = void 0;
var _presentKey = {}; // store multi-objectStore's presentKey

/* first step, open it and use others API */

var open = function open(config) {
  return new Promise(function (resolve, reject) {
    if (window.indexedDB) {
      _openHandler(config, resolve);
    } else {
      _log2.default.fail('Your browser doesn\'t support a stable version of IndexedDB. You can install latest Chrome or FireFox to handler it');
      reject();
    }
  });
};

/* synchronous API */

var getLength = function getLength() {
  var storeName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _defaultStoreName;
  return _presentKey[storeName];
};

var getNewKey = function getNewKey() {
  var storeName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _defaultStoreName;

  _presentKey[storeName] += 1;

  return _presentKey[storeName];
};

/* asynchronous API: crud methods */

var getItem = function getItem(key) {
  var storeName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _defaultStoreName;
  return _crud2.default.get(_db, key, storeName);
};

var getConditionItem = function getConditionItem(condition, whether) {
  var storeName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _defaultStoreName;
  return _crud2.default.getCondition(_db, condition, whether, storeName);
};

var getAll = function getAll() {
  var storeName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _defaultStoreName;
  return _crud2.default.getAll(_db, storeName);
};

var addItem = function addItem(newData) {
  var storeName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _defaultStoreName;
  return _crud2.default.add(_db, newData, storeName);
};

var removeItem = function removeItem(key) {
  var storeName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _defaultStoreName;
  return _crud2.default.remove(_db, key, storeName);
};

var removeConditionItem = function removeConditionItem(condition, whether) {
  var storeName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _defaultStoreName;
  return _crud2.default.removeCondition(_db, condition, whether, storeName);
};

var clear = function clear() {
  var storeName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _defaultStoreName;
  return _crud2.default.clear(_db, storeName);
};

var updateItem = function updateItem(newData) {
  var storeName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _defaultStoreName;
  return _crud2.default.update(_db, newData, storeName);
};

/* handle DB.open */

function _openHandler(config, successCallback) {
  var openRequest = window.indexedDB.open(config.name, config.version); // open indexedDB

  // an onblocked event is fired until they are closed or reloaded
  openRequest.onblocked = function () {
    // If some other tab is loaded with the database, then it needs to be closed before we can proceed.
    _log2.default.fail('Please close all other tabs with this site open');
  };

  // Creating or updating the version of the database
  openRequest.onupgradeneeded = function (_ref) {
    var target = _ref.target;

    // All other databases have been closed. Set everything up.
    _db = target.result;
    _log2.default.success('onupgradeneeded in');
    _createObjectStoreHandler(config.storeConfig);
  };

  openRequest.onsuccess = function (_ref2) {
    var target = _ref2.target;

    _db = target.result;
    _db.onversionchange = function () {
      _db.close();
      _log2.default.fail('A new version of this page is ready. Please reload');
    };
    _openSuccessCallbackHandler(config.storeConfig, successCallback);
  };

  // use error events bubble to handle all error events
  openRequest.onerror = function (_ref3) {
    var target = _ref3.target;

    _log2.default.fail('Something is wrong with indexedDB, for more information, checkout console');
    _log2.default.fail(target.error);
    throw new Error(target.error);
  };
}

function _openSuccessCallbackHandler(configStoreConfig, successCallback) {
  var objectStoreList = (0, _parseJSONData2.default)(configStoreConfig, 'storeName');

  objectStoreList.forEach(function (storeConfig, index) {
    if (index === 0) {
      _defaultStoreName = storeConfig.storeName; // PUNCHLINE: the last storeName is defaultStoreName
    }
    if (index === objectStoreList.length - 1) {
      _getPresentKey(storeConfig.storeName, function () {
        successCallback();
        _log2.default.success('open indexedDB success');
      });
    } else {
      _getPresentKey(storeConfig.storeName);
    }
  });
}

// set present key value to _presentKey (the private property)
function _getPresentKey(storeName, successCallback) {
  var transaction = _db.transaction([storeName]);
  var successMessage = 'now ' + storeName + ' \'s max key is ' + _presentKey[storeName]; // initial value is 0

  _presentKey[storeName] = 0;
  (0, _getAllRequest2.default)(transaction, storeName).onsuccess = function (_ref4) {
    var target = _ref4.target;

    var cursor = target.result;

    if (cursor) {
      _presentKey[storeName] = cursor.value.id;
      cursor.continue();
    }
  };
  _promiseGenerator2.default.transaction(transaction, successMessage).then(successCallback);
}

function _createObjectStoreHandler(configStoreConfig) {
  (0, _parseJSONData2.default)(configStoreConfig, 'storeName').forEach(function (storeConfig) {
    if (!_db.objectStoreNames.contains(storeConfig.storeName)) {
      _createObjectStore(storeConfig);
    }
  });
}

function _createObjectStore(_ref5) {
  var storeName = _ref5.storeName,
      key = _ref5.key,
      initialData = _ref5.initialData;

  var store = _db.createObjectStore(storeName, { keyPath: key, autoIncrement: true });
  var transaction = store.transaction;

  var successMessage = 'create ' + storeName + ' \'s object store succeed';

  _promiseGenerator2.default.transaction(transaction, successMessage).then(function () {
    if (initialData) {
      // Store initial values in the newly created object store.
      _initialDataHandler(storeName, initialData);
    }
  });
}

function _initialDataHandler(storeName, initialData) {
  var transaction = _db.transaction([storeName], 'readwrite');
  var objectStore = transaction.objectStore(storeName);
  var successMessage = 'add all ' + storeName + ' \'s initial data done';

  (0, _parseJSONData2.default)(initialData, 'initial').forEach(function (data, index) {
    var addRequest = objectStore.add(data);

    addRequest.onsuccess = function () {
      _log2.default.success('add initial data[' + index + '] successed');
    };
  });
  _promiseGenerator2.default.transaction(transaction, successMessage).then(function () {
    _getPresentKey(storeName);
  });
}

exports.default = {
  open: open,
  getLength: getLength,
  getNewKey: getNewKey,
  getItem: getItem,
  getConditionItem: getConditionItem,
  getAll: getAll,
  addItem: addItem,
  removeItem: removeItem,
  removeConditionItem: removeConditionItem,
  clear: clear,
  updateItem: updateItem
};

},{"./utlis/crud":2,"./utlis/getAllRequest":3,"./utlis/log":4,"./utlis/parseJSONData":5,"./utlis/promiseGenerator":6}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promiseGenerator = require('./promiseGenerator');

var _promiseGenerator2 = _interopRequireDefault(_promiseGenerator);

var _getAllRequest = require('./getAllRequest');

var _getAllRequest2 = _interopRequireDefault(_getAllRequest);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function get(dbValue, key, storeName) {
  var transaction = dbValue.transaction([storeName]);
  var getRequest = transaction.objectStore(storeName).get(parseInt(key, 10)); // get it by index
  var successMessage = 'get ' + storeName + '\'s ' + getRequest.source.keyPath + ' = ' + key + ' data success';
  var data = { property: 'result' };

  return _promiseGenerator2.default.request(getRequest, successMessage, data);
}

// get conditional data (boolean condition)
function getCondition(dbValue, condition, whether, storeName) {
  var transaction = dbValue.transaction([storeName]);
  var result = []; // use an array to storage eligible data
  var successMessage = 'get ' + storeName + '\'s ' + condition + ' = ' + whether + ' data success';

  (0, _getAllRequest2.default)(transaction, storeName).onsuccess = function (_ref) {
    var target = _ref.target;

    var cursor = target.result;

    if (cursor) {
      if (cursor.value[condition] === whether) {
        result.push(cursor.value);
      }
      cursor.continue();
    }
  };

  return _promiseGenerator2.default.transaction(transaction, successMessage, result);
}

function getAll(dbValue, storeName) {
  var transaction = dbValue.transaction([storeName]);
  var result = [];
  var successMessage = 'get ' + storeName + '\'s all data success';

  (0, _getAllRequest2.default)(transaction, storeName).onsuccess = function (_ref2) {
    var target = _ref2.target;

    var cursor = target.result;

    if (cursor) {
      result.push(cursor.value);
      cursor.continue();
    }
  };

  return _promiseGenerator2.default.transaction(transaction, successMessage, result);
}

function add(dbValue, newData, storeName) {
  var transaction = dbValue.transaction([storeName], 'readwrite');
  var addRequest = transaction.objectStore(storeName).add(newData);
  var successMessage = 'add ' + storeName + '\'s ' + addRequest.source.keyPath + '  = ' + newData[addRequest.source.keyPath] + ' data succeed';

  return _promiseGenerator2.default.request(addRequest, successMessage, newData);
}

function remove(dbValue, key, storeName) {
  var transaction = dbValue.transaction([storeName], 'readwrite');
  var deleteRequest = transaction.objectStore(storeName).delete(key);
  var successMessage = 'remove ' + storeName + '\'s  ' + deleteRequest.source.keyPath + ' = ' + key + ' data success';

  return _promiseGenerator2.default.request(deleteRequest, successMessage, key);
}

function removeCondition(dbValue, condition, whether, storeName) {
  var transaction = dbValue.transaction([storeName], 'readwrite');
  var successMessage = 'remove ' + storeName + '\'s ' + condition + ' = ' + whether + ' data success';

  (0, _getAllRequest2.default)(transaction, storeName).onsuccess = function (_ref3) {
    var target = _ref3.target;

    var cursor = target.result;

    if (cursor) {
      if (cursor.value[condition] === whether) {
        cursor.delete();
      }
      cursor.continue();
    }
  };

  return _promiseGenerator2.default.transaction(transaction, successMessage);
}

function clear(dbValue, storeName) {
  var transaction = dbValue.transaction([storeName], 'readwrite');
  var successMessage = 'clear ' + storeName + '\'s all data success';

  (0, _getAllRequest2.default)(transaction, storeName).onsuccess = function (_ref4) {
    var target = _ref4.target;

    var cursor = target.result;

    if (cursor) {
      cursor.delete();
      cursor.continue();
    }
  };

  return _promiseGenerator2.default.transaction(transaction, successMessage);
}

function update(dbValue, newData, storeName) {
  var transaction = dbValue.transaction([storeName], 'readwrite');
  var putRequest = transaction.objectStore(storeName).put(newData);
  var successMessage = 'update ' + storeName + '\'s ' + putRequest.source.keyPath + '  = ' + newData[putRequest.source.keyPath] + ' data success';

  return _promiseGenerator2.default.request(putRequest, successMessage, newData);
}

exports.default = {
  get: get,
  getCondition: getCondition,
  getAll: getAll,
  add: add,
  remove: remove,
  removeCondition: removeCondition,
  clear: clear,
  update: update
};

},{"./getAllRequest":3,"./promiseGenerator":6}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var getAllRequest = function getAllRequest(transaction, storeName) {
  return transaction.objectStore(storeName).openCursor(IDBKeyRange.lowerBound(1), 'next');
};

exports.default = getAllRequest;

},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var log = {
  success: function success(message) {
    console.log("\u2713 " + message + " :)");
  },
  fail: function fail(message) {
    console.log("\u2714 " + message);
  }
};

exports.default = log;

},{}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var parseJSONData = function parseJSONData(rawdata, name) {
  try {
    var parsedData = JSON.parse(JSON.stringify(rawdata));

    return parsedData;
  } catch (error) {
    window.alert("please set correct " + name + " array object");
    console.log(error);
    throw error;
  }
};

exports.default = parseJSONData;

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var requestPromise = function requestPromise(request, successMessage, data) {
  return new Promise(function (resolve, reject) {
    request.onsuccess = function () {
      var successData = data;

      if (data.property) {
        successData = request[data.property]; // for getItem
      }
      _log2.default.success(successMessage);
      resolve(successData);
    };
    request.onerror = function () {
      _log2.default.fail(request.error);
      reject();
    };
  });
};

var transactionPromise = function transactionPromise(transaction, successMessage, data) {
  return new Promise(function (resolve, reject) {
    transaction.oncomplete = function () {
      _log2.default.success(successMessage);
      resolve(data);
    };
    transaction.onerror = function () {
      _log2.default.fail(transaction.error);
      reject();
    };
  });
};

exports.default = {
  request: requestPromise,
  transaction: transactionPromise
};

},{"./log":4}],7:[function(require,module,exports){
'use strict';
module.exports = require('./dist/indexeddb-crud')['default'];

},{"./dist/indexeddb-crud":1}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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
// when failed, change to withoutDB mode
(0, _indexeddbCrud.open)(_config2.default).then(_addEvents2.default).catch(_lazyLoadWithoutDB2.default);

},{"../templete/template":21,"./db/config":8,"./utlis/dbSuccess/addEvents":14,"./utlis/lazyLoadWithoutDB":18,"indexeddb-crud":7}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getFormatDate = require('../getFormatDate');

var _getFormatDate2 = _interopRequireDefault(_getFormatDate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

exports.default = {
  resetInput: resetInput,
  dataGenerator: dataGenerator
};

},{"../getFormatDate":17}],13:[function(require,module,exports){
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

exports.default = {
  init: init,
  all: all,
  part: part,
  clear: clear,
  sentenceHandler: sentenceHandler
};

},{"../clearChildNodes":10,"../templete/itemGenerator":19,"../templete/sentenceGenerator":20}],14:[function(require,module,exports){
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

},{"../dbGeneral/addEventsGenerator":11,"../dbSuccess/eventsHandler":15}],15:[function(require,module,exports){
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

function enterAdd(_ref) {
  var keyCode = _ref.keyCode;

  if (keyCode === 13) {
    add();
  }
}

function clickLi(_ref2) {
  var target = _ref2.target;

  // use event delegation
  if (!target.classList.contains('aphorism')) {
    if (target.getAttribute('data-id')) {
      // test whether is x
      target.classList.toggle('finished'); // toggle appearance

      // use previously stored data-id attribute
      var id = parseInt(target.getAttribute('data-id'), 10);

      _indexeddbCrud2.default.getItem(id).then(_toggleLi);
    }
  }
}

function _toggleLi(data) {
  var newData = data;

  newData.finished = !data.finished;
  _indexeddbCrud2.default.updateItem(newData).then(showAll);
}

// li's [x]'s delete
function removeLi(_ref3) {
  var target = _ref3.target;

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
  _indexeddbCrud2.default.getAll().then(_refresh2.default.init);
}

function showAll() {
  _indexeddbCrud2.default.getAll().then(_refresh2.default.all);
}

function showDone() {
  _showWhetherDone(true);
}

function showTodo() {
  _showWhetherDone(false);
}

function _showWhetherDone(whetherDone) {
  var condition = 'finished';

  _indexeddbCrud2.default.getConditionItem(condition, whetherDone).then(_refresh2.default.part);
}

function showClearDone() {
  var condition = 'finished';

  _indexeddbCrud2.default.removeConditionItem(condition, true).then(_indexeddbCrud2.default.getAll).then(_refresh2.default.part);
}

function showClear() {
  _refresh2.default.clear(); // clear nodes visually
  _indexeddbCrud2.default.clear().then(_refresh2.default.random); // clear data indeed
}

exports.default = {
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

},{"../dbGeneral/eventsHandlerGeneral":12,"../dbSuccess/refresh":16,"../templete/itemGenerator":19,"indexeddb-crud":7}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _indexeddbCrud = require('indexeddb-crud');

var _indexeddbCrud2 = _interopRequireDefault(_indexeddbCrud);

var _refreshGeneral = require('../dbGeneral/refreshGeneral');

var _refreshGeneral2 = _interopRequireDefault(_refreshGeneral);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function randomAphorism() {
  var storeName = 'aphorism';
  var randomIndex = Math.ceil(Math.random() * _indexeddbCrud2.default.getLength(storeName));

  _indexeddbCrud2.default.getItem(randomIndex, storeName).then(_parseText);
}

function _parseText(data) {
  var text = data.content;

  _refreshGeneral2.default.sentenceHandler(text);
}

exports.default = {
  init: _refreshGeneral2.default.init,
  all: _refreshGeneral2.default.all.bind(null, randomAphorism), // PUNCHLINE: use bind to pass paramter
  part: _refreshGeneral2.default.part.bind(null, randomAphorism),
  clear: _refreshGeneral2.default.clear,
  random: randomAphorism
};

},{"../dbGeneral/refreshGeneral":13,"indexeddb-crud":7}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
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

},{}],19:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){
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

},{}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5kZXhlZGRiLWNydWQvZGlzdC9pbmRleGVkZGItY3J1ZC5qcyIsIm5vZGVfbW9kdWxlcy9pbmRleGVkZGItY3J1ZC9kaXN0L3V0bGlzL2NydWQuanMiLCJub2RlX21vZHVsZXMvaW5kZXhlZGRiLWNydWQvZGlzdC91dGxpcy9nZXRBbGxSZXF1ZXN0LmpzIiwibm9kZV9tb2R1bGVzL2luZGV4ZWRkYi1jcnVkL2Rpc3QvdXRsaXMvbG9nLmpzIiwibm9kZV9tb2R1bGVzL2luZGV4ZWRkYi1jcnVkL2Rpc3QvdXRsaXMvcGFyc2VKU09ORGF0YS5qcyIsIm5vZGVfbW9kdWxlcy9pbmRleGVkZGItY3J1ZC9kaXN0L3V0bGlzL3Byb21pc2VHZW5lcmF0b3IuanMiLCJub2RlX21vZHVsZXMvaW5kZXhlZGRiLWNydWQvaW5kZXguanMiLCJzcmMvc2NyaXB0cy9kYi9jb25maWcuanMiLCJzcmMvc2NyaXB0cy9tYWluLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvY2xlYXJDaGlsZE5vZGVzLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJHZW5lcmFsL2FkZEV2ZW50c0dlbmVyYXRvci5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2RiR2VuZXJhbC9ldmVudHNIYW5kbGVyR2VuZXJhbC5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2RiR2VuZXJhbC9yZWZyZXNoR2VuZXJhbC5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2RiU3VjY2Vzcy9hZGRFdmVudHMuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYlN1Y2Nlc3MvZXZlbnRzSGFuZGxlci5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2RiU3VjY2Vzcy9yZWZyZXNoLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZ2V0Rm9ybWF0RGF0ZS5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2xhenlMb2FkV2l0aG91dERCLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvdGVtcGxldGUvaXRlbUdlbmVyYXRvci5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL3RlbXBsZXRlL3NlbnRlbmNlR2VuZXJhdG9yLmpzIiwic3JjL3RlbXBsZXRlL3RlbXBsYXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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RyxFQUF2SCxDQUFWLEtBQXFQLElBQXJQLEdBQTRQLE1BQTVQLEdBQXFRLEVBQTdRO0FBQ0QsS0F0QzBCLEVBc0N6QixXQUFVLElBdENlLEVBQVQsQ0FBbEI7QUF1Q0M7O2tCQUVjLFEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfXJldHVybiBlfSkoKSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9sb2cgPSByZXF1aXJlKCcuL3V0bGlzL2xvZycpO1xuXG52YXIgX2xvZzIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9sb2cpO1xuXG52YXIgX2NydWQgPSByZXF1aXJlKCcuL3V0bGlzL2NydWQnKTtcblxudmFyIF9jcnVkMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NydWQpO1xuXG52YXIgX2dldEFsbFJlcXVlc3QgPSByZXF1aXJlKCcuL3V0bGlzL2dldEFsbFJlcXVlc3QnKTtcblxudmFyIF9nZXRBbGxSZXF1ZXN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2dldEFsbFJlcXVlc3QpO1xuXG52YXIgX3BhcnNlSlNPTkRhdGEgPSByZXF1aXJlKCcuL3V0bGlzL3BhcnNlSlNPTkRhdGEnKTtcblxudmFyIF9wYXJzZUpTT05EYXRhMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3BhcnNlSlNPTkRhdGEpO1xuXG52YXIgX3Byb21pc2VHZW5lcmF0b3IgPSByZXF1aXJlKCcuL3V0bGlzL3Byb21pc2VHZW5lcmF0b3InKTtcblxudmFyIF9wcm9taXNlR2VuZXJhdG9yMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3Byb21pc2VHZW5lcmF0b3IpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG52YXIgX2RiID0gdm9pZCAwO1xudmFyIF9kZWZhdWx0U3RvcmVOYW1lID0gdm9pZCAwO1xudmFyIF9wcmVzZW50S2V5ID0ge307IC8vIHN0b3JlIG11bHRpLW9iamVjdFN0b3JlJ3MgcHJlc2VudEtleVxuXG4vKiBmaXJzdCBzdGVwLCBvcGVuIGl0IGFuZCB1c2Ugb3RoZXJzIEFQSSAqL1xuXG52YXIgb3BlbiA9IGZ1bmN0aW9uIG9wZW4oY29uZmlnKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgaWYgKHdpbmRvdy5pbmRleGVkREIpIHtcbiAgICAgIF9vcGVuSGFuZGxlcihjb25maWcsIHJlc29sdmUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBfbG9nMi5kZWZhdWx0LmZhaWwoJ1lvdXIgYnJvd3NlciBkb2VzblxcJ3Qgc3VwcG9ydCBhIHN0YWJsZSB2ZXJzaW9uIG9mIEluZGV4ZWREQi4gWW91IGNhbiBpbnN0YWxsIGxhdGVzdCBDaHJvbWUgb3IgRmlyZUZveCB0byBoYW5kbGVyIGl0Jyk7XG4gICAgICByZWplY3QoKTtcbiAgICB9XG4gIH0pO1xufTtcblxuLyogc3luY2hyb25vdXMgQVBJICovXG5cbnZhciBnZXRMZW5ndGggPSBmdW5jdGlvbiBnZXRMZW5ndGgoKSB7XG4gIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuICByZXR1cm4gX3ByZXNlbnRLZXlbc3RvcmVOYW1lXTtcbn07XG5cbnZhciBnZXROZXdLZXkgPSBmdW5jdGlvbiBnZXROZXdLZXkoKSB7XG4gIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuXG4gIF9wcmVzZW50S2V5W3N0b3JlTmFtZV0gKz0gMTtcblxuICByZXR1cm4gX3ByZXNlbnRLZXlbc3RvcmVOYW1lXTtcbn07XG5cbi8qIGFzeW5jaHJvbm91cyBBUEk6IGNydWQgbWV0aG9kcyAqL1xuXG52YXIgZ2V0SXRlbSA9IGZ1bmN0aW9uIGdldEl0ZW0oa2V5KSB7XG4gIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuICByZXR1cm4gX2NydWQyLmRlZmF1bHQuZ2V0KF9kYiwga2V5LCBzdG9yZU5hbWUpO1xufTtcblxudmFyIGdldENvbmRpdGlvbkl0ZW0gPSBmdW5jdGlvbiBnZXRDb25kaXRpb25JdGVtKGNvbmRpdGlvbiwgd2hldGhlcikge1xuICB2YXIgc3RvcmVOYW1lID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiBfZGVmYXVsdFN0b3JlTmFtZTtcbiAgcmV0dXJuIF9jcnVkMi5kZWZhdWx0LmdldENvbmRpdGlvbihfZGIsIGNvbmRpdGlvbiwgd2hldGhlciwgc3RvcmVOYW1lKTtcbn07XG5cbnZhciBnZXRBbGwgPSBmdW5jdGlvbiBnZXRBbGwoKSB7XG4gIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuICByZXR1cm4gX2NydWQyLmRlZmF1bHQuZ2V0QWxsKF9kYiwgc3RvcmVOYW1lKTtcbn07XG5cbnZhciBhZGRJdGVtID0gZnVuY3Rpb24gYWRkSXRlbShuZXdEYXRhKSB7XG4gIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuICByZXR1cm4gX2NydWQyLmRlZmF1bHQuYWRkKF9kYiwgbmV3RGF0YSwgc3RvcmVOYW1lKTtcbn07XG5cbnZhciByZW1vdmVJdGVtID0gZnVuY3Rpb24gcmVtb3ZlSXRlbShrZXkpIHtcbiAgdmFyIHN0b3JlTmFtZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogX2RlZmF1bHRTdG9yZU5hbWU7XG4gIHJldHVybiBfY3J1ZDIuZGVmYXVsdC5yZW1vdmUoX2RiLCBrZXksIHN0b3JlTmFtZSk7XG59O1xuXG52YXIgcmVtb3ZlQ29uZGl0aW9uSXRlbSA9IGZ1bmN0aW9uIHJlbW92ZUNvbmRpdGlvbkl0ZW0oY29uZGl0aW9uLCB3aGV0aGVyKSB7XG4gIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuICByZXR1cm4gX2NydWQyLmRlZmF1bHQucmVtb3ZlQ29uZGl0aW9uKF9kYiwgY29uZGl0aW9uLCB3aGV0aGVyLCBzdG9yZU5hbWUpO1xufTtcblxudmFyIGNsZWFyID0gZnVuY3Rpb24gY2xlYXIoKSB7XG4gIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuICByZXR1cm4gX2NydWQyLmRlZmF1bHQuY2xlYXIoX2RiLCBzdG9yZU5hbWUpO1xufTtcblxudmFyIHVwZGF0ZUl0ZW0gPSBmdW5jdGlvbiB1cGRhdGVJdGVtKG5ld0RhdGEpIHtcbiAgdmFyIHN0b3JlTmFtZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogX2RlZmF1bHRTdG9yZU5hbWU7XG4gIHJldHVybiBfY3J1ZDIuZGVmYXVsdC51cGRhdGUoX2RiLCBuZXdEYXRhLCBzdG9yZU5hbWUpO1xufTtcblxuLyogaGFuZGxlIERCLm9wZW4gKi9cblxuZnVuY3Rpb24gX29wZW5IYW5kbGVyKGNvbmZpZywgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gIHZhciBvcGVuUmVxdWVzdCA9IHdpbmRvdy5pbmRleGVkREIub3Blbihjb25maWcubmFtZSwgY29uZmlnLnZlcnNpb24pOyAvLyBvcGVuIGluZGV4ZWREQlxuXG4gIC8vIGFuIG9uYmxvY2tlZCBldmVudCBpcyBmaXJlZCB1bnRpbCB0aGV5IGFyZSBjbG9zZWQgb3IgcmVsb2FkZWRcbiAgb3BlblJlcXVlc3Qub25ibG9ja2VkID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIElmIHNvbWUgb3RoZXIgdGFiIGlzIGxvYWRlZCB3aXRoIHRoZSBkYXRhYmFzZSwgdGhlbiBpdCBuZWVkcyB0byBiZSBjbG9zZWQgYmVmb3JlIHdlIGNhbiBwcm9jZWVkLlxuICAgIF9sb2cyLmRlZmF1bHQuZmFpbCgnUGxlYXNlIGNsb3NlIGFsbCBvdGhlciB0YWJzIHdpdGggdGhpcyBzaXRlIG9wZW4nKTtcbiAgfTtcblxuICAvLyBDcmVhdGluZyBvciB1cGRhdGluZyB0aGUgdmVyc2lvbiBvZiB0aGUgZGF0YWJhc2VcbiAgb3BlblJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24gKF9yZWYpIHtcbiAgICB2YXIgdGFyZ2V0ID0gX3JlZi50YXJnZXQ7XG5cbiAgICAvLyBBbGwgb3RoZXIgZGF0YWJhc2VzIGhhdmUgYmVlbiBjbG9zZWQuIFNldCBldmVyeXRoaW5nIHVwLlxuICAgIF9kYiA9IHRhcmdldC5yZXN1bHQ7XG4gICAgX2xvZzIuZGVmYXVsdC5zdWNjZXNzKCdvbnVwZ3JhZGVuZWVkZWQgaW4nKTtcbiAgICBfY3JlYXRlT2JqZWN0U3RvcmVIYW5kbGVyKGNvbmZpZy5zdG9yZUNvbmZpZyk7XG4gIH07XG5cbiAgb3BlblJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gKF9yZWYyKSB7XG4gICAgdmFyIHRhcmdldCA9IF9yZWYyLnRhcmdldDtcblxuICAgIF9kYiA9IHRhcmdldC5yZXN1bHQ7XG4gICAgX2RiLm9udmVyc2lvbmNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIF9kYi5jbG9zZSgpO1xuICAgICAgX2xvZzIuZGVmYXVsdC5mYWlsKCdBIG5ldyB2ZXJzaW9uIG9mIHRoaXMgcGFnZSBpcyByZWFkeS4gUGxlYXNlIHJlbG9hZCcpO1xuICAgIH07XG4gICAgX29wZW5TdWNjZXNzQ2FsbGJhY2tIYW5kbGVyKGNvbmZpZy5zdG9yZUNvbmZpZywgc3VjY2Vzc0NhbGxiYWNrKTtcbiAgfTtcblxuICAvLyB1c2UgZXJyb3IgZXZlbnRzIGJ1YmJsZSB0byBoYW5kbGUgYWxsIGVycm9yIGV2ZW50c1xuICBvcGVuUmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24gKF9yZWYzKSB7XG4gICAgdmFyIHRhcmdldCA9IF9yZWYzLnRhcmdldDtcblxuICAgIF9sb2cyLmRlZmF1bHQuZmFpbCgnU29tZXRoaW5nIGlzIHdyb25nIHdpdGggaW5kZXhlZERCLCBmb3IgbW9yZSBpbmZvcm1hdGlvbiwgY2hlY2tvdXQgY29uc29sZScpO1xuICAgIF9sb2cyLmRlZmF1bHQuZmFpbCh0YXJnZXQuZXJyb3IpO1xuICAgIHRocm93IG5ldyBFcnJvcih0YXJnZXQuZXJyb3IpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBfb3BlblN1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoY29uZmlnU3RvcmVDb25maWcsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICB2YXIgb2JqZWN0U3RvcmVMaXN0ID0gKDAsIF9wYXJzZUpTT05EYXRhMi5kZWZhdWx0KShjb25maWdTdG9yZUNvbmZpZywgJ3N0b3JlTmFtZScpO1xuXG4gIG9iamVjdFN0b3JlTGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChzdG9yZUNvbmZpZywgaW5kZXgpIHtcbiAgICBpZiAoaW5kZXggPT09IDApIHtcbiAgICAgIF9kZWZhdWx0U3RvcmVOYW1lID0gc3RvcmVDb25maWcuc3RvcmVOYW1lOyAvLyBQVU5DSExJTkU6IHRoZSBsYXN0IHN0b3JlTmFtZSBpcyBkZWZhdWx0U3RvcmVOYW1lXG4gICAgfVxuICAgIGlmIChpbmRleCA9PT0gb2JqZWN0U3RvcmVMaXN0Lmxlbmd0aCAtIDEpIHtcbiAgICAgIF9nZXRQcmVzZW50S2V5KHN0b3JlQ29uZmlnLnN0b3JlTmFtZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2soKTtcbiAgICAgICAgX2xvZzIuZGVmYXVsdC5zdWNjZXNzKCdvcGVuIGluZGV4ZWREQiBzdWNjZXNzJyk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgX2dldFByZXNlbnRLZXkoc3RvcmVDb25maWcuc3RvcmVOYW1lKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vLyBzZXQgcHJlc2VudCBrZXkgdmFsdWUgdG8gX3ByZXNlbnRLZXkgKHRoZSBwcml2YXRlIHByb3BlcnR5KVxuZnVuY3Rpb24gX2dldFByZXNlbnRLZXkoc3RvcmVOYW1lLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdKTtcbiAgdmFyIHN1Y2Nlc3NNZXNzYWdlID0gJ25vdyAnICsgc3RvcmVOYW1lICsgJyBcXCdzIG1heCBrZXkgaXMgJyArIF9wcmVzZW50S2V5W3N0b3JlTmFtZV07IC8vIGluaXRpYWwgdmFsdWUgaXMgMFxuXG4gIF9wcmVzZW50S2V5W3N0b3JlTmFtZV0gPSAwO1xuICAoMCwgX2dldEFsbFJlcXVlc3QyLmRlZmF1bHQpKHRyYW5zYWN0aW9uLCBzdG9yZU5hbWUpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChfcmVmNCkge1xuICAgIHZhciB0YXJnZXQgPSBfcmVmNC50YXJnZXQ7XG5cbiAgICB2YXIgY3Vyc29yID0gdGFyZ2V0LnJlc3VsdDtcblxuICAgIGlmIChjdXJzb3IpIHtcbiAgICAgIF9wcmVzZW50S2V5W3N0b3JlTmFtZV0gPSBjdXJzb3IudmFsdWUuaWQ7XG4gICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICB9XG4gIH07XG4gIF9wcm9taXNlR2VuZXJhdG9yMi5kZWZhdWx0LnRyYW5zYWN0aW9uKHRyYW5zYWN0aW9uLCBzdWNjZXNzTWVzc2FnZSkudGhlbihzdWNjZXNzQ2FsbGJhY2spO1xufVxuXG5mdW5jdGlvbiBfY3JlYXRlT2JqZWN0U3RvcmVIYW5kbGVyKGNvbmZpZ1N0b3JlQ29uZmlnKSB7XG4gICgwLCBfcGFyc2VKU09ORGF0YTIuZGVmYXVsdCkoY29uZmlnU3RvcmVDb25maWcsICdzdG9yZU5hbWUnKS5mb3JFYWNoKGZ1bmN0aW9uIChzdG9yZUNvbmZpZykge1xuICAgIGlmICghX2RiLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoc3RvcmVDb25maWcuc3RvcmVOYW1lKSkge1xuICAgICAgX2NyZWF0ZU9iamVjdFN0b3JlKHN0b3JlQ29uZmlnKTtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBfY3JlYXRlT2JqZWN0U3RvcmUoX3JlZjUpIHtcbiAgdmFyIHN0b3JlTmFtZSA9IF9yZWY1LnN0b3JlTmFtZSxcbiAgICAgIGtleSA9IF9yZWY1LmtleSxcbiAgICAgIGluaXRpYWxEYXRhID0gX3JlZjUuaW5pdGlhbERhdGE7XG5cbiAgdmFyIHN0b3JlID0gX2RiLmNyZWF0ZU9iamVjdFN0b3JlKHN0b3JlTmFtZSwgeyBrZXlQYXRoOiBrZXksIGF1dG9JbmNyZW1lbnQ6IHRydWUgfSk7XG4gIHZhciB0cmFuc2FjdGlvbiA9IHN0b3JlLnRyYW5zYWN0aW9uO1xuXG4gIHZhciBzdWNjZXNzTWVzc2FnZSA9ICdjcmVhdGUgJyArIHN0b3JlTmFtZSArICcgXFwncyBvYmplY3Qgc3RvcmUgc3VjY2VlZCc7XG5cbiAgX3Byb21pc2VHZW5lcmF0b3IyLmRlZmF1bHQudHJhbnNhY3Rpb24odHJhbnNhY3Rpb24sIHN1Y2Nlc3NNZXNzYWdlKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoaW5pdGlhbERhdGEpIHtcbiAgICAgIC8vIFN0b3JlIGluaXRpYWwgdmFsdWVzIGluIHRoZSBuZXdseSBjcmVhdGVkIG9iamVjdCBzdG9yZS5cbiAgICAgIF9pbml0aWFsRGF0YUhhbmRsZXIoc3RvcmVOYW1lLCBpbml0aWFsRGF0YSk7XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gX2luaXRpYWxEYXRhSGFuZGxlcihzdG9yZU5hbWUsIGluaXRpYWxEYXRhKSB7XG4gIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuICB2YXIgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpO1xuICB2YXIgc3VjY2Vzc01lc3NhZ2UgPSAnYWRkIGFsbCAnICsgc3RvcmVOYW1lICsgJyBcXCdzIGluaXRpYWwgZGF0YSBkb25lJztcblxuICAoMCwgX3BhcnNlSlNPTkRhdGEyLmRlZmF1bHQpKGluaXRpYWxEYXRhLCAnaW5pdGlhbCcpLmZvckVhY2goZnVuY3Rpb24gKGRhdGEsIGluZGV4KSB7XG4gICAgdmFyIGFkZFJlcXVlc3QgPSBvYmplY3RTdG9yZS5hZGQoZGF0YSk7XG5cbiAgICBhZGRSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIF9sb2cyLmRlZmF1bHQuc3VjY2VzcygnYWRkIGluaXRpYWwgZGF0YVsnICsgaW5kZXggKyAnXSBzdWNjZXNzZWQnKTtcbiAgICB9O1xuICB9KTtcbiAgX3Byb21pc2VHZW5lcmF0b3IyLmRlZmF1bHQudHJhbnNhY3Rpb24odHJhbnNhY3Rpb24sIHN1Y2Nlc3NNZXNzYWdlKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICBfZ2V0UHJlc2VudEtleShzdG9yZU5hbWUpO1xuICB9KTtcbn1cblxuZXhwb3J0cy5kZWZhdWx0ID0ge1xuICBvcGVuOiBvcGVuLFxuICBnZXRMZW5ndGg6IGdldExlbmd0aCxcbiAgZ2V0TmV3S2V5OiBnZXROZXdLZXksXG4gIGdldEl0ZW06IGdldEl0ZW0sXG4gIGdldENvbmRpdGlvbkl0ZW06IGdldENvbmRpdGlvbkl0ZW0sXG4gIGdldEFsbDogZ2V0QWxsLFxuICBhZGRJdGVtOiBhZGRJdGVtLFxuICByZW1vdmVJdGVtOiByZW1vdmVJdGVtLFxuICByZW1vdmVDb25kaXRpb25JdGVtOiByZW1vdmVDb25kaXRpb25JdGVtLFxuICBjbGVhcjogY2xlYXIsXG4gIHVwZGF0ZUl0ZW06IHVwZGF0ZUl0ZW1cbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleGVkZGItY3J1ZC5qcy5tYXAiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfcHJvbWlzZUdlbmVyYXRvciA9IHJlcXVpcmUoJy4vcHJvbWlzZUdlbmVyYXRvcicpO1xuXG52YXIgX3Byb21pc2VHZW5lcmF0b3IyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcHJvbWlzZUdlbmVyYXRvcik7XG5cbnZhciBfZ2V0QWxsUmVxdWVzdCA9IHJlcXVpcmUoJy4vZ2V0QWxsUmVxdWVzdCcpO1xuXG52YXIgX2dldEFsbFJlcXVlc3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZ2V0QWxsUmVxdWVzdCk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIGdldChkYlZhbHVlLCBrZXksIHN0b3JlTmFtZSkge1xuICB2YXIgdHJhbnNhY3Rpb24gPSBkYlZhbHVlLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdKTtcbiAgdmFyIGdldFJlcXVlc3QgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpLmdldChwYXJzZUludChrZXksIDEwKSk7IC8vIGdldCBpdCBieSBpbmRleFxuICB2YXIgc3VjY2Vzc01lc3NhZ2UgPSAnZ2V0ICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgZ2V0UmVxdWVzdC5zb3VyY2Uua2V5UGF0aCArICcgPSAnICsga2V5ICsgJyBkYXRhIHN1Y2Nlc3MnO1xuICB2YXIgZGF0YSA9IHsgcHJvcGVydHk6ICdyZXN1bHQnIH07XG5cbiAgcmV0dXJuIF9wcm9taXNlR2VuZXJhdG9yMi5kZWZhdWx0LnJlcXVlc3QoZ2V0UmVxdWVzdCwgc3VjY2Vzc01lc3NhZ2UsIGRhdGEpO1xufVxuXG4vLyBnZXQgY29uZGl0aW9uYWwgZGF0YSAoYm9vbGVhbiBjb25kaXRpb24pXG5mdW5jdGlvbiBnZXRDb25kaXRpb24oZGJWYWx1ZSwgY29uZGl0aW9uLCB3aGV0aGVyLCBzdG9yZU5hbWUpIHtcbiAgdmFyIHRyYW5zYWN0aW9uID0gZGJWYWx1ZS50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSk7XG4gIHZhciByZXN1bHQgPSBbXTsgLy8gdXNlIGFuIGFycmF5IHRvIHN0b3JhZ2UgZWxpZ2libGUgZGF0YVxuICB2YXIgc3VjY2Vzc01lc3NhZ2UgPSAnZ2V0ICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgY29uZGl0aW9uICsgJyA9ICcgKyB3aGV0aGVyICsgJyBkYXRhIHN1Y2Nlc3MnO1xuXG4gICgwLCBfZ2V0QWxsUmVxdWVzdDIuZGVmYXVsdCkodHJhbnNhY3Rpb24sIHN0b3JlTmFtZSkub25zdWNjZXNzID0gZnVuY3Rpb24gKF9yZWYpIHtcbiAgICB2YXIgdGFyZ2V0ID0gX3JlZi50YXJnZXQ7XG5cbiAgICB2YXIgY3Vyc29yID0gdGFyZ2V0LnJlc3VsdDtcblxuICAgIGlmIChjdXJzb3IpIHtcbiAgICAgIGlmIChjdXJzb3IudmFsdWVbY29uZGl0aW9uXSA9PT0gd2hldGhlcikge1xuICAgICAgICByZXN1bHQucHVzaChjdXJzb3IudmFsdWUpO1xuICAgICAgfVxuICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBfcHJvbWlzZUdlbmVyYXRvcjIuZGVmYXVsdC50cmFuc2FjdGlvbih0cmFuc2FjdGlvbiwgc3VjY2Vzc01lc3NhZ2UsIHJlc3VsdCk7XG59XG5cbmZ1bmN0aW9uIGdldEFsbChkYlZhbHVlLCBzdG9yZU5hbWUpIHtcbiAgdmFyIHRyYW5zYWN0aW9uID0gZGJWYWx1ZS50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSk7XG4gIHZhciByZXN1bHQgPSBbXTtcbiAgdmFyIHN1Y2Nlc3NNZXNzYWdlID0gJ2dldCAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgYWxsIGRhdGEgc3VjY2Vzcyc7XG5cbiAgKDAsIF9nZXRBbGxSZXF1ZXN0Mi5kZWZhdWx0KSh0cmFuc2FjdGlvbiwgc3RvcmVOYW1lKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoX3JlZjIpIHtcbiAgICB2YXIgdGFyZ2V0ID0gX3JlZjIudGFyZ2V0O1xuXG4gICAgdmFyIGN1cnNvciA9IHRhcmdldC5yZXN1bHQ7XG5cbiAgICBpZiAoY3Vyc29yKSB7XG4gICAgICByZXN1bHQucHVzaChjdXJzb3IudmFsdWUpO1xuICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBfcHJvbWlzZUdlbmVyYXRvcjIuZGVmYXVsdC50cmFuc2FjdGlvbih0cmFuc2FjdGlvbiwgc3VjY2Vzc01lc3NhZ2UsIHJlc3VsdCk7XG59XG5cbmZ1bmN0aW9uIGFkZChkYlZhbHVlLCBuZXdEYXRhLCBzdG9yZU5hbWUpIHtcbiAgdmFyIHRyYW5zYWN0aW9uID0gZGJWYWx1ZS50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuICB2YXIgYWRkUmVxdWVzdCA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHN0b3JlTmFtZSkuYWRkKG5ld0RhdGEpO1xuICB2YXIgc3VjY2Vzc01lc3NhZ2UgPSAnYWRkICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgYWRkUmVxdWVzdC5zb3VyY2Uua2V5UGF0aCArICcgID0gJyArIG5ld0RhdGFbYWRkUmVxdWVzdC5zb3VyY2Uua2V5UGF0aF0gKyAnIGRhdGEgc3VjY2VlZCc7XG5cbiAgcmV0dXJuIF9wcm9taXNlR2VuZXJhdG9yMi5kZWZhdWx0LnJlcXVlc3QoYWRkUmVxdWVzdCwgc3VjY2Vzc01lc3NhZ2UsIG5ld0RhdGEpO1xufVxuXG5mdW5jdGlvbiByZW1vdmUoZGJWYWx1ZSwga2V5LCBzdG9yZU5hbWUpIHtcbiAgdmFyIHRyYW5zYWN0aW9uID0gZGJWYWx1ZS50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuICB2YXIgZGVsZXRlUmVxdWVzdCA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHN0b3JlTmFtZSkuZGVsZXRlKGtleSk7XG4gIHZhciBzdWNjZXNzTWVzc2FnZSA9ICdyZW1vdmUgJyArIHN0b3JlTmFtZSArICdcXCdzICAnICsgZGVsZXRlUmVxdWVzdC5zb3VyY2Uua2V5UGF0aCArICcgPSAnICsga2V5ICsgJyBkYXRhIHN1Y2Nlc3MnO1xuXG4gIHJldHVybiBfcHJvbWlzZUdlbmVyYXRvcjIuZGVmYXVsdC5yZXF1ZXN0KGRlbGV0ZVJlcXVlc3QsIHN1Y2Nlc3NNZXNzYWdlLCBrZXkpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVDb25kaXRpb24oZGJWYWx1ZSwgY29uZGl0aW9uLCB3aGV0aGVyLCBzdG9yZU5hbWUpIHtcbiAgdmFyIHRyYW5zYWN0aW9uID0gZGJWYWx1ZS50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuICB2YXIgc3VjY2Vzc01lc3NhZ2UgPSAncmVtb3ZlICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgY29uZGl0aW9uICsgJyA9ICcgKyB3aGV0aGVyICsgJyBkYXRhIHN1Y2Nlc3MnO1xuXG4gICgwLCBfZ2V0QWxsUmVxdWVzdDIuZGVmYXVsdCkodHJhbnNhY3Rpb24sIHN0b3JlTmFtZSkub25zdWNjZXNzID0gZnVuY3Rpb24gKF9yZWYzKSB7XG4gICAgdmFyIHRhcmdldCA9IF9yZWYzLnRhcmdldDtcblxuICAgIHZhciBjdXJzb3IgPSB0YXJnZXQucmVzdWx0O1xuXG4gICAgaWYgKGN1cnNvcikge1xuICAgICAgaWYgKGN1cnNvci52YWx1ZVtjb25kaXRpb25dID09PSB3aGV0aGVyKSB7XG4gICAgICAgIGN1cnNvci5kZWxldGUoKTtcbiAgICAgIH1cbiAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gX3Byb21pc2VHZW5lcmF0b3IyLmRlZmF1bHQudHJhbnNhY3Rpb24odHJhbnNhY3Rpb24sIHN1Y2Nlc3NNZXNzYWdlKTtcbn1cblxuZnVuY3Rpb24gY2xlYXIoZGJWYWx1ZSwgc3RvcmVOYW1lKSB7XG4gIHZhciB0cmFuc2FjdGlvbiA9IGRiVmFsdWUudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcbiAgdmFyIHN1Y2Nlc3NNZXNzYWdlID0gJ2NsZWFyICcgKyBzdG9yZU5hbWUgKyAnXFwncyBhbGwgZGF0YSBzdWNjZXNzJztcblxuICAoMCwgX2dldEFsbFJlcXVlc3QyLmRlZmF1bHQpKHRyYW5zYWN0aW9uLCBzdG9yZU5hbWUpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChfcmVmNCkge1xuICAgIHZhciB0YXJnZXQgPSBfcmVmNC50YXJnZXQ7XG5cbiAgICB2YXIgY3Vyc29yID0gdGFyZ2V0LnJlc3VsdDtcblxuICAgIGlmIChjdXJzb3IpIHtcbiAgICAgIGN1cnNvci5kZWxldGUoKTtcbiAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gX3Byb21pc2VHZW5lcmF0b3IyLmRlZmF1bHQudHJhbnNhY3Rpb24odHJhbnNhY3Rpb24sIHN1Y2Nlc3NNZXNzYWdlKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlKGRiVmFsdWUsIG5ld0RhdGEsIHN0b3JlTmFtZSkge1xuICB2YXIgdHJhbnNhY3Rpb24gPSBkYlZhbHVlLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdLCAncmVhZHdyaXRlJyk7XG4gIHZhciBwdXRSZXF1ZXN0ID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKS5wdXQobmV3RGF0YSk7XG4gIHZhciBzdWNjZXNzTWVzc2FnZSA9ICd1cGRhdGUgJyArIHN0b3JlTmFtZSArICdcXCdzICcgKyBwdXRSZXF1ZXN0LnNvdXJjZS5rZXlQYXRoICsgJyAgPSAnICsgbmV3RGF0YVtwdXRSZXF1ZXN0LnNvdXJjZS5rZXlQYXRoXSArICcgZGF0YSBzdWNjZXNzJztcblxuICByZXR1cm4gX3Byb21pc2VHZW5lcmF0b3IyLmRlZmF1bHQucmVxdWVzdChwdXRSZXF1ZXN0LCBzdWNjZXNzTWVzc2FnZSwgbmV3RGF0YSk7XG59XG5cbmV4cG9ydHMuZGVmYXVsdCA9IHtcbiAgZ2V0OiBnZXQsXG4gIGdldENvbmRpdGlvbjogZ2V0Q29uZGl0aW9uLFxuICBnZXRBbGw6IGdldEFsbCxcbiAgYWRkOiBhZGQsXG4gIHJlbW92ZTogcmVtb3ZlLFxuICByZW1vdmVDb25kaXRpb246IHJlbW92ZUNvbmRpdGlvbixcbiAgY2xlYXI6IGNsZWFyLFxuICB1cGRhdGU6IHVwZGF0ZVxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWNydWQuanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xudmFyIGdldEFsbFJlcXVlc3QgPSBmdW5jdGlvbiBnZXRBbGxSZXF1ZXN0KHRyYW5zYWN0aW9uLCBzdG9yZU5hbWUpIHtcbiAgcmV0dXJuIHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHN0b3JlTmFtZSkub3BlbkN1cnNvcihJREJLZXlSYW5nZS5sb3dlckJvdW5kKDEpLCAnbmV4dCcpO1xufTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gZ2V0QWxsUmVxdWVzdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWdldEFsbFJlcXVlc3QuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG52YXIgbG9nID0ge1xuICBzdWNjZXNzOiBmdW5jdGlvbiBzdWNjZXNzKG1lc3NhZ2UpIHtcbiAgICBjb25zb2xlLmxvZyhcIlxcdTI3MTMgXCIgKyBtZXNzYWdlICsgXCIgOilcIik7XG4gIH0sXG4gIGZhaWw6IGZ1bmN0aW9uIGZhaWwobWVzc2FnZSkge1xuICAgIGNvbnNvbGUubG9nKFwiXFx1MjcxNCBcIiArIG1lc3NhZ2UpO1xuICB9XG59O1xuXG5leHBvcnRzLmRlZmF1bHQgPSBsb2c7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1sb2cuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG52YXIgcGFyc2VKU09ORGF0YSA9IGZ1bmN0aW9uIHBhcnNlSlNPTkRhdGEocmF3ZGF0YSwgbmFtZSkge1xuICB0cnkge1xuICAgIHZhciBwYXJzZWREYXRhID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShyYXdkYXRhKSk7XG5cbiAgICByZXR1cm4gcGFyc2VkRGF0YTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB3aW5kb3cuYWxlcnQoXCJwbGVhc2Ugc2V0IGNvcnJlY3QgXCIgKyBuYW1lICsgXCIgYXJyYXkgb2JqZWN0XCIpO1xuICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gcGFyc2VKU09ORGF0YTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXBhcnNlSlNPTkRhdGEuanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2xvZyA9IHJlcXVpcmUoJy4vbG9nJyk7XG5cbnZhciBfbG9nMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2xvZyk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbnZhciByZXF1ZXN0UHJvbWlzZSA9IGZ1bmN0aW9uIHJlcXVlc3RQcm9taXNlKHJlcXVlc3QsIHN1Y2Nlc3NNZXNzYWdlLCBkYXRhKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc3VjY2Vzc0RhdGEgPSBkYXRhO1xuXG4gICAgICBpZiAoZGF0YS5wcm9wZXJ0eSkge1xuICAgICAgICBzdWNjZXNzRGF0YSA9IHJlcXVlc3RbZGF0YS5wcm9wZXJ0eV07IC8vIGZvciBnZXRJdGVtXG4gICAgICB9XG4gICAgICBfbG9nMi5kZWZhdWx0LnN1Y2Nlc3Moc3VjY2Vzc01lc3NhZ2UpO1xuICAgICAgcmVzb2x2ZShzdWNjZXNzRGF0YSk7XG4gICAgfTtcbiAgICByZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBfbG9nMi5kZWZhdWx0LmZhaWwocmVxdWVzdC5lcnJvcik7XG4gICAgICByZWplY3QoKTtcbiAgICB9O1xuICB9KTtcbn07XG5cbnZhciB0cmFuc2FjdGlvblByb21pc2UgPSBmdW5jdGlvbiB0cmFuc2FjdGlvblByb21pc2UodHJhbnNhY3Rpb24sIHN1Y2Nlc3NNZXNzYWdlLCBkYXRhKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIF9sb2cyLmRlZmF1bHQuc3VjY2VzcyhzdWNjZXNzTWVzc2FnZSk7XG4gICAgICByZXNvbHZlKGRhdGEpO1xuICAgIH07XG4gICAgdHJhbnNhY3Rpb24ub25lcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIF9sb2cyLmRlZmF1bHQuZmFpbCh0cmFuc2FjdGlvbi5lcnJvcik7XG4gICAgICByZWplY3QoKTtcbiAgICB9O1xuICB9KTtcbn07XG5cbmV4cG9ydHMuZGVmYXVsdCA9IHtcbiAgcmVxdWVzdDogcmVxdWVzdFByb21pc2UsXG4gIHRyYW5zYWN0aW9uOiB0cmFuc2FjdGlvblByb21pc2Vcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wcm9taXNlR2VuZXJhdG9yLmpzLm1hcCIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9kaXN0L2luZGV4ZWRkYi1jcnVkJylbJ2RlZmF1bHQnXTtcbiIsImV4cG9ydCBkZWZhdWx0IHtcbiAgbmFtZTogJ0p1c3RUb0RvJyxcbiAgdmVyc2lvbjogJzIzJyxcbiAgc3RvcmVDb25maWc6IFtcbiAgICB7XG4gICAgICBzdG9yZU5hbWU6ICdsaXN0JyxcbiAgICAgIGtleTogJ2lkJyxcbiAgICAgIGluaXRpYWxEYXRhOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogMCwgZXZlbnQ6ICdKdXN0RGVtbycsIGZpbmlzaGVkOiB0cnVlLCBkYXRlOiAwLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHN0b3JlTmFtZTogJ2FwaG9yaXNtJyxcbiAgICAgIGtleTogJ2lkJyxcbiAgICAgIGluaXRpYWxEYXRhOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogMSxcbiAgICAgICAgICBjb250ZW50OiBcIllvdSdyZSBiZXR0ZXIgdGhhbiB0aGF0XCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogMixcbiAgICAgICAgICBjb250ZW50OiAnWWVzdGVyZGF5IFlvdSBTYWlkIFRvbW9ycm93JyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAzLFxuICAgICAgICAgIGNvbnRlbnQ6ICdXaHkgYXJlIHdlIGhlcmU/JyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiA0LFxuICAgICAgICAgIGNvbnRlbnQ6ICdBbGwgaW4sIG9yIG5vdGhpbmcnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IDUsXG4gICAgICAgICAgY29udGVudDogJ1lvdSBOZXZlciBUcnksIFlvdSBOZXZlciBLbm93JyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiA2LFxuICAgICAgICAgIGNvbnRlbnQ6ICdUaGUgdW5leGFtaW5lZCBsaWZlIGlzIG5vdCB3b3J0aCBsaXZpbmcuIC0tIFNvY3JhdGVzJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiA3LFxuICAgICAgICAgIGNvbnRlbnQ6ICdUaGVyZSBpcyBvbmx5IG9uZSB0aGluZyB3ZSBzYXkgdG8gbGF6eTogTk9UIFRPREFZJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgXSxcbn07XG4iLCJpbXBvcnQgeyBvcGVuIGFzIG9wZW5EQiB9IGZyb20gJ2luZGV4ZWRkYi1jcnVkJztcbmltcG9ydCBjb25maWcgZnJvbSAnLi9kYi9jb25maWcnO1xuaW1wb3J0IHRlbXBsZXRlIGZyb20gJy4uL3RlbXBsZXRlL3RlbXBsYXRlJztcbmltcG9ydCBhZGRFdmVudHMgZnJvbSAnLi91dGxpcy9kYlN1Y2Nlc3MvYWRkRXZlbnRzJztcbmltcG9ydCBsYXp5TG9hZFdpdGhvdXREQiBmcm9tICcuL3V0bGlzL2xhenlMb2FkV2l0aG91dERCJztcblxuXG50ZW1wbGV0ZSgpO1xuLy8gb3BlbiBEQiwgYW5kIHdoZW4gREIgb3BlbiBzdWNjZWVkLCBpbnZva2UgaW5pdGlhbCBmdW5jdGlvblxuLy8gd2hlbiBmYWlsZWQsIGNoYW5nZSB0byB3aXRob3V0REIgbW9kZVxub3BlbkRCKGNvbmZpZylcbiAgLnRoZW4oYWRkRXZlbnRzKVxuICAuY2F0Y2gobGF6eUxvYWRXaXRob3V0REIpO1xuIiwiZnVuY3Rpb24gY2xlYXJDaGlsZE5vZGVzKHJvb3QpIHtcbiAgd2hpbGUgKHJvb3QuaGFzQ2hpbGROb2RlcygpKSB7IC8vIG9yIHJvb3QuZmlyc3RDaGlsZCBvciByb290Lmxhc3RDaGlsZFxuICAgIHJvb3QucmVtb3ZlQ2hpbGQocm9vdC5maXJzdENoaWxkKTtcbiAgfVxuICAvLyBvciByb290LmlubmVySFRNTCA9ICcnXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsZWFyQ2hpbGROb2RlcztcbiIsImZ1bmN0aW9uIGFkZEV2ZW50c0dlbmVyYXRvcihoYW5kbGVyKSB7XG4gIGhhbmRsZXIuc2hvd0luaXQoKTtcbiAgLy8gYWRkIGFsbCBldmVudExpc3RlbmVyXG4gIGNvbnN0IGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gIGxpc3QuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLmNsaWNrTGksIGZhbHNlKTtcbiAgbGlzdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIucmVtb3ZlTGksIGZhbHNlKTtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZXIuZW50ZXJBZGQsIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FkZCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5hZGQsIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dEb25lJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dEb25lLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93VG9kbycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93VG9kbywgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0FsbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93QWxsLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93Q2xlYXJEb25lJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dDbGVhckRvbmUsIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dDbGVhcicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93Q2xlYXIsIGZhbHNlKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYWRkRXZlbnRzR2VuZXJhdG9yO1xuIiwiaW1wb3J0IGdldEZvcm1hdERhdGUgZnJvbSAnLi4vZ2V0Rm9ybWF0RGF0ZSc7XG5cbmZ1bmN0aW9uIHJlc2V0SW5wdXQoKSB7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNpbnB1dCcpLnZhbHVlID0gJyc7XG59XG5cbmZ1bmN0aW9uIGRhdGFHZW5lcmF0b3Ioa2V5LCB2YWx1ZSkge1xuICByZXR1cm4ge1xuICAgIGlkOiBrZXksXG4gICAgZXZlbnQ6IHZhbHVlLFxuICAgIGZpbmlzaGVkOiBmYWxzZSxcbiAgICBkYXRlOiBnZXRGb3JtYXREYXRlKCdNTeaciGRk5pelaGg6bW0nKSxcbiAgfTtcbn1cblxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIHJlc2V0SW5wdXQsXG4gIGRhdGFHZW5lcmF0b3IsXG59O1xuIiwiaW1wb3J0IGl0ZW1HZW5lcmF0b3IgZnJvbSAnLi4vdGVtcGxldGUvaXRlbUdlbmVyYXRvcic7XG5pbXBvcnQgc2VudGVuY2VHZW5lcmF0b3IgZnJvbSAnLi4vdGVtcGxldGUvc2VudGVuY2VHZW5lcmF0b3InO1xuaW1wb3J0IGNsZWFyQ2hpbGROb2RlcyBmcm9tICcuLi9jbGVhckNoaWxkTm9kZXMnO1xuXG5mdW5jdGlvbiBpbml0KGRhdGFBcnIpIHtcbiAgX3Nob3coZGF0YUFyciwgX2luaXRTZW50ZW5jZSwgX3JlbmRlckFsbCk7XG59XG5cbmZ1bmN0aW9uIF9zaG93KGRhdGFBcnIsIHNob3dTZW50ZW5jZUZ1bmMsIGdlbmVyYXRlRnVuYykge1xuICBpZiAoIWRhdGFBcnIgfHwgZGF0YUFyci5sZW5ndGggPT09IDApIHtcbiAgICBzaG93U2VudGVuY2VGdW5jKCk7XG4gIH0gZWxzZSB7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5pbm5lckhUTUwgPSBnZW5lcmF0ZUZ1bmMoZGF0YUFycik7XG4gIH1cbn1cblxuZnVuY3Rpb24gX2luaXRTZW50ZW5jZSgpIHtcbiAgY29uc3QgdGV4dCA9ICdXZWxjb21lfiwgdHJ5IHRvIGFkZCB5b3VyIGZpcnN0IHRvLWRvIGxpc3QgOiApJztcblxuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmlubmVySFRNTCA9IHNlbnRlbmNlR2VuZXJhdG9yKHRleHQpO1xufVxuXG5mdW5jdGlvbiBhbGwocmFuZG9tQXBob3Jpc20sIGRhdGFBcnIpIHtcbiAgX3Nob3coZGF0YUFyciwgcmFuZG9tQXBob3Jpc20sIF9yZW5kZXJBbGwpO1xufVxuXG5mdW5jdGlvbiBfcmVuZGVyQWxsKGRhdGFBcnIpIHtcbiAgY29uc3QgY2xhc3NpZmllZERhdGEgPSBfY2xhc3NpZnlEYXRhKGRhdGFBcnIpO1xuXG4gIHJldHVybiBpdGVtR2VuZXJhdG9yKGNsYXNzaWZpZWREYXRhKTtcbn1cblxuZnVuY3Rpb24gX2NsYXNzaWZ5RGF0YShkYXRhQXJyKSB7XG4gIGNvbnN0IGZpbmlzaGVkID0gW107XG4gIGNvbnN0IHVuZmlzaGllZCA9IFtdO1xuXG4gIC8vIHB1dCB0aGUgZmluaXNoZWQgaXRlbSB0byB0aGUgYm90dG9tXG4gIGRhdGFBcnIuZm9yRWFjaChkYXRhID0+IChkYXRhLmZpbmlzaGVkID8gZmluaXNoZWQudW5zaGlmdChkYXRhKSA6IHVuZmlzaGllZC51bnNoaWZ0KGRhdGEpKSk7XG5cbiAgcmV0dXJuIHVuZmlzaGllZC5jb25jYXQoZmluaXNoZWQpO1xufVxuXG5mdW5jdGlvbiBwYXJ0KHJhbmRvbUFwaG9yaXNtLCBkYXRhQXJyKSB7XG4gIF9zaG93KGRhdGFBcnIsIHJhbmRvbUFwaG9yaXNtLCBfcmVuZGVyUGFydCk7XG59XG5cbmZ1bmN0aW9uIF9yZW5kZXJQYXJ0KGRhdGFBcnIpIHtcbiAgcmV0dXJuIGl0ZW1HZW5lcmF0b3IoZGF0YUFyci5yZXZlcnNlKCkpO1xufVxuXG5mdW5jdGlvbiBjbGVhcigpIHtcbiAgY2xlYXJDaGlsZE5vZGVzKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykpO1xufVxuXG5mdW5jdGlvbiBzZW50ZW5jZUhhbmRsZXIodGV4dCkge1xuICBjb25zdCByZW5kZXJlZCA9IHNlbnRlbmNlR2VuZXJhdG9yKHRleHQpO1xuXG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuaW5uZXJIVE1MID0gcmVuZGVyZWQ7XG59XG5cblxuZXhwb3J0IGRlZmF1bHQge1xuICBpbml0LFxuICBhbGwsXG4gIHBhcnQsXG4gIGNsZWFyLFxuICBzZW50ZW5jZUhhbmRsZXIsXG59O1xuIiwiaW1wb3J0IGFkZEV2ZW50c0dlbmVyYXRvciBmcm9tICcuLi9kYkdlbmVyYWwvYWRkRXZlbnRzR2VuZXJhdG9yJztcbmltcG9ydCBldmVudHNIYW5kbGVyIGZyb20gJy4uL2RiU3VjY2Vzcy9ldmVudHNIYW5kbGVyJztcblxuZnVuY3Rpb24gYWRkRXZlbnRzKCkge1xuICBhZGRFdmVudHNHZW5lcmF0b3IoZXZlbnRzSGFuZGxlcik7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFkZEV2ZW50cztcbiIsImltcG9ydCBEQiBmcm9tICdpbmRleGVkZGItY3J1ZCc7XG5pbXBvcnQgUmVmcmVzaCBmcm9tICcuLi9kYlN1Y2Nlc3MvcmVmcmVzaCc7XG5pbXBvcnQgR2VuZXJhbCBmcm9tICcuLi9kYkdlbmVyYWwvZXZlbnRzSGFuZGxlckdlbmVyYWwnO1xuaW1wb3J0IGl0ZW1HZW5lcmF0b3IgZnJvbSAnLi4vdGVtcGxldGUvaXRlbUdlbmVyYXRvcic7XG5cbmZ1bmN0aW9uIGFkZCgpIHtcbiAgY29uc3QgaW5wdXRWYWx1ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNpbnB1dCcpLnZhbHVlO1xuXG4gIGlmIChpbnB1dFZhbHVlID09PSAnJykge1xuICAgIHdpbmRvdy5hbGVydCgncGxlYXNlIGlucHV0IGEgcmVhbCBkYXRhficpO1xuICB9IGVsc2Uge1xuICAgIF9hZGRIYW5kbGVyKGlucHV0VmFsdWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9hZGRIYW5kbGVyKGlucHV0VmFsdWUpIHtcbiAgY29uc3QgbmV3RGF0YSA9IEdlbmVyYWwuZGF0YUdlbmVyYXRvcihEQi5nZXROZXdLZXkoKSwgaW5wdXRWYWx1ZSk7XG4gIGNvbnN0IHJlbmRlcmVkID0gaXRlbUdlbmVyYXRvcihuZXdEYXRhKTtcblxuICByZW1vdmVJbml0KCk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuaW5zZXJ0QWRqYWNlbnRIVE1MKCdhZnRlcmJlZ2luJywgcmVuZGVyZWQpOyAvLyBQVU5DSExJTkU6IHVzZSBpbnNlcnRBZGphY2VudEhUTUxcbiAgR2VuZXJhbC5yZXNldElucHV0KCk7XG4gIERCLmFkZEl0ZW0obmV3RGF0YSk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUluaXQoKSB7XG4gIGNvbnN0IGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gIGlmIChsaXN0LmZpcnN0Q2hpbGQuY2xhc3NOYW1lID09PSAnYXBob3Jpc20nKSB7XG4gICAgbGlzdC5yZW1vdmVDaGlsZChsaXN0LmZpcnN0Q2hpbGQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGVudGVyQWRkKHsga2V5Q29kZSB9KSB7XG4gIGlmIChrZXlDb2RlID09PSAxMykge1xuICAgIGFkZCgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNsaWNrTGkoeyB0YXJnZXQgfSkge1xuICAvLyB1c2UgZXZlbnQgZGVsZWdhdGlvblxuICBpZiAoIXRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2FwaG9yaXNtJykpIHtcbiAgICBpZiAodGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpKSB7IC8vIHRlc3Qgd2hldGhlciBpcyB4XG4gICAgICB0YXJnZXQuY2xhc3NMaXN0LnRvZ2dsZSgnZmluaXNoZWQnKTsgLy8gdG9nZ2xlIGFwcGVhcmFuY2VcblxuICAgICAgLy8gdXNlIHByZXZpb3VzbHkgc3RvcmVkIGRhdGEtaWQgYXR0cmlidXRlXG4gICAgICBjb25zdCBpZCA9IHBhcnNlSW50KHRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSwgMTApO1xuXG4gICAgICBEQi5nZXRJdGVtKGlkKVxuICAgICAgICAudGhlbihfdG9nZ2xlTGkpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBfdG9nZ2xlTGkoZGF0YSkge1xuICBjb25zdCBuZXdEYXRhID0gZGF0YTtcblxuICBuZXdEYXRhLmZpbmlzaGVkID0gIWRhdGEuZmluaXNoZWQ7XG4gIERCLnVwZGF0ZUl0ZW0obmV3RGF0YSlcbiAgICAudGhlbihzaG93QWxsKTtcbn1cblxuLy8gbGkncyBbeF0ncyBkZWxldGVcbmZ1bmN0aW9uIHJlbW92ZUxpKHsgdGFyZ2V0IH0pIHtcbiAgaWYgKHRhcmdldC5jbGFzc05hbWUgPT09ICdjbG9zZScpIHsgLy8gdXNlIGV2ZW50IGRlbGVnYXRpb25cbiAgICAvLyBkZWxldGUgdmlzdWFsbHlcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLnJlbW92ZUNoaWxkKHRhcmdldC5wYXJlbnROb2RlKTtcbiAgICBfYWRkUmFuZG9tKCk7XG4gICAgLy8gdXNlIHByZXZpb3VzbHkgc3RvcmVkIGRhdGFcbiAgICBjb25zdCBpZCA9IHBhcnNlSW50KHRhcmdldC5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpLCAxMCk7XG4gICAgLy8gZGVsZXRlIGFjdHVhbGx5XG4gICAgREIucmVtb3ZlSXRlbShpZCk7XG4gIH1cbn1cblxuLy8gZm9yIFNlbWFudGljXG5mdW5jdGlvbiBfYWRkUmFuZG9tKCkge1xuICBjb25zdCBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcblxuICAvLyBiZWNhdXNlIG9mIHRoZSBoYW5kbGVyYmFzLnRlbXBsZXRlLCBhZGQgdGhpcyBpbnNwZWN0XG4gIGlmICghbGlzdC5sYXN0Q2hpbGQgfHwgbGlzdC5sYXN0Q2hpbGQubm9kZU5hbWUgPT09ICcjdGV4dCcpIHtcbiAgICBSZWZyZXNoLnJhbmRvbSgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNob3dJbml0KCkge1xuICBEQi5nZXRBbGwoKVxuICAgIC50aGVuKFJlZnJlc2guaW5pdCk7XG59XG5cbmZ1bmN0aW9uIHNob3dBbGwoKSB7XG4gIERCLmdldEFsbCgpXG4gICAgLnRoZW4oUmVmcmVzaC5hbGwpO1xufVxuXG5mdW5jdGlvbiBzaG93RG9uZSgpIHtcbiAgX3Nob3dXaGV0aGVyRG9uZSh0cnVlKTtcbn1cblxuZnVuY3Rpb24gc2hvd1RvZG8oKSB7XG4gIF9zaG93V2hldGhlckRvbmUoZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBfc2hvd1doZXRoZXJEb25lKHdoZXRoZXJEb25lKSB7XG4gIGNvbnN0IGNvbmRpdGlvbiA9ICdmaW5pc2hlZCc7XG5cbiAgREIuZ2V0Q29uZGl0aW9uSXRlbShjb25kaXRpb24sIHdoZXRoZXJEb25lKVxuICAgIC50aGVuKFJlZnJlc2gucGFydCk7XG59XG5cbmZ1bmN0aW9uIHNob3dDbGVhckRvbmUoKSB7XG4gIGNvbnN0IGNvbmRpdGlvbiA9ICdmaW5pc2hlZCc7XG5cbiAgREIucmVtb3ZlQ29uZGl0aW9uSXRlbShjb25kaXRpb24sIHRydWUpXG4gICAgLnRoZW4oREIuZ2V0QWxsKVxuICAgIC50aGVuKFJlZnJlc2gucGFydCk7XG59XG5cbmZ1bmN0aW9uIHNob3dDbGVhcigpIHtcbiAgUmVmcmVzaC5jbGVhcigpOyAvLyBjbGVhciBub2RlcyB2aXN1YWxseVxuICBEQi5jbGVhcigpXG4gICAgLnRoZW4oUmVmcmVzaC5yYW5kb20pOyAvLyBjbGVhciBkYXRhIGluZGVlZFxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgYWRkLFxuICBlbnRlckFkZCxcbiAgY2xpY2tMaSxcbiAgcmVtb3ZlTGksXG4gIHNob3dJbml0LFxuICBzaG93QWxsLFxuICBzaG93RG9uZSxcbiAgc2hvd1RvZG8sXG4gIHNob3dDbGVhckRvbmUsXG4gIHNob3dDbGVhcixcbn07XG4iLCJpbXBvcnQgREIgZnJvbSAnaW5kZXhlZGRiLWNydWQnO1xuaW1wb3J0IEdlbmVyYWwgZnJvbSAnLi4vZGJHZW5lcmFsL3JlZnJlc2hHZW5lcmFsJztcblxuZnVuY3Rpb24gcmFuZG9tQXBob3Jpc20oKSB7XG4gIGNvbnN0IHN0b3JlTmFtZSA9ICdhcGhvcmlzbSc7XG4gIGNvbnN0IHJhbmRvbUluZGV4ID0gTWF0aC5jZWlsKE1hdGgucmFuZG9tKCkgKiBEQi5nZXRMZW5ndGgoc3RvcmVOYW1lKSk7XG5cbiAgREIuZ2V0SXRlbShyYW5kb21JbmRleCwgc3RvcmVOYW1lKVxuICAgIC50aGVuKF9wYXJzZVRleHQpO1xufVxuXG5mdW5jdGlvbiBfcGFyc2VUZXh0KGRhdGEpIHtcbiAgY29uc3QgdGV4dCA9IGRhdGEuY29udGVudDtcblxuICBHZW5lcmFsLnNlbnRlbmNlSGFuZGxlcih0ZXh0KTtcbn1cblxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGluaXQ6IEdlbmVyYWwuaW5pdCxcbiAgYWxsOiBHZW5lcmFsLmFsbC5iaW5kKG51bGwsIHJhbmRvbUFwaG9yaXNtKSwgLy8gUFVOQ0hMSU5FOiB1c2UgYmluZCB0byBwYXNzIHBhcmFtdGVyXG4gIHBhcnQ6IEdlbmVyYWwucGFydC5iaW5kKG51bGwsIHJhbmRvbUFwaG9yaXNtKSxcbiAgY2xlYXI6IEdlbmVyYWwuY2xlYXIsXG4gIHJhbmRvbTogcmFuZG9tQXBob3Jpc20sXG59O1xuIiwiZnVuY3Rpb24gZ2V0Rm9ybWF0RGF0ZShmbXQpIHtcbiAgY29uc3QgbmV3RGF0ZSA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IG8gPSB7XG4gICAgJ3krJzogbmV3RGF0ZS5nZXRGdWxsWWVhcigpLFxuICAgICdNKyc6IG5ld0RhdGUuZ2V0TW9udGgoKSArIDEsXG4gICAgJ2QrJzogbmV3RGF0ZS5nZXREYXRlKCksXG4gICAgJ2grJzogbmV3RGF0ZS5nZXRIb3VycygpLFxuICAgICdtKyc6IG5ld0RhdGUuZ2V0TWludXRlcygpLFxuICB9O1xuICBsZXQgbmV3Zm10ID0gZm10O1xuXG4gIE9iamVjdC5rZXlzKG8pLmZvckVhY2goKGspID0+IHtcbiAgICBpZiAobmV3IFJlZ0V4cChgKCR7a30pYCkudGVzdChuZXdmbXQpKSB7XG4gICAgICBpZiAoayA9PT0gJ3krJykge1xuICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChgJHtvW2tdfWApLnN1YnN0cig0IC0gUmVnRXhwLiQxLmxlbmd0aCkpO1xuICAgICAgfSBlbHNlIGlmIChrID09PSAnUysnKSB7XG4gICAgICAgIGxldCBsZW5zID0gUmVnRXhwLiQxLmxlbmd0aDtcbiAgICAgICAgbGVucyA9IGxlbnMgPT09IDEgPyAzIDogbGVucztcbiAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoYDAwJHtvW2tdfWApLnN1YnN0cigoYCR7b1trXX1gKS5sZW5ndGggLSAxLCBsZW5zKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChSZWdFeHAuJDEubGVuZ3RoID09PSAxKSA/IChvW2tdKSA6ICgoYDAwJHtvW2tdfWApLnN1YnN0cigoYCR7b1trXX1gKS5sZW5ndGgpKSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgLy8gZm9yIChjb25zdCBrIGluIG8pIHtcbiAgLy8gICBpZiAobmV3IFJlZ0V4cChgKCR7a30pYCkudGVzdChuZXdmbXQpKSB7XG4gIC8vICAgICBpZiAoayA9PT0gJ3krJykge1xuICAvLyAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChgJHtvW2tdfWApLnN1YnN0cig0IC0gUmVnRXhwLiQxLmxlbmd0aCkpO1xuICAvLyAgICAgfSBlbHNlIGlmIChrID09PSAnUysnKSB7XG4gIC8vICAgICAgIGxldCBsZW5zID0gUmVnRXhwLiQxLmxlbmd0aDtcbiAgLy8gICAgICAgbGVucyA9IGxlbnMgPT09IDEgPyAzIDogbGVucztcbiAgLy8gICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoYDAwJHtvW2tdfWApLnN1YnN0cigoYCR7b1trXX1gKS5sZW5ndGggLSAxLCBsZW5zKSk7XG4gIC8vICAgICB9IGVsc2Uge1xuICAvLyAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChSZWdFeHAuJDEubGVuZ3RoID09PSAxKSA/IChvW2tdKSA6ICgoYDAwJHtvW2tdfWApLnN1YnN0cigoYCR7b1trXX1gKS5sZW5ndGgpKSk7XG4gIC8vICAgICB9XG4gIC8vICAgfVxuICAvLyB9XG5cbiAgcmV0dXJuIG5ld2ZtdDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZ2V0Rm9ybWF0RGF0ZTtcbiIsImZ1bmN0aW9uIGxhenlMb2FkV2l0aG91dERCKCkge1xuICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG5cbiAgZWxlbWVudC50eXBlID0gJ3RleHQvamF2YXNjcmlwdCc7XG4gIGVsZW1lbnQuYXN5bmMgPSB0cnVlO1xuICBlbGVtZW50LnNyYyA9ICcuL2Rpc3Qvc2NyaXB0cy9sYXp5TG9hZC5taW4uanMnO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBsYXp5TG9hZFdpdGhvdXREQjtcbiIsImZ1bmN0aW9uIGl0ZW1HZW5lcmF0b3IoZGF0YUFycikge1xuICBjb25zdCB0ZW1wbGF0ZSA9IEhhbmRsZWJhcnMudGVtcGxhdGVzLmxpO1xuICBsZXQgcmVzdWx0ID0gZGF0YUFycjtcblxuICBpZiAoIUFycmF5LmlzQXJyYXkoZGF0YUFycikpIHtcbiAgICByZXN1bHQgPSBbZGF0YUFycl07XG4gIH1cbiAgY29uc3QgcmVuZGVyZWQgPSB0ZW1wbGF0ZSh7IGxpc3RJdGVtczogcmVzdWx0IH0pO1xuXG4gIHJldHVybiByZW5kZXJlZC50cmltKCk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGl0ZW1HZW5lcmF0b3I7XG4iLCJmdW5jdGlvbiBzZW50ZW5jZUdlbmVyYXRvcih0ZXh0KSB7XG4gIGNvbnN0IHRlbXBsYXRlID0gSGFuZGxlYmFycy50ZW1wbGF0ZXMubGk7XG4gIGNvbnN0IHJlbmRlcmVkID0gdGVtcGxhdGUoeyBzZW50ZW5jZTogdGV4dCB9KTtcblxuICByZXR1cm4gcmVuZGVyZWQudHJpbSgpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBzZW50ZW5jZUdlbmVyYXRvcjtcbiIsImZ1bmN0aW9uIHRlbXBsYXRlICgpIHtcbiAgdmFyIHRlbXBsYXRlID0gSGFuZGxlYmFycy50ZW1wbGF0ZSwgdGVtcGxhdGVzID0gSGFuZGxlYmFycy50ZW1wbGF0ZXMgPSBIYW5kbGViYXJzLnRlbXBsYXRlcyB8fCB7fTtcbnRlbXBsYXRlc1snbGknXSA9IHRlbXBsYXRlKHtcIjFcIjpmdW5jdGlvbihjb250YWluZXIsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICAgIHZhciBoZWxwZXI7XG5cbiAgcmV0dXJuIFwiICA8bGkgY2xhc3M9XFxcImFwaG9yaXNtXFxcIj5cIlxuICAgICsgY29udGFpbmVyLmVzY2FwZUV4cHJlc3Npb24oKChoZWxwZXIgPSAoaGVscGVyID0gaGVscGVycy5zZW50ZW5jZSB8fCAoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuc2VudGVuY2UgOiBkZXB0aDApKSAhPSBudWxsID8gaGVscGVyIDogaGVscGVycy5oZWxwZXJNaXNzaW5nKSwodHlwZW9mIGhlbHBlciA9PT0gXCJmdW5jdGlvblwiID8gaGVscGVyLmNhbGwoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAgOiAoY29udGFpbmVyLm51bGxDb250ZXh0IHx8IHt9KSx7XCJuYW1lXCI6XCJzZW50ZW5jZVwiLFwiaGFzaFwiOnt9LFwiZGF0YVwiOmRhdGF9KSA6IGhlbHBlcikpKVxuICAgICsgXCI8L2xpPlxcblwiO1xufSxcIjNcIjpmdW5jdGlvbihjb250YWluZXIsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICAgIHZhciBzdGFjazE7XG5cbiAgcmV0dXJuICgoc3RhY2sxID0gaGVscGVycy5lYWNoLmNhbGwoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAgOiAoY29udGFpbmVyLm51bGxDb250ZXh0IHx8IHt9KSwoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAubGlzdEl0ZW1zIDogZGVwdGgwKSx7XCJuYW1lXCI6XCJlYWNoXCIsXCJoYXNoXCI6e30sXCJmblwiOmNvbnRhaW5lci5wcm9ncmFtKDQsIGRhdGEsIDApLFwiaW52ZXJzZVwiOmNvbnRhaW5lci5ub29wLFwiZGF0YVwiOmRhdGF9KSkgIT0gbnVsbCA/IHN0YWNrMSA6IFwiXCIpO1xufSxcIjRcIjpmdW5jdGlvbihjb250YWluZXIsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICAgIHZhciBzdGFjazE7XG5cbiAgcmV0dXJuICgoc3RhY2sxID0gaGVscGVyc1tcImlmXCJdLmNhbGwoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAgOiAoY29udGFpbmVyLm51bGxDb250ZXh0IHx8IHt9KSwoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuZmluaXNoZWQgOiBkZXB0aDApLHtcIm5hbWVcIjpcImlmXCIsXCJoYXNoXCI6e30sXCJmblwiOmNvbnRhaW5lci5wcm9ncmFtKDUsIGRhdGEsIDApLFwiaW52ZXJzZVwiOmNvbnRhaW5lci5wcm9ncmFtKDcsIGRhdGEsIDApLFwiZGF0YVwiOmRhdGF9KSkgIT0gbnVsbCA/IHN0YWNrMSA6IFwiXCIpO1xufSxcIjVcIjpmdW5jdGlvbihjb250YWluZXIsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICAgIHZhciBoZWxwZXIsIGFsaWFzMT1kZXB0aDAgIT0gbnVsbCA/IGRlcHRoMCA6IChjb250YWluZXIubnVsbENvbnRleHQgfHwge30pLCBhbGlhczI9aGVscGVycy5oZWxwZXJNaXNzaW5nLCBhbGlhczM9XCJmdW5jdGlvblwiLCBhbGlhczQ9Y29udGFpbmVyLmVzY2FwZUV4cHJlc3Npb247XG5cbiAgcmV0dXJuIFwiICAgICAgPGxpIGNsYXNzPVxcXCJmaW5pc2hlZFxcXCIgZGF0YS1pZD1cIlxuICAgICsgYWxpYXM0KCgoaGVscGVyID0gKGhlbHBlciA9IGhlbHBlcnMuaWQgfHwgKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmlkIDogZGVwdGgwKSkgIT0gbnVsbCA/IGhlbHBlciA6IGFsaWFzMiksKHR5cGVvZiBoZWxwZXIgPT09IGFsaWFzMyA/IGhlbHBlci5jYWxsKGFsaWFzMSx7XCJuYW1lXCI6XCJpZFwiLFwiaGFzaFwiOnt9LFwiZGF0YVwiOmRhdGF9KSA6IGhlbHBlcikpKVxuICAgICsgXCI+XFxuICAgICAgICBcIlxuICAgICsgYWxpYXM0KCgoaGVscGVyID0gKGhlbHBlciA9IGhlbHBlcnMuZGF0ZSB8fCAoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuZGF0ZSA6IGRlcHRoMCkpICE9IG51bGwgPyBoZWxwZXIgOiBhbGlhczIpLCh0eXBlb2YgaGVscGVyID09PSBhbGlhczMgPyBoZWxwZXIuY2FsbChhbGlhczEse1wibmFtZVwiOlwiZGF0ZVwiLFwiaGFzaFwiOnt9LFwiZGF0YVwiOmRhdGF9KSA6IGhlbHBlcikpKVxuICAgICsgXCIgOiBcXG4gICAgICAgIDxzcGFuPlwiXG4gICAgKyBhbGlhczQoKChoZWxwZXIgPSAoaGVscGVyID0gaGVscGVycy5ldmVudCB8fCAoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuZXZlbnQgOiBkZXB0aDApKSAhPSBudWxsID8gaGVscGVyIDogYWxpYXMyKSwodHlwZW9mIGhlbHBlciA9PT0gYWxpYXMzID8gaGVscGVyLmNhbGwoYWxpYXMxLHtcIm5hbWVcIjpcImV2ZW50XCIsXCJoYXNoXCI6e30sXCJkYXRhXCI6ZGF0YX0pIDogaGVscGVyKSkpXG4gICAgKyBcIjwvc3Bhbj5cXG4gICAgICAgIDxzcGFuIGNsYXNzPVxcXCJjbG9zZVxcXCI+w5c8L3NwYW4+XFxuICAgICAgPC9saT5cXG5cIjtcbn0sXCI3XCI6ZnVuY3Rpb24oY29udGFpbmVyLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgICB2YXIgaGVscGVyLCBhbGlhczE9ZGVwdGgwICE9IG51bGwgPyBkZXB0aDAgOiAoY29udGFpbmVyLm51bGxDb250ZXh0IHx8IHt9KSwgYWxpYXMyPWhlbHBlcnMuaGVscGVyTWlzc2luZywgYWxpYXMzPVwiZnVuY3Rpb25cIiwgYWxpYXM0PWNvbnRhaW5lci5lc2NhcGVFeHByZXNzaW9uO1xuXG4gIHJldHVybiBcIiAgICAgIDxsaSBkYXRhLWlkPVwiXG4gICAgKyBhbGlhczQoKChoZWxwZXIgPSAoaGVscGVyID0gaGVscGVycy5pZCB8fCAoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuaWQgOiBkZXB0aDApKSAhPSBudWxsID8gaGVscGVyIDogYWxpYXMyKSwodHlwZW9mIGhlbHBlciA9PT0gYWxpYXMzID8gaGVscGVyLmNhbGwoYWxpYXMxLHtcIm5hbWVcIjpcImlkXCIsXCJoYXNoXCI6e30sXCJkYXRhXCI6ZGF0YX0pIDogaGVscGVyKSkpXG4gICAgKyBcIj5cXG4gICAgICAgIFwiXG4gICAgKyBhbGlhczQoKChoZWxwZXIgPSAoaGVscGVyID0gaGVscGVycy5kYXRlIHx8IChkZXB0aDAgIT0gbnVsbCA/IGRlcHRoMC5kYXRlIDogZGVwdGgwKSkgIT0gbnVsbCA/IGhlbHBlciA6IGFsaWFzMiksKHR5cGVvZiBoZWxwZXIgPT09IGFsaWFzMyA/IGhlbHBlci5jYWxsKGFsaWFzMSx7XCJuYW1lXCI6XCJkYXRlXCIsXCJoYXNoXCI6e30sXCJkYXRhXCI6ZGF0YX0pIDogaGVscGVyKSkpXG4gICAgKyBcIiA6IFxcbiAgICAgICAgPHNwYW4+XCJcbiAgICArIGFsaWFzNCgoKGhlbHBlciA9IChoZWxwZXIgPSBoZWxwZXJzLmV2ZW50IHx8IChkZXB0aDAgIT0gbnVsbCA/IGRlcHRoMC5ldmVudCA6IGRlcHRoMCkpICE9IG51bGwgPyBoZWxwZXIgOiBhbGlhczIpLCh0eXBlb2YgaGVscGVyID09PSBhbGlhczMgPyBoZWxwZXIuY2FsbChhbGlhczEse1wibmFtZVwiOlwiZXZlbnRcIixcImhhc2hcIjp7fSxcImRhdGFcIjpkYXRhfSkgOiBoZWxwZXIpKSlcbiAgICArIFwiPC9zcGFuPlxcbiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImNsb3NlXFxcIj7Dlzwvc3Bhbj5cXG4gICAgICA8L2xpPlxcblwiO1xufSxcImNvbXBpbGVyXCI6WzcsXCI+PSA0LjAuMFwiXSxcIm1haW5cIjpmdW5jdGlvbihjb250YWluZXIsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICAgIHZhciBzdGFjazE7XG5cbiAgcmV0dXJuICgoc3RhY2sxID0gaGVscGVyc1tcImlmXCJdLmNhbGwoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAgOiAoY29udGFpbmVyLm51bGxDb250ZXh0IHx8IHt9KSwoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuc2VudGVuY2UgOiBkZXB0aDApLHtcIm5hbWVcIjpcImlmXCIsXCJoYXNoXCI6e30sXCJmblwiOmNvbnRhaW5lci5wcm9ncmFtKDEsIGRhdGEsIDApLFwiaW52ZXJzZVwiOmNvbnRhaW5lci5wcm9ncmFtKDMsIGRhdGEsIDApLFwiZGF0YVwiOmRhdGF9KSkgIT0gbnVsbCA/IHN0YWNrMSA6IFwiXCIpO1xufSxcInVzZURhdGFcIjp0cnVlfSk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCB0ZW1wbGF0ZTtcbiJdfQ==
