(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
// use module pattern
var indexedDBHandler = (function indexedDBHandler() {
  // 3 private property
  var _dbResult;
  var _presentKey;
  var _storeName;

  // init indexedDB
  function init(dbConfig, callback) {
    // firstly inspect browser's support for indexedDB
    if (!window.indexedDB) {
      window.alert('Your browser doesn\'t support a stable version of IndexedDB. Such and such feature will not be available.');

      return 0;
    }
    if (callback) {
      _openDB(dbConfig, callback);  // while it's ok, oepn it
    }

    return 0;
  }


  /* 2 private methods */

  function _openDB(dbConfig, callback) {
    var request = indexedDB.open(dbConfig.name, dbConfig.version); // open indexedDB

    _storeName = dbConfig.storeName; // storage storeName
    request.onerror = function _openDBErrorHandler() {
      console.log('Pity, fail to load indexedDB');
    };
    request.onsuccess = function _openDBSuccessHandler(e) {
      _dbResult = e.target.result;
      _getPresentKey(callback);
    };
    // When you create a new database or increase the version number of an existing database 
    // (by specifying a higher version number than you did previously, when Opening a database
    request.onupgradeneeded = function schemaChanged(e) {
      var store;

      _dbResult = e.target.result;
      if (!_dbResult.objectStoreNames.contains(_storeName)) {
        // set dbConfig.key as keyPath
        store = _dbResult.createObjectStore(_storeName, { keyPath: dbConfig.key, autoIncrement: true }); // 创建db
      }
      // add a new db demo
      store.add(dbConfig.dataDemo);
    };
  }

  // set present key value to _presentKey (the private property) 
  function _getPresentKey(callback) {
    var storeHander = _transactionHandler(true);
    var range = IDBKeyRange.lowerBound(0);

    storeHander.openCursor(range, 'next').onsuccess = function _getPresentKeyHandler(e) {
      var cursor = e.target.result;

      if (cursor) {
        cursor.continue();
        _presentKey = cursor.value.id;
      } else {
        console.log('now key is:' +  _presentKey);
        callback();
      }
    };
  }

  /* CRUD */

  // get present id
  // use closure to keep _presentKey, you will need it in add
  function getNewDataKey() {
    _presentKey += 1;

    return _presentKey;
  }

  // Create 

  function add(newData, callback, callbackParaArr) {
    var storeHander = _transactionHandler(true);
    var addOpt = storeHander.add(newData);

    addOpt.onerror = function error() {
      console.log('Pity, failed to add one data to indexedDB');
    };
    addOpt.onsuccess = function success() {
      console.log('Bravo, success to add one data to indexedDB');
      if (callback) { // if has callback been input, execute it 
        _callbackHandler(callback, newData, callbackParaArr);
      }
    };
  }

  // Retrieve

  // retrieve one data
  function get(key, callback, callbackParaArr) {
    var storeHander = _transactionHandler(false);
    var getDataKey = storeHander.get(key);  // get it by index

    getDataKey.onerror = function getDataErrorHandler() {
      console.log('Pity, get (key:' + key + '\')s data' + ' faild');
    };
    getDataKey.onsuccess = function getDataSuccessHandler() {
      console.log('Great, get (key:' + key + '\')s data succeed');
      _callbackHandler(callback, getDataKey.result, callbackParaArr);
    };
  }

  // retrieve eligible data (boolean condition)
  function getWhether(whether, condition, callback, callbackParaArr) {
    var storeHander = _transactionHandler(true);
    var range = _rangeToAll();
    var result = []; // use an array to storage eligible data

    storeHander.openCursor(range, 'next').onsuccess = function getWhetherHandler(e) {
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
        _callbackHandler(callback, result, callbackParaArr);
      }
    };
  }

  // retrieve all
  function getAll(callback, callbackParaArr) {
    var storeHander = _transactionHandler(true);
    var range = _rangeToAll();
    var result = [];

    storeHander.openCursor(range, 'next').onsuccess = function getAllHandler(e) {
      var cursor = e.target.result;

      if (cursor) {
        result.push(cursor.value);
        cursor.continue();
      } else {
        _callbackHandler(callback, result, callbackParaArr);
      }
    };
  }

  // Update one
  function update(newData, callback, callbackParaArr) {
    var storeHander = _transactionHandler(true);
    var putStore = storeHander.put(newData);

    putStore.onerror = function updateErrorHandler() {
      console.log('Pity, modify failed');
    };
    putStore.onsuccess = function updateSuccessHandler() {
      console.log('Aha, modify succeed');
      if (callback) {
        _callbackHandler(callback, newData, callbackParaArr);
      }
    };
  }

  // Delete 

  // delete one
  function deleteOne(key, callback, callbackParaArr) {
    var storeHander = _transactionHandler(true);
    var deleteOpt = storeHander.delete(key); // 将当前选中li的数据从数据库中删除

    deleteOpt.onerror = function deleteErrorHandler() {
      console.log('delete (key:' + key + '\')s value faild');
    };
    deleteOpt.onsuccess = function deleteSuccessHandler() {
      console.log('delete (key: ' + key +  '\')s value succeed');
      if (callback) {
        _callbackHandler(callback, key, callbackParaArr);
      }
    };
  }

  // clear
  function clear(callback, callbackParaArr) {
    var storeHander = _transactionHandler(true);
    var range = _rangeToAll();

    storeHander.openCursor(range, 'next').onsuccess = function clearHandler(e) {
      var cursor = e.target.result;
      var requestDel;

      if (cursor) {
        requestDel = cursor.delete();
        requestDel.onsuccess = function success() {
        };
        requestDel.onerror = function error() {
          console.log('Pity, delete all data faild');
        };
        cursor.continue();
      } else if (callback) {
        _callbackHandler(callback, 'all data', callbackParaArr);
      }
    };
  }

  /* 3 private methods */

  function _transactionHandler(whetherWrite) {
    var transaction;

    if (whetherWrite) {
      transaction = _dbResult.transaction([_storeName], 'readwrite');
    } else {
      transaction = _dbResult.transaction([_storeName]);
    }

    return transaction.objectStore(_storeName);
  }

  function _rangeToAll() {
    return IDBKeyRange.lowerBound(0, true);
  }

  function _callbackHandler(callback, result, callbackParaArr) {
    if (callbackParaArr) {
      callbackParaArr.unshift(result);
      callback.apply(null, callbackParaArr);
    } else {
      callback(result);
    }
  }

  /* public interface */
  return {
    init: init,
    getNewDataKey: getNewDataKey,
    add: add,
    get: get,
    getWhether: getWhether,
    getAll: getAll,
    update: update,
    delete: deleteOne,
    clear: clear
  };
}());

module.exports = indexedDBHandler;

},{}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
'use strict';
module.exports = (function dbConfigGenerator() {
  var dbConfig = {
    name: 'justToDo',
    version: '6',
    key: 'id',
    storeName: 'user'
  };
  dbConfig.dataDemo = {
    id: 0,
    event: 0,
    finished: true,
    date: 0
  };

  return dbConfig;
}());

},{}],4:[function(require,module,exports){
'use strict';
var eventHandler = (function handlerGenerator() {
  var DB = require('indexeddb-crud');
  var show = require('./show.js');
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
    DB.add(newData);

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
      id = parseInt(e.target.getAttribute('data-x'), 10); // #TODO: Does parentNode can do this?
      DB.delete(id, showAll); // delete in DB and show list again
    }
  }

  function showInit() {
    show.clear();
    DB.getAll(show.init);
  }

  function showAll() {
    show.clear();
    DB.getAll(show.all);
  }

  function showClear() {
    show.clear(); // clear nodes visually
    show.random();
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
      DB.get(id, _switchLi, [targetLi]); // pass _switchLi and param [e.target] as callback
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
      id: DB.getNewDataKey(),
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

    show.clear();
    DB.getWhether(whether, condition, show.part); // pass refresh as callback function
  }

  function _switchLi(data, targetLi) {
    targetLi.finished = !data.finished;
    if (targetLi.finished) {
      targetLi.classList.add('checked');
    } else {
      targetLi.classList.remove('checked');
    }
    data.finished = targetLi.finished;  // toggle data.finished
    DB.update(data, showAll);
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

},{"./createNode":2,"./show.js":6,"indexeddb-crud":1}],5:[function(require,module,exports){
'use strict';
(function init() {
  var DB = require('indexeddb-crud');
  var dbConfig = require('./dbConfig.js');
  var handler = require('./eventHandler.js');

  // open DB, and when DB open succeed, invoke initial function
  DB.init(dbConfig, addEventListeners);

  // when db is opened succeed, add EventListeners
  function addEventListeners() {
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
    document.querySelector('#showAll').addEventListener('click', handler.show, false);
    document.querySelector('#showClear').addEventListener('click', handler.showClear, false);
  }
}());

},{"./dbConfig.js":3,"./eventHandler.js":4,"indexeddb-crud":1}],6:[function(require,module,exports){
'use strict';
var show = (function showGenerator() {
  var createNode = require('./createNode.js');

  function init(dataArr) {
    _refresh(dataArr, _initSentence);
  }

  function all(dataArr) {
    _refresh(dataArr, randomAphorism);
  }

  function part(dataArr) {
    if (dataArr.length === 0) {
      randomAphorism();
    } else {
      var nodes = dataArr.reduce(function nodeGenerator(result, data) {
        result.insertBefore(createNode(data), result.firstChild);

        return result;
      }, document.createDocumentFragment());

      document.querySelector('#list').appendChild(nodes); // add it to DOM
    }
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

  function _refresh(dataArr, sentenceFunc) {
    if (dataArr.length === 0) {
      sentenceFunc();
    } else {
      _refreshShow(dataArr);
    }
  }

  function _refreshShow(dataArr) {
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
    random: randomAphorism
  };
}());

module.exports = show;

},{"./createNode.js":2}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5kZXhlZGRiLWNydWQvaW5kZXguanMiLCJzcmMvc2NyaXB0cy9jcmVhdGVOb2RlLmpzIiwic3JjL3NjcmlwdHMvZGJDb25maWcuanMiLCJzcmMvc2NyaXB0cy9ldmVudEhhbmRsZXIuanMiLCJzcmMvc2NyaXB0cy9tYWluLmpzIiwic3JjL3NjcmlwdHMvc2hvdy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuLy8gdXNlIG1vZHVsZSBwYXR0ZXJuXG52YXIgaW5kZXhlZERCSGFuZGxlciA9IChmdW5jdGlvbiBpbmRleGVkREJIYW5kbGVyKCkge1xuICAvLyAzIHByaXZhdGUgcHJvcGVydHlcbiAgdmFyIF9kYlJlc3VsdDtcbiAgdmFyIF9wcmVzZW50S2V5O1xuICB2YXIgX3N0b3JlTmFtZTtcblxuICAvLyBpbml0IGluZGV4ZWREQlxuICBmdW5jdGlvbiBpbml0KGRiQ29uZmlnLCBjYWxsYmFjaykge1xuICAgIC8vIGZpcnN0bHkgaW5zcGVjdCBicm93c2VyJ3Mgc3VwcG9ydCBmb3IgaW5kZXhlZERCXG4gICAgaWYgKCF3aW5kb3cuaW5kZXhlZERCKSB7XG4gICAgICB3aW5kb3cuYWxlcnQoJ1lvdXIgYnJvd3NlciBkb2VzblxcJ3Qgc3VwcG9ydCBhIHN0YWJsZSB2ZXJzaW9uIG9mIEluZGV4ZWREQi4gU3VjaCBhbmQgc3VjaCBmZWF0dXJlIHdpbGwgbm90IGJlIGF2YWlsYWJsZS4nKTtcblxuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgX29wZW5EQihkYkNvbmZpZywgY2FsbGJhY2spOyAgLy8gd2hpbGUgaXQncyBvaywgb2VwbiBpdFxuICAgIH1cblxuICAgIHJldHVybiAwO1xuICB9XG5cblxuICAvKiAyIHByaXZhdGUgbWV0aG9kcyAqL1xuXG4gIGZ1bmN0aW9uIF9vcGVuREIoZGJDb25maWcsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHJlcXVlc3QgPSBpbmRleGVkREIub3BlbihkYkNvbmZpZy5uYW1lLCBkYkNvbmZpZy52ZXJzaW9uKTsgLy8gb3BlbiBpbmRleGVkREJcblxuICAgIF9zdG9yZU5hbWUgPSBkYkNvbmZpZy5zdG9yZU5hbWU7IC8vIHN0b3JhZ2Ugc3RvcmVOYW1lXG4gICAgcmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24gX29wZW5EQkVycm9ySGFuZGxlcigpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdQaXR5LCBmYWlsIHRvIGxvYWQgaW5kZXhlZERCJyk7XG4gICAgfTtcbiAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIF9vcGVuREJTdWNjZXNzSGFuZGxlcihlKSB7XG4gICAgICBfZGJSZXN1bHQgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICBfZ2V0UHJlc2VudEtleShjYWxsYmFjayk7XG4gICAgfTtcbiAgICAvLyBXaGVuIHlvdSBjcmVhdGUgYSBuZXcgZGF0YWJhc2Ugb3IgaW5jcmVhc2UgdGhlIHZlcnNpb24gbnVtYmVyIG9mIGFuIGV4aXN0aW5nIGRhdGFiYXNlIFxuICAgIC8vIChieSBzcGVjaWZ5aW5nIGEgaGlnaGVyIHZlcnNpb24gbnVtYmVyIHRoYW4geW91IGRpZCBwcmV2aW91c2x5LCB3aGVuIE9wZW5pbmcgYSBkYXRhYmFzZVxuICAgIHJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24gc2NoZW1hQ2hhbmdlZChlKSB7XG4gICAgICB2YXIgc3RvcmU7XG5cbiAgICAgIF9kYlJlc3VsdCA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgIGlmICghX2RiUmVzdWx0Lm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoX3N0b3JlTmFtZSkpIHtcbiAgICAgICAgLy8gc2V0IGRiQ29uZmlnLmtleSBhcyBrZXlQYXRoXG4gICAgICAgIHN0b3JlID0gX2RiUmVzdWx0LmNyZWF0ZU9iamVjdFN0b3JlKF9zdG9yZU5hbWUsIHsga2V5UGF0aDogZGJDb25maWcua2V5LCBhdXRvSW5jcmVtZW50OiB0cnVlIH0pOyAvLyDliJvlu7pkYlxuICAgICAgfVxuICAgICAgLy8gYWRkIGEgbmV3IGRiIGRlbW9cbiAgICAgIHN0b3JlLmFkZChkYkNvbmZpZy5kYXRhRGVtbyk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIHNldCBwcmVzZW50IGtleSB2YWx1ZSB0byBfcHJlc2VudEtleSAodGhlIHByaXZhdGUgcHJvcGVydHkpIFxuICBmdW5jdGlvbiBfZ2V0UHJlc2VudEtleShjYWxsYmFjaykge1xuICAgIHZhciBzdG9yZUhhbmRlciA9IF90cmFuc2FjdGlvbkhhbmRsZXIodHJ1ZSk7XG4gICAgdmFyIHJhbmdlID0gSURCS2V5UmFuZ2UubG93ZXJCb3VuZCgwKTtcblxuICAgIHN0b3JlSGFuZGVyLm9wZW5DdXJzb3IocmFuZ2UsICduZXh0Jykub25zdWNjZXNzID0gZnVuY3Rpb24gX2dldFByZXNlbnRLZXlIYW5kbGVyKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICAgIF9wcmVzZW50S2V5ID0gY3Vyc29yLnZhbHVlLmlkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ25vdyBrZXkgaXM6JyArICBfcHJlc2VudEtleSk7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8qIENSVUQgKi9cblxuICAvLyBnZXQgcHJlc2VudCBpZFxuICAvLyB1c2UgY2xvc3VyZSB0byBrZWVwIF9wcmVzZW50S2V5LCB5b3Ugd2lsbCBuZWVkIGl0IGluIGFkZFxuICBmdW5jdGlvbiBnZXROZXdEYXRhS2V5KCkge1xuICAgIF9wcmVzZW50S2V5ICs9IDE7XG5cbiAgICByZXR1cm4gX3ByZXNlbnRLZXk7XG4gIH1cblxuICAvLyBDcmVhdGUgXG5cbiAgZnVuY3Rpb24gYWRkKG5ld0RhdGEsIGNhbGxiYWNrLCBjYWxsYmFja1BhcmFBcnIpIHtcbiAgICB2YXIgc3RvcmVIYW5kZXIgPSBfdHJhbnNhY3Rpb25IYW5kbGVyKHRydWUpO1xuICAgIHZhciBhZGRPcHQgPSBzdG9yZUhhbmRlci5hZGQobmV3RGF0YSk7XG5cbiAgICBhZGRPcHQub25lcnJvciA9IGZ1bmN0aW9uIGVycm9yKCkge1xuICAgICAgY29uc29sZS5sb2coJ1BpdHksIGZhaWxlZCB0byBhZGQgb25lIGRhdGEgdG8gaW5kZXhlZERCJyk7XG4gICAgfTtcbiAgICBhZGRPcHQub25zdWNjZXNzID0gZnVuY3Rpb24gc3VjY2VzcygpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdCcmF2bywgc3VjY2VzcyB0byBhZGQgb25lIGRhdGEgdG8gaW5kZXhlZERCJyk7XG4gICAgICBpZiAoY2FsbGJhY2spIHsgLy8gaWYgaGFzIGNhbGxiYWNrIGJlZW4gaW5wdXQsIGV4ZWN1dGUgaXQgXG4gICAgICAgIF9jYWxsYmFja0hhbmRsZXIoY2FsbGJhY2ssIG5ld0RhdGEsIGNhbGxiYWNrUGFyYUFycik7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8vIFJldHJpZXZlXG5cbiAgLy8gcmV0cmlldmUgb25lIGRhdGFcbiAgZnVuY3Rpb24gZ2V0KGtleSwgY2FsbGJhY2ssIGNhbGxiYWNrUGFyYUFycikge1xuICAgIHZhciBzdG9yZUhhbmRlciA9IF90cmFuc2FjdGlvbkhhbmRsZXIoZmFsc2UpO1xuICAgIHZhciBnZXREYXRhS2V5ID0gc3RvcmVIYW5kZXIuZ2V0KGtleSk7ICAvLyBnZXQgaXQgYnkgaW5kZXhcblxuICAgIGdldERhdGFLZXkub25lcnJvciA9IGZ1bmN0aW9uIGdldERhdGFFcnJvckhhbmRsZXIoKSB7XG4gICAgICBjb25zb2xlLmxvZygnUGl0eSwgZ2V0IChrZXk6JyArIGtleSArICdcXCcpcyBkYXRhJyArICcgZmFpbGQnKTtcbiAgICB9O1xuICAgIGdldERhdGFLZXkub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0RGF0YVN1Y2Nlc3NIYW5kbGVyKCkge1xuICAgICAgY29uc29sZS5sb2coJ0dyZWF0LCBnZXQgKGtleTonICsga2V5ICsgJ1xcJylzIGRhdGEgc3VjY2VlZCcpO1xuICAgICAgX2NhbGxiYWNrSGFuZGxlcihjYWxsYmFjaywgZ2V0RGF0YUtleS5yZXN1bHQsIGNhbGxiYWNrUGFyYUFycik7XG4gICAgfTtcbiAgfVxuXG4gIC8vIHJldHJpZXZlIGVsaWdpYmxlIGRhdGEgKGJvb2xlYW4gY29uZGl0aW9uKVxuICBmdW5jdGlvbiBnZXRXaGV0aGVyKHdoZXRoZXIsIGNvbmRpdGlvbiwgY2FsbGJhY2ssIGNhbGxiYWNrUGFyYUFycikge1xuICAgIHZhciBzdG9yZUhhbmRlciA9IF90cmFuc2FjdGlvbkhhbmRsZXIodHJ1ZSk7XG4gICAgdmFyIHJhbmdlID0gX3JhbmdlVG9BbGwoKTtcbiAgICB2YXIgcmVzdWx0ID0gW107IC8vIHVzZSBhbiBhcnJheSB0byBzdG9yYWdlIGVsaWdpYmxlIGRhdGFcblxuICAgIHN0b3JlSGFuZGVyLm9wZW5DdXJzb3IocmFuZ2UsICduZXh0Jykub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0V2hldGhlckhhbmRsZXIoZSkge1xuICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICBpZiAod2hldGhlcikge1xuICAgICAgICAgIGlmIChjdXJzb3IudmFsdWVbY29uZGl0aW9uXSkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goY3Vyc29yLnZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIXdoZXRoZXIpIHtcbiAgICAgICAgICBpZiAoIWN1cnNvci52YWx1ZVtjb25kaXRpb25dKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChjdXJzb3IudmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF9jYWxsYmFja0hhbmRsZXIoY2FsbGJhY2ssIHJlc3VsdCwgY2FsbGJhY2tQYXJhQXJyKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLy8gcmV0cmlldmUgYWxsXG4gIGZ1bmN0aW9uIGdldEFsbChjYWxsYmFjaywgY2FsbGJhY2tQYXJhQXJyKSB7XG4gICAgdmFyIHN0b3JlSGFuZGVyID0gX3RyYW5zYWN0aW9uSGFuZGxlcih0cnVlKTtcbiAgICB2YXIgcmFuZ2UgPSBfcmFuZ2VUb0FsbCgpO1xuICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgIHN0b3JlSGFuZGVyLm9wZW5DdXJzb3IocmFuZ2UsICduZXh0Jykub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0QWxsSGFuZGxlcihlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGN1cnNvci52YWx1ZSk7XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX2NhbGxiYWNrSGFuZGxlcihjYWxsYmFjaywgcmVzdWx0LCBjYWxsYmFja1BhcmFBcnIpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyBVcGRhdGUgb25lXG4gIGZ1bmN0aW9uIHVwZGF0ZShuZXdEYXRhLCBjYWxsYmFjaywgY2FsbGJhY2tQYXJhQXJyKSB7XG4gICAgdmFyIHN0b3JlSGFuZGVyID0gX3RyYW5zYWN0aW9uSGFuZGxlcih0cnVlKTtcbiAgICB2YXIgcHV0U3RvcmUgPSBzdG9yZUhhbmRlci5wdXQobmV3RGF0YSk7XG5cbiAgICBwdXRTdG9yZS5vbmVycm9yID0gZnVuY3Rpb24gdXBkYXRlRXJyb3JIYW5kbGVyKCkge1xuICAgICAgY29uc29sZS5sb2coJ1BpdHksIG1vZGlmeSBmYWlsZWQnKTtcbiAgICB9O1xuICAgIHB1dFN0b3JlLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIHVwZGF0ZVN1Y2Nlc3NIYW5kbGVyKCkge1xuICAgICAgY29uc29sZS5sb2coJ0FoYSwgbW9kaWZ5IHN1Y2NlZWQnKTtcbiAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICBfY2FsbGJhY2tIYW5kbGVyKGNhbGxiYWNrLCBuZXdEYXRhLCBjYWxsYmFja1BhcmFBcnIpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyBEZWxldGUgXG5cbiAgLy8gZGVsZXRlIG9uZVxuICBmdW5jdGlvbiBkZWxldGVPbmUoa2V5LCBjYWxsYmFjaywgY2FsbGJhY2tQYXJhQXJyKSB7XG4gICAgdmFyIHN0b3JlSGFuZGVyID0gX3RyYW5zYWN0aW9uSGFuZGxlcih0cnVlKTtcbiAgICB2YXIgZGVsZXRlT3B0ID0gc3RvcmVIYW5kZXIuZGVsZXRlKGtleSk7IC8vIOWwhuW9k+WJjemAieS4rWxp55qE5pWw5o2u5LuO5pWw5o2u5bqT5Lit5Yig6ZmkXG5cbiAgICBkZWxldGVPcHQub25lcnJvciA9IGZ1bmN0aW9uIGRlbGV0ZUVycm9ySGFuZGxlcigpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdkZWxldGUgKGtleTonICsga2V5ICsgJ1xcJylzIHZhbHVlIGZhaWxkJyk7XG4gICAgfTtcbiAgICBkZWxldGVPcHQub25zdWNjZXNzID0gZnVuY3Rpb24gZGVsZXRlU3VjY2Vzc0hhbmRsZXIoKSB7XG4gICAgICBjb25zb2xlLmxvZygnZGVsZXRlIChrZXk6ICcgKyBrZXkgKyAgJ1xcJylzIHZhbHVlIHN1Y2NlZWQnKTtcbiAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICBfY2FsbGJhY2tIYW5kbGVyKGNhbGxiYWNrLCBrZXksIGNhbGxiYWNrUGFyYUFycik7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8vIGNsZWFyXG4gIGZ1bmN0aW9uIGNsZWFyKGNhbGxiYWNrLCBjYWxsYmFja1BhcmFBcnIpIHtcbiAgICB2YXIgc3RvcmVIYW5kZXIgPSBfdHJhbnNhY3Rpb25IYW5kbGVyKHRydWUpO1xuICAgIHZhciByYW5nZSA9IF9yYW5nZVRvQWxsKCk7XG5cbiAgICBzdG9yZUhhbmRlci5vcGVuQ3Vyc29yKHJhbmdlLCAnbmV4dCcpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGNsZWFySGFuZGxlcihlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgdmFyIHJlcXVlc3REZWw7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgcmVxdWVzdERlbCA9IGN1cnNvci5kZWxldGUoKTtcbiAgICAgICAgcmVxdWVzdERlbC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBzdWNjZXNzKCkge1xuICAgICAgICB9O1xuICAgICAgICByZXF1ZXN0RGVsLm9uZXJyb3IgPSBmdW5jdGlvbiBlcnJvcigpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnUGl0eSwgZGVsZXRlIGFsbCBkYXRhIGZhaWxkJyk7XG4gICAgICAgIH07XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfSBlbHNlIGlmIChjYWxsYmFjaykge1xuICAgICAgICBfY2FsbGJhY2tIYW5kbGVyKGNhbGxiYWNrLCAnYWxsIGRhdGEnLCBjYWxsYmFja1BhcmFBcnIpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKiAzIHByaXZhdGUgbWV0aG9kcyAqL1xuXG4gIGZ1bmN0aW9uIF90cmFuc2FjdGlvbkhhbmRsZXIod2hldGhlcldyaXRlKSB7XG4gICAgdmFyIHRyYW5zYWN0aW9uO1xuXG4gICAgaWYgKHdoZXRoZXJXcml0ZSkge1xuICAgICAgdHJhbnNhY3Rpb24gPSBfZGJSZXN1bHQudHJhbnNhY3Rpb24oW19zdG9yZU5hbWVdLCAncmVhZHdyaXRlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRyYW5zYWN0aW9uID0gX2RiUmVzdWx0LnRyYW5zYWN0aW9uKFtfc3RvcmVOYW1lXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKF9zdG9yZU5hbWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3JhbmdlVG9BbGwoKSB7XG4gICAgcmV0dXJuIElEQktleVJhbmdlLmxvd2VyQm91bmQoMCwgdHJ1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBfY2FsbGJhY2tIYW5kbGVyKGNhbGxiYWNrLCByZXN1bHQsIGNhbGxiYWNrUGFyYUFycikge1xuICAgIGlmIChjYWxsYmFja1BhcmFBcnIpIHtcbiAgICAgIGNhbGxiYWNrUGFyYUFyci51bnNoaWZ0KHJlc3VsdCk7XG4gICAgICBjYWxsYmFjay5hcHBseShudWxsLCBjYWxsYmFja1BhcmFBcnIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYWxsYmFjayhyZXN1bHQpO1xuICAgIH1cbiAgfVxuXG4gIC8qIHB1YmxpYyBpbnRlcmZhY2UgKi9cbiAgcmV0dXJuIHtcbiAgICBpbml0OiBpbml0LFxuICAgIGdldE5ld0RhdGFLZXk6IGdldE5ld0RhdGFLZXksXG4gICAgYWRkOiBhZGQsXG4gICAgZ2V0OiBnZXQsXG4gICAgZ2V0V2hldGhlcjogZ2V0V2hldGhlcixcbiAgICBnZXRBbGw6IGdldEFsbCxcbiAgICB1cGRhdGU6IHVwZGF0ZSxcbiAgICBkZWxldGU6IGRlbGV0ZU9uZSxcbiAgICBjbGVhcjogY2xlYXJcbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gaW5kZXhlZERCSGFuZGxlcjtcbiIsInZhciBjcmVhdGVOb2RlID0gKGZ1bmN0aW9uIG5vZGVHZW5lcmF0b3IoKSB7XG4gIC8qIHByaXZhdGUgbWV0aG9kcyAqL1xuICBmdW5jdGlvbiBfZGVjb3JhdGVMaShsaSwgZGF0YSkge1xuICAgIHZhciB0ZXh0RGF0ZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGEudXNlckRhdGUgKyAnOiAnKTtcbiAgICB2YXIgdGV4dFdyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnICcgKyBkYXRhLmV2ZW50KTtcblxuICAgIC8vIHdyYXAgYXMgYSBub2RlXG4gICAgdGV4dFdyYXAuYXBwZW5kQ2hpbGQodGV4dCk7XG4gICAgbGkuYXBwZW5kQ2hpbGQodGV4dERhdGUpO1xuICAgIGxpLmFwcGVuZENoaWxkKHRleHRXcmFwKTtcbiAgICBpZiAoZGF0YS5maW5pc2hlZCkgeyAgLy8gYWRkIGNzcy1zdHlsZSB0byBpdCAoYWNjb3JkaW5nIHRvIGl0J3MgZGF0YS5maW5pc2hlZCB2YWx1ZSlcbiAgICAgIGxpLmNsYXNzTGlzdC5hZGQoJ2NoZWNrZWQnKTsgLy8gYWRkIHN0eWxlXG4gICAgfVxuICAgIF9hZGRYKGxpLCBkYXRhLmlkKTsgLy8gYWRkIHNwYW4gW3hdIHRvIGxpJ3MgdGFpbFxuICAgIF9zZXREYXRhUHJvcGVydHkobGksICdkYXRhLWlkJywgZGF0YS5pZCk7IC8vIGFkZCBwcm9wZXJ0eSB0byBsaSAoZGF0YS1pZCnvvIxmb3IgIGNsaWNrTGlcbiAgfVxuXG4gIGZ1bmN0aW9uIF9hZGRYKGxpLCBpZCkge1xuICAgIHZhciBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHZhciB4ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJ1xcdTAwRDcnKTsgLy8gdW5pY29kZSAtPiB4XG5cbiAgICBzcGFuLmFwcGVuZENoaWxkKHgpO1xuICAgIHNwYW4uY2xhc3NOYW1lID0gJ2Nsb3NlJzsgLy8gYWRkIHN0eWxlXG4gICAgX3NldERhdGFQcm9wZXJ0eShzcGFuLCAnZGF0YS14JywgaWQpOyAvLyBhZGQgcHJvcGVydHkgdG8gc3BhbiAoZGF0YS14KSwgZm9yIGRlbGV0ZUxpXG4gICAgbGkuYXBwZW5kQ2hpbGQoc3Bhbik7XG4gIH1cblxuICBmdW5jdGlvbiBfc2V0RGF0YVByb3BlcnR5KHRhcmdldCwgbmFtZSwgZGF0YSkge1xuICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUobmFtZSwgZGF0YSk7XG4gIH1cblxuXG4gIC8qIGludGVyZmFjZSAqL1xuICByZXR1cm4gZnVuY3Rpb24gY3JlYXRlKGRhdGEpIHtcbiAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuXG4gICAgX2RlY29yYXRlTGkobGksIGRhdGEpOyAvLyBkZWNvcmF0ZSBsaVxuXG4gICAgcmV0dXJuIGxpO1xuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVOb2RlO1xuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gZGJDb25maWdHZW5lcmF0b3IoKSB7XG4gIHZhciBkYkNvbmZpZyA9IHtcbiAgICBuYW1lOiAnanVzdFRvRG8nLFxuICAgIHZlcnNpb246ICc2JyxcbiAgICBrZXk6ICdpZCcsXG4gICAgc3RvcmVOYW1lOiAndXNlcidcbiAgfTtcbiAgZGJDb25maWcuZGF0YURlbW8gPSB7XG4gICAgaWQ6IDAsXG4gICAgZXZlbnQ6IDAsXG4gICAgZmluaXNoZWQ6IHRydWUsXG4gICAgZGF0ZTogMFxuICB9O1xuXG4gIHJldHVybiBkYkNvbmZpZztcbn0oKSk7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgZXZlbnRIYW5kbGVyID0gKGZ1bmN0aW9uIGhhbmRsZXJHZW5lcmF0b3IoKSB7XG4gIHZhciBEQiA9IHJlcXVpcmUoJ2luZGV4ZWRkYi1jcnVkJyk7XG4gIHZhciBzaG93ID0gcmVxdWlyZSgnLi9zaG93LmpzJyk7XG4gIHZhciBjcmVhdGVOb2RlID0gcmVxdWlyZSgnLi9jcmVhdGVOb2RlJyk7XG5cbiAgZnVuY3Rpb24gYWRkKCkge1xuICAgIHZhciBpbnB1dFZhbHVlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWU7XG4gICAgdmFyIGxpc3Q7XG4gICAgdmFyIG5ld0RhdGE7XG4gICAgdmFyIG5ld05vZGU7XG5cbiAgICBpZiAoaW5wdXRWYWx1ZSA9PT0gJycpIHtcbiAgICAgIGFsZXJ0KCdwbGVhc2UgaW5wdXQgYSByZWFsIGRhdGF+Jyk7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgX2lmRW1wdHkoKTtcbiAgICBuZXdEYXRhID0gX2ludGVncmF0ZU5ld0RhdGEoaW5wdXRWYWx1ZSk7XG4gICAgbmV3Tm9kZSA9IGNyZWF0ZU5vZGUobmV3RGF0YSk7XG4gICAgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgbGlzdC5pbnNlcnRCZWZvcmUobmV3Tm9kZSwgbGlzdC5maXJzdENoaWxkKTsgLy8gcHVzaCBuZXdOb2RlIHRvIGZpcnN0XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWUgPSAnJzsgIC8vIHJlc2V0IGlucHV0J3MgdmFsdWVzXG4gICAgREIuYWRkKG5ld0RhdGEpO1xuXG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICBmdW5jdGlvbiBlbnRlckFkZChlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgIGFkZCgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGxpJ3MgW3hdJ3MgZGVsZXRlXG4gIGZ1bmN0aW9uIGRlbGV0ZUxpKGUpIHtcbiAgICB2YXIgaWQ7XG5cbiAgICBpZiAoZS50YXJnZXQuY2xhc3NOYW1lID09PSAnY2xvc2UnKSB7IC8vIHVzZSBldmVudCBkZWxlZ2F0aW9uXG4gICAgICAvLyB1c2UgcHJldmlvdXNseSBzdG9yZWQgZGF0YVxuICAgICAgaWQgPSBwYXJzZUludChlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEteCcpLCAxMCk7IC8vICNUT0RPOiBEb2VzIHBhcmVudE5vZGUgY2FuIGRvIHRoaXM/XG4gICAgICBEQi5kZWxldGUoaWQsIHNob3dBbGwpOyAvLyBkZWxldGUgaW4gREIgYW5kIHNob3cgbGlzdCBhZ2FpblxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dJbml0KCkge1xuICAgIHNob3cuY2xlYXIoKTtcbiAgICBEQi5nZXRBbGwoc2hvdy5pbml0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dBbGwoKSB7XG4gICAgc2hvdy5jbGVhcigpO1xuICAgIERCLmdldEFsbChzaG93LmFsbCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93Q2xlYXIoKSB7XG4gICAgc2hvdy5jbGVhcigpOyAvLyBjbGVhciBub2RlcyB2aXN1YWxseVxuICAgIHNob3cucmFuZG9tKCk7XG4gICAgREIuY2xlYXIoKTsgLy8gY2xlYXIgZGF0YSBpbmRlZWRcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dEb25lKCkge1xuICAgIF9zaG93V2hldGhlckRvbmUodHJ1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93VG9kbygpIHtcbiAgICBfc2hvd1doZXRoZXJEb25lKGZhbHNlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsaWNrTGkoZSkge1xuICAgIHZhciBpZDtcbiAgICB2YXIgdGFyZ2V0TGkgPSBlLnRhcmdldDtcbiAgICAvLyB1c2UgZXZlbnQgZGVsZWdhdGlvblxuXG4gICAgaWYgKHRhcmdldExpLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpKSB7XG4gICAgICBpZCA9IHBhcnNlSW50KHRhcmdldExpLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpLCAxMCk7IC8vIHVzZSBwcmV2aW91c2x5IHN0b3JlZCBkYXRhLWlkIGF0dHJpYnV0ZVxuICAgICAgREIuZ2V0KGlkLCBfc3dpdGNoTGksIFt0YXJnZXRMaV0pOyAvLyBwYXNzIF9zd2l0Y2hMaSBhbmQgcGFyYW0gW2UudGFyZ2V0XSBhcyBjYWxsYmFja1xuICAgIH1cbiAgfVxuXG5cbiAgLyogcHJpdmF0ZSBtZXRob2RzICovXG4gIGZ1bmN0aW9uIF9pZkVtcHR5KCkge1xuICAgIHZhciBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcblxuICAgIGlmIChsaXN0LmZpcnN0Q2hpbGQuY2xhc3NOYW1lID09PSAnYXBob3Jpc20nKSB7XG4gICAgICBsaXN0LnJlbW92ZUNoaWxkKGxpc3QuZmlyc3RDaGlsZCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX2ludGVncmF0ZU5ld0RhdGEodmFsdWUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IERCLmdldE5ld0RhdGFLZXkoKSxcbiAgICAgIGV2ZW50OiB2YWx1ZSxcbiAgICAgIGZpbmlzaGVkOiBmYWxzZSxcbiAgICAgIHVzZXJEYXRlOiBfZ2V0TmV3RGF0ZSgneXl5eeW5tE1N5pyIZGTml6UgaGg6bW0nKVxuICAgIH07XG4gIH1cblxuICAvLyBGb3JtYXQgZGF0ZVxuICBmdW5jdGlvbiBfZ2V0TmV3RGF0ZShmbXQpIHtcbiAgICB2YXIgbmV3RGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgdmFyIG5ld2ZtdCA9IGZtdDtcbiAgICB2YXIgbyA9IHtcbiAgICAgICd5Kyc6IG5ld0RhdGUuZ2V0RnVsbFllYXIoKSxcbiAgICAgICdNKyc6IG5ld0RhdGUuZ2V0TW9udGgoKSArIDEsXG4gICAgICAnZCsnOiBuZXdEYXRlLmdldERhdGUoKSxcbiAgICAgICdoKyc6IG5ld0RhdGUuZ2V0SG91cnMoKSxcbiAgICAgICdtKyc6IG5ld0RhdGUuZ2V0TWludXRlcygpXG4gICAgfTtcbiAgICB2YXIgbGVucztcblxuICAgIGZvciAodmFyIGsgaW4gbykge1xuICAgICAgaWYgKG5ldyBSZWdFeHAoJygnICsgayArICcpJykudGVzdChuZXdmbXQpKSB7XG4gICAgICAgIGlmIChrID09PSAneSsnKSB7XG4gICAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoJycgKyBvW2tdKS5zdWJzdHIoNCAtIFJlZ0V4cC4kMS5sZW5ndGgpKTtcbiAgICAgICAgfSBlbHNlIGlmIChrID09PSAnUysnKSB7XG4gICAgICAgICAgbGVucyA9IFJlZ0V4cC4kMS5sZW5ndGg7XG4gICAgICAgICAgbGVucyA9IGxlbnMgPT09IDEgPyAzIDogbGVucztcbiAgICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsICgnMDAnICsgb1trXSkuc3Vic3RyKCgnJyArIG9ba10pLmxlbmd0aCAtIDEsIGxlbnMpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChSZWdFeHAuJDEubGVuZ3RoID09PSAxKSA/IChvW2tdKSA6ICgoJzAwJyArIG9ba10pLnN1YnN0cigoJycgKyBvW2tdKS5sZW5ndGgpKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbmV3Zm10O1xuICB9XG5cbiAgZnVuY3Rpb24gX3Nob3dXaGV0aGVyRG9uZSh3aGV0aGVyKSB7XG4gICAgdmFyIGNvbmRpdGlvbiA9ICdmaW5pc2hlZCc7IC8vIHNldCAnZmluaXNoZWQnIGFzIGNvbmRpdGlvblxuXG4gICAgc2hvdy5jbGVhcigpO1xuICAgIERCLmdldFdoZXRoZXIod2hldGhlciwgY29uZGl0aW9uLCBzaG93LnBhcnQpOyAvLyBwYXNzIHJlZnJlc2ggYXMgY2FsbGJhY2sgZnVuY3Rpb25cbiAgfVxuXG4gIGZ1bmN0aW9uIF9zd2l0Y2hMaShkYXRhLCB0YXJnZXRMaSkge1xuICAgIHRhcmdldExpLmZpbmlzaGVkID0gIWRhdGEuZmluaXNoZWQ7XG4gICAgaWYgKHRhcmdldExpLmZpbmlzaGVkKSB7XG4gICAgICB0YXJnZXRMaS5jbGFzc0xpc3QuYWRkKCdjaGVja2VkJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRhcmdldExpLmNsYXNzTGlzdC5yZW1vdmUoJ2NoZWNrZWQnKTtcbiAgICB9XG4gICAgZGF0YS5maW5pc2hlZCA9IHRhcmdldExpLmZpbmlzaGVkOyAgLy8gdG9nZ2xlIGRhdGEuZmluaXNoZWRcbiAgICBEQi51cGRhdGUoZGF0YSwgc2hvd0FsbCk7XG4gIH1cblxuICAvKiBpbnRlcmZhY2UgKi9cbiAgcmV0dXJuIHtcbiAgICBhZGQ6IGFkZCxcbiAgICBlbnRlcjogZW50ZXJBZGQsXG4gICAgZGVsZXRlTGk6IGRlbGV0ZUxpLFxuICAgIHNob3dJbml0OiBzaG93SW5pdCxcbiAgICBzaG93QWxsOiBzaG93QWxsLFxuICAgIHNob3dDbGVhcjogc2hvd0NsZWFyLFxuICAgIHNob3dEb25lOiBzaG93RG9uZSxcbiAgICBzaG93VG9kbzogc2hvd1RvZG8sXG4gICAgY2xpY2tMaTogY2xpY2tMaVxuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBldmVudEhhbmRsZXI7XG4iLCIndXNlIHN0cmljdCc7XG4oZnVuY3Rpb24gaW5pdCgpIHtcbiAgdmFyIERCID0gcmVxdWlyZSgnaW5kZXhlZGRiLWNydWQnKTtcbiAgdmFyIGRiQ29uZmlnID0gcmVxdWlyZSgnLi9kYkNvbmZpZy5qcycpO1xuICB2YXIgaGFuZGxlciA9IHJlcXVpcmUoJy4vZXZlbnRIYW5kbGVyLmpzJyk7XG5cbiAgLy8gb3BlbiBEQiwgYW5kIHdoZW4gREIgb3BlbiBzdWNjZWVkLCBpbnZva2UgaW5pdGlhbCBmdW5jdGlvblxuICBEQi5pbml0KGRiQ29uZmlnLCBhZGRFdmVudExpc3RlbmVycyk7XG5cbiAgLy8gd2hlbiBkYiBpcyBvcGVuZWQgc3VjY2VlZCwgYWRkIEV2ZW50TGlzdGVuZXJzXG4gIGZ1bmN0aW9uIGFkZEV2ZW50TGlzdGVuZXJzKCkge1xuICAgIHZhciBsaXN0O1xuXG4gICAgaGFuZGxlci5zaG93SW5pdCgpOyAvLyBpbml0IHNob3dcbiAgICAvLyBhZGQgYWxsIGV2ZW50TGlzdGVuZXJcbiAgICBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgICBsaXN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5jbGlja0xpLCBmYWxzZSk7XG4gICAgbGlzdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuZGVsZXRlTGksIGZhbHNlKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlci5lbnRlciwgZmFsc2UpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhZGQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuYWRkLCBmYWxzZSk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dEb25lJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dEb25lLCBmYWxzZSk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dUb2RvJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dUb2RvLCBmYWxzZSk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dBbGwnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvdywgZmFsc2UpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93Q2xlYXInKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0NsZWFyLCBmYWxzZSk7XG4gIH1cbn0oKSk7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgc2hvdyA9IChmdW5jdGlvbiBzaG93R2VuZXJhdG9yKCkge1xuICB2YXIgY3JlYXRlTm9kZSA9IHJlcXVpcmUoJy4vY3JlYXRlTm9kZS5qcycpO1xuXG4gIGZ1bmN0aW9uIGluaXQoZGF0YUFycikge1xuICAgIF9yZWZyZXNoKGRhdGFBcnIsIF9pbml0U2VudGVuY2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gYWxsKGRhdGFBcnIpIHtcbiAgICBfcmVmcmVzaChkYXRhQXJyLCByYW5kb21BcGhvcmlzbSk7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJ0KGRhdGFBcnIpIHtcbiAgICBpZiAoZGF0YUFyci5sZW5ndGggPT09IDApIHtcbiAgICAgIHJhbmRvbUFwaG9yaXNtKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBub2RlcyA9IGRhdGFBcnIucmVkdWNlKGZ1bmN0aW9uIG5vZGVHZW5lcmF0b3IocmVzdWx0LCBkYXRhKSB7XG4gICAgICAgIHJlc3VsdC5pbnNlcnRCZWZvcmUoY3JlYXRlTm9kZShkYXRhKSwgcmVzdWx0LmZpcnN0Q2hpbGQpO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9LCBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCkpO1xuXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmFwcGVuZENoaWxkKG5vZGVzKTsgLy8gYWRkIGl0IHRvIERPTVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIHZhciByb290ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcblxuICAgIHdoaWxlIChyb290Lmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgcm9vdC5yZW1vdmVDaGlsZChyb290LmZpcnN0Q2hpbGQpOyAvLyB0aGUgYmVzdCB3YXkgdG8gY2xlYW4gY2hpbGROb2Rlc1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJhbmRvbUFwaG9yaXNtKCkge1xuICAgIHZhciBhcGhvcmlzbXMgPSBbXG4gICAgICAnWWVzdGVyZGF5IFlvdSBTYWlkIFRvbW9ycm93JyxcbiAgICAgICdXaHkgYXJlIHdlIGhlcmU/JyxcbiAgICAgICdBbGwgaW4sIG9yIG5vdGhpbmcnLFxuICAgICAgJ1lvdSBOZXZlciBUcnksIFlvdSBOZXZlciBLbm93JyxcbiAgICAgICdUaGUgdW5leGFtaW5lZCBsaWZlIGlzIG5vdCB3b3J0aCBsaXZpbmcuIC0tIFNvY3JhdGVzJ1xuICAgIF07XG4gICAgdmFyIHJhbmRvbUluZGV4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXBob3Jpc21zLmxlbmd0aCk7XG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShhcGhvcmlzbXNbcmFuZG9tSW5kZXhdKTtcblxuICAgIF9zZW50ZW5jZUdlbmVyYXRvcih0ZXh0KTtcbiAgfVxuXG5cbiAgLyogcHJpdmF0ZSBtZXRob2RzICovXG5cbiAgZnVuY3Rpb24gX3JlZnJlc2goZGF0YUFyciwgc2VudGVuY2VGdW5jKSB7XG4gICAgaWYgKGRhdGFBcnIubGVuZ3RoID09PSAwKSB7XG4gICAgICBzZW50ZW5jZUZ1bmMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgX3JlZnJlc2hTaG93KGRhdGFBcnIpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9yZWZyZXNoU2hvdyhkYXRhQXJyKSB7XG4gICAgdmFyIHJlc3VsdCA9IF9jbGFzc2lmeURhdGEoZGF0YUFycik7XG5cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmFwcGVuZENoaWxkKHJlc3VsdCk7IC8vIGFkZCBpdCB0byBET01cbiAgfVxuXG4gIGZ1bmN0aW9uIF9jbGFzc2lmeURhdGEoZGF0YUFycikge1xuICAgIC8vIHVzZSBmcmFnbWVudCB0byByZWR1Y2UgRE9NIG9wZXJhdGVcbiAgICB2YXIgdW5maXNoaWVkID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIHZhciBmaW5pc2hlZCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB2YXIgZnVzaW9uID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgLy8gcHV0IHRoZSBmaW5pc2hlZCBpdGVtIHRvIHRoZSBib3R0b21cbiAgICBkYXRhQXJyLmZvckVhY2goZnVuY3Rpb24gY2xhc3NpZnkoZGF0YSkge1xuICAgICAgaWYgKGRhdGEuZmluaXNoZWQpIHtcbiAgICAgICAgZmluaXNoZWQuaW5zZXJ0QmVmb3JlKGNyZWF0ZU5vZGUoZGF0YSksIGZpbmlzaGVkLmZpcnN0Q2hpbGQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdW5maXNoaWVkLmluc2VydEJlZm9yZShjcmVhdGVOb2RlKGRhdGEpLCB1bmZpc2hpZWQuZmlyc3RDaGlsZCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgZnVzaW9uLmFwcGVuZENoaWxkKHVuZmlzaGllZCk7XG4gICAgZnVzaW9uLmFwcGVuZENoaWxkKGZpbmlzaGVkKTtcblxuICAgIHJldHVybiBmdXNpb247XG4gIH1cblxuICBmdW5jdGlvbiBfaW5pdFNlbnRlbmNlKCkge1xuICAgIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJ1dlbGNvbWV+LCB0cnkgdG8gYWRkIHlvdXIgZmlyc3QgdG8tZG8gbGlzdCA6ICknKTtcblxuICAgIF9zZW50ZW5jZUdlbmVyYXRvcih0ZXh0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zZW50ZW5jZUdlbmVyYXRvcih0ZXh0KSB7XG4gICAgdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcblxuICAgIGxpLmFwcGVuZENoaWxkKHRleHQpO1xuICAgIGxpLmNsYXNzTmFtZSA9ICdhcGhvcmlzbSc7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5hcHBlbmRDaGlsZChsaSk7XG4gIH1cblxuXG4gIC8qIGludGVyZmFjZSAqL1xuICByZXR1cm4ge1xuICAgIGluaXQ6IGluaXQsXG4gICAgYWxsOiBhbGwsXG4gICAgcGFydDogcGFydCxcbiAgICBjbGVhcjogY2xlYXIsXG4gICAgcmFuZG9tOiByYW5kb21BcGhvcmlzbVxuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBzaG93O1xuIl19
