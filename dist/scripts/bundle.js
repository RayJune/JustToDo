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
  var DBConfig = require('./db/config.js');
  var addEvents = require('./utlis/addEvents.js');

  // open DB, and when DB open succeed, invoke initial function
  DB.open(DBConfig, addEvents.dbSuccess, addEvents.dbFail);
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

  function add() {
    var inputValue = document.querySelector('#input').value;
    var list;
    var newData;
    var newLi;

    if (inputValue === '') {
      window.alert('please input a real data~');
      return 0;
    }
    _removeRandom();
    _id += 1;
    newData = general.dataGenerator(_id, inputValue);
    newLi = liGenerator(newData);
    list = document.querySelector('#list');
    list.insertBefore(newLi, list.firstChild); // push newLi to first
    document.querySelector('#input').value = '';  // reset input's values

    return 0;
  }

  function _removeRandom() {
    var keys = Object.keys(listItems);
    var list = document.querySelector('#list');
    var listItems = document.querySelectorAll('#list li');

    return keys.forEach(function testEveryItem(index) {
      if (listItems[keys[index]].classList.contains('aphorism')) {
        list.removeChild(listItems[keys[index]]);
      }
    });
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
      _toggleLi(targetLi);
      showAll();
    }
  }

  function _toggleLi(targetLi) {
    targetLi.classList.toggle('finished');
  }

  // li's [x]'s delete
  function removeLi(e) {
    var id;
    var DOMIndex;
    var list;
    var listItems;

    if (e.target.className === 'close') { // use event delegation
      // use previously stored data
      list = document.querySelector('#list');
      listItems = document.querySelectorAll('#list li');
      id = e.target.parentNode.getAttribute('data-id');
      DOMIndex = _getDOMIndex(id);
      list.removeChild(listItems[DOMIndex]);
      general.ifEmpty.addRandom();
    }
  }

  function _getDOMIndex(id) {
    var i;
    var keys = Object.keys(listItems);
    var listItems = document.querySelectorAll('#list li');

    for (i in keys) {
      if (listItems[keys[i]].getAttribute('data-id') === id) {
        return keys[i];
      }
    }

    return 'Wrong id, not found in DOM tree';
  }

  general.ifEmpty.addRandom = function addRandom() {
    var list = document.querySelector('#list');

    if (!list.firstChild || _isAllNone()) {
      refresh.random();
    }
  };

  function _isAllNone() {
    var keys = Object.keys(listItems);
    var listItems = document.querySelectorAll('#list li');

    return keys.every(function testEveryItem(index) {
      return listItems[keys[index]].style.display === 'none';
    });
  }

  function showInit() {
    refresh.clear();
    refresh.init();
  }

  function showAll() {
    var keys = Object.keys(document.querySelectorAll('#list li'));

    keys.forEach(function appearAll(index) {
      var list = document.querySelector('#list');
      var listItems = document.querySelectorAll('#list li');
      var element = listItems[keys[index]];

      _whetherAppear(element, true);
      if (element.classList.contains('finished')) {
        list.removeChild(list.childNodes[keys[index]]);
        list.appendChild(element);
      }
    });
  }

  function showClear() {
    refresh.clear(); // clear nodes visually
    refresh.random();
  }

  function showDone() {
    _showWhetherDone(true);
  }

  function showTodo() {
    _showWhetherDone(false);
  }

  function _showWhetherDone(whetherDone) {
    Array.prototype.forEach.call(document.querySelectorAll('#list li'), function whetherDoneAppear(element) {
      if (whetherDone) {
        element.classList.contains('finished') ? _whetherAppear(element, true) : _whetherAppear(element, false);
      } else {
        element.classList.contains('finished') ? _whetherAppear(element, false) : _whetherAppear(element, true);
      }
    });
    _removeRandom();
    general.ifEmpty.addRandom();
  }

  function _whetherAppear(element, whether) {
    element.style.display = whether ? 'block' : 'none';
  }

  return {
    add: add,
    enterAdd: enterAdd,
    clickLi: clickLi,
    removeLi: removeLi,
    showInit: showInit,
    showAll: showAll,
    showClear: showClear,
    showDone: showDone,
    showTodo: showTodo
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

  function showClear() {
    refresh.clear(); // clear nodes visually
    refresh.random();
    DB.clear(storeName); // clear data indeed
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

  function _toggleLi(data) {
    data.finished = !data.finished;
    DB.updateItem(storeName, data, showAll);
  }

  return {
    add: add,
    enterAdd: enterAdd,
    clickLi: clickLi,
    removeLi: removeLi,
    showInit: showInit,
    showAll: showAll,
    showClear: showClear,
    showDone: showDone,
    showTodo: showTodo
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5kZXhlZGRiLWNydWQvaW5kZXhlZGRiLWNydWQuanMiLCJzcmMvc2NyaXB0cy9kYi9jb25maWcuanMiLCJzcmMvc2NyaXB0cy9tYWluLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvYWRkRXZlbnRzLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvY2xlYXJDaGlsZE5vZGVzLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZXZlbnRIYW5kbGVyL2RiRmFpbC5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2V2ZW50SGFuZGxlci9kYlN1Y2Nlc3MuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9ldmVudEhhbmRsZXIvZXZlbnRIYW5kbGVyLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZXZlbnRIYW5kbGVyL2dlbmVyYWwuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9saUdlbmVyYXRvci5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL3JlZnJlc2gvZGJGYWlsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvcmVmcmVzaC9kYlN1Y2Nlc3MuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9yZWZyZXNoL2dlbmVyYWwuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9yZWZyZXNoL3JlZnJlc2guanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG52YXIgSW5kZXhlZERCSGFuZGxlciA9IChmdW5jdGlvbiBpbml0KCkge1xuICB2YXIgX2RiO1xuICB2YXIgX3ByZXNlbnRLZXkgPSB7fTsgLy8gc3RvcmUgbXVsdGktb2JqZWN0U3RvcmUncyBwcmVzZW50S2V5XG5cbiAgZnVuY3Rpb24gb3Blbihjb25maWcsIG9wZW5TdWNjZXNzQ2FsbGJhY2ssIG9wZW5GYWlsQ2FsbGJhY2spIHtcbiAgLy8gaW5pdCBpbmRleGVkREJcbiAgLy8gZmlyc3RseSBpbnNwZWN0IGJyb3dzZXIncyBzdXBwb3J0IGZvciBpbmRleGVkREJcbiAgICBpZiAoIXdpbmRvdy5pbmRleGVkREIpIHtcbiAgICAgIGlmIChvcGVuRmFpbENhbGxiYWNrKSB7XG4gICAgICAgIG9wZW5GYWlsQ2FsbGJhY2soKTsgLy8gUFVOQ0hMSU5FOiBvZmZlciB3aXRob3V0LURCIGhhbmRsZXJcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdpbmRvdy5hbGVydCgnXFx1MjcxNCBZb3VyIGJyb3dzZXIgZG9lc25cXCd0IHN1cHBvcnQgYSBzdGFibGUgdmVyc2lvbiBvZiBJbmRleGVkREIuIFlvdSBjYW4gaW5zdGFsbCBsYXRlc3QgQ2hyb21lIG9yIEZpcmVGb3ggdG8gaGFuZGxlciBpdCcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIF9vcGVuSGFuZGxlcihjb25maWcsIG9wZW5TdWNjZXNzQ2FsbGJhY2spO1xuXG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICBmdW5jdGlvbiBfb3BlbkhhbmRsZXIoY29uZmlnLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgb3BlblJlcXVlc3QgPSB3aW5kb3cuaW5kZXhlZERCLm9wZW4oY29uZmlnLm5hbWUsIGNvbmZpZy52ZXJzaW9uKTsgLy8gb3BlbiBpbmRleGVkREJcblxuICAgIC8vIGFuIG9uYmxvY2tlZCBldmVudCBpcyBmaXJlZCB1bnRpbCB0aGV5IGFyZSBjbG9zZWQgb3IgcmVsb2FkZWRcbiAgICBvcGVuUmVxdWVzdC5vbmJsb2NrZWQgPSBmdW5jdGlvbiBibG9ja2VkU2NoZW1lVXAoKSB7XG4gICAgICAvLyBJZiBzb21lIG90aGVyIHRhYiBpcyBsb2FkZWQgd2l0aCB0aGUgZGF0YWJhc2UsIHRoZW4gaXQgbmVlZHMgdG8gYmUgY2xvc2VkIGJlZm9yZSB3ZSBjYW4gcHJvY2VlZC5cbiAgICAgIHdpbmRvdy5hbGVydCgnUGxlYXNlIGNsb3NlIGFsbCBvdGhlciB0YWJzIHdpdGggdGhpcyBzaXRlIG9wZW4nKTtcbiAgICB9O1xuXG4gICAgLy8gQ3JlYXRpbmcgb3IgdXBkYXRpbmcgdGhlIHZlcnNpb24gb2YgdGhlIGRhdGFiYXNlXG4gICAgb3BlblJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24gc2NoZW1hVXAoZSkge1xuICAgICAgLy8gQWxsIG90aGVyIGRhdGFiYXNlcyBoYXZlIGJlZW4gY2xvc2VkLiBTZXQgZXZlcnl0aGluZyB1cC5cbiAgICAgIF9kYiA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIG9udXBncmFkZW5lZWRlZCBpbicpO1xuICAgICAgX2NyZWF0ZU9iamVjdFN0b3JlSGFuZGxlcihjb25maWcuc3RvcmVDb25maWcpO1xuICAgIH07XG5cbiAgICBvcGVuUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBvcGVuU3VjY2VzcyhlKSB7XG4gICAgICBfZGIgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICBfZGIub252ZXJzaW9uY2hhbmdlID0gZnVuY3Rpb24gdmVyc2lvbmNoYW5nZUhhbmRsZXIoKSB7XG4gICAgICAgIF9kYi5jbG9zZSgpO1xuICAgICAgICB3aW5kb3cuYWxlcnQoJ0EgbmV3IHZlcnNpb24gb2YgdGhpcyBwYWdlIGlzIHJlYWR5LiBQbGVhc2UgcmVsb2FkJyk7XG4gICAgICB9O1xuICAgICAgX29wZW5TdWNjZXNzQ2FsbGJhY2tIYW5kbGVyKGNvbmZpZy5zdG9yZUNvbmZpZywgc3VjY2Vzc0NhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgLy8gdXNlIGVycm9yIGV2ZW50cyBidWJibGUgdG8gaGFuZGxlIGFsbCBlcnJvciBldmVudHNcbiAgICBvcGVuUmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24gb3BlbkVycm9yKGUpIHtcbiAgICAgIHdpbmRvdy5hbGVydCgnU29tZXRoaW5nIGlzIHdyb25nIHdpdGggaW5kZXhlZERCLCBmb3IgbW9yZSBpbmZvcm1hdGlvbiwgY2hlY2tvdXQgY29uc29sZScpO1xuICAgICAgY29uc29sZS5sb2coZS50YXJnZXQuZXJyb3IpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGUudGFyZ2V0LmVycm9yKTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gX29wZW5TdWNjZXNzQ2FsbGJhY2tIYW5kbGVyKGNvbmZpZ1N0b3JlQ29uZmlnLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgb2JqZWN0U3RvcmVMaXN0ID0gX3BhcnNlSlNPTkRhdGEoY29uZmlnU3RvcmVDb25maWcsICdzdG9yZU5hbWUnKTtcblxuICAgIG9iamVjdFN0b3JlTGlzdC5mb3JFYWNoKGZ1bmN0aW9uIGRldGVjdFN0b3JlTmFtZShzdG9yZUNvbmZpZywgaW5kZXgpIHtcbiAgICAgIGlmIChpbmRleCA9PT0gKG9iamVjdFN0b3JlTGlzdC5sZW5ndGggLSAxKSkge1xuICAgICAgICBfZ2V0UHJlc2VudEtleShzdG9yZUNvbmZpZy5zdG9yZU5hbWUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soKTtcbiAgICAgICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBvcGVuIGluZGV4ZWREQiBzdWNjZXNzJyk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX2dldFByZXNlbnRLZXkoc3RvcmVDb25maWcuc3RvcmVOYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIHNldCBwcmVzZW50IGtleSB2YWx1ZSB0byBfcHJlc2VudEtleSAodGhlIHByaXZhdGUgcHJvcGVydHkpXG4gIGZ1bmN0aW9uIF9nZXRQcmVzZW50S2V5KHN0b3JlTmFtZSwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdKTtcblxuICAgIF9wcmVzZW50S2V5W3N0b3JlTmFtZV0gPSAwO1xuICAgIF9nZXRBbGxSZXF1ZXN0KHRyYW5zYWN0aW9uLCBzdG9yZU5hbWUpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGdldEFsbFN1Y2Nlc3MoZSkge1xuICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICBfcHJlc2VudEtleVtzdG9yZU5hbWVdID0gY3Vyc29yLnZhbHVlLmlkO1xuICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSBmdW5jdGlvbiBjb21wbGV0ZUdldFByZXNlbnRLZXkoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBub3cgJyArIHN0b3JlTmFtZSArICdcXCdzIG1heCBrZXkgaXMgJyArICBfcHJlc2VudEtleVtzdG9yZU5hbWVdKTsgLy8gaW5pdGlhbCB2YWx1ZSBpcyAwXG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjaygpO1xuICAgICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBvcGVuU3VjY2Vzc0NhbGxiYWNrJyArICcgZmluaXNoZWQnKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gX2NyZWF0ZU9iamVjdFN0b3JlSGFuZGxlcihjb25maWdTdG9yZUNvbmZpZykge1xuICAgIF9wYXJzZUpTT05EYXRhKGNvbmZpZ1N0b3JlQ29uZmlnLCAnc3RvcmVOYW1lJykuZm9yRWFjaChmdW5jdGlvbiBkZXRlY3RTdG9yZU5hbWUoc3RvcmVDb25maWcpIHtcbiAgICAgIGlmICghKF9kYi5vYmplY3RTdG9yZU5hbWVzLmNvbnRhaW5zKHN0b3JlQ29uZmlnLnN0b3JlTmFtZSkpKSB7XG4gICAgICAgIF9jcmVhdGVPYmplY3RTdG9yZShzdG9yZUNvbmZpZyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBfY3JlYXRlT2JqZWN0U3RvcmUoc3RvcmVDb25maWcpIHtcbiAgICB2YXIgc3RvcmUgPSBfZGIuY3JlYXRlT2JqZWN0U3RvcmUoc3RvcmVDb25maWcuc3RvcmVOYW1lLCB7IGtleVBhdGg6IHN0b3JlQ29uZmlnLmtleSwgYXV0b0luY3JlbWVudDogdHJ1ZSB9KTtcblxuICAgIC8vIFVzZSB0cmFuc2FjdGlvbiBvbmNvbXBsZXRlIHRvIG1ha2Ugc3VyZSB0aGUgb2JqZWN0IFN0b3JlIGNyZWF0aW9uIGlzIGZpbmlzaGVkXG4gICAgc3RvcmUudHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGFkZGluaXRpYWxEYXRhKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgY3JlYXRlICcgKyBzdG9yZUNvbmZpZy5zdG9yZU5hbWUgKyAnXFwncyBvYmplY3Qgc3RvcmUgc3VjY2VlZCcpO1xuICAgICAgaWYgKHN0b3JlQ29uZmlnLmluaXRpYWxEYXRhKSB7XG4gICAgICAgIC8vIFN0b3JlIGluaXRpYWwgdmFsdWVzIGluIHRoZSBuZXdseSBjcmVhdGVkIG9iamVjdCBzdG9yZS5cbiAgICAgICAgX2luaXRpYWxEYXRhSGFuZGxlcihzdG9yZUNvbmZpZy5zdG9yZU5hbWUsIHN0b3JlQ29uZmlnLmluaXRpYWxEYXRhKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gX2luaXRpYWxEYXRhSGFuZGxlcihzdG9yZU5hbWUsIGluaXRpYWxEYXRhKSB7XG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdLCAncmVhZHdyaXRlJyk7XG4gICAgdmFyIG9iamVjdFN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKTtcblxuICAgIF9wYXJzZUpTT05EYXRhKGluaXRpYWxEYXRhLCAnaW5pdGlhbCcpLmZvckVhY2goZnVuY3Rpb24gYWRkRXZlcnlJbml0aWFsRGF0YShkYXRhLCBpbmRleCkge1xuICAgICAgdmFyIGFkZFJlcXVlc3QgPSBvYmplY3RTdG9yZS5hZGQoZGF0YSk7XG5cbiAgICAgIGFkZFJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gYWRkSW5pdGlhbFN1Y2Nlc3MoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGFkZCBpbml0aWFsIGRhdGFbJyArIGluZGV4ICsgJ10gc3VjY2Vzc2VkJyk7XG4gICAgICB9O1xuICAgIH0pO1xuICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSBmdW5jdGlvbiBhZGRBbGxEYXRhRG9uZSgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGFkZCBhbGwnICsgc3RvcmVOYW1lICArICdcXCdzIGluaXRpYWwgZGF0YSBkb25lIDopJyk7XG4gICAgICBfZ2V0UHJlc2VudEtleShzdG9yZU5hbWUpO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfcGFyc2VKU09ORGF0YShyYXdkYXRhLCBtZXNzYWdlKSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBwYXJzZWREYXRhID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShyYXdkYXRhKSk7XG5cbiAgICAgIHJldHVybiBwYXJzZWREYXRhO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB3aW5kb3cuYWxlcnQoJ3BsZWFzZSBzZXQgY29ycmVjdCcgKyBtZXNzYWdlICArICdhcnJheSBvYmplY3QgOiknKTtcbiAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldExlbmd0aChzdG9yZU5hbWUpIHtcbiAgICByZXR1cm4gX3ByZXNlbnRLZXlbc3RvcmVOYW1lXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldE5ld0tleShzdG9yZU5hbWUpIHtcbiAgICBfcHJlc2VudEtleVtzdG9yZU5hbWVdICs9IDE7XG5cbiAgICByZXR1cm4gX3ByZXNlbnRLZXlbc3RvcmVOYW1lXTtcbiAgfVxuXG4gIC8qIENSVUQgKi9cblxuICBmdW5jdGlvbiBhZGRJdGVtKHN0b3JlTmFtZSwgbmV3RGF0YSwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdLCAncmVhZHdyaXRlJyk7XG4gICAgdmFyIGFkZFJlcXVlc3QgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpLmFkZChuZXdEYXRhKTtcblxuICAgIGFkZFJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gYWRkU3VjY2VzcygpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGFkZCAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgJyArIGFkZFJlcXVlc3Quc291cmNlLmtleVBhdGggKyAnID0gJyArIG5ld0RhdGFbYWRkUmVxdWVzdC5zb3VyY2Uua2V5UGF0aF0gKyAnIGRhdGEgc3VjY2VlZCA6KScpO1xuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2sobmV3RGF0YSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEl0ZW0oc3RvcmVOYW1lLCBrZXksIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSk7XG4gICAgdmFyIGdldFJlcXVlc3QgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpLmdldChwYXJzZUludChrZXksIDEwKSk7ICAvLyBnZXQgaXQgYnkgaW5kZXhcblxuICAgIGdldFJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0U3VjY2VzcygpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGdldCAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgJyArIGdldFJlcXVlc3Quc291cmNlLmtleVBhdGggKyAnID0gJyArIGtleSArICcgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhnZXRSZXF1ZXN0LnJlc3VsdCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8vIGdldCBjb25kaXRpb25hbCBkYXRhIChib29sZWFuIGNvbmRpdGlvbilcbiAgZnVuY3Rpb24gZ2V0V2hldGhlckNvbmRpdGlvbkl0ZW0oc3RvcmVOYW1lLCBjb25kaXRpb24sIHdoZXRoZXIsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSk7XG4gICAgdmFyIHJlc3VsdCA9IFtdOyAvLyB1c2UgYW4gYXJyYXkgdG8gc3RvcmFnZSBlbGlnaWJsZSBkYXRhXG5cbiAgICBfZ2V0QWxsUmVxdWVzdCh0cmFuc2FjdGlvbiwgc3RvcmVOYW1lKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRBbGxTdWNjZXNzKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgaWYgKHdoZXRoZXIpIHtcbiAgICAgICAgICBpZiAoY3Vyc29yLnZhbHVlW2NvbmRpdGlvbl0pIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGN1cnNvci52YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCF3aGV0aGVyKSB7XG4gICAgICAgICAgaWYgKCFjdXJzb3IudmFsdWVbY29uZGl0aW9uXSkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goY3Vyc29yLnZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gY29tcGxldGVBZGRBbGwoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBnZXQgJyArIHN0b3JlTmFtZSArICdcXCdzICcgKyBjb25kaXRpb24gKyAnIDogJyArIHdoZXRoZXIgICsgJyBkYXRhIHN1Y2Nlc3MgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3VsdCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEFsbChzdG9yZU5hbWUsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSk7XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgX2dldEFsbFJlcXVlc3QodHJhbnNhY3Rpb24sIHN0b3JlTmFtZSkub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0QWxsU3VjY2VzcyhlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGN1cnNvci52YWx1ZSk7XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfVxuICAgIH07XG4gICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGNvbXBsZXRlR2V0QWxsKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgZ2V0ICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgJ2FsbCBkYXRhIHN1Y2Nlc3MgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3VsdCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZUl0ZW0oc3RvcmVOYW1lLCBrZXksIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuICAgIHZhciBkZWxldGVSZXF1ZXN0ID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKS5kZWxldGUoa2V5KTtcblxuICAgIGRlbGV0ZVJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gZGVsZXRlU3VjY2VzcygpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIHJlbW92ZSAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgJyArIGRlbGV0ZVJlcXVlc3Quc291cmNlLmtleVBhdGggKyAnID0gJyArIGtleSArICcgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhrZXkpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmVXaGV0aGVyQ29uZGl0aW9uSXRlbShzdG9yZU5hbWUsIGNvbmRpdGlvbiwgd2hldGhlciwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdLCAncmVhZHdyaXRlJyk7XG5cbiAgICBfZ2V0QWxsUmVxdWVzdCh0cmFuc2FjdGlvbiwgc3RvcmVOYW1lKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRBbGxTdWNjZXNzKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgaWYgKHdoZXRoZXIpIHtcbiAgICAgICAgICBpZiAoY3Vyc29yLnZhbHVlW2NvbmRpdGlvbl0pIHtcbiAgICAgICAgICAgIGN1cnNvci5kZWxldGUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIXdoZXRoZXIpIHtcbiAgICAgICAgICBpZiAoIWN1cnNvci52YWx1ZVtjb25kaXRpb25dKSB7XG4gICAgICAgICAgICBjdXJzb3IuZGVsZXRlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfVxuICAgIH07XG4gICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGNvbXBsZXRlUmVtb3ZlV2hldGhlcigpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIHJlbW92ZSAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgJyArIGNvbmRpdGlvbiArICcgOiAnICsgd2hldGhlciAgKyAnIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2soKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIoc3RvcmVOYW1lLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcblxuICAgIF9nZXRBbGxSZXF1ZXN0KHRyYW5zYWN0aW9uLCBzdG9yZU5hbWUpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGdldEFsbFN1Y2Nlc3MoZSkge1xuICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICBjdXJzb3IuZGVsZXRlKCk7XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfVxuICAgIH07XG4gICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGNvbXBsZXRlQ2xlYXIoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBjbGVhciAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgJyArICdhbGwgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjaygnY2xlYXIgYWxsIGRhdGEgc3VjY2VzcycpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyB1cGRhdGUgb25lXG4gIGZ1bmN0aW9uIHVwZGF0ZUl0ZW0oc3RvcmVOYW1lLCBuZXdEYXRhLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcbiAgICB2YXIgcHV0UmVxdWVzdCA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHN0b3JlTmFtZSkucHV0KG5ld0RhdGEpO1xuXG4gICAgcHV0UmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBwdXRTdWNjZXNzKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgdXBkYXRlICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgcHV0UmVxdWVzdC5zb3VyY2Uua2V5UGF0aCArICcgPSAnICsgbmV3RGF0YVtwdXRSZXF1ZXN0LnNvdXJjZS5rZXlQYXRoXSArICcgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhuZXdEYXRhKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gX2dldEFsbFJlcXVlc3QodHJhbnNhY3Rpb24sIHN0b3JlTmFtZSkge1xuICAgIHJldHVybiB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpLm9wZW5DdXJzb3IoSURCS2V5UmFuZ2UubG93ZXJCb3VuZCgxKSwgJ25leHQnKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb3Blbjogb3BlbixcbiAgICBnZXRMZW5ndGg6IGdldExlbmd0aCxcbiAgICBnZXROZXdLZXk6IGdldE5ld0tleSxcbiAgICBnZXRJdGVtOiBnZXRJdGVtLFxuICAgIGdldFdoZXRoZXJDb25kaXRpb25JdGVtOiBnZXRXaGV0aGVyQ29uZGl0aW9uSXRlbSxcbiAgICBnZXRBbGw6IGdldEFsbCxcbiAgICBhZGRJdGVtOiBhZGRJdGVtLFxuICAgIHJlbW92ZUl0ZW06IHJlbW92ZUl0ZW0sXG4gICAgcmVtb3ZlV2hldGhlckNvbmRpdGlvbkl0ZW06IHJlbW92ZVdoZXRoZXJDb25kaXRpb25JdGVtLFxuICAgIGNsZWFyOiBjbGVhcixcbiAgICB1cGRhdGVJdGVtOiB1cGRhdGVJdGVtXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEluZGV4ZWREQkhhbmRsZXI7XG4iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbmFtZTogJ0p1c3RUb0RvJyxcbiAgdmVyc2lvbjogJzIzJyxcbiAgc3RvcmVDb25maWc6IFtcbiAgICB7XG4gICAgICBzdG9yZU5hbWU6ICdsaXN0JyxcbiAgICAgIGtleTogJ2lkJyxcbiAgICAgIGluaXRpYWxEYXRhOiBbXG4gICAgICAgIHsgaWQ6IDAsIGV2ZW50OiAnSnVzdERlbW8nLCBmaW5pc2hlZDogdHJ1ZSwgZGF0ZTogMCB9XG4gICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICBzdG9yZU5hbWU6ICdhcGhvcmlzbScsXG4gICAgICBrZXk6ICdpZCcsXG4gICAgICBpbml0aWFsRGF0YTogW1xuICAgICAgICB7XG4gICAgICAgICAgJ2lkJzogMSxcbiAgICAgICAgICAnY29udGVudCc6IFwiWW91J3JlIGJldHRlciB0aGFuIHRoYXRcIlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgJ2lkJzogMixcbiAgICAgICAgICAnY29udGVudCc6ICdZZXN0ZXJkYXkgWW91IFNhaWQgVG9tb3Jyb3cnXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAnaWQnOiAzLFxuICAgICAgICAgICdjb250ZW50JzogJ1doeSBhcmUgd2UgaGVyZT8nXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAnaWQnOiA0LFxuICAgICAgICAgICdjb250ZW50JzogJ0FsbCBpbiwgb3Igbm90aGluZydcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICdpZCc6IDUsXG4gICAgICAgICAgJ2NvbnRlbnQnOiAnWW91IE5ldmVyIFRyeSwgWW91IE5ldmVyIEtub3cnXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAnaWQnOiA2LFxuICAgICAgICAgICdjb250ZW50JzogJ1RoZSB1bmV4YW1pbmVkIGxpZmUgaXMgbm90IHdvcnRoIGxpdmluZy4gLS0gU29jcmF0ZXMnXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAnaWQnOiA3LFxuICAgICAgICAgICdjb250ZW50JzogJ1RoZXJlIGlzIG9ubHkgb25lIHRoaW5nIHdlIHNheSB0byBsYXp5OiBOT1QgVE9EQVknXG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9XG4gIF1cbn07XG4iLCIndXNlIHN0cmljdCc7XG4oZnVuY3Rpb24gaW5pdCgpIHtcbiAgdmFyIERCID0gcmVxdWlyZSgnaW5kZXhlZGRiLWNydWQnKTtcbiAgdmFyIERCQ29uZmlnID0gcmVxdWlyZSgnLi9kYi9jb25maWcuanMnKTtcbiAgdmFyIGFkZEV2ZW50cyA9IHJlcXVpcmUoJy4vdXRsaXMvYWRkRXZlbnRzLmpzJyk7XG5cbiAgLy8gb3BlbiBEQiwgYW5kIHdoZW4gREIgb3BlbiBzdWNjZWVkLCBpbnZva2UgaW5pdGlhbCBmdW5jdGlvblxuICBEQi5vcGVuKERCQ29uZmlnLCBhZGRFdmVudHMuZGJTdWNjZXNzLCBhZGRFdmVudHMuZGJGYWlsKTtcbn0oKSk7XG4iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiBhZGRFdmVudHNHZW5lcmF0b3IoKSB7XG4gIGZ1bmN0aW9uIF93aGV0aGVyU3VjY2Vzcyh3aGV0aGVyU3VjY2Vzcykge1xuICAgIGZ1bmN0aW9uIF93aGV0aGVyU3VjY2Vzc0hhbmRsZXIod2hldGhlcikge1xuICAgICAgdmFyIGxpc3Q7XG4gICAgICB2YXIgZXZlbnRIYW5kbGVyID0gcmVxdWlyZSgnLi9ldmVudEhhbmRsZXIvZXZlbnRIYW5kbGVyLmpzJyk7XG4gICAgICB2YXIgaGFuZGxlciA9IHdoZXRoZXIgPyBldmVudEhhbmRsZXIuZGJTdWNjZXNzIDogZXZlbnRIYW5kbGVyLmRiRmFpbDtcblxuICAgICAgaWYgKGhhbmRsZXIgPT09IGV2ZW50SGFuZGxlci5kYkZhaWwpIHtcbiAgICAgICAgd2luZG93LmFsZXJ0KCdZb3VyIGJyb3dzZXIgZG9lc25cXCd0IHN1cHBvcnQgYSBzdGFibGUgdmVyc2lvbiBvZiBJbmRleGVkREIuIFdlIHdpbGwgb2ZmZXIgeW91IHRoZSB3aXRob3V0IGluZGV4ZWREQiBtb2RlJyk7XG4gICAgICB9XG4gICAgICBoYW5kbGVyLnNob3dJbml0KCk7XG4gICAgICAvLyBhZGQgYWxsIGV2ZW50TGlzdGVuZXJcbiAgICAgIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgICAgbGlzdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuY2xpY2tMaSwgZmFsc2UpO1xuICAgICAgbGlzdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIucmVtb3ZlTGksIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVyLmVudGVyQWRkLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWRkJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLmFkZCwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dEb25lJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dEb25lLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd1RvZG8nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd1RvZG8sIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93QWxsJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dBbGwsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93Q2xlYXInKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0NsZWFyLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGFkZEV2ZW50cygpIHtcbiAgICAgIF93aGV0aGVyU3VjY2Vzc0hhbmRsZXIod2hldGhlclN1Y2Nlc3MpO1xuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGRiU3VjY2VzczogX3doZXRoZXJTdWNjZXNzKHRydWUpLFxuICAgIGRiRmFpbDogX3doZXRoZXJTdWNjZXNzKGZhbHNlKVxuICB9O1xufSgpKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY2xlYXJDaGlsZE5vZGVzKHJvb3QpIHtcbiAgd2hpbGUgKHJvb3QuaGFzQ2hpbGROb2RlcygpKSB7IC8vIG9yIHJvb3QuZmlyc3RDaGlsZCBvciByb290Lmxhc3RDaGlsZFxuICAgIHJvb3QucmVtb3ZlQ2hpbGQocm9vdC5maXJzdENoaWxkKTtcbiAgfVxuICAvLyBvciByb290LmlubmVySFRNTCA9ICcnXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGRiRmFpbCA9IChmdW5jdGlvbiBkYkZhaWxHZW5lcmF0b3IoKSB7XG4gIHZhciByZWZyZXNoID0gcmVxdWlyZSgnLi4vcmVmcmVzaC9yZWZyZXNoLmpzJykuZGJGYWlsO1xuICB2YXIgbGlHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9saUdlbmVyYXRvci5qcycpO1xuICB2YXIgZ2VuZXJhbCA9IHJlcXVpcmUoJy4vZ2VuZXJhbC5qcycpO1xuICB2YXIgX2lkID0gMDsgLy8gc28gdGhlIGZpcnN0IGl0ZW0ncyBpZCBpcyAxXG5cbiAgZnVuY3Rpb24gYWRkKCkge1xuICAgIHZhciBpbnB1dFZhbHVlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWU7XG4gICAgdmFyIGxpc3Q7XG4gICAgdmFyIG5ld0RhdGE7XG4gICAgdmFyIG5ld0xpO1xuXG4gICAgaWYgKGlucHV0VmFsdWUgPT09ICcnKSB7XG4gICAgICB3aW5kb3cuYWxlcnQoJ3BsZWFzZSBpbnB1dCBhIHJlYWwgZGF0YX4nKTtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBfcmVtb3ZlUmFuZG9tKCk7XG4gICAgX2lkICs9IDE7XG4gICAgbmV3RGF0YSA9IGdlbmVyYWwuZGF0YUdlbmVyYXRvcihfaWQsIGlucHV0VmFsdWUpO1xuICAgIG5ld0xpID0gbGlHZW5lcmF0b3IobmV3RGF0YSk7XG4gICAgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgbGlzdC5pbnNlcnRCZWZvcmUobmV3TGksIGxpc3QuZmlyc3RDaGlsZCk7IC8vIHB1c2ggbmV3TGkgdG8gZmlyc3RcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5wdXQnKS52YWx1ZSA9ICcnOyAgLy8gcmVzZXQgaW5wdXQncyB2YWx1ZXNcblxuICAgIHJldHVybiAwO1xuICB9XG5cbiAgZnVuY3Rpb24gX3JlbW92ZVJhbmRvbSgpIHtcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGxpc3RJdGVtcyk7XG4gICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgIHZhciBsaXN0SXRlbXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjbGlzdCBsaScpO1xuXG4gICAgcmV0dXJuIGtleXMuZm9yRWFjaChmdW5jdGlvbiB0ZXN0RXZlcnlJdGVtKGluZGV4KSB7XG4gICAgICBpZiAobGlzdEl0ZW1zW2tleXNbaW5kZXhdXS5jbGFzc0xpc3QuY29udGFpbnMoJ2FwaG9yaXNtJykpIHtcbiAgICAgICAgbGlzdC5yZW1vdmVDaGlsZChsaXN0SXRlbXNba2V5c1tpbmRleF1dKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVudGVyQWRkKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgYWRkKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY2xpY2tMaShlKSB7XG4gICAgdmFyIHRhcmdldExpID0gZS50YXJnZXQ7XG4gICAgLy8gdXNlIGV2ZW50IGRlbGVnYXRpb25cblxuICAgIGlmICh0YXJnZXRMaS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSkge1xuICAgICAgX3RvZ2dsZUxpKHRhcmdldExpKTtcbiAgICAgIHNob3dBbGwoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfdG9nZ2xlTGkodGFyZ2V0TGkpIHtcbiAgICB0YXJnZXRMaS5jbGFzc0xpc3QudG9nZ2xlKCdmaW5pc2hlZCcpO1xuICB9XG5cbiAgLy8gbGkncyBbeF0ncyBkZWxldGVcbiAgZnVuY3Rpb24gcmVtb3ZlTGkoZSkge1xuICAgIHZhciBpZDtcbiAgICB2YXIgRE9NSW5kZXg7XG4gICAgdmFyIGxpc3Q7XG4gICAgdmFyIGxpc3RJdGVtcztcblxuICAgIGlmIChlLnRhcmdldC5jbGFzc05hbWUgPT09ICdjbG9zZScpIHsgLy8gdXNlIGV2ZW50IGRlbGVnYXRpb25cbiAgICAgIC8vIHVzZSBwcmV2aW91c2x5IHN0b3JlZCBkYXRhXG4gICAgICBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgICAgIGxpc3RJdGVtcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNsaXN0IGxpJyk7XG4gICAgICBpZCA9IGUudGFyZ2V0LnBhcmVudE5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyk7XG4gICAgICBET01JbmRleCA9IF9nZXRET01JbmRleChpZCk7XG4gICAgICBsaXN0LnJlbW92ZUNoaWxkKGxpc3RJdGVtc1tET01JbmRleF0pO1xuICAgICAgZ2VuZXJhbC5pZkVtcHR5LmFkZFJhbmRvbSgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9nZXRET01JbmRleChpZCkge1xuICAgIHZhciBpO1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMobGlzdEl0ZW1zKTtcbiAgICB2YXIgbGlzdEl0ZW1zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2xpc3QgbGknKTtcblxuICAgIGZvciAoaSBpbiBrZXlzKSB7XG4gICAgICBpZiAobGlzdEl0ZW1zW2tleXNbaV1dLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpID09PSBpZCkge1xuICAgICAgICByZXR1cm4ga2V5c1tpXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gJ1dyb25nIGlkLCBub3QgZm91bmQgaW4gRE9NIHRyZWUnO1xuICB9XG5cbiAgZ2VuZXJhbC5pZkVtcHR5LmFkZFJhbmRvbSA9IGZ1bmN0aW9uIGFkZFJhbmRvbSgpIHtcbiAgICB2YXIgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG5cbiAgICBpZiAoIWxpc3QuZmlyc3RDaGlsZCB8fCBfaXNBbGxOb25lKCkpIHtcbiAgICAgIHJlZnJlc2gucmFuZG9tKCk7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIF9pc0FsbE5vbmUoKSB7XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhsaXN0SXRlbXMpO1xuICAgIHZhciBsaXN0SXRlbXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjbGlzdCBsaScpO1xuXG4gICAgcmV0dXJuIGtleXMuZXZlcnkoZnVuY3Rpb24gdGVzdEV2ZXJ5SXRlbShpbmRleCkge1xuICAgICAgcmV0dXJuIGxpc3RJdGVtc1trZXlzW2luZGV4XV0uc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0luaXQoKSB7XG4gICAgcmVmcmVzaC5jbGVhcigpO1xuICAgIHJlZnJlc2guaW5pdCgpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0FsbCgpIHtcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNsaXN0IGxpJykpO1xuXG4gICAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uIGFwcGVhckFsbChpbmRleCkge1xuICAgICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgICAgdmFyIGxpc3RJdGVtcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNsaXN0IGxpJyk7XG4gICAgICB2YXIgZWxlbWVudCA9IGxpc3RJdGVtc1trZXlzW2luZGV4XV07XG5cbiAgICAgIF93aGV0aGVyQXBwZWFyKGVsZW1lbnQsIHRydWUpO1xuICAgICAgaWYgKGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdmaW5pc2hlZCcpKSB7XG4gICAgICAgIGxpc3QucmVtb3ZlQ2hpbGQobGlzdC5jaGlsZE5vZGVzW2tleXNbaW5kZXhdXSk7XG4gICAgICAgIGxpc3QuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93Q2xlYXIoKSB7XG4gICAgcmVmcmVzaC5jbGVhcigpOyAvLyBjbGVhciBub2RlcyB2aXN1YWxseVxuICAgIHJlZnJlc2gucmFuZG9tKCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93RG9uZSgpIHtcbiAgICBfc2hvd1doZXRoZXJEb25lKHRydWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd1RvZG8oKSB7XG4gICAgX3Nob3dXaGV0aGVyRG9uZShmYWxzZSk7XG4gIH1cblxuICBmdW5jdGlvbiBfc2hvd1doZXRoZXJEb25lKHdoZXRoZXJEb25lKSB7XG4gICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjbGlzdCBsaScpLCBmdW5jdGlvbiB3aGV0aGVyRG9uZUFwcGVhcihlbGVtZW50KSB7XG4gICAgICBpZiAod2hldGhlckRvbmUpIHtcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoJ2ZpbmlzaGVkJykgPyBfd2hldGhlckFwcGVhcihlbGVtZW50LCB0cnVlKSA6IF93aGV0aGVyQXBwZWFyKGVsZW1lbnQsIGZhbHNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdmaW5pc2hlZCcpID8gX3doZXRoZXJBcHBlYXIoZWxlbWVudCwgZmFsc2UpIDogX3doZXRoZXJBcHBlYXIoZWxlbWVudCwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgX3JlbW92ZVJhbmRvbSgpO1xuICAgIGdlbmVyYWwuaWZFbXB0eS5hZGRSYW5kb20oKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF93aGV0aGVyQXBwZWFyKGVsZW1lbnQsIHdoZXRoZXIpIHtcbiAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSB3aGV0aGVyID8gJ2Jsb2NrJyA6ICdub25lJztcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYWRkOiBhZGQsXG4gICAgZW50ZXJBZGQ6IGVudGVyQWRkLFxuICAgIGNsaWNrTGk6IGNsaWNrTGksXG4gICAgcmVtb3ZlTGk6IHJlbW92ZUxpLFxuICAgIHNob3dJbml0OiBzaG93SW5pdCxcbiAgICBzaG93QWxsOiBzaG93QWxsLFxuICAgIHNob3dDbGVhcjogc2hvd0NsZWFyLFxuICAgIHNob3dEb25lOiBzaG93RG9uZSxcbiAgICBzaG93VG9kbzogc2hvd1RvZG9cbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZGJGYWlsO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGRiU3VjY2VzcyA9IChmdW5jdGlvbiBkYlN1Y2Nlc3NHZW5lcmF0b3IoKSB7XG4gIHZhciBzdG9yZU5hbWUgPSAnbGlzdCc7XG4gIHZhciBEQiA9IHJlcXVpcmUoJ2luZGV4ZWRkYi1jcnVkJyk7XG4gIHZhciByZWZyZXNoID0gcmVxdWlyZSgnLi4vcmVmcmVzaC9yZWZyZXNoLmpzJykuZGJTdWNjZXNzO1xuICB2YXIgbGlHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9saUdlbmVyYXRvci5qcycpO1xuICB2YXIgZ2VuZXJhbCA9IHJlcXVpcmUoJy4vZ2VuZXJhbC5qcycpO1xuXG4gIGZ1bmN0aW9uIGFkZCgpIHtcbiAgICB2YXIgbGlzdDtcbiAgICB2YXIgbmV3RGF0YTtcbiAgICB2YXIgaW5wdXRWYWx1ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNpbnB1dCcpLnZhbHVlO1xuXG4gICAgaWYgKGlucHV0VmFsdWUgPT09ICcnKSB7XG4gICAgICB3aW5kb3cuYWxlcnQoJ3BsZWFzZSBpbnB1dCBhIHJlYWwgZGF0YX4nKTtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBnZW5lcmFsLmlmRW1wdHkucmVtb3ZlSW5pdCgpO1xuICAgIG5ld0RhdGEgPSBnZW5lcmFsLmRhdGFHZW5lcmF0b3IoREIuZ2V0TmV3S2V5KHN0b3JlTmFtZSksIGlucHV0VmFsdWUpO1xuICAgIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgIGxpc3QuaW5zZXJ0QmVmb3JlKGxpR2VuZXJhdG9yKG5ld0RhdGEpLCBsaXN0LmZpcnN0Q2hpbGQpOyAvLyBwdXNoIG5ld0xpIHRvIGZpcnN0XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWUgPSAnJzsgIC8vIHJlc2V0IGlucHV0J3MgdmFsdWVzXG4gICAgREIuYWRkSXRlbShzdG9yZU5hbWUsIG5ld0RhdGEpO1xuXG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICBmdW5jdGlvbiBlbnRlckFkZChlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgIGFkZCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsaWNrTGkoZSkge1xuICAgIHZhciBpZDtcbiAgICB2YXIgdGFyZ2V0TGkgPSBlLnRhcmdldDtcbiAgICAvLyB1c2UgZXZlbnQgZGVsZWdhdGlvblxuXG4gICAgaWYgKCF0YXJnZXRMaS5jbGFzc0xpc3QuY29udGFpbnMoJ2FwaG9yaXNtJykpIHtcbiAgICAgIGlmICh0YXJnZXRMaS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSkge1xuICAgICAgICB0YXJnZXRMaS5jbGFzc0xpc3QudG9nZ2xlKCdmaW5pc2hlZCcpOyAvLyB0b2dnbGUgYXBwZWFyYW5jZVxuICAgICAgICBpZCA9IHBhcnNlSW50KHRhcmdldExpLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpLCAxMCk7IC8vIHVzZSBwcmV2aW91c2x5IHN0b3JlZCBkYXRhLWlkIGF0dHJpYnV0ZVxuICAgICAgICBEQi5nZXRJdGVtKHN0b3JlTmFtZSwgaWQsIF90b2dnbGVMaSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gbGkncyBbeF0ncyBkZWxldGVcbiAgZnVuY3Rpb24gcmVtb3ZlTGkoZSkge1xuICAgIHZhciBpZDtcblxuICAgIGlmIChlLnRhcmdldC5jbGFzc05hbWUgPT09ICdjbG9zZScpIHsgLy8gdXNlIGV2ZW50IGRlbGVnYXRpb25cbiAgICAgIC8vIHVzZSBwcmV2aW91c2x5IHN0b3JlZCBkYXRhXG4gICAgICBpZCA9IHBhcnNlSW50KGUudGFyZ2V0LnBhcmVudE5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyksIDEwKTtcbiAgICAgIERCLnJlbW92ZUl0ZW0oc3RvcmVOYW1lLCBpZCwgc2hvd0FsbCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0luaXQoKSB7XG4gICAgcmVmcmVzaC5jbGVhcigpO1xuICAgIERCLmdldEFsbChzdG9yZU5hbWUsIHJlZnJlc2guaW5pdCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93QWxsKCkge1xuICAgIHJlZnJlc2guY2xlYXIoKTtcbiAgICBEQi5nZXRBbGwoc3RvcmVOYW1lLCByZWZyZXNoLmFsbCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93Q2xlYXIoKSB7XG4gICAgcmVmcmVzaC5jbGVhcigpOyAvLyBjbGVhciBub2RlcyB2aXN1YWxseVxuICAgIHJlZnJlc2gucmFuZG9tKCk7XG4gICAgREIuY2xlYXIoc3RvcmVOYW1lKTsgLy8gY2xlYXIgZGF0YSBpbmRlZWRcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dEb25lKCkge1xuICAgIF9zaG93V2hldGhlckRvbmUodHJ1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93VG9kbygpIHtcbiAgICBfc2hvd1doZXRoZXJEb25lKGZhbHNlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zaG93V2hldGhlckRvbmUod2hldGhlckRvbmUpIHtcbiAgICB2YXIgY29uZGl0aW9uID0gJ2ZpbmlzaGVkJztcblxuICAgIHJlZnJlc2guY2xlYXIoKTtcbiAgICBEQi5nZXRXaGV0aGVyQ29uZGl0aW9uSXRlbShzdG9yZU5hbWUsIGNvbmRpdGlvbiwgd2hldGhlckRvbmUsIHJlZnJlc2gucGFydCk7XG4gIH1cblxuICBmdW5jdGlvbiBfdG9nZ2xlTGkoZGF0YSkge1xuICAgIGRhdGEuZmluaXNoZWQgPSAhZGF0YS5maW5pc2hlZDtcbiAgICBEQi51cGRhdGVJdGVtKHN0b3JlTmFtZSwgZGF0YSwgc2hvd0FsbCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGFkZDogYWRkLFxuICAgIGVudGVyQWRkOiBlbnRlckFkZCxcbiAgICBjbGlja0xpOiBjbGlja0xpLFxuICAgIHJlbW92ZUxpOiByZW1vdmVMaSxcbiAgICBzaG93SW5pdDogc2hvd0luaXQsXG4gICAgc2hvd0FsbDogc2hvd0FsbCxcbiAgICBzaG93Q2xlYXI6IHNob3dDbGVhcixcbiAgICBzaG93RG9uZTogc2hvd0RvbmUsXG4gICAgc2hvd1RvZG86IHNob3dUb2RvXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRiU3VjY2VzcztcbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uIGV2ZW50SGFuZGxlckdlbmVyYXRvcigpIHtcbiAgdmFyIGRiU3VjY2VzcyA9IHJlcXVpcmUoJy4vZGJTdWNjZXNzLmpzJyk7XG4gIHZhciBkYkZhaWwgPSByZXF1aXJlKCcuL2RiRmFpbC5qcycpO1xuXG4gIHJldHVybiB7XG4gICAgZGJTdWNjZXNzOiBkYlN1Y2Nlc3MsXG4gICAgZGJGYWlsOiBkYkZhaWxcbiAgfTtcbn0oKSk7XG4iLCJ2YXIgZ2VuZXJhbCA9IChmdW5jdGlvbiBnZW5lcmFsR2VuZXJhdG9yKCkge1xuICB2YXIgaWZFbXB0eSA9IHtcbiAgICByZW1vdmVJbml0OiBmdW5jdGlvbiByZW1vdmVJbml0KCkge1xuICAgICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gICAgICBpZiAobGlzdC5maXJzdENoaWxkLmNsYXNzTmFtZSA9PT0gJ2FwaG9yaXNtJykge1xuICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGxpc3QuZmlyc3RDaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIGRhdGFHZW5lcmF0b3Ioa2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiB7XG4gICAgICBpZDoga2V5LFxuICAgICAgZXZlbnQ6IHZhbHVlLFxuICAgICAgZmluaXNoZWQ6IGZhbHNlLFxuICAgICAgZGF0ZTogX2dldE5ld0RhdGUoJ3l5eXnlubRNTeaciGRk5pelIGhoOm1tJylcbiAgICB9O1xuICB9XG5cbiAgLy8gRm9ybWF0IGRhdGVcbiAgZnVuY3Rpb24gX2dldE5ld0RhdGUoZm10KSB7XG4gICAgdmFyIG5ld0RhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIHZhciBuZXdmbXQgPSBmbXQ7XG4gICAgdmFyIG8gPSB7XG4gICAgICAneSsnOiBuZXdEYXRlLmdldEZ1bGxZZWFyKCksXG4gICAgICAnTSsnOiBuZXdEYXRlLmdldE1vbnRoKCkgKyAxLFxuICAgICAgJ2QrJzogbmV3RGF0ZS5nZXREYXRlKCksXG4gICAgICAnaCsnOiBuZXdEYXRlLmdldEhvdXJzKCksXG4gICAgICAnbSsnOiBuZXdEYXRlLmdldE1pbnV0ZXMoKVxuICAgIH07XG4gICAgdmFyIGxlbnM7XG5cbiAgICBmb3IgKHZhciBrIGluIG8pIHtcbiAgICAgIGlmIChuZXcgUmVnRXhwKCcoJyArIGsgKyAnKScpLnRlc3QobmV3Zm10KSkge1xuICAgICAgICBpZiAoayA9PT0gJ3krJykge1xuICAgICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKCcnICsgb1trXSkuc3Vic3RyKDQgLSBSZWdFeHAuJDEubGVuZ3RoKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoayA9PT0gJ1MrJykge1xuICAgICAgICAgIGxlbnMgPSBSZWdFeHAuJDEubGVuZ3RoO1xuICAgICAgICAgIGxlbnMgPSBsZW5zID09PSAxID8gMyA6IGxlbnM7XG4gICAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoJzAwJyArIG9ba10pLnN1YnN0cigoJycgKyBvW2tdKS5sZW5ndGggLSAxLCBsZW5zKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoUmVnRXhwLiQxLmxlbmd0aCA9PT0gMSkgPyAob1trXSkgOiAoKCcwMCcgKyBvW2tdKS5zdWJzdHIoKCcnICsgb1trXSkubGVuZ3RoKSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld2ZtdDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaWZFbXB0eTogaWZFbXB0eSxcbiAgICBkYXRhR2VuZXJhdG9yOiBkYXRhR2VuZXJhdG9yXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdlbmVyYWw7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgbGlHZW5lcmF0b3IgPSAoZnVuY3Rpb24gbGlHZW5lcmF0b3IoKSB7XG4gIGZ1bmN0aW9uIF9kZWNvcmF0ZUxpKGxpLCBkYXRhKSB7XG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnICcgKyBkYXRhLmV2ZW50KTtcbiAgICB2YXIgdGV4dERhdGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhLmRhdGUgKyAnOiAnKTtcbiAgICB2YXIgdGV4dFdyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG5cbiAgICAvLyB3cmFwIGFzIGEgbm9kZVxuICAgIHRleHRXcmFwLmFwcGVuZENoaWxkKHRleHQpO1xuICAgIGxpLmFwcGVuZENoaWxkKHRleHREYXRlKTtcbiAgICBsaS5hcHBlbmRDaGlsZCh0ZXh0V3JhcCk7XG4gICAgaWYgKGRhdGEuZmluaXNoZWQpIHsgIC8vIGFkZCBjc3Mtc3R5bGUgdG8gaXQgKGFjY29yZGluZyB0byBpdCdzIGRhdGEuZmluaXNoZWQgdmFsdWUpXG4gICAgICBsaS5jbGFzc0xpc3QuYWRkKCdmaW5pc2hlZCcpOyAvLyBhZGQgc3R5bGVcbiAgICB9XG4gICAgX2FkZFgobGkpOyAvLyBhZGQgc3BhbiBbeF0gdG8gbGkncyB0YWlsXG4gICAgX3NldERhdGFQcm9wZXJ0eShsaSwgJ2RhdGEtaWQnLCBkYXRhLmlkKTsgLy8gYWRkIHByb3BlcnR5IHRvIGxpIChkYXRhLWlkKe+8jGZvciAgY2xpY2tMaVxuICB9XG5cbiAgZnVuY3Rpb24gX2FkZFgobGkpIHtcbiAgICB2YXIgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICB2YXIgeCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCdcXHUwMEQ3Jyk7IC8vIHVuaWNvZGUgLT4geFxuXG4gICAgc3Bhbi5hcHBlbmRDaGlsZCh4KTtcbiAgICBzcGFuLmNsYXNzTmFtZSA9ICdjbG9zZSc7IC8vIGFkZCBzdHlsZVxuICAgIGxpLmFwcGVuZENoaWxkKHNwYW4pO1xuICB9XG5cbiAgZnVuY3Rpb24gX3NldERhdGFQcm9wZXJ0eSh0YXJnZXQsIG5hbWUsIGRhdGEpIHtcbiAgICB0YXJnZXQuc2V0QXR0cmlidXRlKG5hbWUsIGRhdGEpO1xuICB9XG5cblxuICByZXR1cm4gZnVuY3Rpb24gY3JlYXRlKGRhdGEpIHtcbiAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuXG4gICAgX2RlY29yYXRlTGkobGksIGRhdGEpOyAvLyBkZWNvcmF0ZSBsaVxuXG4gICAgcmV0dXJuIGxpO1xuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBsaUdlbmVyYXRvcjtcbiIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uIGRiRmFpbEdlbmVyYXRvcigpIHtcbiAgdmFyIGdlbmVyYWwgPSByZXF1aXJlKCcuL2dlbmVyYWwuanMnKTtcblxuICBmdW5jdGlvbiByYW5kb21BcGhvcmlzbSgpIHtcbiAgICB2YXIgYXBob3Jpc21zID0gW1xuICAgICAgJ1llc3RlcmRheSBZb3UgU2FpZCBUb21vcnJvdycsXG4gICAgICAnV2h5IGFyZSB3ZSBoZXJlPycsXG4gICAgICAnQWxsIGluLCBvciBub3RoaW5nJyxcbiAgICAgICdZb3UgTmV2ZXIgVHJ5LCBZb3UgTmV2ZXIgS25vdycsXG4gICAgICAnVGhlIHVuZXhhbWluZWQgbGlmZSBpcyBub3Qgd29ydGggbGl2aW5nLiAtLSBTb2NyYXRlcycsXG4gICAgICAnVGhlcmUgaXMgb25seSBvbmUgdGhpbmcgd2Ugc2F5IHRvIGxhenk6IE5PVCBUT0RBWSdcbiAgICBdO1xuICAgIHZhciByYW5kb21JbmRleCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFwaG9yaXNtcy5sZW5ndGgpO1xuICAgIHZhciB0ZXh0ID0gYXBob3Jpc21zW3JhbmRvbUluZGV4XTtcblxuICAgIGdlbmVyYWwuc2VudGVuY2VIYW5kbGVyKHRleHQpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpbml0OiBnZW5lcmFsLmluaXQsXG4gICAgYWxsOiBnZW5lcmFsLmFsbC5iaW5kKG51bGwsIHJhbmRvbUFwaG9yaXNtKSxcbiAgICBwYXJ0OiBnZW5lcmFsLnBhcnQuYmluZChudWxsLCByYW5kb21BcGhvcmlzbSksXG4gICAgY2xlYXI6IGdlbmVyYWwuY2xlYXIsXG4gICAgcmFuZG9tOiByYW5kb21BcGhvcmlzbVxuICB9O1xufSgpKTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gZGJTdWNjZXNzR2VuZXJhdG9yKCkge1xuICB2YXIgc3RvcmVOYW1lID0gJ2FwaG9yaXNtJztcbiAgdmFyIERCID0gcmVxdWlyZSgnaW5kZXhlZGRiLWNydWQnKTtcbiAgdmFyIGdlbmVyYWwgPSByZXF1aXJlKCcuL2dlbmVyYWwuanMnKTtcblxuICBmdW5jdGlvbiByYW5kb21BcGhvcmlzbSgpIHtcbiAgICB2YXIgcmFuZG9tSW5kZXggPSBNYXRoLmNlaWwoTWF0aC5yYW5kb20oKSAqIERCLmdldExlbmd0aChzdG9yZU5hbWUpKTtcblxuICAgIERCLmdldEl0ZW0oc3RvcmVOYW1lLCByYW5kb21JbmRleCwgX3BhcnNlVGV4dCk7XG4gIH1cblxuICBmdW5jdGlvbiBfcGFyc2VUZXh0KGRhdGEpIHtcbiAgICB2YXIgdGV4dCA9IGRhdGEuY29udGVudDtcblxuICAgIGdlbmVyYWwuc2VudGVuY2VIYW5kbGVyKHRleHQpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpbml0OiBnZW5lcmFsLmluaXQsXG4gICAgYWxsOiBnZW5lcmFsLmFsbC5iaW5kKG51bGwsIHJhbmRvbUFwaG9yaXNtKSwgIC8vIFBVTkNITElORTogdXNlIGJpbmQgdG8gcGFzcyBwYXJhbXRlclxuICAgIHBhcnQ6IGdlbmVyYWwucGFydC5iaW5kKG51bGwsIHJhbmRvbUFwaG9yaXNtKSxcbiAgICBjbGVhcjogZ2VuZXJhbC5jbGVhcixcbiAgICByYW5kb206IHJhbmRvbUFwaG9yaXNtXG4gIH07XG59KCkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGdlbmVyYWwgPSAoZnVuY3Rpb24gZ2VuZXJhbEdlbmVyYXRvcigpIHtcbiAgdmFyIGxpR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vbGlHZW5lcmF0b3IuanMnKTtcbiAgdmFyIGNsZWFyQ2hpbGROb2RlcyA9IHJlcXVpcmUoJy4uL2NsZWFyQ2hpbGROb2Rlcy5qcycpO1xuXG4gIGZ1bmN0aW9uIGluaXQoZGF0YUFycikge1xuICAgIF9zaG93KF9pbml0U2VudGVuY2UsIF9zaG93QWxsLCBkYXRhQXJyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zaG93KHNob3dTZW50ZW5jZUZ1bmMsIHNob3dGdW5jLCBkYXRhQXJyKSB7XG4gICAgaWYgKCFkYXRhQXJyIHx8IGRhdGFBcnIubGVuZ3RoID09PSAwKSB7XG4gICAgICBzaG93U2VudGVuY2VGdW5jKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNob3dGdW5jKGRhdGFBcnIpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9pbml0U2VudGVuY2UoKSB7XG4gICAgdmFyIHRleHQgPSAnV2VsY29tZX4sIHRyeSB0byBhZGQgeW91ciBmaXJzdCB0by1kbyBsaXN0IDogKSc7XG5cbiAgICBzZW50ZW5jZUhhbmRsZXIodGV4dCk7XG4gIH1cblxuICBmdW5jdGlvbiBfc2hvd0FsbChkYXRhQXJyKSB7XG4gICAgdmFyIHJlc3VsdCA9IF9jbGFzc2lmeURhdGEoZGF0YUFycik7XG5cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmFwcGVuZENoaWxkKHJlc3VsdCk7IC8vIGFkZCBpdCB0byBET01cbiAgfVxuXG4gIGZ1bmN0aW9uIF9jbGFzc2lmeURhdGEoZGF0YUFycikge1xuICAgIC8vIFBVTkNITElORTogdXNlIGZyYWdtZW50IHRvIHJlZHVjZSBET00gb3BlcmF0ZVxuICAgIHZhciB1bmZpc2hpZWQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIGZpbmlzaGVkID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIHZhciBtaXggPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cbiAgICAvLyBwdXQgdGhlIGZpbmlzaGVkIGl0ZW0gdG8gdGhlIGJvdHRvbVxuICAgIGRhdGFBcnIuZm9yRWFjaChmdW5jdGlvbiBjbGFzc2lmeShkYXRhKSB7XG4gICAgICBpZiAoZGF0YS5maW5pc2hlZCkge1xuICAgICAgICBmaW5pc2hlZC5pbnNlcnRCZWZvcmUobGlHZW5lcmF0b3IoZGF0YSksIGZpbmlzaGVkLmZpcnN0Q2hpbGQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdW5maXNoaWVkLmluc2VydEJlZm9yZShsaUdlbmVyYXRvcihkYXRhKSwgdW5maXNoaWVkLmZpcnN0Q2hpbGQpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIG1peC5hcHBlbmRDaGlsZCh1bmZpc2hpZWQpO1xuICAgIG1peC5hcHBlbmRDaGlsZChmaW5pc2hlZCk7XG5cbiAgICByZXR1cm4gbWl4O1xuICB9XG5cbiAgZnVuY3Rpb24gYWxsKHJhbmRvbUFwaG9yaXNtLCBkYXRhQXJyKSB7XG4gICAgX3Nob3cocmFuZG9tQXBob3Jpc20sIF9zaG93QWxsLCBkYXRhQXJyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnQocmFuZG9tQXBob3Jpc20sIGRhdGFBcnIpIHtcbiAgICBfc2hvdyhyYW5kb21BcGhvcmlzbSwgX3Nob3dwYXJ0LCBkYXRhQXJyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zaG93cGFydChkYXRhQXJyKSB7XG4gICAgdmFyIG5vZGVzID0gZGF0YUFyci5yZWR1Y2UoZnVuY3Rpb24gbm9kZUdlbmVyYXRvcihyZXN1bHQsIGRhdGEpIHtcbiAgICAgIHJlc3VsdC5pbnNlcnRCZWZvcmUobGlHZW5lcmF0b3IoZGF0YSksIHJlc3VsdC5maXJzdENoaWxkKTtcblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LCBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCkpOyAvLyBQVU5DSExJTkU6IGJyaWxsaWFudCBhcnIucmVkdWNlKCkgKyBkb2N1bWVudEZyYWdtZW50XG5cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmFwcGVuZENoaWxkKG5vZGVzKTsgLy8gYWRkIGl0IHRvIERPTVxuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgY2xlYXJDaGlsZE5vZGVzKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2VudGVuY2VIYW5kbGVyKHRleHQpIHtcbiAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgIHZhciB0ZXh0Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQpO1xuXG4gICAgbGkuYXBwZW5kQ2hpbGQodGV4dE5vZGUpO1xuICAgIGxpLmNsYXNzTmFtZSA9ICdhcGhvcmlzbSc7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5hcHBlbmRDaGlsZChsaSk7XG4gIH1cblxuXG4gIHJldHVybiB7XG4gICAgaW5pdDogaW5pdCxcbiAgICBhbGw6IGFsbCxcbiAgICBwYXJ0OiBwYXJ0LFxuICAgIGNsZWFyOiBjbGVhcixcbiAgICBzZW50ZW5jZUhhbmRsZXI6IHNlbnRlbmNlSGFuZGxlclxuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBnZW5lcmFsO1xuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gcmVmcmVzaEdlbmVyYXRvcigpIHtcbiAgdmFyIGRiU3VjY2VzcyA9IHJlcXVpcmUoJy4vZGJTdWNjZXNzLmpzJyk7XG4gIHZhciBkYkZhaWwgPSByZXF1aXJlKCcuL2RiRmFpbC5qcycpO1xuXG4gIHJldHVybiB7XG4gICAgZGJTdWNjZXNzOiBkYlN1Y2Nlc3MsXG4gICAgZGJGYWlsOiBkYkZhaWxcbiAgfTtcbn0oKSk7XG4iXX0=
