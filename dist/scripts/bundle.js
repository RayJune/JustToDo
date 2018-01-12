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
  DB.open(DBConfig, addEvents.dbFail, addEvents.dbFail);
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
  var _forEach = Array.prototype.forEach;

  function add() {
    var inputValue = document.querySelector('#input').value;
    var newData;
    var list;

    if (inputValue === '') {
      window.alert('please input a real data~');
      return 0;
    }
    _removeRandom();
    _id += 1;
    newData = general.dataGenerator(_id, inputValue);
    list = document.querySelector('#list');
    list.insertBefore(liGenerator(newData), list.firstChild); // push newLi to first
    document.querySelector('#input').value = '';  // reset input's values

    return 0;
  }

  function _removeRandom() {
    var list = document.querySelector('#list');
    var listItems = list.childNodes;

    console.dir(listItems);
    _forEach.call(listItems, function whetherHasRandom(item) {
      // console.log(index);
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

    if (!list.firstChild || _isAllNone(list)) {
      refresh.random();
    }
  };

  function _isAllNone(list) {
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
    var listItems = document.querySelector('#list').childNodes;

    _forEach.call(listItems, function whetherDoneAppear(item) {
      item.classList.contains('finished') ? _whetherAppear(item, whetherDone) : _whetherAppear(item, !whetherDone);
    });
    _removeRandom();
    general.ifEmpty.addRandom();
  }

  function _whetherAppear(element, whether) {
    element.style.display = whether ? 'block' : 'none';
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
    // showClearDone: showClearDone,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5kZXhlZGRiLWNydWQvaW5kZXhlZGRiLWNydWQuanMiLCJzcmMvc2NyaXB0cy9kYi9jb25maWcuanMiLCJzcmMvc2NyaXB0cy9tYWluLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvYWRkRXZlbnRzLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvY2xlYXJDaGlsZE5vZGVzLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZXZlbnRIYW5kbGVyL2RiRmFpbC5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2V2ZW50SGFuZGxlci9kYlN1Y2Nlc3MuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9ldmVudEhhbmRsZXIvZXZlbnRIYW5kbGVyLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZXZlbnRIYW5kbGVyL2dlbmVyYWwuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9saUdlbmVyYXRvci5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL3JlZnJlc2gvZGJGYWlsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvcmVmcmVzaC9kYlN1Y2Nlc3MuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9yZWZyZXNoL2dlbmVyYWwuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9yZWZyZXNoL3JlZnJlc2guanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcbnZhciBJbmRleGVkREJIYW5kbGVyID0gKGZ1bmN0aW9uIGluaXQoKSB7XG4gIHZhciBfZGI7XG4gIHZhciBfcHJlc2VudEtleSA9IHt9OyAvLyBzdG9yZSBtdWx0aS1vYmplY3RTdG9yZSdzIHByZXNlbnRLZXlcblxuICBmdW5jdGlvbiBvcGVuKGNvbmZpZywgb3BlblN1Y2Nlc3NDYWxsYmFjaywgb3BlbkZhaWxDYWxsYmFjaykge1xuICAvLyBpbml0IGluZGV4ZWREQlxuICAvLyBmaXJzdGx5IGluc3BlY3QgYnJvd3NlcidzIHN1cHBvcnQgZm9yIGluZGV4ZWREQlxuICAgIGlmICghd2luZG93LmluZGV4ZWREQikge1xuICAgICAgaWYgKG9wZW5GYWlsQ2FsbGJhY2spIHtcbiAgICAgICAgb3BlbkZhaWxDYWxsYmFjaygpOyAvLyBQVU5DSExJTkU6IG9mZmVyIHdpdGhvdXQtREIgaGFuZGxlclxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2luZG93LmFsZXJ0KCdcXHUyNzE0IFlvdXIgYnJvd3NlciBkb2VzblxcJ3Qgc3VwcG9ydCBhIHN0YWJsZSB2ZXJzaW9uIG9mIEluZGV4ZWREQi4gWW91IGNhbiBpbnN0YWxsIGxhdGVzdCBDaHJvbWUgb3IgRmlyZUZveCB0byBoYW5kbGVyIGl0Jyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgX29wZW5IYW5kbGVyKGNvbmZpZywgb3BlblN1Y2Nlc3NDYWxsYmFjayk7XG5cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9vcGVuSGFuZGxlcihjb25maWcsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBvcGVuUmVxdWVzdCA9IHdpbmRvdy5pbmRleGVkREIub3Blbihjb25maWcubmFtZSwgY29uZmlnLnZlcnNpb24pOyAvLyBvcGVuIGluZGV4ZWREQlxuXG4gICAgLy8gYW4gb25ibG9ja2VkIGV2ZW50IGlzIGZpcmVkIHVudGlsIHRoZXkgYXJlIGNsb3NlZCBvciByZWxvYWRlZFxuICAgIG9wZW5SZXF1ZXN0Lm9uYmxvY2tlZCA9IGZ1bmN0aW9uIGJsb2NrZWRTY2hlbWVVcCgpIHtcbiAgICAgIC8vIElmIHNvbWUgb3RoZXIgdGFiIGlzIGxvYWRlZCB3aXRoIHRoZSBkYXRhYmFzZSwgdGhlbiBpdCBuZWVkcyB0byBiZSBjbG9zZWQgYmVmb3JlIHdlIGNhbiBwcm9jZWVkLlxuICAgICAgd2luZG93LmFsZXJ0KCdQbGVhc2UgY2xvc2UgYWxsIG90aGVyIHRhYnMgd2l0aCB0aGlzIHNpdGUgb3BlbicpO1xuICAgIH07XG5cbiAgICAvLyBDcmVhdGluZyBvciB1cGRhdGluZyB0aGUgdmVyc2lvbiBvZiB0aGUgZGF0YWJhc2VcbiAgICBvcGVuUmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSBmdW5jdGlvbiBzY2hlbWFVcChlKSB7XG4gICAgICAvLyBBbGwgb3RoZXIgZGF0YWJhc2VzIGhhdmUgYmVlbiBjbG9zZWQuIFNldCBldmVyeXRoaW5nIHVwLlxuICAgICAgX2RiID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgb251cGdyYWRlbmVlZGVkIGluJyk7XG4gICAgICBfY3JlYXRlT2JqZWN0U3RvcmVIYW5kbGVyKGNvbmZpZy5zdG9yZUNvbmZpZyk7XG4gICAgfTtcblxuICAgIG9wZW5SZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIG9wZW5TdWNjZXNzKGUpIHtcbiAgICAgIF9kYiA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgIF9kYi5vbnZlcnNpb25jaGFuZ2UgPSBmdW5jdGlvbiB2ZXJzaW9uY2hhbmdlSGFuZGxlcigpIHtcbiAgICAgICAgX2RiLmNsb3NlKCk7XG4gICAgICAgIHdpbmRvdy5hbGVydCgnQSBuZXcgdmVyc2lvbiBvZiB0aGlzIHBhZ2UgaXMgcmVhZHkuIFBsZWFzZSByZWxvYWQnKTtcbiAgICAgIH07XG4gICAgICBfb3BlblN1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoY29uZmlnLnN0b3JlQ29uZmlnLCBzdWNjZXNzQ2FsbGJhY2spO1xuICAgIH07XG5cbiAgICAvLyB1c2UgZXJyb3IgZXZlbnRzIGJ1YmJsZSB0byBoYW5kbGUgYWxsIGVycm9yIGV2ZW50c1xuICAgIG9wZW5SZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbiBvcGVuRXJyb3IoZSkge1xuICAgICAgd2luZG93LmFsZXJ0KCdTb21ldGhpbmcgaXMgd3Jvbmcgd2l0aCBpbmRleGVkREIsIGZvciBtb3JlIGluZm9ybWF0aW9uLCBjaGVja291dCBjb25zb2xlJyk7XG4gICAgICBjb25zb2xlLmxvZyhlLnRhcmdldC5lcnJvcik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZS50YXJnZXQuZXJyb3IpO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfb3BlblN1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoY29uZmlnU3RvcmVDb25maWcsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBvYmplY3RTdG9yZUxpc3QgPSBfcGFyc2VKU09ORGF0YShjb25maWdTdG9yZUNvbmZpZywgJ3N0b3JlTmFtZScpO1xuXG4gICAgb2JqZWN0U3RvcmVMaXN0LmZvckVhY2goZnVuY3Rpb24gZGV0ZWN0U3RvcmVOYW1lKHN0b3JlQ29uZmlnLCBpbmRleCkge1xuICAgICAgaWYgKGluZGV4ID09PSAob2JqZWN0U3RvcmVMaXN0Lmxlbmd0aCAtIDEpKSB7XG4gICAgICAgIF9nZXRQcmVzZW50S2V5KHN0b3JlQ29uZmlnLnN0b3JlTmFtZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjaygpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIG9wZW4gaW5kZXhlZERCIHN1Y2Nlc3MnKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfZ2V0UHJlc2VudEtleShzdG9yZUNvbmZpZy5zdG9yZU5hbWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8gc2V0IHByZXNlbnQga2V5IHZhbHVlIHRvIF9wcmVzZW50S2V5ICh0aGUgcHJpdmF0ZSBwcm9wZXJ0eSlcbiAgZnVuY3Rpb24gX2dldFByZXNlbnRLZXkoc3RvcmVOYW1lLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0pO1xuXG4gICAgX3ByZXNlbnRLZXlbc3RvcmVOYW1lXSA9IDA7XG4gICAgX2dldEFsbFJlcXVlc3QodHJhbnNhY3Rpb24sIHN0b3JlTmFtZSkub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0QWxsU3VjY2VzcyhlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIF9wcmVzZW50S2V5W3N0b3JlTmFtZV0gPSBjdXJzb3IudmFsdWUuaWQ7XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfVxuICAgIH07XG4gICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGNvbXBsZXRlR2V0UHJlc2VudEtleSgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIG5vdyAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgbWF4IGtleSBpcyAnICsgIF9wcmVzZW50S2V5W3N0b3JlTmFtZV0pOyAvLyBpbml0aWFsIHZhbHVlIGlzIDBcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIG9wZW5TdWNjZXNzQ2FsbGJhY2snICsgJyBmaW5pc2hlZCcpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfY3JlYXRlT2JqZWN0U3RvcmVIYW5kbGVyKGNvbmZpZ1N0b3JlQ29uZmlnKSB7XG4gICAgX3BhcnNlSlNPTkRhdGEoY29uZmlnU3RvcmVDb25maWcsICdzdG9yZU5hbWUnKS5mb3JFYWNoKGZ1bmN0aW9uIGRldGVjdFN0b3JlTmFtZShzdG9yZUNvbmZpZykge1xuICAgICAgaWYgKCEoX2RiLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoc3RvcmVDb25maWcuc3RvcmVOYW1lKSkpIHtcbiAgICAgICAgX2NyZWF0ZU9iamVjdFN0b3JlKHN0b3JlQ29uZmlnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9jcmVhdGVPYmplY3RTdG9yZShzdG9yZUNvbmZpZykge1xuICAgIHZhciBzdG9yZSA9IF9kYi5jcmVhdGVPYmplY3RTdG9yZShzdG9yZUNvbmZpZy5zdG9yZU5hbWUsIHsga2V5UGF0aDogc3RvcmVDb25maWcua2V5LCBhdXRvSW5jcmVtZW50OiB0cnVlIH0pO1xuXG4gICAgLy8gVXNlIHRyYW5zYWN0aW9uIG9uY29tcGxldGUgdG8gbWFrZSBzdXJlIHRoZSBvYmplY3QgU3RvcmUgY3JlYXRpb24gaXMgZmluaXNoZWRcbiAgICBzdG9yZS50cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gYWRkaW5pdGlhbERhdGEoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBjcmVhdGUgJyArIHN0b3JlQ29uZmlnLnN0b3JlTmFtZSArICdcXCdzIG9iamVjdCBzdG9yZSBzdWNjZWVkJyk7XG4gICAgICBpZiAoc3RvcmVDb25maWcuaW5pdGlhbERhdGEpIHtcbiAgICAgICAgLy8gU3RvcmUgaW5pdGlhbCB2YWx1ZXMgaW4gdGhlIG5ld2x5IGNyZWF0ZWQgb2JqZWN0IHN0b3JlLlxuICAgICAgICBfaW5pdGlhbERhdGFIYW5kbGVyKHN0b3JlQ29uZmlnLnN0b3JlTmFtZSwgc3RvcmVDb25maWcuaW5pdGlhbERhdGEpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfaW5pdGlhbERhdGFIYW5kbGVyKHN0b3JlTmFtZSwgaW5pdGlhbERhdGEpIHtcbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcbiAgICB2YXIgb2JqZWN0U3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpO1xuXG4gICAgX3BhcnNlSlNPTkRhdGEoaW5pdGlhbERhdGEsICdpbml0aWFsJykuZm9yRWFjaChmdW5jdGlvbiBhZGRFdmVyeUluaXRpYWxEYXRhKGRhdGEsIGluZGV4KSB7XG4gICAgICB2YXIgYWRkUmVxdWVzdCA9IG9iamVjdFN0b3JlLmFkZChkYXRhKTtcblxuICAgICAgYWRkUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBhZGRJbml0aWFsU3VjY2VzcygpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgYWRkIGluaXRpYWwgZGF0YVsnICsgaW5kZXggKyAnXSBzdWNjZXNzZWQnKTtcbiAgICAgIH07XG4gICAgfSk7XG4gICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGFkZEFsbERhdGFEb25lKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgYWRkIGFsbCcgKyBzdG9yZU5hbWUgICsgJ1xcJ3MgaW5pdGlhbCBkYXRhIGRvbmUgOiknKTtcbiAgICAgIF9nZXRQcmVzZW50S2V5KHN0b3JlTmFtZSk7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9wYXJzZUpTT05EYXRhKHJhd2RhdGEsIG1lc3NhZ2UpIHtcbiAgICB0cnkge1xuICAgICAgdmFyIHBhcnNlZERhdGEgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHJhd2RhdGEpKTtcblxuICAgICAgcmV0dXJuIHBhcnNlZERhdGE7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHdpbmRvdy5hbGVydCgncGxlYXNlIHNldCBjb3JyZWN0JyArIG1lc3NhZ2UgICsgJ2FycmF5IG9iamVjdCA6KScpO1xuICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TGVuZ3RoKHN0b3JlTmFtZSkge1xuICAgIHJldHVybiBfcHJlc2VudEtleVtzdG9yZU5hbWVdO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TmV3S2V5KHN0b3JlTmFtZSkge1xuICAgIF9wcmVzZW50S2V5W3N0b3JlTmFtZV0gKz0gMTtcblxuICAgIHJldHVybiBfcHJlc2VudEtleVtzdG9yZU5hbWVdO1xuICB9XG5cbiAgLyogQ1JVRCAqL1xuXG4gIGZ1bmN0aW9uIGFkZEl0ZW0oc3RvcmVOYW1lLCBuZXdEYXRhLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcbiAgICB2YXIgYWRkUmVxdWVzdCA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHN0b3JlTmFtZSkuYWRkKG5ld0RhdGEpO1xuXG4gICAgYWRkUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBhZGRTdWNjZXNzKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgYWRkICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgYWRkUmVxdWVzdC5zb3VyY2Uua2V5UGF0aCArICcgPSAnICsgbmV3RGF0YVthZGRSZXF1ZXN0LnNvdXJjZS5rZXlQYXRoXSArICcgZGF0YSBzdWNjZWVkIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhuZXdEYXRhKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0SXRlbShzdG9yZU5hbWUsIGtleSwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdKTtcbiAgICB2YXIgZ2V0UmVxdWVzdCA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHN0b3JlTmFtZSkuZ2V0KHBhcnNlSW50KGtleSwgMTApKTsgIC8vIGdldCBpdCBieSBpbmRleFxuXG4gICAgZ2V0UmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRTdWNjZXNzKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgZ2V0ICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgZ2V0UmVxdWVzdC5zb3VyY2Uua2V5UGF0aCArICcgPSAnICsga2V5ICsgJyBkYXRhIHN1Y2Nlc3MgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKGdldFJlcXVlc3QucmVzdWx0KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLy8gZ2V0IGNvbmRpdGlvbmFsIGRhdGEgKGJvb2xlYW4gY29uZGl0aW9uKVxuICBmdW5jdGlvbiBnZXRXaGV0aGVyQ29uZGl0aW9uSXRlbShzdG9yZU5hbWUsIGNvbmRpdGlvbiwgd2hldGhlciwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdKTtcbiAgICB2YXIgcmVzdWx0ID0gW107IC8vIHVzZSBhbiBhcnJheSB0byBzdG9yYWdlIGVsaWdpYmxlIGRhdGFcblxuICAgIF9nZXRBbGxSZXF1ZXN0KHRyYW5zYWN0aW9uLCBzdG9yZU5hbWUpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGdldEFsbFN1Y2Nlc3MoZSkge1xuICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICBpZiAod2hldGhlcikge1xuICAgICAgICAgIGlmIChjdXJzb3IudmFsdWVbY29uZGl0aW9uXSkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goY3Vyc29yLnZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIXdoZXRoZXIpIHtcbiAgICAgICAgICBpZiAoIWN1cnNvci52YWx1ZVtjb25kaXRpb25dKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChjdXJzb3IudmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSBmdW5jdGlvbiBjb21wbGV0ZUFkZEFsbCgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGdldCAnICsgc3RvcmVOYW1lICsgJ1xcJ3MgJyArIGNvbmRpdGlvbiArICcgOiAnICsgd2hldGhlciAgKyAnIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzdWx0KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0QWxsKHN0b3JlTmFtZSwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdKTtcbiAgICB2YXIgcmVzdWx0ID0gW107XG5cbiAgICBfZ2V0QWxsUmVxdWVzdCh0cmFuc2FjdGlvbiwgc3RvcmVOYW1lKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRBbGxTdWNjZXNzKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goY3Vyc29yLnZhbHVlKTtcbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gY29tcGxldGVHZXRBbGwoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBnZXQgJyArIHN0b3JlTmFtZSArICdcXCdzICcgKyAnYWxsIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzdWx0KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlSXRlbShzdG9yZU5hbWUsIGtleSwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdLCAncmVhZHdyaXRlJyk7XG4gICAgdmFyIGRlbGV0ZVJlcXVlc3QgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpLmRlbGV0ZShrZXkpO1xuXG4gICAgZGVsZXRlUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBkZWxldGVTdWNjZXNzKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgcmVtb3ZlICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgZGVsZXRlUmVxdWVzdC5zb3VyY2Uua2V5UGF0aCArICcgPSAnICsga2V5ICsgJyBkYXRhIHN1Y2Nlc3MgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKGtleSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZVdoZXRoZXJDb25kaXRpb25JdGVtKHN0b3JlTmFtZSwgY29uZGl0aW9uLCB3aGV0aGVyLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcblxuICAgIF9nZXRBbGxSZXF1ZXN0KHRyYW5zYWN0aW9uLCBzdG9yZU5hbWUpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGdldEFsbFN1Y2Nlc3MoZSkge1xuICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICBpZiAod2hldGhlcikge1xuICAgICAgICAgIGlmIChjdXJzb3IudmFsdWVbY29uZGl0aW9uXSkge1xuICAgICAgICAgICAgY3Vyc29yLmRlbGV0ZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghd2hldGhlcikge1xuICAgICAgICAgIGlmICghY3Vyc29yLnZhbHVlW2NvbmRpdGlvbl0pIHtcbiAgICAgICAgICAgIGN1cnNvci5kZWxldGUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gY29tcGxldGVSZW1vdmVXaGV0aGVyKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgcmVtb3ZlICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgY29uZGl0aW9uICsgJyA6ICcgKyB3aGV0aGVyICArICcgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjaygpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhcihzdG9yZU5hbWUsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuXG4gICAgX2dldEFsbFJlcXVlc3QodHJhbnNhY3Rpb24sIHN0b3JlTmFtZSkub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0QWxsU3VjY2VzcyhlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIGN1cnNvci5kZWxldGUoKTtcbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gY29tcGxldGVDbGVhcigpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGNsZWFyICcgKyBzdG9yZU5hbWUgKyAnXFwncyAnICsgJ2FsbCBkYXRhIHN1Y2Nlc3MgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKCdjbGVhciBhbGwgZGF0YSBzdWNjZXNzJyk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8vIHVwZGF0ZSBvbmVcbiAgZnVuY3Rpb24gdXBkYXRlSXRlbShzdG9yZU5hbWUsIG5ld0RhdGEsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuICAgIHZhciBwdXRSZXF1ZXN0ID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKS5wdXQobmV3RGF0YSk7XG5cbiAgICBwdXRSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIHB1dFN1Y2Nlc3MoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyB1cGRhdGUgJyArIHN0b3JlTmFtZSArICdcXCdzICcgKyBwdXRSZXF1ZXN0LnNvdXJjZS5rZXlQYXRoICsgJyA9ICcgKyBuZXdEYXRhW3B1dFJlcXVlc3Quc291cmNlLmtleVBhdGhdICsgJyBkYXRhIHN1Y2Nlc3MgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKG5ld0RhdGEpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfZ2V0QWxsUmVxdWVzdCh0cmFuc2FjdGlvbiwgc3RvcmVOYW1lKSB7XG4gICAgcmV0dXJuIHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHN0b3JlTmFtZSkub3BlbkN1cnNvcihJREJLZXlSYW5nZS5sb3dlckJvdW5kKDEpLCAnbmV4dCcpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvcGVuOiBvcGVuLFxuICAgIGdldExlbmd0aDogZ2V0TGVuZ3RoLFxuICAgIGdldE5ld0tleTogZ2V0TmV3S2V5LFxuICAgIGdldEl0ZW06IGdldEl0ZW0sXG4gICAgZ2V0V2hldGhlckNvbmRpdGlvbkl0ZW06IGdldFdoZXRoZXJDb25kaXRpb25JdGVtLFxuICAgIGdldEFsbDogZ2V0QWxsLFxuICAgIGFkZEl0ZW06IGFkZEl0ZW0sXG4gICAgcmVtb3ZlSXRlbTogcmVtb3ZlSXRlbSxcbiAgICByZW1vdmVXaGV0aGVyQ29uZGl0aW9uSXRlbTogcmVtb3ZlV2hldGhlckNvbmRpdGlvbkl0ZW0sXG4gICAgY2xlYXI6IGNsZWFyLFxuICAgIHVwZGF0ZUl0ZW06IHVwZGF0ZUl0ZW1cbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gSW5kZXhlZERCSGFuZGxlcjtcbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0ge1xuICBuYW1lOiAnSnVzdFRvRG8nLFxuICB2ZXJzaW9uOiAnMjMnLFxuICBzdG9yZUNvbmZpZzogW1xuICAgIHtcbiAgICAgIHN0b3JlTmFtZTogJ2xpc3QnLFxuICAgICAga2V5OiAnaWQnLFxuICAgICAgaW5pdGlhbERhdGE6IFtcbiAgICAgICAgeyBpZDogMCwgZXZlbnQ6ICdKdXN0RGVtbycsIGZpbmlzaGVkOiB0cnVlLCBkYXRlOiAwIH1cbiAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgIHN0b3JlTmFtZTogJ2FwaG9yaXNtJyxcbiAgICAgIGtleTogJ2lkJyxcbiAgICAgIGluaXRpYWxEYXRhOiBbXG4gICAgICAgIHtcbiAgICAgICAgICAnaWQnOiAxLFxuICAgICAgICAgICdjb250ZW50JzogXCJZb3UncmUgYmV0dGVyIHRoYW4gdGhhdFwiXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAnaWQnOiAyLFxuICAgICAgICAgICdjb250ZW50JzogJ1llc3RlcmRheSBZb3UgU2FpZCBUb21vcnJvdydcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICdpZCc6IDMsXG4gICAgICAgICAgJ2NvbnRlbnQnOiAnV2h5IGFyZSB3ZSBoZXJlPydcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICdpZCc6IDQsXG4gICAgICAgICAgJ2NvbnRlbnQnOiAnQWxsIGluLCBvciBub3RoaW5nJ1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgJ2lkJzogNSxcbiAgICAgICAgICAnY29udGVudCc6ICdZb3UgTmV2ZXIgVHJ5LCBZb3UgTmV2ZXIgS25vdydcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICdpZCc6IDYsXG4gICAgICAgICAgJ2NvbnRlbnQnOiAnVGhlIHVuZXhhbWluZWQgbGlmZSBpcyBub3Qgd29ydGggbGl2aW5nLiAtLSBTb2NyYXRlcydcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICdpZCc6IDcsXG4gICAgICAgICAgJ2NvbnRlbnQnOiAnVGhlcmUgaXMgb25seSBvbmUgdGhpbmcgd2Ugc2F5IHRvIGxhenk6IE5PVCBUT0RBWSdcbiAgICAgICAgfVxuICAgICAgXVxuICAgIH1cbiAgXVxufTtcbiIsIid1c2Ugc3RyaWN0JztcbihmdW5jdGlvbiBpbml0KCkge1xuICB2YXIgREIgPSByZXF1aXJlKCdpbmRleGVkZGItY3J1ZCcpO1xuICB2YXIgREJDb25maWcgPSByZXF1aXJlKCcuL2RiL2NvbmZpZy5qcycpO1xuICB2YXIgYWRkRXZlbnRzID0gcmVxdWlyZSgnLi91dGxpcy9hZGRFdmVudHMuanMnKTtcblxuICAvLyBvcGVuIERCLCBhbmQgd2hlbiBEQiBvcGVuIHN1Y2NlZWQsIGludm9rZSBpbml0aWFsIGZ1bmN0aW9uXG4gIERCLm9wZW4oREJDb25maWcsIGFkZEV2ZW50cy5kYkZhaWwsIGFkZEV2ZW50cy5kYkZhaWwpO1xufSgpKTtcbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uIGFkZEV2ZW50c0dlbmVyYXRvcigpIHtcbiAgZnVuY3Rpb24gX3doZXRoZXJTdWNjZXNzKHdoZXRoZXJTdWNjZXNzKSB7XG4gICAgZnVuY3Rpb24gX3doZXRoZXJTdWNjZXNzSGFuZGxlcih3aGV0aGVyKSB7XG4gICAgICB2YXIgbGlzdDtcbiAgICAgIHZhciBldmVudEhhbmRsZXIgPSByZXF1aXJlKCcuL2V2ZW50SGFuZGxlci9ldmVudEhhbmRsZXIuanMnKTtcbiAgICAgIHZhciBoYW5kbGVyID0gd2hldGhlciA/IGV2ZW50SGFuZGxlci5kYlN1Y2Nlc3MgOiBldmVudEhhbmRsZXIuZGJGYWlsO1xuXG4gICAgICBpZiAoaGFuZGxlciA9PT0gZXZlbnRIYW5kbGVyLmRiRmFpbCkge1xuICAgICAgICB3aW5kb3cuYWxlcnQoJ1lvdXIgYnJvd3NlciBkb2VzblxcJ3Qgc3VwcG9ydCBhIHN0YWJsZSB2ZXJzaW9uIG9mIEluZGV4ZWREQi4gV2Ugd2lsbCBvZmZlciB5b3UgdGhlIHdpdGhvdXQgaW5kZXhlZERCIG1vZGUnKTtcbiAgICAgIH1cbiAgICAgIGhhbmRsZXIuc2hvd0luaXQoKTtcbiAgICAgIC8vIGFkZCBhbGwgZXZlbnRMaXN0ZW5lclxuICAgICAgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgICBsaXN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5jbGlja0xpLCBmYWxzZSk7XG4gICAgICBsaXN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5yZW1vdmVMaSwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZXIuZW50ZXJBZGQsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhZGQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuYWRkLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0RvbmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0RvbmUsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93VG9kbycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93VG9kbywgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dBbGwnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0FsbCwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dDbGVhckRvbmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0NsZWFyRG9uZSwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dDbGVhcicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93Q2xlYXIsIGZhbHNlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gYWRkRXZlbnRzKCkge1xuICAgICAgX3doZXRoZXJTdWNjZXNzSGFuZGxlcih3aGV0aGVyU3VjY2Vzcyk7XG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZGJTdWNjZXNzOiBfd2hldGhlclN1Y2Nlc3ModHJ1ZSksXG4gICAgZGJGYWlsOiBfd2hldGhlclN1Y2Nlc3MoZmFsc2UpXG4gIH07XG59KCkpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjbGVhckNoaWxkTm9kZXMocm9vdCkge1xuICB3aGlsZSAocm9vdC5oYXNDaGlsZE5vZGVzKCkpIHsgLy8gb3Igcm9vdC5maXJzdENoaWxkIG9yIHJvb3QubGFzdENoaWxkXG4gICAgcm9vdC5yZW1vdmVDaGlsZChyb290LmZpcnN0Q2hpbGQpO1xuICB9XG4gIC8vIG9yIHJvb3QuaW5uZXJIVE1MID0gJydcbn07XG4iLCIndXNlIHN0cmljdCc7XG52YXIgZGJGYWlsID0gKGZ1bmN0aW9uIGRiRmFpbEdlbmVyYXRvcigpIHtcbiAgdmFyIHJlZnJlc2ggPSByZXF1aXJlKCcuLi9yZWZyZXNoL3JlZnJlc2guanMnKS5kYkZhaWw7XG4gIHZhciBsaUdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL2xpR2VuZXJhdG9yLmpzJyk7XG4gIHZhciBnZW5lcmFsID0gcmVxdWlyZSgnLi9nZW5lcmFsLmpzJyk7XG4gIHZhciBfaWQgPSAwOyAvLyBzbyB0aGUgZmlyc3QgaXRlbSdzIGlkIGlzIDFcbiAgdmFyIF9mb3JFYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2g7XG5cbiAgZnVuY3Rpb24gYWRkKCkge1xuICAgIHZhciBpbnB1dFZhbHVlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWU7XG4gICAgdmFyIG5ld0RhdGE7XG4gICAgdmFyIGxpc3Q7XG5cbiAgICBpZiAoaW5wdXRWYWx1ZSA9PT0gJycpIHtcbiAgICAgIHdpbmRvdy5hbGVydCgncGxlYXNlIGlucHV0IGEgcmVhbCBkYXRhficpO1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIF9yZW1vdmVSYW5kb20oKTtcbiAgICBfaWQgKz0gMTtcbiAgICBuZXdEYXRhID0gZ2VuZXJhbC5kYXRhR2VuZXJhdG9yKF9pZCwgaW5wdXRWYWx1ZSk7XG4gICAgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgbGlzdC5pbnNlcnRCZWZvcmUobGlHZW5lcmF0b3IobmV3RGF0YSksIGxpc3QuZmlyc3RDaGlsZCk7IC8vIHB1c2ggbmV3TGkgdG8gZmlyc3RcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5wdXQnKS52YWx1ZSA9ICcnOyAgLy8gcmVzZXQgaW5wdXQncyB2YWx1ZXNcblxuICAgIHJldHVybiAwO1xuICB9XG5cbiAgZnVuY3Rpb24gX3JlbW92ZVJhbmRvbSgpIHtcbiAgICB2YXIgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgdmFyIGxpc3RJdGVtcyA9IGxpc3QuY2hpbGROb2RlcztcblxuICAgIGNvbnNvbGUuZGlyKGxpc3RJdGVtcyk7XG4gICAgX2ZvckVhY2guY2FsbChsaXN0SXRlbXMsIGZ1bmN0aW9uIHdoZXRoZXJIYXNSYW5kb20oaXRlbSkge1xuICAgICAgLy8gY29uc29sZS5sb2coaW5kZXgpO1xuICAgICAgaWYgKGl0ZW0uY2xhc3NMaXN0LmNvbnRhaW5zKCdhcGhvcmlzbScpKSB7XG4gICAgICAgIGxpc3QucmVtb3ZlQ2hpbGQoaXRlbSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gb3IgdXNlIGZvci4uLmluXG4gICAgLy8gZm9yICh2YXIgaW5kZXggaW4gbGlzdEl0ZW1zKSB7XG4gICAgLy8gICBpZiAobGlzdEl0ZW1zLmhhc093blByb3BlcnR5KGluZGV4KSkge1xuICAgIC8vICAgICBpZiAobGlzdEl0ZW1zW2luZGV4XS5jbGFzc0xpc3QuY29udGFpbnMoJ2FwaG9yaXNtJykpIHtcbiAgICAvLyAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGxpc3RJdGVtc1tpbmRleF0pO1xuICAgIC8vICAgICB9XG4gICAgLy8gICB9XG4gICAgLy8gfVxuICB9XG5cbiAgZnVuY3Rpb24gZW50ZXJBZGQoZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzKSB7XG4gICAgICBhZGQoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjbGlja0xpKGUpIHtcbiAgICB2YXIgdGFyZ2V0TGkgPSBlLnRhcmdldDtcbiAgICAvLyB1c2UgZXZlbnQgZGVsZWdhdGlvblxuXG4gICAgaWYgKHRhcmdldExpLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpKSB7XG4gICAgICB0YXJnZXRMaS5jbGFzc0xpc3QudG9nZ2xlKCdmaW5pc2hlZCcpO1xuICAgICAgc2hvd0FsbCgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGxpJ3MgW3hdJ3MgZGVsZXRlXG4gIGZ1bmN0aW9uIHJlbW92ZUxpKGUpIHtcbiAgICBpZiAoZS50YXJnZXQuY2xhc3NOYW1lID09PSAnY2xvc2UnKSB7IC8vIHVzZSBldmVudCBkZWxlZ2F0aW9uXG4gICAgICBfcmVtb3ZlTGlIYW5kbGVyKGUudGFyZ2V0KTtcbiAgICAgIGdlbmVyYWwuaWZFbXB0eS5hZGRSYW5kb20oKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfcmVtb3ZlTGlIYW5kbGVyKGVsZW1lbnQpIHtcbiAgICAvLyB1c2UgcHJldmlvdXNseSBzdG9yZWQgZGF0YVxuICAgIHZhciBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgICB2YXIgbGlzdEl0ZW1zID0gbGlzdC5jaGlsZE5vZGVzO1xuICAgIHZhciBpZCA9IGVsZW1lbnQucGFyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKTtcbiAgICB0cnkge1xuICAgICAgX2ZvckVhY2guY2FsbChsaXN0SXRlbXMsIGZ1bmN0aW9uIHdoZXRoZXJIYXNSYW5kb20oaXRlbSkge1xuICAgICAgICBpZiAoaXRlbS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSA9PT0gaWQpIHtcbiAgICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGl0ZW0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5sb2coJ1dyb25nIGlkLCBub3QgZm91bmQgaW4gRE9NIHRyZWUnKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgLy8gZm9yIFNlbWFudGljXG4gIGdlbmVyYWwuaWZFbXB0eS5hZGRSYW5kb20gPSBmdW5jdGlvbiBhZGRSYW5kb20oKSB7XG4gICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gICAgaWYgKCFsaXN0LmZpcnN0Q2hpbGQgfHwgX2lzQWxsTm9uZShsaXN0KSkge1xuICAgICAgcmVmcmVzaC5yYW5kb20oKTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gX2lzQWxsTm9uZShsaXN0KSB7XG4gICAgdmFyIGxpc3RJdGVtcyA9IGxpc3QuY2hpbGROb2RlcztcblxuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuZXZlcnkuY2FsbChsaXN0SXRlbXMsIGZ1bmN0aW9uIHdoZXRoZXJIYXNSYW5kb20oaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0uc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0luaXQoKSB7XG4gICAgcmVmcmVzaC5jbGVhcigpO1xuICAgIHJlZnJlc2guaW5pdCgpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0FsbCgpIHtcbiAgICB2YXIgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgdmFyIGxpc3RJdGVtcyA9IGxpc3QuY2hpbGROb2RlcztcblxuICAgIF9mb3JFYWNoLmNhbGwobGlzdEl0ZW1zLCBmdW5jdGlvbiBhcHBlYXJBbGwoaXRlbSkge1xuICAgICAgX3doZXRoZXJBcHBlYXIoaXRlbSwgdHJ1ZSk7XG4gICAgICBpZiAoaXRlbS5jbGFzc0xpc3QuY29udGFpbnMoJ2ZpbmlzaGVkJykpIHtcbiAgICAgICAgbGlzdC5yZW1vdmVDaGlsZChpdGVtKTtcbiAgICAgICAgbGlzdC5hcHBlbmRDaGlsZChpdGVtKTsgLy8gUFVOQ0hMSU5FOiBkcm9wIGRvbmUgaXRlbVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0RvbmUoKSB7XG4gICAgX3Nob3dXaGV0aGVyRG9uZSh0cnVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dUb2RvKCkge1xuICAgIF9zaG93V2hldGhlckRvbmUoZmFsc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3Nob3dXaGV0aGVyRG9uZSh3aGV0aGVyRG9uZSkge1xuICAgIHZhciBsaXN0SXRlbXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmNoaWxkTm9kZXM7XG5cbiAgICBfZm9yRWFjaC5jYWxsKGxpc3RJdGVtcywgZnVuY3Rpb24gd2hldGhlckRvbmVBcHBlYXIoaXRlbSkge1xuICAgICAgaXRlbS5jbGFzc0xpc3QuY29udGFpbnMoJ2ZpbmlzaGVkJykgPyBfd2hldGhlckFwcGVhcihpdGVtLCB3aGV0aGVyRG9uZSkgOiBfd2hldGhlckFwcGVhcihpdGVtLCAhd2hldGhlckRvbmUpO1xuICAgIH0pO1xuICAgIF9yZW1vdmVSYW5kb20oKTtcbiAgICBnZW5lcmFsLmlmRW1wdHkuYWRkUmFuZG9tKCk7XG4gIH1cblxuICBmdW5jdGlvbiBfd2hldGhlckFwcGVhcihlbGVtZW50LCB3aGV0aGVyKSB7XG4gICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gd2hldGhlciA/ICdibG9jaycgOiAnbm9uZSc7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93Q2xlYXIoKSB7XG4gICAgcmVmcmVzaC5jbGVhcigpOyAvLyBjbGVhciBub2RlcyB2aXN1YWxseVxuICAgIHJlZnJlc2gucmFuZG9tKCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGFkZDogYWRkLFxuICAgIGVudGVyQWRkOiBlbnRlckFkZCxcbiAgICBjbGlja0xpOiBjbGlja0xpLFxuICAgIHJlbW92ZUxpOiByZW1vdmVMaSxcbiAgICBzaG93SW5pdDogc2hvd0luaXQsXG4gICAgc2hvd0FsbDogc2hvd0FsbCxcbiAgICBzaG93RG9uZTogc2hvd0RvbmUsXG4gICAgc2hvd1RvZG86IHNob3dUb2RvLFxuICAgIC8vIHNob3dDbGVhckRvbmU6IHNob3dDbGVhckRvbmUsXG4gICAgc2hvd0NsZWFyOiBzaG93Q2xlYXJcbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZGJGYWlsO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGRiU3VjY2VzcyA9IChmdW5jdGlvbiBkYlN1Y2Nlc3NHZW5lcmF0b3IoKSB7XG4gIHZhciBzdG9yZU5hbWUgPSAnbGlzdCc7XG4gIHZhciBEQiA9IHJlcXVpcmUoJ2luZGV4ZWRkYi1jcnVkJyk7XG4gIHZhciByZWZyZXNoID0gcmVxdWlyZSgnLi4vcmVmcmVzaC9yZWZyZXNoLmpzJykuZGJTdWNjZXNzO1xuICB2YXIgbGlHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9saUdlbmVyYXRvci5qcycpO1xuICB2YXIgZ2VuZXJhbCA9IHJlcXVpcmUoJy4vZ2VuZXJhbC5qcycpO1xuXG4gIGZ1bmN0aW9uIGFkZCgpIHtcbiAgICB2YXIgbGlzdDtcbiAgICB2YXIgbmV3RGF0YTtcbiAgICB2YXIgaW5wdXRWYWx1ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNpbnB1dCcpLnZhbHVlO1xuXG4gICAgaWYgKGlucHV0VmFsdWUgPT09ICcnKSB7XG4gICAgICB3aW5kb3cuYWxlcnQoJ3BsZWFzZSBpbnB1dCBhIHJlYWwgZGF0YX4nKTtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBnZW5lcmFsLmlmRW1wdHkucmVtb3ZlSW5pdCgpO1xuICAgIG5ld0RhdGEgPSBnZW5lcmFsLmRhdGFHZW5lcmF0b3IoREIuZ2V0TmV3S2V5KHN0b3JlTmFtZSksIGlucHV0VmFsdWUpO1xuICAgIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgIGxpc3QuaW5zZXJ0QmVmb3JlKGxpR2VuZXJhdG9yKG5ld0RhdGEpLCBsaXN0LmZpcnN0Q2hpbGQpOyAvLyBwdXNoIG5ld0xpIHRvIGZpcnN0XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWUgPSAnJzsgIC8vIHJlc2V0IGlucHV0J3MgdmFsdWVzXG4gICAgREIuYWRkSXRlbShzdG9yZU5hbWUsIG5ld0RhdGEpO1xuXG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICBmdW5jdGlvbiBlbnRlckFkZChlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgIGFkZCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsaWNrTGkoZSkge1xuICAgIHZhciBpZDtcbiAgICB2YXIgdGFyZ2V0TGkgPSBlLnRhcmdldDtcbiAgICAvLyB1c2UgZXZlbnQgZGVsZWdhdGlvblxuXG4gICAgaWYgKCF0YXJnZXRMaS5jbGFzc0xpc3QuY29udGFpbnMoJ2FwaG9yaXNtJykpIHtcbiAgICAgIGlmICh0YXJnZXRMaS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSkge1xuICAgICAgICB0YXJnZXRMaS5jbGFzc0xpc3QudG9nZ2xlKCdmaW5pc2hlZCcpOyAvLyB0b2dnbGUgYXBwZWFyYW5jZVxuICAgICAgICBpZCA9IHBhcnNlSW50KHRhcmdldExpLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpLCAxMCk7IC8vIHVzZSBwcmV2aW91c2x5IHN0b3JlZCBkYXRhLWlkIGF0dHJpYnV0ZVxuICAgICAgICBEQi5nZXRJdGVtKHN0b3JlTmFtZSwgaWQsIF90b2dnbGVMaSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX3RvZ2dsZUxpKGRhdGEpIHtcbiAgICBkYXRhLmZpbmlzaGVkID0gIWRhdGEuZmluaXNoZWQ7XG4gICAgREIudXBkYXRlSXRlbShzdG9yZU5hbWUsIGRhdGEsIHNob3dBbGwpO1xuICB9XG5cbiAgLy8gbGkncyBbeF0ncyBkZWxldGVcbiAgZnVuY3Rpb24gcmVtb3ZlTGkoZSkge1xuICAgIHZhciBpZDtcblxuICAgIGlmIChlLnRhcmdldC5jbGFzc05hbWUgPT09ICdjbG9zZScpIHsgLy8gdXNlIGV2ZW50IGRlbGVnYXRpb25cbiAgICAgIC8vIHVzZSBwcmV2aW91c2x5IHN0b3JlZCBkYXRhXG4gICAgICBpZCA9IHBhcnNlSW50KGUudGFyZ2V0LnBhcmVudE5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyksIDEwKTtcbiAgICAgIERCLnJlbW92ZUl0ZW0oc3RvcmVOYW1lLCBpZCwgc2hvd0FsbCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0luaXQoKSB7XG4gICAgcmVmcmVzaC5jbGVhcigpO1xuICAgIERCLmdldEFsbChzdG9yZU5hbWUsIHJlZnJlc2guaW5pdCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93QWxsKCkge1xuICAgIHJlZnJlc2guY2xlYXIoKTtcbiAgICBEQi5nZXRBbGwoc3RvcmVOYW1lLCByZWZyZXNoLmFsbCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93RG9uZSgpIHtcbiAgICBfc2hvd1doZXRoZXJEb25lKHRydWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd1RvZG8oKSB7XG4gICAgX3Nob3dXaGV0aGVyRG9uZShmYWxzZSk7XG4gIH1cblxuICBmdW5jdGlvbiBfc2hvd1doZXRoZXJEb25lKHdoZXRoZXJEb25lKSB7XG4gICAgdmFyIGNvbmRpdGlvbiA9ICdmaW5pc2hlZCc7XG5cbiAgICByZWZyZXNoLmNsZWFyKCk7XG4gICAgREIuZ2V0V2hldGhlckNvbmRpdGlvbkl0ZW0oc3RvcmVOYW1lLCBjb25kaXRpb24sIHdoZXRoZXJEb25lLCByZWZyZXNoLnBhcnQpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0NsZWFyRG9uZSgpIHtcbiAgICB2YXIgY29uZGl0aW9uID0gJ2ZpbmlzaGVkJztcblxuICAgIHJlZnJlc2guY2xlYXIoKTtcbiAgICBEQi5yZW1vdmVXaGV0aGVyQ29uZGl0aW9uSXRlbShzdG9yZU5hbWUsIGNvbmRpdGlvbiwgdHJ1ZSwgZnVuY3Rpb24gc2hvd0xlZnREYXRhKCkge1xuICAgICAgREIuZ2V0QWxsKHN0b3JlTmFtZSwgcmVmcmVzaC5wYXJ0KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dDbGVhcigpIHtcbiAgICByZWZyZXNoLmNsZWFyKCk7IC8vIGNsZWFyIG5vZGVzIHZpc3VhbGx5XG4gICAgcmVmcmVzaC5yYW5kb20oKTtcbiAgICBEQi5jbGVhcihzdG9yZU5hbWUpOyAvLyBjbGVhciBkYXRhIGluZGVlZFxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBhZGQ6IGFkZCxcbiAgICBlbnRlckFkZDogZW50ZXJBZGQsXG4gICAgY2xpY2tMaTogY2xpY2tMaSxcbiAgICByZW1vdmVMaTogcmVtb3ZlTGksXG4gICAgc2hvd0luaXQ6IHNob3dJbml0LFxuICAgIHNob3dBbGw6IHNob3dBbGwsXG4gICAgc2hvd0RvbmU6IHNob3dEb25lLFxuICAgIHNob3dUb2RvOiBzaG93VG9kbyxcbiAgICBzaG93Q2xlYXJEb25lOiBzaG93Q2xlYXJEb25lLFxuICAgIHNob3dDbGVhcjogc2hvd0NsZWFyXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRiU3VjY2VzcztcbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uIGV2ZW50SGFuZGxlckdlbmVyYXRvcigpIHtcbiAgdmFyIGRiU3VjY2VzcyA9IHJlcXVpcmUoJy4vZGJTdWNjZXNzLmpzJyk7XG4gIHZhciBkYkZhaWwgPSByZXF1aXJlKCcuL2RiRmFpbC5qcycpO1xuXG4gIHJldHVybiB7XG4gICAgZGJTdWNjZXNzOiBkYlN1Y2Nlc3MsXG4gICAgZGJGYWlsOiBkYkZhaWxcbiAgfTtcbn0oKSk7XG4iLCJ2YXIgZ2VuZXJhbCA9IChmdW5jdGlvbiBnZW5lcmFsR2VuZXJhdG9yKCkge1xuICB2YXIgaWZFbXB0eSA9IHtcbiAgICByZW1vdmVJbml0OiBmdW5jdGlvbiByZW1vdmVJbml0KCkge1xuICAgICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gICAgICBpZiAobGlzdC5maXJzdENoaWxkLmNsYXNzTmFtZSA9PT0gJ2FwaG9yaXNtJykge1xuICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGxpc3QuZmlyc3RDaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIGRhdGFHZW5lcmF0b3Ioa2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiB7XG4gICAgICBpZDoga2V5LFxuICAgICAgZXZlbnQ6IHZhbHVlLFxuICAgICAgZmluaXNoZWQ6IGZhbHNlLFxuICAgICAgZGF0ZTogX2dldE5ld0RhdGUoJ3l5eXnlubRNTeaciGRk5pelIGhoOm1tJylcbiAgICB9O1xuICB9XG5cbiAgLy8gRm9ybWF0IGRhdGVcbiAgZnVuY3Rpb24gX2dldE5ld0RhdGUoZm10KSB7XG4gICAgdmFyIG5ld0RhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIHZhciBuZXdmbXQgPSBmbXQ7XG4gICAgdmFyIG8gPSB7XG4gICAgICAneSsnOiBuZXdEYXRlLmdldEZ1bGxZZWFyKCksXG4gICAgICAnTSsnOiBuZXdEYXRlLmdldE1vbnRoKCkgKyAxLFxuICAgICAgJ2QrJzogbmV3RGF0ZS5nZXREYXRlKCksXG4gICAgICAnaCsnOiBuZXdEYXRlLmdldEhvdXJzKCksXG4gICAgICAnbSsnOiBuZXdEYXRlLmdldE1pbnV0ZXMoKVxuICAgIH07XG4gICAgdmFyIGxlbnM7XG5cbiAgICBmb3IgKHZhciBrIGluIG8pIHtcbiAgICAgIGlmIChuZXcgUmVnRXhwKCcoJyArIGsgKyAnKScpLnRlc3QobmV3Zm10KSkge1xuICAgICAgICBpZiAoayA9PT0gJ3krJykge1xuICAgICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKCcnICsgb1trXSkuc3Vic3RyKDQgLSBSZWdFeHAuJDEubGVuZ3RoKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoayA9PT0gJ1MrJykge1xuICAgICAgICAgIGxlbnMgPSBSZWdFeHAuJDEubGVuZ3RoO1xuICAgICAgICAgIGxlbnMgPSBsZW5zID09PSAxID8gMyA6IGxlbnM7XG4gICAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoJzAwJyArIG9ba10pLnN1YnN0cigoJycgKyBvW2tdKS5sZW5ndGggLSAxLCBsZW5zKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoUmVnRXhwLiQxLmxlbmd0aCA9PT0gMSkgPyAob1trXSkgOiAoKCcwMCcgKyBvW2tdKS5zdWJzdHIoKCcnICsgb1trXSkubGVuZ3RoKSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld2ZtdDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaWZFbXB0eTogaWZFbXB0eSxcbiAgICBkYXRhR2VuZXJhdG9yOiBkYXRhR2VuZXJhdG9yXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdlbmVyYWw7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgbGlHZW5lcmF0b3IgPSAoZnVuY3Rpb24gbGlHZW5lcmF0b3IoKSB7XG4gIGZ1bmN0aW9uIF9kZWNvcmF0ZUxpKGxpLCBkYXRhKSB7XG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnICcgKyBkYXRhLmV2ZW50KTtcbiAgICB2YXIgdGV4dERhdGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhLmRhdGUgKyAnOiAnKTtcbiAgICB2YXIgdGV4dFdyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG5cbiAgICAvLyB3cmFwIGFzIGEgbm9kZVxuICAgIHRleHRXcmFwLmFwcGVuZENoaWxkKHRleHQpO1xuICAgIGxpLmFwcGVuZENoaWxkKHRleHREYXRlKTtcbiAgICBsaS5hcHBlbmRDaGlsZCh0ZXh0V3JhcCk7XG4gICAgaWYgKGRhdGEuZmluaXNoZWQpIHsgIC8vIGFkZCBjc3Mtc3R5bGUgdG8gaXQgKGFjY29yZGluZyB0byBpdCdzIGRhdGEuZmluaXNoZWQgdmFsdWUpXG4gICAgICBsaS5jbGFzc0xpc3QuYWRkKCdmaW5pc2hlZCcpOyAvLyBhZGQgc3R5bGVcbiAgICB9XG4gICAgX2FkZFgobGkpOyAvLyBhZGQgc3BhbiBbeF0gdG8gbGkncyB0YWlsXG4gICAgX3NldERhdGFQcm9wZXJ0eShsaSwgJ2RhdGEtaWQnLCBkYXRhLmlkKTsgLy8gYWRkIHByb3BlcnR5IHRvIGxpIChkYXRhLWlkKe+8jGZvciAgY2xpY2tMaVxuICB9XG5cbiAgZnVuY3Rpb24gX2FkZFgobGkpIHtcbiAgICB2YXIgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICB2YXIgeCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCdcXHUwMEQ3Jyk7IC8vIHVuaWNvZGUgLT4geFxuXG4gICAgc3Bhbi5hcHBlbmRDaGlsZCh4KTtcbiAgICBzcGFuLmNsYXNzTmFtZSA9ICdjbG9zZSc7IC8vIGFkZCBzdHlsZVxuICAgIGxpLmFwcGVuZENoaWxkKHNwYW4pO1xuICB9XG5cbiAgZnVuY3Rpb24gX3NldERhdGFQcm9wZXJ0eSh0YXJnZXQsIG5hbWUsIGRhdGEpIHtcbiAgICB0YXJnZXQuc2V0QXR0cmlidXRlKG5hbWUsIGRhdGEpO1xuICB9XG5cblxuICByZXR1cm4gZnVuY3Rpb24gY3JlYXRlKGRhdGEpIHtcbiAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuXG4gICAgX2RlY29yYXRlTGkobGksIGRhdGEpOyAvLyBkZWNvcmF0ZSBsaVxuXG4gICAgcmV0dXJuIGxpO1xuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBsaUdlbmVyYXRvcjtcbiIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uIGRiRmFpbEdlbmVyYXRvcigpIHtcbiAgdmFyIGdlbmVyYWwgPSByZXF1aXJlKCcuL2dlbmVyYWwuanMnKTtcblxuICBmdW5jdGlvbiByYW5kb21BcGhvcmlzbSgpIHtcbiAgICB2YXIgYXBob3Jpc21zID0gW1xuICAgICAgJ1llc3RlcmRheSBZb3UgU2FpZCBUb21vcnJvdycsXG4gICAgICAnV2h5IGFyZSB3ZSBoZXJlPycsXG4gICAgICAnQWxsIGluLCBvciBub3RoaW5nJyxcbiAgICAgICdZb3UgTmV2ZXIgVHJ5LCBZb3UgTmV2ZXIgS25vdycsXG4gICAgICAnVGhlIHVuZXhhbWluZWQgbGlmZSBpcyBub3Qgd29ydGggbGl2aW5nLiAtLSBTb2NyYXRlcycsXG4gICAgICAnVGhlcmUgaXMgb25seSBvbmUgdGhpbmcgd2Ugc2F5IHRvIGxhenk6IE5PVCBUT0RBWSdcbiAgICBdO1xuICAgIHZhciByYW5kb21JbmRleCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFwaG9yaXNtcy5sZW5ndGgpO1xuICAgIHZhciB0ZXh0ID0gYXBob3Jpc21zW3JhbmRvbUluZGV4XTtcblxuICAgIGdlbmVyYWwuc2VudGVuY2VIYW5kbGVyKHRleHQpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpbml0OiBnZW5lcmFsLmluaXQsXG4gICAgYWxsOiBnZW5lcmFsLmFsbC5iaW5kKG51bGwsIHJhbmRvbUFwaG9yaXNtKSxcbiAgICBwYXJ0OiBnZW5lcmFsLnBhcnQuYmluZChudWxsLCByYW5kb21BcGhvcmlzbSksXG4gICAgY2xlYXI6IGdlbmVyYWwuY2xlYXIsXG4gICAgcmFuZG9tOiByYW5kb21BcGhvcmlzbVxuICB9O1xufSgpKTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gZGJTdWNjZXNzR2VuZXJhdG9yKCkge1xuICB2YXIgc3RvcmVOYW1lID0gJ2FwaG9yaXNtJztcbiAgdmFyIERCID0gcmVxdWlyZSgnaW5kZXhlZGRiLWNydWQnKTtcbiAgdmFyIGdlbmVyYWwgPSByZXF1aXJlKCcuL2dlbmVyYWwuanMnKTtcblxuICBmdW5jdGlvbiByYW5kb21BcGhvcmlzbSgpIHtcbiAgICB2YXIgcmFuZG9tSW5kZXggPSBNYXRoLmNlaWwoTWF0aC5yYW5kb20oKSAqIERCLmdldExlbmd0aChzdG9yZU5hbWUpKTtcblxuICAgIERCLmdldEl0ZW0oc3RvcmVOYW1lLCByYW5kb21JbmRleCwgX3BhcnNlVGV4dCk7XG4gIH1cblxuICBmdW5jdGlvbiBfcGFyc2VUZXh0KGRhdGEpIHtcbiAgICB2YXIgdGV4dCA9IGRhdGEuY29udGVudDtcblxuICAgIGdlbmVyYWwuc2VudGVuY2VIYW5kbGVyKHRleHQpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpbml0OiBnZW5lcmFsLmluaXQsXG4gICAgYWxsOiBnZW5lcmFsLmFsbC5iaW5kKG51bGwsIHJhbmRvbUFwaG9yaXNtKSwgIC8vIFBVTkNITElORTogdXNlIGJpbmQgdG8gcGFzcyBwYXJhbXRlclxuICAgIHBhcnQ6IGdlbmVyYWwucGFydC5iaW5kKG51bGwsIHJhbmRvbUFwaG9yaXNtKSxcbiAgICBjbGVhcjogZ2VuZXJhbC5jbGVhcixcbiAgICByYW5kb206IHJhbmRvbUFwaG9yaXNtXG4gIH07XG59KCkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGdlbmVyYWwgPSAoZnVuY3Rpb24gZ2VuZXJhbEdlbmVyYXRvcigpIHtcbiAgdmFyIGxpR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vbGlHZW5lcmF0b3IuanMnKTtcbiAgdmFyIGNsZWFyQ2hpbGROb2RlcyA9IHJlcXVpcmUoJy4uL2NsZWFyQ2hpbGROb2Rlcy5qcycpO1xuXG4gIGZ1bmN0aW9uIGluaXQoZGF0YUFycikge1xuICAgIF9zaG93KF9pbml0U2VudGVuY2UsIF9zaG93QWxsLCBkYXRhQXJyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zaG93KHNob3dTZW50ZW5jZUZ1bmMsIHNob3dGdW5jLCBkYXRhQXJyKSB7XG4gICAgaWYgKCFkYXRhQXJyIHx8IGRhdGFBcnIubGVuZ3RoID09PSAwKSB7XG4gICAgICBzaG93U2VudGVuY2VGdW5jKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNob3dGdW5jKGRhdGFBcnIpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9pbml0U2VudGVuY2UoKSB7XG4gICAgdmFyIHRleHQgPSAnV2VsY29tZX4sIHRyeSB0byBhZGQgeW91ciBmaXJzdCB0by1kbyBsaXN0IDogKSc7XG5cbiAgICBzZW50ZW5jZUhhbmRsZXIodGV4dCk7XG4gIH1cblxuICBmdW5jdGlvbiBfc2hvd0FsbChkYXRhQXJyKSB7XG4gICAgdmFyIHJlc3VsdCA9IF9jbGFzc2lmeURhdGEoZGF0YUFycik7XG5cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmFwcGVuZENoaWxkKHJlc3VsdCk7IC8vIGFkZCBpdCB0byBET01cbiAgfVxuXG4gIGZ1bmN0aW9uIF9jbGFzc2lmeURhdGEoZGF0YUFycikge1xuICAgIC8vIFBVTkNITElORTogdXNlIGZyYWdtZW50IHRvIHJlZHVjZSBET00gb3BlcmF0ZVxuICAgIHZhciB1bmZpc2hpZWQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIGZpbmlzaGVkID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIHZhciBtaXggPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cbiAgICAvLyBwdXQgdGhlIGZpbmlzaGVkIGl0ZW0gdG8gdGhlIGJvdHRvbVxuICAgIGRhdGFBcnIuZm9yRWFjaChmdW5jdGlvbiBjbGFzc2lmeShkYXRhKSB7XG4gICAgICBpZiAoZGF0YS5maW5pc2hlZCkge1xuICAgICAgICBmaW5pc2hlZC5pbnNlcnRCZWZvcmUobGlHZW5lcmF0b3IoZGF0YSksIGZpbmlzaGVkLmZpcnN0Q2hpbGQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdW5maXNoaWVkLmluc2VydEJlZm9yZShsaUdlbmVyYXRvcihkYXRhKSwgdW5maXNoaWVkLmZpcnN0Q2hpbGQpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIG1peC5hcHBlbmRDaGlsZCh1bmZpc2hpZWQpO1xuICAgIG1peC5hcHBlbmRDaGlsZChmaW5pc2hlZCk7XG5cbiAgICByZXR1cm4gbWl4O1xuICB9XG5cbiAgZnVuY3Rpb24gYWxsKHJhbmRvbUFwaG9yaXNtLCBkYXRhQXJyKSB7XG4gICAgX3Nob3cocmFuZG9tQXBob3Jpc20sIF9zaG93QWxsLCBkYXRhQXJyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnQocmFuZG9tQXBob3Jpc20sIGRhdGFBcnIpIHtcbiAgICBfc2hvdyhyYW5kb21BcGhvcmlzbSwgX3Nob3dwYXJ0LCBkYXRhQXJyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zaG93cGFydChkYXRhQXJyKSB7XG4gICAgdmFyIG5vZGVzID0gZGF0YUFyci5yZWR1Y2UoZnVuY3Rpb24gbm9kZUdlbmVyYXRvcihyZXN1bHQsIGRhdGEpIHtcbiAgICAgIHJlc3VsdC5pbnNlcnRCZWZvcmUobGlHZW5lcmF0b3IoZGF0YSksIHJlc3VsdC5maXJzdENoaWxkKTtcblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LCBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCkpOyAvLyBQVU5DSExJTkU6IGJyaWxsaWFudCBhcnIucmVkdWNlKCkgKyBkb2N1bWVudEZyYWdtZW50XG5cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmFwcGVuZENoaWxkKG5vZGVzKTsgLy8gYWRkIGl0IHRvIERPTVxuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgY2xlYXJDaGlsZE5vZGVzKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2VudGVuY2VIYW5kbGVyKHRleHQpIHtcbiAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgIHZhciB0ZXh0Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQpO1xuXG4gICAgbGkuYXBwZW5kQ2hpbGQodGV4dE5vZGUpO1xuICAgIGxpLmNsYXNzTmFtZSA9ICdhcGhvcmlzbSc7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5hcHBlbmRDaGlsZChsaSk7XG4gIH1cblxuXG4gIHJldHVybiB7XG4gICAgaW5pdDogaW5pdCxcbiAgICBhbGw6IGFsbCxcbiAgICBwYXJ0OiBwYXJ0LFxuICAgIGNsZWFyOiBjbGVhcixcbiAgICBzZW50ZW5jZUhhbmRsZXI6IHNlbnRlbmNlSGFuZGxlclxuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBnZW5lcmFsO1xuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gcmVmcmVzaEdlbmVyYXRvcigpIHtcbiAgdmFyIGRiU3VjY2VzcyA9IHJlcXVpcmUoJy4vZGJTdWNjZXNzLmpzJyk7XG4gIHZhciBkYkZhaWwgPSByZXF1aXJlKCcuL2RiRmFpbC5qcycpO1xuXG4gIHJldHVybiB7XG4gICAgZGJTdWNjZXNzOiBkYlN1Y2Nlc3MsXG4gICAgZGJGYWlsOiBkYkZhaWxcbiAgfTtcbn0oKSk7XG4iXX0=
