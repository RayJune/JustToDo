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
      console.log('\u2713 add all' + storeName  + '\'s initial data done :)');
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
      console.log('\u2713 get ' + storeName + '\'s ' + condition + ' : ' + whether  + ' data success :)');
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
      console.log('\u2713 remove ' + storeName + '\'s ' + condition + ' : ' + whether  + ' data success :)');
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
  var addEvents = require('./utlis/addEvents.js');

  // open DB, and when DB open succeed, invoke initial function
  DB.open(config, addEvents.dbSuccess, addEvents.dbFail);
}());

},{"./db/config.js":2,"./utlis/addEvents.js":4,"indexeddb-crud":1}],4:[function(require,module,exports){
'use strict';
module.exports = (function addEventsGenerator() {
  function _whetherSuccess(whetherSuccess) {
    function _whetherSuccessHandler(whether) {
      var list;
      var eventHandler = require('./eventHandler/eventHandler.js');
      var handler = whether ? eventHandler.dbSuccess : eventHandler.dbFail;

      if (handler === eventHandler.dbFail) {
        window.alert('Your browser doesn\'t support a stable version of IndexedDB. We will offer you the without indexedDB mode');
      }
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

    return function addEvents() {
      _whetherSuccessHandler(whetherSuccess);
    };
  }

  return {
    dbSuccess: _whetherSuccess(true),
    dbFail: _whetherSuccess(false)
  };
}());

},{"./eventHandler/eventHandler.js":8}],5:[function(require,module,exports){
module.exports = function clearChildNodes(root) {
  while (root.hasChildNodes()) { // or root.firstChild or root.lastChild
    root.removeChild(root.firstChild);
  }
  // or root.innerHTML = ''
};

},{}],6:[function(require,module,exports){
'use strict';
var dbFail = (function dbFailGenerator() {
  var refresh = require('../refresh/refresh.js').dbFail;
  var liGenerator = require('../liGenerator.js');
  var general = require('./general.js');
  var _id = 0; // so the first item's id is 1
  var _forEach = Array.prototype.forEach; // simplify

  function add() {
    var inputValue = document.querySelector('#input').value;
    var newData;
    var list;

    if (inputValue === '') {
      window.alert('please input a real data~');
      return 0;
    }
    list = document.querySelector('#list');
    _removeRandom(list);
    _id += 1;
    newData = general.dataGenerator(_id, inputValue);
    list.insertBefore(liGenerator(newData), list.firstChild); // push newLi to first
    document.querySelector('#input').value = '';  // reset input's values

    return 0;
  }

  function _removeRandom(list) {
    var listItems = list.childNodes;

    _forEach.call(listItems, function whetherHasRandom(item) {
      if (item.classList.contains('aphorism')) {
        list.removeChild(item);
      }
    });
    // or use for...in
    // for (var index in listItems) {
    //   if (listItems.hasOwnProperty(index)) {
    //     if (listItems[index].classList.contains('aphorism')) {
    //       list.removeChild(listItems[index]);
    //     }
    //   }
    // }
  }

  function enterAdd(e) {
    if (e.keyCode === 13) {
      add();
    }
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
    if (e.target.className === 'close') { // use event delegation
      _removeLiHandler(e.target);
      general.ifEmpty.addRandom();
    }
  }

  function _removeLiHandler(element) {
    // use previously stored data
    var list = document.querySelector('#list');
    var listItems = list.childNodes;
    var id = element.parentNode.getAttribute('data-id');

    try {
      _forEach.call(listItems, function whetherHasRandom(item) {
        if (item.getAttribute('data-id') === id) {
          list.removeChild(item);
        }
      });
    } catch (error) {
      console.log('Wrong id, not found in DOM tree');
      throw new Error(error);
    }
  }

  // for Semantic
  general.ifEmpty.addRandom = function addRandom() {
    var list = document.querySelector('#list');

    if (!list.hasChildNodes() || _allDisappear(list)) {
      refresh.random();
    }
  };

  function _allDisappear(list) {
    var listItems = list.childNodes;

    return Array.prototype.every.call(listItems, function whetherHasRandom(item) {
      return item.style.display === 'none';
    });
  }

  function showInit() {
    refresh.clear();
    refresh.init();
  }

  function showAll() {
    var list = document.querySelector('#list');
    var listItems = list.childNodes;

    _forEach.call(listItems, function appearAll(item) {
      _whetherAppear(item, true);
      if (item.classList.contains('finished')) {
        list.removeChild(item);
        list.appendChild(item); // PUNCHLINE: drop done item
      }
    });
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
    _forEach.call(listItems, function whetherDoneAppear(item) {
      item.classList.contains('finished') ? _whetherAppear(item, whetherDone) : _whetherAppear(item, !whetherDone);
    });
    general.ifEmpty.addRandom();
  }

  function _whetherAppear(element, whether) {
    element.style.display = whether ? 'block' : 'none';
  }

  function showClearDone() {
    var list = document.querySelector('#list');
    var listItems = list.childNodes;

    _removeRandom(list);
    _forEach.call(listItems, function clearDoneItems(item) {
      if (item.classList.contains('finished')) {
        list.removeChild(item);
      }
    });
    general.ifEmpty.addRandom();
  }

  function showClear() {
    refresh.clear(); // clear nodes visually
    refresh.random();
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

module.exports = dbFail;

},{"../liGenerator.js":10,"../refresh/refresh.js":14,"./general.js":9}],7:[function(require,module,exports){
'use strict';
var dbSuccess = (function dbSuccessGenerator() {
  var storeName = 'list';
  var DB = require('indexeddb-crud');
  var refresh = require('../refresh/refresh.js').dbSuccess;
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

},{"../liGenerator.js":10,"../refresh/refresh.js":14,"./general.js":9,"indexeddb-crud":1}],8:[function(require,module,exports){
'use strict';
module.exports = (function eventHandlerGenerator() {
  var dbSuccess = require('./dbSuccess.js');
  var dbFail = require('./dbFail.js');

  return {
    dbSuccess: dbSuccess,
    dbFail: dbFail
  };
}());

},{"./dbFail.js":6,"./dbSuccess.js":7}],9:[function(require,module,exports){
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
      date: _getNewDate('yyyy年MM月dd日 hh:mm')
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

},{}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
module.exports = (function dbFailGenerator() {
  var general = require('./general.js');

  function randomAphorism() {
    var aphorisms = [
      'Yesterday You Said Tomorrow',
      'Why are we here?',
      'All in, or nothing',
      'You Never Try, You Never Know',
      'The unexamined life is not worth living. -- Socrates',
      'There is only one thing we say to lazy: NOT TODAY'
    ];
    var randomIndex = Math.floor(Math.random() * aphorisms.length);
    var text = aphorisms[randomIndex];

    general.sentenceHandler(text);
  }

  return {
    init: general.init,
    all: general.all.bind(null, randomAphorism),
    part: general.part.bind(null, randomAphorism),
    clear: general.clear,
    random: randomAphorism
  };
}());


},{"./general.js":13}],12:[function(require,module,exports){
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

},{"./general.js":13,"indexeddb-crud":1}],13:[function(require,module,exports){
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

},{"../clearChildNodes.js":5,"../liGenerator.js":10}],14:[function(require,module,exports){
'use strict';
module.exports = (function refreshGenerator() {
  var dbSuccess = require('./dbSuccess.js');
  var dbFail = require('./dbFail.js');

  return {
    dbSuccess: dbSuccess,
    dbFail: dbFail
  };
}());

},{"./dbFail.js":11,"./dbSuccess.js":12}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5kZXhlZGRiLWNydWQvaW5kZXhlZGRiLWNydWQuanMiLCJzcmMvc2NyaXB0cy9kYi9jb25maWcuanMiLCJzcmMvc2NyaXB0cy9tYWluLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvYWRkRXZlbnRzLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvY2xlYXJDaGlsZE5vZGVzLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZXZlbnRIYW5kbGVyL2RiRmFpbC5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2V2ZW50SGFuZGxlci9kYlN1Y2Nlc3MuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9ldmVudEhhbmRsZXIvZXZlbnRIYW5kbGVyLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZXZlbnRIYW5kbGVyL2dlbmVyYWwuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9saUdlbmVyYXRvci5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL3JlZnJlc2gvZGJGYWlsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvcmVmcmVzaC9kYlN1Y2Nlc3MuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9yZWZyZXNoL2dlbmVyYWwuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9yZWZyZXNoL3JlZnJlc2guanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcbnZhciBJbmRleGVkREJIYW5kbGVyID0gKGZ1bmN0aW9uIGluaXQoKSB7XG4gIHZhciBfZGI7XG4gIHZhciBfcHJlc2VudEtleSA9IHt9OyAvLyBzdG9yZSBtdWx0aS1vYmplY3RTdG9yZSdzIHByZXNlbnRLZXlcblxuICBmdW5jdGlvbiBvcGVuKGNvbmZpZywgb3BlblN1Y2Nlc3NDYWxsYmFjaywgb3BlbkZhaWxDYWxsYmFjaykge1xuICAvLyBpbml0IGluZGV4ZWREQlxuICAvLyBmaXJzdGx5IGluc3BlY3QgYnJvd3NlcidzIHN1cHBvcnQgZm9yIGluZGV4ZWREQlxuICAgIGlmICghd2luZG93LmluZGV4ZWREQikge1xuICAgICAgaWYgKG9wZW5GYWlsQ2FsbGJhY2spIHtcbiAgICAgICAgb3BlbkZhaWxDYWxsYmFjaygpOyAvLyBQVU5DSExJTkU6IG9mZmVyIHdpdGhvdXQtREIgaGFuZGxlclxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2luZG93LmFsZXJ0KCdcXHUyNzE0IFlvdXIgYnJvd3NlciBkb2VzblxcJ3Qgc3VwcG9ydCBhIHN0YWJsZSB2ZXJzaW9uIG9mIEluZGV4ZWREQi4gWW91IGNhbiBpbnN0YWxsIGxhdGVzdCBDaHJvbWUgb3IgRmlyZUZveCB0byBoYW5kbGVyIGl0Jyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgX29wZW5IYW5kbGVyKGNvbmZpZywgb3BlblN1Y2Nlc3NDYWxsYmFjayk7XG5cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9vcGVuSGFuZGxlcihjb25maWcsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBvcGVuUmVxdWVzdCA9IHdpbmRvdy5pbmRleGVkREIub3Blbihjb25maWcubmFtZSwgY29uZmlnLnZlcnNpb24pOyAvLyBvcGVuIGluZGV4ZWREQlxuXG4gICAgLy8gYW4gb25ibG9ja2VkIGV2ZW50IGlzIGZpcmVkIHVudGlsIHRoZXkgYXJlIGNsb3NlZCBvciByZWxvYWRlZFxuICAgIG9wZW5SZXF1ZXN0Lm9uYmxvY2tlZCA9IGZ1bmN0aW9uIGJsb2NrZWRTY2hlbWVVcCgpIHtcbiAgICAgIC8vIElmIHNvbWUgb3RoZXIgdGFiIGlzIGxvYWRlZCB3aXRoIHRoZSBkYXRhYmFzZSwgdGhlbiBpdCBuZWVkcyB0byBiZSBjbG9zZWQgYmVmb3JlIHdlIGNhbiBwcm9jZWVkLlxuICAgICAgd2luZG93LmFsZXJ0KCdQbGVhc2UgY2xvc2UgYWxsIG90aGVyIHRhYnMgd2l0aCB0aGlzIHNpdGUgb3BlbicpO1xuICAgIH07XG5cbiAgICAvLyBDcmVhdGluZyBvciB1cGRhdGluZyB0aGUgdmVyc2lvbiBvZiB0aGUgZGF0YWJhc2VcbiAgICBvcGVuUmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSBmdW5jdGlvbiBzY2hlbWFVcChlKSB7XG4gICAgICAvLyBBbGwgb3RoZXIgZGF0YWJhc2VzIGhhdmUgYmVlbiBjbG9zZWQuIFNldCBldmVyeXRoaW5nIHVwLlxuICAgICAgX2RiID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgb251cGdyYWRlbmVlZGVkIGluJyk7XG4gICAgICBfY3JlYXRlT2JqZWN0U3RvcmVIYW5kbGVyKGNvbmZpZy5zdG9yZUNvbmZpZyk7XG4gICAgfTtcblxuICAgIG9wZW5SZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIG9wZW5TdWNjZXNzKGUpIHtcbiAgICAgIF9kYiA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgIF9kYi5vbnZlcnNpb25jaGFuZ2UgPSBmdW5jdGlvbiB2ZXJzaW9uY2hhbmdlSGFuZGxlcigpIHtcbiAgICAgICAgX2RiLmNsb3NlKCk7XG4gICAgICAgIHdpbmRvdy5hbGVydCgnQSBuZXcgdmVyc2lvbiBvZiB0aGlzIHBhZ2UgaXMgcmVhZHkuIFBsZWFzZSByZWxvYWQnKTtcbiAgICAgIH07XG4gICAgICBfb3BlblN1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoY29uZmlnLnN0b3JlQ29uZmlnLCBzdWNjZXNzQ2FsbGJhY2spO1xuICAgIH07XG5cbiAgICAvLyB1c2UgZXJyb3IgZXZlbnRzIGJ1YmJsZSB0byBoYW5kbGUgYWxsIGVycm9yIGV2ZW50c1xuICAgIG9wZW5SZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbiBvcGVuRXJyb3IoZSkge1xuICAgICAgd2luZG93LmFsZXJ0KCdTb21ldGhpbmcgaXMgd3Jvbmcgd2l0aCBpbmRleGVkREIsIGZvciBtb3JlIGluZm9ybWF0aW9uLCBjaGVja291dCBjb25zb2xlJyk7XG4gICAgICBjb25zb2xlLmxvZyhlLnRhcmdldC5lcnJvcik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZS50YXJnZXQuZXJyb3IpO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfb3BlblN1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoY29uZmlnU3RvcmVDb25maWcsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBvYmplY3RTdG9yZUxpc3QgPSBfcGFyc2VKU09ORGF0YShjb25maWdTdG9yZUNvbmZpZywgJ3N0b3JlTmFtZScpO1xuXG4gICAgb2JqZWN0U3RvcmVMaXN0LmZvckVhY2goZnVuY3Rpb24gZGV0ZWN0U3RvcmVOYW1lKHN0b3JlQ29uZmlnLCBpbmRleCkge1xuICAgICAgaWYgKGluZGV4ID09PSAob2JqZWN0U3RvcmVMaXN0Lmxlbmd0aCAtIDEpKSB7XG4gICAgICAgIF9nZXRQcmVzZW50S2V5KHN0b3JlQ29uZmlnLnN0b3JlTmFtZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjaygpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIG9wZW4gaW5kZXhlZERCIHN1Y2Nlc3MnKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfZ2V0UHJlc2VudEtleShzdG9yZUNvbmZpZy5zdG9yZU5hbWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8gc2V0IHByZXNlbnQga2V5IHZhbHVlIHRvIF9wcmVzZW50S2V5ICh0aGUgcHJpdmF0ZSBwcm9wZXJ0eSlcbiAgZnVuY3Rpb24gX2dldFByZXNlbnRLZXkoc3RvcmVOYW1lLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0pO1xuXG4gICAgX3ByZXNlbnRLZXlbc3RvcmVOYW1lXSA9IDA7XG4gICAgX2dldEFsbFJlcXVlc3QodHJhbnNhY3Rpb24sIHN0b3JlTmFtZSkub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0QWxsU3VjY2VzcyhlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIF9wcmVzZW50S2V5W3N0b3JlTmFtZV0gPSBjdXJzb3IudmFsdWUuaWQ7XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfVxuICAgIH07XG4gICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGNvbXBsZXRlR2V0UHJlc2VudEtleSgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIG5vdyAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgbWF4IGtleSBpcyAnICsgIF9wcmVzZW50S2V5W3N0b3JlTmFtZV0pOyAvLyBpbml0aWFsIHZhbHVlIGlzIDBcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIG9wZW5TdWNjZXNzQ2FsbGJhY2snICsgJyBmaW5pc2hlZCcpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfY3JlYXRlT2JqZWN0U3RvcmVIYW5kbGVyKGNvbmZpZ1N0b3JlQ29uZmlnKSB7XG4gICAgX3BhcnNlSlNPTkRhdGEoY29uZmlnU3RvcmVDb25maWcsICdzdG9yZU5hbWUnKS5mb3JFYWNoKGZ1bmN0aW9uIGRldGVjdFN0b3JlTmFtZShzdG9yZUNvbmZpZykge1xuICAgICAgaWYgKCEoX2RiLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoc3RvcmVDb25maWcuc3RvcmVOYW1lKSkpIHtcbiAgICAgICAgX2NyZWF0ZU9iamVjdFN0b3JlKHN0b3JlQ29uZmlnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9jcmVhdGVPYmplY3RTdG9yZShzdG9yZUNvbmZpZykge1xuICAgIHZhciBzdG9yZSA9IF9kYi5jcmVhdGVPYmplY3RTdG9yZShzdG9yZUNvbmZpZy5zdG9yZU5hbWUsIHsga2V5UGF0aDogc3RvcmVDb25maWcua2V5LCBhdXRvSW5jcmVtZW50OiB0cnVlIH0pO1xuXG4gICAgLy8gVXNlIHRyYW5zYWN0aW9uIG9uY29tcGxldGUgdG8gbWFrZSBzdXJlIHRoZSBvYmplY3QgU3RvcmUgY3JlYXRpb24gaXMgZmluaXNoZWRcbiAgICBzdG9yZS50cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gYWRkaW5pdGlhbERhdGEoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBjcmVhdGUgJyArIHN0b3JlQ29uZmlnLnN0b3JlTmFtZSArICdcXCdzIG9iamVjdCBzdG9yZSBzdWNjZWVkJyk7XG4gICAgICBpZiAoc3RvcmVDb25maWcuaW5pdGlhbERhdGEpIHtcbiAgICAgICAgLy8gU3RvcmUgaW5pdGlhbCB2YWx1ZXMgaW4gdGhlIG5ld2x5IGNyZWF0ZWQgb2JqZWN0IHN0b3JlLlxuICAgICAgICBfaW5pdGlhbERhdGFIYW5kbGVyKHN0b3JlQ29uZmlnLnN0b3JlTmFtZSwgc3RvcmVDb25maWcuaW5pdGlhbERhdGEpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfaW5pdGlhbERhdGFIYW5kbGVyKHN0b3JlTmFtZSwgaW5pdGlhbERhdGEpIHtcbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcbiAgICB2YXIgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpO1xuXG4gICAgX3BhcnNlSlNPTkRhdGEoaW5pdGlhbERhdGEsICdpbml0aWFsJykuZm9yRWFjaChmdW5jdGlvbiBhZGRFdmVyeUluaXRpYWxEYXRhKGRhdGEsIGluZGV4KSB7XG4gICAgICB2YXIgYWRkUmVxdWVzdCA9IG9iamVjdFN0b3JlLmFkZChkYXRhKTtcblxuICAgICAgYWRkUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBhZGRJbml0aWFsU3VjY2VzcygpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgYWRkIGluaXRpYWwgZGF0YVsnICsgaW5kZXggKyAnXSBzdWNjZXNzZWQnKTtcbiAgICAgIH07XG4gICAgfSk7XG4gICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGFkZEFsbERhdGFEb25lKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgYWRkIGFsbCcgKyBzdG9yZU5hbWUgICsgJ1xcJ3MgaW5pdGlhbCBkYXRhIGRvbmUgOiknKTtcbiAgICAgIF9nZXRQcmVzZW50S2V5KHN0b3JlTmFtZSk7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9wYXJzZUpTT05EYXRhKHJhd2RhdGEsIG1lc3NhZ2UpIHtcbiAgICB0cnkge1xuICAgICAgdmFyIHBhcnNlZERhdGEgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHJhd2RhdGEpKTtcblxuICAgICAgcmV0dXJuIHBhcnNlZERhdGE7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHdpbmRvdy5hbGVydCgncGxlYXNlIHNldCBjb3JyZWN0JyArIG1lc3NhZ2UgICsgJ2FycmF5IG9iamVjdCA6KScpO1xuICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TGVuZ3RoKHN0b3JlTmFtZSkge1xuICAgIHJldHVybiBfcHJlc2VudEtleVtzdG9yZU5hbWVdO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TmV3S2V5KHN0b3JlTmFtZSkge1xuICAgIF9wcmVzZW50S2V5W3N0b3JlTmFtZV0gKz0gMTtcblxuICAgIHJldHVybiBfcHJlc2VudEtleVtzdG9yZU5hbWVdO1xuICB9XG5cbiAgLyogQ1JVRCAqL1xuXG4gIGZ1bmN0aW9uIGFkZEl0ZW0oc3RvcmVOYW1lLCBuZXdEYXRhLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcbiAgICB2YXIgYWRkUmVxdWVzdCA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHN0b3JlTmFtZSkuYWRkKG5ld0RhdGEpO1xuXG4gICAgYWRkUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBhZGRTdWNjZXNzKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgYWRkICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgYWRkUmVxdWVzdC5zb3VyY2Uua2V5UGF0aCArICcgPSAnICsgbmV3RGF0YVthZGRSZXF1ZXN0LnNvdXJjZS5rZXlQYXRoXSArICcgZGF0YSBzdWNjZWVkIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhuZXdEYXRhKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0SXRlbShzdG9yZU5hbWUsIGtleSwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdKTtcbiAgICB2YXIgZ2V0UmVxdWVzdCA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHN0b3JlTmFtZSkuZ2V0KHBhcnNlSW50KGtleSwgMTApKTsgIC8vIGdldCBpdCBieSBpbmRleFxuXG4gICAgZ2V0UmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRTdWNjZXNzKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgZ2V0ICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgZ2V0UmVxdWVzdC5zb3VyY2Uua2V5UGF0aCArICcgPSAnICsga2V5ICsgJyBkYXRhIHN1Y2Nlc3MgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKGdldFJlcXVlc3QucmVzdWx0KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLy8gZ2V0IGNvbmRpdGlvbmFsIGRhdGEgKGJvb2xlYW4gY29uZGl0aW9uKVxuICBmdW5jdGlvbiBnZXRXaGV0aGVyQ29uZGl0aW9uSXRlbShzdG9yZU5hbWUsIGNvbmRpdGlvbiwgd2hldGhlciwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdKTtcbiAgICB2YXIgcmVzdWx0ID0gW107IC8vIHVzZSBhbiBhcnJheSB0byBzdG9yYWdlIGVsaWdpYmxlIGRhdGFcblxuICAgIF9nZXRBbGxSZXF1ZXN0KHRyYW5zYWN0aW9uLCBzdG9yZU5hbWUpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGdldEFsbFN1Y2Nlc3MoZSkge1xuICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICBpZiAod2hldGhlcikge1xuICAgICAgICAgIGlmIChjdXJzb3IudmFsdWVbY29uZGl0aW9uXSkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goY3Vyc29yLnZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIXdoZXRoZXIpIHtcbiAgICAgICAgICBpZiAoIWN1cnNvci52YWx1ZVtjb25kaXRpb25dKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChjdXJzb3IudmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSBmdW5jdGlvbiBjb21wbGV0ZUFkZEFsbCgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGdldCAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgJyArIGNvbmRpdGlvbiArICcgOiAnICsgd2hldGhlciAgKyAnIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzdWx0KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0QWxsKHN0b3JlTmFtZSwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdKTtcbiAgICB2YXIgcmVzdWx0ID0gW107XG5cbiAgICBfZ2V0QWxsUmVxdWVzdCh0cmFuc2FjdGlvbiwgc3RvcmVOYW1lKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRBbGxTdWNjZXNzKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goY3Vyc29yLnZhbHVlKTtcbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gY29tcGxldGVHZXRBbGwoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBnZXQgJyArIHN0b3JlTmFtZSArICdcXCdzICcgKyAnYWxsIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzdWx0KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlSXRlbShzdG9yZU5hbWUsIGtleSwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdLCAncmVhZHdyaXRlJyk7XG4gICAgdmFyIGRlbGV0ZVJlcXVlc3QgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpLmRlbGV0ZShrZXkpO1xuXG4gICAgZGVsZXRlUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBkZWxldGVTdWNjZXNzKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgcmVtb3ZlICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgZGVsZXRlUmVxdWVzdC5zb3VyY2Uua2V5UGF0aCArICcgPSAnICsga2V5ICsgJyBkYXRhIHN1Y2Nlc3MgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKGtleSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZVdoZXRoZXJDb25kaXRpb25JdGVtKHN0b3JlTmFtZSwgY29uZGl0aW9uLCB3aGV0aGVyLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcblxuICAgIF9nZXRBbGxSZXF1ZXN0KHRyYW5zYWN0aW9uLCBzdG9yZU5hbWUpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGdldEFsbFN1Y2Nlc3MoZSkge1xuICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICBpZiAod2hldGhlcikge1xuICAgICAgICAgIGlmIChjdXJzb3IudmFsdWVbY29uZGl0aW9uXSkge1xuICAgICAgICAgICAgY3Vyc29yLmRlbGV0ZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghd2hldGhlcikge1xuICAgICAgICAgIGlmICghY3Vyc29yLnZhbHVlW2NvbmRpdGlvbl0pIHtcbiAgICAgICAgICAgIGN1cnNvci5kZWxldGUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gY29tcGxldGVSZW1vdmVXaGV0aGVyKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgcmVtb3ZlICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgY29uZGl0aW9uICsgJyA6ICcgKyB3aGV0aGVyICArICcgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjaygpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhcihzdG9yZU5hbWUsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuXG4gICAgX2dldEFsbFJlcXVlc3QodHJhbnNhY3Rpb24sIHN0b3JlTmFtZSkub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0QWxsU3VjY2VzcyhlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIGN1cnNvci5kZWxldGUoKTtcbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gY29tcGxldGVDbGVhcigpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGNsZWFyICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgJ2FsbCBkYXRhIHN1Y2Nlc3MgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKCdjbGVhciBhbGwgZGF0YSBzdWNjZXNzJyk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8vIHVwZGF0ZSBvbmVcbiAgZnVuY3Rpb24gdXBkYXRlSXRlbShzdG9yZU5hbWUsIG5ld0RhdGEsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuICAgIHZhciBwdXRSZXF1ZXN0ID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKS5wdXQobmV3RGF0YSk7XG5cbiAgICBwdXRSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIHB1dFN1Y2Nlc3MoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyB1cGRhdGUgJyArIHN0b3JlTmFtZSArICdcXCdzICcgKyBwdXRSZXF1ZXN0LnNvdXJjZS5rZXlQYXRoICsgJyA9ICcgKyBuZXdEYXRhW3B1dFJlcXVlc3Quc291cmNlLmtleVBhdGhdICsgJyBkYXRhIHN1Y2Nlc3MgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKG5ld0RhdGEpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfZ2V0QWxsUmVxdWVzdCh0cmFuc2FjdGlvbiwgc3RvcmVOYW1lKSB7XG4gICAgcmV0dXJuIHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHN0b3JlTmFtZSkub3BlbkN1cnNvcihJREJLZXlSYW5nZS5sb3dlckJvdW5kKDEpLCAnbmV4dCcpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvcGVuOiBvcGVuLFxuICAgIGdldExlbmd0aDogZ2V0TGVuZ3RoLFxuICAgIGdldE5ld0tleTogZ2V0TmV3S2V5LFxuICAgIGdldEl0ZW06IGdldEl0ZW0sXG4gICAgZ2V0V2hldGhlckNvbmRpdGlvbkl0ZW06IGdldFdoZXRoZXJDb25kaXRpb25JdGVtLFxuICAgIGdldEFsbDogZ2V0QWxsLFxuICAgIGFkZEl0ZW06IGFkZEl0ZW0sXG4gICAgcmVtb3ZlSXRlbTogcmVtb3ZlSXRlbSxcbiAgICByZW1vdmVXaGV0aGVyQ29uZGl0aW9uSXRlbTogcmVtb3ZlV2hldGhlckNvbmRpdGlvbkl0ZW0sXG4gICAgY2xlYXI6IGNsZWFyLFxuICAgIHVwZGF0ZUl0ZW06IHVwZGF0ZUl0ZW1cbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gSW5kZXhlZERCSGFuZGxlcjtcbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0ge1xuICBuYW1lOiAnSnVzdFRvRG8nLFxuICB2ZXJzaW9uOiAnMjMnLFxuICBzdG9yZUNvbmZpZzogW1xuICAgIHtcbiAgICAgIHN0b3JlTmFtZTogJ2xpc3QnLFxuICAgICAga2V5OiAnaWQnLFxuICAgICAgaW5pdGlhbERhdGE6IFtcbiAgICAgICAgeyBpZDogMCwgZXZlbnQ6ICdKdXN0RGVtbycsIGZpbmlzaGVkOiB0cnVlLCBkYXRlOiAwIH1cbiAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgIHN0b3JlTmFtZTogJ2FwaG9yaXNtJyxcbiAgICAgIGtleTogJ2lkJyxcbiAgICAgIGluaXRpYWxEYXRhOiBbXG4gICAgICAgIHtcbiAgICAgICAgICAnaWQnOiAxLFxuICAgICAgICAgICdjb250ZW50JzogXCJZb3UncmUgYmV0dGVyIHRoYW4gdGhhdFwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAnaWQnOiAyLFxuICAgICAgICAgICdjb250ZW50JzogJ1llc3RlcmRheSBZb3UgU2FpZCBUb21vcnJvdydcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICdpZCc6IDMsXG4gICAgICAgICAgJ2NvbnRlbnQnOiAnV2h5IGFyZSB3ZSBoZXJlPydcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICdpZCc6IDQsXG4gICAgICAgICAgJ2NvbnRlbnQnOiAnQWxsIGluLCBvciBub3RoaW5nJ1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgJ2lkJzogNSxcbiAgICAgICAgICAnY29udGVudCc6ICdZb3UgTmV2ZXIgVHJ5LCBZb3UgTmV2ZXIgS25vdydcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICdpZCc6IDYsXG4gICAgICAgICAgJ2NvbnRlbnQnOiAnVGhlIHVuZXhhbWluZWQgbGlmZSBpcyBub3Qgd29ydGggbGl2aW5nLiAtLSBTb2NyYXRlcydcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICdpZCc6IDcsXG4gICAgICAgICAgJ2NvbnRlbnQnOiAnVGhlcmUgaXMgb25seSBvbmUgdGhpbmcgd2Ugc2F5IHRvIGxhenk6IE5PVCBUT0RBWSdcbiAgICAgICAgfVxuICAgICAgXVxuICAgIH1cbiAgXVxufTtcbiIsIid1c2Ugc3RyaWN0JztcbihmdW5jdGlvbiBpbml0KCkge1xuICB2YXIgREIgPSByZXF1aXJlKCdpbmRleGVkZGItY3J1ZCcpO1xuICB2YXIgY29uZmlnID0gcmVxdWlyZSgnLi9kYi9jb25maWcuanMnKTtcbiAgdmFyIGFkZEV2ZW50cyA9IHJlcXVpcmUoJy4vdXRsaXMvYWRkRXZlbnRzLmpzJyk7XG5cbiAgLy8gb3BlbiBEQiwgYW5kIHdoZW4gREIgb3BlbiBzdWNjZWVkLCBpbnZva2UgaW5pdGlhbCBmdW5jdGlvblxuICBEQi5vcGVuKGNvbmZpZywgYWRkRXZlbnRzLmRiU3VjY2VzcywgYWRkRXZlbnRzLmRiRmFpbCk7XG59KCkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gYWRkRXZlbnRzR2VuZXJhdG9yKCkge1xuICBmdW5jdGlvbiBfd2hldGhlclN1Y2Nlc3Mod2hldGhlclN1Y2Nlc3MpIHtcbiAgICBmdW5jdGlvbiBfd2hldGhlclN1Y2Nlc3NIYW5kbGVyKHdoZXRoZXIpIHtcbiAgICAgIHZhciBsaXN0O1xuICAgICAgdmFyIGV2ZW50SGFuZGxlciA9IHJlcXVpcmUoJy4vZXZlbnRIYW5kbGVyL2V2ZW50SGFuZGxlci5qcycpO1xuICAgICAgdmFyIGhhbmRsZXIgPSB3aGV0aGVyID8gZXZlbnRIYW5kbGVyLmRiU3VjY2VzcyA6IGV2ZW50SGFuZGxlci5kYkZhaWw7XG5cbiAgICAgIGlmIChoYW5kbGVyID09PSBldmVudEhhbmRsZXIuZGJGYWlsKSB7XG4gICAgICAgIHdpbmRvdy5hbGVydCgnWW91ciBicm93c2VyIGRvZXNuXFwndCBzdXBwb3J0IGEgc3RhYmxlIHZlcnNpb24gb2YgSW5kZXhlZERCLiBXZSB3aWxsIG9mZmVyIHlvdSB0aGUgd2l0aG91dCBpbmRleGVkREIgbW9kZScpO1xuICAgICAgfVxuICAgICAgaGFuZGxlci5zaG93SW5pdCgpO1xuICAgICAgLy8gYWRkIGFsbCBldmVudExpc3RlbmVyXG4gICAgICBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgICAgIGxpc3QuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLmNsaWNrTGksIGZhbHNlKTtcbiAgICAgIGxpc3QuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnJlbW92ZUxpLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlci5lbnRlckFkZCwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FkZCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5hZGQsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93RG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93RG9uZSwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dUb2RvJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dUb2RvLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0FsbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93QWxsLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0NsZWFyRG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93Q2xlYXJEb25lLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0NsZWFyJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dDbGVhciwgZmFsc2UpO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBhZGRFdmVudHMoKSB7XG4gICAgICBfd2hldGhlclN1Y2Nlc3NIYW5kbGVyKHdoZXRoZXJTdWNjZXNzKTtcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBkYlN1Y2Nlc3M6IF93aGV0aGVyU3VjY2Vzcyh0cnVlKSxcbiAgICBkYkZhaWw6IF93aGV0aGVyU3VjY2VzcyhmYWxzZSlcbiAgfTtcbn0oKSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNsZWFyQ2hpbGROb2Rlcyhyb290KSB7XG4gIHdoaWxlIChyb290Lmhhc0NoaWxkTm9kZXMoKSkgeyAvLyBvciByb290LmZpcnN0Q2hpbGQgb3Igcm9vdC5sYXN0Q2hpbGRcbiAgICByb290LnJlbW92ZUNoaWxkKHJvb3QuZmlyc3RDaGlsZCk7XG4gIH1cbiAgLy8gb3Igcm9vdC5pbm5lckhUTUwgPSAnJ1xufTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBkYkZhaWwgPSAoZnVuY3Rpb24gZGJGYWlsR2VuZXJhdG9yKCkge1xuICB2YXIgcmVmcmVzaCA9IHJlcXVpcmUoJy4uL3JlZnJlc2gvcmVmcmVzaC5qcycpLmRiRmFpbDtcbiAgdmFyIGxpR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vbGlHZW5lcmF0b3IuanMnKTtcbiAgdmFyIGdlbmVyYWwgPSByZXF1aXJlKCcuL2dlbmVyYWwuanMnKTtcbiAgdmFyIF9pZCA9IDA7IC8vIHNvIHRoZSBmaXJzdCBpdGVtJ3MgaWQgaXMgMVxuICB2YXIgX2ZvckVhY2ggPSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaDsgLy8gc2ltcGxpZnlcblxuICBmdW5jdGlvbiBhZGQoKSB7XG4gICAgdmFyIGlucHV0VmFsdWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5wdXQnKS52YWx1ZTtcbiAgICB2YXIgbmV3RGF0YTtcbiAgICB2YXIgbGlzdDtcblxuICAgIGlmIChpbnB1dFZhbHVlID09PSAnJykge1xuICAgICAgd2luZG93LmFsZXJ0KCdwbGVhc2UgaW5wdXQgYSByZWFsIGRhdGF+Jyk7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgX3JlbW92ZVJhbmRvbShsaXN0KTtcbiAgICBfaWQgKz0gMTtcbiAgICBuZXdEYXRhID0gZ2VuZXJhbC5kYXRhR2VuZXJhdG9yKF9pZCwgaW5wdXRWYWx1ZSk7XG4gICAgbGlzdC5pbnNlcnRCZWZvcmUobGlHZW5lcmF0b3IobmV3RGF0YSksIGxpc3QuZmlyc3RDaGlsZCk7IC8vIHB1c2ggbmV3TGkgdG8gZmlyc3RcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5wdXQnKS52YWx1ZSA9ICcnOyAgLy8gcmVzZXQgaW5wdXQncyB2YWx1ZXNcblxuICAgIHJldHVybiAwO1xuICB9XG5cbiAgZnVuY3Rpb24gX3JlbW92ZVJhbmRvbShsaXN0KSB7XG4gICAgdmFyIGxpc3RJdGVtcyA9IGxpc3QuY2hpbGROb2RlcztcblxuICAgIF9mb3JFYWNoLmNhbGwobGlzdEl0ZW1zLCBmdW5jdGlvbiB3aGV0aGVySGFzUmFuZG9tKGl0ZW0pIHtcbiAgICAgIGlmIChpdGVtLmNsYXNzTGlzdC5jb250YWlucygnYXBob3Jpc20nKSkge1xuICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGl0ZW0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8vIG9yIHVzZSBmb3IuLi5pblxuICAgIC8vIGZvciAodmFyIGluZGV4IGluIGxpc3RJdGVtcykge1xuICAgIC8vICAgaWYgKGxpc3RJdGVtcy5oYXNPd25Qcm9wZXJ0eShpbmRleCkpIHtcbiAgICAvLyAgICAgaWYgKGxpc3RJdGVtc1tpbmRleF0uY2xhc3NMaXN0LmNvbnRhaW5zKCdhcGhvcmlzbScpKSB7XG4gICAgLy8gICAgICAgbGlzdC5yZW1vdmVDaGlsZChsaXN0SXRlbXNbaW5kZXhdKTtcbiAgICAvLyAgICAgfVxuICAgIC8vICAgfVxuICAgIC8vIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGVudGVyQWRkKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgYWRkKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY2xpY2tMaShlKSB7XG4gICAgdmFyIHRhcmdldExpID0gZS50YXJnZXQ7XG4gICAgLy8gdXNlIGV2ZW50IGRlbGVnYXRpb25cblxuICAgIGlmICh0YXJnZXRMaS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSkge1xuICAgICAgdGFyZ2V0TGkuY2xhc3NMaXN0LnRvZ2dsZSgnZmluaXNoZWQnKTtcbiAgICAgIHNob3dBbGwoKTtcbiAgICB9XG4gIH1cblxuICAvLyBsaSdzIFt4XSdzIGRlbGV0ZVxuICBmdW5jdGlvbiByZW1vdmVMaShlKSB7XG4gICAgaWYgKGUudGFyZ2V0LmNsYXNzTmFtZSA9PT0gJ2Nsb3NlJykgeyAvLyB1c2UgZXZlbnQgZGVsZWdhdGlvblxuICAgICAgX3JlbW92ZUxpSGFuZGxlcihlLnRhcmdldCk7XG4gICAgICBnZW5lcmFsLmlmRW1wdHkuYWRkUmFuZG9tKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX3JlbW92ZUxpSGFuZGxlcihlbGVtZW50KSB7XG4gICAgLy8gdXNlIHByZXZpb3VzbHkgc3RvcmVkIGRhdGFcbiAgICB2YXIgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgdmFyIGxpc3RJdGVtcyA9IGxpc3QuY2hpbGROb2RlcztcbiAgICB2YXIgaWQgPSBlbGVtZW50LnBhcmVudE5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyk7XG5cbiAgICB0cnkge1xuICAgICAgX2ZvckVhY2guY2FsbChsaXN0SXRlbXMsIGZ1bmN0aW9uIHdoZXRoZXJIYXNSYW5kb20oaXRlbSkge1xuICAgICAgICBpZiAoaXRlbS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSA9PT0gaWQpIHtcbiAgICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGl0ZW0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5sb2coJ1dyb25nIGlkLCBub3QgZm91bmQgaW4gRE9NIHRyZWUnKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgLy8gZm9yIFNlbWFudGljXG4gIGdlbmVyYWwuaWZFbXB0eS5hZGRSYW5kb20gPSBmdW5jdGlvbiBhZGRSYW5kb20oKSB7XG4gICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gICAgaWYgKCFsaXN0Lmhhc0NoaWxkTm9kZXMoKSB8fCBfYWxsRGlzYXBwZWFyKGxpc3QpKSB7XG4gICAgICByZWZyZXNoLnJhbmRvbSgpO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBfYWxsRGlzYXBwZWFyKGxpc3QpIHtcbiAgICB2YXIgbGlzdEl0ZW1zID0gbGlzdC5jaGlsZE5vZGVzO1xuXG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5ldmVyeS5jYWxsKGxpc3RJdGVtcywgZnVuY3Rpb24gd2hldGhlckhhc1JhbmRvbShpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS5zdHlsZS5kaXNwbGF5ID09PSAnbm9uZSc7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93SW5pdCgpIHtcbiAgICByZWZyZXNoLmNsZWFyKCk7XG4gICAgcmVmcmVzaC5pbml0KCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93QWxsKCkge1xuICAgIHZhciBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgICB2YXIgbGlzdEl0ZW1zID0gbGlzdC5jaGlsZE5vZGVzO1xuXG4gICAgX2ZvckVhY2guY2FsbChsaXN0SXRlbXMsIGZ1bmN0aW9uIGFwcGVhckFsbChpdGVtKSB7XG4gICAgICBfd2hldGhlckFwcGVhcihpdGVtLCB0cnVlKTtcbiAgICAgIGlmIChpdGVtLmNsYXNzTGlzdC5jb250YWlucygnZmluaXNoZWQnKSkge1xuICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGl0ZW0pO1xuICAgICAgICBsaXN0LmFwcGVuZENoaWxkKGl0ZW0pOyAvLyBQVU5DSExJTkU6IGRyb3AgZG9uZSBpdGVtXG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93RG9uZSgpIHtcbiAgICBfc2hvd1doZXRoZXJEb25lKHRydWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd1RvZG8oKSB7XG4gICAgX3Nob3dXaGV0aGVyRG9uZShmYWxzZSk7XG4gIH1cblxuICBmdW5jdGlvbiBfc2hvd1doZXRoZXJEb25lKHdoZXRoZXJEb25lKSB7XG4gICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgIHZhciBsaXN0SXRlbXMgPSBsaXN0LmNoaWxkTm9kZXM7XG5cbiAgICBfcmVtb3ZlUmFuZG9tKGxpc3QpO1xuICAgIF9mb3JFYWNoLmNhbGwobGlzdEl0ZW1zLCBmdW5jdGlvbiB3aGV0aGVyRG9uZUFwcGVhcihpdGVtKSB7XG4gICAgICBpdGVtLmNsYXNzTGlzdC5jb250YWlucygnZmluaXNoZWQnKSA/IF93aGV0aGVyQXBwZWFyKGl0ZW0sIHdoZXRoZXJEb25lKSA6IF93aGV0aGVyQXBwZWFyKGl0ZW0sICF3aGV0aGVyRG9uZSk7XG4gICAgfSk7XG4gICAgZ2VuZXJhbC5pZkVtcHR5LmFkZFJhbmRvbSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3doZXRoZXJBcHBlYXIoZWxlbWVudCwgd2hldGhlcikge1xuICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IHdoZXRoZXIgPyAnYmxvY2snIDogJ25vbmUnO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0NsZWFyRG9uZSgpIHtcbiAgICB2YXIgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgdmFyIGxpc3RJdGVtcyA9IGxpc3QuY2hpbGROb2RlcztcblxuICAgIF9yZW1vdmVSYW5kb20obGlzdCk7XG4gICAgX2ZvckVhY2guY2FsbChsaXN0SXRlbXMsIGZ1bmN0aW9uIGNsZWFyRG9uZUl0ZW1zKGl0ZW0pIHtcbiAgICAgIGlmIChpdGVtLmNsYXNzTGlzdC5jb250YWlucygnZmluaXNoZWQnKSkge1xuICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGl0ZW0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGdlbmVyYWwuaWZFbXB0eS5hZGRSYW5kb20oKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dDbGVhcigpIHtcbiAgICByZWZyZXNoLmNsZWFyKCk7IC8vIGNsZWFyIG5vZGVzIHZpc3VhbGx5XG4gICAgcmVmcmVzaC5yYW5kb20oKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYWRkOiBhZGQsXG4gICAgZW50ZXJBZGQ6IGVudGVyQWRkLFxuICAgIGNsaWNrTGk6IGNsaWNrTGksXG4gICAgcmVtb3ZlTGk6IHJlbW92ZUxpLFxuICAgIHNob3dJbml0OiBzaG93SW5pdCxcbiAgICBzaG93QWxsOiBzaG93QWxsLFxuICAgIHNob3dEb25lOiBzaG93RG9uZSxcbiAgICBzaG93VG9kbzogc2hvd1RvZG8sXG4gICAgc2hvd0NsZWFyRG9uZTogc2hvd0NsZWFyRG9uZSxcbiAgICBzaG93Q2xlYXI6IHNob3dDbGVhclxuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBkYkZhaWw7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgZGJTdWNjZXNzID0gKGZ1bmN0aW9uIGRiU3VjY2Vzc0dlbmVyYXRvcigpIHtcbiAgdmFyIHN0b3JlTmFtZSA9ICdsaXN0JztcbiAgdmFyIERCID0gcmVxdWlyZSgnaW5kZXhlZGRiLWNydWQnKTtcbiAgdmFyIHJlZnJlc2ggPSByZXF1aXJlKCcuLi9yZWZyZXNoL3JlZnJlc2guanMnKS5kYlN1Y2Nlc3M7XG4gIHZhciBsaUdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL2xpR2VuZXJhdG9yLmpzJyk7XG4gIHZhciBnZW5lcmFsID0gcmVxdWlyZSgnLi9nZW5lcmFsLmpzJyk7XG5cbiAgZnVuY3Rpb24gYWRkKCkge1xuICAgIHZhciBsaXN0O1xuICAgIHZhciBuZXdEYXRhO1xuICAgIHZhciBpbnB1dFZhbHVlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWU7XG5cbiAgICBpZiAoaW5wdXRWYWx1ZSA9PT0gJycpIHtcbiAgICAgIHdpbmRvdy5hbGVydCgncGxlYXNlIGlucHV0IGEgcmVhbCBkYXRhficpO1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGdlbmVyYWwuaWZFbXB0eS5yZW1vdmVJbml0KCk7XG4gICAgbmV3RGF0YSA9IGdlbmVyYWwuZGF0YUdlbmVyYXRvcihEQi5nZXROZXdLZXkoc3RvcmVOYW1lKSwgaW5wdXRWYWx1ZSk7XG4gICAgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgbGlzdC5pbnNlcnRCZWZvcmUobGlHZW5lcmF0b3IobmV3RGF0YSksIGxpc3QuZmlyc3RDaGlsZCk7IC8vIHB1c2ggbmV3TGkgdG8gZmlyc3RcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5wdXQnKS52YWx1ZSA9ICcnOyAgLy8gcmVzZXQgaW5wdXQncyB2YWx1ZXNcbiAgICBEQi5hZGRJdGVtKHN0b3JlTmFtZSwgbmV3RGF0YSk7XG5cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVudGVyQWRkKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgYWRkKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY2xpY2tMaShlKSB7XG4gICAgdmFyIGlkO1xuICAgIHZhciB0YXJnZXRMaSA9IGUudGFyZ2V0O1xuICAgIC8vIHVzZSBldmVudCBkZWxlZ2F0aW9uXG5cbiAgICBpZiAoIXRhcmdldExpLmNsYXNzTGlzdC5jb250YWlucygnYXBob3Jpc20nKSkge1xuICAgICAgaWYgKHRhcmdldExpLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpKSB7XG4gICAgICAgIHRhcmdldExpLmNsYXNzTGlzdC50b2dnbGUoJ2ZpbmlzaGVkJyk7IC8vIHRvZ2dsZSBhcHBlYXJhbmNlXG4gICAgICAgIGlkID0gcGFyc2VJbnQodGFyZ2V0TGkuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyksIDEwKTsgLy8gdXNlIHByZXZpb3VzbHkgc3RvcmVkIGRhdGEtaWQgYXR0cmlidXRlXG4gICAgICAgIERCLmdldEl0ZW0oc3RvcmVOYW1lLCBpZCwgX3RvZ2dsZUxpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfdG9nZ2xlTGkoZGF0YSkge1xuICAgIGRhdGEuZmluaXNoZWQgPSAhZGF0YS5maW5pc2hlZDtcbiAgICBEQi51cGRhdGVJdGVtKHN0b3JlTmFtZSwgZGF0YSwgc2hvd0FsbCk7XG4gIH1cblxuICAvLyBsaSdzIFt4XSdzIGRlbGV0ZVxuICBmdW5jdGlvbiByZW1vdmVMaShlKSB7XG4gICAgdmFyIGlkO1xuXG4gICAgaWYgKGUudGFyZ2V0LmNsYXNzTmFtZSA9PT0gJ2Nsb3NlJykgeyAvLyB1c2UgZXZlbnQgZGVsZWdhdGlvblxuICAgICAgLy8gdXNlIHByZXZpb3VzbHkgc3RvcmVkIGRhdGFcbiAgICAgIGlkID0gcGFyc2VJbnQoZS50YXJnZXQucGFyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSwgMTApO1xuICAgICAgREIucmVtb3ZlSXRlbShzdG9yZU5hbWUsIGlkLCBzaG93QWxsKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzaG93SW5pdCgpIHtcbiAgICByZWZyZXNoLmNsZWFyKCk7XG4gICAgREIuZ2V0QWxsKHN0b3JlTmFtZSwgcmVmcmVzaC5pbml0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dBbGwoKSB7XG4gICAgcmVmcmVzaC5jbGVhcigpO1xuICAgIERCLmdldEFsbChzdG9yZU5hbWUsIHJlZnJlc2guYWxsKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dEb25lKCkge1xuICAgIF9zaG93V2hldGhlckRvbmUodHJ1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93VG9kbygpIHtcbiAgICBfc2hvd1doZXRoZXJEb25lKGZhbHNlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zaG93V2hldGhlckRvbmUod2hldGhlckRvbmUpIHtcbiAgICB2YXIgY29uZGl0aW9uID0gJ2ZpbmlzaGVkJztcblxuICAgIHJlZnJlc2guY2xlYXIoKTtcbiAgICBEQi5nZXRXaGV0aGVyQ29uZGl0aW9uSXRlbShzdG9yZU5hbWUsIGNvbmRpdGlvbiwgd2hldGhlckRvbmUsIHJlZnJlc2gucGFydCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93Q2xlYXJEb25lKCkge1xuICAgIHZhciBjb25kaXRpb24gPSAnZmluaXNoZWQnO1xuXG4gICAgcmVmcmVzaC5jbGVhcigpO1xuICAgIERCLnJlbW92ZVdoZXRoZXJDb25kaXRpb25JdGVtKHN0b3JlTmFtZSwgY29uZGl0aW9uLCB0cnVlLCBmdW5jdGlvbiBzaG93TGVmdERhdGEoKSB7XG4gICAgICBEQi5nZXRBbGwoc3RvcmVOYW1lLCByZWZyZXNoLnBhcnQpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0NsZWFyKCkge1xuICAgIHJlZnJlc2guY2xlYXIoKTsgLy8gY2xlYXIgbm9kZXMgdmlzdWFsbHlcbiAgICByZWZyZXNoLnJhbmRvbSgpO1xuICAgIERCLmNsZWFyKHN0b3JlTmFtZSk7IC8vIGNsZWFyIGRhdGEgaW5kZWVkXG4gIH1cblxuICByZXR1cm4ge1xuICAgIGFkZDogYWRkLFxuICAgIGVudGVyQWRkOiBlbnRlckFkZCxcbiAgICBjbGlja0xpOiBjbGlja0xpLFxuICAgIHJlbW92ZUxpOiByZW1vdmVMaSxcbiAgICBzaG93SW5pdDogc2hvd0luaXQsXG4gICAgc2hvd0FsbDogc2hvd0FsbCxcbiAgICBzaG93RG9uZTogc2hvd0RvbmUsXG4gICAgc2hvd1RvZG86IHNob3dUb2RvLFxuICAgIHNob3dDbGVhckRvbmU6IHNob3dDbGVhckRvbmUsXG4gICAgc2hvd0NsZWFyOiBzaG93Q2xlYXJcbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZGJTdWNjZXNzO1xuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gZXZlbnRIYW5kbGVyR2VuZXJhdG9yKCkge1xuICB2YXIgZGJTdWNjZXNzID0gcmVxdWlyZSgnLi9kYlN1Y2Nlc3MuanMnKTtcbiAgdmFyIGRiRmFpbCA9IHJlcXVpcmUoJy4vZGJGYWlsLmpzJyk7XG5cbiAgcmV0dXJuIHtcbiAgICBkYlN1Y2Nlc3M6IGRiU3VjY2VzcyxcbiAgICBkYkZhaWw6IGRiRmFpbFxuICB9O1xufSgpKTtcbiIsInZhciBnZW5lcmFsID0gKGZ1bmN0aW9uIGdlbmVyYWxHZW5lcmF0b3IoKSB7XG4gIHZhciBpZkVtcHR5ID0ge1xuICAgIHJlbW92ZUluaXQ6IGZ1bmN0aW9uIHJlbW92ZUluaXQoKSB7XG4gICAgICB2YXIgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG5cbiAgICAgIGlmIChsaXN0LmZpcnN0Q2hpbGQuY2xhc3NOYW1lID09PSAnYXBob3Jpc20nKSB7XG4gICAgICAgIGxpc3QucmVtb3ZlQ2hpbGQobGlzdC5maXJzdENoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gZGF0YUdlbmVyYXRvcihrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiBrZXksXG4gICAgICBldmVudDogdmFsdWUsXG4gICAgICBmaW5pc2hlZDogZmFsc2UsXG4gICAgICBkYXRlOiBfZ2V0TmV3RGF0ZSgneXl5eeW5tE1N5pyIZGTml6UgaGg6bW0nKVxuICAgIH07XG4gIH1cblxuICAvLyBGb3JtYXQgZGF0ZVxuICBmdW5jdGlvbiBfZ2V0TmV3RGF0ZShmbXQpIHtcbiAgICB2YXIgbmV3RGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgdmFyIG5ld2ZtdCA9IGZtdDtcbiAgICB2YXIgbyA9IHtcbiAgICAgICd5Kyc6IG5ld0RhdGUuZ2V0RnVsbFllYXIoKSxcbiAgICAgICdNKyc6IG5ld0RhdGUuZ2V0TW9udGgoKSArIDEsXG4gICAgICAnZCsnOiBuZXdEYXRlLmdldERhdGUoKSxcbiAgICAgICdoKyc6IG5ld0RhdGUuZ2V0SG91cnMoKSxcbiAgICAgICdtKyc6IG5ld0RhdGUuZ2V0TWludXRlcygpXG4gICAgfTtcbiAgICB2YXIgbGVucztcblxuICAgIGZvciAodmFyIGsgaW4gbykge1xuICAgICAgaWYgKG5ldyBSZWdFeHAoJygnICsgayArICcpJykudGVzdChuZXdmbXQpKSB7XG4gICAgICAgIGlmIChrID09PSAneSsnKSB7XG4gICAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoJycgKyBvW2tdKS5zdWJzdHIoNCAtIFJlZ0V4cC4kMS5sZW5ndGgpKTtcbiAgICAgICAgfSBlbHNlIGlmIChrID09PSAnUysnKSB7XG4gICAgICAgICAgbGVucyA9IFJlZ0V4cC4kMS5sZW5ndGg7XG4gICAgICAgICAgbGVucyA9IGxlbnMgPT09IDEgPyAzIDogbGVucztcbiAgICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsICgnMDAnICsgb1trXSkuc3Vic3RyKCgnJyArIG9ba10pLmxlbmd0aCAtIDEsIGxlbnMpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChSZWdFeHAuJDEubGVuZ3RoID09PSAxKSA/IChvW2tdKSA6ICgoJzAwJyArIG9ba10pLnN1YnN0cigoJycgKyBvW2tdKS5sZW5ndGgpKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbmV3Zm10O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpZkVtcHR5OiBpZkVtcHR5LFxuICAgIGRhdGFHZW5lcmF0b3I6IGRhdGFHZW5lcmF0b3JcbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZ2VuZXJhbDtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBsaUdlbmVyYXRvciA9IChmdW5jdGlvbiBsaUdlbmVyYXRvcigpIHtcbiAgZnVuY3Rpb24gX2RlY29yYXRlTGkobGksIGRhdGEpIHtcbiAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcgJyArIGRhdGEuZXZlbnQpO1xuICAgIHZhciB0ZXh0RGF0ZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGEuZGF0ZSArICc6ICcpO1xuICAgIHZhciB0ZXh0V3JhcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcblxuICAgIC8vIHdyYXAgYXMgYSBub2RlXG4gICAgdGV4dFdyYXAuYXBwZW5kQ2hpbGQodGV4dCk7XG4gICAgbGkuYXBwZW5kQ2hpbGQodGV4dERhdGUpO1xuICAgIGxpLmFwcGVuZENoaWxkKHRleHRXcmFwKTtcbiAgICBpZiAoZGF0YS5maW5pc2hlZCkgeyAgLy8gYWRkIGNzcy1zdHlsZSB0byBpdCAoYWNjb3JkaW5nIHRvIGl0J3MgZGF0YS5maW5pc2hlZCB2YWx1ZSlcbiAgICAgIGxpLmNsYXNzTGlzdC5hZGQoJ2ZpbmlzaGVkJyk7IC8vIGFkZCBzdHlsZVxuICAgIH1cbiAgICBfYWRkWChsaSk7IC8vIGFkZCBzcGFuIFt4XSB0byBsaSdzIHRhaWxcbiAgICBfc2V0RGF0YVByb3BlcnR5KGxpLCAnZGF0YS1pZCcsIGRhdGEuaWQpOyAvLyBhZGQgcHJvcGVydHkgdG8gbGkgKGRhdGEtaWQp77yMZm9yICBjbGlja0xpXG4gIH1cblxuICBmdW5jdGlvbiBfYWRkWChsaSkge1xuICAgIHZhciBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHZhciB4ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJ1xcdTAwRDcnKTsgLy8gdW5pY29kZSAtPiB4XG5cbiAgICBzcGFuLmFwcGVuZENoaWxkKHgpO1xuICAgIHNwYW4uY2xhc3NOYW1lID0gJ2Nsb3NlJzsgLy8gYWRkIHN0eWxlXG4gICAgbGkuYXBwZW5kQ2hpbGQoc3Bhbik7XG4gIH1cblxuICBmdW5jdGlvbiBfc2V0RGF0YVByb3BlcnR5KHRhcmdldCwgbmFtZSwgZGF0YSkge1xuICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUobmFtZSwgZGF0YSk7XG4gIH1cblxuXG4gIHJldHVybiBmdW5jdGlvbiBjcmVhdGUoZGF0YSkge1xuICAgIHZhciBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG5cbiAgICBfZGVjb3JhdGVMaShsaSwgZGF0YSk7IC8vIGRlY29yYXRlIGxpXG5cbiAgICByZXR1cm4gbGk7XG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGxpR2VuZXJhdG9yO1xuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gZGJGYWlsR2VuZXJhdG9yKCkge1xuICB2YXIgZ2VuZXJhbCA9IHJlcXVpcmUoJy4vZ2VuZXJhbC5qcycpO1xuXG4gIGZ1bmN0aW9uIHJhbmRvbUFwaG9yaXNtKCkge1xuICAgIHZhciBhcGhvcmlzbXMgPSBbXG4gICAgICAnWWVzdGVyZGF5IFlvdSBTYWlkIFRvbW9ycm93JyxcbiAgICAgICdXaHkgYXJlIHdlIGhlcmU/JyxcbiAgICAgICdBbGwgaW4sIG9yIG5vdGhpbmcnLFxuICAgICAgJ1lvdSBOZXZlciBUcnksIFlvdSBOZXZlciBLbm93JyxcbiAgICAgICdUaGUgdW5leGFtaW5lZCBsaWZlIGlzIG5vdCB3b3J0aCBsaXZpbmcuIC0tIFNvY3JhdGVzJyxcbiAgICAgICdUaGVyZSBpcyBvbmx5IG9uZSB0aGluZyB3ZSBzYXkgdG8gbGF6eTogTk9UIFRPREFZJ1xuICAgIF07XG4gICAgdmFyIHJhbmRvbUluZGV4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXBob3Jpc21zLmxlbmd0aCk7XG4gICAgdmFyIHRleHQgPSBhcGhvcmlzbXNbcmFuZG9tSW5kZXhdO1xuXG4gICAgZ2VuZXJhbC5zZW50ZW5jZUhhbmRsZXIodGV4dCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGluaXQ6IGdlbmVyYWwuaW5pdCxcbiAgICBhbGw6IGdlbmVyYWwuYWxsLmJpbmQobnVsbCwgcmFuZG9tQXBob3Jpc20pLFxuICAgIHBhcnQ6IGdlbmVyYWwucGFydC5iaW5kKG51bGwsIHJhbmRvbUFwaG9yaXNtKSxcbiAgICBjbGVhcjogZ2VuZXJhbC5jbGVhcixcbiAgICByYW5kb206IHJhbmRvbUFwaG9yaXNtXG4gIH07XG59KCkpO1xuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiBkYlN1Y2Nlc3NHZW5lcmF0b3IoKSB7XG4gIHZhciBzdG9yZU5hbWUgPSAnYXBob3Jpc20nO1xuICB2YXIgREIgPSByZXF1aXJlKCdpbmRleGVkZGItY3J1ZCcpO1xuICB2YXIgZ2VuZXJhbCA9IHJlcXVpcmUoJy4vZ2VuZXJhbC5qcycpO1xuXG4gIGZ1bmN0aW9uIHJhbmRvbUFwaG9yaXNtKCkge1xuICAgIHZhciByYW5kb21JbmRleCA9IE1hdGguY2VpbChNYXRoLnJhbmRvbSgpICogREIuZ2V0TGVuZ3RoKHN0b3JlTmFtZSkpO1xuXG4gICAgREIuZ2V0SXRlbShzdG9yZU5hbWUsIHJhbmRvbUluZGV4LCBfcGFyc2VUZXh0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9wYXJzZVRleHQoZGF0YSkge1xuICAgIHZhciB0ZXh0ID0gZGF0YS5jb250ZW50O1xuXG4gICAgZ2VuZXJhbC5zZW50ZW5jZUhhbmRsZXIodGV4dCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGluaXQ6IGdlbmVyYWwuaW5pdCxcbiAgICBhbGw6IGdlbmVyYWwuYWxsLmJpbmQobnVsbCwgcmFuZG9tQXBob3Jpc20pLCAgLy8gUFVOQ0hMSU5FOiB1c2UgYmluZCB0byBwYXNzIHBhcmFtdGVyXG4gICAgcGFydDogZ2VuZXJhbC5wYXJ0LmJpbmQobnVsbCwgcmFuZG9tQXBob3Jpc20pLFxuICAgIGNsZWFyOiBnZW5lcmFsLmNsZWFyLFxuICAgIHJhbmRvbTogcmFuZG9tQXBob3Jpc21cbiAgfTtcbn0oKSk7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgZ2VuZXJhbCA9IChmdW5jdGlvbiBnZW5lcmFsR2VuZXJhdG9yKCkge1xuICB2YXIgbGlHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9saUdlbmVyYXRvci5qcycpO1xuICB2YXIgY2xlYXJDaGlsZE5vZGVzID0gcmVxdWlyZSgnLi4vY2xlYXJDaGlsZE5vZGVzLmpzJyk7XG5cbiAgZnVuY3Rpb24gaW5pdChkYXRhQXJyKSB7XG4gICAgX3Nob3coX2luaXRTZW50ZW5jZSwgX3Nob3dBbGwsIGRhdGFBcnIpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3Nob3coc2hvd1NlbnRlbmNlRnVuYywgc2hvd0Z1bmMsIGRhdGFBcnIpIHtcbiAgICBpZiAoIWRhdGFBcnIgfHwgZGF0YUFyci5sZW5ndGggPT09IDApIHtcbiAgICAgIHNob3dTZW50ZW5jZUZ1bmMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2hvd0Z1bmMoZGF0YUFycik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX2luaXRTZW50ZW5jZSgpIHtcbiAgICB2YXIgdGV4dCA9ICdXZWxjb21lfiwgdHJ5IHRvIGFkZCB5b3VyIGZpcnN0IHRvLWRvIGxpc3QgOiApJztcblxuICAgIHNlbnRlbmNlSGFuZGxlcih0ZXh0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zaG93QWxsKGRhdGFBcnIpIHtcbiAgICB2YXIgcmVzdWx0ID0gX2NsYXNzaWZ5RGF0YShkYXRhQXJyKTtcblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuYXBwZW5kQ2hpbGQocmVzdWx0KTsgLy8gYWRkIGl0IHRvIERPTVxuICB9XG5cbiAgZnVuY3Rpb24gX2NsYXNzaWZ5RGF0YShkYXRhQXJyKSB7XG4gICAgLy8gUFVOQ0hMSU5FOiB1c2UgZnJhZ21lbnQgdG8gcmVkdWNlIERPTSBvcGVyYXRlXG4gICAgdmFyIHVuZmlzaGllZCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB2YXIgZmluaXNoZWQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIG1peCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblxuICAgIC8vIHB1dCB0aGUgZmluaXNoZWQgaXRlbSB0byB0aGUgYm90dG9tXG4gICAgZGF0YUFyci5mb3JFYWNoKGZ1bmN0aW9uIGNsYXNzaWZ5KGRhdGEpIHtcbiAgICAgIGlmIChkYXRhLmZpbmlzaGVkKSB7XG4gICAgICAgIGZpbmlzaGVkLmluc2VydEJlZm9yZShsaUdlbmVyYXRvcihkYXRhKSwgZmluaXNoZWQuZmlyc3RDaGlsZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1bmZpc2hpZWQuaW5zZXJ0QmVmb3JlKGxpR2VuZXJhdG9yKGRhdGEpLCB1bmZpc2hpZWQuZmlyc3RDaGlsZCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgbWl4LmFwcGVuZENoaWxkKHVuZmlzaGllZCk7XG4gICAgbWl4LmFwcGVuZENoaWxkKGZpbmlzaGVkKTtcblxuICAgIHJldHVybiBtaXg7XG4gIH1cblxuICBmdW5jdGlvbiBhbGwocmFuZG9tQXBob3Jpc20sIGRhdGFBcnIpIHtcbiAgICBfc2hvdyhyYW5kb21BcGhvcmlzbSwgX3Nob3dBbGwsIGRhdGFBcnIpO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFydChyYW5kb21BcGhvcmlzbSwgZGF0YUFycikge1xuICAgIF9zaG93KHJhbmRvbUFwaG9yaXNtLCBfc2hvd3BhcnQsIGRhdGFBcnIpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3Nob3dwYXJ0KGRhdGFBcnIpIHtcbiAgICB2YXIgbm9kZXMgPSBkYXRhQXJyLnJlZHVjZShmdW5jdGlvbiBub2RlR2VuZXJhdG9yKHJlc3VsdCwgZGF0YSkge1xuICAgICAgcmVzdWx0Lmluc2VydEJlZm9yZShsaUdlbmVyYXRvcihkYXRhKSwgcmVzdWx0LmZpcnN0Q2hpbGQpO1xuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sIGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKSk7IC8vIFBVTkNITElORTogYnJpbGxpYW50IGFyci5yZWR1Y2UoKSArIGRvY3VtZW50RnJhZ21lbnRcblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuYXBwZW5kQ2hpbGQobm9kZXMpOyAvLyBhZGQgaXQgdG8gRE9NXG4gIH1cblxuICBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICBjbGVhckNoaWxkTm9kZXMoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKSk7XG4gIH1cblxuICBmdW5jdGlvbiBzZW50ZW5jZUhhbmRsZXIodGV4dCkge1xuICAgIHZhciBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgdmFyIHRleHROb2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dCk7XG5cbiAgICBsaS5hcHBlbmRDaGlsZCh0ZXh0Tm9kZSk7XG4gICAgbGkuY2xhc3NOYW1lID0gJ2FwaG9yaXNtJztcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmFwcGVuZENoaWxkKGxpKTtcbiAgfVxuXG5cbiAgcmV0dXJuIHtcbiAgICBpbml0OiBpbml0LFxuICAgIGFsbDogYWxsLFxuICAgIHBhcnQ6IHBhcnQsXG4gICAgY2xlYXI6IGNsZWFyLFxuICAgIHNlbnRlbmNlSGFuZGxlcjogc2VudGVuY2VIYW5kbGVyXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdlbmVyYWw7XG4iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiByZWZyZXNoR2VuZXJhdG9yKCkge1xuICB2YXIgZGJTdWNjZXNzID0gcmVxdWlyZSgnLi9kYlN1Y2Nlc3MuanMnKTtcbiAgdmFyIGRiRmFpbCA9IHJlcXVpcmUoJy4vZGJGYWlsLmpzJyk7XG5cbiAgcmV0dXJuIHtcbiAgICBkYlN1Y2Nlc3M6IGRiU3VjY2VzcyxcbiAgICBkYkZhaWw6IGRiRmFpbFxuICB9O1xufSgpKTtcbiJdfQ==
