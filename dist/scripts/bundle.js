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
module.exports = {
  name: 'JustToDo',
  version: '23',
  storeConfig: [
    {
      storeName: 'list',
      key: 'id',
      initialData: [
        { id: 0, event: 'JustDemo', finished: true, date: 0 }
      ]
    },
    {
      storeName: 'aphorism',
      key: 'id',
      initialData: [
        {
          'id': 1,
          'content': "You're better than that"
        },
        {
          'id': 2,
          'content': 'Yesterday You Said Tomorrow'
        },
        {
          'id': 3,
          'content': 'Why are we here?'
        },
        {
          'id': 4,
          'content': 'All in, or nothing'
        },
        {
          'id': 5,
          'content': 'You Never Try, You Never Know'
        },
        {
          'id': 6,
          'content': 'The unexamined life is not worth living. -- Socrates'
        },
        {
          'id': 7,
          'content': 'There is only one thing we say to lazy: NOT TODAY'
        }
      ]
    }
  ]
};

},{}],4:[function(require,module,exports){
'use strict';
(function init() {
  var DB = require('indexeddb-crud');
  var config = require('./db/config');
  var addEvents = require('./utlis/dbSuccess/addEvents');
  var lazyLoadWithoutDB = require('./utlis/lazyLoadWithoutDB');
  var templete = require('../../templete/template');

  templete();
  // open DB, and when DB open succeed, invoke initial function
  DB.open(config, addEvents, lazyLoadWithoutDB);
}());

},{"../../templete/template":16,"./db/config":3,"./utlis/dbSuccess/addEvents":9,"./utlis/lazyLoadWithoutDB":13,"indexeddb-crud":2}],5:[function(require,module,exports){
'use strict';
function clearChildNodes(root) {
  while (root.hasChildNodes()) { // or root.firstChild or root.lastChild
    root.removeChild(root.firstChild);
  }
  // or root.innerHTML = ''
}

module.exports = clearChildNodes;

},{}],6:[function(require,module,exports){
'use strict';
function addEventsGenerator(handler) {
  var list;

  handler.showInit();
  // add all eventListener
  list = document.querySelector('#list');
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

module.exports = addEventsGenerator;

},{}],7:[function(require,module,exports){
'use strict';
var eventsHandlerGeneral = (function generalGenerator() {
  var getFormatDate = require('../getFormatDate');

  function resetInput() {
    document.querySelector('#input').value = '';
  }

  function dataGenerator(key, value) {
    return {
      id: key,
      event: value,
      finished: false,
      date: getFormatDate('MM月dd日hh:mm') + ' '
    };
  }

  return {
    resetInput: resetInput,
    dataGenerator: dataGenerator
  };
}());

module.exports = eventsHandlerGeneral;

},{"../getFormatDate":12}],8:[function(require,module,exports){
'use strict';
var refreshGeneral = (function generalGenerator() {
  var sentenceGenerator = require('../templete/sentenceGenerator');
  var itemGenerator = require('../templete/itemGenerator');
  var clearChildNodes = require('../clearChildNodes');

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

    document.querySelector('#list').innerHTML = sentenceGenerator(text);
  }

  function all(randomAphorism, dataArr) {
    _show(dataArr, randomAphorism, _renderAll);
  }

  function _renderAll(dataArr) {
    var classifiedData = _classifyData(dataArr);

    return itemGenerator(classifiedData);
  }

  function _classifyData(dataArr) {
    var finished = [];
    var unfishied = [];

    // put the finished item to the bottom
    dataArr.forEach(function classify(data) {
      data.finished ? finished.unshift(data) : unfishied.unshift(data);
    });

    return unfishied.concat(finished);
  }

  function part(randomAphorism, dataArr) {
    _show(dataArr, randomAphorism, _renderPart);
  }

  function _renderPart(dataArr) {
    return itemGenerator(dataArr.reverse());
  }

  function clear() {
    clearChildNodes(document.querySelector('#list'));
  }

  function sentenceHandler(text) {
    var rendered = sentenceGenerator(text);

    document.querySelector('#list').innerHTML = rendered;
  }


  return {
    init: init,
    all: all,
    part: part,
    clear: clear,
    sentenceHandler: sentenceHandler
  };
}());

module.exports = refreshGeneral;

},{"../clearChildNodes":5,"../templete/itemGenerator":14,"../templete/sentenceGenerator":15}],9:[function(require,module,exports){
'use strict';
var addEvents = (function dbSuccessGenerator() {
  var addEventsGenerator = require('../dbGeneral/addEventsGenerator');
  var eventsHandler = require('../dbSuccess/eventsHandler');

  return function handler() {
    addEventsGenerator(eventsHandler);
  };
}());

module.exports = addEvents;

},{"../dbGeneral/addEventsGenerator":6,"../dbSuccess/eventsHandler":10}],10:[function(require,module,exports){
'use strict';
var eventsHandler = (function dbSuccessGenerator() {
  var DB = require('indexeddb-crud');
  var refresh = require('../dbSuccess/refresh');
  var general = require('../dbGeneral/eventsHandlerGeneral');
  var itemGenerator = require('../templete/itemGenerator');

  function add() {
    var inputValue = document.querySelector('#input').value;

    if (inputValue === '') {
      window.alert('please input a real data~');
    } else {
      _addHandler(inputValue);
    }
  }

  function _addHandler(inputValue) {
    var newData = general.dataGenerator(DB.getNewKey(), inputValue);
    var rendered = itemGenerator(newData);

    // console.log(DB.getNewKey());
    removeInit();
    document.querySelector('#list').insertAdjacentHTML('afterbegin', rendered); // PUNCHLINE: use insertAdjacentHTML
    general.resetInput();
    DB.addItem(newData);
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
    var id;
    var targetLi = e.target;
    // use event delegation

    if (!targetLi.classList.contains('aphorism')) {
      if (targetLi.getAttribute('data-id')) {
        targetLi.classList.toggle('finished'); // toggle appearance
        id = parseInt(targetLi.getAttribute('data-id'), 10); // use previously stored data-id attribute
        DB.getItem(id, _toggleLi);
      }
    }
  }

  function _toggleLi(data) {
    data.finished = !data.finished;
    DB.updateItem(data, showAll);
  }

  // li's [x]'s delete
  function removeLi(e) {
    var id;

    if (e.target.className === 'close') { // use event delegation
      // delete visually
      document.querySelector('#list').removeChild(e.target.parentNode);
      _addRandom();
      // use previously stored data
      id = parseInt(e.target.parentNode.getAttribute('data-id'), 10);
      // delete actually
      DB.removeItem(id);
    }
  }

  // for Semantic
  function _addRandom() {
    var list = document.querySelector('#list');

    if (!list.hasChildNodes()) {
      refresh.random();
    }
  }

  function showInit() {
    DB.getAll(refresh.init);
  }

  function showAll() {
    DB.getAll(refresh.all);
  }

  function showDone() {
    _showWhetherDone(true);
  }

  function showTodo() {
    _showWhetherDone(false);
  }

  function _showWhetherDone(whetherDone) {
    var condition = 'finished';

    DB.getWhetherConditionItem(condition, whetherDone, refresh.part);
  }

  function showClearDone() {
    var condition = 'finished';

    DB.removeWhetherConditionItem(condition, true, function showLeftData() {
      DB.getAll(refresh.part);
    });
  }

  function showClear() {
    refresh.clear(); // clear nodes visually
    refresh.random();
    DB.clear(); // clear data indeed
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
}());

module.exports = eventsHandler;

},{"../dbGeneral/eventsHandlerGeneral":7,"../dbSuccess/refresh":11,"../templete/itemGenerator":14,"indexeddb-crud":2}],11:[function(require,module,exports){
'use strict';
var refresh = (function dbSuccessGenerator() {
  var DB = require('indexeddb-crud');
  var general = require('../dbGeneral/refreshGeneral');

  function randomAphorism() {
    var storeName = 'aphorism';
    var randomIndex = Math.ceil(Math.random() * DB.getLength(storeName));

    DB.getItem(randomIndex, _parseText, storeName);
  }

  function _parseText(data) {
    var text = data.content;

    general.sentenceHandler(text);
  }

  return {
    init: general.init,
    all: general.all.bind(null, randomAphorism),  // PUNCHLINE: use bind to pass paramter
    part: general.part.bind(null, randomAphorism),
    clear: general.clear,
    random: randomAphorism
  };
}());

module.exports = refresh;

},{"../dbGeneral/refreshGeneral":8,"indexeddb-crud":2}],12:[function(require,module,exports){
'use strict';
function getFormatDate(fmt) {
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

module.exports = getFormatDate;

},{}],13:[function(require,module,exports){
'use strict';
function lazyLoadWithoutDB() {
  var element = document.createElement('script');

  element.type = 'text/javascript';
  element.async = true;
  element.src = './dist/scripts/lazyLoad.min.js';
  document.body.appendChild(element);
}

module.exports = lazyLoadWithoutDB;

},{}],14:[function(require,module,exports){
'use strict';
function itemGenerator(dataArr) {
  var result = dataArr;
  var rendered;
  var template = Handlebars.templates.li;

  if (!Array.isArray(dataArr)) {
    result = [dataArr];
  }
  rendered = template({listItems: result});

  return rendered.trim();
}

module.exports = itemGenerator;

},{}],15:[function(require,module,exports){
'use strict';
function sentenceGenerator(text) {
  var template = Handlebars.templates.li;
  var rendered = template({"sentence": text});

  return rendered.trim();
}

module.exports = sentenceGenerator;

},{}],16:[function(require,module,exports){
module.exports = function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['li'] = template({"1":function(container,depth0,helpers,partials,data) {
    var helper;

  return "  <li class=\"aphorism\">"
    + container.escapeExpression(((helper = (helper = helpers.sentence || (depth0 != null ? depth0.sentence : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"sentence","hash":{},"data":data}) : helper)))
    + "</li>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers.each.call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.listItems : depth0),{"name":"each","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "");
},"4":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.finished : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.program(7, data, 0),"data":data})) != null ? stack1 : "");
},"5":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "      <li class=\"finished\" data-id="
    + alias4(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data}) : helper)))
    + ">\n        "
    + alias4(((helper = (helper = helpers.date || (depth0 != null ? depth0.date : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"date","hash":{},"data":data}) : helper)))
    + " : \n        <span>"
    + alias4(((helper = (helper = helpers.event || (depth0 != null ? depth0.event : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"event","hash":{},"data":data}) : helper)))
    + "</span>\n        <span class=\"close\">×</span>\n      </li>\n";
},"7":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "      <li data-id="
    + alias4(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data}) : helper)))
    + ">\n        "
    + alias4(((helper = (helper = helpers.date || (depth0 != null ? depth0.date : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"date","hash":{},"data":data}) : helper)))
    + " : \n        <span>"
    + alias4(((helper = (helper = helpers.event || (depth0 != null ? depth0.event : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"event","hash":{},"data":data}) : helper)))
    + "</span>\n        <span class=\"close\">×</span>\n      </li>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.sentence : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data})) != null ? stack1 : "");
},"useData":true});
};
},{}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5kZXhlZGRiLWNydWQvZGlzdC9pbmRleGVkZGItY3J1ZC5qcyIsIm5vZGVfbW9kdWxlcy9pbmRleGVkZGItY3J1ZC9pbmRleC5qcyIsInNyYy9zY3JpcHRzL2RiL2NvbmZpZy5qcyIsInNyYy9zY3JpcHRzL21haW4uanMiLCJzcmMvc2NyaXB0cy91dGxpcy9jbGVhckNoaWxkTm9kZXMuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkdlbmVyYWwvYWRkRXZlbnRzR2VuZXJhdG9yLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJHZW5lcmFsL2V2ZW50c0hhbmRsZXJHZW5lcmFsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJHZW5lcmFsL3JlZnJlc2hHZW5lcmFsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJTdWNjZXNzL2FkZEV2ZW50cy5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2RiU3VjY2Vzcy9ldmVudHNIYW5kbGVyLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJTdWNjZXNzL3JlZnJlc2guanMiLCJzcmMvc2NyaXB0cy91dGxpcy9nZXRGb3JtYXREYXRlLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvbGF6eUxvYWRXaXRob3V0REIuanMiLCJzcmMvc2NyaXB0cy91dGxpcy90ZW1wbGV0ZS9pdGVtR2VuZXJhdG9yLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvdGVtcGxldGUvc2VudGVuY2VHZW5lcmF0b3IuanMiLCJ0ZW1wbGV0ZS90ZW1wbGF0ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzVkE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbnZhciBJbmRleGVkREJIYW5kbGVyID0gZnVuY3Rpb24gKCkge1xuICB2YXIgX2RiID0gdm9pZCAwO1xuICB2YXIgX2RlZmF1bHRTdG9yZU5hbWUgPSB2b2lkIDA7XG4gIHZhciBfcHJlc2VudEtleSA9IHt9OyAvLyBzdG9yZSBtdWx0aS1vYmplY3RTdG9yZSdzIHByZXNlbnRLZXlcblxuICBmdW5jdGlvbiBvcGVuKGNvbmZpZywgb3BlblN1Y2Nlc3NDYWxsYmFjaywgb3BlbkZhaWxDYWxsYmFjaykge1xuICAgIC8vIGluaXQgb3BlbiBpbmRleGVkREJcbiAgICBpZiAoIXdpbmRvdy5pbmRleGVkREIpIHtcbiAgICAgIC8vIGZpcnN0bHkgaW5zcGVjdCBicm93c2VyJ3Mgc3VwcG9ydCBmb3IgaW5kZXhlZERCXG4gICAgICBpZiAob3BlbkZhaWxDYWxsYmFjaykge1xuICAgICAgICBvcGVuRmFpbENhbGxiYWNrKCk7IC8vIFBVTkNITElORTogb2ZmZXIgd2l0aG91dC1EQiBoYW5kbGVyXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3aW5kb3cuYWxlcnQoJ1xcdTI3MTQgWW91ciBicm93c2VyIGRvZXNuXFwndCBzdXBwb3J0IGEgc3RhYmxlIHZlcnNpb24gb2YgSW5kZXhlZERCLiBZb3UgY2FuIGluc3RhbGwgbGF0ZXN0IENocm9tZSBvciBGaXJlRm94IHRvIGhhbmRsZXIgaXQnKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIF9vcGVuSGFuZGxlcihjb25maWcsIG9wZW5TdWNjZXNzQ2FsbGJhY2spO1xuXG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICBmdW5jdGlvbiBfb3BlbkhhbmRsZXIoY29uZmlnLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgb3BlblJlcXVlc3QgPSB3aW5kb3cuaW5kZXhlZERCLm9wZW4oY29uZmlnLm5hbWUsIGNvbmZpZy52ZXJzaW9uKTsgLy8gb3BlbiBpbmRleGVkREJcblxuICAgIC8vIGFuIG9uYmxvY2tlZCBldmVudCBpcyBmaXJlZCB1bnRpbCB0aGV5IGFyZSBjbG9zZWQgb3IgcmVsb2FkZWRcbiAgICBvcGVuUmVxdWVzdC5vbmJsb2NrZWQgPSBmdW5jdGlvbiBibG9ja2VkU2NoZW1lVXAoKSB7XG4gICAgICAvLyBJZiBzb21lIG90aGVyIHRhYiBpcyBsb2FkZWQgd2l0aCB0aGUgZGF0YWJhc2UsIHRoZW4gaXQgbmVlZHMgdG8gYmUgY2xvc2VkIGJlZm9yZSB3ZSBjYW4gcHJvY2VlZC5cbiAgICAgIHdpbmRvdy5hbGVydCgnUGxlYXNlIGNsb3NlIGFsbCBvdGhlciB0YWJzIHdpdGggdGhpcyBzaXRlIG9wZW4nKTtcbiAgICB9O1xuXG4gICAgLy8gQ3JlYXRpbmcgb3IgdXBkYXRpbmcgdGhlIHZlcnNpb24gb2YgdGhlIGRhdGFiYXNlXG4gICAgb3BlblJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24gc2NoZW1hVXAoZSkge1xuICAgICAgLy8gQWxsIG90aGVyIGRhdGFiYXNlcyBoYXZlIGJlZW4gY2xvc2VkLiBTZXQgZXZlcnl0aGluZyB1cC5cbiAgICAgIF9kYiA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIG9udXBncmFkZW5lZWRlZCBpbicpO1xuICAgICAgX2NyZWF0ZU9iamVjdFN0b3JlSGFuZGxlcihjb25maWcuc3RvcmVDb25maWcpO1xuICAgIH07XG5cbiAgICBvcGVuUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBvcGVuU3VjY2VzcyhlKSB7XG4gICAgICBfZGIgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICBfZGIub252ZXJzaW9uY2hhbmdlID0gZnVuY3Rpb24gdmVyc2lvbmNoYW5nZUhhbmRsZXIoKSB7XG4gICAgICAgIF9kYi5jbG9zZSgpO1xuICAgICAgICB3aW5kb3cuYWxlcnQoJ0EgbmV3IHZlcnNpb24gb2YgdGhpcyBwYWdlIGlzIHJlYWR5LiBQbGVhc2UgcmVsb2FkJyk7XG4gICAgICB9O1xuICAgICAgX29wZW5TdWNjZXNzQ2FsbGJhY2tIYW5kbGVyKGNvbmZpZy5zdG9yZUNvbmZpZywgc3VjY2Vzc0NhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgLy8gdXNlIGVycm9yIGV2ZW50cyBidWJibGUgdG8gaGFuZGxlIGFsbCBlcnJvciBldmVudHNcbiAgICBvcGVuUmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24gb3BlbkVycm9yKGUpIHtcbiAgICAgIHdpbmRvdy5hbGVydCgnU29tZXRoaW5nIGlzIHdyb25nIHdpdGggaW5kZXhlZERCLCBmb3IgbW9yZSBpbmZvcm1hdGlvbiwgY2hlY2tvdXQgY29uc29sZScpO1xuICAgICAgY29uc29sZS5sb2coZS50YXJnZXQuZXJyb3IpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGUudGFyZ2V0LmVycm9yKTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gX29wZW5TdWNjZXNzQ2FsbGJhY2tIYW5kbGVyKGNvbmZpZ1N0b3JlQ29uZmlnLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgb2JqZWN0U3RvcmVMaXN0ID0gX3BhcnNlSlNPTkRhdGEoY29uZmlnU3RvcmVDb25maWcsICdzdG9yZU5hbWUnKTtcblxuICAgIG9iamVjdFN0b3JlTGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChzdG9yZUNvbmZpZywgaW5kZXgpIHtcbiAgICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgICBfZGVmYXVsdFN0b3JlTmFtZSA9IHN0b3JlQ29uZmlnLnN0b3JlTmFtZTsgLy8gUFVOQ0hMSU5FOiB0aGUgbGFzdCBzdG9yZU5hbWUgaXMgZGVmYXVsdFN0b3JlTmFtZVxuICAgICAgfVxuICAgICAgaWYgKGluZGV4ID09PSBvYmplY3RTdG9yZUxpc3QubGVuZ3RoIC0gMSkge1xuICAgICAgICBfZ2V0UHJlc2VudEtleShzdG9yZUNvbmZpZy5zdG9yZU5hbWUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soKTtcbiAgICAgICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBvcGVuIGluZGV4ZWREQiBzdWNjZXNzJyk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX2dldFByZXNlbnRLZXkoc3RvcmVDb25maWcuc3RvcmVOYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIHNldCBwcmVzZW50IGtleSB2YWx1ZSB0byBfcHJlc2VudEtleSAodGhlIHByaXZhdGUgcHJvcGVydHkpXG4gIGZ1bmN0aW9uIF9nZXRQcmVzZW50S2V5KHN0b3JlTmFtZSwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdKTtcblxuICAgIF9wcmVzZW50S2V5W3N0b3JlTmFtZV0gPSAwO1xuICAgIF9nZXRBbGxSZXF1ZXN0KHRyYW5zYWN0aW9uLCBzdG9yZU5hbWUpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGdldEFsbFN1Y2Nlc3MoZSkge1xuICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICBfcHJlc2VudEtleVtzdG9yZU5hbWVdID0gY3Vyc29yLnZhbHVlLmlkO1xuICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSBmdW5jdGlvbiBjb21wbGV0ZUdldFByZXNlbnRLZXkoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBub3cgJyArIHN0b3JlTmFtZSArICcgXFwncyBtYXgga2V5IGlzICcgKyBfcHJlc2VudEtleVtzdG9yZU5hbWVdKTsgLy8gaW5pdGlhbCB2YWx1ZSBpcyAwXG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjaygpO1xuICAgICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBvcGVuU3VjY2Vzc0NhbGxiYWNrIGZpbmlzaGVkJyk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9jcmVhdGVPYmplY3RTdG9yZUhhbmRsZXIoY29uZmlnU3RvcmVDb25maWcpIHtcbiAgICBfcGFyc2VKU09ORGF0YShjb25maWdTdG9yZUNvbmZpZywgJ3N0b3JlTmFtZScpLmZvckVhY2goZnVuY3Rpb24gKHN0b3JlQ29uZmlnKSB7XG4gICAgICBpZiAoIV9kYi5vYmplY3RTdG9yZU5hbWVzLmNvbnRhaW5zKHN0b3JlQ29uZmlnLnN0b3JlTmFtZSkpIHtcbiAgICAgICAgX2NyZWF0ZU9iamVjdFN0b3JlKHN0b3JlQ29uZmlnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9jcmVhdGVPYmplY3RTdG9yZShzdG9yZUNvbmZpZykge1xuICAgIHZhciBzdG9yZSA9IF9kYi5jcmVhdGVPYmplY3RTdG9yZShzdG9yZUNvbmZpZy5zdG9yZU5hbWUsIHsga2V5UGF0aDogc3RvcmVDb25maWcua2V5LCBhdXRvSW5jcmVtZW50OiB0cnVlIH0pO1xuXG4gICAgLy8gVXNlIHRyYW5zYWN0aW9uIG9uY29tcGxldGUgdG8gbWFrZSBzdXJlIHRoZSBvYmplY3QgU3RvcmUgY3JlYXRpb24gaXMgZmluaXNoZWRcbiAgICBzdG9yZS50cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gYWRkaW5pdGlhbERhdGEoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBjcmVhdGUgJyArIHN0b3JlQ29uZmlnLnN0b3JlTmFtZSArICcgXFwncyBvYmplY3Qgc3RvcmUgc3VjY2VlZCcpO1xuICAgICAgaWYgKHN0b3JlQ29uZmlnLmluaXRpYWxEYXRhKSB7XG4gICAgICAgIC8vIFN0b3JlIGluaXRpYWwgdmFsdWVzIGluIHRoZSBuZXdseSBjcmVhdGVkIG9iamVjdCBzdG9yZS5cbiAgICAgICAgX2luaXRpYWxEYXRhSGFuZGxlcihzdG9yZUNvbmZpZy5zdG9yZU5hbWUsIHN0b3JlQ29uZmlnLmluaXRpYWxEYXRhKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gX2luaXRpYWxEYXRhSGFuZGxlcihzdG9yZU5hbWUsIGluaXRpYWxEYXRhKSB7XG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdLCAncmVhZHdyaXRlJyk7XG4gICAgdmFyIG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKTtcblxuICAgIF9wYXJzZUpTT05EYXRhKGluaXRpYWxEYXRhLCAnaW5pdGlhbCcpLmZvckVhY2goZnVuY3Rpb24gKGRhdGEsIGluZGV4KSB7XG4gICAgICB2YXIgYWRkUmVxdWVzdCA9IG9iamVjdFN0b3JlLmFkZChkYXRhKTtcblxuICAgICAgYWRkUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBhZGRJbml0aWFsU3VjY2VzcygpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgYWRkIGluaXRpYWwgZGF0YVsnICsgaW5kZXggKyAnXSBzdWNjZXNzZWQnKTtcbiAgICAgIH07XG4gICAgfSk7XG4gICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGFkZEFsbERhdGFEb25lKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgYWRkIGFsbCAnICsgc3RvcmVOYW1lICsgJyBcXCdzIGluaXRpYWwgZGF0YSBkb25lIDopJyk7XG4gICAgICBfZ2V0UHJlc2VudEtleShzdG9yZU5hbWUpO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfcGFyc2VKU09ORGF0YShyYXdkYXRhLCBuYW1lKSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBwYXJzZWREYXRhID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShyYXdkYXRhKSk7XG5cbiAgICAgIHJldHVybiBwYXJzZWREYXRhO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB3aW5kb3cuYWxlcnQoJ3BsZWFzZSBzZXQgY29ycmVjdCAnICsgbmFtZSArICcgYXJyYXkgb2JqZWN0IDopJyk7XG4gICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRMZW5ndGgoKSB7XG4gICAgdmFyIHN0b3JlTmFtZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogX2RlZmF1bHRTdG9yZU5hbWU7XG5cbiAgICByZXR1cm4gX3ByZXNlbnRLZXlbc3RvcmVOYW1lXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldE5ld0tleSgpIHtcbiAgICB2YXIgc3RvcmVOYW1lID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiBfZGVmYXVsdFN0b3JlTmFtZTtcblxuICAgIF9wcmVzZW50S2V5W3N0b3JlTmFtZV0gKz0gMTtcblxuICAgIHJldHVybiBfcHJlc2VudEtleVtzdG9yZU5hbWVdO1xuICB9XG5cbiAgLyogQ1JVRCAqL1xuXG4gIGZ1bmN0aW9uIGFkZEl0ZW0obmV3RGF0YSwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHN0b3JlTmFtZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDogX2RlZmF1bHRTdG9yZU5hbWU7XG5cbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcbiAgICB2YXIgYWRkUmVxdWVzdCA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHN0b3JlTmFtZSkuYWRkKG5ld0RhdGEpO1xuXG4gICAgYWRkUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBhZGRTdWNjZXNzKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgYWRkICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgYWRkUmVxdWVzdC5zb3VyY2Uua2V5UGF0aCArICcgID0gJyArIG5ld0RhdGFbYWRkUmVxdWVzdC5zb3VyY2Uua2V5UGF0aF0gKyAnIGRhdGEgc3VjY2VlZCA6KScpO1xuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2sobmV3RGF0YSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEl0ZW0oa2V5LCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgc3RvcmVOYW1lID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiBfZGVmYXVsdFN0b3JlTmFtZTtcblxuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSk7XG4gICAgdmFyIGdldFJlcXVlc3QgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpLmdldChwYXJzZUludChrZXksIDEwKSk7IC8vIGdldCBpdCBieSBpbmRleFxuXG4gICAgZ2V0UmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRTdWNjZXNzKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgZ2V0ICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgZ2V0UmVxdWVzdC5zb3VyY2Uua2V5UGF0aCArICcgPSAnICsga2V5ICsgJyBkYXRhIHN1Y2Nlc3MgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKGdldFJlcXVlc3QucmVzdWx0KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLy8gZ2V0IGNvbmRpdGlvbmFsIGRhdGEgKGJvb2xlYW4gY29uZGl0aW9uKVxuICBmdW5jdGlvbiBnZXRXaGV0aGVyQ29uZGl0aW9uSXRlbShjb25kaXRpb24sIHdoZXRoZXIsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMyAmJiBhcmd1bWVudHNbM10gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1szXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuXG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdKTtcbiAgICB2YXIgcmVzdWx0ID0gW107IC8vIHVzZSBhbiBhcnJheSB0byBzdG9yYWdlIGVsaWdpYmxlIGRhdGFcblxuICAgIF9nZXRBbGxSZXF1ZXN0KHRyYW5zYWN0aW9uLCBzdG9yZU5hbWUpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGdldEFsbFN1Y2Nlc3MoZSkge1xuICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICBpZiAod2hldGhlcikge1xuICAgICAgICAgIGlmIChjdXJzb3IudmFsdWVbY29uZGl0aW9uXSkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goY3Vyc29yLnZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIXdoZXRoZXIpIHtcbiAgICAgICAgICBpZiAoIWN1cnNvci52YWx1ZVtjb25kaXRpb25dKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChjdXJzb3IudmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSBmdW5jdGlvbiBjb21wbGV0ZUFkZEFsbCgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGdldCAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgJyArIGNvbmRpdGlvbiArICcgPSAnICsgd2hldGhlciArICcgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXN1bHQpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBnZXRBbGwoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHN0b3JlTmFtZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogX2RlZmF1bHRTdG9yZU5hbWU7XG5cbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0pO1xuICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgIF9nZXRBbGxSZXF1ZXN0KHRyYW5zYWN0aW9uLCBzdG9yZU5hbWUpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGdldEFsbFN1Y2Nlc3MoZSkge1xuICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICByZXN1bHQucHVzaChjdXJzb3IudmFsdWUpO1xuICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSBmdW5jdGlvbiBjb21wbGV0ZUdldEFsbCgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGdldCAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgYWxsIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzdWx0KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlSXRlbShrZXksIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuXG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdLCAncmVhZHdyaXRlJyk7XG4gICAgdmFyIGRlbGV0ZVJlcXVlc3QgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpLmRlbGV0ZShrZXkpO1xuXG4gICAgZGVsZXRlUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBkZWxldGVTdWNjZXNzKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgcmVtb3ZlICcgKyBzdG9yZU5hbWUgKyAnXFwncyAgJyArIGRlbGV0ZVJlcXVlc3Quc291cmNlLmtleVBhdGggKyAnID0gJyArIGtleSArICcgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhrZXkpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmVXaGV0aGVyQ29uZGl0aW9uSXRlbShjb25kaXRpb24sIHdoZXRoZXIsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBzdG9yZU5hbWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMyAmJiBhcmd1bWVudHNbM10gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1szXSA6IF9kZWZhdWx0U3RvcmVOYW1lO1xuXG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdLCAncmVhZHdyaXRlJyk7XG5cbiAgICBfZ2V0QWxsUmVxdWVzdCh0cmFuc2FjdGlvbiwgc3RvcmVOYW1lKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRBbGxTdWNjZXNzKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgaWYgKHdoZXRoZXIpIHtcbiAgICAgICAgICBpZiAoY3Vyc29yLnZhbHVlW2NvbmRpdGlvbl0pIHtcbiAgICAgICAgICAgIGN1cnNvci5kZWxldGUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIXdoZXRoZXIpIHtcbiAgICAgICAgICBpZiAoIWN1cnNvci52YWx1ZVtjb25kaXRpb25dKSB7XG4gICAgICAgICAgICBjdXJzb3IuZGVsZXRlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfVxuICAgIH07XG4gICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGNvbXBsZXRlUmVtb3ZlV2hldGhlcigpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIHJlbW92ZSAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgJyArIGNvbmRpdGlvbiArICcgPSAnICsgd2hldGhlciArICcgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjaygpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhcihzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgc3RvcmVOYW1lID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiBfZGVmYXVsdFN0b3JlTmFtZTtcblxuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuXG4gICAgX2dldEFsbFJlcXVlc3QodHJhbnNhY3Rpb24sIHN0b3JlTmFtZSkub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0QWxsU3VjY2VzcyhlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIGN1cnNvci5kZWxldGUoKTtcbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gY29tcGxldGVDbGVhcigpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGNsZWFyICcgKyBzdG9yZU5hbWUgKyAnXFwncyBhbGwgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjaygnY2xlYXIgYWxsIGRhdGEgc3VjY2VzcycpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyB1cGRhdGUgb25lXG4gIGZ1bmN0aW9uIHVwZGF0ZUl0ZW0obmV3RGF0YSwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHN0b3JlTmFtZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDogX2RlZmF1bHRTdG9yZU5hbWU7XG5cbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcbiAgICB2YXIgcHV0UmVxdWVzdCA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHN0b3JlTmFtZSkucHV0KG5ld0RhdGEpO1xuXG4gICAgcHV0UmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBwdXRTdWNjZXNzKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgdXBkYXRlICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgcHV0UmVxdWVzdC5zb3VyY2Uua2V5UGF0aCArICcgID0gJyArIG5ld0RhdGFbcHV0UmVxdWVzdC5zb3VyY2Uua2V5UGF0aF0gKyAnIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2sobmV3RGF0YSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9nZXRBbGxSZXF1ZXN0KHRyYW5zYWN0aW9uLCBzdG9yZU5hbWUpIHtcbiAgICByZXR1cm4gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKS5vcGVuQ3Vyc29yKElEQktleVJhbmdlLmxvd2VyQm91bmQoMSksICduZXh0Jyk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG9wZW46IG9wZW4sXG4gICAgZ2V0TGVuZ3RoOiBnZXRMZW5ndGgsXG4gICAgZ2V0TmV3S2V5OiBnZXROZXdLZXksXG4gICAgZ2V0SXRlbTogZ2V0SXRlbSxcbiAgICBnZXRXaGV0aGVyQ29uZGl0aW9uSXRlbTogZ2V0V2hldGhlckNvbmRpdGlvbkl0ZW0sXG4gICAgZ2V0QWxsOiBnZXRBbGwsXG4gICAgYWRkSXRlbTogYWRkSXRlbSxcbiAgICByZW1vdmVJdGVtOiByZW1vdmVJdGVtLFxuICAgIHJlbW92ZVdoZXRoZXJDb25kaXRpb25JdGVtOiByZW1vdmVXaGV0aGVyQ29uZGl0aW9uSXRlbSxcbiAgICBjbGVhcjogY2xlYXIsXG4gICAgdXBkYXRlSXRlbTogdXBkYXRlSXRlbVxuICB9O1xufSgpO1xuXG5leHBvcnRzLmRlZmF1bHQgPSBJbmRleGVkREJIYW5kbGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXhlZGRiLWNydWQuanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2Rpc3QvaW5kZXhlZGRiLWNydWQnKVsnZGVmYXVsdCddO1xuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG5hbWU6ICdKdXN0VG9EbycsXG4gIHZlcnNpb246ICcyMycsXG4gIHN0b3JlQ29uZmlnOiBbXG4gICAge1xuICAgICAgc3RvcmVOYW1lOiAnbGlzdCcsXG4gICAgICBrZXk6ICdpZCcsXG4gICAgICBpbml0aWFsRGF0YTogW1xuICAgICAgICB7IGlkOiAwLCBldmVudDogJ0p1c3REZW1vJywgZmluaXNoZWQ6IHRydWUsIGRhdGU6IDAgfVxuICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgc3RvcmVOYW1lOiAnYXBob3Jpc20nLFxuICAgICAga2V5OiAnaWQnLFxuICAgICAgaW5pdGlhbERhdGE6IFtcbiAgICAgICAge1xuICAgICAgICAgICdpZCc6IDEsXG4gICAgICAgICAgJ2NvbnRlbnQnOiBcIllvdSdyZSBiZXR0ZXIgdGhhbiB0aGF0XCJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICdpZCc6IDIsXG4gICAgICAgICAgJ2NvbnRlbnQnOiAnWWVzdGVyZGF5IFlvdSBTYWlkIFRvbW9ycm93J1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgJ2lkJzogMyxcbiAgICAgICAgICAnY29udGVudCc6ICdXaHkgYXJlIHdlIGhlcmU/J1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgJ2lkJzogNCxcbiAgICAgICAgICAnY29udGVudCc6ICdBbGwgaW4sIG9yIG5vdGhpbmcnXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAnaWQnOiA1LFxuICAgICAgICAgICdjb250ZW50JzogJ1lvdSBOZXZlciBUcnksIFlvdSBOZXZlciBLbm93J1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgJ2lkJzogNixcbiAgICAgICAgICAnY29udGVudCc6ICdUaGUgdW5leGFtaW5lZCBsaWZlIGlzIG5vdCB3b3J0aCBsaXZpbmcuIC0tIFNvY3JhdGVzJ1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgJ2lkJzogNyxcbiAgICAgICAgICAnY29udGVudCc6ICdUaGVyZSBpcyBvbmx5IG9uZSB0aGluZyB3ZSBzYXkgdG8gbGF6eTogTk9UIFRPREFZJ1xuICAgICAgICB9XG4gICAgICBdXG4gICAgfVxuICBdXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuKGZ1bmN0aW9uIGluaXQoKSB7XG4gIHZhciBEQiA9IHJlcXVpcmUoJ2luZGV4ZWRkYi1jcnVkJyk7XG4gIHZhciBjb25maWcgPSByZXF1aXJlKCcuL2RiL2NvbmZpZycpO1xuICB2YXIgYWRkRXZlbnRzID0gcmVxdWlyZSgnLi91dGxpcy9kYlN1Y2Nlc3MvYWRkRXZlbnRzJyk7XG4gIHZhciBsYXp5TG9hZFdpdGhvdXREQiA9IHJlcXVpcmUoJy4vdXRsaXMvbGF6eUxvYWRXaXRob3V0REInKTtcbiAgdmFyIHRlbXBsZXRlID0gcmVxdWlyZSgnLi4vLi4vdGVtcGxldGUvdGVtcGxhdGUnKTtcblxuICB0ZW1wbGV0ZSgpO1xuICAvLyBvcGVuIERCLCBhbmQgd2hlbiBEQiBvcGVuIHN1Y2NlZWQsIGludm9rZSBpbml0aWFsIGZ1bmN0aW9uXG4gIERCLm9wZW4oY29uZmlnLCBhZGRFdmVudHMsIGxhenlMb2FkV2l0aG91dERCKTtcbn0oKSk7XG4iLCIndXNlIHN0cmljdCc7XG5mdW5jdGlvbiBjbGVhckNoaWxkTm9kZXMocm9vdCkge1xuICB3aGlsZSAocm9vdC5oYXNDaGlsZE5vZGVzKCkpIHsgLy8gb3Igcm9vdC5maXJzdENoaWxkIG9yIHJvb3QubGFzdENoaWxkXG4gICAgcm9vdC5yZW1vdmVDaGlsZChyb290LmZpcnN0Q2hpbGQpO1xuICB9XG4gIC8vIG9yIHJvb3QuaW5uZXJIVE1MID0gJydcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjbGVhckNoaWxkTm9kZXM7XG4iLCIndXNlIHN0cmljdCc7XG5mdW5jdGlvbiBhZGRFdmVudHNHZW5lcmF0b3IoaGFuZGxlcikge1xuICB2YXIgbGlzdDtcblxuICBoYW5kbGVyLnNob3dJbml0KCk7XG4gIC8vIGFkZCBhbGwgZXZlbnRMaXN0ZW5lclxuICBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgbGlzdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuY2xpY2tMaSwgZmFsc2UpO1xuICBsaXN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5yZW1vdmVMaSwgZmFsc2UpO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlci5lbnRlckFkZCwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWRkJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLmFkZCwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0RvbmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0RvbmUsIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dUb2RvJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dUb2RvLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93QWxsJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dBbGwsIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dDbGVhckRvbmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0NsZWFyRG9uZSwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0NsZWFyJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dDbGVhciwgZmFsc2UpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFkZEV2ZW50c0dlbmVyYXRvcjtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBldmVudHNIYW5kbGVyR2VuZXJhbCA9IChmdW5jdGlvbiBnZW5lcmFsR2VuZXJhdG9yKCkge1xuICB2YXIgZ2V0Rm9ybWF0RGF0ZSA9IHJlcXVpcmUoJy4uL2dldEZvcm1hdERhdGUnKTtcblxuICBmdW5jdGlvbiByZXNldElucHV0KCkge1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNpbnB1dCcpLnZhbHVlID0gJyc7XG4gIH1cblxuICBmdW5jdGlvbiBkYXRhR2VuZXJhdG9yKGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IGtleSxcbiAgICAgIGV2ZW50OiB2YWx1ZSxcbiAgICAgIGZpbmlzaGVkOiBmYWxzZSxcbiAgICAgIGRhdGU6IGdldEZvcm1hdERhdGUoJ01N5pyIZGTml6VoaDptbScpICsgJyAnXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcmVzZXRJbnB1dDogcmVzZXRJbnB1dCxcbiAgICBkYXRhR2VuZXJhdG9yOiBkYXRhR2VuZXJhdG9yXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV2ZW50c0hhbmRsZXJHZW5lcmFsO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIHJlZnJlc2hHZW5lcmFsID0gKGZ1bmN0aW9uIGdlbmVyYWxHZW5lcmF0b3IoKSB7XG4gIHZhciBzZW50ZW5jZUdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL3RlbXBsZXRlL3NlbnRlbmNlR2VuZXJhdG9yJyk7XG4gIHZhciBpdGVtR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vdGVtcGxldGUvaXRlbUdlbmVyYXRvcicpO1xuICB2YXIgY2xlYXJDaGlsZE5vZGVzID0gcmVxdWlyZSgnLi4vY2xlYXJDaGlsZE5vZGVzJyk7XG5cbiAgZnVuY3Rpb24gaW5pdChkYXRhQXJyKSB7XG4gICAgX3Nob3coZGF0YUFyciwgX2luaXRTZW50ZW5jZSwgX3JlbmRlckFsbCk7XG4gIH1cblxuICBmdW5jdGlvbiBfc2hvdyhkYXRhQXJyLCBzaG93U2VudGVuY2VGdW5jLCBnZW5lcmF0ZUZ1bmMpIHtcbiAgICBpZiAoIWRhdGFBcnIgfHwgZGF0YUFyci5sZW5ndGggPT09IDApIHtcbiAgICAgIHNob3dTZW50ZW5jZUZ1bmMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5pbm5lckhUTUwgPSBnZW5lcmF0ZUZ1bmMoZGF0YUFycik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX2luaXRTZW50ZW5jZSgpIHtcbiAgICB2YXIgdGV4dCA9ICdXZWxjb21lfiwgdHJ5IHRvIGFkZCB5b3VyIGZpcnN0IHRvLWRvIGxpc3QgOiApJztcblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuaW5uZXJIVE1MID0gc2VudGVuY2VHZW5lcmF0b3IodGV4dCk7XG4gIH1cblxuICBmdW5jdGlvbiBhbGwocmFuZG9tQXBob3Jpc20sIGRhdGFBcnIpIHtcbiAgICBfc2hvdyhkYXRhQXJyLCByYW5kb21BcGhvcmlzbSwgX3JlbmRlckFsbCk7XG4gIH1cblxuICBmdW5jdGlvbiBfcmVuZGVyQWxsKGRhdGFBcnIpIHtcbiAgICB2YXIgY2xhc3NpZmllZERhdGEgPSBfY2xhc3NpZnlEYXRhKGRhdGFBcnIpO1xuXG4gICAgcmV0dXJuIGl0ZW1HZW5lcmF0b3IoY2xhc3NpZmllZERhdGEpO1xuICB9XG5cbiAgZnVuY3Rpb24gX2NsYXNzaWZ5RGF0YShkYXRhQXJyKSB7XG4gICAgdmFyIGZpbmlzaGVkID0gW107XG4gICAgdmFyIHVuZmlzaGllZCA9IFtdO1xuXG4gICAgLy8gcHV0IHRoZSBmaW5pc2hlZCBpdGVtIHRvIHRoZSBib3R0b21cbiAgICBkYXRhQXJyLmZvckVhY2goZnVuY3Rpb24gY2xhc3NpZnkoZGF0YSkge1xuICAgICAgZGF0YS5maW5pc2hlZCA/IGZpbmlzaGVkLnVuc2hpZnQoZGF0YSkgOiB1bmZpc2hpZWQudW5zaGlmdChkYXRhKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB1bmZpc2hpZWQuY29uY2F0KGZpbmlzaGVkKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnQocmFuZG9tQXBob3Jpc20sIGRhdGFBcnIpIHtcbiAgICBfc2hvdyhkYXRhQXJyLCByYW5kb21BcGhvcmlzbSwgX3JlbmRlclBhcnQpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3JlbmRlclBhcnQoZGF0YUFycikge1xuICAgIHJldHVybiBpdGVtR2VuZXJhdG9yKGRhdGFBcnIucmV2ZXJzZSgpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIGNsZWFyQ2hpbGROb2Rlcyhkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbnRlbmNlSGFuZGxlcih0ZXh0KSB7XG4gICAgdmFyIHJlbmRlcmVkID0gc2VudGVuY2VHZW5lcmF0b3IodGV4dCk7XG5cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmlubmVySFRNTCA9IHJlbmRlcmVkO1xuICB9XG5cblxuICByZXR1cm4ge1xuICAgIGluaXQ6IGluaXQsXG4gICAgYWxsOiBhbGwsXG4gICAgcGFydDogcGFydCxcbiAgICBjbGVhcjogY2xlYXIsXG4gICAgc2VudGVuY2VIYW5kbGVyOiBzZW50ZW5jZUhhbmRsZXJcbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVmcmVzaEdlbmVyYWw7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgYWRkRXZlbnRzID0gKGZ1bmN0aW9uIGRiU3VjY2Vzc0dlbmVyYXRvcigpIHtcbiAgdmFyIGFkZEV2ZW50c0dlbmVyYXRvciA9IHJlcXVpcmUoJy4uL2RiR2VuZXJhbC9hZGRFdmVudHNHZW5lcmF0b3InKTtcbiAgdmFyIGV2ZW50c0hhbmRsZXIgPSByZXF1aXJlKCcuLi9kYlN1Y2Nlc3MvZXZlbnRzSGFuZGxlcicpO1xuXG4gIHJldHVybiBmdW5jdGlvbiBoYW5kbGVyKCkge1xuICAgIGFkZEV2ZW50c0dlbmVyYXRvcihldmVudHNIYW5kbGVyKTtcbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gYWRkRXZlbnRzO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGV2ZW50c0hhbmRsZXIgPSAoZnVuY3Rpb24gZGJTdWNjZXNzR2VuZXJhdG9yKCkge1xuICB2YXIgREIgPSByZXF1aXJlKCdpbmRleGVkZGItY3J1ZCcpO1xuICB2YXIgcmVmcmVzaCA9IHJlcXVpcmUoJy4uL2RiU3VjY2Vzcy9yZWZyZXNoJyk7XG4gIHZhciBnZW5lcmFsID0gcmVxdWlyZSgnLi4vZGJHZW5lcmFsL2V2ZW50c0hhbmRsZXJHZW5lcmFsJyk7XG4gIHZhciBpdGVtR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vdGVtcGxldGUvaXRlbUdlbmVyYXRvcicpO1xuXG4gIGZ1bmN0aW9uIGFkZCgpIHtcbiAgICB2YXIgaW5wdXRWYWx1ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNpbnB1dCcpLnZhbHVlO1xuXG4gICAgaWYgKGlucHV0VmFsdWUgPT09ICcnKSB7XG4gICAgICB3aW5kb3cuYWxlcnQoJ3BsZWFzZSBpbnB1dCBhIHJlYWwgZGF0YX4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgX2FkZEhhbmRsZXIoaW5wdXRWYWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX2FkZEhhbmRsZXIoaW5wdXRWYWx1ZSkge1xuICAgIHZhciBuZXdEYXRhID0gZ2VuZXJhbC5kYXRhR2VuZXJhdG9yKERCLmdldE5ld0tleSgpLCBpbnB1dFZhbHVlKTtcbiAgICB2YXIgcmVuZGVyZWQgPSBpdGVtR2VuZXJhdG9yKG5ld0RhdGEpO1xuXG4gICAgLy8gY29uc29sZS5sb2coREIuZ2V0TmV3S2V5KCkpO1xuICAgIHJlbW92ZUluaXQoKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmluc2VydEFkamFjZW50SFRNTCgnYWZ0ZXJiZWdpbicsIHJlbmRlcmVkKTsgLy8gUFVOQ0hMSU5FOiB1c2UgaW5zZXJ0QWRqYWNlbnRIVE1MXG4gICAgZ2VuZXJhbC5yZXNldElucHV0KCk7XG4gICAgREIuYWRkSXRlbShuZXdEYXRhKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZUluaXQoKSB7XG4gICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gICAgaWYgKGxpc3QuZmlyc3RDaGlsZC5jbGFzc05hbWUgPT09ICdhcGhvcmlzbScpIHtcbiAgICAgIGxpc3QucmVtb3ZlQ2hpbGQobGlzdC5maXJzdENoaWxkKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBlbnRlckFkZChlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgIGFkZCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsaWNrTGkoZSkge1xuICAgIHZhciBpZDtcbiAgICB2YXIgdGFyZ2V0TGkgPSBlLnRhcmdldDtcbiAgICAvLyB1c2UgZXZlbnQgZGVsZWdhdGlvblxuXG4gICAgaWYgKCF0YXJnZXRMaS5jbGFzc0xpc3QuY29udGFpbnMoJ2FwaG9yaXNtJykpIHtcbiAgICAgIGlmICh0YXJnZXRMaS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSkge1xuICAgICAgICB0YXJnZXRMaS5jbGFzc0xpc3QudG9nZ2xlKCdmaW5pc2hlZCcpOyAvLyB0b2dnbGUgYXBwZWFyYW5jZVxuICAgICAgICBpZCA9IHBhcnNlSW50KHRhcmdldExpLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpLCAxMCk7IC8vIHVzZSBwcmV2aW91c2x5IHN0b3JlZCBkYXRhLWlkIGF0dHJpYnV0ZVxuICAgICAgICBEQi5nZXRJdGVtKGlkLCBfdG9nZ2xlTGkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF90b2dnbGVMaShkYXRhKSB7XG4gICAgZGF0YS5maW5pc2hlZCA9ICFkYXRhLmZpbmlzaGVkO1xuICAgIERCLnVwZGF0ZUl0ZW0oZGF0YSwgc2hvd0FsbCk7XG4gIH1cblxuICAvLyBsaSdzIFt4XSdzIGRlbGV0ZVxuICBmdW5jdGlvbiByZW1vdmVMaShlKSB7XG4gICAgdmFyIGlkO1xuXG4gICAgaWYgKGUudGFyZ2V0LmNsYXNzTmFtZSA9PT0gJ2Nsb3NlJykgeyAvLyB1c2UgZXZlbnQgZGVsZWdhdGlvblxuICAgICAgLy8gZGVsZXRlIHZpc3VhbGx5XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLnJlbW92ZUNoaWxkKGUudGFyZ2V0LnBhcmVudE5vZGUpO1xuICAgICAgX2FkZFJhbmRvbSgpO1xuICAgICAgLy8gdXNlIHByZXZpb3VzbHkgc3RvcmVkIGRhdGFcbiAgICAgIGlkID0gcGFyc2VJbnQoZS50YXJnZXQucGFyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSwgMTApO1xuICAgICAgLy8gZGVsZXRlIGFjdHVhbGx5XG4gICAgICBEQi5yZW1vdmVJdGVtKGlkKTtcbiAgICB9XG4gIH1cblxuICAvLyBmb3IgU2VtYW50aWNcbiAgZnVuY3Rpb24gX2FkZFJhbmRvbSgpIHtcbiAgICB2YXIgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG5cbiAgICBpZiAoIWxpc3QuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICByZWZyZXNoLnJhbmRvbSgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dJbml0KCkge1xuICAgIERCLmdldEFsbChyZWZyZXNoLmluaXQpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0FsbCgpIHtcbiAgICBEQi5nZXRBbGwocmVmcmVzaC5hbGwpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0RvbmUoKSB7XG4gICAgX3Nob3dXaGV0aGVyRG9uZSh0cnVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dUb2RvKCkge1xuICAgIF9zaG93V2hldGhlckRvbmUoZmFsc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3Nob3dXaGV0aGVyRG9uZSh3aGV0aGVyRG9uZSkge1xuICAgIHZhciBjb25kaXRpb24gPSAnZmluaXNoZWQnO1xuXG4gICAgREIuZ2V0V2hldGhlckNvbmRpdGlvbkl0ZW0oY29uZGl0aW9uLCB3aGV0aGVyRG9uZSwgcmVmcmVzaC5wYXJ0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dDbGVhckRvbmUoKSB7XG4gICAgdmFyIGNvbmRpdGlvbiA9ICdmaW5pc2hlZCc7XG5cbiAgICBEQi5yZW1vdmVXaGV0aGVyQ29uZGl0aW9uSXRlbShjb25kaXRpb24sIHRydWUsIGZ1bmN0aW9uIHNob3dMZWZ0RGF0YSgpIHtcbiAgICAgIERCLmdldEFsbChyZWZyZXNoLnBhcnQpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0NsZWFyKCkge1xuICAgIHJlZnJlc2guY2xlYXIoKTsgLy8gY2xlYXIgbm9kZXMgdmlzdWFsbHlcbiAgICByZWZyZXNoLnJhbmRvbSgpO1xuICAgIERCLmNsZWFyKCk7IC8vIGNsZWFyIGRhdGEgaW5kZWVkXG4gIH1cblxuICByZXR1cm4ge1xuICAgIGFkZDogYWRkLFxuICAgIGVudGVyQWRkOiBlbnRlckFkZCxcbiAgICBjbGlja0xpOiBjbGlja0xpLFxuICAgIHJlbW92ZUxpOiByZW1vdmVMaSxcbiAgICBzaG93SW5pdDogc2hvd0luaXQsXG4gICAgc2hvd0FsbDogc2hvd0FsbCxcbiAgICBzaG93RG9uZTogc2hvd0RvbmUsXG4gICAgc2hvd1RvZG86IHNob3dUb2RvLFxuICAgIHNob3dDbGVhckRvbmU6IHNob3dDbGVhckRvbmUsXG4gICAgc2hvd0NsZWFyOiBzaG93Q2xlYXJcbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZXZlbnRzSGFuZGxlcjtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciByZWZyZXNoID0gKGZ1bmN0aW9uIGRiU3VjY2Vzc0dlbmVyYXRvcigpIHtcbiAgdmFyIERCID0gcmVxdWlyZSgnaW5kZXhlZGRiLWNydWQnKTtcbiAgdmFyIGdlbmVyYWwgPSByZXF1aXJlKCcuLi9kYkdlbmVyYWwvcmVmcmVzaEdlbmVyYWwnKTtcblxuICBmdW5jdGlvbiByYW5kb21BcGhvcmlzbSgpIHtcbiAgICB2YXIgc3RvcmVOYW1lID0gJ2FwaG9yaXNtJztcbiAgICB2YXIgcmFuZG9tSW5kZXggPSBNYXRoLmNlaWwoTWF0aC5yYW5kb20oKSAqIERCLmdldExlbmd0aChzdG9yZU5hbWUpKTtcblxuICAgIERCLmdldEl0ZW0ocmFuZG9tSW5kZXgsIF9wYXJzZVRleHQsIHN0b3JlTmFtZSk7XG4gIH1cblxuICBmdW5jdGlvbiBfcGFyc2VUZXh0KGRhdGEpIHtcbiAgICB2YXIgdGV4dCA9IGRhdGEuY29udGVudDtcblxuICAgIGdlbmVyYWwuc2VudGVuY2VIYW5kbGVyKHRleHQpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpbml0OiBnZW5lcmFsLmluaXQsXG4gICAgYWxsOiBnZW5lcmFsLmFsbC5iaW5kKG51bGwsIHJhbmRvbUFwaG9yaXNtKSwgIC8vIFBVTkNITElORTogdXNlIGJpbmQgdG8gcGFzcyBwYXJhbXRlclxuICAgIHBhcnQ6IGdlbmVyYWwucGFydC5iaW5kKG51bGwsIHJhbmRvbUFwaG9yaXNtKSxcbiAgICBjbGVhcjogZ2VuZXJhbC5jbGVhcixcbiAgICByYW5kb206IHJhbmRvbUFwaG9yaXNtXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZnJlc2g7XG4iLCIndXNlIHN0cmljdCc7XG5mdW5jdGlvbiBnZXRGb3JtYXREYXRlKGZtdCkge1xuICB2YXIgbmV3RGF0ZSA9IG5ldyBEYXRlKCk7XG4gIHZhciBuZXdmbXQgPSBmbXQ7XG4gIHZhciBvID0ge1xuICAgICd5Kyc6IG5ld0RhdGUuZ2V0RnVsbFllYXIoKSxcbiAgICAnTSsnOiBuZXdEYXRlLmdldE1vbnRoKCkgKyAxLFxuICAgICdkKyc6IG5ld0RhdGUuZ2V0RGF0ZSgpLFxuICAgICdoKyc6IG5ld0RhdGUuZ2V0SG91cnMoKSxcbiAgICAnbSsnOiBuZXdEYXRlLmdldE1pbnV0ZXMoKVxuICB9O1xuICB2YXIgbGVucztcblxuICBmb3IgKHZhciBrIGluIG8pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnKCcgKyBrICsgJyknKS50ZXN0KG5ld2ZtdCkpIHtcbiAgICAgIGlmIChrID09PSAneSsnKSB7XG4gICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKCcnICsgb1trXSkuc3Vic3RyKDQgLSBSZWdFeHAuJDEubGVuZ3RoKSk7XG4gICAgICB9IGVsc2UgaWYgKGsgPT09ICdTKycpIHtcbiAgICAgICAgbGVucyA9IFJlZ0V4cC4kMS5sZW5ndGg7XG4gICAgICAgIGxlbnMgPSBsZW5zID09PSAxID8gMyA6IGxlbnM7XG4gICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKCcwMCcgKyBvW2tdKS5zdWJzdHIoKCcnICsgb1trXSkubGVuZ3RoIC0gMSwgbGVucykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoUmVnRXhwLiQxLmxlbmd0aCA9PT0gMSkgPyAob1trXSkgOiAoKCcwMCcgKyBvW2tdKS5zdWJzdHIoKCcnICsgb1trXSkubGVuZ3RoKSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuZXdmbXQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0Rm9ybWF0RGF0ZTtcbiIsIid1c2Ugc3RyaWN0JztcbmZ1bmN0aW9uIGxhenlMb2FkV2l0aG91dERCKCkge1xuICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuXG4gIGVsZW1lbnQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xuICBlbGVtZW50LmFzeW5jID0gdHJ1ZTtcbiAgZWxlbWVudC5zcmMgPSAnLi9kaXN0L3NjcmlwdHMvbGF6eUxvYWQubWluLmpzJztcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbGVtZW50KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBsYXp5TG9hZFdpdGhvdXREQjtcbiIsIid1c2Ugc3RyaWN0JztcbmZ1bmN0aW9uIGl0ZW1HZW5lcmF0b3IoZGF0YUFycikge1xuICB2YXIgcmVzdWx0ID0gZGF0YUFycjtcbiAgdmFyIHJlbmRlcmVkO1xuICB2YXIgdGVtcGxhdGUgPSBIYW5kbGViYXJzLnRlbXBsYXRlcy5saTtcblxuICBpZiAoIUFycmF5LmlzQXJyYXkoZGF0YUFycikpIHtcbiAgICByZXN1bHQgPSBbZGF0YUFycl07XG4gIH1cbiAgcmVuZGVyZWQgPSB0ZW1wbGF0ZSh7bGlzdEl0ZW1zOiByZXN1bHR9KTtcblxuICByZXR1cm4gcmVuZGVyZWQudHJpbSgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGl0ZW1HZW5lcmF0b3I7XG4iLCIndXNlIHN0cmljdCc7XG5mdW5jdGlvbiBzZW50ZW5jZUdlbmVyYXRvcih0ZXh0KSB7XG4gIHZhciB0ZW1wbGF0ZSA9IEhhbmRsZWJhcnMudGVtcGxhdGVzLmxpO1xuICB2YXIgcmVuZGVyZWQgPSB0ZW1wbGF0ZSh7XCJzZW50ZW5jZVwiOiB0ZXh0fSk7XG5cbiAgcmV0dXJuIHJlbmRlcmVkLnRyaW0oKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZW50ZW5jZUdlbmVyYXRvcjtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHZhciB0ZW1wbGF0ZSA9IEhhbmRsZWJhcnMudGVtcGxhdGUsIHRlbXBsYXRlcyA9IEhhbmRsZWJhcnMudGVtcGxhdGVzID0gSGFuZGxlYmFycy50ZW1wbGF0ZXMgfHwge307XG50ZW1wbGF0ZXNbJ2xpJ10gPSB0ZW1wbGF0ZSh7XCIxXCI6ZnVuY3Rpb24oY29udGFpbmVyLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgICB2YXIgaGVscGVyO1xuXG4gIHJldHVybiBcIiAgPGxpIGNsYXNzPVxcXCJhcGhvcmlzbVxcXCI+XCJcbiAgICArIGNvbnRhaW5lci5lc2NhcGVFeHByZXNzaW9uKCgoaGVscGVyID0gKGhlbHBlciA9IGhlbHBlcnMuc2VudGVuY2UgfHwgKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLnNlbnRlbmNlIDogZGVwdGgwKSkgIT0gbnVsbCA/IGhlbHBlciA6IGhlbHBlcnMuaGVscGVyTWlzc2luZyksKHR5cGVvZiBoZWxwZXIgPT09IFwiZnVuY3Rpb25cIiA/IGhlbHBlci5jYWxsKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwIDogKGNvbnRhaW5lci5udWxsQ29udGV4dCB8fCB7fSkse1wibmFtZVwiOlwic2VudGVuY2VcIixcImhhc2hcIjp7fSxcImRhdGFcIjpkYXRhfSkgOiBoZWxwZXIpKSlcbiAgICArIFwiPC9saT5cXG5cIjtcbn0sXCIzXCI6ZnVuY3Rpb24oY29udGFpbmVyLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgICB2YXIgc3RhY2sxO1xuXG4gIHJldHVybiAoKHN0YWNrMSA9IGhlbHBlcnMuZWFjaC5jYWxsKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwIDogKGNvbnRhaW5lci5udWxsQ29udGV4dCB8fCB7fSksKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmxpc3RJdGVtcyA6IGRlcHRoMCkse1wibmFtZVwiOlwiZWFjaFwiLFwiaGFzaFwiOnt9LFwiZm5cIjpjb250YWluZXIucHJvZ3JhbSg0LCBkYXRhLCAwKSxcImludmVyc2VcIjpjb250YWluZXIubm9vcCxcImRhdGFcIjpkYXRhfSkpICE9IG51bGwgPyBzdGFjazEgOiBcIlwiKTtcbn0sXCI0XCI6ZnVuY3Rpb24oY29udGFpbmVyLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgICB2YXIgc3RhY2sxO1xuXG4gIHJldHVybiAoKHN0YWNrMSA9IGhlbHBlcnNbXCJpZlwiXS5jYWxsKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwIDogKGNvbnRhaW5lci5udWxsQ29udGV4dCB8fCB7fSksKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmZpbmlzaGVkIDogZGVwdGgwKSx7XCJuYW1lXCI6XCJpZlwiLFwiaGFzaFwiOnt9LFwiZm5cIjpjb250YWluZXIucHJvZ3JhbSg1LCBkYXRhLCAwKSxcImludmVyc2VcIjpjb250YWluZXIucHJvZ3JhbSg3LCBkYXRhLCAwKSxcImRhdGFcIjpkYXRhfSkpICE9IG51bGwgPyBzdGFjazEgOiBcIlwiKTtcbn0sXCI1XCI6ZnVuY3Rpb24oY29udGFpbmVyLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgICB2YXIgaGVscGVyLCBhbGlhczE9ZGVwdGgwICE9IG51bGwgPyBkZXB0aDAgOiAoY29udGFpbmVyLm51bGxDb250ZXh0IHx8IHt9KSwgYWxpYXMyPWhlbHBlcnMuaGVscGVyTWlzc2luZywgYWxpYXMzPVwiZnVuY3Rpb25cIiwgYWxpYXM0PWNvbnRhaW5lci5lc2NhcGVFeHByZXNzaW9uO1xuXG4gIHJldHVybiBcIiAgICAgIDxsaSBjbGFzcz1cXFwiZmluaXNoZWRcXFwiIGRhdGEtaWQ9XCJcbiAgICArIGFsaWFzNCgoKGhlbHBlciA9IChoZWxwZXIgPSBoZWxwZXJzLmlkIHx8IChkZXB0aDAgIT0gbnVsbCA/IGRlcHRoMC5pZCA6IGRlcHRoMCkpICE9IG51bGwgPyBoZWxwZXIgOiBhbGlhczIpLCh0eXBlb2YgaGVscGVyID09PSBhbGlhczMgPyBoZWxwZXIuY2FsbChhbGlhczEse1wibmFtZVwiOlwiaWRcIixcImhhc2hcIjp7fSxcImRhdGFcIjpkYXRhfSkgOiBoZWxwZXIpKSlcbiAgICArIFwiPlxcbiAgICAgICAgXCJcbiAgICArIGFsaWFzNCgoKGhlbHBlciA9IChoZWxwZXIgPSBoZWxwZXJzLmRhdGUgfHwgKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmRhdGUgOiBkZXB0aDApKSAhPSBudWxsID8gaGVscGVyIDogYWxpYXMyKSwodHlwZW9mIGhlbHBlciA9PT0gYWxpYXMzID8gaGVscGVyLmNhbGwoYWxpYXMxLHtcIm5hbWVcIjpcImRhdGVcIixcImhhc2hcIjp7fSxcImRhdGFcIjpkYXRhfSkgOiBoZWxwZXIpKSlcbiAgICArIFwiIDogXFxuICAgICAgICA8c3Bhbj5cIlxuICAgICsgYWxpYXM0KCgoaGVscGVyID0gKGhlbHBlciA9IGhlbHBlcnMuZXZlbnQgfHwgKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmV2ZW50IDogZGVwdGgwKSkgIT0gbnVsbCA/IGhlbHBlciA6IGFsaWFzMiksKHR5cGVvZiBoZWxwZXIgPT09IGFsaWFzMyA/IGhlbHBlci5jYWxsKGFsaWFzMSx7XCJuYW1lXCI6XCJldmVudFwiLFwiaGFzaFwiOnt9LFwiZGF0YVwiOmRhdGF9KSA6IGhlbHBlcikpKVxuICAgICsgXCI8L3NwYW4+XFxuICAgICAgICA8c3BhbiBjbGFzcz1cXFwiY2xvc2VcXFwiPsOXPC9zcGFuPlxcbiAgICAgIDwvbGk+XFxuXCI7XG59LFwiN1wiOmZ1bmN0aW9uKGNvbnRhaW5lcixkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gICAgdmFyIGhlbHBlciwgYWxpYXMxPWRlcHRoMCAhPSBudWxsID8gZGVwdGgwIDogKGNvbnRhaW5lci5udWxsQ29udGV4dCB8fCB7fSksIGFsaWFzMj1oZWxwZXJzLmhlbHBlck1pc3NpbmcsIGFsaWFzMz1cImZ1bmN0aW9uXCIsIGFsaWFzND1jb250YWluZXIuZXNjYXBlRXhwcmVzc2lvbjtcblxuICByZXR1cm4gXCIgICAgICA8bGkgZGF0YS1pZD1cIlxuICAgICsgYWxpYXM0KCgoaGVscGVyID0gKGhlbHBlciA9IGhlbHBlcnMuaWQgfHwgKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmlkIDogZGVwdGgwKSkgIT0gbnVsbCA/IGhlbHBlciA6IGFsaWFzMiksKHR5cGVvZiBoZWxwZXIgPT09IGFsaWFzMyA/IGhlbHBlci5jYWxsKGFsaWFzMSx7XCJuYW1lXCI6XCJpZFwiLFwiaGFzaFwiOnt9LFwiZGF0YVwiOmRhdGF9KSA6IGhlbHBlcikpKVxuICAgICsgXCI+XFxuICAgICAgICBcIlxuICAgICsgYWxpYXM0KCgoaGVscGVyID0gKGhlbHBlciA9IGhlbHBlcnMuZGF0ZSB8fCAoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuZGF0ZSA6IGRlcHRoMCkpICE9IG51bGwgPyBoZWxwZXIgOiBhbGlhczIpLCh0eXBlb2YgaGVscGVyID09PSBhbGlhczMgPyBoZWxwZXIuY2FsbChhbGlhczEse1wibmFtZVwiOlwiZGF0ZVwiLFwiaGFzaFwiOnt9LFwiZGF0YVwiOmRhdGF9KSA6IGhlbHBlcikpKVxuICAgICsgXCIgOiBcXG4gICAgICAgIDxzcGFuPlwiXG4gICAgKyBhbGlhczQoKChoZWxwZXIgPSAoaGVscGVyID0gaGVscGVycy5ldmVudCB8fCAoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuZXZlbnQgOiBkZXB0aDApKSAhPSBudWxsID8gaGVscGVyIDogYWxpYXMyKSwodHlwZW9mIGhlbHBlciA9PT0gYWxpYXMzID8gaGVscGVyLmNhbGwoYWxpYXMxLHtcIm5hbWVcIjpcImV2ZW50XCIsXCJoYXNoXCI6e30sXCJkYXRhXCI6ZGF0YX0pIDogaGVscGVyKSkpXG4gICAgKyBcIjwvc3Bhbj5cXG4gICAgICAgIDxzcGFuIGNsYXNzPVxcXCJjbG9zZVxcXCI+w5c8L3NwYW4+XFxuICAgICAgPC9saT5cXG5cIjtcbn0sXCJjb21waWxlclwiOls3LFwiPj0gNC4wLjBcIl0sXCJtYWluXCI6ZnVuY3Rpb24oY29udGFpbmVyLGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgICB2YXIgc3RhY2sxO1xuXG4gIHJldHVybiAoKHN0YWNrMSA9IGhlbHBlcnNbXCJpZlwiXS5jYWxsKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwIDogKGNvbnRhaW5lci5udWxsQ29udGV4dCB8fCB7fSksKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLnNlbnRlbmNlIDogZGVwdGgwKSx7XCJuYW1lXCI6XCJpZlwiLFwiaGFzaFwiOnt9LFwiZm5cIjpjb250YWluZXIucHJvZ3JhbSgxLCBkYXRhLCAwKSxcImludmVyc2VcIjpjb250YWluZXIucHJvZ3JhbSgzLCBkYXRhLCAwKSxcImRhdGFcIjpkYXRhfSkpICE9IG51bGwgPyBzdGFjazEgOiBcIlwiKTtcbn0sXCJ1c2VEYXRhXCI6dHJ1ZX0pO1xufTsiXX0=
