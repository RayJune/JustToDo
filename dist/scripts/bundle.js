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
'use strict';
(function goToDo() {
  var DB = require('indexeddb-crud'); // import module
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

  // open DB, and when DB open succeed, invoke initial function
  DB.init(dbConfig, addEventListeners);


  /* common functions */

  // when db is opened succeed, add EventListeners
  function addEventListeners() {
    var myUl = document.querySelector('#myUl');

    show();
    // add all eventListener
    myUl.addEventListener('click', liClickDelegationHandler, false);
    myUl.addEventListener('click', xClickDelagationHandler, false);
    document.querySelector('#add').addEventListener('click', addList, false);
    document.addEventListener('keydown', enterEventHandler, false);
    document.querySelector('#done').addEventListener('click', showDone, false);
    document.querySelector('#todo').addEventListener('click', showTodo, false);
    document.querySelector('#show').addEventListener('click', show, false);
    document.querySelector('#clear').addEventListener('click', clear, false);
  }

  // get all data from DB and show it
  function show() {
    resetNodes();
    DB.getAll(refreshNodes); // pass refreshNodes as a callback
  }

  // reset all nodes (just reset DOM, not db)
  function resetNodes() {
    var root = document.querySelector('#myUl');

    while (root.hasChildNodes()) {
      root.removeChild(root.firstChild); // this is the best way to clean childNodes
    }
  }

  function refreshNodes(dataArr) {
    // use fragment to reduce DOM operating
    var unfishiedFragment = document.createDocumentFragment();
    var finishedFragment = document.createDocumentFragment();
    var mainFragment = document.createDocumentFragment();

    // put the finished item to the bottom
    dataArr.map(function classifyData(data) {
      if (data.finished) {
        finishedFragment.insertBefore(createNode(data), finishedFragment.firstChild);
      } else {
        unfishiedFragment.insertBefore(createNode(data), unfishiedFragment.firstChild);
      }
    });
    mainFragment.appendChild(unfishiedFragment);
    mainFragment.appendChild(finishedFragment);
    document.querySelector('#myUl').appendChild(mainFragment); // add it to DOM
    console.log('Refresh list, and show succeed');
  }

  function createNode(data) {
    var li = document.createElement('li');

    decorateLi(li, data); // decorate li

    return li;
  }

  function decorateLi(li, data) {
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
    addXToLi(li, data.id); // add span [x] to li's tail
    setDataProperty(li, 'data-id', data.id); // add property to li (data-id)，for  liClickDelegationHandler
  }

  function addXToLi(li, id) {
    var span = document.createElement('span');
    var x = document.createTextNode('\u00D7'); // unicode -> x

    span.appendChild(x);
    span.className = 'close'; // add style
    setDataProperty(span, 'data-x', id); // add property to span (data-x), for xClickDelagationHandler
    li.appendChild(span);
  }

  function setDataProperty(target, name, data) {
    target.setAttribute(name, data);
  }


  /* add's event handler */

  function addList() {
    var inputValue = document.querySelector('#input').value;
    var parent;
    var newNodeData;
    var newNode;

    if (inputValue === '') {
      alert('please input a real data~');

      return false;
    }

    newNodeData = integrateNewNodeData(inputValue);
    newNode = createNode(newNodeData);
    parent = document.querySelector('#myUl');
    parent.insertBefore(newNode, parent.firstChild); // push newNode to first
    document.querySelector('#input').value = '';  // reset input's values
    DB.add(newNodeData);

    return 0;
  }

  function integrateNewNodeData(value) {
    return {
      id: DB.getNewDataKey(),
      event: value,
      finished: false,
      userDate: getNewDate('yyyy年MM月dd日 hh:mm')
    };
  }


  /* enter's event handler */

  function enterEventHandler(e) {
    if (e.keyCode === 13) {
      addList();
    }
  }


  /* li's event handler */

  // use event-delegation
  function liClickDelegationHandler(e) {
    var thisLi = e.target;
    var dataId;

    if (thisLi.getAttribute('data-id')) {
      dataId = parseInt(thisLi.getAttribute('data-id'), 10); // use previously stored data
      DB.get(dataId, switchLi, [thisLi]); // pass switchLi and param [thisLi] as callback
    }
  }

  function switchLi(data, thisLi) {
    thisLi.finished = !data.finished;
    if (thisLi.finished) {
      thisLi.classList.add('checked');
    } else {
      thisLi.classList.remove('checked');
    }
    data.finished = thisLi.finished;  // toggle data.finished
    DB.update(data, show);
  }


  /* [x]'s event handler */

  // use event-delegation, too
  function xClickDelagationHandler(e) {
    var dataId;

    if (e.target.className === 'close') {
      // use previously stored data
      dataId = parseInt(e.target.getAttribute('data-x'), 10);
      deleteList(dataId);
    }
  }

  function deleteList(dataId) {
    DB.delete(dataId, show); // delete in DB and show list again
  }


  /* show whether done event handler */

  function showWhetherDone(whether) {
    var condition = 'finished'; // set 'finished' as condition

    resetNodes();
    DB.getWhether(whether, condition, refreshNodes); // pass refreshNodes as callback function
    console.log('Aha, show data succeed');
  }

  function showDone() {
    showWhetherDone(true);
  }

  function showTodo() {
    showWhetherDone(false);
  }


  /* clear's event handler */

  function clear() {
    resetNodes(); // clear nodes visually
    DB.clear(); // clear data indeed
  }


  /* other function */

  // Format date
  function getNewDate(fmt) {
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
}());

},{"indexeddb-crud":1}]},{},[2]);
