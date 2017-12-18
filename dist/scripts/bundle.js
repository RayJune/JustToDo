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
(function init() {
  // var DB = require('indexeddb-crud');
  // var listDBConfig = require('./db/listConfig');
  var addEvents = require('./utlis/addEvents.js');

  // open DB, and when DB open succeed, invoke initial function
  // DB.init(listDBConfig, addEvents.success, addEvents.fail);
  addEvents.dbFail();
}());

},{"./utlis/addEvents.js":3}],3:[function(require,module,exports){
'use strict';
var addEvents = (function addEventsGenerator() {
  function _whetherSuccess(whetherSuccess) {
    function _whetherSuccessHandler(whether) {
      var eventHandler = require('./eventHandler/eventHandler.js');
      var handler = whether ? eventHandler.dbSuccess : eventHandler.dbFail;
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
      document.querySelector('#showClear').addEventListener('click', handler.showClear, false);
    }

    return function wrapHandler() {
      _whetherSuccessHandler(whetherSuccess);
    };
  }

  return {
    dbSuccess: _whetherSuccess(true),
    dbFail: _whetherSuccess(false)
  };
}());

module.exports = addEvents;

},{"./eventHandler/eventHandler.js":7}],4:[function(require,module,exports){
'use strict';
var createLi = (function liGenerator() {
  function _decorateLi(li, data) {
    var textDate = document.createTextNode(data.userDate + ': ');
    var textWrap = document.createElement('span');
    var text = document.createTextNode(' ' + data.event);

    // wrap as a node
    textWrap.appendChild(text);
    li.appendChild(textDate);
    li.appendChild(textWrap);
    if (data.finished) {  // add css-style to it (according to it's data.finished value)
      li.classList.add('finished'); // add style
    }
    _addX(li, data.id); // add span [x] to li's tail
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

module.exports = createLi;

},{}],5:[function(require,module,exports){
'use strict';
var dbFail = (function dbFailGenerator() {
  var refresh = require('../refresh.js');
  var createLi = require('../createLi.js');
  var general = require('./general.js');
  var _id = -1; // so the first item's id is 0

  function add() {
    var inputValue = document.querySelector('#input').value;
    var list;
    var newData;
    var newLi;

    if (inputValue === '') {
      alert('please input a real data~');
      return 0;
    }
    general.ifEmpty.removeInit();
    newData = _integrateNewData(inputValue);
    newLi = createLi(newData);
    list = document.querySelector('#list');
    list.insertBefore(newLi, list.firstChild); // push newLi to first
    document.querySelector('#input').value = '';  // reset input's values

    return 0;
  }

  function enterAdd(e) {
    if (e.keyCode === 13) {
      add();
    }
  }

  // li's [x]'s delete
  function removeLi(e) {
    var id;

    if (e.target.className === 'close') { // use event delegation
      // use previously stored data
      id = parseInt(e.target.parentNode.getAttribute('data-id'), 10);
      _traverseListItems(function disappearItem(element, index) {
        if (parseInt(element.getAttribute('data-id'), 10) === id) {
          _remove(index);
          general.ifEmpty.addRandom();
        }
      });
    }
  }

  function _traverseListItems(func) {
    Array.prototype.forEach.call(document.querySelectorAll('#list li'), func);
  }

  function _remove(index) {
    var list = document.querySelector('#list');

    list.removeChild(list.childNodes[index]);
  }

  function showInit() {
    refresh.clear();
    refresh.init();
  }

  function showAll() {
    _traverseListItems(function appearAll(element) {
      refresh.appear(element);
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

  function clickLi(e) {
    var targetLi = e.target;
    var id = parseInt(targetLi.getAttribute('data-id'), 10);
    // use event delegation

    if (id !== void 0) {
      _toggleLi(targetLi, id);
    }
  }

  function _integrateNewData(value) {
    return {
      id: (_id += 1),
      event: value,
      finished: false,
      userDate: general.getNewDate('yyyy年MM月dd日 hh:mm')
    };
  }

  function _showWhetherDone(whetherDone) {
    _traverseListItems(function whetherDoneAppear(element, index) {
      if (whetherDone) {
        element.classList.contains('finished') ? refresh.appear(element) : refresh.disappear(element);
      } else {
        element.classList.contains('finished') ? refresh.disappear(element) : refresh.appear(element);
      }
      if (element.classList.contains('finished')) {
        _remove(index);
        document.querySelector('#list').appendChild(element);
      }
    });
  }

  function _toggleLi(targetLi, id) {
    targetLi.classList.toggle('finished');
    if (targetLi.classList.contains('finished')) {
      _remove(id);
      document.querySelector('#list').appendChild(targetLi);
    }
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

},{"../createLi.js":4,"../refresh.js":9,"./general.js":8}],6:[function(require,module,exports){
'use strict';
var dbSuccess = (function dbSuccessGenerator() {
  var DB = require('indexeddb-crud');
  var refresh = require('../refresh.js');
  var createLi = require('../createLi.js');
  var general = require('./general.js');

  function add() {
    var inputValue = document.querySelector('#input').value;
    var list;
    var newData;
    var newLi;

    if (inputValue === '') {
      window.alert('please input a real data~');
      return 0;
    }
    general.ifEmpty.removeInit();
    newData = _integrateNewData(inputValue);
    newLi = createLi(newData);
    list = document.querySelector('#list');
    list.insertBefore(newLi, list.firstChild); // push newLi to first
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
  function removeLi(e) {
    var id;

    if (e.target.className === 'close') { // use event delegation
      // use previously stored data
      id = parseInt(e.target.parentNode.getAttribute('data-id'), 10);
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
      DB.getItem(id, _toggleLi, [targetLi]); // pass _toggleLi and param [e.target] as callback
    }
  }

  function _integrateNewData(value) {
    return {
      id: DB.getNewKey(),
      event: value,
      finished: false,
      userDate: general.getNewDate('yyyy年MM月dd日 hh:mm')
    };
  }

  function _showWhetherDone(whetherDone) {
    var condition = 'finished';

    refresh.clear();
    DB.getConditionItem(condition, whetherDone, refresh.part);
  }

  function _toggleLi(data, targetLi) {
    targetLi.classList.toggle('finished');
    data.finished = !data.finished;  // toggle data.finished
    DB.updateItem(data, showAll);
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

},{"../createLi.js":4,"../refresh.js":9,"./general.js":8,"indexeddb-crud":1}],7:[function(require,module,exports){
'use strict';
var eventHandler = (function handlerGenerator() {
  var dbSuccess = require('./dbSuccess.js');
  var dbFail = require('./dbFail.js');

  return {
    dbSuccess: dbSuccess,
    dbFail: dbFail
  };
}());

module.exports = eventHandler;

},{"./dbFail.js":5,"./dbSuccess.js":6}],8:[function(require,module,exports){
var general = (function generalGenerator() {
  var refresh = require('../refresh.js');

  var ifEmpty = {
    removeInit: function removeInit() {
      var list = document.querySelector('#list');

      if (list.firstChild.className === 'aphorism') {
        list.removeChild(list.firstChild);
      }
    },
    addRandom: function addRandom() {
      var list = document.querySelector('#list');

      if (list.firstChild) {
        refresh.random();
      }
    }
  };


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

  return {
    ifEmpty: ifEmpty,
    getNewDate: getNewDate
  };
}());

module.exports = general;

},{"../refresh.js":9}],9:[function(require,module,exports){
'use strict';
var refresh = (function refreshGenerator() {
  var createLi = require('./createLi.js');

  function init(dataArr) {
    _show(dataArr, _initSentence);
  }

  function all(dataArr) {
    _show(dataArr, randomAphorism);
  }

  function part(dataArr) {
    var nodes;

    if (!dataArr || dataArr.length === 0) {
      randomAphorism();
    } else {
      nodes = dataArr.reduce(function nodeGenerator(result, data) {
        result.insertBefore(createLi(data), result.firstChild);

        return result;
      }, document.createDocumentFragment()); // brilliant arr.reduce() + documentFragment

      document.querySelector('#list').appendChild(nodes); // add it to DOM
    }
  }

  function appear(element) {
    element.style.display = 'block';
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
    if (!dataArr || dataArr.length === 0) {
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
        finished.insertBefore(createLi(data), finished.firstChild);
      } else {
        unfishied.insertBefore(createLi(data), unfishied.firstChild);
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
    appear: appear,
    disappear: disappear,
    random: randomAphorism
  };
}());

module.exports = refresh;

},{"./createLi.js":4}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5kZXhlZGRiLWNydWQvaW5kZXguanMiLCJzcmMvc2NyaXB0cy9tYWluLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvYWRkRXZlbnRzLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvY3JlYXRlTGkuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9ldmVudEhhbmRsZXIvZGJGYWlsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZXZlbnRIYW5kbGVyL2RiU3VjY2Vzcy5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2V2ZW50SGFuZGxlci9ldmVudEhhbmRsZXIuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9ldmVudEhhbmRsZXIvZ2VuZXJhbC5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL3JlZnJlc2guanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG4vLyB1c2UgbW9kdWxlIHBhdHRlcm5cbnZhciBpbmRleGVkREJIYW5kbGVyID0gKGZ1bmN0aW9uIGluZGV4ZWREQkhhbmRsZXIoKSB7XG4gIC8vIDUgcHJpdmF0ZSBwcm9wZXJ0eVxuICB2YXIgX2RiO1xuICB2YXIgX3N0b3JlTmFtZTtcbiAgdmFyIF9jb25maWdLZXk7XG4gIHZhciBfcHJlc2VudEtleTtcbiAgdmFyIF9pbml0aWFsSlNPTkRhdGE7XG4gIHZhciBfaW5pdGlhbEpTT05EYXRhVXNlZnVsO1xuICB2YXIgX2luaXRpYWxKU09ORGF0YUxlbjtcblxuICAvLyBpbml0IGluZGV4ZWREQlxuICBmdW5jdGlvbiBpbml0KGNvbmZpZywgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgLy8gZmlyc3RseSBpbnNwZWN0IGJyb3dzZXIncyBzdXBwb3J0IGZvciBpbmRleGVkREJcbiAgICBpZiAoIXdpbmRvdy5pbmRleGVkREIpIHtcbiAgICAgIHdpbmRvdy5hbGVydCgnWW91ciBicm93c2VyIGRvZXNuXFwndCBzdXBwb3J0IGEgc3RhYmxlIHZlcnNpb24gb2YgSW5kZXhlZERCLiBTdWNoIGFuZCBzdWNoIGZlYXR1cmUgd2lsbCBub3QgYmUgYXZhaWxhYmxlLicpO1xuXG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgX29wZW5EQihjb25maWcsIHN1Y2Nlc3NDYWxsYmFjayk7XG5cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9vcGVuREIoY29uZmlnLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgcmVxdWVzdCA9IGluZGV4ZWREQi5vcGVuKGNvbmZpZy5uYW1lLCBjb25maWcudmVyc2lvbik7IC8vIG9wZW4gaW5kZXhlZERCXG5cbiAgICAvLyBPS1xuICAgIF9zdG9yZU5hbWUgPSBjb25maWcuc3RvcmVOYW1lOyAvLyBzdG9yYWdlIHN0b3JlTmFtZVxuICAgIF9jb25maWdLZXkgPSBjb25maWcua2V5O1xuICAgIF9pbml0aWFsSlNPTkRhdGEgPSBfZ2V0SlNPTkRhdGEoY29uZmlnLmluaXRpYWxEYXRhKTtcbiAgICBfaW5pdGlhbEpTT05EYXRhTGVuID0gX2dldGluaXRpYWxKU09ORGF0YUxlbihfaW5pdGlhbEpTT05EYXRhKTtcbiAgICBfaW5pdGlhbEpTT05EYXRhVXNlZnVsID0gY29uZmlnLmluaXRpYWxKU09ORGF0YVVzZWZ1bDtcblxuICAgIHJlcXVlc3Qub25lcnJvciA9IGZ1bmN0aW9uIF9vcGVuREJFcnJvcigpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdQaXR5LCBmYWlsIHRvIGxvYWQgaW5kZXhlZERCJyk7XG4gICAgfTtcbiAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIF9vcGVuREJTdWNjZXNzKGUpIHtcbiAgICAgIF9kYiA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgIF9kYi5vbmVycm9yID0gZnVuY3Rpb24gZXJyb3JIYW5kbGVyKGUpIHtcbiAgICAgICAgLy8gR2VuZXJpYyBlcnJvciBoYW5kbGVyIGZvciBhbGwgZXJyb3JzIHRhcmdldGVkIGF0IHRoaXMgZGF0YWJhc2UncyByZXF1ZXN0c1xuICAgICAgICB3aW5kb3cuYWxlcnQoJ0RhdGFiYXNlIGVycm9yOiAnICsgZS50YXJnZXQuZXJyb3JDb2RlKTtcbiAgICAgIH07XG4gICAgICBzdWNjZXNzQ2FsbGJhY2soKTtcbiAgICAgIF9nZXRQcmVzZW50S2V5KCk7XG4gICAgfTtcblxuICAgIC8vIFdoZW4geW91IGNyZWF0ZSBhIG5ldyBkYXRhYmFzZSBvciBpbmNyZWFzZSB0aGUgdmVyc2lvbiBudW1iZXIgb2YgYW4gZXhpc3RpbmcgZGF0YWJhc2VcbiAgICByZXF1ZXN0Lm9udXBncmFkZW5lZWRlZCA9IGZ1bmN0aW9uIHNjaGVtYVVwKGUpIHtcbiAgICAgIHZhciBpO1xuICAgICAgdmFyIHN0b3JlO1xuICAgICAgdmFyIGluaXRpYWxKU09ORGF0YTtcbiAgICAgIGNvbnNvbGUubG9nKF9pbml0aWFsSlNPTkRhdGEpO1xuICAgICAgY29uc29sZS5sb2coX2luaXRpYWxKU09ORGF0YUxlbik7XG4gICAgICBfZGIgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICBjb25zb2xlLmxvZygnc2NoZW1lIHVwJyk7XG4gICAgICBpZiAoIShfZGIub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucyhfc3RvcmVOYW1lKSkpIHtcbiAgICAgICAgc3RvcmUgPSBfZGIuY3JlYXRlT2JqZWN0U3RvcmUoX3N0b3JlTmFtZSwgeyBrZXlQYXRoOiBfY29uZmlnS2V5LCBhdXRvSW5jcmVtZW50OiB0cnVlIH0pO1xuICAgICAgICBjb25zb2xlLmxvZyhpbml0aWFsSlNPTkRhdGEpO1xuICAgICAgICBjb25zb2xlLmxvZyhfaW5pdGlhbEpTT05EYXRhTGVuKTtcbiAgICAgICAgaWYgKGluaXRpYWxKU09ORGF0YSkge1xuICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBfaW5pdGlhbEpTT05EYXRhTGVuOyBpKyspIHtcbiAgICAgICAgICAgIHN0b3JlLmFkZChpbml0aWFsSlNPTkRhdGFbaV0pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coaW5pdGlhbEpTT05EYXRhW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgX3ByZXNlbnRLZXkgPSBfcHJlc2VudEtleSArIF9pbml0aWFsSlNPTkRhdGFMZW4gLSAxO1xuICAgICAgICAgIGNvbnNvbGUubG9nKF9wcmVzZW50S2V5KTtcbiAgICAgICAgICBfZ2V0UHJlc2VudEtleSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9nZXRKU09ORGF0YShyYXdEYXRhKSB7XG4gICAgdmFyIHJlc3VsdDtcblxuICAgIHRyeSB7XG4gICAgICAvLyBPS1xuICAgICAgcmVzdWx0ID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShyYXdEYXRhKSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHdpbmRvdy5hbGVydCgnUGxlYXNlIHNldCBjb3JyZWN0IEpTT04gdHlwZSA6PicpO1xuICAgICAgcmVzdWx0ID0gZmFsc2U7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX2dldGluaXRpYWxKU09ORGF0YUxlbihKU09ORGF0YSkge1xuICAgIGlmIChKU09ORGF0YSkge1xuICAgICAgaWYgKEpTT05EYXRhLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gSlNPTkRhdGEubGVuZ3RoO1xuICAgICAgfVxuICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIHJldHVybiAwO1xuICB9XG5cbiAgLy8gc2V0IHByZXNlbnQga2V5IHZhbHVlIHRvIF9wcmVzZW50S2V5ICh0aGUgcHJpdmF0ZSBwcm9wZXJ0eSkgXG4gIGZ1bmN0aW9uIF9nZXRQcmVzZW50S2V5KCkge1xuICAgIHZhciBzdG9yZUhhbmRlciA9IF90cmFuc2FjdGlvbkdlbmVyYXRvcih0cnVlKTtcbiAgICB2YXIgcmFuZ2UgPSBJREJLZXlSYW5nZS5sb3dlckJvdW5kKDApO1xuXG4gICAgc3RvcmVIYW5kZXIub3BlbkN1cnNvcihyYW5nZSwgJ25leHQnKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBfZ2V0UHJlc2VudEtleUhhbmRsZXIoZSkge1xuICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgICAgX3ByZXNlbnRLZXkgPSBjdXJzb3IudmFsdWUuaWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIV9wcmVzZW50S2V5KSB7XG4gICAgICAgICAgX3ByZXNlbnRLZXkgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKCdub3cga2V5IGlzOicgKyAgX3ByZXNlbnRLZXkpOyAvLyBpbml0aWFsIHZhbHVlIGlzIDBcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLyogQ1JVRCAqL1xuXG4gIC8vIHVzZSBjbG9zdXJlIHRvIGtlZXAgX3ByZXNlbnRLZXksIHlvdSB3aWxsIG5lZWQgaXQgaW4gYWRkXG4gIGZ1bmN0aW9uIGdldE5ld0tleSgpIHtcbiAgICBfcHJlc2VudEtleSArPSAxO1xuXG4gICAgcmV0dXJuIF9wcmVzZW50S2V5O1xuICB9XG5cbiAgZnVuY3Rpb24gYWRkSXRlbShuZXdEYXRhLCBzdWNjZXNzQ2FsbGJhY2ssIHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKSB7XG4gICAgdmFyIHN0b3JlSGFuZGVyID0gX3RyYW5zYWN0aW9uR2VuZXJhdG9yKHRydWUpO1xuICAgIHZhciBhZGRPcHQgPSBzdG9yZUhhbmRlci5hZGQobmV3RGF0YSk7XG5cbiAgICBhZGRPcHQub25zdWNjZXNzID0gZnVuY3Rpb24gc3VjY2VzcygpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdCcmF2bywgc3VjY2VzcyB0byBhZGQgb25lIGRhdGEgdG8gaW5kZXhlZERCJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7IC8vIGlmIGhhcyBjYWxsYmFjayBiZWVuIGlucHV0LCBleGVjdXRlIGl0IFxuICAgICAgICBfc3VjY2Vzc0NhbGxiYWNrSGFuZGxlcihzdWNjZXNzQ2FsbGJhY2ssIG5ld0RhdGEsIHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0SXRlbShrZXksIHN1Y2Nlc3NDYWxsYmFjaywgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpIHtcbiAgICB2YXIgc3RvcmVIYW5kZXIgPSBfdHJhbnNhY3Rpb25HZW5lcmF0b3IoZmFsc2UpO1xuICAgIHZhciBnZXREYXRhS2V5ID0gc3RvcmVIYW5kZXIuZ2V0KGtleSk7ICAvLyBnZXQgaXQgYnkgaW5kZXhcblxuICAgIGdldERhdGFLZXkub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0RGF0YVN1Y2Nlc3MoKSB7XG4gICAgICBjb25zb2xlLmxvZygnR3JlYXQsIGdldCAoa2V5OicgKyBrZXkgKyAnXFwnKXMgZGF0YSBzdWNjZWVkJyk7XG4gICAgICBfc3VjY2Vzc0NhbGxiYWNrSGFuZGxlcihzdWNjZXNzQ2FsbGJhY2ssIGdldERhdGFLZXkucmVzdWx0LCBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlcik7XG4gICAgfTtcbiAgfVxuXG4gIC8vIHJldHJpZXZlIGVsaWdpYmxlIGRhdGEgKGJvb2xlYW4gY29uZGl0aW9uKVxuICBmdW5jdGlvbiBnZXRDb25kaXRpb25JdGVtKGNvbmRpdGlvbiwgd2hldGhlciwgc3VjY2Vzc0NhbGxiYWNrLCBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlcikge1xuICAgIHZhciBzdG9yZUhhbmRlciA9IF90cmFuc2FjdGlvbkdlbmVyYXRvcih0cnVlKTtcbiAgICB2YXIgcmFuZ2UgPSBfcmFuZ2VHZW5lcmF0b3IoKTtcbiAgICB2YXIgcmVzdWx0ID0gW107IC8vIHVzZSBhbiBhcnJheSB0byBzdG9yYWdlIGVsaWdpYmxlIGRhdGFcblxuICAgIHN0b3JlSGFuZGVyLm9wZW5DdXJzb3IocmFuZ2UsICduZXh0Jykub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0Q29uZGl0aW9uSXRlbUhhbmRsZXIoZSkge1xuICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICBpZiAod2hldGhlcikge1xuICAgICAgICAgIGlmIChjdXJzb3IudmFsdWVbY29uZGl0aW9uXSkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goY3Vyc29yLnZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIXdoZXRoZXIpIHtcbiAgICAgICAgICBpZiAoIWN1cnNvci52YWx1ZVtjb25kaXRpb25dKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChjdXJzb3IudmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF9zdWNjZXNzQ2FsbGJhY2tIYW5kbGVyKHN1Y2Nlc3NDYWxsYmFjaywgcmVzdWx0LCBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlcik7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEFsbChzdWNjZXNzQ2FsbGJhY2ssIHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKSB7XG4gICAgdmFyIHN0b3JlSGFuZGVyID0gX3RyYW5zYWN0aW9uR2VuZXJhdG9yKHRydWUpO1xuICAgIHZhciByYW5nZSA9IF9yYW5nZUdlbmVyYXRvcigpO1xuICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgIHN0b3JlSGFuZGVyLm9wZW5DdXJzb3IocmFuZ2UsICduZXh0Jykub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0QWxsSGFuZGxlcihlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGN1cnNvci52YWx1ZSk7XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX3N1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoc3VjY2Vzc0NhbGxiYWNrLCByZXN1bHQsIHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLy8gdXBkYXRlIG9uZVxuICBmdW5jdGlvbiB1cGRhdGVJdGVtKG5ld0RhdGEsIHN1Y2Nlc3NDYWxsYmFjaywgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpIHtcbiAgICAvLyAjVE9ETzogdXBkYXRlIHBhcnRcbiAgICB2YXIgc3RvcmVIYW5kZXIgPSBfdHJhbnNhY3Rpb25HZW5lcmF0b3IodHJ1ZSk7XG4gICAgdmFyIHB1dFN0b3JlID0gc3RvcmVIYW5kZXIucHV0KG5ld0RhdGEpO1xuXG4gICAgcHV0U3RvcmUub25zdWNjZXNzID0gZnVuY3Rpb24gdXBkYXRlU3VjY2VzcygpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdBaGEsIG1vZGlmeSBzdWNjZWVkJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIF9zdWNjZXNzQ2FsbGJhY2tIYW5kbGVyKHN1Y2Nlc3NDYWxsYmFjaywgbmV3RGF0YSwgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBkZWxldGVPbmUoa2V5LCBzdWNjZXNzQ2FsbGJhY2ssIHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKSB7XG4gICAgdmFyIHN0b3JlSGFuZGVyID0gX3RyYW5zYWN0aW9uR2VuZXJhdG9yKHRydWUpO1xuICAgIHZhciBkZWxldGVPcHQgPSBzdG9yZUhhbmRlci5kZWxldGUoa2V5KTtcblxuICAgIGRlbGV0ZU9wdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBkZWxldGVTdWNjZXNzKCkge1xuICAgICAgY29uc29sZS5sb2coJ2RlbGV0ZSAoa2V5OiAnICsga2V5ICsgICdcXCcpcyB2YWx1ZSBzdWNjZWVkJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIF9zdWNjZXNzQ2FsbGJhY2tIYW5kbGVyKHN1Y2Nlc3NDYWxsYmFjaywga2V5LCBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlcik7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyKHN1Y2Nlc3NDYWxsYmFjaywgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpIHtcbiAgICB2YXIgc3RvcmVIYW5kZXIgPSBfdHJhbnNhY3Rpb25HZW5lcmF0b3IodHJ1ZSk7XG4gICAgdmFyIHJhbmdlID0gX3JhbmdlR2VuZXJhdG9yKCk7XG5cbiAgICBzdG9yZUhhbmRlci5vcGVuQ3Vyc29yKHJhbmdlLCAnbmV4dCcpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGNsZWFySGFuZGxlcihlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgdmFyIHJlcXVlc3REZWw7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgcmVxdWVzdERlbCA9IGN1cnNvci5kZWxldGUoKTtcbiAgICAgICAgcmVxdWVzdERlbC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBzdWNjZXNzKCkge1xuICAgICAgICB9O1xuICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgIH0gZWxzZSBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIF9zdWNjZXNzQ2FsbGJhY2tIYW5kbGVyKHN1Y2Nlc3NDYWxsYmFjaywgJ2FsbCBkYXRhJywgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKiAzIHByaXZhdGUgbWV0aG9kcyAqL1xuXG4gIGZ1bmN0aW9uIF90cmFuc2FjdGlvbkdlbmVyYXRvcih3aGV0aGVyV3JpdGUpIHtcbiAgICB2YXIgdHJhbnNhY3Rpb247XG5cbiAgICBpZiAod2hldGhlcldyaXRlKSB7XG4gICAgICB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbX3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW19zdG9yZU5hbWVdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoX3N0b3JlTmFtZSk7XG4gIH1cblxuICBmdW5jdGlvbiBfcmFuZ2VHZW5lcmF0b3IoKSB7XG4gICAgaWYgKF9pbml0aWFsSlNPTkRhdGFVc2VmdWwpIHtcbiAgICAgIHJldHVybiBJREJLZXlSYW5nZS5sb3dlckJvdW5kKDApO1xuICAgIH1cbiAgICAvLyAjRklYTUU6IFxuICAgIC8vIGNvbnNvbGUubG9nKF9pbml0aWFsSlNPTkRhdGFMZW4pO1xuICAgIHJldHVybiBJREJLZXlSYW5nZS5sb3dlckJvdW5kKDEgLSAxLCB0cnVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zdWNjZXNzQ2FsbGJhY2tIYW5kbGVyKHN1Y2Nlc3NDYWxsYmFjaywgcmVzdWx0LCBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlcikge1xuICAgIGlmIChzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlcikge1xuICAgICAgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIudW5zaGlmdChyZXN1bHQpO1xuICAgICAgc3VjY2Vzc0NhbGxiYWNrLmFwcGx5KG51bGwsIHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3VsdCk7XG4gICAgfVxuICB9XG5cbiAgLyogcHVibGljIGludGVyZmFjZSAqL1xuICByZXR1cm4ge1xuICAgIGluaXQ6IGluaXQsXG4gICAgZ2V0TmV3S2V5OiBnZXROZXdLZXksXG4gICAgYWRkSXRlbTogYWRkSXRlbSxcbiAgICBnZXRJdGVtOiBnZXRJdGVtLFxuICAgIGdldENvbmRpdGlvbkl0ZW06IGdldENvbmRpdGlvbkl0ZW0sXG4gICAgZ2V0QWxsOiBnZXRBbGwsXG4gICAgdXBkYXRlSXRlbTogdXBkYXRlSXRlbSxcbiAgICByZW1vdmVJdGVtOiBkZWxldGVPbmUsXG4gICAgY2xlYXI6IGNsZWFyXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGluZGV4ZWREQkhhbmRsZXI7XG4iLCIndXNlIHN0cmljdCc7XG4oZnVuY3Rpb24gaW5pdCgpIHtcbiAgLy8gdmFyIERCID0gcmVxdWlyZSgnaW5kZXhlZGRiLWNydWQnKTtcbiAgLy8gdmFyIGxpc3REQkNvbmZpZyA9IHJlcXVpcmUoJy4vZGIvbGlzdENvbmZpZycpO1xuICB2YXIgYWRkRXZlbnRzID0gcmVxdWlyZSgnLi91dGxpcy9hZGRFdmVudHMuanMnKTtcblxuICAvLyBvcGVuIERCLCBhbmQgd2hlbiBEQiBvcGVuIHN1Y2NlZWQsIGludm9rZSBpbml0aWFsIGZ1bmN0aW9uXG4gIC8vIERCLmluaXQobGlzdERCQ29uZmlnLCBhZGRFdmVudHMuc3VjY2VzcywgYWRkRXZlbnRzLmZhaWwpO1xuICBhZGRFdmVudHMuZGJGYWlsKCk7XG59KCkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGFkZEV2ZW50cyA9IChmdW5jdGlvbiBhZGRFdmVudHNHZW5lcmF0b3IoKSB7XG4gIGZ1bmN0aW9uIF93aGV0aGVyU3VjY2Vzcyh3aGV0aGVyU3VjY2Vzcykge1xuICAgIGZ1bmN0aW9uIF93aGV0aGVyU3VjY2Vzc0hhbmRsZXIod2hldGhlcikge1xuICAgICAgdmFyIGV2ZW50SGFuZGxlciA9IHJlcXVpcmUoJy4vZXZlbnRIYW5kbGVyL2V2ZW50SGFuZGxlci5qcycpO1xuICAgICAgdmFyIGhhbmRsZXIgPSB3aGV0aGVyID8gZXZlbnRIYW5kbGVyLmRiU3VjY2VzcyA6IGV2ZW50SGFuZGxlci5kYkZhaWw7XG4gICAgICB2YXIgbGlzdDtcblxuICAgICAgaGFuZGxlci5zaG93SW5pdCgpO1xuICAgICAgLy8gYWRkIGFsbCBldmVudExpc3RlbmVyXG4gICAgICBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgICAgIGxpc3QuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLmNsaWNrTGksIGZhbHNlKTtcbiAgICAgIGxpc3QuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnJlbW92ZUxpLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlci5lbnRlckFkZCwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FkZCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5hZGQsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93RG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93RG9uZSwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dUb2RvJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dUb2RvLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0FsbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93QWxsLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0NsZWFyJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dDbGVhciwgZmFsc2UpO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiB3cmFwSGFuZGxlcigpIHtcbiAgICAgIF93aGV0aGVyU3VjY2Vzc0hhbmRsZXIod2hldGhlclN1Y2Nlc3MpO1xuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGRiU3VjY2VzczogX3doZXRoZXJTdWNjZXNzKHRydWUpLFxuICAgIGRiRmFpbDogX3doZXRoZXJTdWNjZXNzKGZhbHNlKVxuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBhZGRFdmVudHM7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgY3JlYXRlTGkgPSAoZnVuY3Rpb24gbGlHZW5lcmF0b3IoKSB7XG4gIGZ1bmN0aW9uIF9kZWNvcmF0ZUxpKGxpLCBkYXRhKSB7XG4gICAgdmFyIHRleHREYXRlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YS51c2VyRGF0ZSArICc6ICcpO1xuICAgIHZhciB0ZXh0V3JhcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcgJyArIGRhdGEuZXZlbnQpO1xuXG4gICAgLy8gd3JhcCBhcyBhIG5vZGVcbiAgICB0ZXh0V3JhcC5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICBsaS5hcHBlbmRDaGlsZCh0ZXh0RGF0ZSk7XG4gICAgbGkuYXBwZW5kQ2hpbGQodGV4dFdyYXApO1xuICAgIGlmIChkYXRhLmZpbmlzaGVkKSB7ICAvLyBhZGQgY3NzLXN0eWxlIHRvIGl0IChhY2NvcmRpbmcgdG8gaXQncyBkYXRhLmZpbmlzaGVkIHZhbHVlKVxuICAgICAgbGkuY2xhc3NMaXN0LmFkZCgnZmluaXNoZWQnKTsgLy8gYWRkIHN0eWxlXG4gICAgfVxuICAgIF9hZGRYKGxpLCBkYXRhLmlkKTsgLy8gYWRkIHNwYW4gW3hdIHRvIGxpJ3MgdGFpbFxuICAgIF9zZXREYXRhUHJvcGVydHkobGksICdkYXRhLWlkJywgZGF0YS5pZCk7IC8vIGFkZCBwcm9wZXJ0eSB0byBsaSAoZGF0YS1pZCnvvIxmb3IgIGNsaWNrTGlcbiAgfVxuXG4gIGZ1bmN0aW9uIF9hZGRYKGxpKSB7XG4gICAgdmFyIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgdmFyIHggPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnXFx1MDBENycpOyAvLyB1bmljb2RlIC0+IHhcblxuICAgIHNwYW4uYXBwZW5kQ2hpbGQoeCk7XG4gICAgc3Bhbi5jbGFzc05hbWUgPSAnY2xvc2UnOyAvLyBhZGQgc3R5bGVcbiAgICBsaS5hcHBlbmRDaGlsZChzcGFuKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zZXREYXRhUHJvcGVydHkodGFyZ2V0LCBuYW1lLCBkYXRhKSB7XG4gICAgdGFyZ2V0LnNldEF0dHJpYnV0ZShuYW1lLCBkYXRhKTtcbiAgfVxuXG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGNyZWF0ZShkYXRhKSB7XG4gICAgdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcblxuICAgIF9kZWNvcmF0ZUxpKGxpLCBkYXRhKTsgLy8gZGVjb3JhdGUgbGlcblxuICAgIHJldHVybiBsaTtcbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlTGk7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgZGJGYWlsID0gKGZ1bmN0aW9uIGRiRmFpbEdlbmVyYXRvcigpIHtcbiAgdmFyIHJlZnJlc2ggPSByZXF1aXJlKCcuLi9yZWZyZXNoLmpzJyk7XG4gIHZhciBjcmVhdGVMaSA9IHJlcXVpcmUoJy4uL2NyZWF0ZUxpLmpzJyk7XG4gIHZhciBnZW5lcmFsID0gcmVxdWlyZSgnLi9nZW5lcmFsLmpzJyk7XG4gIHZhciBfaWQgPSAtMTsgLy8gc28gdGhlIGZpcnN0IGl0ZW0ncyBpZCBpcyAwXG5cbiAgZnVuY3Rpb24gYWRkKCkge1xuICAgIHZhciBpbnB1dFZhbHVlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWU7XG4gICAgdmFyIGxpc3Q7XG4gICAgdmFyIG5ld0RhdGE7XG4gICAgdmFyIG5ld0xpO1xuXG4gICAgaWYgKGlucHV0VmFsdWUgPT09ICcnKSB7XG4gICAgICBhbGVydCgncGxlYXNlIGlucHV0IGEgcmVhbCBkYXRhficpO1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGdlbmVyYWwuaWZFbXB0eS5yZW1vdmVJbml0KCk7XG4gICAgbmV3RGF0YSA9IF9pbnRlZ3JhdGVOZXdEYXRhKGlucHV0VmFsdWUpO1xuICAgIG5ld0xpID0gY3JlYXRlTGkobmV3RGF0YSk7XG4gICAgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgbGlzdC5pbnNlcnRCZWZvcmUobmV3TGksIGxpc3QuZmlyc3RDaGlsZCk7IC8vIHB1c2ggbmV3TGkgdG8gZmlyc3RcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5wdXQnKS52YWx1ZSA9ICcnOyAgLy8gcmVzZXQgaW5wdXQncyB2YWx1ZXNcblxuICAgIHJldHVybiAwO1xuICB9XG5cbiAgZnVuY3Rpb24gZW50ZXJBZGQoZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzKSB7XG4gICAgICBhZGQoKTtcbiAgICB9XG4gIH1cblxuICAvLyBsaSdzIFt4XSdzIGRlbGV0ZVxuICBmdW5jdGlvbiByZW1vdmVMaShlKSB7XG4gICAgdmFyIGlkO1xuXG4gICAgaWYgKGUudGFyZ2V0LmNsYXNzTmFtZSA9PT0gJ2Nsb3NlJykgeyAvLyB1c2UgZXZlbnQgZGVsZWdhdGlvblxuICAgICAgLy8gdXNlIHByZXZpb3VzbHkgc3RvcmVkIGRhdGFcbiAgICAgIGlkID0gcGFyc2VJbnQoZS50YXJnZXQucGFyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSwgMTApO1xuICAgICAgX3RyYXZlcnNlTGlzdEl0ZW1zKGZ1bmN0aW9uIGRpc2FwcGVhckl0ZW0oZWxlbWVudCwgaW5kZXgpIHtcbiAgICAgICAgaWYgKHBhcnNlSW50KGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyksIDEwKSA9PT0gaWQpIHtcbiAgICAgICAgICBfcmVtb3ZlKGluZGV4KTtcbiAgICAgICAgICBnZW5lcmFsLmlmRW1wdHkuYWRkUmFuZG9tKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF90cmF2ZXJzZUxpc3RJdGVtcyhmdW5jKSB7XG4gICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjbGlzdCBsaScpLCBmdW5jKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9yZW1vdmUoaW5kZXgpIHtcbiAgICB2YXIgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG5cbiAgICBsaXN0LnJlbW92ZUNoaWxkKGxpc3QuY2hpbGROb2Rlc1tpbmRleF0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0luaXQoKSB7XG4gICAgcmVmcmVzaC5jbGVhcigpO1xuICAgIHJlZnJlc2guaW5pdCgpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0FsbCgpIHtcbiAgICBfdHJhdmVyc2VMaXN0SXRlbXMoZnVuY3Rpb24gYXBwZWFyQWxsKGVsZW1lbnQpIHtcbiAgICAgIHJlZnJlc2guYXBwZWFyKGVsZW1lbnQpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0NsZWFyKCkge1xuICAgIHJlZnJlc2guY2xlYXIoKTsgLy8gY2xlYXIgbm9kZXMgdmlzdWFsbHlcbiAgICByZWZyZXNoLnJhbmRvbSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0RvbmUoKSB7XG4gICAgX3Nob3dXaGV0aGVyRG9uZSh0cnVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dUb2RvKCkge1xuICAgIF9zaG93V2hldGhlckRvbmUoZmFsc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xpY2tMaShlKSB7XG4gICAgdmFyIHRhcmdldExpID0gZS50YXJnZXQ7XG4gICAgdmFyIGlkID0gcGFyc2VJbnQodGFyZ2V0TGkuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyksIDEwKTtcbiAgICAvLyB1c2UgZXZlbnQgZGVsZWdhdGlvblxuXG4gICAgaWYgKGlkICE9PSB2b2lkIDApIHtcbiAgICAgIF90b2dnbGVMaSh0YXJnZXRMaSwgaWQpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9pbnRlZ3JhdGVOZXdEYXRhKHZhbHVlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiAoX2lkICs9IDEpLFxuICAgICAgZXZlbnQ6IHZhbHVlLFxuICAgICAgZmluaXNoZWQ6IGZhbHNlLFxuICAgICAgdXNlckRhdGU6IGdlbmVyYWwuZ2V0TmV3RGF0ZSgneXl5eeW5tE1N5pyIZGTml6UgaGg6bW0nKVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfc2hvd1doZXRoZXJEb25lKHdoZXRoZXJEb25lKSB7XG4gICAgX3RyYXZlcnNlTGlzdEl0ZW1zKGZ1bmN0aW9uIHdoZXRoZXJEb25lQXBwZWFyKGVsZW1lbnQsIGluZGV4KSB7XG4gICAgICBpZiAod2hldGhlckRvbmUpIHtcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoJ2ZpbmlzaGVkJykgPyByZWZyZXNoLmFwcGVhcihlbGVtZW50KSA6IHJlZnJlc2guZGlzYXBwZWFyKGVsZW1lbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoJ2ZpbmlzaGVkJykgPyByZWZyZXNoLmRpc2FwcGVhcihlbGVtZW50KSA6IHJlZnJlc2guYXBwZWFyKGVsZW1lbnQpO1xuICAgICAgfVxuICAgICAgaWYgKGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdmaW5pc2hlZCcpKSB7XG4gICAgICAgIF9yZW1vdmUoaW5kZXgpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gX3RvZ2dsZUxpKHRhcmdldExpLCBpZCkge1xuICAgIHRhcmdldExpLmNsYXNzTGlzdC50b2dnbGUoJ2ZpbmlzaGVkJyk7XG4gICAgaWYgKHRhcmdldExpLmNsYXNzTGlzdC5jb250YWlucygnZmluaXNoZWQnKSkge1xuICAgICAgX3JlbW92ZShpZCk7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmFwcGVuZENoaWxkKHRhcmdldExpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGFkZDogYWRkLFxuICAgIGVudGVyQWRkOiBlbnRlckFkZCxcbiAgICBjbGlja0xpOiBjbGlja0xpLFxuICAgIHJlbW92ZUxpOiByZW1vdmVMaSxcbiAgICBzaG93SW5pdDogc2hvd0luaXQsXG4gICAgc2hvd0FsbDogc2hvd0FsbCxcbiAgICBzaG93Q2xlYXI6IHNob3dDbGVhcixcbiAgICBzaG93RG9uZTogc2hvd0RvbmUsXG4gICAgc2hvd1RvZG86IHNob3dUb2RvXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRiRmFpbDtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBkYlN1Y2Nlc3MgPSAoZnVuY3Rpb24gZGJTdWNjZXNzR2VuZXJhdG9yKCkge1xuICB2YXIgREIgPSByZXF1aXJlKCdpbmRleGVkZGItY3J1ZCcpO1xuICB2YXIgcmVmcmVzaCA9IHJlcXVpcmUoJy4uL3JlZnJlc2guanMnKTtcbiAgdmFyIGNyZWF0ZUxpID0gcmVxdWlyZSgnLi4vY3JlYXRlTGkuanMnKTtcbiAgdmFyIGdlbmVyYWwgPSByZXF1aXJlKCcuL2dlbmVyYWwuanMnKTtcblxuICBmdW5jdGlvbiBhZGQoKSB7XG4gICAgdmFyIGlucHV0VmFsdWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5wdXQnKS52YWx1ZTtcbiAgICB2YXIgbGlzdDtcbiAgICB2YXIgbmV3RGF0YTtcbiAgICB2YXIgbmV3TGk7XG5cbiAgICBpZiAoaW5wdXRWYWx1ZSA9PT0gJycpIHtcbiAgICAgIHdpbmRvdy5hbGVydCgncGxlYXNlIGlucHV0IGEgcmVhbCBkYXRhficpO1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGdlbmVyYWwuaWZFbXB0eS5yZW1vdmVJbml0KCk7XG4gICAgbmV3RGF0YSA9IF9pbnRlZ3JhdGVOZXdEYXRhKGlucHV0VmFsdWUpO1xuICAgIG5ld0xpID0gY3JlYXRlTGkobmV3RGF0YSk7XG4gICAgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgbGlzdC5pbnNlcnRCZWZvcmUobmV3TGksIGxpc3QuZmlyc3RDaGlsZCk7IC8vIHB1c2ggbmV3TGkgdG8gZmlyc3RcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5wdXQnKS52YWx1ZSA9ICcnOyAgLy8gcmVzZXQgaW5wdXQncyB2YWx1ZXNcbiAgICBEQi5hZGRJdGVtKG5ld0RhdGEpO1xuXG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICBmdW5jdGlvbiBlbnRlckFkZChlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgIGFkZCgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGxpJ3MgW3hdJ3MgZGVsZXRlXG4gIGZ1bmN0aW9uIHJlbW92ZUxpKGUpIHtcbiAgICB2YXIgaWQ7XG5cbiAgICBpZiAoZS50YXJnZXQuY2xhc3NOYW1lID09PSAnY2xvc2UnKSB7IC8vIHVzZSBldmVudCBkZWxlZ2F0aW9uXG4gICAgICAvLyB1c2UgcHJldmlvdXNseSBzdG9yZWQgZGF0YVxuICAgICAgaWQgPSBwYXJzZUludChlLnRhcmdldC5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpLCAxMCk7XG4gICAgICBEQi5yZW1vdmVJdGVtKGlkLCBzaG93QWxsKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzaG93SW5pdCgpIHtcbiAgICByZWZyZXNoLmNsZWFyKCk7XG4gICAgREIuZ2V0QWxsKHJlZnJlc2guaW5pdCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93QWxsKCkge1xuICAgIHJlZnJlc2guY2xlYXIoKTtcbiAgICBEQi5nZXRBbGwocmVmcmVzaC5hbGwpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0NsZWFyKCkge1xuICAgIHJlZnJlc2guY2xlYXIoKTsgLy8gY2xlYXIgbm9kZXMgdmlzdWFsbHlcbiAgICByZWZyZXNoLnJhbmRvbSgpO1xuICAgIERCLmNsZWFyKCk7IC8vIGNsZWFyIGRhdGEgaW5kZWVkXG4gIH1cblxuICBmdW5jdGlvbiBzaG93RG9uZSgpIHtcbiAgICBfc2hvd1doZXRoZXJEb25lKHRydWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd1RvZG8oKSB7XG4gICAgX3Nob3dXaGV0aGVyRG9uZShmYWxzZSk7XG4gIH1cblxuICBmdW5jdGlvbiBjbGlja0xpKGUpIHtcbiAgICB2YXIgaWQ7XG4gICAgdmFyIHRhcmdldExpID0gZS50YXJnZXQ7XG4gICAgLy8gdXNlIGV2ZW50IGRlbGVnYXRpb25cblxuICAgIGlmICh0YXJnZXRMaS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSkge1xuICAgICAgaWQgPSBwYXJzZUludCh0YXJnZXRMaS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSwgMTApOyAvLyB1c2UgcHJldmlvdXNseSBzdG9yZWQgZGF0YS1pZCBhdHRyaWJ1dGVcbiAgICAgIERCLmdldEl0ZW0oaWQsIF90b2dnbGVMaSwgW3RhcmdldExpXSk7IC8vIHBhc3MgX3RvZ2dsZUxpIGFuZCBwYXJhbSBbZS50YXJnZXRdIGFzIGNhbGxiYWNrXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX2ludGVncmF0ZU5ld0RhdGEodmFsdWUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IERCLmdldE5ld0tleSgpLFxuICAgICAgZXZlbnQ6IHZhbHVlLFxuICAgICAgZmluaXNoZWQ6IGZhbHNlLFxuICAgICAgdXNlckRhdGU6IGdlbmVyYWwuZ2V0TmV3RGF0ZSgneXl5eeW5tE1N5pyIZGTml6UgaGg6bW0nKVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfc2hvd1doZXRoZXJEb25lKHdoZXRoZXJEb25lKSB7XG4gICAgdmFyIGNvbmRpdGlvbiA9ICdmaW5pc2hlZCc7XG5cbiAgICByZWZyZXNoLmNsZWFyKCk7XG4gICAgREIuZ2V0Q29uZGl0aW9uSXRlbShjb25kaXRpb24sIHdoZXRoZXJEb25lLCByZWZyZXNoLnBhcnQpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3RvZ2dsZUxpKGRhdGEsIHRhcmdldExpKSB7XG4gICAgdGFyZ2V0TGkuY2xhc3NMaXN0LnRvZ2dsZSgnZmluaXNoZWQnKTtcbiAgICBkYXRhLmZpbmlzaGVkID0gIWRhdGEuZmluaXNoZWQ7ICAvLyB0b2dnbGUgZGF0YS5maW5pc2hlZFxuICAgIERCLnVwZGF0ZUl0ZW0oZGF0YSwgc2hvd0FsbCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGFkZDogYWRkLFxuICAgIGVudGVyQWRkOiBlbnRlckFkZCxcbiAgICBjbGlja0xpOiBjbGlja0xpLFxuICAgIHJlbW92ZUxpOiByZW1vdmVMaSxcbiAgICBzaG93SW5pdDogc2hvd0luaXQsXG4gICAgc2hvd0FsbDogc2hvd0FsbCxcbiAgICBzaG93Q2xlYXI6IHNob3dDbGVhcixcbiAgICBzaG93RG9uZTogc2hvd0RvbmUsXG4gICAgc2hvd1RvZG86IHNob3dUb2RvXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRiU3VjY2VzcztcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBldmVudEhhbmRsZXIgPSAoZnVuY3Rpb24gaGFuZGxlckdlbmVyYXRvcigpIHtcbiAgdmFyIGRiU3VjY2VzcyA9IHJlcXVpcmUoJy4vZGJTdWNjZXNzLmpzJyk7XG4gIHZhciBkYkZhaWwgPSByZXF1aXJlKCcuL2RiRmFpbC5qcycpO1xuXG4gIHJldHVybiB7XG4gICAgZGJTdWNjZXNzOiBkYlN1Y2Nlc3MsXG4gICAgZGJGYWlsOiBkYkZhaWxcbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZXZlbnRIYW5kbGVyO1xuIiwidmFyIGdlbmVyYWwgPSAoZnVuY3Rpb24gZ2VuZXJhbEdlbmVyYXRvcigpIHtcbiAgdmFyIHJlZnJlc2ggPSByZXF1aXJlKCcuLi9yZWZyZXNoLmpzJyk7XG5cbiAgdmFyIGlmRW1wdHkgPSB7XG4gICAgcmVtb3ZlSW5pdDogZnVuY3Rpb24gcmVtb3ZlSW5pdCgpIHtcbiAgICAgIHZhciBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcblxuICAgICAgaWYgKGxpc3QuZmlyc3RDaGlsZC5jbGFzc05hbWUgPT09ICdhcGhvcmlzbScpIHtcbiAgICAgICAgbGlzdC5yZW1vdmVDaGlsZChsaXN0LmZpcnN0Q2hpbGQpO1xuICAgICAgfVxuICAgIH0sXG4gICAgYWRkUmFuZG9tOiBmdW5jdGlvbiBhZGRSYW5kb20oKSB7XG4gICAgICB2YXIgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG5cbiAgICAgIGlmIChsaXN0LmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgcmVmcmVzaC5yYW5kb20oKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cblxuICAvLyBGb3JtYXQgZGF0ZVxuICBmdW5jdGlvbiBnZXROZXdEYXRlKGZtdCkge1xuICAgIHZhciBuZXdEYXRlID0gbmV3IERhdGUoKTtcbiAgICB2YXIgbmV3Zm10ID0gZm10O1xuICAgIHZhciBvID0ge1xuICAgICAgJ3krJzogbmV3RGF0ZS5nZXRGdWxsWWVhcigpLFxuICAgICAgJ00rJzogbmV3RGF0ZS5nZXRNb250aCgpICsgMSxcbiAgICAgICdkKyc6IG5ld0RhdGUuZ2V0RGF0ZSgpLFxuICAgICAgJ2grJzogbmV3RGF0ZS5nZXRIb3VycygpLFxuICAgICAgJ20rJzogbmV3RGF0ZS5nZXRNaW51dGVzKClcbiAgICB9O1xuICAgIHZhciBsZW5zO1xuXG4gICAgZm9yICh2YXIgayBpbiBvKSB7XG4gICAgICBpZiAobmV3IFJlZ0V4cCgnKCcgKyBrICsgJyknKS50ZXN0KG5ld2ZtdCkpIHtcbiAgICAgICAgaWYgKGsgPT09ICd5KycpIHtcbiAgICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsICgnJyArIG9ba10pLnN1YnN0cig0IC0gUmVnRXhwLiQxLmxlbmd0aCkpO1xuICAgICAgICB9IGVsc2UgaWYgKGsgPT09ICdTKycpIHtcbiAgICAgICAgICBsZW5zID0gUmVnRXhwLiQxLmxlbmd0aDtcbiAgICAgICAgICBsZW5zID0gbGVucyA9PT0gMSA/IDMgOiBsZW5zO1xuICAgICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKCcwMCcgKyBvW2tdKS5zdWJzdHIoKCcnICsgb1trXSkubGVuZ3RoIC0gMSwgbGVucykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKFJlZ0V4cC4kMS5sZW5ndGggPT09IDEpID8gKG9ba10pIDogKCgnMDAnICsgb1trXSkuc3Vic3RyKCgnJyArIG9ba10pLmxlbmd0aCkpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZXdmbXQ7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGlmRW1wdHk6IGlmRW1wdHksXG4gICAgZ2V0TmV3RGF0ZTogZ2V0TmV3RGF0ZVxuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBnZW5lcmFsO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIHJlZnJlc2ggPSAoZnVuY3Rpb24gcmVmcmVzaEdlbmVyYXRvcigpIHtcbiAgdmFyIGNyZWF0ZUxpID0gcmVxdWlyZSgnLi9jcmVhdGVMaS5qcycpO1xuXG4gIGZ1bmN0aW9uIGluaXQoZGF0YUFycikge1xuICAgIF9zaG93KGRhdGFBcnIsIF9pbml0U2VudGVuY2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gYWxsKGRhdGFBcnIpIHtcbiAgICBfc2hvdyhkYXRhQXJyLCByYW5kb21BcGhvcmlzbSk7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJ0KGRhdGFBcnIpIHtcbiAgICB2YXIgbm9kZXM7XG5cbiAgICBpZiAoIWRhdGFBcnIgfHwgZGF0YUFyci5sZW5ndGggPT09IDApIHtcbiAgICAgIHJhbmRvbUFwaG9yaXNtKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vZGVzID0gZGF0YUFyci5yZWR1Y2UoZnVuY3Rpb24gbm9kZUdlbmVyYXRvcihyZXN1bHQsIGRhdGEpIHtcbiAgICAgICAgcmVzdWx0Lmluc2VydEJlZm9yZShjcmVhdGVMaShkYXRhKSwgcmVzdWx0LmZpcnN0Q2hpbGQpO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9LCBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCkpOyAvLyBicmlsbGlhbnQgYXJyLnJlZHVjZSgpICsgZG9jdW1lbnRGcmFnbWVudFxuXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmFwcGVuZENoaWxkKG5vZGVzKTsgLy8gYWRkIGl0IHRvIERPTVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVhcihlbGVtZW50KSB7XG4gICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgfVxuXG4gIGZ1bmN0aW9uIGRpc2FwcGVhcihlbGVtZW50KSB7XG4gICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgdmFyIHJvb3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gICAgd2hpbGUgKHJvb3QuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICByb290LnJlbW92ZUNoaWxkKHJvb3QuZmlyc3RDaGlsZCk7IC8vIHRoZSBiZXN0IHdheSB0byBjbGVhbiBjaGlsZE5vZGVzXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmFuZG9tQXBob3Jpc20oKSB7XG4gICAgdmFyIGFwaG9yaXNtcyA9IFtcbiAgICAgICdZZXN0ZXJkYXkgWW91IFNhaWQgVG9tb3Jyb3cnLFxuICAgICAgJ1doeSBhcmUgd2UgaGVyZT8nLFxuICAgICAgJ0FsbCBpbiwgb3Igbm90aGluZycsXG4gICAgICAnWW91IE5ldmVyIFRyeSwgWW91IE5ldmVyIEtub3cnLFxuICAgICAgJ1RoZSB1bmV4YW1pbmVkIGxpZmUgaXMgbm90IHdvcnRoIGxpdmluZy4gLS0gU29jcmF0ZXMnXG4gICAgXTtcbiAgICB2YXIgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcGhvcmlzbXMubGVuZ3RoKTtcbiAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGFwaG9yaXNtc1tyYW5kb21JbmRleF0pO1xuXG4gICAgX3NlbnRlbmNlR2VuZXJhdG9yKHRleHQpO1xuICB9XG5cblxuICAvKiBwcml2YXRlIG1ldGhvZHMgKi9cblxuICBmdW5jdGlvbiBfc2hvdyhkYXRhQXJyLCBzZW50ZW5jZUZ1bmMpIHtcbiAgICBpZiAoIWRhdGFBcnIgfHwgZGF0YUFyci5sZW5ndGggPT09IDApIHtcbiAgICAgIHNlbnRlbmNlRnVuYygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBfc2hvd1JlZnJlc2goZGF0YUFycik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX3Nob3dSZWZyZXNoKGRhdGFBcnIpIHtcbiAgICB2YXIgcmVzdWx0ID0gX2NsYXNzaWZ5RGF0YShkYXRhQXJyKTtcblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuYXBwZW5kQ2hpbGQocmVzdWx0KTsgLy8gYWRkIGl0IHRvIERPTVxuICB9XG5cbiAgZnVuY3Rpb24gX2NsYXNzaWZ5RGF0YShkYXRhQXJyKSB7XG4gICAgLy8gdXNlIGZyYWdtZW50IHRvIHJlZHVjZSBET00gb3BlcmF0ZVxuICAgIHZhciB1bmZpc2hpZWQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIGZpbmlzaGVkID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIHZhciBmdXNpb24gPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cbiAgICAvLyBwdXQgdGhlIGZpbmlzaGVkIGl0ZW0gdG8gdGhlIGJvdHRvbVxuICAgIGRhdGFBcnIuZm9yRWFjaChmdW5jdGlvbiBjbGFzc2lmeShkYXRhKSB7XG4gICAgICBpZiAoZGF0YS5maW5pc2hlZCkge1xuICAgICAgICBmaW5pc2hlZC5pbnNlcnRCZWZvcmUoY3JlYXRlTGkoZGF0YSksIGZpbmlzaGVkLmZpcnN0Q2hpbGQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdW5maXNoaWVkLmluc2VydEJlZm9yZShjcmVhdGVMaShkYXRhKSwgdW5maXNoaWVkLmZpcnN0Q2hpbGQpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGZ1c2lvbi5hcHBlbmRDaGlsZCh1bmZpc2hpZWQpO1xuICAgIGZ1c2lvbi5hcHBlbmRDaGlsZChmaW5pc2hlZCk7XG5cbiAgICByZXR1cm4gZnVzaW9uO1xuICB9XG5cbiAgZnVuY3Rpb24gX2luaXRTZW50ZW5jZSgpIHtcbiAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCdXZWxjb21lfiwgdHJ5IHRvIGFkZCB5b3VyIGZpcnN0IHRvLWRvIGxpc3QgOiApJyk7XG5cbiAgICBfc2VudGVuY2VHZW5lcmF0b3IodGV4dCk7XG4gIH1cblxuICBmdW5jdGlvbiBfc2VudGVuY2VHZW5lcmF0b3IodGV4dCkge1xuICAgIHZhciBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG5cbiAgICBsaS5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICBsaS5jbGFzc05hbWUgPSAnYXBob3Jpc20nO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuYXBwZW5kQ2hpbGQobGkpO1xuICB9XG5cblxuICAvKiBpbnRlcmZhY2UgKi9cbiAgcmV0dXJuIHtcbiAgICBpbml0OiBpbml0LFxuICAgIGFsbDogYWxsLFxuICAgIHBhcnQ6IHBhcnQsXG4gICAgY2xlYXI6IGNsZWFyLFxuICAgIGFwcGVhcjogYXBwZWFyLFxuICAgIGRpc2FwcGVhcjogZGlzYXBwZWFyLFxuICAgIHJhbmRvbTogcmFuZG9tQXBob3Jpc21cbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVmcmVzaDtcbiJdfQ==
