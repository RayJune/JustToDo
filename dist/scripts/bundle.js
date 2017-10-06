(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
// use module pattern
var handleIndexedDB = (function handleIndexedDB() {
  // 3 private property
  var _dbResult;
  var _key;
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


  /* 3 private methods */

  function _openDB(dbConfig, callback) {
    var request = indexedDB.open(dbConfig.name, dbConfig.version); // open indexedDB

    _storeName = dbConfig.storeName;
    request.onerror = function error() {
      console.log('Pity, fail to load indexedDB');
    };
    request.onsuccess = function success(e) {
      _dbResult = e.target.result;
      getPresentKey(callback);
    };
    // When you create a new database or increase the version number of an existing database 
    // (by specifying a higher version number than you did previously, when Opening a database
    request.onupgradeneeded = function schemaChanged(e) {
      _dbResult = e.target.result;
      if (!_dbResult.objectStoreNames.contains(_storeName)) {
        // set dbConfig.key as keyPath
        var store = _dbResult.createObjectStore(_storeName, { keyPath: dbConfig.key, autoIncrement: true }); // 创建db
      }
      // add a new db demo
      store.add(dbConfig.dataDemo);
    };
  }

  function _handleTransaction(whetherWrite) {
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

  // set present key value to _key (the private property) 
  function getPresentKey(callback) {
    var storeHander = _handleTransaction(true);
    var range = IDBKeyRange.lowerBound(0);

    storeHander.openCursor(range, 'next').onsuccess = function getTheKey(e) {
      var cursor = e.target.result;

      if (cursor) {
        cursor.continue();
        _key = cursor.value.id;
      } else {
        console.log('now key is:' +  _key);
        callback();
      }
    };
  }


  /* CRUD */

  // Create 
  function add(newData, callback, callbackParaArr) {
    var storeHander = _handleTransaction(true);
    var addOpt = storeHander.add(newData);
    addOpt.onerror = function error() {
      console.log('Pity, failed to add one data to indexedDB');
    };
    addOpt.onsuccess = function success() {
      console.log('Bravo, success to add one data to indexedDB');
      if (callback) { // if has callback been input, execute it 
        if (!callbackParaArr) {
          callback();
        } else {
          callback.apply(null, callbackParaArr); // it has callback's parameters been input, get it
        }
      }
    };
  }

  // Retrieve

  // retrieve one data
  function get(key, callback, callbackParaArr) {
    var storeHander = _handleTransaction(false);
    var getDataKey = storeHander.get(key);  // get it by index

    getDataKey.onerror = function getDataKeyError() {
      console.log('Pity, get (key:' + key + '\')s data' + ' faild');
    };
    getDataKey.onsuccess = function getDataKeySuccess() {
      console.log('Great, get (key:' + key + '\')s data succeed');
      if (!callbackParaArr) {
        callback(getDataKey.result);
      } else {
        callbackParaArr.unshift(getDataKey.result);
        callback.apply(null, callbackParaArr);
      }
    };
  }

  // retrieve eligible data (boolean condition)
  function getWhether(whether, condition, callback, callbackParaArr) {
    var dataArr = []; // use an array to storage eligible data
    var storeHander = _handleTransaction(true);
    var range = _rangeToAll();

    storeHander.openCursor(range, 'next').onsuccess = function showWhetherDoneData(e) {
      var cursor = e.target.result;

      if (cursor) {
        if (whether) {
          if (cursor.value[condition]) {
            dataArr.push(cursor.value);
          }
        } else if (!whether) {
          if (!cursor.value[condition]) {
            dataArr.push(cursor.value);
          }
        }
        cursor.continue();
      } else if (!callbackParaArr) {
        callback(dataArr);  // put the eligible array to callback as parameter
      } else {
        callbackParaArr.unshift(dataArr);
        callback.apply(null, callbackParaArr);
      }
    };
  }

  // retrieve all
  function getAll(callback, callbackParaArr) {
    var storeHander = _handleTransaction(true);
    var range = _rangeToAll();
    var allDataArr = [];

    storeHander.openCursor(range, 'next').onsuccess = function getAllData(e) {
      var cursor = e.target.result;

      if (cursor) {
        allDataArr.push(cursor.value);
        cursor.continue();
      } else if (!callbackParaArr) {
        callback(allDataArr);
      } else {
        callbackParaArr.unshift(allDataArr);
        callback.apply(null, callbackParaArr);
      }
    };
  }

  // Update one
  function update(changedData, callback, callbackParaArr) {
    var storeHander = _handleTransaction(true);
    var putStore = storeHander.put(changedData);

    putStore.onerror = function putStoreError() {
      console.log('Pity, modify failed');
    };
    putStore.onsuccess = function putStoreSuccess() {
      console.log('Aha, modify succeed');
      if (callback) {
        if (!callbackParaArr) {
          callback();
        } else {
          callback.apply(null, callbackParaArr);
        }
      }
    };
  }

  // Delete 

  // delete one
  function deleteOne(key, callback, callbackParaArr) {
    var storeHander = _handleTransaction(true);
    var deleteOpt = storeHander.delete(key); // 将当前选中li的数据从数据库中删除

    deleteOpt.onerror = function error() {
      console.log('delete (key:' + key + '\')s value faild');
    };
    deleteOpt.onsuccess = function success() {
      console.log('delete (key: ' + key +  '\')s value succeed');
      if (callback) {
        if (!callbackParaArr) {
          callback();
        } else {
          callback.apply(callbackParaArr);
        }
      }
    };
  }

  // delete all
  function clear(callback, callbackParaArr) {
    var storeHander = _handleTransaction(true);
    var range = _rangeToAll();

    storeHander.openCursor(range, 'next').onsuccess = function deleteData(e) {
      var cursor = e.target.result;
      var requestDel;

      if (cursor) {
        requestDel = cursor.delete();
        requestDel.onsuccess = function success() {
          console.log('Great, delete all data succeed');
        };
        requestDel.onerror = function error() {
          console.log('Pity, delete all data faild');
        };
        cursor.continue();
      } else if (callback) {
        if (!callbackParaArr) {
          callback();
        } else {
          callback.apply(null, this);
        }
      }
    };
  }

  // get present id
  // use closure to keep _key
  function getKey() {
    _key++;
    return _key;
  }

  /* public interface */
  return {
    init: init,
    getKey: getKey,
    add: add,
    get: get,
    getWhether: getWhether,
    getAll: getAll,
    update: update,
    delete: deleteOne,
    clear: clear
  };
}());

module.exports = handleIndexedDB;

},{}],2:[function(require,module,exports){
'use strict';
(function goToDo() {
  var DB = require('indexeddb-crud'); // import module
  var dbConfig = { // config db parameters
    name: 'justToDo',
    version: '6',
    key: 'id',
    storeName: 'user'
  };
  dbConfig.dataDemo = { // config data structure
    id: 0,
    event: 0,
    finished: true,
    date: 0
  };

  // open DB, and when DB open succeed, invoke initial function
  DB.init(dbConfig, addEventListeners);


  /* common use functions */

  // handle eventListeners when db is opened succeed
  function addEventListeners() {
    var myUl = document.querySelector('#myUl');

    show(); // show data
    // add all eventListener
    myUl.addEventListener('click', handleLiClickDelegation, false);
    myUl.addEventListener('click', handleXClickDelagation, false);
    document.querySelector('#add').addEventListener('click', addList, false);
    document.addEventListener('keydown', handleEnterEvent, true);
    document.querySelector('#done').addEventListener('click', showDone, false);
    document.querySelector('#todo').addEventListener('click', showTodo, false);
    document.querySelector('#all').addEventListener('click', show, false);
    document.querySelector('#clear').addEventListener('click', clear, false);
  }

  // get all data from DB and show it
  function show() {
    resetNodes(); // reset dom first
    DB.getAll(refreshNodes); // pass callback to it
  }

  // reset all nodes (just reset dom tempory, not db)
  function resetNodes() {
    var root = document.querySelector('#myUl');

    while (root.hasChildNodes()) {
      root.removeChild(root.firstChild); // this is the best way to clean childNodes
    }
  }

  // refresh lists of node, and show it
  function refreshNodes(dataArr) {
    // use fragment to reduce DOM operating
    var fragmentUnfishied = document.createDocumentFragment();
    var fragmentFinished = document.createDocumentFragment();
    var fragment = document.createDocumentFragment();

    // put the finished item to the bottom
    dataArr.map(function manageData(data) {
      if (data.finished) {
        fragmentFinished.insertBefore(refreshOneNode(data), fragmentFinished.firstChild);
      } else {
        fragmentUnfishied.insertBefore(refreshOneNode(data), fragmentUnfishied.firstChild);
      }
    });

    fragment.appendChild(fragmentUnfishied);
    fragment.appendChild(fragmentFinished);
    // operate DOM
    document.querySelector('#myUl').appendChild(fragment);
    console.log('Refresh list, and show succeed');
  }

  // accept a data, and return a li node
  function refreshOneNode(data) {
    var li = document.createElement('li');
    var textDate = document.createTextNode(data.userDate + ': ');
    var textWrap = document.createElement('span');
    var text = document.createTextNode(' ' + data.event);

    // wrap node
    textWrap.appendChild(text);
    li.appendChild(textDate);
    li.appendChild(textWrap);
    // add span [x] to li's tail
    addX(li, data.id);
    // decorate li
    decorateLi(li, data.finished, data.id);

    return li; // return a node
  }

  // add span [x] to li's tail
  function addX(li, id) {
    var span = document.createElement('span');
    var x = document.createTextNode('\u00D7'); // unicode -> x

    span.appendChild(x);
    // add style
    span.className = 'close';
    // add property to span (data-x), for handleXClickDelagation
    span.setAttribute('data-x', id);
    li.appendChild(span);
  }

  function decorateLi(li, finished, id) {
    // add css-style to it (according to it's data.finished value)
    if (finished) {
      li.classList.add('checked');
    }
    // add property to li (data-id)，for  handleLiClickDelegation
    li.setAttribute('data-id', id);
  }


  /* add's event handler */

  // add one new list
  function addList() {
    var inputValue = document.querySelector('#myInput').value;
    var parent = document.querySelector('#myUl');
    var newNodeData;
    var newNode;

    if (inputValue === '') {
      alert('please input a real data~');
      return false;
    }
    newNodeData = integrateNewNodeData(inputValue); // integrate a NewNode data
    newNode = refreshOneNode(newNodeData);  // generate a new li node
    parent.insertBefore(newNode, parent.firstChild);
    DB.add(newNodeData);  // add to DB
    inputValue = '';

    return 0;
  }

  function integrateNewNodeData(value) {
    // return integrated data
    return {
      id: DB.getKey(),
      event: value,
      finished: false,
      userDate: getNewDate('yyyy年MM月dd日 hh:mm')
    };
  }


  /* enter's event handler */

  function handleEnterEvent(e) {
    if (e.keyCode === 13) {
      addList();
    }
  }


  /* li's event handler */

  // use event-delegation
  function handleLiClickDelegation(e) {
    var thisLi = e.target;
    var dataId;

    if (thisLi.getAttribute('data-id')) {
      // use previously stored data
      dataId = parseInt(thisLi.getAttribute('data-id'), 10);
      DB.get(dataId, switchLi, [thisLi]); // pass switchLi and param [thisLi] as callback
    }
  }

  function switchLi(data, thisLi) {
    thisLi.finished = !data.finished; // switch
    if (thisLi.finished) {
      thisLi.classList.add('checked');
    } else {
      thisLi.classList.remove('checked');
    }
    data.finished = thisLi.finished;  // toggle

    DB.update(data, show); // update DB
  }


  /* [x]'s event handler */

  // use event-delegation, too
  function handleXClickDelagation(e) {
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

    resetNodes(); // reset nodes firstly
    DB.getWhether(whether, condition, refreshNodes); // pass callback function
    console.log('Aha, show data succeed');
  }

  // show item done
  function showDone() {
    showWhetherDone(true);
  }

  // show item todo
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
