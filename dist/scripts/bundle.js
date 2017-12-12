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
var createNode = (function node() {
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

  /* add event handler */
  function add() {
    var inputValue = document.querySelector('#input').value;
    var parent;
    var newData;
    var newNode;

    if (inputValue === '') {
      alert('please input a real data~');
      return false;
    }
    _ifEmpty();
    newData = _integrateNewData(inputValue);
    newNode = createNode(newData);
    parent = document.querySelector('#list');
    parent.insertBefore(newNode, parent.firstChild); // push newNode to first
    document.querySelector('#input').value = '';  // reset input's values
    DB.add(newData);

    return 0;
  }

  function _ifEmpty() {
    if (document.querySelector('#list').className === 'aphorism') {
      show.random();
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

  /* enter's add */
  function enterAdd(e) {
    if (e.keyCode === 13) {
      add();
    }
  }


  /* li's [x]'s delete */
  // use event-delegation
  function deleteLi(e) {
    var id;

    if (e.target.className === 'close') {
      // use previously stored data
      id = parseInt(e.target.getAttribute('data-x'), 10); // #TODO: Does parentNode can do this?
      DB.delete(id, show.all); // delete in DB and show list again
    }
  }


  /* clear */
  function clear() {
    show.clear(); // clear nodes visually
    DB.clear(); // clear data indeed
  }

  /* show done & show todo */
  function showDone() {
    _showWhetherDone(true);
  }

  function showTodo() {
    _showWhetherDone(false);
  }

  function _showWhetherDone(whether) {
    var condition = 'finished'; // set 'finished' as condition

    DB.getWhether(whether, condition, show.all); // pass refresh as callback function
    console.log('Aha, show data succeed');
  }


  /* li */
  // use event-delegation, too
  function clickLi(e) {
    var targetLi = e.target;
    var id;

    if (targetLi.getAttribute('data-id')) {
      id = parseInt(targetLi.getAttribute('data-id'), 10); // use previously stored data
      DB.get(id, _switchLi, [targetLi]); // pass _switchLi and param [e.target] as callback
    }
  }

  function _switchLi(data, targetLi) {
    targetLi.finished = !data.finished;
    if (targetLi.finished) {
      targetLi.classList.add('checked');
    } else {
      targetLi.classList.remove('checked');
    }
    data.finished = targetLi.finished;  // toggle data.finished
    DB.update(data, show.all);
  }

  return {
    add: add,
    enter: enterAdd,
    delete: deleteLi,
    clear: clear,
    showDone: showDone,
    showTodo: showTodo,
    li: clickLi
  };
}());

module.exports = eventHandler;

},{"./createNode":2,"./show.js":6,"indexeddb-crud":1}],5:[function(require,module,exports){
'use strict';
(function init() {
  var DB = require('indexeddb-crud');
  var dbConfig = require('./dbConfig.js');
  var handler = require('./eventHandler.js');
  var show = require('./show.js');

  // open DB, and when DB open succeed, invoke initial function
  DB.init(dbConfig, addEventListeners);

  // when db is opened succeed, add EventListeners
  function addEventListeners() {
    var list = document.querySelector('#list');

    show.init(DB);
    // add all eventListener
    list.addEventListener('click', handler.li, false);
    list.addEventListener('click', handler.delete, false);
    document.querySelector('#add').addEventListener('click', handler.add, false);
    document.addEventListener('keydown', handler.enter, false);
    document.querySelector('#done').addEventListener('click', handler.showDone, false);
    document.querySelector('#todo').addEventListener('click', handler.showToDo, false);
    document.querySelector('#show').addEventListener('click', handler.show, false);
    document.querySelector('#clear').addEventListener('click', handler.clear, false);
  }
}());

},{"./dbConfig.js":3,"./eventHandler.js":4,"./show.js":6,"indexeddb-crud":1}],6:[function(require,module,exports){
'use strict';
var show = (function showGenerator() {
  var createNode = require('./createNode.js');

  // init show
  function init(db) {
    clear();
    db.getAll(_refreshInit);
  }

  // clear all nodes (just clear DOM, not db)
  function clear() {
    var root = document.querySelector('#list');

    while (root.hasChildNodes()) {
      root.removeChild(root.firstChild); // the best way to clean childNodes
    }
  }

  function _refreshInit(dataArr) {
    _refresh(dataArr, _initSentence);
  }

  function _refresh(dataArr, sentenceFunc) {
    if (dataArr.length === 0) {
      sentenceFunc();
    } else {
      _refreshPart(dataArr);
    }
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

  function _refreshPart(dataArr) {
    // use fragment to reduce DOM operate
    var unfishied = document.createDocumentFragment();
    var finished = document.createDocumentFragment();
    var fusion = document.createDocumentFragment();

    // put the finished item to the bottom
    dataArr.forEach(function classifyData(data) {
      if (data.finished) {
        console.log(createNode(data));
        finished.insertBefore(createNode(data), finished.firstChild);
      } else {
        unfishied.insertBefore(createNode(data), unfishied.firstChild);
      }
    });
    fusion.appendChild(unfishied);
    fusion.appendChild(finished);
    document.querySelector('#list').appendChild(fusion); // add it to DOM
    console.log('refresh list, and show succeed');
  }

  // get all data from DB and show it
  function all(db) {
    clear();
    db.getAll(_refreshAll);
  }

  function _refreshAll(dataArr) {
    _refresh(dataArr, randomAphorism);
  }

  function randomAphorism() {
    var aphorisms = [
      'Yesterday You Said Tomorrow',
      'Why are we here?',
      'All in, or nothing',
      'You Never Try, You Never Know',
      'The unexamined life is not worth living. -- Socrates'
    ];
    var randomIndex = Math.floor(Math.random() * (aphorisms.length + 1));
    var text = document.createTextNode(aphorisms[randomIndex]);

    _sentenceGenerator(text);
  }

  return {
    init: init,
    all: all,
    clear: clear,
    random: randomAphorism
  };
}());

module.exports = show;

},{"./createNode.js":2}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5kZXhlZGRiLWNydWQvaW5kZXguanMiLCJzcmMvc2NyaXB0cy9jcmVhdGVOb2RlLmpzIiwic3JjL3NjcmlwdHMvZGJDb25maWcuanMiLCJzcmMvc2NyaXB0cy9ldmVudEhhbmRsZXIuanMiLCJzcmMvc2NyaXB0cy9tYWluLmpzIiwic3JjL3NjcmlwdHMvc2hvdy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuLy8gdXNlIG1vZHVsZSBwYXR0ZXJuXG52YXIgaW5kZXhlZERCSGFuZGxlciA9IChmdW5jdGlvbiBpbmRleGVkREJIYW5kbGVyKCkge1xuICAvLyAzIHByaXZhdGUgcHJvcGVydHlcbiAgdmFyIF9kYlJlc3VsdDtcbiAgdmFyIF9wcmVzZW50S2V5O1xuICB2YXIgX3N0b3JlTmFtZTtcblxuICAvLyBpbml0IGluZGV4ZWREQlxuICBmdW5jdGlvbiBpbml0KGRiQ29uZmlnLCBjYWxsYmFjaykge1xuICAgIC8vIGZpcnN0bHkgaW5zcGVjdCBicm93c2VyJ3Mgc3VwcG9ydCBmb3IgaW5kZXhlZERCXG4gICAgaWYgKCF3aW5kb3cuaW5kZXhlZERCKSB7XG4gICAgICB3aW5kb3cuYWxlcnQoJ1lvdXIgYnJvd3NlciBkb2VzblxcJ3Qgc3VwcG9ydCBhIHN0YWJsZSB2ZXJzaW9uIG9mIEluZGV4ZWREQi4gU3VjaCBhbmQgc3VjaCBmZWF0dXJlIHdpbGwgbm90IGJlIGF2YWlsYWJsZS4nKTtcblxuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgX29wZW5EQihkYkNvbmZpZywgY2FsbGJhY2spOyAgLy8gd2hpbGUgaXQncyBvaywgb2VwbiBpdFxuICAgIH1cblxuICAgIHJldHVybiAwO1xuICB9XG5cblxuICAvKiAyIHByaXZhdGUgbWV0aG9kcyAqL1xuXG4gIGZ1bmN0aW9uIF9vcGVuREIoZGJDb25maWcsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHJlcXVlc3QgPSBpbmRleGVkREIub3BlbihkYkNvbmZpZy5uYW1lLCBkYkNvbmZpZy52ZXJzaW9uKTsgLy8gb3BlbiBpbmRleGVkREJcblxuICAgIF9zdG9yZU5hbWUgPSBkYkNvbmZpZy5zdG9yZU5hbWU7IC8vIHN0b3JhZ2Ugc3RvcmVOYW1lXG4gICAgcmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24gX29wZW5EQkVycm9ySGFuZGxlcigpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdQaXR5LCBmYWlsIHRvIGxvYWQgaW5kZXhlZERCJyk7XG4gICAgfTtcbiAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIF9vcGVuREJTdWNjZXNzSGFuZGxlcihlKSB7XG4gICAgICBfZGJSZXN1bHQgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICBfZ2V0UHJlc2VudEtleShjYWxsYmFjayk7XG4gICAgfTtcbiAgICAvLyBXaGVuIHlvdSBjcmVhdGUgYSBuZXcgZGF0YWJhc2Ugb3IgaW5jcmVhc2UgdGhlIHZlcnNpb24gbnVtYmVyIG9mIGFuIGV4aXN0aW5nIGRhdGFiYXNlIFxuICAgIC8vIChieSBzcGVjaWZ5aW5nIGEgaGlnaGVyIHZlcnNpb24gbnVtYmVyIHRoYW4geW91IGRpZCBwcmV2aW91c2x5LCB3aGVuIE9wZW5pbmcgYSBkYXRhYmFzZVxuICAgIHJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24gc2NoZW1hQ2hhbmdlZChlKSB7XG4gICAgICB2YXIgc3RvcmU7XG5cbiAgICAgIF9kYlJlc3VsdCA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgIGlmICghX2RiUmVzdWx0Lm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoX3N0b3JlTmFtZSkpIHtcbiAgICAgICAgLy8gc2V0IGRiQ29uZmlnLmtleSBhcyBrZXlQYXRoXG4gICAgICAgIHN0b3JlID0gX2RiUmVzdWx0LmNyZWF0ZU9iamVjdFN0b3JlKF9zdG9yZU5hbWUsIHsga2V5UGF0aDogZGJDb25maWcua2V5LCBhdXRvSW5jcmVtZW50OiB0cnVlIH0pOyAvLyDliJvlu7pkYlxuICAgICAgfVxuICAgICAgLy8gYWRkIGEgbmV3IGRiIGRlbW9cbiAgICAgIHN0b3JlLmFkZChkYkNvbmZpZy5kYXRhRGVtbyk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIHNldCBwcmVzZW50IGtleSB2YWx1ZSB0byBfcHJlc2VudEtleSAodGhlIHByaXZhdGUgcHJvcGVydHkpIFxuICBmdW5jdGlvbiBfZ2V0UHJlc2VudEtleShjYWxsYmFjaykge1xuICAgIHZhciBzdG9yZUhhbmRlciA9IF90cmFuc2FjdGlvbkhhbmRsZXIodHJ1ZSk7XG4gICAgdmFyIHJhbmdlID0gSURCS2V5UmFuZ2UubG93ZXJCb3VuZCgwKTtcblxuICAgIHN0b3JlSGFuZGVyLm9wZW5DdXJzb3IocmFuZ2UsICduZXh0Jykub25zdWNjZXNzID0gZnVuY3Rpb24gX2dldFByZXNlbnRLZXlIYW5kbGVyKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICAgIF9wcmVzZW50S2V5ID0gY3Vyc29yLnZhbHVlLmlkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ25vdyBrZXkgaXM6JyArICBfcHJlc2VudEtleSk7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8qIENSVUQgKi9cblxuICAvLyBnZXQgcHJlc2VudCBpZFxuICAvLyB1c2UgY2xvc3VyZSB0byBrZWVwIF9wcmVzZW50S2V5LCB5b3Ugd2lsbCBuZWVkIGl0IGluIGFkZFxuICBmdW5jdGlvbiBnZXROZXdEYXRhS2V5KCkge1xuICAgIF9wcmVzZW50S2V5ICs9IDE7XG5cbiAgICByZXR1cm4gX3ByZXNlbnRLZXk7XG4gIH1cblxuICAvLyBDcmVhdGUgXG5cbiAgZnVuY3Rpb24gYWRkKG5ld0RhdGEsIGNhbGxiYWNrLCBjYWxsYmFja1BhcmFBcnIpIHtcbiAgICB2YXIgc3RvcmVIYW5kZXIgPSBfdHJhbnNhY3Rpb25IYW5kbGVyKHRydWUpO1xuICAgIHZhciBhZGRPcHQgPSBzdG9yZUhhbmRlci5hZGQobmV3RGF0YSk7XG5cbiAgICBhZGRPcHQub25lcnJvciA9IGZ1bmN0aW9uIGVycm9yKCkge1xuICAgICAgY29uc29sZS5sb2coJ1BpdHksIGZhaWxlZCB0byBhZGQgb25lIGRhdGEgdG8gaW5kZXhlZERCJyk7XG4gICAgfTtcbiAgICBhZGRPcHQub25zdWNjZXNzID0gZnVuY3Rpb24gc3VjY2VzcygpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdCcmF2bywgc3VjY2VzcyB0byBhZGQgb25lIGRhdGEgdG8gaW5kZXhlZERCJyk7XG4gICAgICBpZiAoY2FsbGJhY2spIHsgLy8gaWYgaGFzIGNhbGxiYWNrIGJlZW4gaW5wdXQsIGV4ZWN1dGUgaXQgXG4gICAgICAgIF9jYWxsYmFja0hhbmRsZXIoY2FsbGJhY2ssIG5ld0RhdGEsIGNhbGxiYWNrUGFyYUFycik7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8vIFJldHJpZXZlXG5cbiAgLy8gcmV0cmlldmUgb25lIGRhdGFcbiAgZnVuY3Rpb24gZ2V0KGtleSwgY2FsbGJhY2ssIGNhbGxiYWNrUGFyYUFycikge1xuICAgIHZhciBzdG9yZUhhbmRlciA9IF90cmFuc2FjdGlvbkhhbmRsZXIoZmFsc2UpO1xuICAgIHZhciBnZXREYXRhS2V5ID0gc3RvcmVIYW5kZXIuZ2V0KGtleSk7ICAvLyBnZXQgaXQgYnkgaW5kZXhcblxuICAgIGdldERhdGFLZXkub25lcnJvciA9IGZ1bmN0aW9uIGdldERhdGFFcnJvckhhbmRsZXIoKSB7XG4gICAgICBjb25zb2xlLmxvZygnUGl0eSwgZ2V0IChrZXk6JyArIGtleSArICdcXCcpcyBkYXRhJyArICcgZmFpbGQnKTtcbiAgICB9O1xuICAgIGdldERhdGFLZXkub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0RGF0YVN1Y2Nlc3NIYW5kbGVyKCkge1xuICAgICAgY29uc29sZS5sb2coJ0dyZWF0LCBnZXQgKGtleTonICsga2V5ICsgJ1xcJylzIGRhdGEgc3VjY2VlZCcpO1xuICAgICAgX2NhbGxiYWNrSGFuZGxlcihjYWxsYmFjaywgZ2V0RGF0YUtleS5yZXN1bHQsIGNhbGxiYWNrUGFyYUFycik7XG4gICAgfTtcbiAgfVxuXG4gIC8vIHJldHJpZXZlIGVsaWdpYmxlIGRhdGEgKGJvb2xlYW4gY29uZGl0aW9uKVxuICBmdW5jdGlvbiBnZXRXaGV0aGVyKHdoZXRoZXIsIGNvbmRpdGlvbiwgY2FsbGJhY2ssIGNhbGxiYWNrUGFyYUFycikge1xuICAgIHZhciBzdG9yZUhhbmRlciA9IF90cmFuc2FjdGlvbkhhbmRsZXIodHJ1ZSk7XG4gICAgdmFyIHJhbmdlID0gX3JhbmdlVG9BbGwoKTtcbiAgICB2YXIgcmVzdWx0ID0gW107IC8vIHVzZSBhbiBhcnJheSB0byBzdG9yYWdlIGVsaWdpYmxlIGRhdGFcblxuICAgIHN0b3JlSGFuZGVyLm9wZW5DdXJzb3IocmFuZ2UsICduZXh0Jykub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0V2hldGhlckhhbmRsZXIoZSkge1xuICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICBpZiAod2hldGhlcikge1xuICAgICAgICAgIGlmIChjdXJzb3IudmFsdWVbY29uZGl0aW9uXSkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goY3Vyc29yLnZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIXdoZXRoZXIpIHtcbiAgICAgICAgICBpZiAoIWN1cnNvci52YWx1ZVtjb25kaXRpb25dKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChjdXJzb3IudmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF9jYWxsYmFja0hhbmRsZXIoY2FsbGJhY2ssIHJlc3VsdCwgY2FsbGJhY2tQYXJhQXJyKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLy8gcmV0cmlldmUgYWxsXG4gIGZ1bmN0aW9uIGdldEFsbChjYWxsYmFjaywgY2FsbGJhY2tQYXJhQXJyKSB7XG4gICAgdmFyIHN0b3JlSGFuZGVyID0gX3RyYW5zYWN0aW9uSGFuZGxlcih0cnVlKTtcbiAgICB2YXIgcmFuZ2UgPSBfcmFuZ2VUb0FsbCgpO1xuICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgIHN0b3JlSGFuZGVyLm9wZW5DdXJzb3IocmFuZ2UsICduZXh0Jykub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0QWxsSGFuZGxlcihlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGN1cnNvci52YWx1ZSk7XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX2NhbGxiYWNrSGFuZGxlcihjYWxsYmFjaywgcmVzdWx0LCBjYWxsYmFja1BhcmFBcnIpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyBVcGRhdGUgb25lXG4gIGZ1bmN0aW9uIHVwZGF0ZShuZXdEYXRhLCBjYWxsYmFjaywgY2FsbGJhY2tQYXJhQXJyKSB7XG4gICAgdmFyIHN0b3JlSGFuZGVyID0gX3RyYW5zYWN0aW9uSGFuZGxlcih0cnVlKTtcbiAgICB2YXIgcHV0U3RvcmUgPSBzdG9yZUhhbmRlci5wdXQobmV3RGF0YSk7XG5cbiAgICBwdXRTdG9yZS5vbmVycm9yID0gZnVuY3Rpb24gdXBkYXRlRXJyb3JIYW5kbGVyKCkge1xuICAgICAgY29uc29sZS5sb2coJ1BpdHksIG1vZGlmeSBmYWlsZWQnKTtcbiAgICB9O1xuICAgIHB1dFN0b3JlLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIHVwZGF0ZVN1Y2Nlc3NIYW5kbGVyKCkge1xuICAgICAgY29uc29sZS5sb2coJ0FoYSwgbW9kaWZ5IHN1Y2NlZWQnKTtcbiAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICBfY2FsbGJhY2tIYW5kbGVyKGNhbGxiYWNrLCBuZXdEYXRhLCBjYWxsYmFja1BhcmFBcnIpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyBEZWxldGUgXG5cbiAgLy8gZGVsZXRlIG9uZVxuICBmdW5jdGlvbiBkZWxldGVPbmUoa2V5LCBjYWxsYmFjaywgY2FsbGJhY2tQYXJhQXJyKSB7XG4gICAgdmFyIHN0b3JlSGFuZGVyID0gX3RyYW5zYWN0aW9uSGFuZGxlcih0cnVlKTtcbiAgICB2YXIgZGVsZXRlT3B0ID0gc3RvcmVIYW5kZXIuZGVsZXRlKGtleSk7IC8vIOWwhuW9k+WJjemAieS4rWxp55qE5pWw5o2u5LuO5pWw5o2u5bqT5Lit5Yig6ZmkXG5cbiAgICBkZWxldGVPcHQub25lcnJvciA9IGZ1bmN0aW9uIGRlbGV0ZUVycm9ySGFuZGxlcigpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdkZWxldGUgKGtleTonICsga2V5ICsgJ1xcJylzIHZhbHVlIGZhaWxkJyk7XG4gICAgfTtcbiAgICBkZWxldGVPcHQub25zdWNjZXNzID0gZnVuY3Rpb24gZGVsZXRlU3VjY2Vzc0hhbmRsZXIoKSB7XG4gICAgICBjb25zb2xlLmxvZygnZGVsZXRlIChrZXk6ICcgKyBrZXkgKyAgJ1xcJylzIHZhbHVlIHN1Y2NlZWQnKTtcbiAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICBfY2FsbGJhY2tIYW5kbGVyKGNhbGxiYWNrLCBrZXksIGNhbGxiYWNrUGFyYUFycik7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8vIGNsZWFyXG4gIGZ1bmN0aW9uIGNsZWFyKGNhbGxiYWNrLCBjYWxsYmFja1BhcmFBcnIpIHtcbiAgICB2YXIgc3RvcmVIYW5kZXIgPSBfdHJhbnNhY3Rpb25IYW5kbGVyKHRydWUpO1xuICAgIHZhciByYW5nZSA9IF9yYW5nZVRvQWxsKCk7XG5cbiAgICBzdG9yZUhhbmRlci5vcGVuQ3Vyc29yKHJhbmdlLCAnbmV4dCcpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGNsZWFySGFuZGxlcihlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgdmFyIHJlcXVlc3REZWw7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgcmVxdWVzdERlbCA9IGN1cnNvci5kZWxldGUoKTtcbiAgICAgICAgcmVxdWVzdERlbC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBzdWNjZXNzKCkge1xuICAgICAgICB9O1xuICAgICAgICByZXF1ZXN0RGVsLm9uZXJyb3IgPSBmdW5jdGlvbiBlcnJvcigpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnUGl0eSwgZGVsZXRlIGFsbCBkYXRhIGZhaWxkJyk7XG4gICAgICAgIH07XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfSBlbHNlIGlmIChjYWxsYmFjaykge1xuICAgICAgICBfY2FsbGJhY2tIYW5kbGVyKGNhbGxiYWNrLCAnYWxsIGRhdGEnLCBjYWxsYmFja1BhcmFBcnIpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKiAzIHByaXZhdGUgbWV0aG9kcyAqL1xuXG4gIGZ1bmN0aW9uIF90cmFuc2FjdGlvbkhhbmRsZXIod2hldGhlcldyaXRlKSB7XG4gICAgdmFyIHRyYW5zYWN0aW9uO1xuXG4gICAgaWYgKHdoZXRoZXJXcml0ZSkge1xuICAgICAgdHJhbnNhY3Rpb24gPSBfZGJSZXN1bHQudHJhbnNhY3Rpb24oW19zdG9yZU5hbWVdLCAncmVhZHdyaXRlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRyYW5zYWN0aW9uID0gX2RiUmVzdWx0LnRyYW5zYWN0aW9uKFtfc3RvcmVOYW1lXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKF9zdG9yZU5hbWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3JhbmdlVG9BbGwoKSB7XG4gICAgcmV0dXJuIElEQktleVJhbmdlLmxvd2VyQm91bmQoMCwgdHJ1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBfY2FsbGJhY2tIYW5kbGVyKGNhbGxiYWNrLCByZXN1bHQsIGNhbGxiYWNrUGFyYUFycikge1xuICAgIGlmIChjYWxsYmFja1BhcmFBcnIpIHtcbiAgICAgIGNhbGxiYWNrUGFyYUFyci51bnNoaWZ0KHJlc3VsdCk7XG4gICAgICBjYWxsYmFjay5hcHBseShudWxsLCBjYWxsYmFja1BhcmFBcnIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYWxsYmFjayhyZXN1bHQpO1xuICAgIH1cbiAgfVxuXG4gIC8qIHB1YmxpYyBpbnRlcmZhY2UgKi9cbiAgcmV0dXJuIHtcbiAgICBpbml0OiBpbml0LFxuICAgIGdldE5ld0RhdGFLZXk6IGdldE5ld0RhdGFLZXksXG4gICAgYWRkOiBhZGQsXG4gICAgZ2V0OiBnZXQsXG4gICAgZ2V0V2hldGhlcjogZ2V0V2hldGhlcixcbiAgICBnZXRBbGw6IGdldEFsbCxcbiAgICB1cGRhdGU6IHVwZGF0ZSxcbiAgICBkZWxldGU6IGRlbGV0ZU9uZSxcbiAgICBjbGVhcjogY2xlYXJcbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gaW5kZXhlZERCSGFuZGxlcjtcbiIsInZhciBjcmVhdGVOb2RlID0gKGZ1bmN0aW9uIG5vZGUoKSB7XG4gIGZ1bmN0aW9uIF9kZWNvcmF0ZUxpKGxpLCBkYXRhKSB7XG4gICAgdmFyIHRleHREYXRlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YS51c2VyRGF0ZSArICc6ICcpO1xuICAgIHZhciB0ZXh0V3JhcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcgJyArIGRhdGEuZXZlbnQpO1xuXG4gICAgLy8gd3JhcCBhcyBhIG5vZGVcbiAgICB0ZXh0V3JhcC5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICBsaS5hcHBlbmRDaGlsZCh0ZXh0RGF0ZSk7XG4gICAgbGkuYXBwZW5kQ2hpbGQodGV4dFdyYXApO1xuICAgIGlmIChkYXRhLmZpbmlzaGVkKSB7ICAvLyBhZGQgY3NzLXN0eWxlIHRvIGl0IChhY2NvcmRpbmcgdG8gaXQncyBkYXRhLmZpbmlzaGVkIHZhbHVlKVxuICAgICAgbGkuY2xhc3NMaXN0LmFkZCgnY2hlY2tlZCcpOyAvLyBhZGQgc3R5bGVcbiAgICB9XG4gICAgX2FkZFgobGksIGRhdGEuaWQpOyAvLyBhZGQgc3BhbiBbeF0gdG8gbGkncyB0YWlsXG4gICAgX3NldERhdGFQcm9wZXJ0eShsaSwgJ2RhdGEtaWQnLCBkYXRhLmlkKTsgLy8gYWRkIHByb3BlcnR5IHRvIGxpIChkYXRhLWlkKe+8jGZvciAgY2xpY2tMaVxuICB9XG5cbiAgZnVuY3Rpb24gX2FkZFgobGksIGlkKSB7XG4gICAgdmFyIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgdmFyIHggPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnXFx1MDBENycpOyAvLyB1bmljb2RlIC0+IHhcblxuICAgIHNwYW4uYXBwZW5kQ2hpbGQoeCk7XG4gICAgc3Bhbi5jbGFzc05hbWUgPSAnY2xvc2UnOyAvLyBhZGQgc3R5bGVcbiAgICBfc2V0RGF0YVByb3BlcnR5KHNwYW4sICdkYXRhLXgnLCBpZCk7IC8vIGFkZCBwcm9wZXJ0eSB0byBzcGFuIChkYXRhLXgpLCBmb3IgZGVsZXRlTGlcbiAgICBsaS5hcHBlbmRDaGlsZChzcGFuKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zZXREYXRhUHJvcGVydHkodGFyZ2V0LCBuYW1lLCBkYXRhKSB7XG4gICAgdGFyZ2V0LnNldEF0dHJpYnV0ZShuYW1lLCBkYXRhKTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiBjcmVhdGUoZGF0YSkge1xuICAgIHZhciBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG5cbiAgICBfZGVjb3JhdGVMaShsaSwgZGF0YSk7IC8vIGRlY29yYXRlIGxpXG5cbiAgICByZXR1cm4gbGk7XG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZU5vZGU7XG4iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiBkYkNvbmZpZ0dlbmVyYXRvcigpIHtcbiAgdmFyIGRiQ29uZmlnID0ge1xuICAgIG5hbWU6ICdqdXN0VG9EbycsXG4gICAgdmVyc2lvbjogJzYnLFxuICAgIGtleTogJ2lkJyxcbiAgICBzdG9yZU5hbWU6ICd1c2VyJ1xuICB9O1xuICBkYkNvbmZpZy5kYXRhRGVtbyA9IHtcbiAgICBpZDogMCxcbiAgICBldmVudDogMCxcbiAgICBmaW5pc2hlZDogdHJ1ZSxcbiAgICBkYXRlOiAwXG4gIH07XG5cbiAgcmV0dXJuIGRiQ29uZmlnO1xufSgpKTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBldmVudEhhbmRsZXIgPSAoZnVuY3Rpb24gaGFuZGxlckdlbmVyYXRvcigpIHtcbiAgdmFyIERCID0gcmVxdWlyZSgnaW5kZXhlZGRiLWNydWQnKTtcbiAgdmFyIHNob3cgPSByZXF1aXJlKCcuL3Nob3cuanMnKTtcbiAgdmFyIGNyZWF0ZU5vZGUgPSByZXF1aXJlKCcuL2NyZWF0ZU5vZGUnKTtcblxuICAvKiBhZGQgZXZlbnQgaGFuZGxlciAqL1xuICBmdW5jdGlvbiBhZGQoKSB7XG4gICAgdmFyIGlucHV0VmFsdWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5wdXQnKS52YWx1ZTtcbiAgICB2YXIgcGFyZW50O1xuICAgIHZhciBuZXdEYXRhO1xuICAgIHZhciBuZXdOb2RlO1xuXG4gICAgaWYgKGlucHV0VmFsdWUgPT09ICcnKSB7XG4gICAgICBhbGVydCgncGxlYXNlIGlucHV0IGEgcmVhbCBkYXRhficpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBfaWZFbXB0eSgpO1xuICAgIG5ld0RhdGEgPSBfaW50ZWdyYXRlTmV3RGF0YShpbnB1dFZhbHVlKTtcbiAgICBuZXdOb2RlID0gY3JlYXRlTm9kZShuZXdEYXRhKTtcbiAgICBwYXJlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgIHBhcmVudC5pbnNlcnRCZWZvcmUobmV3Tm9kZSwgcGFyZW50LmZpcnN0Q2hpbGQpOyAvLyBwdXNoIG5ld05vZGUgdG8gZmlyc3RcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5wdXQnKS52YWx1ZSA9ICcnOyAgLy8gcmVzZXQgaW5wdXQncyB2YWx1ZXNcbiAgICBEQi5hZGQobmV3RGF0YSk7XG5cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9pZkVtcHR5KCkge1xuICAgIGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmNsYXNzTmFtZSA9PT0gJ2FwaG9yaXNtJykge1xuICAgICAgc2hvdy5yYW5kb20oKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfaW50ZWdyYXRlTmV3RGF0YSh2YWx1ZSkge1xuICAgIHJldHVybiB7XG4gICAgICBpZDogREIuZ2V0TmV3RGF0YUtleSgpLFxuICAgICAgZXZlbnQ6IHZhbHVlLFxuICAgICAgZmluaXNoZWQ6IGZhbHNlLFxuICAgICAgdXNlckRhdGU6IF9nZXROZXdEYXRlKCd5eXl55bm0TU3mnIhkZOaXpSBoaDptbScpXG4gICAgfTtcbiAgfVxuXG4gIC8vIEZvcm1hdCBkYXRlXG4gIGZ1bmN0aW9uIF9nZXROZXdEYXRlKGZtdCkge1xuICAgIHZhciBuZXdEYXRlID0gbmV3IERhdGUoKTtcbiAgICB2YXIgbmV3Zm10ID0gZm10O1xuICAgIHZhciBvID0ge1xuICAgICAgJ3krJzogbmV3RGF0ZS5nZXRGdWxsWWVhcigpLFxuICAgICAgJ00rJzogbmV3RGF0ZS5nZXRNb250aCgpICsgMSxcbiAgICAgICdkKyc6IG5ld0RhdGUuZ2V0RGF0ZSgpLFxuICAgICAgJ2grJzogbmV3RGF0ZS5nZXRIb3VycygpLFxuICAgICAgJ20rJzogbmV3RGF0ZS5nZXRNaW51dGVzKClcbiAgICB9O1xuICAgIHZhciBsZW5zO1xuXG4gICAgZm9yICh2YXIgayBpbiBvKSB7XG4gICAgICBpZiAobmV3IFJlZ0V4cCgnKCcgKyBrICsgJyknKS50ZXN0KG5ld2ZtdCkpIHtcbiAgICAgICAgaWYgKGsgPT09ICd5KycpIHtcbiAgICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsICgnJyArIG9ba10pLnN1YnN0cig0IC0gUmVnRXhwLiQxLmxlbmd0aCkpO1xuICAgICAgICB9IGVsc2UgaWYgKGsgPT09ICdTKycpIHtcbiAgICAgICAgICBsZW5zID0gUmVnRXhwLiQxLmxlbmd0aDtcbiAgICAgICAgICBsZW5zID0gbGVucyA9PT0gMSA/IDMgOiBsZW5zO1xuICAgICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKCcwMCcgKyBvW2tdKS5zdWJzdHIoKCcnICsgb1trXSkubGVuZ3RoIC0gMSwgbGVucykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKFJlZ0V4cC4kMS5sZW5ndGggPT09IDEpID8gKG9ba10pIDogKCgnMDAnICsgb1trXSkuc3Vic3RyKCgnJyArIG9ba10pLmxlbmd0aCkpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZXdmbXQ7XG4gIH1cblxuICAvKiBlbnRlcidzIGFkZCAqL1xuICBmdW5jdGlvbiBlbnRlckFkZChlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgIGFkZCgpO1xuICAgIH1cbiAgfVxuXG5cbiAgLyogbGkncyBbeF0ncyBkZWxldGUgKi9cbiAgLy8gdXNlIGV2ZW50LWRlbGVnYXRpb25cbiAgZnVuY3Rpb24gZGVsZXRlTGkoZSkge1xuICAgIHZhciBpZDtcblxuICAgIGlmIChlLnRhcmdldC5jbGFzc05hbWUgPT09ICdjbG9zZScpIHtcbiAgICAgIC8vIHVzZSBwcmV2aW91c2x5IHN0b3JlZCBkYXRhXG4gICAgICBpZCA9IHBhcnNlSW50KGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS14JyksIDEwKTsgLy8gI1RPRE86IERvZXMgcGFyZW50Tm9kZSBjYW4gZG8gdGhpcz9cbiAgICAgIERCLmRlbGV0ZShpZCwgc2hvdy5hbGwpOyAvLyBkZWxldGUgaW4gREIgYW5kIHNob3cgbGlzdCBhZ2FpblxuICAgIH1cbiAgfVxuXG5cbiAgLyogY2xlYXIgKi9cbiAgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgc2hvdy5jbGVhcigpOyAvLyBjbGVhciBub2RlcyB2aXN1YWxseVxuICAgIERCLmNsZWFyKCk7IC8vIGNsZWFyIGRhdGEgaW5kZWVkXG4gIH1cblxuICAvKiBzaG93IGRvbmUgJiBzaG93IHRvZG8gKi9cbiAgZnVuY3Rpb24gc2hvd0RvbmUoKSB7XG4gICAgX3Nob3dXaGV0aGVyRG9uZSh0cnVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dUb2RvKCkge1xuICAgIF9zaG93V2hldGhlckRvbmUoZmFsc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3Nob3dXaGV0aGVyRG9uZSh3aGV0aGVyKSB7XG4gICAgdmFyIGNvbmRpdGlvbiA9ICdmaW5pc2hlZCc7IC8vIHNldCAnZmluaXNoZWQnIGFzIGNvbmRpdGlvblxuXG4gICAgREIuZ2V0V2hldGhlcih3aGV0aGVyLCBjb25kaXRpb24sIHNob3cuYWxsKTsgLy8gcGFzcyByZWZyZXNoIGFzIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAgY29uc29sZS5sb2coJ0FoYSwgc2hvdyBkYXRhIHN1Y2NlZWQnKTtcbiAgfVxuXG5cbiAgLyogbGkgKi9cbiAgLy8gdXNlIGV2ZW50LWRlbGVnYXRpb24sIHRvb1xuICBmdW5jdGlvbiBjbGlja0xpKGUpIHtcbiAgICB2YXIgdGFyZ2V0TGkgPSBlLnRhcmdldDtcbiAgICB2YXIgaWQ7XG5cbiAgICBpZiAodGFyZ2V0TGkuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJykpIHtcbiAgICAgIGlkID0gcGFyc2VJbnQodGFyZ2V0TGkuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyksIDEwKTsgLy8gdXNlIHByZXZpb3VzbHkgc3RvcmVkIGRhdGFcbiAgICAgIERCLmdldChpZCwgX3N3aXRjaExpLCBbdGFyZ2V0TGldKTsgLy8gcGFzcyBfc3dpdGNoTGkgYW5kIHBhcmFtIFtlLnRhcmdldF0gYXMgY2FsbGJhY2tcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfc3dpdGNoTGkoZGF0YSwgdGFyZ2V0TGkpIHtcbiAgICB0YXJnZXRMaS5maW5pc2hlZCA9ICFkYXRhLmZpbmlzaGVkO1xuICAgIGlmICh0YXJnZXRMaS5maW5pc2hlZCkge1xuICAgICAgdGFyZ2V0TGkuY2xhc3NMaXN0LmFkZCgnY2hlY2tlZCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0YXJnZXRMaS5jbGFzc0xpc3QucmVtb3ZlKCdjaGVja2VkJyk7XG4gICAgfVxuICAgIGRhdGEuZmluaXNoZWQgPSB0YXJnZXRMaS5maW5pc2hlZDsgIC8vIHRvZ2dsZSBkYXRhLmZpbmlzaGVkXG4gICAgREIudXBkYXRlKGRhdGEsIHNob3cuYWxsKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYWRkOiBhZGQsXG4gICAgZW50ZXI6IGVudGVyQWRkLFxuICAgIGRlbGV0ZTogZGVsZXRlTGksXG4gICAgY2xlYXI6IGNsZWFyLFxuICAgIHNob3dEb25lOiBzaG93RG9uZSxcbiAgICBzaG93VG9kbzogc2hvd1RvZG8sXG4gICAgbGk6IGNsaWNrTGlcbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZXZlbnRIYW5kbGVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuKGZ1bmN0aW9uIGluaXQoKSB7XG4gIHZhciBEQiA9IHJlcXVpcmUoJ2luZGV4ZWRkYi1jcnVkJyk7XG4gIHZhciBkYkNvbmZpZyA9IHJlcXVpcmUoJy4vZGJDb25maWcuanMnKTtcbiAgdmFyIGhhbmRsZXIgPSByZXF1aXJlKCcuL2V2ZW50SGFuZGxlci5qcycpO1xuICB2YXIgc2hvdyA9IHJlcXVpcmUoJy4vc2hvdy5qcycpO1xuXG4gIC8vIG9wZW4gREIsIGFuZCB3aGVuIERCIG9wZW4gc3VjY2VlZCwgaW52b2tlIGluaXRpYWwgZnVuY3Rpb25cbiAgREIuaW5pdChkYkNvbmZpZywgYWRkRXZlbnRMaXN0ZW5lcnMpO1xuXG4gIC8vIHdoZW4gZGIgaXMgb3BlbmVkIHN1Y2NlZWQsIGFkZCBFdmVudExpc3RlbmVyc1xuICBmdW5jdGlvbiBhZGRFdmVudExpc3RlbmVycygpIHtcbiAgICB2YXIgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG5cbiAgICBzaG93LmluaXQoREIpO1xuICAgIC8vIGFkZCBhbGwgZXZlbnRMaXN0ZW5lclxuICAgIGxpc3QuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLmxpLCBmYWxzZSk7XG4gICAgbGlzdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuZGVsZXRlLCBmYWxzZSk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FkZCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5hZGQsIGZhbHNlKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlci5lbnRlciwgZmFsc2UpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNkb25lJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dEb25lLCBmYWxzZSk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3RvZG8nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd1RvRG8sIGZhbHNlKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvdycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93LCBmYWxzZSk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NsZWFyJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLmNsZWFyLCBmYWxzZSk7XG4gIH1cbn0oKSk7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgc2hvdyA9IChmdW5jdGlvbiBzaG93R2VuZXJhdG9yKCkge1xuICB2YXIgY3JlYXRlTm9kZSA9IHJlcXVpcmUoJy4vY3JlYXRlTm9kZS5qcycpO1xuXG4gIC8vIGluaXQgc2hvd1xuICBmdW5jdGlvbiBpbml0KGRiKSB7XG4gICAgY2xlYXIoKTtcbiAgICBkYi5nZXRBbGwoX3JlZnJlc2hJbml0KTtcbiAgfVxuXG4gIC8vIGNsZWFyIGFsbCBub2RlcyAoanVzdCBjbGVhciBET00sIG5vdCBkYilcbiAgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgdmFyIHJvb3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gICAgd2hpbGUgKHJvb3QuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICByb290LnJlbW92ZUNoaWxkKHJvb3QuZmlyc3RDaGlsZCk7IC8vIHRoZSBiZXN0IHdheSB0byBjbGVhbiBjaGlsZE5vZGVzXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX3JlZnJlc2hJbml0KGRhdGFBcnIpIHtcbiAgICBfcmVmcmVzaChkYXRhQXJyLCBfaW5pdFNlbnRlbmNlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9yZWZyZXNoKGRhdGFBcnIsIHNlbnRlbmNlRnVuYykge1xuICAgIGlmIChkYXRhQXJyLmxlbmd0aCA9PT0gMCkge1xuICAgICAgc2VudGVuY2VGdW5jKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIF9yZWZyZXNoUGFydChkYXRhQXJyKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfaW5pdFNlbnRlbmNlKCkge1xuICAgIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJ1dlbGNvbWV+LCB0cnkgdG8gYWRkIHlvdXIgZmlyc3QgdG8tZG8gbGlzdCA6ICknKTtcblxuICAgIF9zZW50ZW5jZUdlbmVyYXRvcih0ZXh0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zZW50ZW5jZUdlbmVyYXRvcih0ZXh0KSB7XG4gICAgdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcblxuICAgIGxpLmFwcGVuZENoaWxkKHRleHQpO1xuICAgIGxpLmNsYXNzTmFtZSA9ICdhcGhvcmlzbSc7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5hcHBlbmRDaGlsZChsaSk7XG4gIH1cblxuICBmdW5jdGlvbiBfcmVmcmVzaFBhcnQoZGF0YUFycikge1xuICAgIC8vIHVzZSBmcmFnbWVudCB0byByZWR1Y2UgRE9NIG9wZXJhdGVcbiAgICB2YXIgdW5maXNoaWVkID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIHZhciBmaW5pc2hlZCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB2YXIgZnVzaW9uID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgLy8gcHV0IHRoZSBmaW5pc2hlZCBpdGVtIHRvIHRoZSBib3R0b21cbiAgICBkYXRhQXJyLmZvckVhY2goZnVuY3Rpb24gY2xhc3NpZnlEYXRhKGRhdGEpIHtcbiAgICAgIGlmIChkYXRhLmZpbmlzaGVkKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGNyZWF0ZU5vZGUoZGF0YSkpO1xuICAgICAgICBmaW5pc2hlZC5pbnNlcnRCZWZvcmUoY3JlYXRlTm9kZShkYXRhKSwgZmluaXNoZWQuZmlyc3RDaGlsZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1bmZpc2hpZWQuaW5zZXJ0QmVmb3JlKGNyZWF0ZU5vZGUoZGF0YSksIHVuZmlzaGllZC5maXJzdENoaWxkKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBmdXNpb24uYXBwZW5kQ2hpbGQodW5maXNoaWVkKTtcbiAgICBmdXNpb24uYXBwZW5kQ2hpbGQoZmluaXNoZWQpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuYXBwZW5kQ2hpbGQoZnVzaW9uKTsgLy8gYWRkIGl0IHRvIERPTVxuICAgIGNvbnNvbGUubG9nKCdyZWZyZXNoIGxpc3QsIGFuZCBzaG93IHN1Y2NlZWQnKTtcbiAgfVxuXG4gIC8vIGdldCBhbGwgZGF0YSBmcm9tIERCIGFuZCBzaG93IGl0XG4gIGZ1bmN0aW9uIGFsbChkYikge1xuICAgIGNsZWFyKCk7XG4gICAgZGIuZ2V0QWxsKF9yZWZyZXNoQWxsKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9yZWZyZXNoQWxsKGRhdGFBcnIpIHtcbiAgICBfcmVmcmVzaChkYXRhQXJyLCByYW5kb21BcGhvcmlzbSk7XG4gIH1cblxuICBmdW5jdGlvbiByYW5kb21BcGhvcmlzbSgpIHtcbiAgICB2YXIgYXBob3Jpc21zID0gW1xuICAgICAgJ1llc3RlcmRheSBZb3UgU2FpZCBUb21vcnJvdycsXG4gICAgICAnV2h5IGFyZSB3ZSBoZXJlPycsXG4gICAgICAnQWxsIGluLCBvciBub3RoaW5nJyxcbiAgICAgICdZb3UgTmV2ZXIgVHJ5LCBZb3UgTmV2ZXIgS25vdycsXG4gICAgICAnVGhlIHVuZXhhbWluZWQgbGlmZSBpcyBub3Qgd29ydGggbGl2aW5nLiAtLSBTb2NyYXRlcydcbiAgICBdO1xuICAgIHZhciByYW5kb21JbmRleCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChhcGhvcmlzbXMubGVuZ3RoICsgMSkpO1xuICAgIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoYXBob3Jpc21zW3JhbmRvbUluZGV4XSk7XG5cbiAgICBfc2VudGVuY2VHZW5lcmF0b3IodGV4dCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGluaXQ6IGluaXQsXG4gICAgYWxsOiBhbGwsXG4gICAgY2xlYXI6IGNsZWFyLFxuICAgIHJhbmRvbTogcmFuZG9tQXBob3Jpc21cbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gc2hvdztcbiJdfQ==
