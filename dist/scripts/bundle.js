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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _db = void 0;
var _defaultStoreName = void 0;
var _presentKey = {}; // store multi-objectStore's presentKey

function open(config) {
  return new Promise(function (resolve, reject) {

    if (window.indexedDB) {
      _openHandler(config, resolve);
    } else {
      _log2.default.fail('Your browser doesn\'t support a stable version of IndexedDB. You can install latest Chrome or FireFox to handler it');
      reject(error);
    }
  });
}

function _openHandler(config, successCallback) {
  var openRequest = window.indexedDB.open(config.name, config.version); // open indexedDB

  // an onblocked event is fired until they are closed or reloaded
  openRequest.onblocked = function () {
    // If some other tab is loaded with the database, then it needs to be closed before we can proceed.
    window.alert('Please close all other tabs with this site open');
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
      window.alert('A new version of this page is ready. Please reload');
    };
    _openSuccessCallbackHandler(config.storeConfig, successCallback);
  };

  // use error events bubble to handle all error events
  openRequest.onerror = function (_ref3) {
    var target = _ref3.target;

    window.alert('Something is wrong with indexedDB, for more information, checkout console');
    console.log(target.error);
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

  _presentKey[storeName] = 0;
  (0, _getAllRequest2.default)(transaction, storeName).onsuccess = function (_ref4) {
    var target = _ref4.target;

    var cursor = target.result;

    if (cursor) {
      _presentKey[storeName] = cursor.value.id;
      cursor.continue();
    }
  };
  transaction.oncomplete = function () {
    _log2.default.success('now ' + storeName + ' \'s max key is ' + _presentKey[storeName]); // initial value is 0
    if (successCallback) {
      successCallback();
      _log2.default.success('openSuccessCallback finished');
    }
  };
}

function _createObjectStoreHandler(configStoreConfig) {
  (0, _parseJSONData2.default)(configStoreConfig, 'storeName').forEach(function (storeConfig) {
    if (!_db.objectStoreNames.contains(storeConfig.storeName)) {
      _createObjectStore(storeConfig);
    }
  });
}

function _createObjectStore(storeConfig) {
  var store = _db.createObjectStore(storeConfig.storeName, { keyPath: storeConfig.key, autoIncrement: true });

  // Use transaction oncomplete to make sure the object Store creation is finished
  store.transaction.oncomplete = function () {
    _log2.default.success('create ' + storeConfig.storeName + ' \'s object store succeed');
    if (storeConfig.initialData) {
      // Store initial values in the newly created object store.
      _initialDataHandler(storeConfig.storeName, storeConfig.initialData);
    }
  };
}

function _initialDataHandler(storeName, initialData) {
  var transaction = _db.transaction([storeName], 'readwrite');
  var objectStore = transaction.objectStore(storeName);

  (0, _parseJSONData2.default)(initialData, 'initial').forEach(function (data, index) {
    var addRequest = objectStore.add(data);

    addRequest.onsuccess = function () {
      _log2.default.success('add initial data[' + index + '] successed');
    };
  });
  transaction.oncomplete = function () {
    _log2.default.success('add all ' + storeName + ' \'s initial data done');
    _getPresentKey(storeName);
  };
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

/* crud methods */

var getItem = function getItem(key) {
  var storeName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _defaultStoreName;
  return _crud2.default.get(_db, key, storeName);
};

var getWhetherConditionItem = function getWhetherConditionItem(condition, whether) {
  var storeName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _defaultStoreName;
  return _crud2.default.getWhetherCondition(_db, condition, whether, storeName);
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

var removeWhetherConditionItem = function removeWhetherConditionItem(condition, whether) {
  var storeName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _defaultStoreName;
  return _crud2.default.removeWhetherCondition(_db, condition, whether, storeName);
};

var clear = function clear() {
  var storeName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _defaultStoreName;
  return _crud2.default.clear(_db, storeName);
};

var updateItem = function updateItem(newData) {
  var storeName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _defaultStoreName;
  return _crud2.default.update(_db, newData, storeName);
};

exports.default = {
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
;

},{"./utlis/crud":2,"./utlis/getAllRequest":3,"./utlis/log":4,"./utlis/parseJSONData":5}],2:[function(require,module,exports){
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
function getWhetherCondition(dbValue, condition, whether, storeName) {
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

function removeWhetherCondition(dbValue, condition, whether, storeName) {
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

// update one
function update(dbValue, newData, storeName) {
  var transaction = dbValue.transaction([storeName], 'readwrite');
  var putRequest = transaction.objectStore(storeName).put(newData);
  var successMessage = 'update ' + storeName + '\'s ' + putRequest.source.keyPath + '  = ' + newData[putRequest.source.keyPath] + ' data success';

  return _promiseGenerator2.default.request(putRequest, successMessage, newData);
}

exports.default = {
  get: get,
  getWhetherCondition: getWhetherCondition,
  getAll: getAll,
  add: add,
  remove: remove,
  removeWhetherCondition: removeWhetherCondition,
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

    _indexeddbCrud2.default.getWhetherConditionItem(condition, whetherDone).then(_refresh2.default.part);
  }

  function showClearDone() {
    var condition = 'finished';

    _indexeddbCrud2.default.removeWhetherConditionItem(condition, true).then(_indexeddbCrud2.default.getAll).then(_refresh2.default.part);
  }

  function showClear() {
    _refresh2.default.clear(); // clear nodes visually
    _indexeddbCrud2.default.clear().then(_refresh2.default.random); // clear data indeed
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

var Refresh = function () {
  function randomAphorism() {
    var storeName = 'aphorism';
    var randomIndex = Math.ceil(Math.random() * _indexeddbCrud2.default.getLength(storeName));

    _indexeddbCrud2.default.getItem(randomIndex, storeName).then(_parseText);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5kZXhlZGRiLWNydWQvZGlzdC9pbmRleGVkZGItY3J1ZC5qcyIsIm5vZGVfbW9kdWxlcy9pbmRleGVkZGItY3J1ZC9kaXN0L3V0bGlzL2NydWQuanMiLCJub2RlX21vZHVsZXMvaW5kZXhlZGRiLWNydWQvZGlzdC91dGxpcy9nZXRBbGxSZXF1ZXN0LmpzIiwibm9kZV9tb2R1bGVzL2luZGV4ZWRkYi1jcnVkL2Rpc3QvdXRsaXMvbG9nLmpzIiwibm9kZV9tb2R1bGVzL2luZGV4ZWRkYi1jcnVkL2Rpc3QvdXRsaXMvcGFyc2VKU09ORGF0YS5qcyIsIm5vZGVfbW9kdWxlcy9pbmRleGVkZGItY3J1ZC9kaXN0L3V0bGlzL3Byb21pc2VHZW5lcmF0b3IuanMiLCJub2RlX21vZHVsZXMvaW5kZXhlZGRiLWNydWQvaW5kZXguanMiLCJzcmMvc2NyaXB0cy9kYi9jb25maWcuanMiLCJzcmMvc2NyaXB0cy9tYWluLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvY2xlYXJDaGlsZE5vZGVzLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJHZW5lcmFsL2FkZEV2ZW50c0dlbmVyYXRvci5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2RiR2VuZXJhbC9ldmVudHNIYW5kbGVyR2VuZXJhbC5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2RiR2VuZXJhbC9yZWZyZXNoR2VuZXJhbC5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2RiU3VjY2Vzcy9hZGRFdmVudHMuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYlN1Y2Nlc3MvZXZlbnRzSGFuZGxlci5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2RiU3VjY2Vzcy9yZWZyZXNoLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZ2V0Rm9ybWF0RGF0ZS5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2xhenlMb2FkV2l0aG91dERCLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvdGVtcGxldGUvaXRlbUdlbmVyYXRvci5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL3RlbXBsZXRlL3NlbnRlbmNlR2VuZXJhdG9yLmpzIiwic3JjL3RlbXBsZXRlL3RlbXBsYXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QXlCLEVBQXZFLEVBQTRFLFVBQVUsSUFBVixHQUFpQixPQUFPLFFBQXhCLEdBQW1DLE1BQS9HLEVBQXVILEVBQUMsUUFBTyxJQUFSLEVBQWEsUUFBTyxFQUFwQixFQUF1QixNQUFLLFVBQVUsT0FBVixDQUFrQixDQUFsQixFQUFxQixJQUFyQixFQUEyQixDQUEzQixDQUE1QixFQUEwRCxXQUFVLFVBQVUsT0FBVixDQUFrQixDQUFsQixFQUFxQixJQUFyQixFQUEyQixDQUEzQixDQUFwRSxFQUFrRyxRQUFPLElBQXpHLEVBQXZILENBQVYsS0FBcVAsSUFBclAsR0FBNFAsTUFBNVAsR0FBcVEsRUFBN1E7QUFDRCxLQXRDMEIsRUFzQ3pCLFdBQVUsSUF0Q2UsRUFBVCxDQUFsQjtBQXVDQzs7a0JBRWMsUSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9cmV0dXJuIGV9KSgpIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2xvZyA9IHJlcXVpcmUoJy4vdXRsaXMvbG9nJyk7XG5cbnZhciBfbG9nMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2xvZyk7XG5cbnZhciBfY3J1ZCA9IHJlcXVpcmUoJy4vdXRsaXMvY3J1ZCcpO1xuXG52YXIgX2NydWQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY3J1ZCk7XG5cbnZhciBfZ2V0QWxsUmVxdWVzdCA9IHJlcXVpcmUoJy4vdXRsaXMvZ2V0QWxsUmVxdWVzdCcpO1xuXG52YXIgX2dldEFsbFJlcXVlc3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZ2V0QWxsUmVxdWVzdCk7XG5cbnZhciBfcGFyc2VKU09ORGF0YSA9IHJlcXVpcmUoJy4vdXRsaXMvcGFyc2VKU09ORGF0YScpO1xuXG52YXIgX3BhcnNlSlNPTkRhdGEyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcGFyc2VKU09ORGF0YSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbnZhciBfZGIgPSB2b2lkIDA7XG52YXIgX2RlZmF1bHRTdG9yZU5hbWUgPSB2b2lkIDA7XG52YXIgX3ByZXNlbnRLZXkgPSB7fTsgLy8gc3RvcmUgbXVsdGktb2JqZWN0U3RvcmUncyBwcmVzZW50S2V5XG5cbmZ1bmN0aW9uIG9wZW4oY29uZmlnKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cbiAgICBpZiAod2luZG93LmluZGV4ZWREQikge1xuICAgICAgX29wZW5IYW5kbGVyKGNvbmZpZywgcmVzb2x2ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIF9sb2cyLmRlZmF1bHQuZmFpbCgnWW91ciBicm93c2VyIGRvZXNuXFwndCBzdXBwb3J0IGEgc3RhYmxlIHZlcnNpb24gb2YgSW5kZXhlZERCLiBZb3UgY2FuIGluc3RhbGwgbGF0ZXN0IENocm9tZSBvciBGaXJlRm94IHRvIGhhbmRsZXIgaXQnKTtcbiAgICAgIHJlamVjdChlcnJvcik7XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gX29wZW5IYW5kbGVyKGNvbmZpZywgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gIHZhciBvcGVuUmVxdWVzdCA9IHdpbmRvdy5pbmRleGVkREIub3Blbihjb25maWcubmFtZSwgY29uZmlnLnZlcnNpb24pOyAvLyBvcGVuIGluZGV4ZWREQlxuXG4gIC8vIGFuIG9uYmxvY2tlZCBldmVudCBpcyBmaXJlZCB1bnRpbCB0aGV5IGFyZSBjbG9zZWQgb3IgcmVsb2FkZWRcbiAgb3BlblJlcXVlc3Qub25ibG9ja2VkID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIElmIHNvbWUgb3RoZXIgdGFiIGlzIGxvYWRlZCB3aXRoIHRoZSBkYXRhYmFzZSwgdGhlbiBpdCBuZWVkcyB0byBiZSBjbG9zZWQgYmVmb3JlIHdlIGNhbiBwcm9jZWVkLlxuICAgIHdpbmRvdy5hbGVydCgnUGxlYXNlIGNsb3NlIGFsbCBvdGhlciB0YWJzIHdpdGggdGhpcyBzaXRlIG9wZW4nKTtcbiAgfTtcblxuICAvLyBDcmVhdGluZyBvciB1cGRhdGluZyB0aGUgdmVyc2lvbiBvZiB0aGUgZGF0YWJhc2VcbiAgb3BlblJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24gKF9yZWYpIHtcbiAgICB2YXIgdGFyZ2V0ID0gX3JlZi50YXJnZXQ7XG5cbiAgICAvLyBBbGwgb3RoZXIgZGF0YWJhc2VzIGhhdmUgYmVlbiBjbG9zZWQuIFNldCBldmVyeXRoaW5nIHVwLlxuICAgIF9kYiA9IHRhcmdldC5yZXN1bHQ7XG4gICAgX2xvZzIuZGVmYXVsdC5zdWNjZXNzKCdvbnVwZ3JhZGVuZWVkZWQgaW4nKTtcbiAgICBfY3JlYXRlT2JqZWN0U3RvcmVIYW5kbGVyKGNvbmZpZy5zdG9yZUNvbmZpZyk7XG4gIH07XG5cbiAgb3BlblJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gKF9yZWYyKSB7XG4gICAgdmFyIHRhcmdldCA9IF9yZWYyLnRhcmdldDtcblxuICAgIF9kYiA9IHRhcmdldC5yZXN1bHQ7XG4gICAgX2RiLm9udmVyc2lvbmNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIF9kYi5jbG9zZSgpO1xuICAgICAgd2luZG93LmFsZXJ0KCdBIG5ldyB2ZXJzaW9uIG9mIHRoaXMgcGFnZSBpcyByZWFkeS4gUGxlYXNlIHJlbG9hZCcpO1xuICAgIH07XG4gICAgX29wZW5TdWNjZXNzQ2FsbGJhY2tIYW5kbGVyKGNvbmZpZy5zdG9yZUNvbmZpZywgc3VjY2Vzc0NhbGxiYWNrKTtcbiAgfTtcblxuICAvLyB1c2UgZXJyb3IgZXZlbnRzIGJ1YmJsZSB0byBoYW5kbGUgYWxsIGVycm9yIGV2ZW50c1xuICBvcGVuUmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24gKF9yZWYzKSB7XG4gICAgdmFyIHRhcmdldCA9IF9yZWYzLnRhcmdldDtcblxuICAgIHdpbmRvdy5hbGVydCgnU29tZXRoaW5nIGlzIHdyb25nIHdpdGggaW5kZXhlZERCLCBmb3IgbW9yZSBpbmZvcm1hdGlvbiwgY2hlY2tvdXQgY29uc29sZScpO1xuICAgIGNvbnNvbGUubG9nKHRhcmdldC5lcnJvcik7XG4gICAgdGhyb3cgbmV3IEVycm9yKHRhcmdldC5lcnJvcik7XG4gIH07XG59XG5cbmZ1bmN0aW9uIF9vcGVuU3VjY2Vzc0NhbGxiYWNrSGFuZGxlcihjb25maWdTdG9yZUNvbmZpZywgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gIHZhciBvYmplY3RTdG9yZUxpc3QgPSAoMCwgX3BhcnNlSlNPTkRhdGEyLmRlZmF1bHQpKGNvbmZpZ1N0b3JlQ29uZmlnLCAnc3RvcmVOYW1lJyk7XG5cbiAgb2JqZWN0U3RvcmVMaXN0LmZvckVhY2goZnVuY3Rpb24gKHN0b3JlQ29uZmlnLCBpbmRleCkge1xuICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgX2RlZmF1bHRTdG9yZU5hbWUgPSBzdG9yZUNvbmZpZy5zdG9yZU5hbWU7IC8vIFBVTkNITElORTogdGhlIGxhc3Qgc3RvcmVOYW1lIGlzIGRlZmF1bHRTdG9yZU5hbWVcbiAgICB9XG4gICAgaWYgKGluZGV4ID09PSBvYmplY3RTdG9yZUxpc3QubGVuZ3RoIC0gMSkge1xuICAgICAgX2dldFByZXNlbnRLZXkoc3RvcmVDb25maWcuc3RvcmVOYW1lLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjaygpO1xuICAgICAgICBfbG9nMi5kZWZhdWx0LnN1Y2Nlc3MoJ29wZW4gaW5kZXhlZERCIHN1Y2Nlc3MnKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBfZ2V0UHJlc2VudEtleShzdG9yZUNvbmZpZy5zdG9yZU5hbWUpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8vIHNldCBwcmVzZW50IGtleSB2YWx1ZSB0byBfcHJlc2VudEtleSAodGhlIHByaXZhdGUgcHJvcGVydHkpXG5mdW5jdGlvbiBfZ2V0UHJlc2VudEtleShzdG9yZU5hbWUsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0pO1xuXG4gIF9wcmVzZW50S2V5W3N0b3JlTmFtZV0gPSAwO1xuICAoMCwgX2dldEFsbFJlcXVlc3QyLmRlZmF1bHQpKHRyYW5zYWN0aW9uLCBzdG9yZU5hbWUpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChfcmVmNCkge1xuICAgIHZhciB0YXJnZXQgPSBfcmVmNC50YXJnZXQ7XG5cbiAgICB2YXIgY3Vyc29yID0gdGFyZ2V0LnJlc3VsdDtcblxuICAgIGlmIChjdXJzb3IpIHtcbiAgICAgIF9wcmVzZW50S2V5W3N0b3JlTmFtZV0gPSBjdXJzb3IudmFsdWUuaWQ7XG4gICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICB9XG4gIH07XG4gIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgX2xvZzIuZGVmYXVsdC5zdWNjZXNzKCdub3cgJyArIHN0b3JlTmFtZSArICcgXFwncyBtYXgga2V5IGlzICcgKyBfcHJlc2VudEtleVtzdG9yZU5hbWVdKTsgLy8gaW5pdGlhbCB2YWx1ZSBpcyAwXG4gICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgc3VjY2Vzc0NhbGxiYWNrKCk7XG4gICAgICBfbG9nMi5kZWZhdWx0LnN1Y2Nlc3MoJ29wZW5TdWNjZXNzQ2FsbGJhY2sgZmluaXNoZWQnKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIF9jcmVhdGVPYmplY3RTdG9yZUhhbmRsZXIoY29uZmlnU3RvcmVDb25maWcpIHtcbiAgKDAsIF9wYXJzZUpTT05EYXRhMi5kZWZhdWx0KShjb25maWdTdG9yZUNvbmZpZywgJ3N0b3JlTmFtZScpLmZvckVhY2goZnVuY3Rpb24gKHN0b3JlQ29uZmlnKSB7XG4gICAgaWYgKCFfZGIub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucyhzdG9yZUNvbmZpZy5zdG9yZU5hbWUpKSB7XG4gICAgICBfY3JlYXRlT2JqZWN0U3RvcmUoc3RvcmVDb25maWcpO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIF9jcmVhdGVPYmplY3RTdG9yZShzdG9yZUNvbmZpZykge1xuICB2YXIgc3RvcmUgPSBfZGIuY3JlYXRlT2JqZWN0U3RvcmUoc3RvcmVDb25maWcuc3RvcmVOYW1lLCB7IGtleVBhdGg6IHN0b3JlQ29uZmlnLmtleSwgYXV0b0luY3JlbWVudDogdHJ1ZSB9KTtcblxuICAvLyBVc2UgdHJhbnNhY3Rpb24gb25jb21wbGV0ZSB0byBtYWtlIHN1cmUgdGhlIG9iamVjdCBTdG9yZSBjcmVhdGlvbiBpcyBmaW5pc2hlZFxuICBzdG9yZS50cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgIF9sb2cyLmRlZmF1bHQuc3VjY2VzcygnY3JlYXRlICcgKyBzdG9yZUNvbmZpZy5zdG9yZU5hbWUgKyAnIFxcJ3Mgb2JqZWN0IHN0b3JlIHN1Y2NlZWQnKTtcbiAgICBpZiAoc3RvcmVDb25maWcuaW5pdGlhbERhdGEpIHtcbiAgICAgIC8vIFN0b3JlIGluaXRpYWwgdmFsdWVzIGluIHRoZSBuZXdseSBjcmVhdGVkIG9iamVjdCBzdG9yZS5cbiAgICAgIF9pbml0aWFsRGF0YUhhbmRsZXIoc3RvcmVDb25maWcuc3RvcmVOYW1lLCBzdG9yZUNvbmZpZy5pbml0aWFsRGF0YSk7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBfaW5pdGlhbERhdGFIYW5kbGVyKHN0b3JlTmFtZSwgaW5pdGlhbERhdGEpIHtcbiAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdLCAncmVhZHdyaXRlJyk7XG4gIHZhciBvYmplY3RTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHN0b3JlTmFtZSk7XG5cbiAgKDAsIF9wYXJzZUpTT05EYXRhMi5kZWZhdWx0KShpbml0aWFsRGF0YSwgJ2luaXRpYWwnKS5mb3JFYWNoKGZ1bmN0aW9uIChkYXRhLCBpbmRleCkge1xuICAgIHZhciBhZGRSZXF1ZXN0ID0gb2JqZWN0U3RvcmUuYWRkKGRhdGEpO1xuXG4gICAgYWRkUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBfbG9nMi5kZWZhdWx0LnN1Y2Nlc3MoJ2FkZCBpbml0aWFsIGRhdGFbJyArIGluZGV4ICsgJ10gc3VjY2Vzc2VkJyk7XG4gICAgfTtcbiAgfSk7XG4gIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgX2xvZzIuZGVmYXVsdC5zdWNjZXNzKCdhZGQgYWxsICcgKyBzdG9yZU5hbWUgKyAnIFxcJ3MgaW5pdGlhbCBkYXRhIGRvbmUnKTtcbiAgICBfZ2V0UHJlc2VudEtleShzdG9yZU5hbWUpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBnZXRMZW5ndGgoKSB7XG4gIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuXG4gIHJldHVybiBfcHJlc2VudEtleVtzdG9yZU5hbWVdO1xufVxuXG5mdW5jdGlvbiBnZXROZXdLZXkoKSB7XG4gIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuXG4gIF9wcmVzZW50S2V5W3N0b3JlTmFtZV0gKz0gMTtcblxuICByZXR1cm4gX3ByZXNlbnRLZXlbc3RvcmVOYW1lXTtcbn1cblxuLyogY3J1ZCBtZXRob2RzICovXG5cbnZhciBnZXRJdGVtID0gZnVuY3Rpb24gZ2V0SXRlbShrZXkpIHtcbiAgdmFyIHN0b3JlTmFtZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogX2RlZmF1bHRTdG9yZU5hbWU7XG4gIHJldHVybiBfY3J1ZDIuZGVmYXVsdC5nZXQoX2RiLCBrZXksIHN0b3JlTmFtZSk7XG59O1xuXG52YXIgZ2V0V2hldGhlckNvbmRpdGlvbkl0ZW0gPSBmdW5jdGlvbiBnZXRXaGV0aGVyQ29uZGl0aW9uSXRlbShjb25kaXRpb24sIHdoZXRoZXIpIHtcbiAgdmFyIHN0b3JlTmFtZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDogX2RlZmF1bHRTdG9yZU5hbWU7XG4gIHJldHVybiBfY3J1ZDIuZGVmYXVsdC5nZXRXaGV0aGVyQ29uZGl0aW9uKF9kYiwgY29uZGl0aW9uLCB3aGV0aGVyLCBzdG9yZU5hbWUpO1xufTtcblxudmFyIGdldEFsbCA9IGZ1bmN0aW9uIGdldEFsbCgpIHtcbiAgdmFyIHN0b3JlTmFtZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogX2RlZmF1bHRTdG9yZU5hbWU7XG4gIHJldHVybiBfY3J1ZDIuZGVmYXVsdC5nZXRBbGwoX2RiLCBzdG9yZU5hbWUpO1xufTtcblxudmFyIGFkZEl0ZW0gPSBmdW5jdGlvbiBhZGRJdGVtKG5ld0RhdGEpIHtcbiAgdmFyIHN0b3JlTmFtZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogX2RlZmF1bHRTdG9yZU5hbWU7XG4gIHJldHVybiBfY3J1ZDIuZGVmYXVsdC5hZGQoX2RiLCBuZXdEYXRhLCBzdG9yZU5hbWUpO1xufTtcblxudmFyIHJlbW92ZUl0ZW0gPSBmdW5jdGlvbiByZW1vdmVJdGVtKGtleSkge1xuICB2YXIgc3RvcmVOYW1lID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiBfZGVmYXVsdFN0b3JlTmFtZTtcbiAgcmV0dXJuIF9jcnVkMi5kZWZhdWx0LnJlbW92ZShfZGIsIGtleSwgc3RvcmVOYW1lKTtcbn07XG5cbnZhciByZW1vdmVXaGV0aGVyQ29uZGl0aW9uSXRlbSA9IGZ1bmN0aW9uIHJlbW92ZVdoZXRoZXJDb25kaXRpb25JdGVtKGNvbmRpdGlvbiwgd2hldGhlcikge1xuICB2YXIgc3RvcmVOYW1lID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiBfZGVmYXVsdFN0b3JlTmFtZTtcbiAgcmV0dXJuIF9jcnVkMi5kZWZhdWx0LnJlbW92ZVdoZXRoZXJDb25kaXRpb24oX2RiLCBjb25kaXRpb24sIHdoZXRoZXIsIHN0b3JlTmFtZSk7XG59O1xuXG52YXIgY2xlYXIgPSBmdW5jdGlvbiBjbGVhcigpIHtcbiAgdmFyIHN0b3JlTmFtZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogX2RlZmF1bHRTdG9yZU5hbWU7XG4gIHJldHVybiBfY3J1ZDIuZGVmYXVsdC5jbGVhcihfZGIsIHN0b3JlTmFtZSk7XG59O1xuXG52YXIgdXBkYXRlSXRlbSA9IGZ1bmN0aW9uIHVwZGF0ZUl0ZW0obmV3RGF0YSkge1xuICB2YXIgc3RvcmVOYW1lID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiBfZGVmYXVsdFN0b3JlTmFtZTtcbiAgcmV0dXJuIF9jcnVkMi5kZWZhdWx0LnVwZGF0ZShfZGIsIG5ld0RhdGEsIHN0b3JlTmFtZSk7XG59O1xuXG5leHBvcnRzLmRlZmF1bHQgPSB7XG4gIG9wZW46IG9wZW4sXG4gIGdldExlbmd0aDogZ2V0TGVuZ3RoLFxuICBnZXROZXdLZXk6IGdldE5ld0tleSxcbiAgZ2V0SXRlbTogZ2V0SXRlbSxcbiAgZ2V0V2hldGhlckNvbmRpdGlvbkl0ZW06IGdldFdoZXRoZXJDb25kaXRpb25JdGVtLFxuICBnZXRBbGw6IGdldEFsbCxcbiAgYWRkSXRlbTogYWRkSXRlbSxcbiAgcmVtb3ZlSXRlbTogcmVtb3ZlSXRlbSxcbiAgcmVtb3ZlV2hldGhlckNvbmRpdGlvbkl0ZW06IHJlbW92ZVdoZXRoZXJDb25kaXRpb25JdGVtLFxuICBjbGVhcjogY2xlYXIsXG4gIHVwZGF0ZUl0ZW06IHVwZGF0ZUl0ZW1cbn07XG47XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleGVkZGItY3J1ZC5qcy5tYXAiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfcHJvbWlzZUdlbmVyYXRvciA9IHJlcXVpcmUoJy4vcHJvbWlzZUdlbmVyYXRvcicpO1xuXG52YXIgX3Byb21pc2VHZW5lcmF0b3IyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcHJvbWlzZUdlbmVyYXRvcik7XG5cbnZhciBfZ2V0QWxsUmVxdWVzdCA9IHJlcXVpcmUoJy4vZ2V0QWxsUmVxdWVzdCcpO1xuXG52YXIgX2dldEFsbFJlcXVlc3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZ2V0QWxsUmVxdWVzdCk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIGdldChkYlZhbHVlLCBrZXksIHN0b3JlTmFtZSkge1xuICB2YXIgdHJhbnNhY3Rpb24gPSBkYlZhbHVlLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdKTtcbiAgdmFyIGdldFJlcXVlc3QgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpLmdldChwYXJzZUludChrZXksIDEwKSk7IC8vIGdldCBpdCBieSBpbmRleFxuICB2YXIgc3VjY2Vzc01lc3NhZ2UgPSAnZ2V0ICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgZ2V0UmVxdWVzdC5zb3VyY2Uua2V5UGF0aCArICcgPSAnICsga2V5ICsgJyBkYXRhIHN1Y2Nlc3MnO1xuICB2YXIgZGF0YSA9IHsgcHJvcGVydHk6ICdyZXN1bHQnIH07XG5cbiAgcmV0dXJuIF9wcm9taXNlR2VuZXJhdG9yMi5kZWZhdWx0LnJlcXVlc3QoZ2V0UmVxdWVzdCwgc3VjY2Vzc01lc3NhZ2UsIGRhdGEpO1xufVxuXG4vLyBnZXQgY29uZGl0aW9uYWwgZGF0YSAoYm9vbGVhbiBjb25kaXRpb24pXG5mdW5jdGlvbiBnZXRXaGV0aGVyQ29uZGl0aW9uKGRiVmFsdWUsIGNvbmRpdGlvbiwgd2hldGhlciwgc3RvcmVOYW1lKSB7XG4gIHZhciB0cmFuc2FjdGlvbiA9IGRiVmFsdWUudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0pO1xuICB2YXIgcmVzdWx0ID0gW107IC8vIHVzZSBhbiBhcnJheSB0byBzdG9yYWdlIGVsaWdpYmxlIGRhdGFcbiAgdmFyIHN1Y2Nlc3NNZXNzYWdlID0gJ2dldCAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgJyArIGNvbmRpdGlvbiArICcgPSAnICsgd2hldGhlciArICcgZGF0YSBzdWNjZXNzJztcblxuICAoMCwgX2dldEFsbFJlcXVlc3QyLmRlZmF1bHQpKHRyYW5zYWN0aW9uLCBzdG9yZU5hbWUpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChfcmVmKSB7XG4gICAgdmFyIHRhcmdldCA9IF9yZWYudGFyZ2V0O1xuXG4gICAgdmFyIGN1cnNvciA9IHRhcmdldC5yZXN1bHQ7XG5cbiAgICBpZiAoY3Vyc29yKSB7XG4gICAgICBpZiAoY3Vyc29yLnZhbHVlW2NvbmRpdGlvbl0gPT09IHdoZXRoZXIpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goY3Vyc29yLnZhbHVlKTtcbiAgICAgIH1cbiAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gX3Byb21pc2VHZW5lcmF0b3IyLmRlZmF1bHQudHJhbnNhY3Rpb24odHJhbnNhY3Rpb24sIHN1Y2Nlc3NNZXNzYWdlLCByZXN1bHQpO1xufVxuXG5mdW5jdGlvbiBnZXRBbGwoZGJWYWx1ZSwgc3RvcmVOYW1lKSB7XG4gIHZhciB0cmFuc2FjdGlvbiA9IGRiVmFsdWUudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0pO1xuICB2YXIgcmVzdWx0ID0gW107XG4gIHZhciBzdWNjZXNzTWVzc2FnZSA9ICdnZXQgJyArIHN0b3JlTmFtZSArICdcXCdzIGFsbCBkYXRhIHN1Y2Nlc3MnO1xuXG4gICgwLCBfZ2V0QWxsUmVxdWVzdDIuZGVmYXVsdCkodHJhbnNhY3Rpb24sIHN0b3JlTmFtZSkub25zdWNjZXNzID0gZnVuY3Rpb24gKF9yZWYyKSB7XG4gICAgdmFyIHRhcmdldCA9IF9yZWYyLnRhcmdldDtcblxuICAgIHZhciBjdXJzb3IgPSB0YXJnZXQucmVzdWx0O1xuXG4gICAgaWYgKGN1cnNvcikge1xuICAgICAgcmVzdWx0LnB1c2goY3Vyc29yLnZhbHVlKTtcbiAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gX3Byb21pc2VHZW5lcmF0b3IyLmRlZmF1bHQudHJhbnNhY3Rpb24odHJhbnNhY3Rpb24sIHN1Y2Nlc3NNZXNzYWdlLCByZXN1bHQpO1xufVxuXG5mdW5jdGlvbiBhZGQoZGJWYWx1ZSwgbmV3RGF0YSwgc3RvcmVOYW1lKSB7XG4gIHZhciB0cmFuc2FjdGlvbiA9IGRiVmFsdWUudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcbiAgdmFyIGFkZFJlcXVlc3QgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpLmFkZChuZXdEYXRhKTtcbiAgdmFyIHN1Y2Nlc3NNZXNzYWdlID0gJ2FkZCAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgJyArIGFkZFJlcXVlc3Quc291cmNlLmtleVBhdGggKyAnICA9ICcgKyBuZXdEYXRhW2FkZFJlcXVlc3Quc291cmNlLmtleVBhdGhdICsgJyBkYXRhIHN1Y2NlZWQnO1xuXG4gIHJldHVybiBfcHJvbWlzZUdlbmVyYXRvcjIuZGVmYXVsdC5yZXF1ZXN0KGFkZFJlcXVlc3QsIHN1Y2Nlc3NNZXNzYWdlLCBuZXdEYXRhKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlKGRiVmFsdWUsIGtleSwgc3RvcmVOYW1lKSB7XG4gIHZhciB0cmFuc2FjdGlvbiA9IGRiVmFsdWUudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcbiAgdmFyIGRlbGV0ZVJlcXVlc3QgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpLmRlbGV0ZShrZXkpO1xuICB2YXIgc3VjY2Vzc01lc3NhZ2UgPSAncmVtb3ZlICcgKyBzdG9yZU5hbWUgKyAnXFwncyAgJyArIGRlbGV0ZVJlcXVlc3Quc291cmNlLmtleVBhdGggKyAnID0gJyArIGtleSArICcgZGF0YSBzdWNjZXNzJztcblxuICByZXR1cm4gX3Byb21pc2VHZW5lcmF0b3IyLmRlZmF1bHQucmVxdWVzdChkZWxldGVSZXF1ZXN0LCBzdWNjZXNzTWVzc2FnZSwga2V5KTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlV2hldGhlckNvbmRpdGlvbihkYlZhbHVlLCBjb25kaXRpb24sIHdoZXRoZXIsIHN0b3JlTmFtZSkge1xuICB2YXIgdHJhbnNhY3Rpb24gPSBkYlZhbHVlLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdLCAncmVhZHdyaXRlJyk7XG4gIHZhciBzdWNjZXNzTWVzc2FnZSA9ICdyZW1vdmUgJyArIHN0b3JlTmFtZSArICdcXCdzICcgKyBjb25kaXRpb24gKyAnID0gJyArIHdoZXRoZXIgKyAnIGRhdGEgc3VjY2Vzcyc7XG5cbiAgKDAsIF9nZXRBbGxSZXF1ZXN0Mi5kZWZhdWx0KSh0cmFuc2FjdGlvbiwgc3RvcmVOYW1lKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoX3JlZjMpIHtcbiAgICB2YXIgdGFyZ2V0ID0gX3JlZjMudGFyZ2V0O1xuXG4gICAgdmFyIGN1cnNvciA9IHRhcmdldC5yZXN1bHQ7XG5cbiAgICBpZiAoY3Vyc29yKSB7XG4gICAgICBpZiAoY3Vyc29yLnZhbHVlW2NvbmRpdGlvbl0gPT09IHdoZXRoZXIpIHtcbiAgICAgICAgY3Vyc29yLmRlbGV0ZSgpO1xuICAgICAgfVxuICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBfcHJvbWlzZUdlbmVyYXRvcjIuZGVmYXVsdC50cmFuc2FjdGlvbih0cmFuc2FjdGlvbiwgc3VjY2Vzc01lc3NhZ2UpO1xufVxuXG5mdW5jdGlvbiBjbGVhcihkYlZhbHVlLCBzdG9yZU5hbWUpIHtcbiAgdmFyIHRyYW5zYWN0aW9uID0gZGJWYWx1ZS50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuICB2YXIgc3VjY2Vzc01lc3NhZ2UgPSAnY2xlYXIgJyArIHN0b3JlTmFtZSArICdcXCdzIGFsbCBkYXRhIHN1Y2Nlc3MnO1xuXG4gICgwLCBfZ2V0QWxsUmVxdWVzdDIuZGVmYXVsdCkodHJhbnNhY3Rpb24sIHN0b3JlTmFtZSkub25zdWNjZXNzID0gZnVuY3Rpb24gKF9yZWY0KSB7XG4gICAgdmFyIHRhcmdldCA9IF9yZWY0LnRhcmdldDtcblxuICAgIHZhciBjdXJzb3IgPSB0YXJnZXQucmVzdWx0O1xuXG4gICAgaWYgKGN1cnNvcikge1xuICAgICAgY3Vyc29yLmRlbGV0ZSgpO1xuICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBfcHJvbWlzZUdlbmVyYXRvcjIuZGVmYXVsdC50cmFuc2FjdGlvbih0cmFuc2FjdGlvbiwgc3VjY2Vzc01lc3NhZ2UpO1xufVxuXG4vLyB1cGRhdGUgb25lXG5mdW5jdGlvbiB1cGRhdGUoZGJWYWx1ZSwgbmV3RGF0YSwgc3RvcmVOYW1lKSB7XG4gIHZhciB0cmFuc2FjdGlvbiA9IGRiVmFsdWUudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcbiAgdmFyIHB1dFJlcXVlc3QgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpLnB1dChuZXdEYXRhKTtcbiAgdmFyIHN1Y2Nlc3NNZXNzYWdlID0gJ3VwZGF0ZSAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgJyArIHB1dFJlcXVlc3Quc291cmNlLmtleVBhdGggKyAnICA9ICcgKyBuZXdEYXRhW3B1dFJlcXVlc3Quc291cmNlLmtleVBhdGhdICsgJyBkYXRhIHN1Y2Nlc3MnO1xuXG4gIHJldHVybiBfcHJvbWlzZUdlbmVyYXRvcjIuZGVmYXVsdC5yZXF1ZXN0KHB1dFJlcXVlc3QsIHN1Y2Nlc3NNZXNzYWdlLCBuZXdEYXRhKTtcbn1cblxuZXhwb3J0cy5kZWZhdWx0ID0ge1xuICBnZXQ6IGdldCxcbiAgZ2V0V2hldGhlckNvbmRpdGlvbjogZ2V0V2hldGhlckNvbmRpdGlvbixcbiAgZ2V0QWxsOiBnZXRBbGwsXG4gIGFkZDogYWRkLFxuICByZW1vdmU6IHJlbW92ZSxcbiAgcmVtb3ZlV2hldGhlckNvbmRpdGlvbjogcmVtb3ZlV2hldGhlckNvbmRpdGlvbixcbiAgY2xlYXI6IGNsZWFyLFxuICB1cGRhdGU6IHVwZGF0ZVxufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWNydWQuanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xudmFyIGdldEFsbFJlcXVlc3QgPSBmdW5jdGlvbiBnZXRBbGxSZXF1ZXN0KHRyYW5zYWN0aW9uLCBzdG9yZU5hbWUpIHtcbiAgcmV0dXJuIHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHN0b3JlTmFtZSkub3BlbkN1cnNvcihJREJLZXlSYW5nZS5sb3dlckJvdW5kKDEpLCAnbmV4dCcpO1xufTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gZ2V0QWxsUmVxdWVzdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWdldEFsbFJlcXVlc3QuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG52YXIgbG9nID0ge1xuICBzdWNjZXNzOiBmdW5jdGlvbiBzdWNjZXNzKG1lc3NhZ2UpIHtcbiAgICBjb25zb2xlLmxvZyhcIlxcdTI3MTMgXCIgKyBtZXNzYWdlICsgXCIgOilcIik7XG4gIH0sXG4gIGZhaWw6IGZ1bmN0aW9uIGZhaWwobWVzc2FnZSkge1xuICAgIGNvbnNvbGUubG9nKFwiXFx1MjcxNCBcIiArIG1lc3NhZ2UpO1xuICB9XG59O1xuXG5leHBvcnRzLmRlZmF1bHQgPSBsb2c7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1sb2cuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG52YXIgcGFyc2VKU09ORGF0YSA9IGZ1bmN0aW9uIHBhcnNlSlNPTkRhdGEocmF3ZGF0YSwgbmFtZSkge1xuICB0cnkge1xuICAgIHZhciBwYXJzZWREYXRhID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShyYXdkYXRhKSk7XG5cbiAgICByZXR1cm4gcGFyc2VkRGF0YTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB3aW5kb3cuYWxlcnQoXCJwbGVhc2Ugc2V0IGNvcnJlY3QgXCIgKyBuYW1lICsgXCIgYXJyYXkgb2JqZWN0XCIpO1xuICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gcGFyc2VKU09ORGF0YTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXBhcnNlSlNPTkRhdGEuanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2xvZyA9IHJlcXVpcmUoJy4vbG9nJyk7XG5cbnZhciBfbG9nMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2xvZyk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbnZhciByZXF1ZXN0UHJvbWlzZSA9IGZ1bmN0aW9uIHJlcXVlc3RQcm9taXNlKHJlcXVlc3QsIHN1Y2Nlc3NNZXNzYWdlLCBkYXRhKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc3VjY2Vzc0RhdGEgPSBkYXRhO1xuXG4gICAgICBpZiAoZGF0YS5wcm9wZXJ0eSkge1xuICAgICAgICBzdWNjZXNzRGF0YSA9IHJlcXVlc3RbZGF0YS5wcm9wZXJ0eV07IC8vIGZvciBnZXRJdGVtXG4gICAgICB9XG4gICAgICBfbG9nMi5kZWZhdWx0LnN1Y2Nlc3Moc3VjY2Vzc01lc3NhZ2UpO1xuICAgICAgcmVzb2x2ZShzdWNjZXNzRGF0YSk7XG4gICAgfTtcbiAgICByZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBfbG9nMi5kZWZhdWx0LmZhaWwocmVxdWVzdC5lcnJvcik7XG4gICAgICByZWplY3QoKTtcbiAgICB9O1xuICB9KTtcbn07XG5cbnZhciB0cmFuc2FjdGlvblByb21pc2UgPSBmdW5jdGlvbiB0cmFuc2FjdGlvblByb21pc2UodHJhbnNhY3Rpb24sIHN1Y2Nlc3NNZXNzYWdlLCBkYXRhKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIF9sb2cyLmRlZmF1bHQuc3VjY2VzcyhzdWNjZXNzTWVzc2FnZSk7XG4gICAgICByZXNvbHZlKGRhdGEpO1xuICAgIH07XG4gICAgdHJhbnNhY3Rpb24ub25lcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIF9sb2cyLmRlZmF1bHQuZmFpbCh0cmFuc2FjdGlvbi5lcnJvcik7XG4gICAgICByZWplY3QoKTtcbiAgICB9O1xuICB9KTtcbn07XG5cbmV4cG9ydHMuZGVmYXVsdCA9IHtcbiAgcmVxdWVzdDogcmVxdWVzdFByb21pc2UsXG4gIHRyYW5zYWN0aW9uOiB0cmFuc2FjdGlvblByb21pc2Vcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wcm9taXNlR2VuZXJhdG9yLmpzLm1hcCIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9kaXN0L2luZGV4ZWRkYi1jcnVkJylbJ2RlZmF1bHQnXTtcbiIsImV4cG9ydCBkZWZhdWx0IHtcbiAgbmFtZTogJ0p1c3RUb0RvJyxcbiAgdmVyc2lvbjogJzIzJyxcbiAgc3RvcmVDb25maWc6IFtcbiAgICB7XG4gICAgICBzdG9yZU5hbWU6ICdsaXN0JyxcbiAgICAgIGtleTogJ2lkJyxcbiAgICAgIGluaXRpYWxEYXRhOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogMCwgZXZlbnQ6ICdKdXN0RGVtbycsIGZpbmlzaGVkOiB0cnVlLCBkYXRlOiAwLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHN0b3JlTmFtZTogJ2FwaG9yaXNtJyxcbiAgICAgIGtleTogJ2lkJyxcbiAgICAgIGluaXRpYWxEYXRhOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogMSxcbiAgICAgICAgICBjb250ZW50OiBcIllvdSdyZSBiZXR0ZXIgdGhhbiB0aGF0XCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogMixcbiAgICAgICAgICBjb250ZW50OiAnWWVzdGVyZGF5IFlvdSBTYWlkIFRvbW9ycm93JyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAzLFxuICAgICAgICAgIGNvbnRlbnQ6ICdXaHkgYXJlIHdlIGhlcmU/JyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiA0LFxuICAgICAgICAgIGNvbnRlbnQ6ICdBbGwgaW4sIG9yIG5vdGhpbmcnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IDUsXG4gICAgICAgICAgY29udGVudDogJ1lvdSBOZXZlciBUcnksIFlvdSBOZXZlciBLbm93JyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiA2LFxuICAgICAgICAgIGNvbnRlbnQ6ICdUaGUgdW5leGFtaW5lZCBsaWZlIGlzIG5vdCB3b3J0aCBsaXZpbmcuIC0tIFNvY3JhdGVzJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiA3LFxuICAgICAgICAgIGNvbnRlbnQ6ICdUaGVyZSBpcyBvbmx5IG9uZSB0aGluZyB3ZSBzYXkgdG8gbGF6eTogTk9UIFRPREFZJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgXSxcbn07XG4iLCJpbXBvcnQgeyBvcGVuIGFzIG9wZW5EQiB9IGZyb20gJ2luZGV4ZWRkYi1jcnVkJztcbmltcG9ydCBjb25maWcgZnJvbSAnLi9kYi9jb25maWcnO1xuaW1wb3J0IHRlbXBsZXRlIGZyb20gJy4uL3RlbXBsZXRlL3RlbXBsYXRlJztcbmltcG9ydCBhZGRFdmVudHMgZnJvbSAnLi91dGxpcy9kYlN1Y2Nlc3MvYWRkRXZlbnRzJztcbmltcG9ydCBsYXp5TG9hZFdpdGhvdXREQiBmcm9tICcuL3V0bGlzL2xhenlMb2FkV2l0aG91dERCJztcblxuXG50ZW1wbGV0ZSgpO1xuLy8gb3BlbiBEQiwgYW5kIHdoZW4gREIgb3BlbiBzdWNjZWVkLCBpbnZva2UgaW5pdGlhbCBmdW5jdGlvblxub3BlbkRCKGNvbmZpZylcbiAgLnRoZW4oYWRkRXZlbnRzKVxuICAuY2F0Y2gobGF6eUxvYWRXaXRob3V0REIpO1xuIiwiZnVuY3Rpb24gY2xlYXJDaGlsZE5vZGVzKHJvb3QpIHtcbiAgd2hpbGUgKHJvb3QuaGFzQ2hpbGROb2RlcygpKSB7IC8vIG9yIHJvb3QuZmlyc3RDaGlsZCBvciByb290Lmxhc3RDaGlsZFxuICAgIHJvb3QucmVtb3ZlQ2hpbGQocm9vdC5maXJzdENoaWxkKTtcbiAgfVxuICAvLyBvciByb290LmlubmVySFRNTCA9ICcnXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsZWFyQ2hpbGROb2RlcztcbiIsImZ1bmN0aW9uIGFkZEV2ZW50c0dlbmVyYXRvcihoYW5kbGVyKSB7XG4gIGhhbmRsZXIuc2hvd0luaXQoKTtcbiAgLy8gYWRkIGFsbCBldmVudExpc3RlbmVyXG4gIGNvbnN0IGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gIGxpc3QuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLmNsaWNrTGksIGZhbHNlKTtcbiAgbGlzdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIucmVtb3ZlTGksIGZhbHNlKTtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZXIuZW50ZXJBZGQsIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FkZCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5hZGQsIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dEb25lJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dEb25lLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93VG9kbycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93VG9kbywgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0FsbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93QWxsLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93Q2xlYXJEb25lJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dDbGVhckRvbmUsIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dDbGVhcicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93Q2xlYXIsIGZhbHNlKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYWRkRXZlbnRzR2VuZXJhdG9yO1xuIiwiaW1wb3J0IGdldEZvcm1hdERhdGUgZnJvbSAnLi4vZ2V0Rm9ybWF0RGF0ZSc7XG5cbmNvbnN0IGV2ZW50c0hhbmRsZXJHZW5lcmFsID0gKCgpID0+IHtcbiAgZnVuY3Rpb24gcmVzZXRJbnB1dCgpIHtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5wdXQnKS52YWx1ZSA9ICcnO1xuICB9XG5cbiAgZnVuY3Rpb24gZGF0YUdlbmVyYXRvcihrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiBrZXksXG4gICAgICBldmVudDogdmFsdWUsXG4gICAgICBmaW5pc2hlZDogZmFsc2UsXG4gICAgICBkYXRlOiBnZXRGb3JtYXREYXRlKCdNTeaciGRk5pelaGg6bW0nKSxcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICByZXNldElucHV0LFxuICAgIGRhdGFHZW5lcmF0b3IsXG4gIH07XG59KSgpO1xuXG5leHBvcnQgZGVmYXVsdCBldmVudHNIYW5kbGVyR2VuZXJhbDtcbiIsImltcG9ydCBpdGVtR2VuZXJhdG9yIGZyb20gJy4uL3RlbXBsZXRlL2l0ZW1HZW5lcmF0b3InO1xuaW1wb3J0IHNlbnRlbmNlR2VuZXJhdG9yIGZyb20gJy4uL3RlbXBsZXRlL3NlbnRlbmNlR2VuZXJhdG9yJztcbmltcG9ydCBjbGVhckNoaWxkTm9kZXMgZnJvbSAnLi4vY2xlYXJDaGlsZE5vZGVzJztcblxuY29uc3QgcmVmcmVzaEdlbmVyYWwgPSAoKCkgPT4ge1xuICBmdW5jdGlvbiBpbml0KGRhdGFBcnIpIHtcbiAgICBfc2hvdyhkYXRhQXJyLCBfaW5pdFNlbnRlbmNlLCBfcmVuZGVyQWxsKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zaG93KGRhdGFBcnIsIHNob3dTZW50ZW5jZUZ1bmMsIGdlbmVyYXRlRnVuYykge1xuICAgIGlmICghZGF0YUFyciB8fCBkYXRhQXJyLmxlbmd0aCA9PT0gMCkge1xuICAgICAgc2hvd1NlbnRlbmNlRnVuYygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmlubmVySFRNTCA9IGdlbmVyYXRlRnVuYyhkYXRhQXJyKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfaW5pdFNlbnRlbmNlKCkge1xuICAgIGNvbnN0IHRleHQgPSAnV2VsY29tZX4sIHRyeSB0byBhZGQgeW91ciBmaXJzdCB0by1kbyBsaXN0IDogKSc7XG5cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmlubmVySFRNTCA9IHNlbnRlbmNlR2VuZXJhdG9yKHRleHQpO1xuICB9XG5cbiAgZnVuY3Rpb24gYWxsKHJhbmRvbUFwaG9yaXNtLCBkYXRhQXJyKSB7XG4gICAgX3Nob3coZGF0YUFyciwgcmFuZG9tQXBob3Jpc20sIF9yZW5kZXJBbGwpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3JlbmRlckFsbChkYXRhQXJyKSB7XG4gICAgY29uc3QgY2xhc3NpZmllZERhdGEgPSBfY2xhc3NpZnlEYXRhKGRhdGFBcnIpO1xuXG4gICAgcmV0dXJuIGl0ZW1HZW5lcmF0b3IoY2xhc3NpZmllZERhdGEpO1xuICB9XG5cbiAgZnVuY3Rpb24gX2NsYXNzaWZ5RGF0YShkYXRhQXJyKSB7XG4gICAgY29uc3QgZmluaXNoZWQgPSBbXTtcbiAgICBjb25zdCB1bmZpc2hpZWQgPSBbXTtcblxuICAgIC8vIHB1dCB0aGUgZmluaXNoZWQgaXRlbSB0byB0aGUgYm90dG9tXG4gICAgZGF0YUFyci5mb3JFYWNoKGRhdGEgPT4gKGRhdGEuZmluaXNoZWQgPyBmaW5pc2hlZC51bnNoaWZ0KGRhdGEpIDogdW5maXNoaWVkLnVuc2hpZnQoZGF0YSkpKTtcblxuICAgIHJldHVybiB1bmZpc2hpZWQuY29uY2F0KGZpbmlzaGVkKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnQocmFuZG9tQXBob3Jpc20sIGRhdGFBcnIpIHtcbiAgICBfc2hvdyhkYXRhQXJyLCByYW5kb21BcGhvcmlzbSwgX3JlbmRlclBhcnQpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3JlbmRlclBhcnQoZGF0YUFycikge1xuICAgIHJldHVybiBpdGVtR2VuZXJhdG9yKGRhdGFBcnIucmV2ZXJzZSgpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIGNsZWFyQ2hpbGROb2Rlcyhkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbnRlbmNlSGFuZGxlcih0ZXh0KSB7XG4gICAgY29uc3QgcmVuZGVyZWQgPSBzZW50ZW5jZUdlbmVyYXRvcih0ZXh0KTtcblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuaW5uZXJIVE1MID0gcmVuZGVyZWQ7XG4gIH1cblxuXG4gIHJldHVybiB7XG4gICAgaW5pdCxcbiAgICBhbGwsXG4gICAgcGFydCxcbiAgICBjbGVhcixcbiAgICBzZW50ZW5jZUhhbmRsZXIsXG4gIH07XG59KSgpO1xuXG5leHBvcnQgZGVmYXVsdCByZWZyZXNoR2VuZXJhbDtcbiIsImltcG9ydCBhZGRFdmVudHNHZW5lcmF0b3IgZnJvbSAnLi4vZGJHZW5lcmFsL2FkZEV2ZW50c0dlbmVyYXRvcic7XG5pbXBvcnQgZXZlbnRzSGFuZGxlciBmcm9tICcuLi9kYlN1Y2Nlc3MvZXZlbnRzSGFuZGxlcic7XG5cbmZ1bmN0aW9uIGFkZEV2ZW50cygpIHtcbiAgYWRkRXZlbnRzR2VuZXJhdG9yKGV2ZW50c0hhbmRsZXIpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBhZGRFdmVudHM7XG4iLCJpbXBvcnQgREIgZnJvbSAnaW5kZXhlZGRiLWNydWQnO1xuaW1wb3J0IFJlZnJlc2ggZnJvbSAnLi4vZGJTdWNjZXNzL3JlZnJlc2gnO1xuaW1wb3J0IEdlbmVyYWwgZnJvbSAnLi4vZGJHZW5lcmFsL2V2ZW50c0hhbmRsZXJHZW5lcmFsJztcbmltcG9ydCBpdGVtR2VuZXJhdG9yIGZyb20gJy4uL3RlbXBsZXRlL2l0ZW1HZW5lcmF0b3InO1xuXG5jb25zdCBldmVudHNIYW5kbGVyID0gKCgpID0+IHtcbiAgZnVuY3Rpb24gYWRkKCkge1xuICAgIGNvbnN0IGlucHV0VmFsdWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5wdXQnKS52YWx1ZTtcblxuICAgIGlmIChpbnB1dFZhbHVlID09PSAnJykge1xuICAgICAgd2luZG93LmFsZXJ0KCdwbGVhc2UgaW5wdXQgYSByZWFsIGRhdGF+Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIF9hZGRIYW5kbGVyKGlucHV0VmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9hZGRIYW5kbGVyKGlucHV0VmFsdWUpIHtcbiAgICBjb25zdCBuZXdEYXRhID0gR2VuZXJhbC5kYXRhR2VuZXJhdG9yKERCLmdldE5ld0tleSgpLCBpbnB1dFZhbHVlKTtcbiAgICBjb25zdCByZW5kZXJlZCA9IGl0ZW1HZW5lcmF0b3IobmV3RGF0YSk7XG5cbiAgICByZW1vdmVJbml0KCk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyYmVnaW4nLCByZW5kZXJlZCk7IC8vIFBVTkNITElORTogdXNlIGluc2VydEFkamFjZW50SFRNTFxuICAgIEdlbmVyYWwucmVzZXRJbnB1dCgpO1xuICAgIERCLmFkZEl0ZW0obmV3RGF0YSk7XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmVJbml0KCkge1xuICAgIGNvbnN0IGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gICAgaWYgKGxpc3QuZmlyc3RDaGlsZC5jbGFzc05hbWUgPT09ICdhcGhvcmlzbScpIHtcbiAgICAgIGxpc3QucmVtb3ZlQ2hpbGQobGlzdC5maXJzdENoaWxkKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBlbnRlckFkZChlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgIGFkZCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsaWNrTGkoeyB0YXJnZXQgfSkge1xuICAgIC8vIHVzZSBldmVudCBkZWxlZ2F0aW9uXG4gICAgaWYgKCF0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdhcGhvcmlzbScpKSB7XG4gICAgICBpZiAodGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpKSB7IC8vIHRlc3Qgd2hldGhlciBpcyB4XG4gICAgICAgIHRhcmdldC5jbGFzc0xpc3QudG9nZ2xlKCdmaW5pc2hlZCcpOyAvLyB0b2dnbGUgYXBwZWFyYW5jZVxuXG4gICAgICAgIC8vIHVzZSBwcmV2aW91c2x5IHN0b3JlZCBkYXRhLWlkIGF0dHJpYnV0ZVxuICAgICAgICBjb25zdCBpZCA9IHBhcnNlSW50KHRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSwgMTApO1xuXG4gICAgICAgIERCLmdldEl0ZW0oaWQpXG4gICAgICAgICAgLnRoZW4oX3RvZ2dsZUxpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfdG9nZ2xlTGkoZGF0YSkge1xuICAgIGNvbnN0IG5ld0RhdGEgPSBkYXRhO1xuXG4gICAgbmV3RGF0YS5maW5pc2hlZCA9ICFkYXRhLmZpbmlzaGVkO1xuICAgIERCLnVwZGF0ZUl0ZW0obmV3RGF0YSlcbiAgICAgIC50aGVuKHNob3dBbGwpO1xuICB9XG5cbiAgLy8gbGkncyBbeF0ncyBkZWxldGVcbiAgZnVuY3Rpb24gcmVtb3ZlTGkoeyB0YXJnZXQgfSkge1xuICAgIGlmICh0YXJnZXQuY2xhc3NOYW1lID09PSAnY2xvc2UnKSB7IC8vIHVzZSBldmVudCBkZWxlZ2F0aW9uXG4gICAgICAvLyBkZWxldGUgdmlzdWFsbHlcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykucmVtb3ZlQ2hpbGQodGFyZ2V0LnBhcmVudE5vZGUpO1xuICAgICAgX2FkZFJhbmRvbSgpO1xuICAgICAgLy8gdXNlIHByZXZpb3VzbHkgc3RvcmVkIGRhdGFcbiAgICAgIGNvbnN0IGlkID0gcGFyc2VJbnQodGFyZ2V0LnBhcmVudE5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyksIDEwKTtcbiAgICAgIC8vIGRlbGV0ZSBhY3R1YWxseVxuICAgICAgREIucmVtb3ZlSXRlbShpZCk7XG4gICAgfVxuICB9XG5cbiAgLy8gZm9yIFNlbWFudGljXG4gIGZ1bmN0aW9uIF9hZGRSYW5kb20oKSB7XG4gICAgY29uc3QgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG5cbiAgICAvLyBiZWNhdXNlIG9mIHRoZSBoYW5kbGVyYmFzLnRlbXBsZXRlLCBhZGQgdGhpcyBpbnNwZWN0XG4gICAgaWYgKCFsaXN0Lmxhc3RDaGlsZCB8fCBsaXN0Lmxhc3RDaGlsZC5ub2RlTmFtZSA9PT0gJyN0ZXh0Jykge1xuICAgICAgUmVmcmVzaC5yYW5kb20oKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzaG93SW5pdCgpIHtcbiAgICBEQi5nZXRBbGwoKVxuICAgICAgLnRoZW4oUmVmcmVzaC5pbml0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dBbGwoKSB7XG4gICAgREIuZ2V0QWxsKClcbiAgICAgIC50aGVuKFJlZnJlc2guYWxsKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dEb25lKCkge1xuICAgIF9zaG93V2hldGhlckRvbmUodHJ1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93VG9kbygpIHtcbiAgICBfc2hvd1doZXRoZXJEb25lKGZhbHNlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zaG93V2hldGhlckRvbmUod2hldGhlckRvbmUpIHtcbiAgICBjb25zdCBjb25kaXRpb24gPSAnZmluaXNoZWQnO1xuXG4gICAgREIuZ2V0V2hldGhlckNvbmRpdGlvbkl0ZW0oY29uZGl0aW9uLCB3aGV0aGVyRG9uZSlcbiAgICAgIC50aGVuKFJlZnJlc2gucGFydCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93Q2xlYXJEb25lKCkge1xuICAgIGNvbnN0IGNvbmRpdGlvbiA9ICdmaW5pc2hlZCc7XG5cbiAgICBEQi5yZW1vdmVXaGV0aGVyQ29uZGl0aW9uSXRlbShjb25kaXRpb24sIHRydWUpXG4gICAgICAudGhlbihEQi5nZXRBbGwpXG4gICAgICAudGhlbihSZWZyZXNoLnBhcnQpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0NsZWFyKCkge1xuICAgIFJlZnJlc2guY2xlYXIoKTsgLy8gY2xlYXIgbm9kZXMgdmlzdWFsbHlcbiAgICBEQi5jbGVhcigpXG4gICAgICAudGhlbihSZWZyZXNoLnJhbmRvbSk7IC8vIGNsZWFyIGRhdGEgaW5kZWVkXG4gIH1cblxuICByZXR1cm4ge1xuICAgIGFkZCxcbiAgICBlbnRlckFkZCxcbiAgICBjbGlja0xpLFxuICAgIHJlbW92ZUxpLFxuICAgIHNob3dJbml0LFxuICAgIHNob3dBbGwsXG4gICAgc2hvd0RvbmUsXG4gICAgc2hvd1RvZG8sXG4gICAgc2hvd0NsZWFyRG9uZSxcbiAgICBzaG93Q2xlYXIsXG4gIH07XG59KSgpO1xuXG5leHBvcnQgZGVmYXVsdCBldmVudHNIYW5kbGVyO1xuIiwiaW1wb3J0IERCIGZyb20gJ2luZGV4ZWRkYi1jcnVkJztcbmltcG9ydCBHZW5lcmFsIGZyb20gJy4uL2RiR2VuZXJhbC9yZWZyZXNoR2VuZXJhbCc7XG5cbmNvbnN0IFJlZnJlc2ggPSAoKCkgPT4ge1xuICBmdW5jdGlvbiByYW5kb21BcGhvcmlzbSgpIHtcbiAgICBjb25zdCBzdG9yZU5hbWUgPSAnYXBob3Jpc20nO1xuICAgIGNvbnN0IHJhbmRvbUluZGV4ID0gTWF0aC5jZWlsKE1hdGgucmFuZG9tKCkgKiBEQi5nZXRMZW5ndGgoc3RvcmVOYW1lKSk7XG5cbiAgICBEQi5nZXRJdGVtKHJhbmRvbUluZGV4LCBzdG9yZU5hbWUpXG4gICAgICAudGhlbihfcGFyc2VUZXh0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9wYXJzZVRleHQoZGF0YSkge1xuICAgIGNvbnN0IHRleHQgPSBkYXRhLmNvbnRlbnQ7XG5cbiAgICBHZW5lcmFsLnNlbnRlbmNlSGFuZGxlcih0ZXh0KTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaW5pdDogR2VuZXJhbC5pbml0LFxuICAgIGFsbDogR2VuZXJhbC5hbGwuYmluZChudWxsLCByYW5kb21BcGhvcmlzbSksIC8vIFBVTkNITElORTogdXNlIGJpbmQgdG8gcGFzcyBwYXJhbXRlclxuICAgIHBhcnQ6IEdlbmVyYWwucGFydC5iaW5kKG51bGwsIHJhbmRvbUFwaG9yaXNtKSxcbiAgICBjbGVhcjogR2VuZXJhbC5jbGVhcixcbiAgICByYW5kb206IHJhbmRvbUFwaG9yaXNtLFxuICB9O1xuICAvLyByZXR1cm4ge1xuICAvLyAgIGluaXQ6IEdlbmVyYWwuaW5pdCxcbiAgLy8gICBGSVhNRTogd2h5IHRoaXMgbWV0aG9kIGNhbid0IHdvcmtcbiAgLy8gICBhbGw6ICgpID0+IEdlbmVyYWwuYWxsKHJhbmRvbUFwaG9yaXNtKSxcbiAgLy8gICBwYXJ0OiAoKSA9PiBHZW5lcmFsLnBhcnQocmFuZG9tQXBob3Jpc20pLFxuICAvLyAgIGNsZWFyOiBHZW5lcmFsLmNsZWFyLFxuICAvLyAgIHJhbmRvbTogcmFuZG9tQXBob3Jpc20sXG4gIC8vIH07XG59KSgpO1xuXG5leHBvcnQgZGVmYXVsdCBSZWZyZXNoO1xuIiwiZnVuY3Rpb24gZ2V0Rm9ybWF0RGF0ZShmbXQpIHtcbiAgY29uc3QgbmV3RGF0ZSA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IG8gPSB7XG4gICAgJ3krJzogbmV3RGF0ZS5nZXRGdWxsWWVhcigpLFxuICAgICdNKyc6IG5ld0RhdGUuZ2V0TW9udGgoKSArIDEsXG4gICAgJ2QrJzogbmV3RGF0ZS5nZXREYXRlKCksXG4gICAgJ2grJzogbmV3RGF0ZS5nZXRIb3VycygpLFxuICAgICdtKyc6IG5ld0RhdGUuZ2V0TWludXRlcygpLFxuICB9O1xuICBsZXQgbmV3Zm10ID0gZm10O1xuXG4gIE9iamVjdC5rZXlzKG8pLmZvckVhY2goKGspID0+IHtcbiAgICBpZiAobmV3IFJlZ0V4cChgKCR7a30pYCkudGVzdChuZXdmbXQpKSB7XG4gICAgICBpZiAoayA9PT0gJ3krJykge1xuICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChgJHtvW2tdfWApLnN1YnN0cig0IC0gUmVnRXhwLiQxLmxlbmd0aCkpO1xuICAgICAgfSBlbHNlIGlmIChrID09PSAnUysnKSB7XG4gICAgICAgIGxldCBsZW5zID0gUmVnRXhwLiQxLmxlbmd0aDtcbiAgICAgICAgbGVucyA9IGxlbnMgPT09IDEgPyAzIDogbGVucztcbiAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoYDAwJHtvW2tdfWApLnN1YnN0cigoYCR7b1trXX1gKS5sZW5ndGggLSAxLCBsZW5zKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChSZWdFeHAuJDEubGVuZ3RoID09PSAxKSA/IChvW2tdKSA6ICgoYDAwJHtvW2tdfWApLnN1YnN0cigoYCR7b1trXX1gKS5sZW5ndGgpKSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgLy8gZm9yIChjb25zdCBrIGluIG8pIHtcbiAgLy8gICBpZiAobmV3IFJlZ0V4cChgKCR7a30pYCkudGVzdChuZXdmbXQpKSB7XG4gIC8vICAgICBpZiAoayA9PT0gJ3krJykge1xuICAvLyAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChgJHtvW2tdfWApLnN1YnN0cig0IC0gUmVnRXhwLiQxLmxlbmd0aCkpO1xuICAvLyAgICAgfSBlbHNlIGlmIChrID09PSAnUysnKSB7XG4gIC8vICAgICAgIGxldCBsZW5zID0gUmVnRXhwLiQxLmxlbmd0aDtcbiAgLy8gICAgICAgbGVucyA9IGxlbnMgPT09IDEgPyAzIDogbGVucztcbiAgLy8gICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoYDAwJHtvW2tdfWApLnN1YnN0cigoYCR7b1trXX1gKS5sZW5ndGggLSAxLCBsZW5zKSk7XG4gIC8vICAgICB9IGVsc2Uge1xuICAvLyAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChSZWdFeHAuJDEubGVuZ3RoID09PSAxKSA/IChvW2tdKSA6ICgoYDAwJHtvW2tdfWApLnN1YnN0cigoYCR7b1trXX1gKS5sZW5ndGgpKSk7XG4gIC8vICAgICB9XG4gIC8vICAgfVxuICAvLyB9XG5cbiAgcmV0dXJuIG5ld2ZtdDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZ2V0Rm9ybWF0RGF0ZTtcbiIsImZ1bmN0aW9uIGxhenlMb2FkV2l0aG91dERCKCkge1xuICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG5cbiAgZWxlbWVudC50eXBlID0gJ3RleHQvamF2YXNjcmlwdCc7XG4gIGVsZW1lbnQuYXN5bmMgPSB0cnVlO1xuICBlbGVtZW50LnNyYyA9ICcuL2Rpc3Qvc2NyaXB0cy9sYXp5TG9hZC5taW4uanMnO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBsYXp5TG9hZFdpdGhvdXREQjtcbiIsImZ1bmN0aW9uIGl0ZW1HZW5lcmF0b3IoZGF0YUFycikge1xuICBjb25zdCB0ZW1wbGF0ZSA9IEhhbmRsZWJhcnMudGVtcGxhdGVzLmxpO1xuICBsZXQgcmVzdWx0ID0gZGF0YUFycjtcblxuICBpZiAoIUFycmF5LmlzQXJyYXkoZGF0YUFycikpIHtcbiAgICByZXN1bHQgPSBbZGF0YUFycl07XG4gIH1cbiAgY29uc3QgcmVuZGVyZWQgPSB0ZW1wbGF0ZSh7IGxpc3RJdGVtczogcmVzdWx0IH0pO1xuXG4gIHJldHVybiByZW5kZXJlZC50cmltKCk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGl0ZW1HZW5lcmF0b3I7XG4iLCJmdW5jdGlvbiBzZW50ZW5jZUdlbmVyYXRvcih0ZXh0KSB7XG4gIGNvbnN0IHRlbXBsYXRlID0gSGFuZGxlYmFycy50ZW1wbGF0ZXMubGk7XG4gIGNvbnN0IHJlbmRlcmVkID0gdGVtcGxhdGUoeyBzZW50ZW5jZTogdGV4dCB9KTtcblxuICByZXR1cm4gcmVuZGVyZWQudHJpbSgpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBzZW50ZW5jZUdlbmVyYXRvcjtcbiIsImZ1bmN0aW9uIHRlbXBsYXRlICgpIHtcbiAgdmFyIHRlbXBsYXRlID0gSGFuZGxlYmFycy50ZW1wbGF0ZSwgdGVtcGxhdGVzID0gSGFuZGxlYmFycy50ZW1wbGF0ZXMgPSBIYW5kbGViYXJzLnRlbXBsYXRlcyB8fCB7fTtcbnRlbXBsYXRlc1snbGknXSA9IHRlbXBsYXRlKHtcIjFcIjpmdW5jdGlvbihjb250YWluZXIsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICAgIHZhciBoZWxwZXI7XG5cbiAgcmV0dXJuIFwiICA8bGkgY2xhc3M9XFxcImFwaG9yaXNtXFxcIj5cIlxuICAgICsgY29udGFpbmVyLmVzY2FwZUV4cHJlc3Npb24oKChoZWxwZXIgPSAoaGVscGVyID0gaGVscGVycy5zZW50ZW5jZSB8fCAoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuc2VudGVuY2UgOiBkZXB0aDApKSAhPSBudWxsID8gaGVscGVyIDogaGVscGVycy5oZWxwZXJNaXNzaW5nKSwodHlwZW9mIGhlbHBlciA9PT0gXCJmdW5jdGlvblwiID8gaGVscGVyLmNhbGwoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAgOiAoY29udGFpbmVyLm51bGxDb250ZXh0IHx8IHt9KSx7XCJuYW1lXCI6XCJzZW50ZW5jZVwiLFwiaGFzaFwiOnt9LFwiZGF0YVwiOmRhdGF9KSA6IGhlbHBlcikpKVxuICAgICsgXCI8L2xpPlxcblwiO1xufSxcIjNcIjpmdW5jdGlvbihjb250YWluZXIsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICAgIHZhciBzdGFjazE7XG5cbiAgcmV0dXJuICgoc3RhY2sxID0gaGVscGVycy5lYWNoLmNhbGwoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAgOiAoY29udGFpbmVyLm51bGxDb250ZXh0IHx8IHt9KSwoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAubGlzdEl0ZW1zIDogZGVwdGgwKSx7XCJuYW1lXCI6XCJlYWNoXCIsXCJoYXNoXCI6e30sXCJmblwiOmNvbnRhaW5lci5wcm9ncmFtKDQsIGRhdGEsIDApLFwiaW52ZXJzZVwiOmNvbnRhaW5lci5ub29wLFwiZGF0YVwiOmRhdGF9KSkgIT0gbnVsbCA/IHN0YWNrMSA6IFwiXCIpO1xufSxcIjRcIjpmdW5jdGlvbihjb250YWluZXIsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICAgIHZhciBzdGFjazE7XG5cbiAgcmV0dXJuICgoc3RhY2sxID0gaGVscGVyc1tcImlmXCJdLmNhbGwoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAgOiAoY29udGFpbmVyLm51bGxDb250ZXh0IHx8IHt9KSwoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuZmluaXNoZWQgOiBkZXB0aDApLHtcIm5hbWVcIjpcImlmXCIsXCJoYXNoXCI6e30sXCJmblwiOmNvbnRhaW5lci5wcm9ncmFtKDUsIGRhdGEsIDApLFwiaW52ZXJzZVwiOmNvbnRhaW5lci5wcm9ncmFtKDcsIGRhdGEsIDApLFwiZGF0YVwiOmRhdGF9KSkgIT0gbnVsbCA/IHN0YWNrMSA6IFwiXCIpO1xufSxcIjVcIjpmdW5jdGlvbihjb250YWluZXIsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICAgIHZhciBoZWxwZXIsIGFsaWFzMT1kZXB0aDAgIT0gbnVsbCA/IGRlcHRoMCA6IChjb250YWluZXIubnVsbENvbnRleHQgfHwge30pLCBhbGlhczI9aGVscGVycy5oZWxwZXJNaXNzaW5nLCBhbGlhczM9XCJmdW5jdGlvblwiLCBhbGlhczQ9Y29udGFpbmVyLmVzY2FwZUV4cHJlc3Npb247XG5cbiAgcmV0dXJuIFwiICAgICAgPGxpIGNsYXNzPVxcXCJmaW5pc2hlZFxcXCIgZGF0YS1pZD1cIlxuICAgICsgYWxpYXM0KCgoaGVscGVyID0gKGhlbHBlciA9IGhlbHBlcnMuaWQgfHwgKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmlkIDogZGVwdGgwKSkgIT0gbnVsbCA/IGhlbHBlciA6IGFsaWFzMiksKHR5cGVvZiBoZWxwZXIgPT09IGFsaWFzMyA/IGhlbHBlci5jYWxsKGFsaWFzMSx7XCJuYW1lXCI6XCJpZFwiLFwiaGFzaFwiOnt9LFwiZGF0YVwiOmRhdGF9KSA6IGhlbHBlcikpKVxuICAgICsgXCI+XFxuICAgICAgICBcIlxuICAgICsgYWxpYXM0KCgoaGVscGVyID0gKGhlbHBlciA9IGhlbHBlcnMuZGF0ZSB8fCAoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuZGF0ZSA6IGRlcHRoMCkpICE9IG51bGwgPyBoZWxwZXIgOiBhbGlhczIpLCh0eXBlb2YgaGVscGVyID09PSBhbGlhczMgPyBoZWxwZXIuY2FsbChhbGlhczEse1wibmFtZVwiOlwiZGF0ZVwiLFwiaGFzaFwiOnt9LFwiZGF0YVwiOmRhdGF9KSA6IGhlbHBlcikpKVxuICAgICsgXCIgOiBcXG4gICAgICAgIDxzcGFuPlwiXG4gICAgKyBhbGlhczQoKChoZWxwZXIgPSAoaGVscGVyID0gaGVscGVycy5ldmVudCB8fCAoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuZXZlbnQgOiBkZXB0aDApKSAhPSBudWxsID8gaGVscGVyIDogYWxpYXMyKSwodHlwZW9mIGhlbHBlciA9PT0gYWxpYXMzID8gaGVscGVyLmNhbGwoYWxpYXMxLHtcIm5hbWVcIjpcImV2ZW50XCIsXCJoYXNoXCI6e30sXCJkYXRhXCI6ZGF0YX0pIDogaGVscGVyKSkpXG4gICAgKyBcIjwvc3Bhbj5cXG4gICAgICAgIDxzcGFuIGNsYXNzPVxcXCJjbG9zZVxcXCI+w5c8L3NwYW4+XFxuICAgICAgPC9saT5cXG5cIjtcbn0sXCI3XCI6ZnVuY3Rpb24oY29udGFpbmVyLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgICB2YXIgaGVscGVyLCBhbGlhczE9ZGVwdGgwICE9IG51bGwgPyBkZXB0aDAgOiAoY29udGFpbmVyLm51bGxDb250ZXh0IHx8IHt9KSwgYWxpYXMyPWhlbHBlcnMuaGVscGVyTWlzc2luZywgYWxpYXMzPVwiZnVuY3Rpb25cIiwgYWxpYXM0PWNvbnRhaW5lci5lc2NhcGVFeHByZXNzaW9uO1xuXG4gIHJldHVybiBcIiAgICAgIDxsaSBkYXRhLWlkPVwiXG4gICAgKyBhbGlhczQoKChoZWxwZXIgPSAoaGVscGVyID0gaGVscGVycy5pZCB8fCAoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuaWQgOiBkZXB0aDApKSAhPSBudWxsID8gaGVscGVyIDogYWxpYXMyKSwodHlwZW9mIGhlbHBlciA9PT0gYWxpYXMzID8gaGVscGVyLmNhbGwoYWxpYXMxLHtcIm5hbWVcIjpcImlkXCIsXCJoYXNoXCI6e30sXCJkYXRhXCI6ZGF0YX0pIDogaGVscGVyKSkpXG4gICAgKyBcIj5cXG4gICAgICAgIFwiXG4gICAgKyBhbGlhczQoKChoZWxwZXIgPSAoaGVscGVyID0gaGVscGVycy5kYXRlIHx8IChkZXB0aDAgIT0gbnVsbCA/IGRlcHRoMC5kYXRlIDogZGVwdGgwKSkgIT0gbnVsbCA/IGhlbHBlciA6IGFsaWFzMiksKHR5cGVvZiBoZWxwZXIgPT09IGFsaWFzMyA/IGhlbHBlci5jYWxsKGFsaWFzMSx7XCJuYW1lXCI6XCJkYXRlXCIsXCJoYXNoXCI6e30sXCJkYXRhXCI6ZGF0YX0pIDogaGVscGVyKSkpXG4gICAgKyBcIiA6IFxcbiAgICAgICAgPHNwYW4+XCJcbiAgICArIGFsaWFzNCgoKGhlbHBlciA9IChoZWxwZXIgPSBoZWxwZXJzLmV2ZW50IHx8IChkZXB0aDAgIT0gbnVsbCA/IGRlcHRoMC5ldmVudCA6IGRlcHRoMCkpICE9IG51bGwgPyBoZWxwZXIgOiBhbGlhczIpLCh0eXBlb2YgaGVscGVyID09PSBhbGlhczMgPyBoZWxwZXIuY2FsbChhbGlhczEse1wibmFtZVwiOlwiZXZlbnRcIixcImhhc2hcIjp7fSxcImRhdGFcIjpkYXRhfSkgOiBoZWxwZXIpKSlcbiAgICArIFwiPC9zcGFuPlxcbiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImNsb3NlXFxcIj7Dlzwvc3Bhbj5cXG4gICAgICA8L2xpPlxcblwiO1xufSxcImNvbXBpbGVyXCI6WzcsXCI+PSA0LjAuMFwiXSxcIm1haW5cIjpmdW5jdGlvbihjb250YWluZXIsZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICAgIHZhciBzdGFjazE7XG5cbiAgcmV0dXJuICgoc3RhY2sxID0gaGVscGVyc1tcImlmXCJdLmNhbGwoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAgOiAoY29udGFpbmVyLm51bGxDb250ZXh0IHx8IHt9KSwoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuc2VudGVuY2UgOiBkZXB0aDApLHtcIm5hbWVcIjpcImlmXCIsXCJoYXNoXCI6e30sXCJmblwiOmNvbnRhaW5lci5wcm9ncmFtKDEsIGRhdGEsIDApLFwiaW52ZXJzZVwiOmNvbnRhaW5lci5wcm9ncmFtKDMsIGRhdGEsIDApLFwiZGF0YVwiOmRhdGF9KSkgIT0gbnVsbCA/IHN0YWNrMSA6IFwiXCIpO1xufSxcInVzZURhdGFcIjp0cnVlfSk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCB0ZW1wbGF0ZTtcbiJdfQ==
