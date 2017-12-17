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
  addEvents.fail();
}());

},{"./utlis/addEvents.js":3}],3:[function(require,module,exports){
'use strict';
var addEvents = (function addEventsGenerator() {
  function _whetherSuccess(whetherSuccess) {
    console.log(whetherSuccess);

    function _whetherSuccessHandler(whether) {
      var eventHandler = require('./eventHandler.js');
      var handler = whether ? eventHandler.success : eventHandler.fail;
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

    return function () {
      _whetherSuccessHandler(whetherSuccess);
    };
  }

  return {
    success: _whetherSuccess(true),
    fail: _whetherSuccess(false)
  };
}());
console.dir(addEvents);
// console.log(addEvents.fail());
// console.log(addEvents.success());

module.exports = addEvents;

},{"./eventHandler.js":5}],4:[function(require,module,exports){
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

module.exports = createLi;

},{}],5:[function(require,module,exports){
'use strict';
var eventHandler = (function handlerGenerator() {
  function _whetherSuccess(whetherSuccess) {
    console.log(whetherSuccess);

    function _whetherSuccessHandler(whether) {
      var DB;
      var refresh = require('./refresh.js');
      var createLi = require('./createLi');

      if (whether) {
        DB = require('indexeddb-crud');
        console.log('get db');
      }

      function add() {
        var inputValue = document.querySelector('#input').value;
        var list;
        var newData;
        var newLi;

        if (inputValue === '') {
          alert('please input a real data~');
          return 0;
        }
        _ifEmpty();
        newData = _integrateNewData(inputValue);
        newLi = createLi(newData);
        list = document.querySelector('#list');
        list.insertBefore(newLi, list.firstChild); // push newLi to first
        document.querySelector('#input').value = '';  // reset input's values

        if (whether) {
          DB.addItem(newData);
        }

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
          refresh.disappear(e.target.parentNode);

          if (whether) {
            id = parseInt(e.target.getAttribute('data-x'), 10);
            DB.removeItem(id, showAll);
          }
        }
      }

      function showInit() {
        refresh.clear();

        whether ? DB.getAll(refresh.init) : refresh.init();
      }

      function showAll() {
        if (whether) {
          refresh.clear();
          DB.getAll(refresh.all);
        } else {
          Array.prototype.forEach.call(document.querySelectorAll('#list li'), function appearAll(element) {
            refresh.appear(element);
          });
        }
      }

      function showClear() {
        refresh.clear(); // clear nodes visually
        refresh.random();

        if (whether) {
          DB.clear(); // clear data indeed
        }
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
          if (whether) {
            id = parseInt(targetLi.getAttribute('data-id'), 10); // use previously stored data-id attribute
            DB.getItem(id, _switchLi, [targetLi]); // pass _switchLi and param [e.target] as callback
          } else {
            _switchLi(void 0, targetLi);
          }
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
          id: whether ? DB.getNewKey() : 233,
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

      function _showWhetherDone(whetherDone) {
        var condition = 'finished';
        var listItems;

        if (whether) {
          refresh.clear();
          DB.getConditionItem(condition, whetherDone, refresh.part);
        } else {
          listItems = document.querySelectorAll('#list li');
          Array.prototype.forEach.call(listItems, function whetherDoneAppear(element) {
            if (whetherDone) {
              element.classList.contains(condition) ? refresh.appear(element) : refresh.disappear(element);
            } else {
              element.classList.contains(condition) ? refresh.disappear(element) : refresh.appear(element);
            }
          });
          listItems = document.querySelectorAll('#list li');
        }
      }

      function _switchLi(data, targetLi) {
        targetLi.classList.toggle('finished');

        if (whether) {
          data.finished = !data.finished;  // toggle data.finished
          DB.updateItem(data, showAll);
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
    }

    return _whetherSuccessHandler(whetherSuccess);
  }

  return {
    success: _whetherSuccess(true),
    fail: _whetherSuccess(false)
  };
}());

module.exports = eventHandler;

},{"./createLi":4,"./refresh.js":6,"indexeddb-crud":1}],6:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5kZXhlZGRiLWNydWQvaW5kZXguanMiLCJzcmMvc2NyaXB0cy9tYWluLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvYWRkRXZlbnRzLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvY3JlYXRlTGkuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9ldmVudEhhbmRsZXIuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9yZWZyZXNoLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0Jztcbi8vIHVzZSBtb2R1bGUgcGF0dGVyblxudmFyIGluZGV4ZWREQkhhbmRsZXIgPSAoZnVuY3Rpb24gaW5kZXhlZERCSGFuZGxlcigpIHtcbiAgLy8gNSBwcml2YXRlIHByb3BlcnR5XG4gIHZhciBfZGI7XG4gIHZhciBfc3RvcmVOYW1lO1xuICB2YXIgX2NvbmZpZ0tleTtcbiAgdmFyIF9wcmVzZW50S2V5O1xuICB2YXIgX2luaXRpYWxKU09ORGF0YTtcbiAgdmFyIF9pbml0aWFsSlNPTkRhdGFVc2VmdWw7XG4gIHZhciBfaW5pdGlhbEpTT05EYXRhTGVuO1xuXG4gIC8vIGluaXQgaW5kZXhlZERCXG4gIGZ1bmN0aW9uIGluaXQoY29uZmlnLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAvLyBmaXJzdGx5IGluc3BlY3QgYnJvd3NlcidzIHN1cHBvcnQgZm9yIGluZGV4ZWREQlxuICAgIGlmICghd2luZG93LmluZGV4ZWREQikge1xuICAgICAgd2luZG93LmFsZXJ0KCdZb3VyIGJyb3dzZXIgZG9lc25cXCd0IHN1cHBvcnQgYSBzdGFibGUgdmVyc2lvbiBvZiBJbmRleGVkREIuIFN1Y2ggYW5kIHN1Y2ggZmVhdHVyZSB3aWxsIG5vdCBiZSBhdmFpbGFibGUuJyk7XG5cbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBfb3BlbkRCKGNvbmZpZywgc3VjY2Vzc0NhbGxiYWNrKTtcblxuICAgIHJldHVybiAwO1xuICB9XG5cbiAgZnVuY3Rpb24gX29wZW5EQihjb25maWcsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciByZXF1ZXN0ID0gaW5kZXhlZERCLm9wZW4oY29uZmlnLm5hbWUsIGNvbmZpZy52ZXJzaW9uKTsgLy8gb3BlbiBpbmRleGVkREJcblxuICAgIC8vIE9LXG4gICAgX3N0b3JlTmFtZSA9IGNvbmZpZy5zdG9yZU5hbWU7IC8vIHN0b3JhZ2Ugc3RvcmVOYW1lXG4gICAgX2NvbmZpZ0tleSA9IGNvbmZpZy5rZXk7XG4gICAgX2luaXRpYWxKU09ORGF0YSA9IF9nZXRKU09ORGF0YShjb25maWcuaW5pdGlhbERhdGEpO1xuICAgIF9pbml0aWFsSlNPTkRhdGFMZW4gPSBfZ2V0aW5pdGlhbEpTT05EYXRhTGVuKF9pbml0aWFsSlNPTkRhdGEpO1xuICAgIF9pbml0aWFsSlNPTkRhdGFVc2VmdWwgPSBjb25maWcuaW5pdGlhbEpTT05EYXRhVXNlZnVsO1xuXG4gICAgcmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24gX29wZW5EQkVycm9yKCkge1xuICAgICAgY29uc29sZS5sb2coJ1BpdHksIGZhaWwgdG8gbG9hZCBpbmRleGVkREInKTtcbiAgICB9O1xuICAgIHJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gX29wZW5EQlN1Y2Nlc3MoZSkge1xuICAgICAgX2RiID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgX2RiLm9uZXJyb3IgPSBmdW5jdGlvbiBlcnJvckhhbmRsZXIoZSkge1xuICAgICAgICAvLyBHZW5lcmljIGVycm9yIGhhbmRsZXIgZm9yIGFsbCBlcnJvcnMgdGFyZ2V0ZWQgYXQgdGhpcyBkYXRhYmFzZSdzIHJlcXVlc3RzXG4gICAgICAgIHdpbmRvdy5hbGVydCgnRGF0YWJhc2UgZXJyb3I6ICcgKyBlLnRhcmdldC5lcnJvckNvZGUpO1xuICAgICAgfTtcbiAgICAgIHN1Y2Nlc3NDYWxsYmFjaygpO1xuICAgICAgX2dldFByZXNlbnRLZXkoKTtcbiAgICB9O1xuXG4gICAgLy8gV2hlbiB5b3UgY3JlYXRlIGEgbmV3IGRhdGFiYXNlIG9yIGluY3JlYXNlIHRoZSB2ZXJzaW9uIG51bWJlciBvZiBhbiBleGlzdGluZyBkYXRhYmFzZVxuICAgIHJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24gc2NoZW1hVXAoZSkge1xuICAgICAgdmFyIGk7XG4gICAgICB2YXIgc3RvcmU7XG4gICAgICB2YXIgaW5pdGlhbEpTT05EYXRhO1xuICAgICAgY29uc29sZS5sb2coX2luaXRpYWxKU09ORGF0YSk7XG4gICAgICBjb25zb2xlLmxvZyhfaW5pdGlhbEpTT05EYXRhTGVuKTtcbiAgICAgIF9kYiA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgIGNvbnNvbGUubG9nKCdzY2hlbWUgdXAnKTtcbiAgICAgIGlmICghKF9kYi5vYmplY3RTdG9yZU5hbWVzLmNvbnRhaW5zKF9zdG9yZU5hbWUpKSkge1xuICAgICAgICBzdG9yZSA9IF9kYi5jcmVhdGVPYmplY3RTdG9yZShfc3RvcmVOYW1lLCB7IGtleVBhdGg6IF9jb25maWdLZXksIGF1dG9JbmNyZW1lbnQ6IHRydWUgfSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGluaXRpYWxKU09ORGF0YSk7XG4gICAgICAgIGNvbnNvbGUubG9nKF9pbml0aWFsSlNPTkRhdGFMZW4pO1xuICAgICAgICBpZiAoaW5pdGlhbEpTT05EYXRhKSB7XG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IF9pbml0aWFsSlNPTkRhdGFMZW47IGkrKykge1xuICAgICAgICAgICAgc3RvcmUuYWRkKGluaXRpYWxKU09ORGF0YVtpXSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhpbml0aWFsSlNPTkRhdGFbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBfcHJlc2VudEtleSA9IF9wcmVzZW50S2V5ICsgX2luaXRpYWxKU09ORGF0YUxlbiAtIDE7XG4gICAgICAgICAgY29uc29sZS5sb2coX3ByZXNlbnRLZXkpO1xuICAgICAgICAgIF9nZXRQcmVzZW50S2V5KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gX2dldEpTT05EYXRhKHJhd0RhdGEpIHtcbiAgICB2YXIgcmVzdWx0O1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIE9LXG4gICAgICByZXN1bHQgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHJhd0RhdGEpKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgd2luZG93LmFsZXJ0KCdQbGVhc2Ugc2V0IGNvcnJlY3QgSlNPTiB0eXBlIDo+Jyk7XG4gICAgICByZXN1bHQgPSBmYWxzZTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfZ2V0aW5pdGlhbEpTT05EYXRhTGVuKEpTT05EYXRhKSB7XG4gICAgaWYgKEpTT05EYXRhKSB7XG4gICAgICBpZiAoSlNPTkRhdGEubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBKU09ORGF0YS5sZW5ndGg7XG4gICAgICB9XG4gICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICAvLyBzZXQgcHJlc2VudCBrZXkgdmFsdWUgdG8gX3ByZXNlbnRLZXkgKHRoZSBwcml2YXRlIHByb3BlcnR5KSBcbiAgZnVuY3Rpb24gX2dldFByZXNlbnRLZXkoKSB7XG4gICAgdmFyIHN0b3JlSGFuZGVyID0gX3RyYW5zYWN0aW9uR2VuZXJhdG9yKHRydWUpO1xuICAgIHZhciByYW5nZSA9IElEQktleVJhbmdlLmxvd2VyQm91bmQoMCk7XG5cbiAgICBzdG9yZUhhbmRlci5vcGVuQ3Vyc29yKHJhbmdlLCAnbmV4dCcpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIF9nZXRQcmVzZW50S2V5SGFuZGxlcihlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgICBfcHJlc2VudEtleSA9IGN1cnNvci52YWx1ZS5pZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghX3ByZXNlbnRLZXkpIHtcbiAgICAgICAgICBfcHJlc2VudEtleSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coJ25vdyBrZXkgaXM6JyArICBfcHJlc2VudEtleSk7IC8vIGluaXRpYWwgdmFsdWUgaXMgMFxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKiBDUlVEICovXG5cbiAgLy8gdXNlIGNsb3N1cmUgdG8ga2VlcCBfcHJlc2VudEtleSwgeW91IHdpbGwgbmVlZCBpdCBpbiBhZGRcbiAgZnVuY3Rpb24gZ2V0TmV3S2V5KCkge1xuICAgIF9wcmVzZW50S2V5ICs9IDE7XG5cbiAgICByZXR1cm4gX3ByZXNlbnRLZXk7XG4gIH1cblxuICBmdW5jdGlvbiBhZGRJdGVtKG5ld0RhdGEsIHN1Y2Nlc3NDYWxsYmFjaywgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpIHtcbiAgICB2YXIgc3RvcmVIYW5kZXIgPSBfdHJhbnNhY3Rpb25HZW5lcmF0b3IodHJ1ZSk7XG4gICAgdmFyIGFkZE9wdCA9IHN0b3JlSGFuZGVyLmFkZChuZXdEYXRhKTtcblxuICAgIGFkZE9wdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBzdWNjZXNzKCkge1xuICAgICAgY29uc29sZS5sb2coJ0JyYXZvLCBzdWNjZXNzIHRvIGFkZCBvbmUgZGF0YSB0byBpbmRleGVkREInKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHsgLy8gaWYgaGFzIGNhbGxiYWNrIGJlZW4gaW5wdXQsIGV4ZWN1dGUgaXQgXG4gICAgICAgIF9zdWNjZXNzQ2FsbGJhY2tIYW5kbGVyKHN1Y2Nlc3NDYWxsYmFjaywgbmV3RGF0YSwgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBnZXRJdGVtKGtleSwgc3VjY2Vzc0NhbGxiYWNrLCBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlcikge1xuICAgIHZhciBzdG9yZUhhbmRlciA9IF90cmFuc2FjdGlvbkdlbmVyYXRvcihmYWxzZSk7XG4gICAgdmFyIGdldERhdGFLZXkgPSBzdG9yZUhhbmRlci5nZXQoa2V5KTsgIC8vIGdldCBpdCBieSBpbmRleFxuXG4gICAgZ2V0RGF0YUtleS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXREYXRhU3VjY2VzcygpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdHcmVhdCwgZ2V0IChrZXk6JyArIGtleSArICdcXCcpcyBkYXRhIHN1Y2NlZWQnKTtcbiAgICAgIF9zdWNjZXNzQ2FsbGJhY2tIYW5kbGVyKHN1Y2Nlc3NDYWxsYmFjaywgZ2V0RGF0YUtleS5yZXN1bHQsIHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gcmV0cmlldmUgZWxpZ2libGUgZGF0YSAoYm9vbGVhbiBjb25kaXRpb24pXG4gIGZ1bmN0aW9uIGdldENvbmRpdGlvbkl0ZW0oY29uZGl0aW9uLCB3aGV0aGVyLCBzdWNjZXNzQ2FsbGJhY2ssIHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKSB7XG4gICAgdmFyIHN0b3JlSGFuZGVyID0gX3RyYW5zYWN0aW9uR2VuZXJhdG9yKHRydWUpO1xuICAgIHZhciByYW5nZSA9IF9yYW5nZUdlbmVyYXRvcigpO1xuICAgIHZhciByZXN1bHQgPSBbXTsgLy8gdXNlIGFuIGFycmF5IHRvIHN0b3JhZ2UgZWxpZ2libGUgZGF0YVxuXG4gICAgc3RvcmVIYW5kZXIub3BlbkN1cnNvcihyYW5nZSwgJ25leHQnKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRDb25kaXRpb25JdGVtSGFuZGxlcihlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIGlmICh3aGV0aGVyKSB7XG4gICAgICAgICAgaWYgKGN1cnNvci52YWx1ZVtjb25kaXRpb25dKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChjdXJzb3IudmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghd2hldGhlcikge1xuICAgICAgICAgIGlmICghY3Vyc29yLnZhbHVlW2NvbmRpdGlvbl0pIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGN1cnNvci52YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX3N1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoc3VjY2Vzc0NhbGxiYWNrLCByZXN1bHQsIHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0QWxsKHN1Y2Nlc3NDYWxsYmFjaywgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpIHtcbiAgICB2YXIgc3RvcmVIYW5kZXIgPSBfdHJhbnNhY3Rpb25HZW5lcmF0b3IodHJ1ZSk7XG4gICAgdmFyIHJhbmdlID0gX3JhbmdlR2VuZXJhdG9yKCk7XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgc3RvcmVIYW5kZXIub3BlbkN1cnNvcihyYW5nZSwgJ25leHQnKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRBbGxIYW5kbGVyKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goY3Vyc29yLnZhbHVlKTtcbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfc3VjY2Vzc0NhbGxiYWNrSGFuZGxlcihzdWNjZXNzQ2FsbGJhY2ssIHJlc3VsdCwgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyB1cGRhdGUgb25lXG4gIGZ1bmN0aW9uIHVwZGF0ZUl0ZW0obmV3RGF0YSwgc3VjY2Vzc0NhbGxiYWNrLCBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlcikge1xuICAgIC8vICNUT0RPOiB1cGRhdGUgcGFydFxuICAgIHZhciBzdG9yZUhhbmRlciA9IF90cmFuc2FjdGlvbkdlbmVyYXRvcih0cnVlKTtcbiAgICB2YXIgcHV0U3RvcmUgPSBzdG9yZUhhbmRlci5wdXQobmV3RGF0YSk7XG5cbiAgICBwdXRTdG9yZS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiB1cGRhdGVTdWNjZXNzKCkge1xuICAgICAgY29uc29sZS5sb2coJ0FoYSwgbW9kaWZ5IHN1Y2NlZWQnKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgX3N1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoc3VjY2Vzc0NhbGxiYWNrLCBuZXdEYXRhLCBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlcik7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlbGV0ZU9uZShrZXksIHN1Y2Nlc3NDYWxsYmFjaywgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpIHtcbiAgICB2YXIgc3RvcmVIYW5kZXIgPSBfdHJhbnNhY3Rpb25HZW5lcmF0b3IodHJ1ZSk7XG4gICAgdmFyIGRlbGV0ZU9wdCA9IHN0b3JlSGFuZGVyLmRlbGV0ZShrZXkpO1xuXG4gICAgZGVsZXRlT3B0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGRlbGV0ZVN1Y2Nlc3MoKSB7XG4gICAgICBjb25zb2xlLmxvZygnZGVsZXRlIChrZXk6ICcgKyBrZXkgKyAgJ1xcJylzIHZhbHVlIHN1Y2NlZWQnKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgX3N1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoc3VjY2Vzc0NhbGxiYWNrLCBrZXksIHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIoc3VjY2Vzc0NhbGxiYWNrLCBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlcikge1xuICAgIHZhciBzdG9yZUhhbmRlciA9IF90cmFuc2FjdGlvbkdlbmVyYXRvcih0cnVlKTtcbiAgICB2YXIgcmFuZ2UgPSBfcmFuZ2VHZW5lcmF0b3IoKTtcblxuICAgIHN0b3JlSGFuZGVyLm9wZW5DdXJzb3IocmFuZ2UsICduZXh0Jykub25zdWNjZXNzID0gZnVuY3Rpb24gY2xlYXJIYW5kbGVyKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICB2YXIgcmVxdWVzdERlbDtcblxuICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICByZXF1ZXN0RGVsID0gY3Vyc29yLmRlbGV0ZSgpO1xuICAgICAgICByZXF1ZXN0RGVsLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIHN1Y2Nlc3MoKSB7XG4gICAgICAgIH07XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfSBlbHNlIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgX3N1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoc3VjY2Vzc0NhbGxiYWNrLCAnYWxsIGRhdGEnLCBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlcik7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8qIDMgcHJpdmF0ZSBtZXRob2RzICovXG5cbiAgZnVuY3Rpb24gX3RyYW5zYWN0aW9uR2VuZXJhdG9yKHdoZXRoZXJXcml0ZSkge1xuICAgIHZhciB0cmFuc2FjdGlvbjtcblxuICAgIGlmICh3aGV0aGVyV3JpdGUpIHtcbiAgICAgIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtfc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbX3N0b3JlTmFtZV0pO1xuICAgIH1cblxuICAgIHJldHVybiB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShfc3RvcmVOYW1lKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9yYW5nZUdlbmVyYXRvcigpIHtcbiAgICBpZiAoX2luaXRpYWxKU09ORGF0YVVzZWZ1bCkge1xuICAgICAgcmV0dXJuIElEQktleVJhbmdlLmxvd2VyQm91bmQoMCk7XG4gICAgfVxuICAgIC8vICNGSVhNRTogXG4gICAgLy8gY29uc29sZS5sb2coX2luaXRpYWxKU09ORGF0YUxlbik7XG4gICAgcmV0dXJuIElEQktleVJhbmdlLmxvd2VyQm91bmQoMSAtIDEsIHRydWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3N1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoc3VjY2Vzc0NhbGxiYWNrLCByZXN1bHQsIHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKSB7XG4gICAgaWYgKHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKSB7XG4gICAgICBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlci51bnNoaWZ0KHJlc3VsdCk7XG4gICAgICBzdWNjZXNzQ2FsbGJhY2suYXBwbHkobnVsbCwgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdWNjZXNzQ2FsbGJhY2socmVzdWx0KTtcbiAgICB9XG4gIH1cblxuICAvKiBwdWJsaWMgaW50ZXJmYWNlICovXG4gIHJldHVybiB7XG4gICAgaW5pdDogaW5pdCxcbiAgICBnZXROZXdLZXk6IGdldE5ld0tleSxcbiAgICBhZGRJdGVtOiBhZGRJdGVtLFxuICAgIGdldEl0ZW06IGdldEl0ZW0sXG4gICAgZ2V0Q29uZGl0aW9uSXRlbTogZ2V0Q29uZGl0aW9uSXRlbSxcbiAgICBnZXRBbGw6IGdldEFsbCxcbiAgICB1cGRhdGVJdGVtOiB1cGRhdGVJdGVtLFxuICAgIHJlbW92ZUl0ZW06IGRlbGV0ZU9uZSxcbiAgICBjbGVhcjogY2xlYXJcbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gaW5kZXhlZERCSGFuZGxlcjtcbiIsIid1c2Ugc3RyaWN0JztcbihmdW5jdGlvbiBpbml0KCkge1xuICAvLyB2YXIgREIgPSByZXF1aXJlKCdpbmRleGVkZGItY3J1ZCcpO1xuICAvLyB2YXIgbGlzdERCQ29uZmlnID0gcmVxdWlyZSgnLi9kYi9saXN0Q29uZmlnJyk7XG4gIHZhciBhZGRFdmVudHMgPSByZXF1aXJlKCcuL3V0bGlzL2FkZEV2ZW50cy5qcycpO1xuXG4gIC8vIG9wZW4gREIsIGFuZCB3aGVuIERCIG9wZW4gc3VjY2VlZCwgaW52b2tlIGluaXRpYWwgZnVuY3Rpb25cbiAgLy8gREIuaW5pdChsaXN0REJDb25maWcsIGFkZEV2ZW50cy5zdWNjZXNzLCBhZGRFdmVudHMuZmFpbCk7XG4gIGFkZEV2ZW50cy5mYWlsKCk7XG59KCkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGFkZEV2ZW50cyA9IChmdW5jdGlvbiBhZGRFdmVudHNHZW5lcmF0b3IoKSB7XG4gIGZ1bmN0aW9uIF93aGV0aGVyU3VjY2Vzcyh3aGV0aGVyU3VjY2Vzcykge1xuICAgIGNvbnNvbGUubG9nKHdoZXRoZXJTdWNjZXNzKTtcblxuICAgIGZ1bmN0aW9uIF93aGV0aGVyU3VjY2Vzc0hhbmRsZXIod2hldGhlcikge1xuICAgICAgdmFyIGV2ZW50SGFuZGxlciA9IHJlcXVpcmUoJy4vZXZlbnRIYW5kbGVyLmpzJyk7XG4gICAgICB2YXIgaGFuZGxlciA9IHdoZXRoZXIgPyBldmVudEhhbmRsZXIuc3VjY2VzcyA6IGV2ZW50SGFuZGxlci5mYWlsO1xuICAgICAgdmFyIGxpc3Q7XG5cbiAgICAgIGhhbmRsZXIuc2hvd0luaXQoKTtcbiAgICAgIC8vIGFkZCBhbGwgZXZlbnRMaXN0ZW5lclxuICAgICAgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgICBsaXN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5jbGlja0xpLCBmYWxzZSk7XG4gICAgICBsaXN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5yZW1vdmVMaSwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZXIuZW50ZXJBZGQsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhZGQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuYWRkLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0RvbmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0RvbmUsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93VG9kbycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93VG9kbywgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dBbGwnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0FsbCwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dDbGVhcicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93Q2xlYXIsIGZhbHNlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgX3doZXRoZXJTdWNjZXNzSGFuZGxlcih3aGV0aGVyU3VjY2Vzcyk7XG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc3VjY2VzczogX3doZXRoZXJTdWNjZXNzKHRydWUpLFxuICAgIGZhaWw6IF93aGV0aGVyU3VjY2VzcyhmYWxzZSlcbiAgfTtcbn0oKSk7XG5jb25zb2xlLmRpcihhZGRFdmVudHMpO1xuLy8gY29uc29sZS5sb2coYWRkRXZlbnRzLmZhaWwoKSk7XG4vLyBjb25zb2xlLmxvZyhhZGRFdmVudHMuc3VjY2VzcygpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBhZGRFdmVudHM7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgY3JlYXRlTGkgPSAoZnVuY3Rpb24gbGlHZW5lcmF0b3IoKSB7XG4gIGZ1bmN0aW9uIF9kZWNvcmF0ZUxpKGxpLCBkYXRhKSB7XG4gICAgdmFyIHRleHREYXRlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YS51c2VyRGF0ZSArICc6ICcpO1xuICAgIHZhciB0ZXh0V3JhcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcgJyArIGRhdGEuZXZlbnQpO1xuXG4gICAgLy8gd3JhcCBhcyBhIG5vZGVcbiAgICB0ZXh0V3JhcC5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICBsaS5hcHBlbmRDaGlsZCh0ZXh0RGF0ZSk7XG4gICAgbGkuYXBwZW5kQ2hpbGQodGV4dFdyYXApO1xuICAgIGlmIChkYXRhLmZpbmlzaGVkKSB7ICAvLyBhZGQgY3NzLXN0eWxlIHRvIGl0IChhY2NvcmRpbmcgdG8gaXQncyBkYXRhLmZpbmlzaGVkIHZhbHVlKVxuICAgICAgbGkuY2xhc3NMaXN0LmFkZCgnZmluaXNoZWQnKTsgLy8gYWRkIHN0eWxlXG4gICAgfVxuICAgIF9hZGRYKGxpLCBkYXRhLmlkKTsgLy8gYWRkIHNwYW4gW3hdIHRvIGxpJ3MgdGFpbFxuICAgIF9zZXREYXRhUHJvcGVydHkobGksICdkYXRhLWlkJywgZGF0YS5pZCk7IC8vIGFkZCBwcm9wZXJ0eSB0byBsaSAoZGF0YS1pZCnvvIxmb3IgIGNsaWNrTGlcbiAgfVxuXG4gIGZ1bmN0aW9uIF9hZGRYKGxpLCBpZCkge1xuICAgIHZhciBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHZhciB4ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJ1xcdTAwRDcnKTsgLy8gdW5pY29kZSAtPiB4XG5cbiAgICBzcGFuLmFwcGVuZENoaWxkKHgpO1xuICAgIHNwYW4uY2xhc3NOYW1lID0gJ2Nsb3NlJzsgLy8gYWRkIHN0eWxlXG4gICAgX3NldERhdGFQcm9wZXJ0eShzcGFuLCAnZGF0YS14JywgaWQpOyAvLyBhZGQgcHJvcGVydHkgdG8gc3BhbiAoZGF0YS14KSwgZm9yIGRlbGV0ZUxpXG4gICAgbGkuYXBwZW5kQ2hpbGQoc3Bhbik7XG4gIH1cblxuICBmdW5jdGlvbiBfc2V0RGF0YVByb3BlcnR5KHRhcmdldCwgbmFtZSwgZGF0YSkge1xuICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUobmFtZSwgZGF0YSk7XG4gIH1cblxuXG4gIHJldHVybiBmdW5jdGlvbiBjcmVhdGUoZGF0YSkge1xuICAgIHZhciBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG5cbiAgICBfZGVjb3JhdGVMaShsaSwgZGF0YSk7IC8vIGRlY29yYXRlIGxpXG5cbiAgICByZXR1cm4gbGk7XG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUxpO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGV2ZW50SGFuZGxlciA9IChmdW5jdGlvbiBoYW5kbGVyR2VuZXJhdG9yKCkge1xuICBmdW5jdGlvbiBfd2hldGhlclN1Y2Nlc3Mod2hldGhlclN1Y2Nlc3MpIHtcbiAgICBjb25zb2xlLmxvZyh3aGV0aGVyU3VjY2Vzcyk7XG5cbiAgICBmdW5jdGlvbiBfd2hldGhlclN1Y2Nlc3NIYW5kbGVyKHdoZXRoZXIpIHtcbiAgICAgIHZhciBEQjtcbiAgICAgIHZhciByZWZyZXNoID0gcmVxdWlyZSgnLi9yZWZyZXNoLmpzJyk7XG4gICAgICB2YXIgY3JlYXRlTGkgPSByZXF1aXJlKCcuL2NyZWF0ZUxpJyk7XG5cbiAgICAgIGlmICh3aGV0aGVyKSB7XG4gICAgICAgIERCID0gcmVxdWlyZSgnaW5kZXhlZGRiLWNydWQnKTtcbiAgICAgICAgY29uc29sZS5sb2coJ2dldCBkYicpO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBhZGQoKSB7XG4gICAgICAgIHZhciBpbnB1dFZhbHVlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWU7XG4gICAgICAgIHZhciBsaXN0O1xuICAgICAgICB2YXIgbmV3RGF0YTtcbiAgICAgICAgdmFyIG5ld0xpO1xuXG4gICAgICAgIGlmIChpbnB1dFZhbHVlID09PSAnJykge1xuICAgICAgICAgIGFsZXJ0KCdwbGVhc2UgaW5wdXQgYSByZWFsIGRhdGF+Jyk7XG4gICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgX2lmRW1wdHkoKTtcbiAgICAgICAgbmV3RGF0YSA9IF9pbnRlZ3JhdGVOZXdEYXRhKGlucHV0VmFsdWUpO1xuICAgICAgICBuZXdMaSA9IGNyZWF0ZUxpKG5ld0RhdGEpO1xuICAgICAgICBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgICAgICAgbGlzdC5pbnNlcnRCZWZvcmUobmV3TGksIGxpc3QuZmlyc3RDaGlsZCk7IC8vIHB1c2ggbmV3TGkgdG8gZmlyc3RcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWUgPSAnJzsgIC8vIHJlc2V0IGlucHV0J3MgdmFsdWVzXG5cbiAgICAgICAgaWYgKHdoZXRoZXIpIHtcbiAgICAgICAgICBEQi5hZGRJdGVtKG5ld0RhdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGVudGVyQWRkKGUpIHtcbiAgICAgICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgICBhZGQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBsaSdzIFt4XSdzIGRlbGV0ZVxuICAgICAgZnVuY3Rpb24gcmVtb3ZlTGkoZSkge1xuICAgICAgICB2YXIgaWQ7XG5cbiAgICAgICAgaWYgKGUudGFyZ2V0LmNsYXNzTmFtZSA9PT0gJ2Nsb3NlJykgeyAvLyB1c2UgZXZlbnQgZGVsZWdhdGlvblxuICAgICAgICAgIC8vIHVzZSBwcmV2aW91c2x5IHN0b3JlZCBkYXRhXG4gICAgICAgICAgcmVmcmVzaC5kaXNhcHBlYXIoZS50YXJnZXQucGFyZW50Tm9kZSk7XG5cbiAgICAgICAgICBpZiAod2hldGhlcikge1xuICAgICAgICAgICAgaWQgPSBwYXJzZUludChlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEteCcpLCAxMCk7XG4gICAgICAgICAgICBEQi5yZW1vdmVJdGVtKGlkLCBzaG93QWxsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gc2hvd0luaXQoKSB7XG4gICAgICAgIHJlZnJlc2guY2xlYXIoKTtcblxuICAgICAgICB3aGV0aGVyID8gREIuZ2V0QWxsKHJlZnJlc2guaW5pdCkgOiByZWZyZXNoLmluaXQoKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gc2hvd0FsbCgpIHtcbiAgICAgICAgaWYgKHdoZXRoZXIpIHtcbiAgICAgICAgICByZWZyZXNoLmNsZWFyKCk7XG4gICAgICAgICAgREIuZ2V0QWxsKHJlZnJlc2guYWxsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNsaXN0IGxpJyksIGZ1bmN0aW9uIGFwcGVhckFsbChlbGVtZW50KSB7XG4gICAgICAgICAgICByZWZyZXNoLmFwcGVhcihlbGVtZW50KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBzaG93Q2xlYXIoKSB7XG4gICAgICAgIHJlZnJlc2guY2xlYXIoKTsgLy8gY2xlYXIgbm9kZXMgdmlzdWFsbHlcbiAgICAgICAgcmVmcmVzaC5yYW5kb20oKTtcblxuICAgICAgICBpZiAod2hldGhlcikge1xuICAgICAgICAgIERCLmNsZWFyKCk7IC8vIGNsZWFyIGRhdGEgaW5kZWVkXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gc2hvd0RvbmUoKSB7XG4gICAgICAgIF9zaG93V2hldGhlckRvbmUodHJ1ZSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHNob3dUb2RvKCkge1xuICAgICAgICBfc2hvd1doZXRoZXJEb25lKGZhbHNlKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gY2xpY2tMaShlKSB7XG4gICAgICAgIHZhciBpZDtcbiAgICAgICAgdmFyIHRhcmdldExpID0gZS50YXJnZXQ7XG4gICAgICAgIC8vIHVzZSBldmVudCBkZWxlZ2F0aW9uXG5cbiAgICAgICAgaWYgKHRhcmdldExpLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpKSB7XG4gICAgICAgICAgaWYgKHdoZXRoZXIpIHtcbiAgICAgICAgICAgIGlkID0gcGFyc2VJbnQodGFyZ2V0TGkuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyksIDEwKTsgLy8gdXNlIHByZXZpb3VzbHkgc3RvcmVkIGRhdGEtaWQgYXR0cmlidXRlXG4gICAgICAgICAgICBEQi5nZXRJdGVtKGlkLCBfc3dpdGNoTGksIFt0YXJnZXRMaV0pOyAvLyBwYXNzIF9zd2l0Y2hMaSBhbmQgcGFyYW0gW2UudGFyZ2V0XSBhcyBjYWxsYmFja1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfc3dpdGNoTGkodm9pZCAwLCB0YXJnZXRMaSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cblxuICAgICAgLyogcHJpdmF0ZSBtZXRob2RzICovXG4gICAgICBmdW5jdGlvbiBfaWZFbXB0eSgpIHtcbiAgICAgICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gICAgICAgIGlmIChsaXN0LmZpcnN0Q2hpbGQuY2xhc3NOYW1lID09PSAnYXBob3Jpc20nKSB7XG4gICAgICAgICAgbGlzdC5yZW1vdmVDaGlsZChsaXN0LmZpcnN0Q2hpbGQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIF9pbnRlZ3JhdGVOZXdEYXRhKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaWQ6IHdoZXRoZXIgPyBEQi5nZXROZXdLZXkoKSA6IDIzMyxcbiAgICAgICAgICBldmVudDogdmFsdWUsXG4gICAgICAgICAgZmluaXNoZWQ6IGZhbHNlLFxuICAgICAgICAgIHVzZXJEYXRlOiBfZ2V0TmV3RGF0ZSgneXl5eeW5tE1N5pyIZGTml6UgaGg6bW0nKVxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICAvLyBGb3JtYXQgZGF0ZVxuICAgICAgZnVuY3Rpb24gX2dldE5ld0RhdGUoZm10KSB7XG4gICAgICAgIHZhciBuZXdEYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgdmFyIG5ld2ZtdCA9IGZtdDtcbiAgICAgICAgdmFyIG8gPSB7XG4gICAgICAgICAgJ3krJzogbmV3RGF0ZS5nZXRGdWxsWWVhcigpLFxuICAgICAgICAgICdNKyc6IG5ld0RhdGUuZ2V0TW9udGgoKSArIDEsXG4gICAgICAgICAgJ2QrJzogbmV3RGF0ZS5nZXREYXRlKCksXG4gICAgICAgICAgJ2grJzogbmV3RGF0ZS5nZXRIb3VycygpLFxuICAgICAgICAgICdtKyc6IG5ld0RhdGUuZ2V0TWludXRlcygpXG4gICAgICAgIH07XG4gICAgICAgIHZhciBsZW5zO1xuXG4gICAgICAgIGZvciAodmFyIGsgaW4gbykge1xuICAgICAgICAgIGlmIChuZXcgUmVnRXhwKCcoJyArIGsgKyAnKScpLnRlc3QobmV3Zm10KSkge1xuICAgICAgICAgICAgaWYgKGsgPT09ICd5KycpIHtcbiAgICAgICAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoJycgKyBvW2tdKS5zdWJzdHIoNCAtIFJlZ0V4cC4kMS5sZW5ndGgpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoayA9PT0gJ1MrJykge1xuICAgICAgICAgICAgICBsZW5zID0gUmVnRXhwLiQxLmxlbmd0aDtcbiAgICAgICAgICAgICAgbGVucyA9IGxlbnMgPT09IDEgPyAzIDogbGVucztcbiAgICAgICAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoJzAwJyArIG9ba10pLnN1YnN0cigoJycgKyBvW2tdKS5sZW5ndGggLSAxLCBsZW5zKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChSZWdFeHAuJDEubGVuZ3RoID09PSAxKSA/IChvW2tdKSA6ICgoJzAwJyArIG9ba10pLnN1YnN0cigoJycgKyBvW2tdKS5sZW5ndGgpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ld2ZtdDtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gX3Nob3dXaGV0aGVyRG9uZSh3aGV0aGVyRG9uZSkge1xuICAgICAgICB2YXIgY29uZGl0aW9uID0gJ2ZpbmlzaGVkJztcbiAgICAgICAgdmFyIGxpc3RJdGVtcztcblxuICAgICAgICBpZiAod2hldGhlcikge1xuICAgICAgICAgIHJlZnJlc2guY2xlYXIoKTtcbiAgICAgICAgICBEQi5nZXRDb25kaXRpb25JdGVtKGNvbmRpdGlvbiwgd2hldGhlckRvbmUsIHJlZnJlc2gucGFydCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGlzdEl0ZW1zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2xpc3QgbGknKTtcbiAgICAgICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKGxpc3RJdGVtcywgZnVuY3Rpb24gd2hldGhlckRvbmVBcHBlYXIoZWxlbWVudCkge1xuICAgICAgICAgICAgaWYgKHdoZXRoZXJEb25lKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKGNvbmRpdGlvbikgPyByZWZyZXNoLmFwcGVhcihlbGVtZW50KSA6IHJlZnJlc2guZGlzYXBwZWFyKGVsZW1lbnQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoY29uZGl0aW9uKSA/IHJlZnJlc2guZGlzYXBwZWFyKGVsZW1lbnQpIDogcmVmcmVzaC5hcHBlYXIoZWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgbGlzdEl0ZW1zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2xpc3QgbGknKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBfc3dpdGNoTGkoZGF0YSwgdGFyZ2V0TGkpIHtcbiAgICAgICAgdGFyZ2V0TGkuY2xhc3NMaXN0LnRvZ2dsZSgnZmluaXNoZWQnKTtcblxuICAgICAgICBpZiAod2hldGhlcikge1xuICAgICAgICAgIGRhdGEuZmluaXNoZWQgPSAhZGF0YS5maW5pc2hlZDsgIC8vIHRvZ2dsZSBkYXRhLmZpbmlzaGVkXG4gICAgICAgICAgREIudXBkYXRlSXRlbShkYXRhLCBzaG93QWxsKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBhZGQ6IGFkZCxcbiAgICAgICAgZW50ZXJBZGQ6IGVudGVyQWRkLFxuICAgICAgICBjbGlja0xpOiBjbGlja0xpLFxuICAgICAgICByZW1vdmVMaTogcmVtb3ZlTGksXG4gICAgICAgIHNob3dJbml0OiBzaG93SW5pdCxcbiAgICAgICAgc2hvd0FsbDogc2hvd0FsbCxcbiAgICAgICAgc2hvd0NsZWFyOiBzaG93Q2xlYXIsXG4gICAgICAgIHNob3dEb25lOiBzaG93RG9uZSxcbiAgICAgICAgc2hvd1RvZG86IHNob3dUb2RvXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBfd2hldGhlclN1Y2Nlc3NIYW5kbGVyKHdoZXRoZXJTdWNjZXNzKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc3VjY2VzczogX3doZXRoZXJTdWNjZXNzKHRydWUpLFxuICAgIGZhaWw6IF93aGV0aGVyU3VjY2VzcyhmYWxzZSlcbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZXZlbnRIYW5kbGVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIHJlZnJlc2ggPSAoZnVuY3Rpb24gcmVmcmVzaEdlbmVyYXRvcigpIHtcbiAgdmFyIGNyZWF0ZUxpID0gcmVxdWlyZSgnLi9jcmVhdGVMaS5qcycpO1xuXG4gIGZ1bmN0aW9uIGluaXQoZGF0YUFycikge1xuICAgIF9zaG93KGRhdGFBcnIsIF9pbml0U2VudGVuY2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gYWxsKGRhdGFBcnIpIHtcbiAgICBfc2hvdyhkYXRhQXJyLCByYW5kb21BcGhvcmlzbSk7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJ0KGRhdGFBcnIpIHtcbiAgICB2YXIgbm9kZXM7XG5cbiAgICBpZiAoIWRhdGFBcnIgfHwgZGF0YUFyci5sZW5ndGggPT09IDApIHtcbiAgICAgIHJhbmRvbUFwaG9yaXNtKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vZGVzID0gZGF0YUFyci5yZWR1Y2UoZnVuY3Rpb24gbm9kZUdlbmVyYXRvcihyZXN1bHQsIGRhdGEpIHtcbiAgICAgICAgcmVzdWx0Lmluc2VydEJlZm9yZShjcmVhdGVMaShkYXRhKSwgcmVzdWx0LmZpcnN0Q2hpbGQpO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9LCBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCkpOyAvLyBicmlsbGlhbnQgYXJyLnJlZHVjZSgpICsgZG9jdW1lbnRGcmFnbWVudFxuXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmFwcGVuZENoaWxkKG5vZGVzKTsgLy8gYWRkIGl0IHRvIERPTVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVhcihlbGVtZW50KSB7XG4gICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgfVxuXG4gIGZ1bmN0aW9uIGRpc2FwcGVhcihlbGVtZW50KSB7XG4gICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgdmFyIHJvb3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gICAgd2hpbGUgKHJvb3QuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICByb290LnJlbW92ZUNoaWxkKHJvb3QuZmlyc3RDaGlsZCk7IC8vIHRoZSBiZXN0IHdheSB0byBjbGVhbiBjaGlsZE5vZGVzXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmFuZG9tQXBob3Jpc20oKSB7XG4gICAgdmFyIGFwaG9yaXNtcyA9IFtcbiAgICAgICdZZXN0ZXJkYXkgWW91IFNhaWQgVG9tb3Jyb3cnLFxuICAgICAgJ1doeSBhcmUgd2UgaGVyZT8nLFxuICAgICAgJ0FsbCBpbiwgb3Igbm90aGluZycsXG4gICAgICAnWW91IE5ldmVyIFRyeSwgWW91IE5ldmVyIEtub3cnLFxuICAgICAgJ1RoZSB1bmV4YW1pbmVkIGxpZmUgaXMgbm90IHdvcnRoIGxpdmluZy4gLS0gU29jcmF0ZXMnXG4gICAgXTtcbiAgICB2YXIgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcGhvcmlzbXMubGVuZ3RoKTtcbiAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGFwaG9yaXNtc1tyYW5kb21JbmRleF0pO1xuXG4gICAgX3NlbnRlbmNlR2VuZXJhdG9yKHRleHQpO1xuICB9XG5cblxuICAvKiBwcml2YXRlIG1ldGhvZHMgKi9cblxuICBmdW5jdGlvbiBfc2hvdyhkYXRhQXJyLCBzZW50ZW5jZUZ1bmMpIHtcbiAgICBpZiAoIWRhdGFBcnIgfHwgZGF0YUFyci5sZW5ndGggPT09IDApIHtcbiAgICAgIHNlbnRlbmNlRnVuYygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBfc2hvd1JlZnJlc2goZGF0YUFycik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX3Nob3dSZWZyZXNoKGRhdGFBcnIpIHtcbiAgICB2YXIgcmVzdWx0ID0gX2NsYXNzaWZ5RGF0YShkYXRhQXJyKTtcblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuYXBwZW5kQ2hpbGQocmVzdWx0KTsgLy8gYWRkIGl0IHRvIERPTVxuICB9XG5cbiAgZnVuY3Rpb24gX2NsYXNzaWZ5RGF0YShkYXRhQXJyKSB7XG4gICAgLy8gdXNlIGZyYWdtZW50IHRvIHJlZHVjZSBET00gb3BlcmF0ZVxuICAgIHZhciB1bmZpc2hpZWQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIGZpbmlzaGVkID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIHZhciBmdXNpb24gPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cbiAgICAvLyBwdXQgdGhlIGZpbmlzaGVkIGl0ZW0gdG8gdGhlIGJvdHRvbVxuICAgIGRhdGFBcnIuZm9yRWFjaChmdW5jdGlvbiBjbGFzc2lmeShkYXRhKSB7XG4gICAgICBpZiAoZGF0YS5maW5pc2hlZCkge1xuICAgICAgICBmaW5pc2hlZC5pbnNlcnRCZWZvcmUoY3JlYXRlTGkoZGF0YSksIGZpbmlzaGVkLmZpcnN0Q2hpbGQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdW5maXNoaWVkLmluc2VydEJlZm9yZShjcmVhdGVMaShkYXRhKSwgdW5maXNoaWVkLmZpcnN0Q2hpbGQpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGZ1c2lvbi5hcHBlbmRDaGlsZCh1bmZpc2hpZWQpO1xuICAgIGZ1c2lvbi5hcHBlbmRDaGlsZChmaW5pc2hlZCk7XG5cbiAgICByZXR1cm4gZnVzaW9uO1xuICB9XG5cbiAgZnVuY3Rpb24gX2luaXRTZW50ZW5jZSgpIHtcbiAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCdXZWxjb21lfiwgdHJ5IHRvIGFkZCB5b3VyIGZpcnN0IHRvLWRvIGxpc3QgOiApJyk7XG5cbiAgICBfc2VudGVuY2VHZW5lcmF0b3IodGV4dCk7XG4gIH1cblxuICBmdW5jdGlvbiBfc2VudGVuY2VHZW5lcmF0b3IodGV4dCkge1xuICAgIHZhciBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG5cbiAgICBsaS5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICBsaS5jbGFzc05hbWUgPSAnYXBob3Jpc20nO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuYXBwZW5kQ2hpbGQobGkpO1xuICB9XG5cblxuICAvKiBpbnRlcmZhY2UgKi9cbiAgcmV0dXJuIHtcbiAgICBpbml0OiBpbml0LFxuICAgIGFsbDogYWxsLFxuICAgIHBhcnQ6IHBhcnQsXG4gICAgY2xlYXI6IGNsZWFyLFxuICAgIGFwcGVhcjogYXBwZWFyLFxuICAgIGRpc2FwcGVhcjogZGlzYXBwZWFyLFxuICAgIHJhbmRvbTogcmFuZG9tQXBob3Jpc21cbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVmcmVzaDtcbiJdfQ==
