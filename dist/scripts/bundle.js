(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
// use module pattern
var indexedDBHandler = (function indexedDBHandler() {
  // 5 private property
  var _db;
  var _storeName;
  var _configKey;
  var _presentKey;
  var _initialJSONData;
  var _initialJSONDataUseful;
  var _initialJSONDataLen;

  // init indexedDB
  function init(config, successCallback) {
    // firstly inspect browser's support for indexedDB
    if (!window.indexedDB) {
      window.alert('Your browser doesn\'t support a stable version of IndexedDB. Such and such feature will not be available.');

      return 0;
    }
    _openDB(config, successCallback);

    return 0;
  }

  function _openDB(config, successCallback) {
    var request = indexedDB.open(config.name, config.version); // open indexedDB

    // OK
    _storeName = config.storeName; // storage storeName
    _configKey = config.key;
    _initialJSONData = _getJSONData(config.initialData);
    _initialJSONDataLen = _getinitialJSONDataLen(_initialJSONData);
    _initialJSONDataUseful = config.initialJSONDataUseful;

    request.onerror = function _openDBError() {
      console.log('Pity, fail to load indexedDB');
    };
    request.onsuccess = function _openDBSuccess(e) {
      _db = e.target.result;
      _db.onerror = function errorHandler(e) {
        // Generic error handler for all errors targeted at this database's requests
        window.alert('Database error: ' + e.target.errorCode);
      };
      successCallback();
      _getPresentKey();
    };

    // When you create a new database or increase the version number of an existing database
    request.onupgradeneeded = function schemaUp(e) {
      var i;
      var store;
      var initialJSONData;
      console.log(_initialJSONData);
      console.log(_initialJSONDataLen);
      _db = e.target.result;
      console.log('scheme up');
      if (!(_db.objectStoreNames.contains(_storeName))) {
        store = _db.createObjectStore(_storeName, { keyPath: _configKey, autoIncrement: true });
        console.log(initialJSONData);
        console.log(_initialJSONDataLen);
        if (initialJSONData) {
          for (i = 0; i < _initialJSONDataLen; i++) {
            store.add(initialJSONData[i]);
            console.log(initialJSONData[i]);
          }
          _presentKey = _presentKey + _initialJSONDataLen - 1;
          console.log(_presentKey);
          _getPresentKey();
        }
      }
    };
  }

  function _getJSONData(rawData) {
    var result;

    try {
      // OK
      result = JSON.parse(JSON.stringify(rawData));
    } catch (error) {
      window.alert('Please set correct JSON type :>');
      result = false;
    } finally {
      return result;
    }
  }

  function _getinitialJSONDataLen(JSONData) {
    if (JSONData) {
      if (JSONData.length) {
        return JSONData.length;
      }
      return 1;
    }
    return 0;
  }

  // set present key value to _presentKey (the private property) 
  function _getPresentKey() {
    var storeHander = _transactionGenerator(true);
    var range = IDBKeyRange.lowerBound(0);

    storeHander.openCursor(range, 'next').onsuccess = function _getPresentKeyHandler(e) {
      var cursor = e.target.result;

      if (cursor) {
        cursor.continue();
        _presentKey = cursor.value.id;
      } else {
        if (!_presentKey) {
          _presentKey = 0;
        }
        console.log('now key is:' +  _presentKey); // initial value is 0
      }
    };
  }

  /* CRUD */

  // use closure to keep _presentKey, you will need it in add
  function getNewKey() {
    _presentKey += 1;

    return _presentKey;
  }

  function addItem(newData, successCallback, successCallbackArrayParameter) {
    var storeHander = _transactionGenerator(true);
    var addOpt = storeHander.add(newData);

    addOpt.onsuccess = function success() {
      console.log('Bravo, success to add one data to indexedDB');
      if (successCallback) { // if has callback been input, execute it 
        _successCallbackHandler(successCallback, newData, successCallbackArrayParameter);
      }
    };
  }

  function getItem(key, successCallback, successCallbackArrayParameter) {
    var storeHander = _transactionGenerator(false);
    var getDataKey = storeHander.get(key);  // get it by index

    getDataKey.onsuccess = function getDataSuccess() {
      console.log('Great, get (key:' + key + '\')s data succeed');
      _successCallbackHandler(successCallback, getDataKey.result, successCallbackArrayParameter);
    };
  }

  // retrieve eligible data (boolean condition)
  function getConditionItem(condition, whether, successCallback, successCallbackArrayParameter) {
    var storeHander = _transactionGenerator(true);
    var range = _rangeGenerator();
    var result = []; // use an array to storage eligible data

    storeHander.openCursor(range, 'next').onsuccess = function getConditionItemHandler(e) {
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
      } else {
        _successCallbackHandler(successCallback, result, successCallbackArrayParameter);
      }
    };
  }

  function getAll(successCallback, successCallbackArrayParameter) {
    var storeHander = _transactionGenerator(true);
    var range = _rangeGenerator();
    var result = [];

    storeHander.openCursor(range, 'next').onsuccess = function getAllHandler(e) {
      var cursor = e.target.result;

      if (cursor) {
        result.push(cursor.value);
        cursor.continue();
      } else {
        _successCallbackHandler(successCallback, result, successCallbackArrayParameter);
      }
    };
  }

  // update one
  function updateItem(newData, successCallback, successCallbackArrayParameter) {
    // #TODO: update part
    var storeHander = _transactionGenerator(true);
    var putStore = storeHander.put(newData);

    putStore.onsuccess = function updateSuccess() {
      console.log('Aha, modify succeed');
      if (successCallback) {
        _successCallbackHandler(successCallback, newData, successCallbackArrayParameter);
      }
    };
  }

  function deleteOne(key, successCallback, successCallbackArrayParameter) {
    var storeHander = _transactionGenerator(true);
    var deleteOpt = storeHander.delete(key);

    deleteOpt.onsuccess = function deleteSuccess() {
      console.log('delete (key: ' + key +  '\')s value succeed');
      if (successCallback) {
        _successCallbackHandler(successCallback, key, successCallbackArrayParameter);
      }
    };
  }

  function clear(successCallback, successCallbackArrayParameter) {
    var storeHander = _transactionGenerator(true);
    var range = _rangeGenerator();

    storeHander.openCursor(range, 'next').onsuccess = function clearHandler(e) {
      var cursor = e.target.result;
      var requestDel;

      if (cursor) {
        requestDel = cursor.delete();
        requestDel.onsuccess = function success() {
        };
        cursor.continue();
      } else if (successCallback) {
        _successCallbackHandler(successCallback, 'all data', successCallbackArrayParameter);
      }
    };
  }

  /* 3 private methods */

  function _transactionGenerator(whetherWrite) {
    var transaction;

    if (whetherWrite) {
      transaction = _db.transaction([_storeName], 'readwrite');
    } else {
      transaction = _db.transaction([_storeName]);
    }

    return transaction.objectStore(_storeName);
  }

  function _rangeGenerator() {
    if (_initialJSONDataUseful) {
      return IDBKeyRange.lowerBound(0);
    }
    // #FIXME: 
    // console.log(_initialJSONDataLen);
    return IDBKeyRange.lowerBound(1 - 1, true);
  }

  function _successCallbackHandler(successCallback, result, successCallbackArrayParameter) {
    if (successCallbackArrayParameter) {
      successCallbackArrayParameter.unshift(result);
      successCallback.apply(null, successCallbackArrayParameter);
    } else {
      successCallback(result);
    }
  }

  /* public interface */
  return {
    init: init,
    getNewKey: getNewKey,
    addItem: addItem,
    getItem: getItem,
    getConditionItem: getConditionItem,
    getAll: getAll,
    updateItem: updateItem,
    removeItem: deleteOne,
    clear: clear
  };
}());

module.exports = indexedDBHandler;

},{}],2:[function(require,module,exports){
'use strict';
module.exports = (function dbConfigGenerator() {
  var dbConfig = {
    name: 'JustToDo',
    version: '11',
    key: 'id',
    storeName: 'list',
    initialData: [{
      id: 0,
      event: 0,
      finished: true,
      date: 0
    },
    {
      id: 1,
      event: 1,
      finished: true,
      date: 0
    }],
    initialDataUseful: false
  };

  return dbConfig;
}());

},{}],3:[function(require,module,exports){
'use strict';
(function init() {
  var DB = require('indexeddb-crud');
  var dbConfig = require('./db/listConfig');
  var addEvents = require('./utlis/addEvents.js');

  // open DB, and when DB open succeed, invoke initial function
  DB.init(dbConfig, addEvents);
}());

},{"./db/listConfig":2,"./utlis/addEvents.js":4,"indexeddb-crud":1}],4:[function(require,module,exports){
module.exports = (function addEventsGenerator() {
  var handler = require('./eventHandler');

  return function addEvents() {
    var list;

    handler.showInit(); // init show
    // add all eventListener
    list = document.querySelector('#list');
    list.addEventListener('click', handler.clickLi, false);
    list.addEventListener('click', handler.deleteLi, false);
    document.addEventListener('keydown', handler.enter, false);
    document.querySelector('#add').addEventListener('click', handler.add, false);
    document.querySelector('#showDone').addEventListener('click', handler.showDone, false);
    document.querySelector('#showTodo').addEventListener('click', handler.showTodo, false);
    document.querySelector('#showAll').addEventListener('click', handler.showAll, false);
    document.querySelector('#showClear').addEventListener('click', handler.showClear, false);
  };
}());

},{"./eventHandler":6}],5:[function(require,module,exports){
var createNode = (function nodeGenerator() {
  /* private methods */
  function _decorateLi(li, data) {
    var textDate = document.createTextNode(data.userDate + ': ');
    var textWrap = document.createElement('span');
    var text = document.createTextNode(' ' + data.event);

    // wrap as a node
    textWrap.appendChild(text);
    li.appendChild(textDate);
    li.appendChild(textWrap);
    if (data.finished) {  // add css-style to it (according to it's data.finished value)
      li.classList.add('checked'); // add style
    }
    _addX(li, data.id); // add span [x] to li's tail
    _setDataProperty(li, 'data-id', data.id); // add property to li (data-id)，for  clickLi
  }

  function _addX(li, id) {
    var span = document.createElement('span');
    var x = document.createTextNode('\u00D7'); // unicode -> x

    span.appendChild(x);
    span.className = 'close'; // add style
    _setDataProperty(span, 'data-x', id); // add property to span (data-x), for deleteLi
    li.appendChild(span);
  }

  function _setDataProperty(target, name, data) {
    target.setAttribute(name, data);
  }


  /* interface */
  return function create(data) {
    var li = document.createElement('li');

    _decorateLi(li, data); // decorate li

    return li;
  };
}());

module.exports = createNode;

},{}],6:[function(require,module,exports){
'use strict';
var eventHandler = (function handlerGenerator() {
  var DB = require('indexeddb-crud');
  var refresh = require('./refresh.js');
  var createNode = require('./createNode');

  function add() {
    var inputValue = document.querySelector('#input').value;
    var list;
    var newData;
    var newNode;

    if (inputValue === '') {
      alert('please input a real data~');
      return 0;
    }
    _ifEmpty();
    newData = _integrateNewData(inputValue);
    newNode = createNode(newData);
    list = document.querySelector('#list');
    list.insertBefore(newNode, list.firstChild); // push newNode to first
    document.querySelector('#input').value = '';  // reset input's values
    DB.addItem(newData);

    return 0;
  }

  function enterAdd(e) {
    if (e.keyCode === 13) {
      add();
    }
  }

  // li's [x]'s delete
  function deleteLi(e) {
    var id;

    if (e.target.className === 'close') { // use event delegation
      // use previously stored data
      refresh.disappear(e.target.parentNode);
      id = parseInt(e.target.getAttribute('data-x'), 10);
      DB.removeItem(id, showAll);
    }
  }

  function showInit() {
    refresh.clear();
    DB.getAll(refresh.init);
  }

  function showAll() {
    refresh.clear();
    DB.getAll(refresh.all);
  }

  function showClear() {
    refresh.clear(); // clear nodes visually
    refresh.random();
    DB.clear(); // clear data indeed
  }

  function showDone() {
    _showWhetherDone(true);
  }

  function showTodo() {
    _showWhetherDone(false);
  }

  function clickLi(e) {
    var id;
    var targetLi = e.target;
    // use event delegation

    if (targetLi.getAttribute('data-id')) {
      id = parseInt(targetLi.getAttribute('data-id'), 10); // use previously stored data-id attribute
      DB.getItem(id, _switchLi, [targetLi]); // pass _switchLi and param [e.target] as callback
    }
  }


  /* private methods */
  function _ifEmpty() {
    var list = document.querySelector('#list');

    if (list.firstChild.className === 'aphorism') {
      list.removeChild(list.firstChild);
    }
  }

  function _integrateNewData(value) {
    return {
      id: DB.getNewKey(),
      event: value,
      finished: false,
      userDate: _getNewDate('yyyy年MM月dd日 hh:mm')
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

  function _showWhetherDone(whether) {
    var condition = 'finished'; // set 'finished' as condition

    refresh.clear();
    DB.getConditionItem(condition, whether, refresh.part); // pass refresh as callback function
  }

  function _switchLi(data, targetLi) {
    targetLi.finished = !data.finished;
    if (targetLi.finished) {
      targetLi.classList.add('checked');
    } else {
      targetLi.classList.remove('checked');
    }
    data.finished = !data.finished;  // toggle data.finished
    DB.updateItem(data, showAll);
  }

  /* interface */
  return {
    add: add,
    enter: enterAdd,
    deleteLi: deleteLi,
    showInit: showInit,
    showAll: showAll,
    showClear: showClear,
    showDone: showDone,
    showTodo: showTodo,
    clickLi: clickLi
  };
}());

module.exports = eventHandler;

},{"./createNode":5,"./refresh.js":7,"indexeddb-crud":1}],7:[function(require,module,exports){
'use strict';
var refresh = (function refreshGenerator() {
  var createNode = require('./createNode.js');

  function init(dataArr) {
    _show(dataArr, _initSentence);
  }

  function all(dataArr) {
    _show(dataArr, randomAphorism);
  }

  function part(dataArr) {
    if (dataArr.length === 0) {
      randomAphorism();
    } else {
      var nodes = dataArr.reduce(function nodeGenerator(result, data) {
        result.insertBefore(createNode(data), result.firstChild);

        return result;
      }, document.createDocumentFragment()); // brilliant arr.reduce() + documentFragment

      document.querySelector('#list').appendChild(nodes); // add it to DOM
    }
  }

  function disappear(element) {
    element.style.display = 'none';
  }

  function clear() {
    var root = document.querySelector('#list');

    while (root.hasChildNodes()) {
      root.removeChild(root.firstChild); // the best way to clean childNodes
    }
  }

  function randomAphorism() {
    var aphorisms = [
      'Yesterday You Said Tomorrow',
      'Why are we here?',
      'All in, or nothing',
      'You Never Try, You Never Know',
      'The unexamined life is not worth living. -- Socrates'
    ];
    var randomIndex = Math.floor(Math.random() * aphorisms.length);
    var text = document.createTextNode(aphorisms[randomIndex]);

    _sentenceGenerator(text);
  }


  /* private methods */

  function _show(dataArr, sentenceFunc) {
    if (dataArr.length === 0) {
      sentenceFunc();
    } else {
      _showRefresh(dataArr);
    }
  }

  function _showRefresh(dataArr) {
    var result = _classifyData(dataArr);

    document.querySelector('#list').appendChild(result); // add it to DOM
  }

  function _classifyData(dataArr) {
    // use fragment to reduce DOM operate
    var unfishied = document.createDocumentFragment();
    var finished = document.createDocumentFragment();
    var fusion = document.createDocumentFragment();

    // put the finished item to the bottom
    dataArr.forEach(function classify(data) {
      if (data.finished) {
        finished.insertBefore(createNode(data), finished.firstChild);
      } else {
        unfishied.insertBefore(createNode(data), unfishied.firstChild);
      }
    });
    fusion.appendChild(unfishied);
    fusion.appendChild(finished);

    return fusion;
  }

  function _initSentence() {
    var text = document.createTextNode('Welcome~, try to add your first to-do list : )');

    _sentenceGenerator(text);
  }

  function _sentenceGenerator(text) {
    var li = document.createElement('li');

    li.appendChild(text);
    li.className = 'aphorism';
    document.querySelector('#list').appendChild(li);
  }


  /* interface */
  return {
    init: init,
    all: all,
    part: part,
    clear: clear,
    disappear: disappear,
    random: randomAphorism
  };
}());

module.exports = refresh;

},{"./createNode.js":5}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5kZXhlZGRiLWNydWQvaW5kZXguanMiLCJzcmMvc2NyaXB0cy9kYi9saXN0Q29uZmlnLmpzIiwic3JjL3NjcmlwdHMvbWFpbi5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2FkZEV2ZW50cy5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2NyZWF0ZU5vZGUuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9ldmVudEhhbmRsZXIuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9yZWZyZXNoLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0Jztcbi8vIHVzZSBtb2R1bGUgcGF0dGVyblxudmFyIGluZGV4ZWREQkhhbmRsZXIgPSAoZnVuY3Rpb24gaW5kZXhlZERCSGFuZGxlcigpIHtcbiAgLy8gNSBwcml2YXRlIHByb3BlcnR5XG4gIHZhciBfZGI7XG4gIHZhciBfc3RvcmVOYW1lO1xuICB2YXIgX2NvbmZpZ0tleTtcbiAgdmFyIF9wcmVzZW50S2V5O1xuICB2YXIgX2luaXRpYWxKU09ORGF0YTtcbiAgdmFyIF9pbml0aWFsSlNPTkRhdGFVc2VmdWw7XG4gIHZhciBfaW5pdGlhbEpTT05EYXRhTGVuO1xuXG4gIC8vIGluaXQgaW5kZXhlZERCXG4gIGZ1bmN0aW9uIGluaXQoY29uZmlnLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAvLyBmaXJzdGx5IGluc3BlY3QgYnJvd3NlcidzIHN1cHBvcnQgZm9yIGluZGV4ZWREQlxuICAgIGlmICghd2luZG93LmluZGV4ZWREQikge1xuICAgICAgd2luZG93LmFsZXJ0KCdZb3VyIGJyb3dzZXIgZG9lc25cXCd0IHN1cHBvcnQgYSBzdGFibGUgdmVyc2lvbiBvZiBJbmRleGVkREIuIFN1Y2ggYW5kIHN1Y2ggZmVhdHVyZSB3aWxsIG5vdCBiZSBhdmFpbGFibGUuJyk7XG5cbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBfb3BlbkRCKGNvbmZpZywgc3VjY2Vzc0NhbGxiYWNrKTtcblxuICAgIHJldHVybiAwO1xuICB9XG5cbiAgZnVuY3Rpb24gX29wZW5EQihjb25maWcsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciByZXF1ZXN0ID0gaW5kZXhlZERCLm9wZW4oY29uZmlnLm5hbWUsIGNvbmZpZy52ZXJzaW9uKTsgLy8gb3BlbiBpbmRleGVkREJcblxuICAgIC8vIE9LXG4gICAgX3N0b3JlTmFtZSA9IGNvbmZpZy5zdG9yZU5hbWU7IC8vIHN0b3JhZ2Ugc3RvcmVOYW1lXG4gICAgX2NvbmZpZ0tleSA9IGNvbmZpZy5rZXk7XG4gICAgX2luaXRpYWxKU09ORGF0YSA9IF9nZXRKU09ORGF0YShjb25maWcuaW5pdGlhbERhdGEpO1xuICAgIF9pbml0aWFsSlNPTkRhdGFMZW4gPSBfZ2V0aW5pdGlhbEpTT05EYXRhTGVuKF9pbml0aWFsSlNPTkRhdGEpO1xuICAgIF9pbml0aWFsSlNPTkRhdGFVc2VmdWwgPSBjb25maWcuaW5pdGlhbEpTT05EYXRhVXNlZnVsO1xuXG4gICAgcmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24gX29wZW5EQkVycm9yKCkge1xuICAgICAgY29uc29sZS5sb2coJ1BpdHksIGZhaWwgdG8gbG9hZCBpbmRleGVkREInKTtcbiAgICB9O1xuICAgIHJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gX29wZW5EQlN1Y2Nlc3MoZSkge1xuICAgICAgX2RiID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgX2RiLm9uZXJyb3IgPSBmdW5jdGlvbiBlcnJvckhhbmRsZXIoZSkge1xuICAgICAgICAvLyBHZW5lcmljIGVycm9yIGhhbmRsZXIgZm9yIGFsbCBlcnJvcnMgdGFyZ2V0ZWQgYXQgdGhpcyBkYXRhYmFzZSdzIHJlcXVlc3RzXG4gICAgICAgIHdpbmRvdy5hbGVydCgnRGF0YWJhc2UgZXJyb3I6ICcgKyBlLnRhcmdldC5lcnJvckNvZGUpO1xuICAgICAgfTtcbiAgICAgIHN1Y2Nlc3NDYWxsYmFjaygpO1xuICAgICAgX2dldFByZXNlbnRLZXkoKTtcbiAgICB9O1xuXG4gICAgLy8gV2hlbiB5b3UgY3JlYXRlIGEgbmV3IGRhdGFiYXNlIG9yIGluY3JlYXNlIHRoZSB2ZXJzaW9uIG51bWJlciBvZiBhbiBleGlzdGluZyBkYXRhYmFzZVxuICAgIHJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24gc2NoZW1hVXAoZSkge1xuICAgICAgdmFyIGk7XG4gICAgICB2YXIgc3RvcmU7XG4gICAgICB2YXIgaW5pdGlhbEpTT05EYXRhO1xuICAgICAgY29uc29sZS5sb2coX2luaXRpYWxKU09ORGF0YSk7XG4gICAgICBjb25zb2xlLmxvZyhfaW5pdGlhbEpTT05EYXRhTGVuKTtcbiAgICAgIF9kYiA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgIGNvbnNvbGUubG9nKCdzY2hlbWUgdXAnKTtcbiAgICAgIGlmICghKF9kYi5vYmplY3RTdG9yZU5hbWVzLmNvbnRhaW5zKF9zdG9yZU5hbWUpKSkge1xuICAgICAgICBzdG9yZSA9IF9kYi5jcmVhdGVPYmplY3RTdG9yZShfc3RvcmVOYW1lLCB7IGtleVBhdGg6IF9jb25maWdLZXksIGF1dG9JbmNyZW1lbnQ6IHRydWUgfSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGluaXRpYWxKU09ORGF0YSk7XG4gICAgICAgIGNvbnNvbGUubG9nKF9pbml0aWFsSlNPTkRhdGFMZW4pO1xuICAgICAgICBpZiAoaW5pdGlhbEpTT05EYXRhKSB7XG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IF9pbml0aWFsSlNPTkRhdGFMZW47IGkrKykge1xuICAgICAgICAgICAgc3RvcmUuYWRkKGluaXRpYWxKU09ORGF0YVtpXSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhpbml0aWFsSlNPTkRhdGFbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBfcHJlc2VudEtleSA9IF9wcmVzZW50S2V5ICsgX2luaXRpYWxKU09ORGF0YUxlbiAtIDE7XG4gICAgICAgICAgY29uc29sZS5sb2coX3ByZXNlbnRLZXkpO1xuICAgICAgICAgIF9nZXRQcmVzZW50S2V5KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gX2dldEpTT05EYXRhKHJhd0RhdGEpIHtcbiAgICB2YXIgcmVzdWx0O1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIE9LXG4gICAgICByZXN1bHQgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHJhd0RhdGEpKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgd2luZG93LmFsZXJ0KCdQbGVhc2Ugc2V0IGNvcnJlY3QgSlNPTiB0eXBlIDo+Jyk7XG4gICAgICByZXN1bHQgPSBmYWxzZTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfZ2V0aW5pdGlhbEpTT05EYXRhTGVuKEpTT05EYXRhKSB7XG4gICAgaWYgKEpTT05EYXRhKSB7XG4gICAgICBpZiAoSlNPTkRhdGEubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBKU09ORGF0YS5sZW5ndGg7XG4gICAgICB9XG4gICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICAvLyBzZXQgcHJlc2VudCBrZXkgdmFsdWUgdG8gX3ByZXNlbnRLZXkgKHRoZSBwcml2YXRlIHByb3BlcnR5KSBcbiAgZnVuY3Rpb24gX2dldFByZXNlbnRLZXkoKSB7XG4gICAgdmFyIHN0b3JlSGFuZGVyID0gX3RyYW5zYWN0aW9uR2VuZXJhdG9yKHRydWUpO1xuICAgIHZhciByYW5nZSA9IElEQktleVJhbmdlLmxvd2VyQm91bmQoMCk7XG5cbiAgICBzdG9yZUhhbmRlci5vcGVuQ3Vyc29yKHJhbmdlLCAnbmV4dCcpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIF9nZXRQcmVzZW50S2V5SGFuZGxlcihlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgICBfcHJlc2VudEtleSA9IGN1cnNvci52YWx1ZS5pZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghX3ByZXNlbnRLZXkpIHtcbiAgICAgICAgICBfcHJlc2VudEtleSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coJ25vdyBrZXkgaXM6JyArICBfcHJlc2VudEtleSk7IC8vIGluaXRpYWwgdmFsdWUgaXMgMFxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKiBDUlVEICovXG5cbiAgLy8gdXNlIGNsb3N1cmUgdG8ga2VlcCBfcHJlc2VudEtleSwgeW91IHdpbGwgbmVlZCBpdCBpbiBhZGRcbiAgZnVuY3Rpb24gZ2V0TmV3S2V5KCkge1xuICAgIF9wcmVzZW50S2V5ICs9IDE7XG5cbiAgICByZXR1cm4gX3ByZXNlbnRLZXk7XG4gIH1cblxuICBmdW5jdGlvbiBhZGRJdGVtKG5ld0RhdGEsIHN1Y2Nlc3NDYWxsYmFjaywgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpIHtcbiAgICB2YXIgc3RvcmVIYW5kZXIgPSBfdHJhbnNhY3Rpb25HZW5lcmF0b3IodHJ1ZSk7XG4gICAgdmFyIGFkZE9wdCA9IHN0b3JlSGFuZGVyLmFkZChuZXdEYXRhKTtcblxuICAgIGFkZE9wdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBzdWNjZXNzKCkge1xuICAgICAgY29uc29sZS5sb2coJ0JyYXZvLCBzdWNjZXNzIHRvIGFkZCBvbmUgZGF0YSB0byBpbmRleGVkREInKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHsgLy8gaWYgaGFzIGNhbGxiYWNrIGJlZW4gaW5wdXQsIGV4ZWN1dGUgaXQgXG4gICAgICAgIF9zdWNjZXNzQ2FsbGJhY2tIYW5kbGVyKHN1Y2Nlc3NDYWxsYmFjaywgbmV3RGF0YSwgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBnZXRJdGVtKGtleSwgc3VjY2Vzc0NhbGxiYWNrLCBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlcikge1xuICAgIHZhciBzdG9yZUhhbmRlciA9IF90cmFuc2FjdGlvbkdlbmVyYXRvcihmYWxzZSk7XG4gICAgdmFyIGdldERhdGFLZXkgPSBzdG9yZUhhbmRlci5nZXQoa2V5KTsgIC8vIGdldCBpdCBieSBpbmRleFxuXG4gICAgZ2V0RGF0YUtleS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXREYXRhU3VjY2VzcygpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdHcmVhdCwgZ2V0IChrZXk6JyArIGtleSArICdcXCcpcyBkYXRhIHN1Y2NlZWQnKTtcbiAgICAgIF9zdWNjZXNzQ2FsbGJhY2tIYW5kbGVyKHN1Y2Nlc3NDYWxsYmFjaywgZ2V0RGF0YUtleS5yZXN1bHQsIHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gcmV0cmlldmUgZWxpZ2libGUgZGF0YSAoYm9vbGVhbiBjb25kaXRpb24pXG4gIGZ1bmN0aW9uIGdldENvbmRpdGlvbkl0ZW0oY29uZGl0aW9uLCB3aGV0aGVyLCBzdWNjZXNzQ2FsbGJhY2ssIHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKSB7XG4gICAgdmFyIHN0b3JlSGFuZGVyID0gX3RyYW5zYWN0aW9uR2VuZXJhdG9yKHRydWUpO1xuICAgIHZhciByYW5nZSA9IF9yYW5nZUdlbmVyYXRvcigpO1xuICAgIHZhciByZXN1bHQgPSBbXTsgLy8gdXNlIGFuIGFycmF5IHRvIHN0b3JhZ2UgZWxpZ2libGUgZGF0YVxuXG4gICAgc3RvcmVIYW5kZXIub3BlbkN1cnNvcihyYW5nZSwgJ25leHQnKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRDb25kaXRpb25JdGVtSGFuZGxlcihlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIGlmICh3aGV0aGVyKSB7XG4gICAgICAgICAgaWYgKGN1cnNvci52YWx1ZVtjb25kaXRpb25dKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChjdXJzb3IudmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghd2hldGhlcikge1xuICAgICAgICAgIGlmICghY3Vyc29yLnZhbHVlW2NvbmRpdGlvbl0pIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGN1cnNvci52YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX3N1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoc3VjY2Vzc0NhbGxiYWNrLCByZXN1bHQsIHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0QWxsKHN1Y2Nlc3NDYWxsYmFjaywgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpIHtcbiAgICB2YXIgc3RvcmVIYW5kZXIgPSBfdHJhbnNhY3Rpb25HZW5lcmF0b3IodHJ1ZSk7XG4gICAgdmFyIHJhbmdlID0gX3JhbmdlR2VuZXJhdG9yKCk7XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgc3RvcmVIYW5kZXIub3BlbkN1cnNvcihyYW5nZSwgJ25leHQnKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRBbGxIYW5kbGVyKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goY3Vyc29yLnZhbHVlKTtcbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfc3VjY2Vzc0NhbGxiYWNrSGFuZGxlcihzdWNjZXNzQ2FsbGJhY2ssIHJlc3VsdCwgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyB1cGRhdGUgb25lXG4gIGZ1bmN0aW9uIHVwZGF0ZUl0ZW0obmV3RGF0YSwgc3VjY2Vzc0NhbGxiYWNrLCBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlcikge1xuICAgIC8vICNUT0RPOiB1cGRhdGUgcGFydFxuICAgIHZhciBzdG9yZUhhbmRlciA9IF90cmFuc2FjdGlvbkdlbmVyYXRvcih0cnVlKTtcbiAgICB2YXIgcHV0U3RvcmUgPSBzdG9yZUhhbmRlci5wdXQobmV3RGF0YSk7XG5cbiAgICBwdXRTdG9yZS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiB1cGRhdGVTdWNjZXNzKCkge1xuICAgICAgY29uc29sZS5sb2coJ0FoYSwgbW9kaWZ5IHN1Y2NlZWQnKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgX3N1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoc3VjY2Vzc0NhbGxiYWNrLCBuZXdEYXRhLCBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlcik7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlbGV0ZU9uZShrZXksIHN1Y2Nlc3NDYWxsYmFjaywgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpIHtcbiAgICB2YXIgc3RvcmVIYW5kZXIgPSBfdHJhbnNhY3Rpb25HZW5lcmF0b3IodHJ1ZSk7XG4gICAgdmFyIGRlbGV0ZU9wdCA9IHN0b3JlSGFuZGVyLmRlbGV0ZShrZXkpO1xuXG4gICAgZGVsZXRlT3B0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGRlbGV0ZVN1Y2Nlc3MoKSB7XG4gICAgICBjb25zb2xlLmxvZygnZGVsZXRlIChrZXk6ICcgKyBrZXkgKyAgJ1xcJylzIHZhbHVlIHN1Y2NlZWQnKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgX3N1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoc3VjY2Vzc0NhbGxiYWNrLCBrZXksIHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIoc3VjY2Vzc0NhbGxiYWNrLCBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlcikge1xuICAgIHZhciBzdG9yZUhhbmRlciA9IF90cmFuc2FjdGlvbkdlbmVyYXRvcih0cnVlKTtcbiAgICB2YXIgcmFuZ2UgPSBfcmFuZ2VHZW5lcmF0b3IoKTtcblxuICAgIHN0b3JlSGFuZGVyLm9wZW5DdXJzb3IocmFuZ2UsICduZXh0Jykub25zdWNjZXNzID0gZnVuY3Rpb24gY2xlYXJIYW5kbGVyKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICB2YXIgcmVxdWVzdERlbDtcblxuICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICByZXF1ZXN0RGVsID0gY3Vyc29yLmRlbGV0ZSgpO1xuICAgICAgICByZXF1ZXN0RGVsLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIHN1Y2Nlc3MoKSB7XG4gICAgICAgIH07XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfSBlbHNlIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgX3N1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoc3VjY2Vzc0NhbGxiYWNrLCAnYWxsIGRhdGEnLCBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlcik7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8qIDMgcHJpdmF0ZSBtZXRob2RzICovXG5cbiAgZnVuY3Rpb24gX3RyYW5zYWN0aW9uR2VuZXJhdG9yKHdoZXRoZXJXcml0ZSkge1xuICAgIHZhciB0cmFuc2FjdGlvbjtcblxuICAgIGlmICh3aGV0aGVyV3JpdGUpIHtcbiAgICAgIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtfc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbX3N0b3JlTmFtZV0pO1xuICAgIH1cblxuICAgIHJldHVybiB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShfc3RvcmVOYW1lKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9yYW5nZUdlbmVyYXRvcigpIHtcbiAgICBpZiAoX2luaXRpYWxKU09ORGF0YVVzZWZ1bCkge1xuICAgICAgcmV0dXJuIElEQktleVJhbmdlLmxvd2VyQm91bmQoMCk7XG4gICAgfVxuICAgIC8vICNGSVhNRTogXG4gICAgLy8gY29uc29sZS5sb2coX2luaXRpYWxKU09ORGF0YUxlbik7XG4gICAgcmV0dXJuIElEQktleVJhbmdlLmxvd2VyQm91bmQoMSAtIDEsIHRydWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3N1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoc3VjY2Vzc0NhbGxiYWNrLCByZXN1bHQsIHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKSB7XG4gICAgaWYgKHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKSB7XG4gICAgICBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlci51bnNoaWZ0KHJlc3VsdCk7XG4gICAgICBzdWNjZXNzQ2FsbGJhY2suYXBwbHkobnVsbCwgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdWNjZXNzQ2FsbGJhY2socmVzdWx0KTtcbiAgICB9XG4gIH1cblxuICAvKiBwdWJsaWMgaW50ZXJmYWNlICovXG4gIHJldHVybiB7XG4gICAgaW5pdDogaW5pdCxcbiAgICBnZXROZXdLZXk6IGdldE5ld0tleSxcbiAgICBhZGRJdGVtOiBhZGRJdGVtLFxuICAgIGdldEl0ZW06IGdldEl0ZW0sXG4gICAgZ2V0Q29uZGl0aW9uSXRlbTogZ2V0Q29uZGl0aW9uSXRlbSxcbiAgICBnZXRBbGw6IGdldEFsbCxcbiAgICB1cGRhdGVJdGVtOiB1cGRhdGVJdGVtLFxuICAgIHJlbW92ZUl0ZW06IGRlbGV0ZU9uZSxcbiAgICBjbGVhcjogY2xlYXJcbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gaW5kZXhlZERCSGFuZGxlcjtcbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uIGRiQ29uZmlnR2VuZXJhdG9yKCkge1xuICB2YXIgZGJDb25maWcgPSB7XG4gICAgbmFtZTogJ0p1c3RUb0RvJyxcbiAgICB2ZXJzaW9uOiAnMTEnLFxuICAgIGtleTogJ2lkJyxcbiAgICBzdG9yZU5hbWU6ICdsaXN0JyxcbiAgICBpbml0aWFsRGF0YTogW3tcbiAgICAgIGlkOiAwLFxuICAgICAgZXZlbnQ6IDAsXG4gICAgICBmaW5pc2hlZDogdHJ1ZSxcbiAgICAgIGRhdGU6IDBcbiAgICB9LFxuICAgIHtcbiAgICAgIGlkOiAxLFxuICAgICAgZXZlbnQ6IDEsXG4gICAgICBmaW5pc2hlZDogdHJ1ZSxcbiAgICAgIGRhdGU6IDBcbiAgICB9XSxcbiAgICBpbml0aWFsRGF0YVVzZWZ1bDogZmFsc2VcbiAgfTtcblxuICByZXR1cm4gZGJDb25maWc7XG59KCkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuKGZ1bmN0aW9uIGluaXQoKSB7XG4gIHZhciBEQiA9IHJlcXVpcmUoJ2luZGV4ZWRkYi1jcnVkJyk7XG4gIHZhciBkYkNvbmZpZyA9IHJlcXVpcmUoJy4vZGIvbGlzdENvbmZpZycpO1xuICB2YXIgYWRkRXZlbnRzID0gcmVxdWlyZSgnLi91dGxpcy9hZGRFdmVudHMuanMnKTtcblxuICAvLyBvcGVuIERCLCBhbmQgd2hlbiBEQiBvcGVuIHN1Y2NlZWQsIGludm9rZSBpbml0aWFsIGZ1bmN0aW9uXG4gIERCLmluaXQoZGJDb25maWcsIGFkZEV2ZW50cyk7XG59KCkpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gYWRkRXZlbnRzR2VuZXJhdG9yKCkge1xuICB2YXIgaGFuZGxlciA9IHJlcXVpcmUoJy4vZXZlbnRIYW5kbGVyJyk7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGFkZEV2ZW50cygpIHtcbiAgICB2YXIgbGlzdDtcblxuICAgIGhhbmRsZXIuc2hvd0luaXQoKTsgLy8gaW5pdCBzaG93XG4gICAgLy8gYWRkIGFsbCBldmVudExpc3RlbmVyXG4gICAgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgbGlzdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuY2xpY2tMaSwgZmFsc2UpO1xuICAgIGxpc3QuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLmRlbGV0ZUxpLCBmYWxzZSk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZXIuZW50ZXIsIGZhbHNlKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWRkJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLmFkZCwgZmFsc2UpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93RG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93RG9uZSwgZmFsc2UpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93VG9kbycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93VG9kbywgZmFsc2UpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93QWxsJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dBbGwsIGZhbHNlKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0NsZWFyJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dDbGVhciwgZmFsc2UpO1xuICB9O1xufSgpKTtcbiIsInZhciBjcmVhdGVOb2RlID0gKGZ1bmN0aW9uIG5vZGVHZW5lcmF0b3IoKSB7XG4gIC8qIHByaXZhdGUgbWV0aG9kcyAqL1xuICBmdW5jdGlvbiBfZGVjb3JhdGVMaShsaSwgZGF0YSkge1xuICAgIHZhciB0ZXh0RGF0ZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGEudXNlckRhdGUgKyAnOiAnKTtcbiAgICB2YXIgdGV4dFdyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnICcgKyBkYXRhLmV2ZW50KTtcblxuICAgIC8vIHdyYXAgYXMgYSBub2RlXG4gICAgdGV4dFdyYXAuYXBwZW5kQ2hpbGQodGV4dCk7XG4gICAgbGkuYXBwZW5kQ2hpbGQodGV4dERhdGUpO1xuICAgIGxpLmFwcGVuZENoaWxkKHRleHRXcmFwKTtcbiAgICBpZiAoZGF0YS5maW5pc2hlZCkgeyAgLy8gYWRkIGNzcy1zdHlsZSB0byBpdCAoYWNjb3JkaW5nIHRvIGl0J3MgZGF0YS5maW5pc2hlZCB2YWx1ZSlcbiAgICAgIGxpLmNsYXNzTGlzdC5hZGQoJ2NoZWNrZWQnKTsgLy8gYWRkIHN0eWxlXG4gICAgfVxuICAgIF9hZGRYKGxpLCBkYXRhLmlkKTsgLy8gYWRkIHNwYW4gW3hdIHRvIGxpJ3MgdGFpbFxuICAgIF9zZXREYXRhUHJvcGVydHkobGksICdkYXRhLWlkJywgZGF0YS5pZCk7IC8vIGFkZCBwcm9wZXJ0eSB0byBsaSAoZGF0YS1pZCnvvIxmb3IgIGNsaWNrTGlcbiAgfVxuXG4gIGZ1bmN0aW9uIF9hZGRYKGxpLCBpZCkge1xuICAgIHZhciBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHZhciB4ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJ1xcdTAwRDcnKTsgLy8gdW5pY29kZSAtPiB4XG5cbiAgICBzcGFuLmFwcGVuZENoaWxkKHgpO1xuICAgIHNwYW4uY2xhc3NOYW1lID0gJ2Nsb3NlJzsgLy8gYWRkIHN0eWxlXG4gICAgX3NldERhdGFQcm9wZXJ0eShzcGFuLCAnZGF0YS14JywgaWQpOyAvLyBhZGQgcHJvcGVydHkgdG8gc3BhbiAoZGF0YS14KSwgZm9yIGRlbGV0ZUxpXG4gICAgbGkuYXBwZW5kQ2hpbGQoc3Bhbik7XG4gIH1cblxuICBmdW5jdGlvbiBfc2V0RGF0YVByb3BlcnR5KHRhcmdldCwgbmFtZSwgZGF0YSkge1xuICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUobmFtZSwgZGF0YSk7XG4gIH1cblxuXG4gIC8qIGludGVyZmFjZSAqL1xuICByZXR1cm4gZnVuY3Rpb24gY3JlYXRlKGRhdGEpIHtcbiAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuXG4gICAgX2RlY29yYXRlTGkobGksIGRhdGEpOyAvLyBkZWNvcmF0ZSBsaVxuXG4gICAgcmV0dXJuIGxpO1xuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVOb2RlO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGV2ZW50SGFuZGxlciA9IChmdW5jdGlvbiBoYW5kbGVyR2VuZXJhdG9yKCkge1xuICB2YXIgREIgPSByZXF1aXJlKCdpbmRleGVkZGItY3J1ZCcpO1xuICB2YXIgcmVmcmVzaCA9IHJlcXVpcmUoJy4vcmVmcmVzaC5qcycpO1xuICB2YXIgY3JlYXRlTm9kZSA9IHJlcXVpcmUoJy4vY3JlYXRlTm9kZScpO1xuXG4gIGZ1bmN0aW9uIGFkZCgpIHtcbiAgICB2YXIgaW5wdXRWYWx1ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNpbnB1dCcpLnZhbHVlO1xuICAgIHZhciBsaXN0O1xuICAgIHZhciBuZXdEYXRhO1xuICAgIHZhciBuZXdOb2RlO1xuXG4gICAgaWYgKGlucHV0VmFsdWUgPT09ICcnKSB7XG4gICAgICBhbGVydCgncGxlYXNlIGlucHV0IGEgcmVhbCBkYXRhficpO1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIF9pZkVtcHR5KCk7XG4gICAgbmV3RGF0YSA9IF9pbnRlZ3JhdGVOZXdEYXRhKGlucHV0VmFsdWUpO1xuICAgIG5ld05vZGUgPSBjcmVhdGVOb2RlKG5ld0RhdGEpO1xuICAgIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgIGxpc3QuaW5zZXJ0QmVmb3JlKG5ld05vZGUsIGxpc3QuZmlyc3RDaGlsZCk7IC8vIHB1c2ggbmV3Tm9kZSB0byBmaXJzdFxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNpbnB1dCcpLnZhbHVlID0gJyc7ICAvLyByZXNldCBpbnB1dCdzIHZhbHVlc1xuICAgIERCLmFkZEl0ZW0obmV3RGF0YSk7XG5cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVudGVyQWRkKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgYWRkKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gbGkncyBbeF0ncyBkZWxldGVcbiAgZnVuY3Rpb24gZGVsZXRlTGkoZSkge1xuICAgIHZhciBpZDtcblxuICAgIGlmIChlLnRhcmdldC5jbGFzc05hbWUgPT09ICdjbG9zZScpIHsgLy8gdXNlIGV2ZW50IGRlbGVnYXRpb25cbiAgICAgIC8vIHVzZSBwcmV2aW91c2x5IHN0b3JlZCBkYXRhXG4gICAgICByZWZyZXNoLmRpc2FwcGVhcihlLnRhcmdldC5wYXJlbnROb2RlKTtcbiAgICAgIGlkID0gcGFyc2VJbnQoZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLXgnKSwgMTApO1xuICAgICAgREIucmVtb3ZlSXRlbShpZCwgc2hvd0FsbCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0luaXQoKSB7XG4gICAgcmVmcmVzaC5jbGVhcigpO1xuICAgIERCLmdldEFsbChyZWZyZXNoLmluaXQpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0FsbCgpIHtcbiAgICByZWZyZXNoLmNsZWFyKCk7XG4gICAgREIuZ2V0QWxsKHJlZnJlc2guYWxsKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dDbGVhcigpIHtcbiAgICByZWZyZXNoLmNsZWFyKCk7IC8vIGNsZWFyIG5vZGVzIHZpc3VhbGx5XG4gICAgcmVmcmVzaC5yYW5kb20oKTtcbiAgICBEQi5jbGVhcigpOyAvLyBjbGVhciBkYXRhIGluZGVlZFxuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0RvbmUoKSB7XG4gICAgX3Nob3dXaGV0aGVyRG9uZSh0cnVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dUb2RvKCkge1xuICAgIF9zaG93V2hldGhlckRvbmUoZmFsc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xpY2tMaShlKSB7XG4gICAgdmFyIGlkO1xuICAgIHZhciB0YXJnZXRMaSA9IGUudGFyZ2V0O1xuICAgIC8vIHVzZSBldmVudCBkZWxlZ2F0aW9uXG5cbiAgICBpZiAodGFyZ2V0TGkuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJykpIHtcbiAgICAgIGlkID0gcGFyc2VJbnQodGFyZ2V0TGkuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyksIDEwKTsgLy8gdXNlIHByZXZpb3VzbHkgc3RvcmVkIGRhdGEtaWQgYXR0cmlidXRlXG4gICAgICBEQi5nZXRJdGVtKGlkLCBfc3dpdGNoTGksIFt0YXJnZXRMaV0pOyAvLyBwYXNzIF9zd2l0Y2hMaSBhbmQgcGFyYW0gW2UudGFyZ2V0XSBhcyBjYWxsYmFja1xuICAgIH1cbiAgfVxuXG5cbiAgLyogcHJpdmF0ZSBtZXRob2RzICovXG4gIGZ1bmN0aW9uIF9pZkVtcHR5KCkge1xuICAgIHZhciBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcblxuICAgIGlmIChsaXN0LmZpcnN0Q2hpbGQuY2xhc3NOYW1lID09PSAnYXBob3Jpc20nKSB7XG4gICAgICBsaXN0LnJlbW92ZUNoaWxkKGxpc3QuZmlyc3RDaGlsZCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX2ludGVncmF0ZU5ld0RhdGEodmFsdWUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IERCLmdldE5ld0tleSgpLFxuICAgICAgZXZlbnQ6IHZhbHVlLFxuICAgICAgZmluaXNoZWQ6IGZhbHNlLFxuICAgICAgdXNlckRhdGU6IF9nZXROZXdEYXRlKCd5eXl55bm0TU3mnIhkZOaXpSBoaDptbScpXG4gICAgfTtcbiAgfVxuXG4gIC8vIEZvcm1hdCBkYXRlXG4gIGZ1bmN0aW9uIF9nZXROZXdEYXRlKGZtdCkge1xuICAgIHZhciBuZXdEYXRlID0gbmV3IERhdGUoKTtcbiAgICB2YXIgbmV3Zm10ID0gZm10O1xuICAgIHZhciBvID0ge1xuICAgICAgJ3krJzogbmV3RGF0ZS5nZXRGdWxsWWVhcigpLFxuICAgICAgJ00rJzogbmV3RGF0ZS5nZXRNb250aCgpICsgMSxcbiAgICAgICdkKyc6IG5ld0RhdGUuZ2V0RGF0ZSgpLFxuICAgICAgJ2grJzogbmV3RGF0ZS5nZXRIb3VycygpLFxuICAgICAgJ20rJzogbmV3RGF0ZS5nZXRNaW51dGVzKClcbiAgICB9O1xuICAgIHZhciBsZW5zO1xuXG4gICAgZm9yICh2YXIgayBpbiBvKSB7XG4gICAgICBpZiAobmV3IFJlZ0V4cCgnKCcgKyBrICsgJyknKS50ZXN0KG5ld2ZtdCkpIHtcbiAgICAgICAgaWYgKGsgPT09ICd5KycpIHtcbiAgICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsICgnJyArIG9ba10pLnN1YnN0cig0IC0gUmVnRXhwLiQxLmxlbmd0aCkpO1xuICAgICAgICB9IGVsc2UgaWYgKGsgPT09ICdTKycpIHtcbiAgICAgICAgICBsZW5zID0gUmVnRXhwLiQxLmxlbmd0aDtcbiAgICAgICAgICBsZW5zID0gbGVucyA9PT0gMSA/IDMgOiBsZW5zO1xuICAgICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKCcwMCcgKyBvW2tdKS5zdWJzdHIoKCcnICsgb1trXSkubGVuZ3RoIC0gMSwgbGVucykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKFJlZ0V4cC4kMS5sZW5ndGggPT09IDEpID8gKG9ba10pIDogKCgnMDAnICsgb1trXSkuc3Vic3RyKCgnJyArIG9ba10pLmxlbmd0aCkpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZXdmbXQ7XG4gIH1cblxuICBmdW5jdGlvbiBfc2hvd1doZXRoZXJEb25lKHdoZXRoZXIpIHtcbiAgICB2YXIgY29uZGl0aW9uID0gJ2ZpbmlzaGVkJzsgLy8gc2V0ICdmaW5pc2hlZCcgYXMgY29uZGl0aW9uXG5cbiAgICByZWZyZXNoLmNsZWFyKCk7XG4gICAgREIuZ2V0Q29uZGl0aW9uSXRlbShjb25kaXRpb24sIHdoZXRoZXIsIHJlZnJlc2gucGFydCk7IC8vIHBhc3MgcmVmcmVzaCBhcyBjYWxsYmFjayBmdW5jdGlvblxuICB9XG5cbiAgZnVuY3Rpb24gX3N3aXRjaExpKGRhdGEsIHRhcmdldExpKSB7XG4gICAgdGFyZ2V0TGkuZmluaXNoZWQgPSAhZGF0YS5maW5pc2hlZDtcbiAgICBpZiAodGFyZ2V0TGkuZmluaXNoZWQpIHtcbiAgICAgIHRhcmdldExpLmNsYXNzTGlzdC5hZGQoJ2NoZWNrZWQnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGFyZ2V0TGkuY2xhc3NMaXN0LnJlbW92ZSgnY2hlY2tlZCcpO1xuICAgIH1cbiAgICBkYXRhLmZpbmlzaGVkID0gIWRhdGEuZmluaXNoZWQ7ICAvLyB0b2dnbGUgZGF0YS5maW5pc2hlZFxuICAgIERCLnVwZGF0ZUl0ZW0oZGF0YSwgc2hvd0FsbCk7XG4gIH1cblxuICAvKiBpbnRlcmZhY2UgKi9cbiAgcmV0dXJuIHtcbiAgICBhZGQ6IGFkZCxcbiAgICBlbnRlcjogZW50ZXJBZGQsXG4gICAgZGVsZXRlTGk6IGRlbGV0ZUxpLFxuICAgIHNob3dJbml0OiBzaG93SW5pdCxcbiAgICBzaG93QWxsOiBzaG93QWxsLFxuICAgIHNob3dDbGVhcjogc2hvd0NsZWFyLFxuICAgIHNob3dEb25lOiBzaG93RG9uZSxcbiAgICBzaG93VG9kbzogc2hvd1RvZG8sXG4gICAgY2xpY2tMaTogY2xpY2tMaVxuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBldmVudEhhbmRsZXI7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgcmVmcmVzaCA9IChmdW5jdGlvbiByZWZyZXNoR2VuZXJhdG9yKCkge1xuICB2YXIgY3JlYXRlTm9kZSA9IHJlcXVpcmUoJy4vY3JlYXRlTm9kZS5qcycpO1xuXG4gIGZ1bmN0aW9uIGluaXQoZGF0YUFycikge1xuICAgIF9zaG93KGRhdGFBcnIsIF9pbml0U2VudGVuY2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gYWxsKGRhdGFBcnIpIHtcbiAgICBfc2hvdyhkYXRhQXJyLCByYW5kb21BcGhvcmlzbSk7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJ0KGRhdGFBcnIpIHtcbiAgICBpZiAoZGF0YUFyci5sZW5ndGggPT09IDApIHtcbiAgICAgIHJhbmRvbUFwaG9yaXNtKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBub2RlcyA9IGRhdGFBcnIucmVkdWNlKGZ1bmN0aW9uIG5vZGVHZW5lcmF0b3IocmVzdWx0LCBkYXRhKSB7XG4gICAgICAgIHJlc3VsdC5pbnNlcnRCZWZvcmUoY3JlYXRlTm9kZShkYXRhKSwgcmVzdWx0LmZpcnN0Q2hpbGQpO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9LCBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCkpOyAvLyBicmlsbGlhbnQgYXJyLnJlZHVjZSgpICsgZG9jdW1lbnRGcmFnbWVudFxuXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmFwcGVuZENoaWxkKG5vZGVzKTsgLy8gYWRkIGl0IHRvIERPTVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRpc2FwcGVhcihlbGVtZW50KSB7XG4gICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgdmFyIHJvb3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gICAgd2hpbGUgKHJvb3QuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICByb290LnJlbW92ZUNoaWxkKHJvb3QuZmlyc3RDaGlsZCk7IC8vIHRoZSBiZXN0IHdheSB0byBjbGVhbiBjaGlsZE5vZGVzXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmFuZG9tQXBob3Jpc20oKSB7XG4gICAgdmFyIGFwaG9yaXNtcyA9IFtcbiAgICAgICdZZXN0ZXJkYXkgWW91IFNhaWQgVG9tb3Jyb3cnLFxuICAgICAgJ1doeSBhcmUgd2UgaGVyZT8nLFxuICAgICAgJ0FsbCBpbiwgb3Igbm90aGluZycsXG4gICAgICAnWW91IE5ldmVyIFRyeSwgWW91IE5ldmVyIEtub3cnLFxuICAgICAgJ1RoZSB1bmV4YW1pbmVkIGxpZmUgaXMgbm90IHdvcnRoIGxpdmluZy4gLS0gU29jcmF0ZXMnXG4gICAgXTtcbiAgICB2YXIgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcGhvcmlzbXMubGVuZ3RoKTtcbiAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGFwaG9yaXNtc1tyYW5kb21JbmRleF0pO1xuXG4gICAgX3NlbnRlbmNlR2VuZXJhdG9yKHRleHQpO1xuICB9XG5cblxuICAvKiBwcml2YXRlIG1ldGhvZHMgKi9cblxuICBmdW5jdGlvbiBfc2hvdyhkYXRhQXJyLCBzZW50ZW5jZUZ1bmMpIHtcbiAgICBpZiAoZGF0YUFyci5sZW5ndGggPT09IDApIHtcbiAgICAgIHNlbnRlbmNlRnVuYygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBfc2hvd1JlZnJlc2goZGF0YUFycik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX3Nob3dSZWZyZXNoKGRhdGFBcnIpIHtcbiAgICB2YXIgcmVzdWx0ID0gX2NsYXNzaWZ5RGF0YShkYXRhQXJyKTtcblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuYXBwZW5kQ2hpbGQocmVzdWx0KTsgLy8gYWRkIGl0IHRvIERPTVxuICB9XG5cbiAgZnVuY3Rpb24gX2NsYXNzaWZ5RGF0YShkYXRhQXJyKSB7XG4gICAgLy8gdXNlIGZyYWdtZW50IHRvIHJlZHVjZSBET00gb3BlcmF0ZVxuICAgIHZhciB1bmZpc2hpZWQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIGZpbmlzaGVkID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIHZhciBmdXNpb24gPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cbiAgICAvLyBwdXQgdGhlIGZpbmlzaGVkIGl0ZW0gdG8gdGhlIGJvdHRvbVxuICAgIGRhdGFBcnIuZm9yRWFjaChmdW5jdGlvbiBjbGFzc2lmeShkYXRhKSB7XG4gICAgICBpZiAoZGF0YS5maW5pc2hlZCkge1xuICAgICAgICBmaW5pc2hlZC5pbnNlcnRCZWZvcmUoY3JlYXRlTm9kZShkYXRhKSwgZmluaXNoZWQuZmlyc3RDaGlsZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1bmZpc2hpZWQuaW5zZXJ0QmVmb3JlKGNyZWF0ZU5vZGUoZGF0YSksIHVuZmlzaGllZC5maXJzdENoaWxkKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBmdXNpb24uYXBwZW5kQ2hpbGQodW5maXNoaWVkKTtcbiAgICBmdXNpb24uYXBwZW5kQ2hpbGQoZmluaXNoZWQpO1xuXG4gICAgcmV0dXJuIGZ1c2lvbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9pbml0U2VudGVuY2UoKSB7XG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnV2VsY29tZX4sIHRyeSB0byBhZGQgeW91ciBmaXJzdCB0by1kbyBsaXN0IDogKScpO1xuXG4gICAgX3NlbnRlbmNlR2VuZXJhdG9yKHRleHQpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3NlbnRlbmNlR2VuZXJhdG9yKHRleHQpIHtcbiAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuXG4gICAgbGkuYXBwZW5kQ2hpbGQodGV4dCk7XG4gICAgbGkuY2xhc3NOYW1lID0gJ2FwaG9yaXNtJztcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmFwcGVuZENoaWxkKGxpKTtcbiAgfVxuXG5cbiAgLyogaW50ZXJmYWNlICovXG4gIHJldHVybiB7XG4gICAgaW5pdDogaW5pdCxcbiAgICBhbGw6IGFsbCxcbiAgICBwYXJ0OiBwYXJ0LFxuICAgIGNsZWFyOiBjbGVhcixcbiAgICBkaXNhcHBlYXI6IGRpc2FwcGVhcixcbiAgICByYW5kb206IHJhbmRvbUFwaG9yaXNtXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZnJlc2g7XG4iXX0=
