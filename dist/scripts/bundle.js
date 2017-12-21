(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
var indexedDBHandler = (function indexedDBHandler() {
  var _db;
  var _storeName;
  var _presentKey;
  var _configKey;

  /* init indexedDB */

  function init(config, successCallback, failCallback) {
    // firstly inspect browser's support for indexedDB
    if (!window.indexedDB) {
      window.alert('Your browser doesn\'t support a stable version of IndexedDB. We will offer you the without indexedDB mode');
      failCallback();
      return 0;
    }
    _storeName = config.storeName; // storage storeName
    _configKey = config.key;
    _openDB(config, successCallback, failCallback);

    return 0;
  }

  function _openDB(config, successCallback, failCallback) {
    var request = indexedDB.open(config.name, config.version); // open indexedDB

    request.onerror = function _openDBError(e) {
      // window.alert('Pity, fail to load indexedDB. We will offer you the without indexedDB mode');
      window.alert('Something is wrong with indexedDB, we offer you the without DB mode, for more information, checkout console');
      console.log(e.target.error);
      failCallback();
    };
    request.onsuccess = function _openDBSuccess(e) {
      _db = e.target.result;
      successCallback();
      _getPresentKey();
    };

    // Creating or updating the version of the database
    request.onupgradeneeded = function schemaUp(e) {
      _db = e.target.result;
      console.log('onupgradeneeded in');
      if (!(_db.objectStoreNames.contains(_storeName))) {
        _createStoreHandler(config.key, config.initialData);
      }
    };
  }

  function _createStoreHandler(key, initialData) {
    var objectStore = _db.createObjectStore(_storeName, { keyPath: key, autoIncrement: true });

    // Use transaction oncomplete to make sure the objectStore creation is
    objectStore.transaction.oncomplete = function addInitialData() {
      var storeHander;

      console.log('create ' + _storeName + '\'s objectStore succeed');
      if (initialData) {
        // Store initial values in the newly created objectStore.
        storeHander = _transactionGenerator(true);
        try {
          initialData.forEach(function addEveryInitialData(data, index) {
            storeHander.add(data);
            console.log('add initial data[' + index + '] successed');
          });
        } catch (error) {
          console.log(error);
          window.alert('please set correct initial array object data :)');
        }
      }
    };
  }

  // set present key value to _presentKey (the private property)
  function _getPresentKey() {
    _transactionGenerator(true).openCursor(_rangeGenerator(), 'next').onsuccess = function _getPresentKeyHandler(e) {
      var cursor = e.target.result;

      if (cursor) {
        cursor.continue();
        _presentKey = cursor.value.id;
      } else {
        if (!_presentKey) {
          _presentKey = 0;
        }
        console.log('now key = ' +  _presentKey); // initial value is 0
      }
    };
  }

  function _rangeGenerator() {
    return IDBKeyRange.lowerBound(1);
  }

  function getNewKey() {
    _presentKey += 1;

    return _presentKey;
  }


  /* CRUD */

  function addItem(newData, successCallback, successCallbackArrayParameter) {
    var addRequest = _transactionGenerator(true).add(newData);

    addRequest.onsuccess = function success() {
      console.log('\u2713 add ' + _configKey + ' = ' + newData[_configKey] + ' data succeed :)');
      if (successCallback) {
        _successCallbackHandler(successCallback, newData, successCallbackArrayParameter);
      }
    };
  }

  function getItem(key, successCallback, successCallbackArrayParameter) {
    var getRequest = _transactionGenerator(false).get(parseInt(key, 10));  // get it by index

    getRequest.onsuccess = function getDataSuccess() {
      console.log('\u2713 get '  + _configKey + ' = ' + key + ' data success :)');
      _successCallbackHandler(successCallback, getRequest.result, successCallbackArrayParameter);
    };
  }

  // retrieve eligible data (boolean condition)
  function getConditionItem(condition, whether, successCallback, successCallbackArrayParameter) {
    var result = []; // use an array to storage eligible data

    _transactionGenerator(true).openCursor(_rangeGenerator(), 'next').onsuccess = function getConditionItemHandler(e) {
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
    var result = [];

    _transactionGenerator(true).openCursor(_rangeGenerator(), 'next').onsuccess = function getAllHandler(e) {
      var cursor = e.target.result;

      if (cursor) {
        result.push(cursor.value);
        cursor.continue();
      } else {
        console.log('\u2713 get all data success :)');
        _successCallbackHandler(successCallback, result, successCallbackArrayParameter);
      }
    };
  }

  // update one
  function updateItem(newData, successCallback, successCallbackArrayParameter) {
    var putRequest = _transactionGenerator(true).put(newData);

    putRequest.onsuccess = function putSuccess() {
      console.log('\u2713 update ' + _configKey + ' = ' + newData[_configKey] + ' data success :)');
      if (successCallback) {
        _successCallbackHandler(successCallback, newData, successCallbackArrayParameter);
      }
    };
  }

  function removeItem(key, successCallback, successCallbackArrayParameter) {
    var deleteRequest = _transactionGenerator(true).delete(key);

    deleteRequest.onsuccess = function deleteSuccess() {
      console.log('\u2713 remove ' + _configKey + ' = ' + key + ' data success :)');
      if (successCallback) {
        _successCallbackHandler(successCallback, key, successCallbackArrayParameter);
      }
    };
  }

  function clear(successCallback, successCallbackArrayParameter) {
    _transactionGenerator(true).openCursor(_rangeGenerator(), 'next').onsuccess = function clearHandler(e) {
      var cursor = e.target.result;
      var deleteRequest;

      if (cursor) {
        deleteRequest = cursor.delete();
        deleteRequest.onsuccess = function success() {
        };
        cursor.continue();
      } else if (successCallback) {
        _successCallbackHandler(successCallback, 'all data', successCallbackArrayParameter);
      } else {
        console.log('\u2713 clear all data success :)');
      }
    };
  }


  function _transactionGenerator(whetherWrite) {
    var transaction;

    if (whetherWrite) {
      transaction = _db.transaction([_storeName], 'readwrite');
    } else {
      transaction = _db.transaction([_storeName]);
    }

    return transaction.objectStore(_storeName);
  }

  function _successCallbackHandler(successCallback, result, successCallbackArrayParameter) {
    if (successCallbackArrayParameter) {
      if (Array.isArray(successCallbackArrayParameter)) {
        successCallbackArrayParameter.unshift(result);
        successCallback.apply(null, successCallbackArrayParameter);
      } else {
        throw new TypeError('please set correct array type of callback parameter');
      }
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
    removeItem: removeItem,
    clear: clear
  };
}());

module.exports = indexedDBHandler;

},{}],2:[function(require,module,exports){
'use strict';
module.exports = {
  name: 'JustToDo',
  version: '13',
  key: 'id',
  storeName: 'list',
  initialData: [
    { id: 1, event: 'dosomething', finished: true, date: 0 },
    { id: 2, event: 'dosomething', finished: false, date: 0 }
  ]
};

},{}],3:[function(require,module,exports){
'use strict';
(function init() {
  var DB = require('indexeddb-crud');
  var listDBConfig = require('./db/listConfig.js');
  var addEvents = require('./utlis/addEvents.js');

  // open DB, and when DB open succeed, invoke initial function
  DB.init(listDBConfig, addEvents.dbSuccess, addEvents.dbFail);
}());

},{"./db/listConfig.js":2,"./utlis/addEvents.js":4,"indexeddb-crud":1}],4:[function(require,module,exports){
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

},{"./eventHandler/eventHandler.js":8}],5:[function(require,module,exports){
'use strict';
var createLi = (function liGenerator() {
  function _decorateLi(li, data) {
    var textDate = document.createTextNode(data.date + ': ');
    var textWrap = document.createElement('span');
    var text = document.createTextNode(' ' + data.event);

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

module.exports = createLi;

},{}],6:[function(require,module,exports){
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
      window.alert('please input a real data~');
      return 0;
    }
    _removeRandom();
    _id += 1;
    newData = general.dataGenerator(_id, inputValue);
    newLi = createLi(newData);
    list = document.querySelector('#list');
    list.insertBefore(newLi, list.firstChild); // push newLi to first
    document.querySelector('#input').value = '';  // reset input's values

    return 0;
  }

  function _removeRandom() {
    var list = document.querySelector('#list');
    var listItems = document.querySelectorAll('#list li');
    var keys = Object.keys(listItems);

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
    var listItems = document.querySelectorAll('#list li');
    var keys = Object.keys(listItems);

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
    var listItems = document.querySelectorAll('#list li');
    var keys = Object.keys(listItems);

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

      refresh.appear(element);
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
        element.classList.contains('finished') ? refresh.appear(element) : refresh.disappear(element);
      } else {
        element.classList.contains('finished') ? refresh.disappear(element) : refresh.appear(element);
      }
    });
    _removeRandom();
    general.ifEmpty.addRandom();
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

},{"../createLi.js":5,"../refresh.js":10,"./general.js":9}],7:[function(require,module,exports){
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
    newData = general.dataGenerator(DB.getNewKey(), inputValue);
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

  function clickLi(e) {
    var id;
    var targetLi = e.target;
    // use event delegation

    if (!targetLi.classList.contains('aphorism')) {
      if (targetLi.getAttribute('data-id')) {
        id = parseInt(targetLi.getAttribute('data-id'), 10); // use previously stored data-id attribute
        DB.getItem(id, _toggleLi, [targetLi]); // pass _toggleLi and param [e.target] as callback
      }
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

},{"../createLi.js":5,"../refresh.js":10,"./general.js":9,"indexeddb-crud":1}],8:[function(require,module,exports){
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

},{"./createLi.js":5}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5kZXhlZGRiLWNydWQvc3JjL2luZGV4ZWRkYi1jcnVkLmpzIiwic3JjL3NjcmlwdHMvZGIvbGlzdENvbmZpZy5qcyIsInNyYy9zY3JpcHRzL21haW4uanMiLCJzcmMvc2NyaXB0cy91dGxpcy9hZGRFdmVudHMuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9jcmVhdGVMaS5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2V2ZW50SGFuZGxlci9kYkZhaWwuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9ldmVudEhhbmRsZXIvZGJTdWNjZXNzLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZXZlbnRIYW5kbGVyL2V2ZW50SGFuZGxlci5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2V2ZW50SGFuZGxlci9nZW5lcmFsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvcmVmcmVzaC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGluZGV4ZWREQkhhbmRsZXIgPSAoZnVuY3Rpb24gaW5kZXhlZERCSGFuZGxlcigpIHtcbiAgdmFyIF9kYjtcbiAgdmFyIF9zdG9yZU5hbWU7XG4gIHZhciBfcHJlc2VudEtleTtcbiAgdmFyIF9jb25maWdLZXk7XG5cbiAgLyogaW5pdCBpbmRleGVkREIgKi9cblxuICBmdW5jdGlvbiBpbml0KGNvbmZpZywgc3VjY2Vzc0NhbGxiYWNrLCBmYWlsQ2FsbGJhY2spIHtcbiAgICAvLyBmaXJzdGx5IGluc3BlY3QgYnJvd3NlcidzIHN1cHBvcnQgZm9yIGluZGV4ZWREQlxuICAgIGlmICghd2luZG93LmluZGV4ZWREQikge1xuICAgICAgd2luZG93LmFsZXJ0KCdZb3VyIGJyb3dzZXIgZG9lc25cXCd0IHN1cHBvcnQgYSBzdGFibGUgdmVyc2lvbiBvZiBJbmRleGVkREIuIFdlIHdpbGwgb2ZmZXIgeW91IHRoZSB3aXRob3V0IGluZGV4ZWREQiBtb2RlJyk7XG4gICAgICBmYWlsQ2FsbGJhY2soKTtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBfc3RvcmVOYW1lID0gY29uZmlnLnN0b3JlTmFtZTsgLy8gc3RvcmFnZSBzdG9yZU5hbWVcbiAgICBfY29uZmlnS2V5ID0gY29uZmlnLmtleTtcbiAgICBfb3BlbkRCKGNvbmZpZywgc3VjY2Vzc0NhbGxiYWNrLCBmYWlsQ2FsbGJhY2spO1xuXG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICBmdW5jdGlvbiBfb3BlbkRCKGNvbmZpZywgc3VjY2Vzc0NhbGxiYWNrLCBmYWlsQ2FsbGJhY2spIHtcbiAgICB2YXIgcmVxdWVzdCA9IGluZGV4ZWREQi5vcGVuKGNvbmZpZy5uYW1lLCBjb25maWcudmVyc2lvbik7IC8vIG9wZW4gaW5kZXhlZERCXG5cbiAgICByZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbiBfb3BlbkRCRXJyb3IoZSkge1xuICAgICAgLy8gd2luZG93LmFsZXJ0KCdQaXR5LCBmYWlsIHRvIGxvYWQgaW5kZXhlZERCLiBXZSB3aWxsIG9mZmVyIHlvdSB0aGUgd2l0aG91dCBpbmRleGVkREIgbW9kZScpO1xuICAgICAgd2luZG93LmFsZXJ0KCdTb21ldGhpbmcgaXMgd3Jvbmcgd2l0aCBpbmRleGVkREIsIHdlIG9mZmVyIHlvdSB0aGUgd2l0aG91dCBEQiBtb2RlLCBmb3IgbW9yZSBpbmZvcm1hdGlvbiwgY2hlY2tvdXQgY29uc29sZScpO1xuICAgICAgY29uc29sZS5sb2coZS50YXJnZXQuZXJyb3IpO1xuICAgICAgZmFpbENhbGxiYWNrKCk7XG4gICAgfTtcbiAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIF9vcGVuREJTdWNjZXNzKGUpIHtcbiAgICAgIF9kYiA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgIHN1Y2Nlc3NDYWxsYmFjaygpO1xuICAgICAgX2dldFByZXNlbnRLZXkoKTtcbiAgICB9O1xuXG4gICAgLy8gQ3JlYXRpbmcgb3IgdXBkYXRpbmcgdGhlIHZlcnNpb24gb2YgdGhlIGRhdGFiYXNlXG4gICAgcmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSBmdW5jdGlvbiBzY2hlbWFVcChlKSB7XG4gICAgICBfZGIgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICBjb25zb2xlLmxvZygnb251cGdyYWRlbmVlZGVkIGluJyk7XG4gICAgICBpZiAoIShfZGIub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucyhfc3RvcmVOYW1lKSkpIHtcbiAgICAgICAgX2NyZWF0ZVN0b3JlSGFuZGxlcihjb25maWcua2V5LCBjb25maWcuaW5pdGlhbERhdGEpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfY3JlYXRlU3RvcmVIYW5kbGVyKGtleSwgaW5pdGlhbERhdGEpIHtcbiAgICB2YXIgb2JqZWN0U3RvcmUgPSBfZGIuY3JlYXRlT2JqZWN0U3RvcmUoX3N0b3JlTmFtZSwgeyBrZXlQYXRoOiBrZXksIGF1dG9JbmNyZW1lbnQ6IHRydWUgfSk7XG5cbiAgICAvLyBVc2UgdHJhbnNhY3Rpb24gb25jb21wbGV0ZSB0byBtYWtlIHN1cmUgdGhlIG9iamVjdFN0b3JlIGNyZWF0aW9uIGlzXG4gICAgb2JqZWN0U3RvcmUudHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IGZ1bmN0aW9uIGFkZEluaXRpYWxEYXRhKCkge1xuICAgICAgdmFyIHN0b3JlSGFuZGVyO1xuXG4gICAgICBjb25zb2xlLmxvZygnY3JlYXRlICcgKyBfc3RvcmVOYW1lICsgJ1xcJ3Mgb2JqZWN0U3RvcmUgc3VjY2VlZCcpO1xuICAgICAgaWYgKGluaXRpYWxEYXRhKSB7XG4gICAgICAgIC8vIFN0b3JlIGluaXRpYWwgdmFsdWVzIGluIHRoZSBuZXdseSBjcmVhdGVkIG9iamVjdFN0b3JlLlxuICAgICAgICBzdG9yZUhhbmRlciA9IF90cmFuc2FjdGlvbkdlbmVyYXRvcih0cnVlKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpbml0aWFsRGF0YS5mb3JFYWNoKGZ1bmN0aW9uIGFkZEV2ZXJ5SW5pdGlhbERhdGEoZGF0YSwgaW5kZXgpIHtcbiAgICAgICAgICAgIHN0b3JlSGFuZGVyLmFkZChkYXRhKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhZGQgaW5pdGlhbCBkYXRhWycgKyBpbmRleCArICddIHN1Y2Nlc3NlZCcpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICB3aW5kb3cuYWxlcnQoJ3BsZWFzZSBzZXQgY29ycmVjdCBpbml0aWFsIGFycmF5IG9iamVjdCBkYXRhIDopJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLy8gc2V0IHByZXNlbnQga2V5IHZhbHVlIHRvIF9wcmVzZW50S2V5ICh0aGUgcHJpdmF0ZSBwcm9wZXJ0eSlcbiAgZnVuY3Rpb24gX2dldFByZXNlbnRLZXkoKSB7XG4gICAgX3RyYW5zYWN0aW9uR2VuZXJhdG9yKHRydWUpLm9wZW5DdXJzb3IoX3JhbmdlR2VuZXJhdG9yKCksICduZXh0Jykub25zdWNjZXNzID0gZnVuY3Rpb24gX2dldFByZXNlbnRLZXlIYW5kbGVyKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICAgIF9wcmVzZW50S2V5ID0gY3Vyc29yLnZhbHVlLmlkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCFfcHJlc2VudEtleSkge1xuICAgICAgICAgIF9wcmVzZW50S2V5ID0gMDtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZygnbm93IGtleSA9ICcgKyAgX3ByZXNlbnRLZXkpOyAvLyBpbml0aWFsIHZhbHVlIGlzIDBcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gX3JhbmdlR2VuZXJhdG9yKCkge1xuICAgIHJldHVybiBJREJLZXlSYW5nZS5sb3dlckJvdW5kKDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TmV3S2V5KCkge1xuICAgIF9wcmVzZW50S2V5ICs9IDE7XG5cbiAgICByZXR1cm4gX3ByZXNlbnRLZXk7XG4gIH1cblxuXG4gIC8qIENSVUQgKi9cblxuICBmdW5jdGlvbiBhZGRJdGVtKG5ld0RhdGEsIHN1Y2Nlc3NDYWxsYmFjaywgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpIHtcbiAgICB2YXIgYWRkUmVxdWVzdCA9IF90cmFuc2FjdGlvbkdlbmVyYXRvcih0cnVlKS5hZGQobmV3RGF0YSk7XG5cbiAgICBhZGRSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIHN1Y2Nlc3MoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBhZGQgJyArIF9jb25maWdLZXkgKyAnID0gJyArIG5ld0RhdGFbX2NvbmZpZ0tleV0gKyAnIGRhdGEgc3VjY2VlZCA6KScpO1xuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBfc3VjY2Vzc0NhbGxiYWNrSGFuZGxlcihzdWNjZXNzQ2FsbGJhY2ssIG5ld0RhdGEsIHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0SXRlbShrZXksIHN1Y2Nlc3NDYWxsYmFjaywgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpIHtcbiAgICB2YXIgZ2V0UmVxdWVzdCA9IF90cmFuc2FjdGlvbkdlbmVyYXRvcihmYWxzZSkuZ2V0KHBhcnNlSW50KGtleSwgMTApKTsgIC8vIGdldCBpdCBieSBpbmRleFxuXG4gICAgZ2V0UmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXREYXRhU3VjY2VzcygpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGdldCAnICArIF9jb25maWdLZXkgKyAnID0gJyArIGtleSArICcgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBfc3VjY2Vzc0NhbGxiYWNrSGFuZGxlcihzdWNjZXNzQ2FsbGJhY2ssIGdldFJlcXVlc3QucmVzdWx0LCBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlcik7XG4gICAgfTtcbiAgfVxuXG4gIC8vIHJldHJpZXZlIGVsaWdpYmxlIGRhdGEgKGJvb2xlYW4gY29uZGl0aW9uKVxuICBmdW5jdGlvbiBnZXRDb25kaXRpb25JdGVtKGNvbmRpdGlvbiwgd2hldGhlciwgc3VjY2Vzc0NhbGxiYWNrLCBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlcikge1xuICAgIHZhciByZXN1bHQgPSBbXTsgLy8gdXNlIGFuIGFycmF5IHRvIHN0b3JhZ2UgZWxpZ2libGUgZGF0YVxuXG4gICAgX3RyYW5zYWN0aW9uR2VuZXJhdG9yKHRydWUpLm9wZW5DdXJzb3IoX3JhbmdlR2VuZXJhdG9yKCksICduZXh0Jykub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0Q29uZGl0aW9uSXRlbUhhbmRsZXIoZSkge1xuICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICBpZiAod2hldGhlcikge1xuICAgICAgICAgIGlmIChjdXJzb3IudmFsdWVbY29uZGl0aW9uXSkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goY3Vyc29yLnZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIXdoZXRoZXIpIHtcbiAgICAgICAgICBpZiAoIWN1cnNvci52YWx1ZVtjb25kaXRpb25dKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChjdXJzb3IudmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF9zdWNjZXNzQ2FsbGJhY2tIYW5kbGVyKHN1Y2Nlc3NDYWxsYmFjaywgcmVzdWx0LCBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlcik7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEFsbChzdWNjZXNzQ2FsbGJhY2ssIHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKSB7XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgX3RyYW5zYWN0aW9uR2VuZXJhdG9yKHRydWUpLm9wZW5DdXJzb3IoX3JhbmdlR2VuZXJhdG9yKCksICduZXh0Jykub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0QWxsSGFuZGxlcihlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGN1cnNvci52YWx1ZSk7XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgZ2V0IGFsbCBkYXRhIHN1Y2Nlc3MgOiknKTtcbiAgICAgICAgX3N1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoc3VjY2Vzc0NhbGxiYWNrLCByZXN1bHQsIHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLy8gdXBkYXRlIG9uZVxuICBmdW5jdGlvbiB1cGRhdGVJdGVtKG5ld0RhdGEsIHN1Y2Nlc3NDYWxsYmFjaywgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpIHtcbiAgICB2YXIgcHV0UmVxdWVzdCA9IF90cmFuc2FjdGlvbkdlbmVyYXRvcih0cnVlKS5wdXQobmV3RGF0YSk7XG5cbiAgICBwdXRSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIHB1dFN1Y2Nlc3MoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyB1cGRhdGUgJyArIF9jb25maWdLZXkgKyAnID0gJyArIG5ld0RhdGFbX2NvbmZpZ0tleV0gKyAnIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBfc3VjY2Vzc0NhbGxiYWNrSGFuZGxlcihzdWNjZXNzQ2FsbGJhY2ssIG5ld0RhdGEsIHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlSXRlbShrZXksIHN1Y2Nlc3NDYWxsYmFjaywgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpIHtcbiAgICB2YXIgZGVsZXRlUmVxdWVzdCA9IF90cmFuc2FjdGlvbkdlbmVyYXRvcih0cnVlKS5kZWxldGUoa2V5KTtcblxuICAgIGRlbGV0ZVJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gZGVsZXRlU3VjY2VzcygpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIHJlbW92ZSAnICsgX2NvbmZpZ0tleSArICcgPSAnICsga2V5ICsgJyBkYXRhIHN1Y2Nlc3MgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgX3N1Y2Nlc3NDYWxsYmFja0hhbmRsZXIoc3VjY2Vzc0NhbGxiYWNrLCBrZXksIHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIoc3VjY2Vzc0NhbGxiYWNrLCBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlcikge1xuICAgIF90cmFuc2FjdGlvbkdlbmVyYXRvcih0cnVlKS5vcGVuQ3Vyc29yKF9yYW5nZUdlbmVyYXRvcigpLCAnbmV4dCcpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGNsZWFySGFuZGxlcihlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgdmFyIGRlbGV0ZVJlcXVlc3Q7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgZGVsZXRlUmVxdWVzdCA9IGN1cnNvci5kZWxldGUoKTtcbiAgICAgICAgZGVsZXRlUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBzdWNjZXNzKCkge1xuICAgICAgICB9O1xuICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgIH0gZWxzZSBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIF9zdWNjZXNzQ2FsbGJhY2tIYW5kbGVyKHN1Y2Nlc3NDYWxsYmFjaywgJ2FsbCBkYXRhJywgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgY2xlYXIgYWxsIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuXG4gIGZ1bmN0aW9uIF90cmFuc2FjdGlvbkdlbmVyYXRvcih3aGV0aGVyV3JpdGUpIHtcbiAgICB2YXIgdHJhbnNhY3Rpb247XG5cbiAgICBpZiAod2hldGhlcldyaXRlKSB7XG4gICAgICB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbX3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHJhbnNhY3Rpb24gPSBfZGIudHJhbnNhY3Rpb24oW19zdG9yZU5hbWVdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoX3N0b3JlTmFtZSk7XG4gIH1cblxuICBmdW5jdGlvbiBfc3VjY2Vzc0NhbGxiYWNrSGFuZGxlcihzdWNjZXNzQ2FsbGJhY2ssIHJlc3VsdCwgc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpIHtcbiAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrQXJyYXlQYXJhbWV0ZXIpIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHN1Y2Nlc3NDYWxsYmFja0FycmF5UGFyYW1ldGVyKSkge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlci51bnNoaWZ0KHJlc3VsdCk7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjay5hcHBseShudWxsLCBzdWNjZXNzQ2FsbGJhY2tBcnJheVBhcmFtZXRlcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdwbGVhc2Ugc2V0IGNvcnJlY3QgYXJyYXkgdHlwZSBvZiBjYWxsYmFjayBwYXJhbWV0ZXInKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3VsdCk7XG4gICAgfVxuICB9XG5cbiAgLyogcHVibGljIGludGVyZmFjZSAqL1xuICByZXR1cm4ge1xuICAgIGluaXQ6IGluaXQsXG4gICAgZ2V0TmV3S2V5OiBnZXROZXdLZXksXG4gICAgYWRkSXRlbTogYWRkSXRlbSxcbiAgICBnZXRJdGVtOiBnZXRJdGVtLFxuICAgIGdldENvbmRpdGlvbkl0ZW06IGdldENvbmRpdGlvbkl0ZW0sXG4gICAgZ2V0QWxsOiBnZXRBbGwsXG4gICAgdXBkYXRlSXRlbTogdXBkYXRlSXRlbSxcbiAgICByZW1vdmVJdGVtOiByZW1vdmVJdGVtLFxuICAgIGNsZWFyOiBjbGVhclxuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBpbmRleGVkREJIYW5kbGVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG5hbWU6ICdKdXN0VG9EbycsXG4gIHZlcnNpb246ICcxMycsXG4gIGtleTogJ2lkJyxcbiAgc3RvcmVOYW1lOiAnbGlzdCcsXG4gIGluaXRpYWxEYXRhOiBbXG4gICAgeyBpZDogMSwgZXZlbnQ6ICdkb3NvbWV0aGluZycsIGZpbmlzaGVkOiB0cnVlLCBkYXRlOiAwIH0sXG4gICAgeyBpZDogMiwgZXZlbnQ6ICdkb3NvbWV0aGluZycsIGZpbmlzaGVkOiBmYWxzZSwgZGF0ZTogMCB9XG4gIF1cbn07XG4iLCIndXNlIHN0cmljdCc7XG4oZnVuY3Rpb24gaW5pdCgpIHtcbiAgdmFyIERCID0gcmVxdWlyZSgnaW5kZXhlZGRiLWNydWQnKTtcbiAgdmFyIGxpc3REQkNvbmZpZyA9IHJlcXVpcmUoJy4vZGIvbGlzdENvbmZpZy5qcycpO1xuICB2YXIgYWRkRXZlbnRzID0gcmVxdWlyZSgnLi91dGxpcy9hZGRFdmVudHMuanMnKTtcblxuICAvLyBvcGVuIERCLCBhbmQgd2hlbiBEQiBvcGVuIHN1Y2NlZWQsIGludm9rZSBpbml0aWFsIGZ1bmN0aW9uXG4gIERCLmluaXQobGlzdERCQ29uZmlnLCBhZGRFdmVudHMuZGJTdWNjZXNzLCBhZGRFdmVudHMuZGJGYWlsKTtcbn0oKSk7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgYWRkRXZlbnRzID0gKGZ1bmN0aW9uIGFkZEV2ZW50c0dlbmVyYXRvcigpIHtcbiAgZnVuY3Rpb24gX3doZXRoZXJTdWNjZXNzKHdoZXRoZXJTdWNjZXNzKSB7XG4gICAgZnVuY3Rpb24gX3doZXRoZXJTdWNjZXNzSGFuZGxlcih3aGV0aGVyKSB7XG4gICAgICB2YXIgZXZlbnRIYW5kbGVyID0gcmVxdWlyZSgnLi9ldmVudEhhbmRsZXIvZXZlbnRIYW5kbGVyLmpzJyk7XG4gICAgICB2YXIgaGFuZGxlciA9IHdoZXRoZXIgPyBldmVudEhhbmRsZXIuZGJTdWNjZXNzIDogZXZlbnRIYW5kbGVyLmRiRmFpbDtcbiAgICAgIHZhciBsaXN0O1xuXG4gICAgICBoYW5kbGVyLnNob3dJbml0KCk7XG4gICAgICAvLyBhZGQgYWxsIGV2ZW50TGlzdGVuZXJcbiAgICAgIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgICAgbGlzdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuY2xpY2tMaSwgZmFsc2UpO1xuICAgICAgbGlzdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIucmVtb3ZlTGksIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVyLmVudGVyQWRkLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWRkJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLmFkZCwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dEb25lJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dEb25lLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd1RvZG8nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd1RvZG8sIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93QWxsJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dBbGwsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93Q2xlYXInKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0NsZWFyLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBIYW5kbGVyKCkge1xuICAgICAgX3doZXRoZXJTdWNjZXNzSGFuZGxlcih3aGV0aGVyU3VjY2Vzcyk7XG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZGJTdWNjZXNzOiBfd2hldGhlclN1Y2Nlc3ModHJ1ZSksXG4gICAgZGJGYWlsOiBfd2hldGhlclN1Y2Nlc3MoZmFsc2UpXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFkZEV2ZW50cztcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBjcmVhdGVMaSA9IChmdW5jdGlvbiBsaUdlbmVyYXRvcigpIHtcbiAgZnVuY3Rpb24gX2RlY29yYXRlTGkobGksIGRhdGEpIHtcbiAgICB2YXIgdGV4dERhdGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhLmRhdGUgKyAnOiAnKTtcbiAgICB2YXIgdGV4dFdyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnICcgKyBkYXRhLmV2ZW50KTtcblxuICAgIC8vIHdyYXAgYXMgYSBub2RlXG4gICAgdGV4dFdyYXAuYXBwZW5kQ2hpbGQodGV4dCk7XG4gICAgbGkuYXBwZW5kQ2hpbGQodGV4dERhdGUpO1xuICAgIGxpLmFwcGVuZENoaWxkKHRleHRXcmFwKTtcbiAgICBpZiAoZGF0YS5maW5pc2hlZCkgeyAgLy8gYWRkIGNzcy1zdHlsZSB0byBpdCAoYWNjb3JkaW5nIHRvIGl0J3MgZGF0YS5maW5pc2hlZCB2YWx1ZSlcbiAgICAgIGxpLmNsYXNzTGlzdC5hZGQoJ2ZpbmlzaGVkJyk7IC8vIGFkZCBzdHlsZVxuICAgIH1cbiAgICBfYWRkWChsaSk7IC8vIGFkZCBzcGFuIFt4XSB0byBsaSdzIHRhaWxcbiAgICBfc2V0RGF0YVByb3BlcnR5KGxpLCAnZGF0YS1pZCcsIGRhdGEuaWQpOyAvLyBhZGQgcHJvcGVydHkgdG8gbGkgKGRhdGEtaWQp77yMZm9yICBjbGlja0xpXG4gIH1cblxuICBmdW5jdGlvbiBfYWRkWChsaSkge1xuICAgIHZhciBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHZhciB4ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJ1xcdTAwRDcnKTsgLy8gdW5pY29kZSAtPiB4XG5cbiAgICBzcGFuLmFwcGVuZENoaWxkKHgpO1xuICAgIHNwYW4uY2xhc3NOYW1lID0gJ2Nsb3NlJzsgLy8gYWRkIHN0eWxlXG4gICAgbGkuYXBwZW5kQ2hpbGQoc3Bhbik7XG4gIH1cblxuICBmdW5jdGlvbiBfc2V0RGF0YVByb3BlcnR5KHRhcmdldCwgbmFtZSwgZGF0YSkge1xuICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUobmFtZSwgZGF0YSk7XG4gIH1cblxuXG4gIHJldHVybiBmdW5jdGlvbiBjcmVhdGUoZGF0YSkge1xuICAgIHZhciBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG5cbiAgICBfZGVjb3JhdGVMaShsaSwgZGF0YSk7IC8vIGRlY29yYXRlIGxpXG5cbiAgICByZXR1cm4gbGk7XG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUxpO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGRiRmFpbCA9IChmdW5jdGlvbiBkYkZhaWxHZW5lcmF0b3IoKSB7XG4gIHZhciByZWZyZXNoID0gcmVxdWlyZSgnLi4vcmVmcmVzaC5qcycpO1xuICB2YXIgY3JlYXRlTGkgPSByZXF1aXJlKCcuLi9jcmVhdGVMaS5qcycpO1xuICB2YXIgZ2VuZXJhbCA9IHJlcXVpcmUoJy4vZ2VuZXJhbC5qcycpO1xuICB2YXIgX2lkID0gLTE7IC8vIHNvIHRoZSBmaXJzdCBpdGVtJ3MgaWQgaXMgMFxuXG4gIGZ1bmN0aW9uIGFkZCgpIHtcbiAgICB2YXIgaW5wdXRWYWx1ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNpbnB1dCcpLnZhbHVlO1xuICAgIHZhciBsaXN0O1xuICAgIHZhciBuZXdEYXRhO1xuICAgIHZhciBuZXdMaTtcblxuICAgIGlmIChpbnB1dFZhbHVlID09PSAnJykge1xuICAgICAgd2luZG93LmFsZXJ0KCdwbGVhc2UgaW5wdXQgYSByZWFsIGRhdGF+Jyk7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgX3JlbW92ZVJhbmRvbSgpO1xuICAgIF9pZCArPSAxO1xuICAgIG5ld0RhdGEgPSBnZW5lcmFsLmRhdGFHZW5lcmF0b3IoX2lkLCBpbnB1dFZhbHVlKTtcbiAgICBuZXdMaSA9IGNyZWF0ZUxpKG5ld0RhdGEpO1xuICAgIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgIGxpc3QuaW5zZXJ0QmVmb3JlKG5ld0xpLCBsaXN0LmZpcnN0Q2hpbGQpOyAvLyBwdXNoIG5ld0xpIHRvIGZpcnN0XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWUgPSAnJzsgIC8vIHJlc2V0IGlucHV0J3MgdmFsdWVzXG5cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9yZW1vdmVSYW5kb20oKSB7XG4gICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgIHZhciBsaXN0SXRlbXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjbGlzdCBsaScpO1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMobGlzdEl0ZW1zKTtcblxuICAgIHJldHVybiBrZXlzLmZvckVhY2goZnVuY3Rpb24gdGVzdEV2ZXJ5SXRlbShpbmRleCkge1xuICAgICAgaWYgKGxpc3RJdGVtc1trZXlzW2luZGV4XV0uY2xhc3NMaXN0LmNvbnRhaW5zKCdhcGhvcmlzbScpKSB7XG4gICAgICAgIGxpc3QucmVtb3ZlQ2hpbGQobGlzdEl0ZW1zW2tleXNbaW5kZXhdXSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBlbnRlckFkZChlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgIGFkZCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsaWNrTGkoZSkge1xuICAgIHZhciB0YXJnZXRMaSA9IGUudGFyZ2V0O1xuICAgIC8vIHVzZSBldmVudCBkZWxlZ2F0aW9uXG5cbiAgICBpZiAodGFyZ2V0TGkuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJykpIHtcbiAgICAgIF90b2dnbGVMaSh0YXJnZXRMaSk7XG4gICAgICBzaG93QWxsKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX3RvZ2dsZUxpKHRhcmdldExpKSB7XG4gICAgdGFyZ2V0TGkuY2xhc3NMaXN0LnRvZ2dsZSgnZmluaXNoZWQnKTtcbiAgfVxuXG4gIC8vIGxpJ3MgW3hdJ3MgZGVsZXRlXG4gIGZ1bmN0aW9uIHJlbW92ZUxpKGUpIHtcbiAgICB2YXIgaWQ7XG4gICAgdmFyIERPTUluZGV4O1xuICAgIHZhciBsaXN0O1xuICAgIHZhciBsaXN0SXRlbXM7XG5cbiAgICBpZiAoZS50YXJnZXQuY2xhc3NOYW1lID09PSAnY2xvc2UnKSB7IC8vIHVzZSBldmVudCBkZWxlZ2F0aW9uXG4gICAgICAvLyB1c2UgcHJldmlvdXNseSBzdG9yZWQgZGF0YVxuICAgICAgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgICBsaXN0SXRlbXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjbGlzdCBsaScpO1xuICAgICAgaWQgPSBlLnRhcmdldC5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpO1xuICAgICAgRE9NSW5kZXggPSBfZ2V0RE9NSW5kZXgoaWQpO1xuICAgICAgbGlzdC5yZW1vdmVDaGlsZChsaXN0SXRlbXNbRE9NSW5kZXhdKTtcbiAgICAgIGdlbmVyYWwuaWZFbXB0eS5hZGRSYW5kb20oKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfZ2V0RE9NSW5kZXgoaWQpIHtcbiAgICB2YXIgaTtcbiAgICB2YXIgbGlzdEl0ZW1zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2xpc3QgbGknKTtcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGxpc3RJdGVtcyk7XG5cbiAgICBmb3IgKGkgaW4ga2V5cykge1xuICAgICAgaWYgKGxpc3RJdGVtc1trZXlzW2ldXS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSA9PT0gaWQpIHtcbiAgICAgICAgcmV0dXJuIGtleXNbaV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuICdXcm9uZyBpZCwgbm90IGZvdW5kIGluIERPTSB0cmVlJztcbiAgfVxuXG4gIGdlbmVyYWwuaWZFbXB0eS5hZGRSYW5kb20gPSBmdW5jdGlvbiBhZGRSYW5kb20oKSB7XG4gICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gICAgaWYgKCFsaXN0LmZpcnN0Q2hpbGQgfHwgX2lzQWxsTm9uZSgpKSB7XG4gICAgICByZWZyZXNoLnJhbmRvbSgpO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBfaXNBbGxOb25lKCkge1xuICAgIHZhciBsaXN0SXRlbXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjbGlzdCBsaScpO1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMobGlzdEl0ZW1zKTtcblxuICAgIHJldHVybiBrZXlzLmV2ZXJ5KGZ1bmN0aW9uIHRlc3RFdmVyeUl0ZW0oaW5kZXgpIHtcbiAgICAgIHJldHVybiBsaXN0SXRlbXNba2V5c1tpbmRleF1dLnN0eWxlLmRpc3BsYXkgPT09ICdub25lJztcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dJbml0KCkge1xuICAgIHJlZnJlc2guY2xlYXIoKTtcbiAgICByZWZyZXNoLmluaXQoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dBbGwoKSB7XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjbGlzdCBsaScpKTtcblxuICAgIGtleXMuZm9yRWFjaChmdW5jdGlvbiBhcHBlYXJBbGwoaW5kZXgpIHtcbiAgICAgIHZhciBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgICAgIHZhciBsaXN0SXRlbXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjbGlzdCBsaScpO1xuICAgICAgdmFyIGVsZW1lbnQgPSBsaXN0SXRlbXNba2V5c1tpbmRleF1dO1xuXG4gICAgICByZWZyZXNoLmFwcGVhcihlbGVtZW50KTtcbiAgICAgIGlmIChlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucygnZmluaXNoZWQnKSkge1xuICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGxpc3QuY2hpbGROb2Rlc1trZXlzW2luZGV4XV0pO1xuICAgICAgICBsaXN0LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0NsZWFyKCkge1xuICAgIHJlZnJlc2guY2xlYXIoKTsgLy8gY2xlYXIgbm9kZXMgdmlzdWFsbHlcbiAgICByZWZyZXNoLnJhbmRvbSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0RvbmUoKSB7XG4gICAgX3Nob3dXaGV0aGVyRG9uZSh0cnVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dUb2RvKCkge1xuICAgIF9zaG93V2hldGhlckRvbmUoZmFsc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3Nob3dXaGV0aGVyRG9uZSh3aGV0aGVyRG9uZSkge1xuICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2xpc3QgbGknKSwgZnVuY3Rpb24gd2hldGhlckRvbmVBcHBlYXIoZWxlbWVudCkge1xuICAgICAgaWYgKHdoZXRoZXJEb25lKSB7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdmaW5pc2hlZCcpID8gcmVmcmVzaC5hcHBlYXIoZWxlbWVudCkgOiByZWZyZXNoLmRpc2FwcGVhcihlbGVtZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdmaW5pc2hlZCcpID8gcmVmcmVzaC5kaXNhcHBlYXIoZWxlbWVudCkgOiByZWZyZXNoLmFwcGVhcihlbGVtZW50KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBfcmVtb3ZlUmFuZG9tKCk7XG4gICAgZ2VuZXJhbC5pZkVtcHR5LmFkZFJhbmRvbSgpO1xuICB9XG5cblxuICByZXR1cm4ge1xuICAgIGFkZDogYWRkLFxuICAgIGVudGVyQWRkOiBlbnRlckFkZCxcbiAgICBjbGlja0xpOiBjbGlja0xpLFxuICAgIHJlbW92ZUxpOiByZW1vdmVMaSxcbiAgICBzaG93SW5pdDogc2hvd0luaXQsXG4gICAgc2hvd0FsbDogc2hvd0FsbCxcbiAgICBzaG93Q2xlYXI6IHNob3dDbGVhcixcbiAgICBzaG93RG9uZTogc2hvd0RvbmUsXG4gICAgc2hvd1RvZG86IHNob3dUb2RvXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRiRmFpbDtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBkYlN1Y2Nlc3MgPSAoZnVuY3Rpb24gZGJTdWNjZXNzR2VuZXJhdG9yKCkge1xuICB2YXIgREIgPSByZXF1aXJlKCdpbmRleGVkZGItY3J1ZCcpO1xuICB2YXIgcmVmcmVzaCA9IHJlcXVpcmUoJy4uL3JlZnJlc2guanMnKTtcbiAgdmFyIGNyZWF0ZUxpID0gcmVxdWlyZSgnLi4vY3JlYXRlTGkuanMnKTtcbiAgdmFyIGdlbmVyYWwgPSByZXF1aXJlKCcuL2dlbmVyYWwuanMnKTtcblxuICBmdW5jdGlvbiBhZGQoKSB7XG4gICAgdmFyIGlucHV0VmFsdWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5wdXQnKS52YWx1ZTtcbiAgICB2YXIgbGlzdDtcbiAgICB2YXIgbmV3RGF0YTtcbiAgICB2YXIgbmV3TGk7XG5cbiAgICBpZiAoaW5wdXRWYWx1ZSA9PT0gJycpIHtcbiAgICAgIHdpbmRvdy5hbGVydCgncGxlYXNlIGlucHV0IGEgcmVhbCBkYXRhficpO1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGdlbmVyYWwuaWZFbXB0eS5yZW1vdmVJbml0KCk7XG4gICAgbmV3RGF0YSA9IGdlbmVyYWwuZGF0YUdlbmVyYXRvcihEQi5nZXROZXdLZXkoKSwgaW5wdXRWYWx1ZSk7XG4gICAgbmV3TGkgPSBjcmVhdGVMaShuZXdEYXRhKTtcbiAgICBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgICBsaXN0Lmluc2VydEJlZm9yZShuZXdMaSwgbGlzdC5maXJzdENoaWxkKTsgLy8gcHVzaCBuZXdMaSB0byBmaXJzdFxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNpbnB1dCcpLnZhbHVlID0gJyc7ICAvLyByZXNldCBpbnB1dCdzIHZhbHVlc1xuICAgIERCLmFkZEl0ZW0obmV3RGF0YSk7XG5cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVudGVyQWRkKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgYWRkKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY2xpY2tMaShlKSB7XG4gICAgdmFyIGlkO1xuICAgIHZhciB0YXJnZXRMaSA9IGUudGFyZ2V0O1xuICAgIC8vIHVzZSBldmVudCBkZWxlZ2F0aW9uXG5cbiAgICBpZiAoIXRhcmdldExpLmNsYXNzTGlzdC5jb250YWlucygnYXBob3Jpc20nKSkge1xuICAgICAgaWYgKHRhcmdldExpLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpKSB7XG4gICAgICAgIGlkID0gcGFyc2VJbnQodGFyZ2V0TGkuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyksIDEwKTsgLy8gdXNlIHByZXZpb3VzbHkgc3RvcmVkIGRhdGEtaWQgYXR0cmlidXRlXG4gICAgICAgIERCLmdldEl0ZW0oaWQsIF90b2dnbGVMaSwgW3RhcmdldExpXSk7IC8vIHBhc3MgX3RvZ2dsZUxpIGFuZCBwYXJhbSBbZS50YXJnZXRdIGFzIGNhbGxiYWNrXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gbGkncyBbeF0ncyBkZWxldGVcbiAgZnVuY3Rpb24gcmVtb3ZlTGkoZSkge1xuICAgIHZhciBpZDtcblxuICAgIGlmIChlLnRhcmdldC5jbGFzc05hbWUgPT09ICdjbG9zZScpIHsgLy8gdXNlIGV2ZW50IGRlbGVnYXRpb25cbiAgICAgIC8vIHVzZSBwcmV2aW91c2x5IHN0b3JlZCBkYXRhXG4gICAgICBpZCA9IHBhcnNlSW50KGUudGFyZ2V0LnBhcmVudE5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyksIDEwKTtcbiAgICAgIERCLnJlbW92ZUl0ZW0oaWQsIHNob3dBbGwpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dJbml0KCkge1xuICAgIHJlZnJlc2guY2xlYXIoKTtcbiAgICBEQi5nZXRBbGwocmVmcmVzaC5pbml0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dBbGwoKSB7XG4gICAgcmVmcmVzaC5jbGVhcigpO1xuICAgIERCLmdldEFsbChyZWZyZXNoLmFsbCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93Q2xlYXIoKSB7XG4gICAgcmVmcmVzaC5jbGVhcigpOyAvLyBjbGVhciBub2RlcyB2aXN1YWxseVxuICAgIHJlZnJlc2gucmFuZG9tKCk7XG4gICAgREIuY2xlYXIoKTsgLy8gY2xlYXIgZGF0YSBpbmRlZWRcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dEb25lKCkge1xuICAgIF9zaG93V2hldGhlckRvbmUodHJ1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93VG9kbygpIHtcbiAgICBfc2hvd1doZXRoZXJEb25lKGZhbHNlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zaG93V2hldGhlckRvbmUod2hldGhlckRvbmUpIHtcbiAgICB2YXIgY29uZGl0aW9uID0gJ2ZpbmlzaGVkJztcblxuICAgIHJlZnJlc2guY2xlYXIoKTtcbiAgICBEQi5nZXRDb25kaXRpb25JdGVtKGNvbmRpdGlvbiwgd2hldGhlckRvbmUsIHJlZnJlc2gucGFydCk7XG4gIH1cblxuICBmdW5jdGlvbiBfdG9nZ2xlTGkoZGF0YSwgdGFyZ2V0TGkpIHtcbiAgICB0YXJnZXRMaS5jbGFzc0xpc3QudG9nZ2xlKCdmaW5pc2hlZCcpO1xuICAgIGRhdGEuZmluaXNoZWQgPSAhZGF0YS5maW5pc2hlZDsgIC8vIHRvZ2dsZSBkYXRhLmZpbmlzaGVkXG4gICAgREIudXBkYXRlSXRlbShkYXRhLCBzaG93QWxsKTtcbiAgfVxuXG5cbiAgcmV0dXJuIHtcbiAgICBhZGQ6IGFkZCxcbiAgICBlbnRlckFkZDogZW50ZXJBZGQsXG4gICAgY2xpY2tMaTogY2xpY2tMaSxcbiAgICByZW1vdmVMaTogcmVtb3ZlTGksXG4gICAgc2hvd0luaXQ6IHNob3dJbml0LFxuICAgIHNob3dBbGw6IHNob3dBbGwsXG4gICAgc2hvd0NsZWFyOiBzaG93Q2xlYXIsXG4gICAgc2hvd0RvbmU6IHNob3dEb25lLFxuICAgIHNob3dUb2RvOiBzaG93VG9kb1xuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBkYlN1Y2Nlc3M7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgZXZlbnRIYW5kbGVyID0gKGZ1bmN0aW9uIGhhbmRsZXJHZW5lcmF0b3IoKSB7XG4gIHZhciBkYlN1Y2Nlc3MgPSByZXF1aXJlKCcuL2RiU3VjY2Vzcy5qcycpO1xuICB2YXIgZGJGYWlsID0gcmVxdWlyZSgnLi9kYkZhaWwuanMnKTtcblxuICByZXR1cm4ge1xuICAgIGRiU3VjY2VzczogZGJTdWNjZXNzLFxuICAgIGRiRmFpbDogZGJGYWlsXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV2ZW50SGFuZGxlcjtcbiIsInZhciBnZW5lcmFsID0gKGZ1bmN0aW9uIGdlbmVyYWxHZW5lcmF0b3IoKSB7XG4gIHZhciBpZkVtcHR5ID0ge1xuICAgIHJlbW92ZUluaXQ6IGZ1bmN0aW9uIHJlbW92ZUluaXQoKSB7XG4gICAgICB2YXIgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG5cbiAgICAgIGlmIChsaXN0LmZpcnN0Q2hpbGQuY2xhc3NOYW1lID09PSAnYXBob3Jpc20nKSB7XG4gICAgICAgIGxpc3QucmVtb3ZlQ2hpbGQobGlzdC5maXJzdENoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gZGF0YUdlbmVyYXRvcihrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiBrZXksXG4gICAgICBldmVudDogdmFsdWUsXG4gICAgICBmaW5pc2hlZDogZmFsc2UsXG4gICAgICBkYXRlOiBfZ2V0TmV3RGF0ZSgneXl5eeW5tE1N5pyIZGTml6UgaGg6bW0nKVxuICAgIH07XG4gIH1cblxuICAvLyBGb3JtYXQgZGF0ZVxuICBmdW5jdGlvbiBfZ2V0TmV3RGF0ZShmbXQpIHtcbiAgICB2YXIgbmV3RGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgdmFyIG5ld2ZtdCA9IGZtdDtcbiAgICB2YXIgbyA9IHtcbiAgICAgICd5Kyc6IG5ld0RhdGUuZ2V0RnVsbFllYXIoKSxcbiAgICAgICdNKyc6IG5ld0RhdGUuZ2V0TW9udGgoKSArIDEsXG4gICAgICAnZCsnOiBuZXdEYXRlLmdldERhdGUoKSxcbiAgICAgICdoKyc6IG5ld0RhdGUuZ2V0SG91cnMoKSxcbiAgICAgICdtKyc6IG5ld0RhdGUuZ2V0TWludXRlcygpXG4gICAgfTtcbiAgICB2YXIgbGVucztcblxuICAgIGZvciAodmFyIGsgaW4gbykge1xuICAgICAgaWYgKG5ldyBSZWdFeHAoJygnICsgayArICcpJykudGVzdChuZXdmbXQpKSB7XG4gICAgICAgIGlmIChrID09PSAneSsnKSB7XG4gICAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoJycgKyBvW2tdKS5zdWJzdHIoNCAtIFJlZ0V4cC4kMS5sZW5ndGgpKTtcbiAgICAgICAgfSBlbHNlIGlmIChrID09PSAnUysnKSB7XG4gICAgICAgICAgbGVucyA9IFJlZ0V4cC4kMS5sZW5ndGg7XG4gICAgICAgICAgbGVucyA9IGxlbnMgPT09IDEgPyAzIDogbGVucztcbiAgICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsICgnMDAnICsgb1trXSkuc3Vic3RyKCgnJyArIG9ba10pLmxlbmd0aCAtIDEsIGxlbnMpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChSZWdFeHAuJDEubGVuZ3RoID09PSAxKSA/IChvW2tdKSA6ICgoJzAwJyArIG9ba10pLnN1YnN0cigoJycgKyBvW2tdKS5sZW5ndGgpKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbmV3Zm10O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpZkVtcHR5OiBpZkVtcHR5LFxuICAgIGRhdGFHZW5lcmF0b3I6IGRhdGFHZW5lcmF0b3JcbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZ2VuZXJhbDtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciByZWZyZXNoID0gKGZ1bmN0aW9uIHJlZnJlc2hHZW5lcmF0b3IoKSB7XG4gIHZhciBjcmVhdGVMaSA9IHJlcXVpcmUoJy4vY3JlYXRlTGkuanMnKTtcblxuICBmdW5jdGlvbiBpbml0KGRhdGFBcnIpIHtcbiAgICBfc2hvdyhkYXRhQXJyLCBfaW5pdFNlbnRlbmNlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFsbChkYXRhQXJyKSB7XG4gICAgX3Nob3coZGF0YUFyciwgcmFuZG9tQXBob3Jpc20pO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFydChkYXRhQXJyKSB7XG4gICAgdmFyIG5vZGVzO1xuXG4gICAgaWYgKCFkYXRhQXJyIHx8IGRhdGFBcnIubGVuZ3RoID09PSAwKSB7XG4gICAgICByYW5kb21BcGhvcmlzbSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBub2RlcyA9IGRhdGFBcnIucmVkdWNlKGZ1bmN0aW9uIG5vZGVHZW5lcmF0b3IocmVzdWx0LCBkYXRhKSB7XG4gICAgICAgIHJlc3VsdC5pbnNlcnRCZWZvcmUoY3JlYXRlTGkoZGF0YSksIHJlc3VsdC5maXJzdENoaWxkKTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSwgZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpKTsgLy8gYnJpbGxpYW50IGFyci5yZWR1Y2UoKSArIGRvY3VtZW50RnJhZ21lbnRcblxuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5hcHBlbmRDaGlsZChub2Rlcyk7IC8vIGFkZCBpdCB0byBET01cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlYXIoZWxlbWVudCkge1xuICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gIH1cblxuICBmdW5jdGlvbiBkaXNhcHBlYXIoZWxlbWVudCkge1xuICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIHZhciByb290ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcblxuICAgIHdoaWxlIChyb290Lmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgcm9vdC5yZW1vdmVDaGlsZChyb290LmZpcnN0Q2hpbGQpOyAvLyB0aGUgYmVzdCB3YXkgdG8gY2xlYW4gY2hpbGROb2Rlc1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJhbmRvbUFwaG9yaXNtKCkge1xuICAgIHZhciBhcGhvcmlzbXMgPSBbXG4gICAgICAnWWVzdGVyZGF5IFlvdSBTYWlkIFRvbW9ycm93JyxcbiAgICAgICdXaHkgYXJlIHdlIGhlcmU/JyxcbiAgICAgICdBbGwgaW4sIG9yIG5vdGhpbmcnLFxuICAgICAgJ1lvdSBOZXZlciBUcnksIFlvdSBOZXZlciBLbm93JyxcbiAgICAgICdUaGUgdW5leGFtaW5lZCBsaWZlIGlzIG5vdCB3b3J0aCBsaXZpbmcuIC0tIFNvY3JhdGVzJ1xuICAgIF07XG4gICAgdmFyIHJhbmRvbUluZGV4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXBob3Jpc21zLmxlbmd0aCk7XG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShhcGhvcmlzbXNbcmFuZG9tSW5kZXhdKTtcblxuICAgIF9zZW50ZW5jZUdlbmVyYXRvcih0ZXh0KTtcbiAgfVxuXG5cbiAgLyogcHJpdmF0ZSBtZXRob2RzICovXG5cbiAgZnVuY3Rpb24gX3Nob3coZGF0YUFyciwgc2VudGVuY2VGdW5jKSB7XG4gICAgaWYgKCFkYXRhQXJyIHx8IGRhdGFBcnIubGVuZ3RoID09PSAwKSB7XG4gICAgICBzZW50ZW5jZUZ1bmMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgX3Nob3dSZWZyZXNoKGRhdGFBcnIpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9zaG93UmVmcmVzaChkYXRhQXJyKSB7XG4gICAgdmFyIHJlc3VsdCA9IF9jbGFzc2lmeURhdGEoZGF0YUFycik7XG5cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmFwcGVuZENoaWxkKHJlc3VsdCk7IC8vIGFkZCBpdCB0byBET01cbiAgfVxuXG4gIGZ1bmN0aW9uIF9jbGFzc2lmeURhdGEoZGF0YUFycikge1xuICAgIC8vIHVzZSBmcmFnbWVudCB0byByZWR1Y2UgRE9NIG9wZXJhdGVcbiAgICB2YXIgdW5maXNoaWVkID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIHZhciBmaW5pc2hlZCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB2YXIgZnVzaW9uID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgLy8gcHV0IHRoZSBmaW5pc2hlZCBpdGVtIHRvIHRoZSBib3R0b21cbiAgICBkYXRhQXJyLmZvckVhY2goZnVuY3Rpb24gY2xhc3NpZnkoZGF0YSkge1xuICAgICAgaWYgKGRhdGEuZmluaXNoZWQpIHtcbiAgICAgICAgZmluaXNoZWQuaW5zZXJ0QmVmb3JlKGNyZWF0ZUxpKGRhdGEpLCBmaW5pc2hlZC5maXJzdENoaWxkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVuZmlzaGllZC5pbnNlcnRCZWZvcmUoY3JlYXRlTGkoZGF0YSksIHVuZmlzaGllZC5maXJzdENoaWxkKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBmdXNpb24uYXBwZW5kQ2hpbGQodW5maXNoaWVkKTtcbiAgICBmdXNpb24uYXBwZW5kQ2hpbGQoZmluaXNoZWQpO1xuXG4gICAgcmV0dXJuIGZ1c2lvbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9pbml0U2VudGVuY2UoKSB7XG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnV2VsY29tZX4sIHRyeSB0byBhZGQgeW91ciBmaXJzdCB0by1kbyBsaXN0IDogKScpO1xuXG4gICAgX3NlbnRlbmNlR2VuZXJhdG9yKHRleHQpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3NlbnRlbmNlR2VuZXJhdG9yKHRleHQpIHtcbiAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuXG4gICAgbGkuYXBwZW5kQ2hpbGQodGV4dCk7XG4gICAgbGkuY2xhc3NOYW1lID0gJ2FwaG9yaXNtJztcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmFwcGVuZENoaWxkKGxpKTtcbiAgfVxuXG5cbiAgLyogaW50ZXJmYWNlICovXG4gIHJldHVybiB7XG4gICAgaW5pdDogaW5pdCxcbiAgICBhbGw6IGFsbCxcbiAgICBwYXJ0OiBwYXJ0LFxuICAgIGNsZWFyOiBjbGVhcixcbiAgICBhcHBlYXI6IGFwcGVhcixcbiAgICBkaXNhcHBlYXI6IGRpc2FwcGVhcixcbiAgICByYW5kb206IHJhbmRvbUFwaG9yaXNtXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZnJlc2g7XG4iXX0=
