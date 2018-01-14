(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
var IndexedDBHandler = (function init() {
  var _db;
  var _presentKey = {}; // store multi-objectStore's presentKey

  function open(config, openSuccessCallback, openFailCallback) {
  // init indexedDB
  // firstly inspect browser's support for indexedDB
    if (!window.indexedDB) {
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

    objectStoreList.forEach(function detectStoreName(storeConfig, index) {
      if (index === (objectStoreList.length - 1)) {
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
      console.log('\u2713 now ' + storeName + '\'s max key is ' +  _presentKey[storeName]); // initial value is 0
      if (successCallback) {
        successCallback();
        console.log('\u2713 openSuccessCallback' + ' finished');
      }
    };
  }

  function _createObjectStoreHandler(configStoreConfig) {
    _parseJSONData(configStoreConfig, 'storeName').forEach(function detectStoreName(storeConfig) {
      if (!(_db.objectStoreNames.contains(storeConfig.storeName))) {
        _createObjectStore(storeConfig);
      }
    });
  }

  function _createObjectStore(storeConfig) {
    var store = _db.createObjectStore(storeConfig.storeName, { keyPath: storeConfig.key, autoIncrement: true });

    // Use transaction oncomplete to make sure the object Store creation is finished
    store.transaction.oncomplete = function addinitialData() {
      console.log('\u2713 create ' + storeConfig.storeName + '\'s object store succeed');
      if (storeConfig.initialData) {
        // Store initial values in the newly created object store.
        _initialDataHandler(storeConfig.storeName, storeConfig.initialData);
      }
    };
  }

  function _initialDataHandler(storeName, initialData) {
    var transaction = _db.transaction([storeName], 'readwrite');
    var objectStore = transaction.objectStore(storeName);

    _parseJSONData(initialData, 'initial').forEach(function addEveryInitialData(data, index) {
      var addRequest = objectStore.add(data);

      addRequest.onsuccess = function addInitialSuccess() {
        console.log('\u2713 add initial data[' + index + '] successed');
      };
    });
    transaction.oncomplete = function addAllDataDone() {
      console.log('\u2713 add all ' + storeName  + '\'s initial data done :)');
      _getPresentKey(storeName);
    };
  }

  function _parseJSONData(rawdata, message) {
    try {
      var parsedData = JSON.parse(JSON.stringify(rawdata));

      return parsedData;
    } catch (error) {
      window.alert('please set correct' + message  + 'array object :)');
      console.log(error);
      throw error;
    }
  }

  function getLength(storeName) {
    return _presentKey[storeName];
  }

  function getNewKey(storeName) {
    _presentKey[storeName] += 1;

    return _presentKey[storeName];
  }

  /* CRUD */

  function addItem(storeName, newData, successCallback) {
    var transaction = _db.transaction([storeName], 'readwrite');
    var addRequest = transaction.objectStore(storeName).add(newData);

    addRequest.onsuccess = function addSuccess() {
      console.log('\u2713 add ' + storeName + '\'s ' + addRequest.source.keyPath + ' = ' + newData[addRequest.source.keyPath] + ' data succeed :)');
      if (successCallback) {
        successCallback(newData);
      }
    };
  }

  function getItem(storeName, key, successCallback) {
    var transaction = _db.transaction([storeName]);
    var getRequest = transaction.objectStore(storeName).get(parseInt(key, 10));  // get it by index

    getRequest.onsuccess = function getSuccess() {
      console.log('\u2713 get ' + storeName + '\'s ' + getRequest.source.keyPath + ' = ' + key + ' data success :)');
      if (successCallback) {
        successCallback(getRequest.result);
      }
    };
  }

  // get conditional data (boolean condition)
  function getWhetherConditionItem(storeName, condition, whether, successCallback) {
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
      console.log('\u2713 get ' + storeName + '\'s ' + condition + ' = ' + whether  + ' data success :)');
      if (successCallback) {
        successCallback(result);
      }
    };
  }

  function getAll(storeName, successCallback) {
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
      console.log('\u2713 get ' + storeName + '\'s ' + 'all data success :)');
      if (successCallback) {
        successCallback(result);
      }
    };
  }

  function removeItem(storeName, key, successCallback) {
    var transaction = _db.transaction([storeName], 'readwrite');
    var deleteRequest = transaction.objectStore(storeName).delete(key);

    deleteRequest.onsuccess = function deleteSuccess() {
      console.log('\u2713 remove ' + storeName + '\'s ' + deleteRequest.source.keyPath + ' = ' + key + ' data success :)');
      if (successCallback) {
        successCallback(key);
      }
    };
  }

  function removeWhetherConditionItem(storeName, condition, whether, successCallback) {
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
      console.log('\u2713 remove ' + storeName + '\'s ' + condition + ' = ' + whether  + ' data success :)');
      if (successCallback) {
        successCallback();
      }
    };
  }

  function clear(storeName, successCallback) {
    var transaction = _db.transaction([storeName], 'readwrite');

    _getAllRequest(transaction, storeName).onsuccess = function getAllSuccess(e) {
      var cursor = e.target.result;

      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    transaction.oncomplete = function completeClear() {
      console.log('\u2713 clear ' + storeName + '\'s ' + 'all data success :)');
      if (successCallback) {
        successCallback('clear all data success');
      }
    };
  }

  // update one
  function updateItem(storeName, newData, successCallback) {
    var transaction = _db.transaction([storeName], 'readwrite');
    var putRequest = transaction.objectStore(storeName).put(newData);

    putRequest.onsuccess = function putSuccess() {
      console.log('\u2713 update ' + storeName + '\'s ' + putRequest.source.keyPath + ' = ' + newData[putRequest.source.keyPath] + ' data success :)');
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
}());

module.exports = IndexedDBHandler;

},{}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
'use strict';
(function init() {
  var DB = require('indexeddb-crud');
  var config = require('./db/config.js');
  var loadWithoutDB = require('./utlis/loadWithoutDB.js');
  var addEvents = require('./utlis/addEvents/dbSuccess');

  // open DB, and when DB open succeed, invoke initial function
  DB.open(config, addEvents, loadWithoutDB);
}());

},{"./db/config.js":2,"./utlis/addEvents/dbSuccess":4,"./utlis/loadWithoutDB.js":10,"indexeddb-crud":1}],4:[function(require,module,exports){
'use strict';
module.exports = (function addEventsDBSuccess() {
  var eventHandler = require('../eventHandler/dbSuccess');
  var general = require('./general.js');

  return function addEvents() {
    general(eventHandler);
  };
}());

},{"../eventHandler/dbSuccess":7,"./general.js":5}],5:[function(require,module,exports){
module.exports = function addEventsGenerator(handler) {
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
};

},{}],6:[function(require,module,exports){
module.exports = function clearChildNodes(root) {
  while (root.hasChildNodes()) { // or root.firstChild or root.lastChild
    root.removeChild(root.firstChild);
  }
  // or root.innerHTML = ''
};

},{}],7:[function(require,module,exports){
'use strict';
var dbSuccess = (function dbSuccessGenerator() {
  var storeName = 'list';
  var DB = require('indexeddb-crud');
  var refresh = require('../refresh/dbSuccess');
  var liGenerator = require('../liGenerator.js');
  var general = require('./general.js');

  function add() {
    var list;
    var newData;
    var inputValue = document.querySelector('#input').value;

    if (inputValue === '') {
      window.alert('please input a real data~');
      return 0;
    }
    general.ifEmpty.removeInit();
    newData = general.dataGenerator(DB.getNewKey(storeName), inputValue);
    list = document.querySelector('#list');
    list.insertBefore(liGenerator(newData), list.firstChild); // push newLi to first
    document.querySelector('#input').value = '';  // reset input's values
    DB.addItem(storeName, newData);

    return 0;
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
        DB.getItem(storeName, id, _toggleLi);
      }
    }
  }

  function _toggleLi(data) {
    data.finished = !data.finished;
    DB.updateItem(storeName, data, showAll);
  }

  // li's [x]'s delete
  function removeLi(e) {
    var id;

    if (e.target.className === 'close') { // use event delegation
      // use previously stored data
      id = parseInt(e.target.parentNode.getAttribute('data-id'), 10);
      DB.removeItem(storeName, id, showAll);
    }
  }

  function showInit() {
    refresh.clear();
    DB.getAll(storeName, refresh.init);
  }

  function showAll() {
    refresh.clear();
    DB.getAll(storeName, refresh.all);
  }

  function showDone() {
    _showWhetherDone(true);
  }

  function showTodo() {
    _showWhetherDone(false);
  }

  function _showWhetherDone(whetherDone) {
    var condition = 'finished';

    refresh.clear();
    DB.getWhetherConditionItem(storeName, condition, whetherDone, refresh.part);
  }

  function showClearDone() {
    var condition = 'finished';

    refresh.clear();
    DB.removeWhetherConditionItem(storeName, condition, true, function showLeftData() {
      DB.getAll(storeName, refresh.part);
    });
  }

  function showClear() {
    refresh.clear(); // clear nodes visually
    refresh.random();
    DB.clear(storeName); // clear data indeed
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

module.exports = dbSuccess;

},{"../liGenerator.js":9,"../refresh/dbSuccess":11,"./general.js":8,"indexeddb-crud":1}],8:[function(require,module,exports){
var general = (function generalGenerator() {
  var ifEmpty = {
    removeInit: function removeInit() {
      var list = document.querySelector('#list');

      if (list.firstChild.className === 'aphorism') {
        list.removeChild(list.firstChild);
      }
    }
  };

  function dataGenerator(key, value) {
    return {
      id: key,
      event: value,
      finished: false,
      date: _getNewDate('MM月dd日hh:mm') + ' '
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

  return {
    ifEmpty: ifEmpty,
    dataGenerator: dataGenerator
  };
}());

module.exports = general;

},{}],9:[function(require,module,exports){
'use strict';
var liGenerator = (function liGenerator() {
  function _decorateLi(li, data) {
    var text = document.createTextNode(' ' + data.event);
    var textDate = document.createTextNode(data.date + ': ');
    var textWrap = document.createElement('span');

    // wrap as a node
    textWrap.appendChild(text);
    li.appendChild(textDate);
    li.appendChild(textWrap);
    if (data.finished) {  // add css-style to it (according to it's data.finished value)
      li.classList.add('finished'); // add style
    }
    _addX(li); // add span [x] to li's tail
    _setDataProperty(li, 'data-id', data.id); // add property to li (data-id)，for  clickLi
  }

  function _addX(li) {
    var span = document.createElement('span');
    var x = document.createTextNode('\u00D7'); // unicode -> x

    span.appendChild(x);
    span.className = 'close'; // add style
    li.appendChild(span);
  }

  function _setDataProperty(target, name, data) {
    target.setAttribute(name, data);
  }


  return function create(data) {
    var li = document.createElement('li');

    _decorateLi(li, data); // decorate li

    return li;
  };
}());

module.exports = liGenerator;

},{}],10:[function(require,module,exports){
'use strict';
module.exports = function withoutDB() {
  var element = document.createElement('script');

  element.type = 'text/javascript';
  element.async = true;
  element.src = './dist/scripts/lazyLoad.min.js';
  document.body.appendChild(element);
};

},{}],11:[function(require,module,exports){
module.exports = (function dbSuccessGenerator() {
  var storeName = 'aphorism';
  var DB = require('indexeddb-crud');
  var general = require('./general.js');

  function randomAphorism() {
    var randomIndex = Math.ceil(Math.random() * DB.getLength(storeName));

    DB.getItem(storeName, randomIndex, _parseText);
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

},{"./general.js":12,"indexeddb-crud":1}],12:[function(require,module,exports){
'use strict';
var general = (function generalGenerator() {
  var liGenerator = require('../liGenerator.js');
  var clearChildNodes = require('../clearChildNodes.js');

  function init(dataArr) {
    _show(_initSentence, _showAll, dataArr);
  }

  function _show(showSentenceFunc, showFunc, dataArr) {
    if (!dataArr || dataArr.length === 0) {
      showSentenceFunc();
    } else {
      showFunc(dataArr);
    }
  }

  function _initSentence() {
    var text = 'Welcome~, try to add your first to-do list : )';

    sentenceHandler(text);
  }

  function _showAll(dataArr) {
    var result = _classifyData(dataArr);

    document.querySelector('#list').appendChild(result); // add it to DOM
  }

  function _classifyData(dataArr) {
    // PUNCHLINE: use fragment to reduce DOM operate
    var unfishied = document.createDocumentFragment();
    var finished = document.createDocumentFragment();
    var mix = document.createDocumentFragment();

    // put the finished item to the bottom
    dataArr.forEach(function classify(data) {
      if (data.finished) {
        finished.insertBefore(liGenerator(data), finished.firstChild);
      } else {
        unfishied.insertBefore(liGenerator(data), unfishied.firstChild);
      }
    });
    mix.appendChild(unfishied);
    mix.appendChild(finished);

    return mix;
  }

  function all(randomAphorism, dataArr) {
    _show(randomAphorism, _showAll, dataArr);
  }

  function part(randomAphorism, dataArr) {
    _show(randomAphorism, _showpart, dataArr);
  }

  function _showpart(dataArr) {
    var nodes = dataArr.reduce(function nodeGenerator(result, data) {
      result.insertBefore(liGenerator(data), result.firstChild);

      return result;
    }, document.createDocumentFragment()); // PUNCHLINE: brilliant arr.reduce() + documentFragment

    document.querySelector('#list').appendChild(nodes); // add it to DOM
  }

  function clear() {
    clearChildNodes(document.querySelector('#list'));
  }

  function sentenceHandler(text) {
    var li = document.createElement('li');
    var textNode = document.createTextNode(text);

    li.appendChild(textNode);
    li.className = 'aphorism';
    document.querySelector('#list').appendChild(li);
  }


  return {
    init: init,
    all: all,
    part: part,
    clear: clear,
    sentenceHandler: sentenceHandler
  };
}());

module.exports = general;

},{"../clearChildNodes.js":6,"../liGenerator.js":9}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5kZXhlZGRiLWNydWQvaW5kZXhlZGRiLWNydWQuanMiLCJzcmMvc2NyaXB0cy9kYi9jb25maWcuanMiLCJzcmMvc2NyaXB0cy9tYWluLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvYWRkRXZlbnRzL2RiU3VjY2Vzcy5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2FkZEV2ZW50cy9nZW5lcmFsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvY2xlYXJDaGlsZE5vZGVzLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZXZlbnRIYW5kbGVyL2RiU3VjY2Vzcy5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2V2ZW50SGFuZGxlci9nZW5lcmFsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvbGlHZW5lcmF0b3IuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9sb2FkV2l0aG91dERCLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvcmVmcmVzaC9kYlN1Y2Nlc3MuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9yZWZyZXNoL2dlbmVyYWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcbnZhciBJbmRleGVkREJIYW5kbGVyID0gKGZ1bmN0aW9uIGluaXQoKSB7XG4gIHZhciBfZGI7XG4gIHZhciBfcHJlc2VudEtleSA9IHt9OyAvLyBzdG9yZSBtdWx0aS1vYmplY3RTdG9yZSdzIHByZXNlbnRLZXlcblxuICBmdW5jdGlvbiBvcGVuKGNvbmZpZywgb3BlblN1Y2Nlc3NDYWxsYmFjaywgb3BlbkZhaWxDYWxsYmFjaykge1xuICAvLyBpbml0IGluZGV4ZWREQlxuICAvLyBmaXJzdGx5IGluc3BlY3QgYnJvd3NlcidzIHN1cHBvcnQgZm9yIGluZGV4ZWREQlxuICAgIGlmICghd2luZG93LmluZGV4ZWREQikge1xuICAgICAgaWYgKG9wZW5GYWlsQ2FsbGJhY2spIHtcbiAgICAgICAgb3BlbkZhaWxDYWxsYmFjaygpOyAvLyBQVU5DSExJTkU6IG9mZmVyIHdpdGhvdXQtREIgaGFuZGxlclxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2luZG93LmFsZXJ0KCdcXHUyNzE0IFlvdXIgYnJvd3NlciBkb2VzblxcJ3Qgc3VwcG9ydCBhIHN0YWJsZSB2ZXJzaW9uIG9mIEluZGV4ZWREQi4gWW91IGNhbiBpbnN0YWxsIGxhdGVzdCBDaHJvbWUgb3IgRmlyZUZveCB0byBoYW5kbGVyIGl0Jyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgX29wZW5IYW5kbGVyKGNvbmZpZywgb3BlblN1Y2Nlc3NDYWxsYmFjayk7XG5cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9vcGVuSGFuZGxlcihjb25maWcsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBvcGVuUmVxdWVzdCA9IHdpbmRvdy5pbmRleGVkREIub3Blbihjb25maWcubmFtZSwgY29uZmlnLnZlcnNpb24pOyAvLyBvcGVuIGluZGV4ZWREQlxuXG4gICAgLy8gYW4gb25ibG9ja2VkIGV2ZW50IGlzIGZpcmVkIHVudGlsIHRoZXkgYXJlIGNsb3NlZCBvciByZWxvYWRlZFxuICAgIG9wZW5SZXF1ZXN0Lm9uYmxvY2tlZCA9IGZ1bmN0aW9uIGJsb2NrZWRTY2hlbWVVcCgpIHtcbiAgICAgIC8vIElmIHNvbWUgb3RoZXIgdGFiIGlzIGxvYWRlZCB3aXRoIHRoZSBkYXRhYmFzZSwgdGhlbiBpdCBuZWVkcyB0byBiZSBjbG9zZWQgYmVmb3JlIHdlIGNhbiBwcm9jZWVkLlxuICAgICAgd2luZG93LmFsZXJ0KCdQbGVhc2UgY2xvc2UgYWxsIG90aGVyIHRhYnMgd2l0aCB0aGlzIHNpdGUgb3BlbicpO1xuICAgIH07XG5cbiAgICAvLyBDcmVhdGluZyBvciB1cGRhdGluZyB0aGUgdmVyc2lvbiBvZiB0aGUgZGF0YWJhc2VcbiAgICBvcGVuUmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSBmdW5jdGlvbiBzY2hlbWFVcChlKSB7XG4gICAgICAvLyBBbGwgb3RoZXIgZGF0YWJhc2VzIGhhdmUgYmVlbiBjbG9zZWQuIFNldCBldmVyeXRoaW5nIHVwLlxuICAgICAgX2RiID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgb251cGdyYWRlbmVlZGVkIGluJyk7XG4gICAgICBfY3JlYXRlT2JqZWN0U3RvcmVIYW5kbGVyKGNvbmZpZy5zdG9yZUNvbmZpZyk7XG4gICAgfTtcblxuICAgIG9wZW5SZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIG9wZW5TdWNjZXNzKGUpIHtcbiAgICAgIF9kYiA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgIF9kYi5vbnZlcnNpb25jaGFuZ2UgPSBmdW5jdGlvbiB2ZXJzaW9uY2hhbmdlSGFuZGxlcigpIHtcbiAgICAgICAgX2RiLmNsb3NlKCk7XG4gICAgICAgIHdpbmRvdy5hbGVydCgnQSBuZXcgdmVyc2lvbiBvZiB0aGlzIHBhZ2UgaXMgcmVhZHkuIFBsZWFzZSByZWxvYWQnKTtcbiAgICAgIH07XG4gICAgICBfb3BlblN1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoY29uZmlnLnN0b3JlQ29uZmlnLCBzdWNjZXNzQ2FsbGJhY2spO1xuICAgIH07XG5cbiAgICAvLyB1c2UgZXJyb3IgZXZlbnRzIGJ1YmJsZSB0byBoYW5kbGUgYWxsIGVycm9yIGV2ZW50c1xuICAgIG9wZW5SZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbiBvcGVuRXJyb3IoZSkge1xuICAgICAgd2luZG93LmFsZXJ0KCdTb21ldGhpbmcgaXMgd3Jvbmcgd2l0aCBpbmRleGVkREIsIGZvciBtb3JlIGluZm9ybWF0aW9uLCBjaGVja291dCBjb25zb2xlJyk7XG4gICAgICBjb25zb2xlLmxvZyhlLnRhcmdldC5lcnJvcik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZS50YXJnZXQuZXJyb3IpO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfb3BlblN1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoY29uZmlnU3RvcmVDb25maWcsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBvYmplY3RTdG9yZUxpc3QgPSBfcGFyc2VKU09ORGF0YShjb25maWdTdG9yZUNvbmZpZywgJ3N0b3JlTmFtZScpO1xuXG4gICAgb2JqZWN0U3RvcmVMaXN0LmZvckVhY2goZnVuY3Rpb24gZGV0ZWN0U3RvcmVOYW1lKHN0b3JlQ29uZmlnLCBpbmRleCkge1xuICAgICAgaWYgKGluZGV4ID09PSAob2JqZWN0U3RvcmVMaXN0Lmxlbmd0aCAtIDEpKSB7XG4gICAgICAgIF9nZXRQcmVzZW50S2V5KHN0b3JlQ29uZmlnLnN0b3JlTmFtZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjaygpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIG9wZW4gaW5kZXhlZERCIHN1Y2Nlc3MnKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfZ2V0UHJlc2VudEtleShzdG9yZUNvbmZpZy5zdG9yZU5hbWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8gc2V0IHByZXNlbnQga2V5IHZhbHVlIHRvIF9wcmVzZW50S2V5ICh0aGUgcHJpdmF0ZSBwcm9wZXJ0eSlcbiAgZnVuY3Rpb24gX2dldFByZXNlbnRLZXkoc3RvcmVOYW1lLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0pO1xuXG4gICAgX3ByZXNlbnRLZXlbc3RvcmVOYW1lXSA9IDA7XG4gICAgX2dldEFsbFJlcXVlc3QodHJhbnNhY3Rpb24sIHN0b3JlTmFtZSkub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0QWxsU3VjY2VzcyhlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIF9wcmVzZW50S2V5W3N0b3JlTmFtZV0gPSBjdXJzb3IudmFsdWUuaWQ7XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfVxuICAgIH07XG4gICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGNvbXBsZXRlR2V0UHJlc2VudEtleSgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIG5vdyAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgbWF4IGtleSBpcyAnICsgIF9wcmVzZW50S2V5W3N0b3JlTmFtZV0pOyAvLyBpbml0aWFsIHZhbHVlIGlzIDBcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIG9wZW5TdWNjZXNzQ2FsbGJhY2snICsgJyBmaW5pc2hlZCcpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfY3JlYXRlT2JqZWN0U3RvcmVIYW5kbGVyKGNvbmZpZ1N0b3JlQ29uZmlnKSB7XG4gICAgX3BhcnNlSlNPTkRhdGEoY29uZmlnU3RvcmVDb25maWcsICdzdG9yZU5hbWUnKS5mb3JFYWNoKGZ1bmN0aW9uIGRldGVjdFN0b3JlTmFtZShzdG9yZUNvbmZpZykge1xuICAgICAgaWYgKCEoX2RiLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoc3RvcmVDb25maWcuc3RvcmVOYW1lKSkpIHtcbiAgICAgICAgX2NyZWF0ZU9iamVjdFN0b3JlKHN0b3JlQ29uZmlnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9jcmVhdGVPYmplY3RTdG9yZShzdG9yZUNvbmZpZykge1xuICAgIHZhciBzdG9yZSA9IF9kYi5jcmVhdGVPYmplY3RTdG9yZShzdG9yZUNvbmZpZy5zdG9yZU5hbWUsIHsga2V5UGF0aDogc3RvcmVDb25maWcua2V5LCBhdXRvSW5jcmVtZW50OiB0cnVlIH0pO1xuXG4gICAgLy8gVXNlIHRyYW5zYWN0aW9uIG9uY29tcGxldGUgdG8gbWFrZSBzdXJlIHRoZSBvYmplY3QgU3RvcmUgY3JlYXRpb24gaXMgZmluaXNoZWRcbiAgICBzdG9yZS50cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gYWRkaW5pdGlhbERhdGEoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBjcmVhdGUgJyArIHN0b3JlQ29uZmlnLnN0b3JlTmFtZSArICdcXCdzIG9iamVjdCBzdG9yZSBzdWNjZWVkJyk7XG4gICAgICBpZiAoc3RvcmVDb25maWcuaW5pdGlhbERhdGEpIHtcbiAgICAgICAgLy8gU3RvcmUgaW5pdGlhbCB2YWx1ZXMgaW4gdGhlIG5ld2x5IGNyZWF0ZWQgb2JqZWN0IHN0b3JlLlxuICAgICAgICBfaW5pdGlhbERhdGFIYW5kbGVyKHN0b3JlQ29uZmlnLnN0b3JlTmFtZSwgc3RvcmVDb25maWcuaW5pdGlhbERhdGEpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfaW5pdGlhbERhdGFIYW5kbGVyKHN0b3JlTmFtZSwgaW5pdGlhbERhdGEpIHtcbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcbiAgICB2YXIgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpO1xuXG4gICAgX3BhcnNlSlNPTkRhdGEoaW5pdGlhbERhdGEsICdpbml0aWFsJykuZm9yRWFjaChmdW5jdGlvbiBhZGRFdmVyeUluaXRpYWxEYXRhKGRhdGEsIGluZGV4KSB7XG4gICAgICB2YXIgYWRkUmVxdWVzdCA9IG9iamVjdFN0b3JlLmFkZChkYXRhKTtcblxuICAgICAgYWRkUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBhZGRJbml0aWFsU3VjY2VzcygpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgYWRkIGluaXRpYWwgZGF0YVsnICsgaW5kZXggKyAnXSBzdWNjZXNzZWQnKTtcbiAgICAgIH07XG4gICAgfSk7XG4gICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGFkZEFsbERhdGFEb25lKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgYWRkIGFsbCAnICsgc3RvcmVOYW1lICArICdcXCdzIGluaXRpYWwgZGF0YSBkb25lIDopJyk7XG4gICAgICBfZ2V0UHJlc2VudEtleShzdG9yZU5hbWUpO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfcGFyc2VKU09ORGF0YShyYXdkYXRhLCBtZXNzYWdlKSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBwYXJzZWREYXRhID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShyYXdkYXRhKSk7XG5cbiAgICAgIHJldHVybiBwYXJzZWREYXRhO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB3aW5kb3cuYWxlcnQoJ3BsZWFzZSBzZXQgY29ycmVjdCcgKyBtZXNzYWdlICArICdhcnJheSBvYmplY3QgOiknKTtcbiAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldExlbmd0aChzdG9yZU5hbWUpIHtcbiAgICByZXR1cm4gX3ByZXNlbnRLZXlbc3RvcmVOYW1lXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldE5ld0tleShzdG9yZU5hbWUpIHtcbiAgICBfcHJlc2VudEtleVtzdG9yZU5hbWVdICs9IDE7XG5cbiAgICByZXR1cm4gX3ByZXNlbnRLZXlbc3RvcmVOYW1lXTtcbiAgfVxuXG4gIC8qIENSVUQgKi9cblxuICBmdW5jdGlvbiBhZGRJdGVtKHN0b3JlTmFtZSwgbmV3RGF0YSwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdLCAncmVhZHdyaXRlJyk7XG4gICAgdmFyIGFkZFJlcXVlc3QgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpLmFkZChuZXdEYXRhKTtcblxuICAgIGFkZFJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gYWRkU3VjY2VzcygpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGFkZCAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgJyArIGFkZFJlcXVlc3Quc291cmNlLmtleVBhdGggKyAnID0gJyArIG5ld0RhdGFbYWRkUmVxdWVzdC5zb3VyY2Uua2V5UGF0aF0gKyAnIGRhdGEgc3VjY2VlZCA6KScpO1xuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2sobmV3RGF0YSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEl0ZW0oc3RvcmVOYW1lLCBrZXksIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSk7XG4gICAgdmFyIGdldFJlcXVlc3QgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpLmdldChwYXJzZUludChrZXksIDEwKSk7ICAvLyBnZXQgaXQgYnkgaW5kZXhcblxuICAgIGdldFJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0U3VjY2VzcygpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGdldCAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgJyArIGdldFJlcXVlc3Quc291cmNlLmtleVBhdGggKyAnID0gJyArIGtleSArICcgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhnZXRSZXF1ZXN0LnJlc3VsdCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8vIGdldCBjb25kaXRpb25hbCBkYXRhIChib29sZWFuIGNvbmRpdGlvbilcbiAgZnVuY3Rpb24gZ2V0V2hldGhlckNvbmRpdGlvbkl0ZW0oc3RvcmVOYW1lLCBjb25kaXRpb24sIHdoZXRoZXIsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSk7XG4gICAgdmFyIHJlc3VsdCA9IFtdOyAvLyB1c2UgYW4gYXJyYXkgdG8gc3RvcmFnZSBlbGlnaWJsZSBkYXRhXG5cbiAgICBfZ2V0QWxsUmVxdWVzdCh0cmFuc2FjdGlvbiwgc3RvcmVOYW1lKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRBbGxTdWNjZXNzKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgaWYgKHdoZXRoZXIpIHtcbiAgICAgICAgICBpZiAoY3Vyc29yLnZhbHVlW2NvbmRpdGlvbl0pIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGN1cnNvci52YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCF3aGV0aGVyKSB7XG4gICAgICAgICAgaWYgKCFjdXJzb3IudmFsdWVbY29uZGl0aW9uXSkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goY3Vyc29yLnZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gY29tcGxldGVBZGRBbGwoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBnZXQgJyArIHN0b3JlTmFtZSArICdcXCdzICcgKyBjb25kaXRpb24gKyAnID0gJyArIHdoZXRoZXIgICsgJyBkYXRhIHN1Y2Nlc3MgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3VsdCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEFsbChzdG9yZU5hbWUsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSk7XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgX2dldEFsbFJlcXVlc3QodHJhbnNhY3Rpb24sIHN0b3JlTmFtZSkub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0QWxsU3VjY2VzcyhlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGN1cnNvci52YWx1ZSk7XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfVxuICAgIH07XG4gICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGNvbXBsZXRlR2V0QWxsKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgZ2V0ICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgJ2FsbCBkYXRhIHN1Y2Nlc3MgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3VsdCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZUl0ZW0oc3RvcmVOYW1lLCBrZXksIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuICAgIHZhciBkZWxldGVSZXF1ZXN0ID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKS5kZWxldGUoa2V5KTtcblxuICAgIGRlbGV0ZVJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gZGVsZXRlU3VjY2VzcygpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIHJlbW92ZSAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgJyArIGRlbGV0ZVJlcXVlc3Quc291cmNlLmtleVBhdGggKyAnID0gJyArIGtleSArICcgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhrZXkpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmVXaGV0aGVyQ29uZGl0aW9uSXRlbShzdG9yZU5hbWUsIGNvbmRpdGlvbiwgd2hldGhlciwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdLCAncmVhZHdyaXRlJyk7XG5cbiAgICBfZ2V0QWxsUmVxdWVzdCh0cmFuc2FjdGlvbiwgc3RvcmVOYW1lKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRBbGxTdWNjZXNzKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgaWYgKHdoZXRoZXIpIHtcbiAgICAgICAgICBpZiAoY3Vyc29yLnZhbHVlW2NvbmRpdGlvbl0pIHtcbiAgICAgICAgICAgIGN1cnNvci5kZWxldGUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIXdoZXRoZXIpIHtcbiAgICAgICAgICBpZiAoIWN1cnNvci52YWx1ZVtjb25kaXRpb25dKSB7XG4gICAgICAgICAgICBjdXJzb3IuZGVsZXRlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfVxuICAgIH07XG4gICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGNvbXBsZXRlUmVtb3ZlV2hldGhlcigpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIHJlbW92ZSAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgJyArIGNvbmRpdGlvbiArICcgPSAnICsgd2hldGhlciAgKyAnIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2soKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIoc3RvcmVOYW1lLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcblxuICAgIF9nZXRBbGxSZXF1ZXN0KHRyYW5zYWN0aW9uLCBzdG9yZU5hbWUpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGdldEFsbFN1Y2Nlc3MoZSkge1xuICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICBjdXJzb3IuZGVsZXRlKCk7XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfVxuICAgIH07XG4gICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGNvbXBsZXRlQ2xlYXIoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBjbGVhciAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgJyArICdhbGwgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjaygnY2xlYXIgYWxsIGRhdGEgc3VjY2VzcycpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyB1cGRhdGUgb25lXG4gIGZ1bmN0aW9uIHVwZGF0ZUl0ZW0oc3RvcmVOYW1lLCBuZXdEYXRhLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcbiAgICB2YXIgcHV0UmVxdWVzdCA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHN0b3JlTmFtZSkucHV0KG5ld0RhdGEpO1xuXG4gICAgcHV0UmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBwdXRTdWNjZXNzKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgdXBkYXRlICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgcHV0UmVxdWVzdC5zb3VyY2Uua2V5UGF0aCArICcgPSAnICsgbmV3RGF0YVtwdXRSZXF1ZXN0LnNvdXJjZS5rZXlQYXRoXSArICcgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhuZXdEYXRhKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gX2dldEFsbFJlcXVlc3QodHJhbnNhY3Rpb24sIHN0b3JlTmFtZSkge1xuICAgIHJldHVybiB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpLm9wZW5DdXJzb3IoSURCS2V5UmFuZ2UubG93ZXJCb3VuZCgxKSwgJ25leHQnKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb3Blbjogb3BlbixcbiAgICBnZXRMZW5ndGg6IGdldExlbmd0aCxcbiAgICBnZXROZXdLZXk6IGdldE5ld0tleSxcbiAgICBnZXRJdGVtOiBnZXRJdGVtLFxuICAgIGdldFdoZXRoZXJDb25kaXRpb25JdGVtOiBnZXRXaGV0aGVyQ29uZGl0aW9uSXRlbSxcbiAgICBnZXRBbGw6IGdldEFsbCxcbiAgICBhZGRJdGVtOiBhZGRJdGVtLFxuICAgIHJlbW92ZUl0ZW06IHJlbW92ZUl0ZW0sXG4gICAgcmVtb3ZlV2hldGhlckNvbmRpdGlvbkl0ZW06IHJlbW92ZVdoZXRoZXJDb25kaXRpb25JdGVtLFxuICAgIGNsZWFyOiBjbGVhcixcbiAgICB1cGRhdGVJdGVtOiB1cGRhdGVJdGVtXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEluZGV4ZWREQkhhbmRsZXI7XG4iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbmFtZTogJ0p1c3RUb0RvJyxcbiAgdmVyc2lvbjogJzIzJyxcbiAgc3RvcmVDb25maWc6IFtcbiAgICB7XG4gICAgICBzdG9yZU5hbWU6ICdsaXN0JyxcbiAgICAgIGtleTogJ2lkJyxcbiAgICAgIGluaXRpYWxEYXRhOiBbXG4gICAgICAgIHsgaWQ6IDAsIGV2ZW50OiAnSnVzdERlbW8nLCBmaW5pc2hlZDogdHJ1ZSwgZGF0ZTogMCB9XG4gICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICBzdG9yZU5hbWU6ICdhcGhvcmlzbScsXG4gICAgICBrZXk6ICdpZCcsXG4gICAgICBpbml0aWFsRGF0YTogW1xuICAgICAgICB7XG4gICAgICAgICAgJ2lkJzogMSxcbiAgICAgICAgICAnY29udGVudCc6IFwiWW91J3JlIGJldHRlciB0aGFuIHRoYXRcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgJ2lkJzogMixcbiAgICAgICAgICAnY29udGVudCc6ICdZZXN0ZXJkYXkgWW91IFNhaWQgVG9tb3Jyb3cnXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAnaWQnOiAzLFxuICAgICAgICAgICdjb250ZW50JzogJ1doeSBhcmUgd2UgaGVyZT8nXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAnaWQnOiA0LFxuICAgICAgICAgICdjb250ZW50JzogJ0FsbCBpbiwgb3Igbm90aGluZydcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICdpZCc6IDUsXG4gICAgICAgICAgJ2NvbnRlbnQnOiAnWW91IE5ldmVyIFRyeSwgWW91IE5ldmVyIEtub3cnXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAnaWQnOiA2LFxuICAgICAgICAgICdjb250ZW50JzogJ1RoZSB1bmV4YW1pbmVkIGxpZmUgaXMgbm90IHdvcnRoIGxpdmluZy4gLS0gU29jcmF0ZXMnXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAnaWQnOiA3LFxuICAgICAgICAgICdjb250ZW50JzogJ1RoZXJlIGlzIG9ubHkgb25lIHRoaW5nIHdlIHNheSB0byBsYXp5OiBOT1QgVE9EQVknXG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9XG4gIF1cbn07XG4iLCIndXNlIHN0cmljdCc7XG4oZnVuY3Rpb24gaW5pdCgpIHtcbiAgdmFyIERCID0gcmVxdWlyZSgnaW5kZXhlZGRiLWNydWQnKTtcbiAgdmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vZGIvY29uZmlnLmpzJyk7XG4gIHZhciBsb2FkV2l0aG91dERCID0gcmVxdWlyZSgnLi91dGxpcy9sb2FkV2l0aG91dERCLmpzJyk7XG4gIHZhciBhZGRFdmVudHMgPSByZXF1aXJlKCcuL3V0bGlzL2FkZEV2ZW50cy9kYlN1Y2Nlc3MnKTtcblxuICAvLyBvcGVuIERCLCBhbmQgd2hlbiBEQiBvcGVuIHN1Y2NlZWQsIGludm9rZSBpbml0aWFsIGZ1bmN0aW9uXG4gIERCLm9wZW4oY29uZmlnLCBhZGRFdmVudHMsIGxvYWRXaXRob3V0REIpO1xufSgpKTtcbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uIGFkZEV2ZW50c0RCU3VjY2VzcygpIHtcbiAgdmFyIGV2ZW50SGFuZGxlciA9IHJlcXVpcmUoJy4uL2V2ZW50SGFuZGxlci9kYlN1Y2Nlc3MnKTtcbiAgdmFyIGdlbmVyYWwgPSByZXF1aXJlKCcuL2dlbmVyYWwuanMnKTtcblxuICByZXR1cm4gZnVuY3Rpb24gYWRkRXZlbnRzKCkge1xuICAgIGdlbmVyYWwoZXZlbnRIYW5kbGVyKTtcbiAgfTtcbn0oKSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGFkZEV2ZW50c0dlbmVyYXRvcihoYW5kbGVyKSB7XG4gIHZhciBsaXN0O1xuXG4gIGhhbmRsZXIuc2hvd0luaXQoKTtcbiAgLy8gYWRkIGFsbCBldmVudExpc3RlbmVyXG4gIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICBsaXN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5jbGlja0xpLCBmYWxzZSk7XG4gIGxpc3QuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnJlbW92ZUxpLCBmYWxzZSk7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVyLmVudGVyQWRkLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhZGQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuYWRkLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93RG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93RG9uZSwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd1RvZG8nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd1RvZG8sIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dBbGwnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0FsbCwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0NsZWFyRG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93Q2xlYXJEb25lLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93Q2xlYXInKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0NsZWFyLCBmYWxzZSk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjbGVhckNoaWxkTm9kZXMocm9vdCkge1xuICB3aGlsZSAocm9vdC5oYXNDaGlsZE5vZGVzKCkpIHsgLy8gb3Igcm9vdC5maXJzdENoaWxkIG9yIHJvb3QubGFzdENoaWxkXG4gICAgcm9vdC5yZW1vdmVDaGlsZChyb290LmZpcnN0Q2hpbGQpO1xuICB9XG4gIC8vIG9yIHJvb3QuaW5uZXJIVE1MID0gJydcbn07XG4iLCIndXNlIHN0cmljdCc7XG52YXIgZGJTdWNjZXNzID0gKGZ1bmN0aW9uIGRiU3VjY2Vzc0dlbmVyYXRvcigpIHtcbiAgdmFyIHN0b3JlTmFtZSA9ICdsaXN0JztcbiAgdmFyIERCID0gcmVxdWlyZSgnaW5kZXhlZGRiLWNydWQnKTtcbiAgdmFyIHJlZnJlc2ggPSByZXF1aXJlKCcuLi9yZWZyZXNoL2RiU3VjY2VzcycpO1xuICB2YXIgbGlHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9saUdlbmVyYXRvci5qcycpO1xuICB2YXIgZ2VuZXJhbCA9IHJlcXVpcmUoJy4vZ2VuZXJhbC5qcycpO1xuXG4gIGZ1bmN0aW9uIGFkZCgpIHtcbiAgICB2YXIgbGlzdDtcbiAgICB2YXIgbmV3RGF0YTtcbiAgICB2YXIgaW5wdXRWYWx1ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNpbnB1dCcpLnZhbHVlO1xuXG4gICAgaWYgKGlucHV0VmFsdWUgPT09ICcnKSB7XG4gICAgICB3aW5kb3cuYWxlcnQoJ3BsZWFzZSBpbnB1dCBhIHJlYWwgZGF0YX4nKTtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBnZW5lcmFsLmlmRW1wdHkucmVtb3ZlSW5pdCgpO1xuICAgIG5ld0RhdGEgPSBnZW5lcmFsLmRhdGFHZW5lcmF0b3IoREIuZ2V0TmV3S2V5KHN0b3JlTmFtZSksIGlucHV0VmFsdWUpO1xuICAgIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgIGxpc3QuaW5zZXJ0QmVmb3JlKGxpR2VuZXJhdG9yKG5ld0RhdGEpLCBsaXN0LmZpcnN0Q2hpbGQpOyAvLyBwdXNoIG5ld0xpIHRvIGZpcnN0XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWUgPSAnJzsgIC8vIHJlc2V0IGlucHV0J3MgdmFsdWVzXG4gICAgREIuYWRkSXRlbShzdG9yZU5hbWUsIG5ld0RhdGEpO1xuXG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICBmdW5jdGlvbiBlbnRlckFkZChlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgIGFkZCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsaWNrTGkoZSkge1xuICAgIHZhciBpZDtcbiAgICB2YXIgdGFyZ2V0TGkgPSBlLnRhcmdldDtcbiAgICAvLyB1c2UgZXZlbnQgZGVsZWdhdGlvblxuXG4gICAgaWYgKCF0YXJnZXRMaS5jbGFzc0xpc3QuY29udGFpbnMoJ2FwaG9yaXNtJykpIHtcbiAgICAgIGlmICh0YXJnZXRMaS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSkge1xuICAgICAgICB0YXJnZXRMaS5jbGFzc0xpc3QudG9nZ2xlKCdmaW5pc2hlZCcpOyAvLyB0b2dnbGUgYXBwZWFyYW5jZVxuICAgICAgICBpZCA9IHBhcnNlSW50KHRhcmdldExpLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpLCAxMCk7IC8vIHVzZSBwcmV2aW91c2x5IHN0b3JlZCBkYXRhLWlkIGF0dHJpYnV0ZVxuICAgICAgICBEQi5nZXRJdGVtKHN0b3JlTmFtZSwgaWQsIF90b2dnbGVMaSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX3RvZ2dsZUxpKGRhdGEpIHtcbiAgICBkYXRhLmZpbmlzaGVkID0gIWRhdGEuZmluaXNoZWQ7XG4gICAgREIudXBkYXRlSXRlbShzdG9yZU5hbWUsIGRhdGEsIHNob3dBbGwpO1xuICB9XG5cbiAgLy8gbGkncyBbeF0ncyBkZWxldGVcbiAgZnVuY3Rpb24gcmVtb3ZlTGkoZSkge1xuICAgIHZhciBpZDtcblxuICAgIGlmIChlLnRhcmdldC5jbGFzc05hbWUgPT09ICdjbG9zZScpIHsgLy8gdXNlIGV2ZW50IGRlbGVnYXRpb25cbiAgICAgIC8vIHVzZSBwcmV2aW91c2x5IHN0b3JlZCBkYXRhXG4gICAgICBpZCA9IHBhcnNlSW50KGUudGFyZ2V0LnBhcmVudE5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyksIDEwKTtcbiAgICAgIERCLnJlbW92ZUl0ZW0oc3RvcmVOYW1lLCBpZCwgc2hvd0FsbCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0luaXQoKSB7XG4gICAgcmVmcmVzaC5jbGVhcigpO1xuICAgIERCLmdldEFsbChzdG9yZU5hbWUsIHJlZnJlc2guaW5pdCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93QWxsKCkge1xuICAgIHJlZnJlc2guY2xlYXIoKTtcbiAgICBEQi5nZXRBbGwoc3RvcmVOYW1lLCByZWZyZXNoLmFsbCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93RG9uZSgpIHtcbiAgICBfc2hvd1doZXRoZXJEb25lKHRydWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd1RvZG8oKSB7XG4gICAgX3Nob3dXaGV0aGVyRG9uZShmYWxzZSk7XG4gIH1cblxuICBmdW5jdGlvbiBfc2hvd1doZXRoZXJEb25lKHdoZXRoZXJEb25lKSB7XG4gICAgdmFyIGNvbmRpdGlvbiA9ICdmaW5pc2hlZCc7XG5cbiAgICByZWZyZXNoLmNsZWFyKCk7XG4gICAgREIuZ2V0V2hldGhlckNvbmRpdGlvbkl0ZW0oc3RvcmVOYW1lLCBjb25kaXRpb24sIHdoZXRoZXJEb25lLCByZWZyZXNoLnBhcnQpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0NsZWFyRG9uZSgpIHtcbiAgICB2YXIgY29uZGl0aW9uID0gJ2ZpbmlzaGVkJztcblxuICAgIHJlZnJlc2guY2xlYXIoKTtcbiAgICBEQi5yZW1vdmVXaGV0aGVyQ29uZGl0aW9uSXRlbShzdG9yZU5hbWUsIGNvbmRpdGlvbiwgdHJ1ZSwgZnVuY3Rpb24gc2hvd0xlZnREYXRhKCkge1xuICAgICAgREIuZ2V0QWxsKHN0b3JlTmFtZSwgcmVmcmVzaC5wYXJ0KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dDbGVhcigpIHtcbiAgICByZWZyZXNoLmNsZWFyKCk7IC8vIGNsZWFyIG5vZGVzIHZpc3VhbGx5XG4gICAgcmVmcmVzaC5yYW5kb20oKTtcbiAgICBEQi5jbGVhcihzdG9yZU5hbWUpOyAvLyBjbGVhciBkYXRhIGluZGVlZFxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBhZGQ6IGFkZCxcbiAgICBlbnRlckFkZDogZW50ZXJBZGQsXG4gICAgY2xpY2tMaTogY2xpY2tMaSxcbiAgICByZW1vdmVMaTogcmVtb3ZlTGksXG4gICAgc2hvd0luaXQ6IHNob3dJbml0LFxuICAgIHNob3dBbGw6IHNob3dBbGwsXG4gICAgc2hvd0RvbmU6IHNob3dEb25lLFxuICAgIHNob3dUb2RvOiBzaG93VG9kbyxcbiAgICBzaG93Q2xlYXJEb25lOiBzaG93Q2xlYXJEb25lLFxuICAgIHNob3dDbGVhcjogc2hvd0NsZWFyXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRiU3VjY2VzcztcbiIsInZhciBnZW5lcmFsID0gKGZ1bmN0aW9uIGdlbmVyYWxHZW5lcmF0b3IoKSB7XG4gIHZhciBpZkVtcHR5ID0ge1xuICAgIHJlbW92ZUluaXQ6IGZ1bmN0aW9uIHJlbW92ZUluaXQoKSB7XG4gICAgICB2YXIgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG5cbiAgICAgIGlmIChsaXN0LmZpcnN0Q2hpbGQuY2xhc3NOYW1lID09PSAnYXBob3Jpc20nKSB7XG4gICAgICAgIGxpc3QucmVtb3ZlQ2hpbGQobGlzdC5maXJzdENoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gZGF0YUdlbmVyYXRvcihrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiBrZXksXG4gICAgICBldmVudDogdmFsdWUsXG4gICAgICBmaW5pc2hlZDogZmFsc2UsXG4gICAgICBkYXRlOiBfZ2V0TmV3RGF0ZSgnTU3mnIhkZOaXpWhoOm1tJykgKyAnICdcbiAgICB9O1xuICB9XG5cbiAgLy8gRm9ybWF0IGRhdGVcbiAgZnVuY3Rpb24gX2dldE5ld0RhdGUoZm10KSB7XG4gICAgdmFyIG5ld0RhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIHZhciBuZXdmbXQgPSBmbXQ7XG4gICAgdmFyIG8gPSB7XG4gICAgICAneSsnOiBuZXdEYXRlLmdldEZ1bGxZZWFyKCksXG4gICAgICAnTSsnOiBuZXdEYXRlLmdldE1vbnRoKCkgKyAxLFxuICAgICAgJ2QrJzogbmV3RGF0ZS5nZXREYXRlKCksXG4gICAgICAnaCsnOiBuZXdEYXRlLmdldEhvdXJzKCksXG4gICAgICAnbSsnOiBuZXdEYXRlLmdldE1pbnV0ZXMoKVxuICAgIH07XG4gICAgdmFyIGxlbnM7XG5cbiAgICBmb3IgKHZhciBrIGluIG8pIHtcbiAgICAgIGlmIChuZXcgUmVnRXhwKCcoJyArIGsgKyAnKScpLnRlc3QobmV3Zm10KSkge1xuICAgICAgICBpZiAoayA9PT0gJ3krJykge1xuICAgICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKCcnICsgb1trXSkuc3Vic3RyKDQgLSBSZWdFeHAuJDEubGVuZ3RoKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoayA9PT0gJ1MrJykge1xuICAgICAgICAgIGxlbnMgPSBSZWdFeHAuJDEubGVuZ3RoO1xuICAgICAgICAgIGxlbnMgPSBsZW5zID09PSAxID8gMyA6IGxlbnM7XG4gICAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoJzAwJyArIG9ba10pLnN1YnN0cigoJycgKyBvW2tdKS5sZW5ndGggLSAxLCBsZW5zKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoUmVnRXhwLiQxLmxlbmd0aCA9PT0gMSkgPyAob1trXSkgOiAoKCcwMCcgKyBvW2tdKS5zdWJzdHIoKCcnICsgb1trXSkubGVuZ3RoKSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld2ZtdDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaWZFbXB0eTogaWZFbXB0eSxcbiAgICBkYXRhR2VuZXJhdG9yOiBkYXRhR2VuZXJhdG9yXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdlbmVyYWw7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgbGlHZW5lcmF0b3IgPSAoZnVuY3Rpb24gbGlHZW5lcmF0b3IoKSB7XG4gIGZ1bmN0aW9uIF9kZWNvcmF0ZUxpKGxpLCBkYXRhKSB7XG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnICcgKyBkYXRhLmV2ZW50KTtcbiAgICB2YXIgdGV4dERhdGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhLmRhdGUgKyAnOiAnKTtcbiAgICB2YXIgdGV4dFdyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG5cbiAgICAvLyB3cmFwIGFzIGEgbm9kZVxuICAgIHRleHRXcmFwLmFwcGVuZENoaWxkKHRleHQpO1xuICAgIGxpLmFwcGVuZENoaWxkKHRleHREYXRlKTtcbiAgICBsaS5hcHBlbmRDaGlsZCh0ZXh0V3JhcCk7XG4gICAgaWYgKGRhdGEuZmluaXNoZWQpIHsgIC8vIGFkZCBjc3Mtc3R5bGUgdG8gaXQgKGFjY29yZGluZyB0byBpdCdzIGRhdGEuZmluaXNoZWQgdmFsdWUpXG4gICAgICBsaS5jbGFzc0xpc3QuYWRkKCdmaW5pc2hlZCcpOyAvLyBhZGQgc3R5bGVcbiAgICB9XG4gICAgX2FkZFgobGkpOyAvLyBhZGQgc3BhbiBbeF0gdG8gbGkncyB0YWlsXG4gICAgX3NldERhdGFQcm9wZXJ0eShsaSwgJ2RhdGEtaWQnLCBkYXRhLmlkKTsgLy8gYWRkIHByb3BlcnR5IHRvIGxpIChkYXRhLWlkKe+8jGZvciAgY2xpY2tMaVxuICB9XG5cbiAgZnVuY3Rpb24gX2FkZFgobGkpIHtcbiAgICB2YXIgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICB2YXIgeCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCdcXHUwMEQ3Jyk7IC8vIHVuaWNvZGUgLT4geFxuXG4gICAgc3Bhbi5hcHBlbmRDaGlsZCh4KTtcbiAgICBzcGFuLmNsYXNzTmFtZSA9ICdjbG9zZSc7IC8vIGFkZCBzdHlsZVxuICAgIGxpLmFwcGVuZENoaWxkKHNwYW4pO1xuICB9XG5cbiAgZnVuY3Rpb24gX3NldERhdGFQcm9wZXJ0eSh0YXJnZXQsIG5hbWUsIGRhdGEpIHtcbiAgICB0YXJnZXQuc2V0QXR0cmlidXRlKG5hbWUsIGRhdGEpO1xuICB9XG5cblxuICByZXR1cm4gZnVuY3Rpb24gY3JlYXRlKGRhdGEpIHtcbiAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuXG4gICAgX2RlY29yYXRlTGkobGksIGRhdGEpOyAvLyBkZWNvcmF0ZSBsaVxuXG4gICAgcmV0dXJuIGxpO1xuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBsaUdlbmVyYXRvcjtcbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gd2l0aG91dERCKCkge1xuICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuXG4gIGVsZW1lbnQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xuICBlbGVtZW50LmFzeW5jID0gdHJ1ZTtcbiAgZWxlbWVudC5zcmMgPSAnLi9kaXN0L3NjcmlwdHMvbGF6eUxvYWQubWluLmpzJztcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbGVtZW50KTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiBkYlN1Y2Nlc3NHZW5lcmF0b3IoKSB7XG4gIHZhciBzdG9yZU5hbWUgPSAnYXBob3Jpc20nO1xuICB2YXIgREIgPSByZXF1aXJlKCdpbmRleGVkZGItY3J1ZCcpO1xuICB2YXIgZ2VuZXJhbCA9IHJlcXVpcmUoJy4vZ2VuZXJhbC5qcycpO1xuXG4gIGZ1bmN0aW9uIHJhbmRvbUFwaG9yaXNtKCkge1xuICAgIHZhciByYW5kb21JbmRleCA9IE1hdGguY2VpbChNYXRoLnJhbmRvbSgpICogREIuZ2V0TGVuZ3RoKHN0b3JlTmFtZSkpO1xuXG4gICAgREIuZ2V0SXRlbShzdG9yZU5hbWUsIHJhbmRvbUluZGV4LCBfcGFyc2VUZXh0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9wYXJzZVRleHQoZGF0YSkge1xuICAgIHZhciB0ZXh0ID0gZGF0YS5jb250ZW50O1xuXG4gICAgZ2VuZXJhbC5zZW50ZW5jZUhhbmRsZXIodGV4dCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGluaXQ6IGdlbmVyYWwuaW5pdCxcbiAgICBhbGw6IGdlbmVyYWwuYWxsLmJpbmQobnVsbCwgcmFuZG9tQXBob3Jpc20pLCAgLy8gUFVOQ0hMSU5FOiB1c2UgYmluZCB0byBwYXNzIHBhcmFtdGVyXG4gICAgcGFydDogZ2VuZXJhbC5wYXJ0LmJpbmQobnVsbCwgcmFuZG9tQXBob3Jpc20pLFxuICAgIGNsZWFyOiBnZW5lcmFsLmNsZWFyLFxuICAgIHJhbmRvbTogcmFuZG9tQXBob3Jpc21cbiAgfTtcbn0oKSk7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgZ2VuZXJhbCA9IChmdW5jdGlvbiBnZW5lcmFsR2VuZXJhdG9yKCkge1xuICB2YXIgbGlHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9saUdlbmVyYXRvci5qcycpO1xuICB2YXIgY2xlYXJDaGlsZE5vZGVzID0gcmVxdWlyZSgnLi4vY2xlYXJDaGlsZE5vZGVzLmpzJyk7XG5cbiAgZnVuY3Rpb24gaW5pdChkYXRhQXJyKSB7XG4gICAgX3Nob3coX2luaXRTZW50ZW5jZSwgX3Nob3dBbGwsIGRhdGFBcnIpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3Nob3coc2hvd1NlbnRlbmNlRnVuYywgc2hvd0Z1bmMsIGRhdGFBcnIpIHtcbiAgICBpZiAoIWRhdGFBcnIgfHwgZGF0YUFyci5sZW5ndGggPT09IDApIHtcbiAgICAgIHNob3dTZW50ZW5jZUZ1bmMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2hvd0Z1bmMoZGF0YUFycik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX2luaXRTZW50ZW5jZSgpIHtcbiAgICB2YXIgdGV4dCA9ICdXZWxjb21lfiwgdHJ5IHRvIGFkZCB5b3VyIGZpcnN0IHRvLWRvIGxpc3QgOiApJztcblxuICAgIHNlbnRlbmNlSGFuZGxlcih0ZXh0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zaG93QWxsKGRhdGFBcnIpIHtcbiAgICB2YXIgcmVzdWx0ID0gX2NsYXNzaWZ5RGF0YShkYXRhQXJyKTtcblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuYXBwZW5kQ2hpbGQocmVzdWx0KTsgLy8gYWRkIGl0IHRvIERPTVxuICB9XG5cbiAgZnVuY3Rpb24gX2NsYXNzaWZ5RGF0YShkYXRhQXJyKSB7XG4gICAgLy8gUFVOQ0hMSU5FOiB1c2UgZnJhZ21lbnQgdG8gcmVkdWNlIERPTSBvcGVyYXRlXG4gICAgdmFyIHVuZmlzaGllZCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB2YXIgZmluaXNoZWQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIG1peCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblxuICAgIC8vIHB1dCB0aGUgZmluaXNoZWQgaXRlbSB0byB0aGUgYm90dG9tXG4gICAgZGF0YUFyci5mb3JFYWNoKGZ1bmN0aW9uIGNsYXNzaWZ5KGRhdGEpIHtcbiAgICAgIGlmIChkYXRhLmZpbmlzaGVkKSB7XG4gICAgICAgIGZpbmlzaGVkLmluc2VydEJlZm9yZShsaUdlbmVyYXRvcihkYXRhKSwgZmluaXNoZWQuZmlyc3RDaGlsZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1bmZpc2hpZWQuaW5zZXJ0QmVmb3JlKGxpR2VuZXJhdG9yKGRhdGEpLCB1bmZpc2hpZWQuZmlyc3RDaGlsZCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgbWl4LmFwcGVuZENoaWxkKHVuZmlzaGllZCk7XG4gICAgbWl4LmFwcGVuZENoaWxkKGZpbmlzaGVkKTtcblxuICAgIHJldHVybiBtaXg7XG4gIH1cblxuICBmdW5jdGlvbiBhbGwocmFuZG9tQXBob3Jpc20sIGRhdGFBcnIpIHtcbiAgICBfc2hvdyhyYW5kb21BcGhvcmlzbSwgX3Nob3dBbGwsIGRhdGFBcnIpO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFydChyYW5kb21BcGhvcmlzbSwgZGF0YUFycikge1xuICAgIF9zaG93KHJhbmRvbUFwaG9yaXNtLCBfc2hvd3BhcnQsIGRhdGFBcnIpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3Nob3dwYXJ0KGRhdGFBcnIpIHtcbiAgICB2YXIgbm9kZXMgPSBkYXRhQXJyLnJlZHVjZShmdW5jdGlvbiBub2RlR2VuZXJhdG9yKHJlc3VsdCwgZGF0YSkge1xuICAgICAgcmVzdWx0Lmluc2VydEJlZm9yZShsaUdlbmVyYXRvcihkYXRhKSwgcmVzdWx0LmZpcnN0Q2hpbGQpO1xuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sIGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKSk7IC8vIFBVTkNITElORTogYnJpbGxpYW50IGFyci5yZWR1Y2UoKSArIGRvY3VtZW50RnJhZ21lbnRcblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuYXBwZW5kQ2hpbGQobm9kZXMpOyAvLyBhZGQgaXQgdG8gRE9NXG4gIH1cblxuICBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICBjbGVhckNoaWxkTm9kZXMoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKSk7XG4gIH1cblxuICBmdW5jdGlvbiBzZW50ZW5jZUhhbmRsZXIodGV4dCkge1xuICAgIHZhciBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgdmFyIHRleHROb2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dCk7XG5cbiAgICBsaS5hcHBlbmRDaGlsZCh0ZXh0Tm9kZSk7XG4gICAgbGkuY2xhc3NOYW1lID0gJ2FwaG9yaXNtJztcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmFwcGVuZENoaWxkKGxpKTtcbiAgfVxuXG5cbiAgcmV0dXJuIHtcbiAgICBpbml0OiBpbml0LFxuICAgIGFsbDogYWxsLFxuICAgIHBhcnQ6IHBhcnQsXG4gICAgY2xlYXI6IGNsZWFyLFxuICAgIHNlbnRlbmNlSGFuZGxlcjogc2VudGVuY2VIYW5kbGVyXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdlbmVyYWw7XG4iXX0=
