(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
var indexedDBHandler = (function indexedDBHandler() {
  var _db;
  var _storeName;
  var _presentKey;
  var _configKey;

  /* init indexedDB */

  function open(config, openSuccessCallback, openFailCallback) {
    // firstly inspect browser's support for indexedDB
    if (!window.indexedDB) {
      window.alert('Your browser doesn\'t support a stable version of IndexedDB. We will offer you the without indexedDB mode');
      openFailCallback();
      return 0;
    }
    _openHandler(config, openSuccessCallback, openFailCallback);

    return 0;
  }

  function _openHandler(config, successCallback, failCallback) {
    var openRequest = window.indexedDB.open(config.name, config.version); // open indexedDB

    _storeName = config.storeName; // storage storeName
    _configKey = config.key;

    // an onblocked event is fired until they are closed or reloaded
    // openRequest.onblocked = function blockedSchemeUp() {
    //   // If some other tab is loaded with the database, then it needs to be closed before we can proceed.
    //   window.alert('Please close all other tabs with this site open');
    // };

    // Creating or updating the version of the database
    openRequest.onupgradeneeded = function schemaUp(e) {
      // All other databases have been closed. Set everything up.
      _db = e.target.result;
      console.log('onupgradeneeded in');
      if (!(_db.objectStoreNames.contains(_storeName))) {
        _createStoreHandler(config.initialData);
      }
    };

    openRequest.onsuccess = function openSuccess(e) {
      _db = e.target.result;
      console.log('\u2713 open storeName = ' + _storeName + ' indexedDB success');
      successCallback();
      _getPresentKey();
    };

    openRequest.onerror = function openError(e) {
      // window.alert('Pity, fail to load indexedDB. We will offer you the without indexedDB mode');
      window.alert('Something is wrong with indexedDB, we offer you the without DB mode, for more information, checkout console');
      console.log(e.target.error);
      failCallback(); // PUNCHLINE: offer without-DB mode
    };
  }

  function _createStoreHandler(initialData) {
    var objectStore = _db.createObjectStore(_storeName, { keyPath: _configKey, autoIncrement: true });

    // Use transaction oncomplete to make sure the objectStore creation is
    objectStore.transaction.oncomplete = function addInitialData() {
      var addRequest;

      console.log('create ' + _storeName + '\'s objectStore succeed');
      if (initialData) {
        addRequest = function addRequestGenerator(data) {
          _whetherWriteTransaction(true).add(data);
        };
        // Store initial values in the newly created objectStore.
        try {
          initialData.forEach(function addEveryInitialData(data, index) {
            addRequest(data).success = function addInitialSuccess() {
              console.log('add initial data[' + index + '] successed');
            };
          });
        } catch (error) {
          window.alert('please set correct initial array object data :)');
          console.log(error);
          throw error;
        }
      }
    };
  }

  function _whetherWriteTransaction(whetherWrite) {
    var transaction;

    if (whetherWrite) {
      transaction = _db.transaction([_storeName], 'readwrite');
    } else {
      transaction = _db.transaction([_storeName]);
    }

    return transaction.objectStore(_storeName);
  }

  // set present key value to _presentKey (the private property)
  function _getPresentKey() {
    getAllRequest().onsuccess = function getAllSuccess(e) {
      var cursor = e.target.result;

      if (cursor) {
        _presentKey = cursor.value.id;
        cursor.continue();
      } else {
        if (!_presentKey) {
          _presentKey = 0;
        }
        console.log('now key = ' +  _presentKey); // initial value is 0
      }
    };
  }

  function getNewKey() {
    _presentKey += 1;

    return _presentKey;
  }


  /* CRUD */

  function addItem(newData, successCallback) {
    var addRequest = _whetherWriteTransaction(true).add(newData);

    addRequest.onsuccess = function addSuccess() {
      console.log('\u2713 add ' + _configKey + ' = ' + newData[_configKey] + ' data succeed :)');
      if (successCallback) {
        successCallback(newData);
      }
    };
  }

  function getItem(key, successCallback) {
    var getRequest = _whetherWriteTransaction(false).get(parseInt(key, 10));  // get it by index

    getRequest.onsuccess = function getSuccess() {
      console.log('\u2713 get '  + _configKey + ' = ' + key + ' data success :)');
      successCallback(getRequest.result);
    };
  }

  // retrieve conditional data (boolean condition)
  function getConditionItem(condition, whether, successCallback) {
    var result = []; // use an array to storage eligible data

    getAllRequest().onsuccess = function getAllSuccess(e) {
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
      } else if (successCallback) {
        successCallback(result);
      }
    };
  }

  function getAll(successCallback) {
    var result = [];

    getAllRequest().onsuccess = function getAllSuccess(e) {
      var cursor = e.target.result;

      if (cursor) {
        result.push(cursor.value);
        cursor.continue();
      } else {
        console.log('\u2713 get all data success :)');
        if (successCallback) {
          successCallback(result);
        }
      }
    };
  }

  // update one
  function updateItem(newData, successCallback) {
    var putRequest = _whetherWriteTransaction(true).put(newData);

    putRequest.onsuccess = function putSuccess() {
      console.log('\u2713 update ' + _configKey + ' = ' + newData[_configKey] + ' data success :)');
      if (successCallback) {
        successCallback(newData);
      }
    };
  }

  function removeItem(key, successCallback) {
    var deleteRequest = _whetherWriteTransaction(true).delete(key);

    deleteRequest.onsuccess = function deleteSuccess() {
      console.log('\u2713 remove ' + _configKey + ' = ' + key + ' data success :)');
      if (successCallback) {
        successCallback(key);
      }
    };
  }

  function clear(successCallback) {
    getAllRequest().onsuccess = function getAllSuccess(e) {
      var cursor = e.target.result;

      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        console.log('\u2713 clear all data success :)');
        if (successCallback) {
          successCallback('clear all data success');
        }
      }
    };
  }

  function getAllRequest() {
    return _whetherWriteTransaction(true).openCursor(IDBKeyRange.lowerBound(1), 'next');
  }


  /* public interface */
  return {
    open: open,
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
  version: '15',
  key: 'id',
  storeName: 'aphorism',
  initialData: [
    {
      "id": 1,
      "content": "Welcome~, try to add your first to-do list : )"
    },
    {
      "id": 2,
      "content": "Yesterday You Said Tomorrow"
    },
    {
      "id": 3,
      "content": "Why are we here?"
    },
    {
      "id": 4,
      "content": "All in, or nothing"
    },
    {
      "id": 5,
      "content": "You Never Try, You Never Know"
    },
    {
      "id": 6,
      "content": "The unexamined life is not worth living. -- Socrates"
    }
  ]
};

},{}],3:[function(require,module,exports){
'use strict';
module.exports = {
  name: 'JustToDo',
  version: '14',
  key: 'id',
  storeName: 'list',
  initialData: [
    { id: 0, event: 'JustDemo', finished: true, date: 0 }
  ]
};

},{}],4:[function(require,module,exports){
'use strict';
(function init() {
  var DB = require('indexeddb-crud');
  var listDBConfig = require('./db/listConfig.js');
  var addEvents = require('./utlis/addEvents.js');

  // open DB, and when DB open succeed, invoke initial function
  DB.open(listDBConfig, addEvents.dbSuccess, addEvents.dbFail);
}());

},{"./db/listConfig.js":3,"./utlis/addEvents.js":5,"indexeddb-crud":1}],5:[function(require,module,exports){
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

},{"./eventHandler/eventHandler.js":9}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
'use strict';
var dbFail = (function dbFailGenerator() {
  var refresh = require('../refresh/refresh.js').dbFail;
  var createLi = require('../createLi.js');
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

      _elementAppear(element, true);
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
        element.classList.contains('finished') ? _elementAppear(element, true) : _elementAppear(element, false);
      } else {
        element.classList.contains('finished') ? _elementAppear(element, false) : _elementAppear(element, true);
      }
    });
    _removeRandom();
    general.ifEmpty.addRandom();
  }

  function _elementAppear(element, whether) {
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

},{"../createLi.js":6,"../refresh/refresh.js":14,"./general.js":10}],8:[function(require,module,exports){
'use strict';
var dbSuccess = (function dbSuccessGenerator() {
  var DB = require('indexeddb-crud');
  var refresh = require('../refresh/refresh.js').dbFail;
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
        targetLi.classList.toggle('finished'); // toggle appearance
        id = parseInt(targetLi.getAttribute('data-id'), 10); // use previously stored data-id attribute
        DB.getItem(id, _toggleLi);
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

  function _toggleLi(data) {
    data.finished = !data.finished;
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

},{"../createLi.js":6,"../refresh/refresh.js":14,"./general.js":10,"indexeddb-crud":1}],9:[function(require,module,exports){
'use strict';
module.exports = (function handlerGenerator() {
  var dbSuccess = require('./dbSuccess.js');
  var dbFail = require('./dbFail.js');

  return {
    dbSuccess: dbSuccess,
    dbFail: dbFail
  };
}());

},{"./dbFail.js":7,"./dbSuccess.js":8}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
module.exports = (function dbFailGenerator() {
  var general = require('./general.js');

  function randomAphorism() {
    var aphorisms = [
      'Yesterday You Said Tomorrow',
      'Why are we here?',
      'All in, or nothing',
      'You Never Try, You Never Know',
      'The unexamined life is not worth living. -- Socrates'
    ];
    var randomIndex = Math.floor(Math.random() * aphorisms.length);
    var text = aphorisms[randomIndex];

    general.sentenceGenerator(text);
  }

  /* interface */
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
  var general = require('./general.js');
  var DB = require('indexeddb-crud');
  var aphorismConfig = require('../../db/aphorismConfig.js');

  DB.open(aphorismConfig, _openSuccess);

  function _openSuccess() {
    console.log('open aphorism success');
  }

  function randomAphorism() {
    var randomIndex = Math.floor(Math.random() * DB.getNewKey());

    DB.getItem(randomIndex, general.sentenceGenerator);
  }

  /* interface */
  return {
    init: general.init,
    all: general.all.bind(null, randomAphorism),
    part: general.part.bind(null, randomAphorism),
    clear: general.clear,
    random: randomAphorism
  };
}());


},{"../../db/aphorismConfig.js":2,"./general.js":13,"indexeddb-crud":1}],13:[function(require,module,exports){
'use strict';
var general = (function generalGenerator() {
  var createLi = require('../createLi.js');

  function init(dataArr) {
    _show(_initSentence, dataArr);
  }

  function all(randomAphorism, dataArr) {
    console.dir(randomAphorism);
    _show(randomAphorism, dataArr);
  }

  function part(randomAphorism, dataArr) {
    var nodes;

    if (!dataArr || dataArr.length === 0) {
      randomAphorism();
    } else {
      nodes = dataArr.reduce(function nodeGenerator(result, data) {
        result.insertBefore(createLi(data), result.firstChild);

        return result;
      }, document.createDocumentFragment()); // PUNCHLINE: brilliant arr.reduce() + documentFragment

      document.querySelector('#list').appendChild(nodes); // add it to DOM
    }
  }

  function clear() {
    var root = document.querySelector('#list');

    while (root.hasChildNodes()) {
      root.removeChild(root.firstChild); // the best way to clean childNodes
    }
  }


  /* private methods */

  function _show(sentenceFunc, dataArr) {
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

    sentenceGenerator(text);
  }

  function sentenceGenerator(text) {
    var li = document.createElement('li');
    var textNode = document.createTextNode(text);

    li.appendChild(textNode);
    li.className = 'aphorism';
    document.querySelector('#list').appendChild(li);
  }


  /* interface */
  return {
    init: init,
    all: all,
    part: part,
    clear: clear,
    sentenceGenerator: sentenceGenerator
  };
}());

module.exports = general;

},{"../createLi.js":6}],14:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"./dbFail.js":11,"./dbSuccess.js":12,"dup":9}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5kZXhlZGRiLWNydWQvaW5kZXhlZGRiLWNydWQuanMiLCJzcmMvc2NyaXB0cy9kYi9hcGhvcmlzbUNvbmZpZy5qcyIsInNyYy9zY3JpcHRzL2RiL2xpc3RDb25maWcuanMiLCJzcmMvc2NyaXB0cy9tYWluLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvYWRkRXZlbnRzLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvY3JlYXRlTGkuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9ldmVudEhhbmRsZXIvZGJGYWlsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZXZlbnRIYW5kbGVyL2RiU3VjY2Vzcy5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2V2ZW50SGFuZGxlci9ldmVudEhhbmRsZXIuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9ldmVudEhhbmRsZXIvZ2VuZXJhbC5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL3JlZnJlc2gvZGJGYWlsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvcmVmcmVzaC9kYlN1Y2Nlc3MuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9yZWZyZXNoL2dlbmVyYWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG52YXIgaW5kZXhlZERCSGFuZGxlciA9IChmdW5jdGlvbiBpbmRleGVkREJIYW5kbGVyKCkge1xuICB2YXIgX2RiO1xuICB2YXIgX3N0b3JlTmFtZTtcbiAgdmFyIF9wcmVzZW50S2V5O1xuICB2YXIgX2NvbmZpZ0tleTtcblxuICAvKiBpbml0IGluZGV4ZWREQiAqL1xuXG4gIGZ1bmN0aW9uIG9wZW4oY29uZmlnLCBvcGVuU3VjY2Vzc0NhbGxiYWNrLCBvcGVuRmFpbENhbGxiYWNrKSB7XG4gICAgLy8gZmlyc3RseSBpbnNwZWN0IGJyb3dzZXIncyBzdXBwb3J0IGZvciBpbmRleGVkREJcbiAgICBpZiAoIXdpbmRvdy5pbmRleGVkREIpIHtcbiAgICAgIHdpbmRvdy5hbGVydCgnWW91ciBicm93c2VyIGRvZXNuXFwndCBzdXBwb3J0IGEgc3RhYmxlIHZlcnNpb24gb2YgSW5kZXhlZERCLiBXZSB3aWxsIG9mZmVyIHlvdSB0aGUgd2l0aG91dCBpbmRleGVkREIgbW9kZScpO1xuICAgICAgb3BlbkZhaWxDYWxsYmFjaygpO1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIF9vcGVuSGFuZGxlcihjb25maWcsIG9wZW5TdWNjZXNzQ2FsbGJhY2ssIG9wZW5GYWlsQ2FsbGJhY2spO1xuXG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICBmdW5jdGlvbiBfb3BlbkhhbmRsZXIoY29uZmlnLCBzdWNjZXNzQ2FsbGJhY2ssIGZhaWxDYWxsYmFjaykge1xuICAgIHZhciBvcGVuUmVxdWVzdCA9IHdpbmRvdy5pbmRleGVkREIub3Blbihjb25maWcubmFtZSwgY29uZmlnLnZlcnNpb24pOyAvLyBvcGVuIGluZGV4ZWREQlxuXG4gICAgX3N0b3JlTmFtZSA9IGNvbmZpZy5zdG9yZU5hbWU7IC8vIHN0b3JhZ2Ugc3RvcmVOYW1lXG4gICAgX2NvbmZpZ0tleSA9IGNvbmZpZy5rZXk7XG5cbiAgICAvLyBhbiBvbmJsb2NrZWQgZXZlbnQgaXMgZmlyZWQgdW50aWwgdGhleSBhcmUgY2xvc2VkIG9yIHJlbG9hZGVkXG4gICAgLy8gb3BlblJlcXVlc3Qub25ibG9ja2VkID0gZnVuY3Rpb24gYmxvY2tlZFNjaGVtZVVwKCkge1xuICAgIC8vICAgLy8gSWYgc29tZSBvdGhlciB0YWIgaXMgbG9hZGVkIHdpdGggdGhlIGRhdGFiYXNlLCB0aGVuIGl0IG5lZWRzIHRvIGJlIGNsb3NlZCBiZWZvcmUgd2UgY2FuIHByb2NlZWQuXG4gICAgLy8gICB3aW5kb3cuYWxlcnQoJ1BsZWFzZSBjbG9zZSBhbGwgb3RoZXIgdGFicyB3aXRoIHRoaXMgc2l0ZSBvcGVuJyk7XG4gICAgLy8gfTtcblxuICAgIC8vIENyZWF0aW5nIG9yIHVwZGF0aW5nIHRoZSB2ZXJzaW9uIG9mIHRoZSBkYXRhYmFzZVxuICAgIG9wZW5SZXF1ZXN0Lm9udXBncmFkZW5lZWRlZCA9IGZ1bmN0aW9uIHNjaGVtYVVwKGUpIHtcbiAgICAgIC8vIEFsbCBvdGhlciBkYXRhYmFzZXMgaGF2ZSBiZWVuIGNsb3NlZC4gU2V0IGV2ZXJ5dGhpbmcgdXAuXG4gICAgICBfZGIgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICBjb25zb2xlLmxvZygnb251cGdyYWRlbmVlZGVkIGluJyk7XG4gICAgICBpZiAoIShfZGIub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucyhfc3RvcmVOYW1lKSkpIHtcbiAgICAgICAgX2NyZWF0ZVN0b3JlSGFuZGxlcihjb25maWcuaW5pdGlhbERhdGEpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBvcGVuUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBvcGVuU3VjY2VzcyhlKSB7XG4gICAgICBfZGIgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBvcGVuIHN0b3JlTmFtZSA9ICcgKyBfc3RvcmVOYW1lICsgJyBpbmRleGVkREIgc3VjY2VzcycpO1xuICAgICAgc3VjY2Vzc0NhbGxiYWNrKCk7XG4gICAgICBfZ2V0UHJlc2VudEtleSgpO1xuICAgIH07XG5cbiAgICBvcGVuUmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24gb3BlbkVycm9yKGUpIHtcbiAgICAgIC8vIHdpbmRvdy5hbGVydCgnUGl0eSwgZmFpbCB0byBsb2FkIGluZGV4ZWREQi4gV2Ugd2lsbCBvZmZlciB5b3UgdGhlIHdpdGhvdXQgaW5kZXhlZERCIG1vZGUnKTtcbiAgICAgIHdpbmRvdy5hbGVydCgnU29tZXRoaW5nIGlzIHdyb25nIHdpdGggaW5kZXhlZERCLCB3ZSBvZmZlciB5b3UgdGhlIHdpdGhvdXQgREIgbW9kZSwgZm9yIG1vcmUgaW5mb3JtYXRpb24sIGNoZWNrb3V0IGNvbnNvbGUnKTtcbiAgICAgIGNvbnNvbGUubG9nKGUudGFyZ2V0LmVycm9yKTtcbiAgICAgIGZhaWxDYWxsYmFjaygpOyAvLyBQVU5DSExJTkU6IG9mZmVyIHdpdGhvdXQtREIgbW9kZVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfY3JlYXRlU3RvcmVIYW5kbGVyKGluaXRpYWxEYXRhKSB7XG4gICAgdmFyIG9iamVjdFN0b3JlID0gX2RiLmNyZWF0ZU9iamVjdFN0b3JlKF9zdG9yZU5hbWUsIHsga2V5UGF0aDogX2NvbmZpZ0tleSwgYXV0b0luY3JlbWVudDogdHJ1ZSB9KTtcblxuICAgIC8vIFVzZSB0cmFuc2FjdGlvbiBvbmNvbXBsZXRlIHRvIG1ha2Ugc3VyZSB0aGUgb2JqZWN0U3RvcmUgY3JlYXRpb24gaXNcbiAgICBvYmplY3RTdG9yZS50cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gYWRkSW5pdGlhbERhdGEoKSB7XG4gICAgICB2YXIgYWRkUmVxdWVzdDtcblxuICAgICAgY29uc29sZS5sb2coJ2NyZWF0ZSAnICsgX3N0b3JlTmFtZSArICdcXCdzIG9iamVjdFN0b3JlIHN1Y2NlZWQnKTtcbiAgICAgIGlmIChpbml0aWFsRGF0YSkge1xuICAgICAgICBhZGRSZXF1ZXN0ID0gZnVuY3Rpb24gYWRkUmVxdWVzdEdlbmVyYXRvcihkYXRhKSB7XG4gICAgICAgICAgX3doZXRoZXJXcml0ZVRyYW5zYWN0aW9uKHRydWUpLmFkZChkYXRhKTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gU3RvcmUgaW5pdGlhbCB2YWx1ZXMgaW4gdGhlIG5ld2x5IGNyZWF0ZWQgb2JqZWN0U3RvcmUuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaW5pdGlhbERhdGEuZm9yRWFjaChmdW5jdGlvbiBhZGRFdmVyeUluaXRpYWxEYXRhKGRhdGEsIGluZGV4KSB7XG4gICAgICAgICAgICBhZGRSZXF1ZXN0KGRhdGEpLnN1Y2Nlc3MgPSBmdW5jdGlvbiBhZGRJbml0aWFsU3VjY2VzcygpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2FkZCBpbml0aWFsIGRhdGFbJyArIGluZGV4ICsgJ10gc3VjY2Vzc2VkJyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIHdpbmRvdy5hbGVydCgncGxlYXNlIHNldCBjb3JyZWN0IGluaXRpYWwgYXJyYXkgb2JqZWN0IGRhdGEgOiknKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gX3doZXRoZXJXcml0ZVRyYW5zYWN0aW9uKHdoZXRoZXJXcml0ZSkge1xuICAgIHZhciB0cmFuc2FjdGlvbjtcblxuICAgIGlmICh3aGV0aGVyV3JpdGUpIHtcbiAgICAgIHRyYW5zYWN0aW9uID0gX2RiLnRyYW5zYWN0aW9uKFtfc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0cmFuc2FjdGlvbiA9IF9kYi50cmFuc2FjdGlvbihbX3N0b3JlTmFtZV0pO1xuICAgIH1cblxuICAgIHJldHVybiB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShfc3RvcmVOYW1lKTtcbiAgfVxuXG4gIC8vIHNldCBwcmVzZW50IGtleSB2YWx1ZSB0byBfcHJlc2VudEtleSAodGhlIHByaXZhdGUgcHJvcGVydHkpXG4gIGZ1bmN0aW9uIF9nZXRQcmVzZW50S2V5KCkge1xuICAgIGdldEFsbFJlcXVlc3QoKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRBbGxTdWNjZXNzKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgX3ByZXNlbnRLZXkgPSBjdXJzb3IudmFsdWUuaWQ7XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCFfcHJlc2VudEtleSkge1xuICAgICAgICAgIF9wcmVzZW50S2V5ID0gMDtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZygnbm93IGtleSA9ICcgKyAgX3ByZXNlbnRLZXkpOyAvLyBpbml0aWFsIHZhbHVlIGlzIDBcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TmV3S2V5KCkge1xuICAgIF9wcmVzZW50S2V5ICs9IDE7XG5cbiAgICByZXR1cm4gX3ByZXNlbnRLZXk7XG4gIH1cblxuXG4gIC8qIENSVUQgKi9cblxuICBmdW5jdGlvbiBhZGRJdGVtKG5ld0RhdGEsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBhZGRSZXF1ZXN0ID0gX3doZXRoZXJXcml0ZVRyYW5zYWN0aW9uKHRydWUpLmFkZChuZXdEYXRhKTtcblxuICAgIGFkZFJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gYWRkU3VjY2VzcygpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGFkZCAnICsgX2NvbmZpZ0tleSArICcgPSAnICsgbmV3RGF0YVtfY29uZmlnS2V5XSArICcgZGF0YSBzdWNjZWVkIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhuZXdEYXRhKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0SXRlbShrZXksIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBnZXRSZXF1ZXN0ID0gX3doZXRoZXJXcml0ZVRyYW5zYWN0aW9uKGZhbHNlKS5nZXQocGFyc2VJbnQoa2V5LCAxMCkpOyAgLy8gZ2V0IGl0IGJ5IGluZGV4XG5cbiAgICBnZXRSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGdldFN1Y2Nlc3MoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBnZXQgJyAgKyBfY29uZmlnS2V5ICsgJyA9ICcgKyBrZXkgKyAnIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgc3VjY2Vzc0NhbGxiYWNrKGdldFJlcXVlc3QucmVzdWx0KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gcmV0cmlldmUgY29uZGl0aW9uYWwgZGF0YSAoYm9vbGVhbiBjb25kaXRpb24pXG4gIGZ1bmN0aW9uIGdldENvbmRpdGlvbkl0ZW0oY29uZGl0aW9uLCB3aGV0aGVyLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgcmVzdWx0ID0gW107IC8vIHVzZSBhbiBhcnJheSB0byBzdG9yYWdlIGVsaWdpYmxlIGRhdGFcblxuICAgIGdldEFsbFJlcXVlc3QoKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRBbGxTdWNjZXNzKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgaWYgKHdoZXRoZXIpIHtcbiAgICAgICAgICBpZiAoY3Vyc29yLnZhbHVlW2NvbmRpdGlvbl0pIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGN1cnNvci52YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCF3aGV0aGVyKSB7XG4gICAgICAgICAgaWYgKCFjdXJzb3IudmFsdWVbY29uZGl0aW9uXSkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goY3Vyc29yLnZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICB9IGVsc2UgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzdWx0KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0QWxsKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgIGdldEFsbFJlcXVlc3QoKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRBbGxTdWNjZXNzKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goY3Vyc29yLnZhbHVlKTtcbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBnZXQgYWxsIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLy8gdXBkYXRlIG9uZVxuICBmdW5jdGlvbiB1cGRhdGVJdGVtKG5ld0RhdGEsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBwdXRSZXF1ZXN0ID0gX3doZXRoZXJXcml0ZVRyYW5zYWN0aW9uKHRydWUpLnB1dChuZXdEYXRhKTtcblxuICAgIHB1dFJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gcHV0U3VjY2VzcygpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIHVwZGF0ZSAnICsgX2NvbmZpZ0tleSArICcgPSAnICsgbmV3RGF0YVtfY29uZmlnS2V5XSArICcgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhuZXdEYXRhKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlSXRlbShrZXksIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBkZWxldGVSZXF1ZXN0ID0gX3doZXRoZXJXcml0ZVRyYW5zYWN0aW9uKHRydWUpLmRlbGV0ZShrZXkpO1xuXG4gICAgZGVsZXRlUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBkZWxldGVTdWNjZXNzKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgcmVtb3ZlICcgKyBfY29uZmlnS2V5ICsgJyA9ICcgKyBrZXkgKyAnIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2soa2V5KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgZ2V0QWxsUmVxdWVzdCgpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGdldEFsbFN1Y2Nlc3MoZSkge1xuICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICBjdXJzb3IuZGVsZXRlKCk7XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgY2xlYXIgYWxsIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKCdjbGVhciBhbGwgZGF0YSBzdWNjZXNzJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0QWxsUmVxdWVzdCgpIHtcbiAgICByZXR1cm4gX3doZXRoZXJXcml0ZVRyYW5zYWN0aW9uKHRydWUpLm9wZW5DdXJzb3IoSURCS2V5UmFuZ2UubG93ZXJCb3VuZCgxKSwgJ25leHQnKTtcbiAgfVxuXG5cbiAgLyogcHVibGljIGludGVyZmFjZSAqL1xuICByZXR1cm4ge1xuICAgIG9wZW46IG9wZW4sXG4gICAgZ2V0TmV3S2V5OiBnZXROZXdLZXksXG4gICAgYWRkSXRlbTogYWRkSXRlbSxcbiAgICBnZXRJdGVtOiBnZXRJdGVtLFxuICAgIGdldENvbmRpdGlvbkl0ZW06IGdldENvbmRpdGlvbkl0ZW0sXG4gICAgZ2V0QWxsOiBnZXRBbGwsXG4gICAgdXBkYXRlSXRlbTogdXBkYXRlSXRlbSxcbiAgICByZW1vdmVJdGVtOiByZW1vdmVJdGVtLFxuICAgIGNsZWFyOiBjbGVhclxuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBpbmRleGVkREJIYW5kbGVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG5hbWU6ICdKdXN0VG9EbycsXG4gIHZlcnNpb246ICcxNScsXG4gIGtleTogJ2lkJyxcbiAgc3RvcmVOYW1lOiAnYXBob3Jpc20nLFxuICBpbml0aWFsRGF0YTogW1xuICAgIHtcbiAgICAgIFwiaWRcIjogMSxcbiAgICAgIFwiY29udGVudFwiOiBcIldlbGNvbWV+LCB0cnkgdG8gYWRkIHlvdXIgZmlyc3QgdG8tZG8gbGlzdCA6IClcIlxuICAgIH0sXG4gICAge1xuICAgICAgXCJpZFwiOiAyLFxuICAgICAgXCJjb250ZW50XCI6IFwiWWVzdGVyZGF5IFlvdSBTYWlkIFRvbW9ycm93XCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwiaWRcIjogMyxcbiAgICAgIFwiY29udGVudFwiOiBcIldoeSBhcmUgd2UgaGVyZT9cIlxuICAgIH0sXG4gICAge1xuICAgICAgXCJpZFwiOiA0LFxuICAgICAgXCJjb250ZW50XCI6IFwiQWxsIGluLCBvciBub3RoaW5nXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwiaWRcIjogNSxcbiAgICAgIFwiY29udGVudFwiOiBcIllvdSBOZXZlciBUcnksIFlvdSBOZXZlciBLbm93XCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwiaWRcIjogNixcbiAgICAgIFwiY29udGVudFwiOiBcIlRoZSB1bmV4YW1pbmVkIGxpZmUgaXMgbm90IHdvcnRoIGxpdmluZy4gLS0gU29jcmF0ZXNcIlxuICAgIH1cbiAgXVxufTtcbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0ge1xuICBuYW1lOiAnSnVzdFRvRG8nLFxuICB2ZXJzaW9uOiAnMTQnLFxuICBrZXk6ICdpZCcsXG4gIHN0b3JlTmFtZTogJ2xpc3QnLFxuICBpbml0aWFsRGF0YTogW1xuICAgIHsgaWQ6IDAsIGV2ZW50OiAnSnVzdERlbW8nLCBmaW5pc2hlZDogdHJ1ZSwgZGF0ZTogMCB9XG4gIF1cbn07XG4iLCIndXNlIHN0cmljdCc7XG4oZnVuY3Rpb24gaW5pdCgpIHtcbiAgdmFyIERCID0gcmVxdWlyZSgnaW5kZXhlZGRiLWNydWQnKTtcbiAgdmFyIGxpc3REQkNvbmZpZyA9IHJlcXVpcmUoJy4vZGIvbGlzdENvbmZpZy5qcycpO1xuICB2YXIgYWRkRXZlbnRzID0gcmVxdWlyZSgnLi91dGxpcy9hZGRFdmVudHMuanMnKTtcblxuICAvLyBvcGVuIERCLCBhbmQgd2hlbiBEQiBvcGVuIHN1Y2NlZWQsIGludm9rZSBpbml0aWFsIGZ1bmN0aW9uXG4gIERCLm9wZW4obGlzdERCQ29uZmlnLCBhZGRFdmVudHMuZGJTdWNjZXNzLCBhZGRFdmVudHMuZGJGYWlsKTtcbn0oKSk7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgYWRkRXZlbnRzID0gKGZ1bmN0aW9uIGFkZEV2ZW50c0dlbmVyYXRvcigpIHtcbiAgZnVuY3Rpb24gX3doZXRoZXJTdWNjZXNzKHdoZXRoZXJTdWNjZXNzKSB7XG4gICAgZnVuY3Rpb24gX3doZXRoZXJTdWNjZXNzSGFuZGxlcih3aGV0aGVyKSB7XG4gICAgICB2YXIgZXZlbnRIYW5kbGVyID0gcmVxdWlyZSgnLi9ldmVudEhhbmRsZXIvZXZlbnRIYW5kbGVyLmpzJyk7XG4gICAgICB2YXIgaGFuZGxlciA9IHdoZXRoZXIgPyBldmVudEhhbmRsZXIuZGJTdWNjZXNzIDogZXZlbnRIYW5kbGVyLmRiRmFpbDtcbiAgICAgIHZhciBsaXN0O1xuXG4gICAgICBoYW5kbGVyLnNob3dJbml0KCk7XG4gICAgICAvLyBhZGQgYWxsIGV2ZW50TGlzdGVuZXJcbiAgICAgIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgICAgbGlzdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuY2xpY2tMaSwgZmFsc2UpO1xuICAgICAgbGlzdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIucmVtb3ZlTGksIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVyLmVudGVyQWRkLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWRkJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLmFkZCwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dEb25lJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dEb25lLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd1RvZG8nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd1RvZG8sIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93QWxsJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dBbGwsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93Q2xlYXInKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0NsZWFyLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBIYW5kbGVyKCkge1xuICAgICAgX3doZXRoZXJTdWNjZXNzSGFuZGxlcih3aGV0aGVyU3VjY2Vzcyk7XG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZGJTdWNjZXNzOiBfd2hldGhlclN1Y2Nlc3ModHJ1ZSksXG4gICAgZGJGYWlsOiBfd2hldGhlclN1Y2Nlc3MoZmFsc2UpXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFkZEV2ZW50cztcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBjcmVhdGVMaSA9IChmdW5jdGlvbiBsaUdlbmVyYXRvcigpIHtcbiAgZnVuY3Rpb24gX2RlY29yYXRlTGkobGksIGRhdGEpIHtcbiAgICB2YXIgdGV4dERhdGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhLmRhdGUgKyAnOiAnKTtcbiAgICB2YXIgdGV4dFdyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnICcgKyBkYXRhLmV2ZW50KTtcblxuICAgIC8vIHdyYXAgYXMgYSBub2RlXG4gICAgdGV4dFdyYXAuYXBwZW5kQ2hpbGQodGV4dCk7XG4gICAgbGkuYXBwZW5kQ2hpbGQodGV4dERhdGUpO1xuICAgIGxpLmFwcGVuZENoaWxkKHRleHRXcmFwKTtcbiAgICBpZiAoZGF0YS5maW5pc2hlZCkgeyAgLy8gYWRkIGNzcy1zdHlsZSB0byBpdCAoYWNjb3JkaW5nIHRvIGl0J3MgZGF0YS5maW5pc2hlZCB2YWx1ZSlcbiAgICAgIGxpLmNsYXNzTGlzdC5hZGQoJ2ZpbmlzaGVkJyk7IC8vIGFkZCBzdHlsZVxuICAgIH1cbiAgICBfYWRkWChsaSk7IC8vIGFkZCBzcGFuIFt4XSB0byBsaSdzIHRhaWxcbiAgICBfc2V0RGF0YVByb3BlcnR5KGxpLCAnZGF0YS1pZCcsIGRhdGEuaWQpOyAvLyBhZGQgcHJvcGVydHkgdG8gbGkgKGRhdGEtaWQp77yMZm9yICBjbGlja0xpXG4gIH1cblxuICBmdW5jdGlvbiBfYWRkWChsaSkge1xuICAgIHZhciBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHZhciB4ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJ1xcdTAwRDcnKTsgLy8gdW5pY29kZSAtPiB4XG5cbiAgICBzcGFuLmFwcGVuZENoaWxkKHgpO1xuICAgIHNwYW4uY2xhc3NOYW1lID0gJ2Nsb3NlJzsgLy8gYWRkIHN0eWxlXG4gICAgbGkuYXBwZW5kQ2hpbGQoc3Bhbik7XG4gIH1cblxuICBmdW5jdGlvbiBfc2V0RGF0YVByb3BlcnR5KHRhcmdldCwgbmFtZSwgZGF0YSkge1xuICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUobmFtZSwgZGF0YSk7XG4gIH1cblxuXG4gIHJldHVybiBmdW5jdGlvbiBjcmVhdGUoZGF0YSkge1xuICAgIHZhciBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG5cbiAgICBfZGVjb3JhdGVMaShsaSwgZGF0YSk7IC8vIGRlY29yYXRlIGxpXG5cbiAgICByZXR1cm4gbGk7XG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUxpO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGRiRmFpbCA9IChmdW5jdGlvbiBkYkZhaWxHZW5lcmF0b3IoKSB7XG4gIHZhciByZWZyZXNoID0gcmVxdWlyZSgnLi4vcmVmcmVzaC9yZWZyZXNoLmpzJykuZGJGYWlsO1xuICB2YXIgY3JlYXRlTGkgPSByZXF1aXJlKCcuLi9jcmVhdGVMaS5qcycpO1xuICB2YXIgZ2VuZXJhbCA9IHJlcXVpcmUoJy4vZ2VuZXJhbC5qcycpO1xuICB2YXIgX2lkID0gMDsgLy8gc28gdGhlIGZpcnN0IGl0ZW0ncyBpZCBpcyAxXG5cbiAgZnVuY3Rpb24gYWRkKCkge1xuICAgIHZhciBpbnB1dFZhbHVlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWU7XG4gICAgdmFyIGxpc3Q7XG4gICAgdmFyIG5ld0RhdGE7XG4gICAgdmFyIG5ld0xpO1xuXG4gICAgaWYgKGlucHV0VmFsdWUgPT09ICcnKSB7XG4gICAgICB3aW5kb3cuYWxlcnQoJ3BsZWFzZSBpbnB1dCBhIHJlYWwgZGF0YX4nKTtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBfcmVtb3ZlUmFuZG9tKCk7XG4gICAgX2lkICs9IDE7XG4gICAgbmV3RGF0YSA9IGdlbmVyYWwuZGF0YUdlbmVyYXRvcihfaWQsIGlucHV0VmFsdWUpO1xuICAgIG5ld0xpID0gY3JlYXRlTGkobmV3RGF0YSk7XG4gICAgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgbGlzdC5pbnNlcnRCZWZvcmUobmV3TGksIGxpc3QuZmlyc3RDaGlsZCk7IC8vIHB1c2ggbmV3TGkgdG8gZmlyc3RcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5wdXQnKS52YWx1ZSA9ICcnOyAgLy8gcmVzZXQgaW5wdXQncyB2YWx1ZXNcblxuICAgIHJldHVybiAwO1xuICB9XG5cbiAgZnVuY3Rpb24gX3JlbW92ZVJhbmRvbSgpIHtcbiAgICB2YXIgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgdmFyIGxpc3RJdGVtcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNsaXN0IGxpJyk7XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhsaXN0SXRlbXMpO1xuXG4gICAgcmV0dXJuIGtleXMuZm9yRWFjaChmdW5jdGlvbiB0ZXN0RXZlcnlJdGVtKGluZGV4KSB7XG4gICAgICBpZiAobGlzdEl0ZW1zW2tleXNbaW5kZXhdXS5jbGFzc0xpc3QuY29udGFpbnMoJ2FwaG9yaXNtJykpIHtcbiAgICAgICAgbGlzdC5yZW1vdmVDaGlsZChsaXN0SXRlbXNba2V5c1tpbmRleF1dKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVudGVyQWRkKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgYWRkKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY2xpY2tMaShlKSB7XG4gICAgdmFyIHRhcmdldExpID0gZS50YXJnZXQ7XG4gICAgLy8gdXNlIGV2ZW50IGRlbGVnYXRpb25cblxuICAgIGlmICh0YXJnZXRMaS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSkge1xuICAgICAgX3RvZ2dsZUxpKHRhcmdldExpKTtcbiAgICAgIHNob3dBbGwoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfdG9nZ2xlTGkodGFyZ2V0TGkpIHtcbiAgICB0YXJnZXRMaS5jbGFzc0xpc3QudG9nZ2xlKCdmaW5pc2hlZCcpO1xuICB9XG5cbiAgLy8gbGkncyBbeF0ncyBkZWxldGVcbiAgZnVuY3Rpb24gcmVtb3ZlTGkoZSkge1xuICAgIHZhciBpZDtcbiAgICB2YXIgRE9NSW5kZXg7XG4gICAgdmFyIGxpc3Q7XG4gICAgdmFyIGxpc3RJdGVtcztcblxuICAgIGlmIChlLnRhcmdldC5jbGFzc05hbWUgPT09ICdjbG9zZScpIHsgLy8gdXNlIGV2ZW50IGRlbGVnYXRpb25cbiAgICAgIC8vIHVzZSBwcmV2aW91c2x5IHN0b3JlZCBkYXRhXG4gICAgICBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgICAgIGxpc3RJdGVtcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNsaXN0IGxpJyk7XG4gICAgICBpZCA9IGUudGFyZ2V0LnBhcmVudE5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyk7XG4gICAgICBET01JbmRleCA9IF9nZXRET01JbmRleChpZCk7XG4gICAgICBsaXN0LnJlbW92ZUNoaWxkKGxpc3RJdGVtc1tET01JbmRleF0pO1xuICAgICAgZ2VuZXJhbC5pZkVtcHR5LmFkZFJhbmRvbSgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9nZXRET01JbmRleChpZCkge1xuICAgIHZhciBpO1xuICAgIHZhciBsaXN0SXRlbXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjbGlzdCBsaScpO1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMobGlzdEl0ZW1zKTtcblxuICAgIGZvciAoaSBpbiBrZXlzKSB7XG4gICAgICBpZiAobGlzdEl0ZW1zW2tleXNbaV1dLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpID09PSBpZCkge1xuICAgICAgICByZXR1cm4ga2V5c1tpXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gJ1dyb25nIGlkLCBub3QgZm91bmQgaW4gRE9NIHRyZWUnO1xuICB9XG5cbiAgZ2VuZXJhbC5pZkVtcHR5LmFkZFJhbmRvbSA9IGZ1bmN0aW9uIGFkZFJhbmRvbSgpIHtcbiAgICB2YXIgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG5cbiAgICBpZiAoIWxpc3QuZmlyc3RDaGlsZCB8fCBfaXNBbGxOb25lKCkpIHtcbiAgICAgIHJlZnJlc2gucmFuZG9tKCk7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIF9pc0FsbE5vbmUoKSB7XG4gICAgdmFyIGxpc3RJdGVtcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNsaXN0IGxpJyk7XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhsaXN0SXRlbXMpO1xuXG4gICAgcmV0dXJuIGtleXMuZXZlcnkoZnVuY3Rpb24gdGVzdEV2ZXJ5SXRlbShpbmRleCkge1xuICAgICAgcmV0dXJuIGxpc3RJdGVtc1trZXlzW2luZGV4XV0uc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0luaXQoKSB7XG4gICAgcmVmcmVzaC5jbGVhcigpO1xuICAgIHJlZnJlc2guaW5pdCgpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0FsbCgpIHtcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNsaXN0IGxpJykpO1xuXG4gICAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uIGFwcGVhckFsbChpbmRleCkge1xuICAgICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgICAgdmFyIGxpc3RJdGVtcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNsaXN0IGxpJyk7XG4gICAgICB2YXIgZWxlbWVudCA9IGxpc3RJdGVtc1trZXlzW2luZGV4XV07XG5cbiAgICAgIF9lbGVtZW50QXBwZWFyKGVsZW1lbnQsIHRydWUpO1xuICAgICAgaWYgKGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdmaW5pc2hlZCcpKSB7XG4gICAgICAgIGxpc3QucmVtb3ZlQ2hpbGQobGlzdC5jaGlsZE5vZGVzW2tleXNbaW5kZXhdXSk7XG4gICAgICAgIGxpc3QuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93Q2xlYXIoKSB7XG4gICAgcmVmcmVzaC5jbGVhcigpOyAvLyBjbGVhciBub2RlcyB2aXN1YWxseVxuICAgIHJlZnJlc2gucmFuZG9tKCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93RG9uZSgpIHtcbiAgICBfc2hvd1doZXRoZXJEb25lKHRydWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd1RvZG8oKSB7XG4gICAgX3Nob3dXaGV0aGVyRG9uZShmYWxzZSk7XG4gIH1cblxuICBmdW5jdGlvbiBfc2hvd1doZXRoZXJEb25lKHdoZXRoZXJEb25lKSB7XG4gICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjbGlzdCBsaScpLCBmdW5jdGlvbiB3aGV0aGVyRG9uZUFwcGVhcihlbGVtZW50KSB7XG4gICAgICBpZiAod2hldGhlckRvbmUpIHtcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoJ2ZpbmlzaGVkJykgPyBfZWxlbWVudEFwcGVhcihlbGVtZW50LCB0cnVlKSA6IF9lbGVtZW50QXBwZWFyKGVsZW1lbnQsIGZhbHNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdmaW5pc2hlZCcpID8gX2VsZW1lbnRBcHBlYXIoZWxlbWVudCwgZmFsc2UpIDogX2VsZW1lbnRBcHBlYXIoZWxlbWVudCwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgX3JlbW92ZVJhbmRvbSgpO1xuICAgIGdlbmVyYWwuaWZFbXB0eS5hZGRSYW5kb20oKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9lbGVtZW50QXBwZWFyKGVsZW1lbnQsIHdoZXRoZXIpIHtcbiAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSB3aGV0aGVyID8gJ2Jsb2NrJyA6ICdub25lJztcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYWRkOiBhZGQsXG4gICAgZW50ZXJBZGQ6IGVudGVyQWRkLFxuICAgIGNsaWNrTGk6IGNsaWNrTGksXG4gICAgcmVtb3ZlTGk6IHJlbW92ZUxpLFxuICAgIHNob3dJbml0OiBzaG93SW5pdCxcbiAgICBzaG93QWxsOiBzaG93QWxsLFxuICAgIHNob3dDbGVhcjogc2hvd0NsZWFyLFxuICAgIHNob3dEb25lOiBzaG93RG9uZSxcbiAgICBzaG93VG9kbzogc2hvd1RvZG9cbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZGJGYWlsO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGRiU3VjY2VzcyA9IChmdW5jdGlvbiBkYlN1Y2Nlc3NHZW5lcmF0b3IoKSB7XG4gIHZhciBEQiA9IHJlcXVpcmUoJ2luZGV4ZWRkYi1jcnVkJyk7XG4gIHZhciByZWZyZXNoID0gcmVxdWlyZSgnLi4vcmVmcmVzaC9yZWZyZXNoLmpzJykuZGJGYWlsO1xuICB2YXIgY3JlYXRlTGkgPSByZXF1aXJlKCcuLi9jcmVhdGVMaS5qcycpO1xuICB2YXIgZ2VuZXJhbCA9IHJlcXVpcmUoJy4vZ2VuZXJhbC5qcycpO1xuXG4gIGZ1bmN0aW9uIGFkZCgpIHtcbiAgICB2YXIgaW5wdXRWYWx1ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNpbnB1dCcpLnZhbHVlO1xuICAgIHZhciBsaXN0O1xuICAgIHZhciBuZXdEYXRhO1xuICAgIHZhciBuZXdMaTtcblxuICAgIGlmIChpbnB1dFZhbHVlID09PSAnJykge1xuICAgICAgd2luZG93LmFsZXJ0KCdwbGVhc2UgaW5wdXQgYSByZWFsIGRhdGF+Jyk7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgZ2VuZXJhbC5pZkVtcHR5LnJlbW92ZUluaXQoKTtcbiAgICBuZXdEYXRhID0gZ2VuZXJhbC5kYXRhR2VuZXJhdG9yKERCLmdldE5ld0tleSgpLCBpbnB1dFZhbHVlKTtcbiAgICBuZXdMaSA9IGNyZWF0ZUxpKG5ld0RhdGEpO1xuICAgIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgIGxpc3QuaW5zZXJ0QmVmb3JlKG5ld0xpLCBsaXN0LmZpcnN0Q2hpbGQpOyAvLyBwdXNoIG5ld0xpIHRvIGZpcnN0XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWUgPSAnJzsgIC8vIHJlc2V0IGlucHV0J3MgdmFsdWVzXG4gICAgREIuYWRkSXRlbShuZXdEYXRhKTtcblxuICAgIHJldHVybiAwO1xuICB9XG5cbiAgZnVuY3Rpb24gZW50ZXJBZGQoZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzKSB7XG4gICAgICBhZGQoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjbGlja0xpKGUpIHtcbiAgICB2YXIgaWQ7XG4gICAgdmFyIHRhcmdldExpID0gZS50YXJnZXQ7XG4gICAgLy8gdXNlIGV2ZW50IGRlbGVnYXRpb25cblxuICAgIGlmICghdGFyZ2V0TGkuY2xhc3NMaXN0LmNvbnRhaW5zKCdhcGhvcmlzbScpKSB7XG4gICAgICBpZiAodGFyZ2V0TGkuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJykpIHtcbiAgICAgICAgdGFyZ2V0TGkuY2xhc3NMaXN0LnRvZ2dsZSgnZmluaXNoZWQnKTsgLy8gdG9nZ2xlIGFwcGVhcmFuY2VcbiAgICAgICAgaWQgPSBwYXJzZUludCh0YXJnZXRMaS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSwgMTApOyAvLyB1c2UgcHJldmlvdXNseSBzdG9yZWQgZGF0YS1pZCBhdHRyaWJ1dGVcbiAgICAgICAgREIuZ2V0SXRlbShpZCwgX3RvZ2dsZUxpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBsaSdzIFt4XSdzIGRlbGV0ZVxuICBmdW5jdGlvbiByZW1vdmVMaShlKSB7XG4gICAgdmFyIGlkO1xuXG4gICAgaWYgKGUudGFyZ2V0LmNsYXNzTmFtZSA9PT0gJ2Nsb3NlJykgeyAvLyB1c2UgZXZlbnQgZGVsZWdhdGlvblxuICAgICAgLy8gdXNlIHByZXZpb3VzbHkgc3RvcmVkIGRhdGFcbiAgICAgIGlkID0gcGFyc2VJbnQoZS50YXJnZXQucGFyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSwgMTApO1xuICAgICAgREIucmVtb3ZlSXRlbShpZCwgc2hvd0FsbCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0luaXQoKSB7XG4gICAgcmVmcmVzaC5jbGVhcigpO1xuICAgIERCLmdldEFsbChyZWZyZXNoLmluaXQpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0FsbCgpIHtcbiAgICByZWZyZXNoLmNsZWFyKCk7XG4gICAgREIuZ2V0QWxsKHJlZnJlc2guYWxsKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dDbGVhcigpIHtcbiAgICByZWZyZXNoLmNsZWFyKCk7IC8vIGNsZWFyIG5vZGVzIHZpc3VhbGx5XG4gICAgcmVmcmVzaC5yYW5kb20oKTtcbiAgICBEQi5jbGVhcigpOyAvLyBjbGVhciBkYXRhIGluZGVlZFxuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0RvbmUoKSB7XG4gICAgX3Nob3dXaGV0aGVyRG9uZSh0cnVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dUb2RvKCkge1xuICAgIF9zaG93V2hldGhlckRvbmUoZmFsc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3Nob3dXaGV0aGVyRG9uZSh3aGV0aGVyRG9uZSkge1xuICAgIHZhciBjb25kaXRpb24gPSAnZmluaXNoZWQnO1xuXG4gICAgcmVmcmVzaC5jbGVhcigpO1xuICAgIERCLmdldENvbmRpdGlvbkl0ZW0oY29uZGl0aW9uLCB3aGV0aGVyRG9uZSwgcmVmcmVzaC5wYXJ0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF90b2dnbGVMaShkYXRhKSB7XG4gICAgZGF0YS5maW5pc2hlZCA9ICFkYXRhLmZpbmlzaGVkO1xuICAgIERCLnVwZGF0ZUl0ZW0oZGF0YSwgc2hvd0FsbCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGFkZDogYWRkLFxuICAgIGVudGVyQWRkOiBlbnRlckFkZCxcbiAgICBjbGlja0xpOiBjbGlja0xpLFxuICAgIHJlbW92ZUxpOiByZW1vdmVMaSxcbiAgICBzaG93SW5pdDogc2hvd0luaXQsXG4gICAgc2hvd0FsbDogc2hvd0FsbCxcbiAgICBzaG93Q2xlYXI6IHNob3dDbGVhcixcbiAgICBzaG93RG9uZTogc2hvd0RvbmUsXG4gICAgc2hvd1RvZG86IHNob3dUb2RvXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRiU3VjY2VzcztcbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uIGhhbmRsZXJHZW5lcmF0b3IoKSB7XG4gIHZhciBkYlN1Y2Nlc3MgPSByZXF1aXJlKCcuL2RiU3VjY2Vzcy5qcycpO1xuICB2YXIgZGJGYWlsID0gcmVxdWlyZSgnLi9kYkZhaWwuanMnKTtcblxuICByZXR1cm4ge1xuICAgIGRiU3VjY2VzczogZGJTdWNjZXNzLFxuICAgIGRiRmFpbDogZGJGYWlsXG4gIH07XG59KCkpO1xuIiwidmFyIGdlbmVyYWwgPSAoZnVuY3Rpb24gZ2VuZXJhbEdlbmVyYXRvcigpIHtcbiAgdmFyIGlmRW1wdHkgPSB7XG4gICAgcmVtb3ZlSW5pdDogZnVuY3Rpb24gcmVtb3ZlSW5pdCgpIHtcbiAgICAgIHZhciBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcblxuICAgICAgaWYgKGxpc3QuZmlyc3RDaGlsZC5jbGFzc05hbWUgPT09ICdhcGhvcmlzbScpIHtcbiAgICAgICAgbGlzdC5yZW1vdmVDaGlsZChsaXN0LmZpcnN0Q2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBkYXRhR2VuZXJhdG9yKGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IGtleSxcbiAgICAgIGV2ZW50OiB2YWx1ZSxcbiAgICAgIGZpbmlzaGVkOiBmYWxzZSxcbiAgICAgIGRhdGU6IF9nZXROZXdEYXRlKCd5eXl55bm0TU3mnIhkZOaXpSBoaDptbScpXG4gICAgfTtcbiAgfVxuXG4gIC8vIEZvcm1hdCBkYXRlXG4gIGZ1bmN0aW9uIF9nZXROZXdEYXRlKGZtdCkge1xuICAgIHZhciBuZXdEYXRlID0gbmV3IERhdGUoKTtcbiAgICB2YXIgbmV3Zm10ID0gZm10O1xuICAgIHZhciBvID0ge1xuICAgICAgJ3krJzogbmV3RGF0ZS5nZXRGdWxsWWVhcigpLFxuICAgICAgJ00rJzogbmV3RGF0ZS5nZXRNb250aCgpICsgMSxcbiAgICAgICdkKyc6IG5ld0RhdGUuZ2V0RGF0ZSgpLFxuICAgICAgJ2grJzogbmV3RGF0ZS5nZXRIb3VycygpLFxuICAgICAgJ20rJzogbmV3RGF0ZS5nZXRNaW51dGVzKClcbiAgICB9O1xuICAgIHZhciBsZW5zO1xuXG4gICAgZm9yICh2YXIgayBpbiBvKSB7XG4gICAgICBpZiAobmV3IFJlZ0V4cCgnKCcgKyBrICsgJyknKS50ZXN0KG5ld2ZtdCkpIHtcbiAgICAgICAgaWYgKGsgPT09ICd5KycpIHtcbiAgICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsICgnJyArIG9ba10pLnN1YnN0cig0IC0gUmVnRXhwLiQxLmxlbmd0aCkpO1xuICAgICAgICB9IGVsc2UgaWYgKGsgPT09ICdTKycpIHtcbiAgICAgICAgICBsZW5zID0gUmVnRXhwLiQxLmxlbmd0aDtcbiAgICAgICAgICBsZW5zID0gbGVucyA9PT0gMSA/IDMgOiBsZW5zO1xuICAgICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKCcwMCcgKyBvW2tdKS5zdWJzdHIoKCcnICsgb1trXSkubGVuZ3RoIC0gMSwgbGVucykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKFJlZ0V4cC4kMS5sZW5ndGggPT09IDEpID8gKG9ba10pIDogKCgnMDAnICsgb1trXSkuc3Vic3RyKCgnJyArIG9ba10pLmxlbmd0aCkpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZXdmbXQ7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGlmRW1wdHk6IGlmRW1wdHksXG4gICAgZGF0YUdlbmVyYXRvcjogZGF0YUdlbmVyYXRvclxuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBnZW5lcmFsO1xuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gZGJGYWlsR2VuZXJhdG9yKCkge1xuICB2YXIgZ2VuZXJhbCA9IHJlcXVpcmUoJy4vZ2VuZXJhbC5qcycpO1xuXG4gIGZ1bmN0aW9uIHJhbmRvbUFwaG9yaXNtKCkge1xuICAgIHZhciBhcGhvcmlzbXMgPSBbXG4gICAgICAnWWVzdGVyZGF5IFlvdSBTYWlkIFRvbW9ycm93JyxcbiAgICAgICdXaHkgYXJlIHdlIGhlcmU/JyxcbiAgICAgICdBbGwgaW4sIG9yIG5vdGhpbmcnLFxuICAgICAgJ1lvdSBOZXZlciBUcnksIFlvdSBOZXZlciBLbm93JyxcbiAgICAgICdUaGUgdW5leGFtaW5lZCBsaWZlIGlzIG5vdCB3b3J0aCBsaXZpbmcuIC0tIFNvY3JhdGVzJ1xuICAgIF07XG4gICAgdmFyIHJhbmRvbUluZGV4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXBob3Jpc21zLmxlbmd0aCk7XG4gICAgdmFyIHRleHQgPSBhcGhvcmlzbXNbcmFuZG9tSW5kZXhdO1xuXG4gICAgZ2VuZXJhbC5zZW50ZW5jZUdlbmVyYXRvcih0ZXh0KTtcbiAgfVxuXG4gIC8qIGludGVyZmFjZSAqL1xuICByZXR1cm4ge1xuICAgIGluaXQ6IGdlbmVyYWwuaW5pdCxcbiAgICBhbGw6IGdlbmVyYWwuYWxsLmJpbmQobnVsbCwgcmFuZG9tQXBob3Jpc20pLFxuICAgIHBhcnQ6IGdlbmVyYWwucGFydC5iaW5kKG51bGwsIHJhbmRvbUFwaG9yaXNtKSxcbiAgICBjbGVhcjogZ2VuZXJhbC5jbGVhcixcbiAgICByYW5kb206IHJhbmRvbUFwaG9yaXNtXG4gIH07XG59KCkpO1xuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiBkYlN1Y2Nlc3NHZW5lcmF0b3IoKSB7XG4gIHZhciBnZW5lcmFsID0gcmVxdWlyZSgnLi9nZW5lcmFsLmpzJyk7XG4gIHZhciBEQiA9IHJlcXVpcmUoJ2luZGV4ZWRkYi1jcnVkJyk7XG4gIHZhciBhcGhvcmlzbUNvbmZpZyA9IHJlcXVpcmUoJy4uLy4uL2RiL2FwaG9yaXNtQ29uZmlnLmpzJyk7XG5cbiAgREIub3BlbihhcGhvcmlzbUNvbmZpZywgX29wZW5TdWNjZXNzKTtcblxuICBmdW5jdGlvbiBfb3BlblN1Y2Nlc3MoKSB7XG4gICAgY29uc29sZS5sb2coJ29wZW4gYXBob3Jpc20gc3VjY2VzcycpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmFuZG9tQXBob3Jpc20oKSB7XG4gICAgdmFyIHJhbmRvbUluZGV4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogREIuZ2V0TmV3S2V5KCkpO1xuXG4gICAgREIuZ2V0SXRlbShyYW5kb21JbmRleCwgZ2VuZXJhbC5zZW50ZW5jZUdlbmVyYXRvcik7XG4gIH1cblxuICAvKiBpbnRlcmZhY2UgKi9cbiAgcmV0dXJuIHtcbiAgICBpbml0OiBnZW5lcmFsLmluaXQsXG4gICAgYWxsOiBnZW5lcmFsLmFsbC5iaW5kKG51bGwsIHJhbmRvbUFwaG9yaXNtKSxcbiAgICBwYXJ0OiBnZW5lcmFsLnBhcnQuYmluZChudWxsLCByYW5kb21BcGhvcmlzbSksXG4gICAgY2xlYXI6IGdlbmVyYWwuY2xlYXIsXG4gICAgcmFuZG9tOiByYW5kb21BcGhvcmlzbVxuICB9O1xufSgpKTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGdlbmVyYWwgPSAoZnVuY3Rpb24gZ2VuZXJhbEdlbmVyYXRvcigpIHtcbiAgdmFyIGNyZWF0ZUxpID0gcmVxdWlyZSgnLi4vY3JlYXRlTGkuanMnKTtcblxuICBmdW5jdGlvbiBpbml0KGRhdGFBcnIpIHtcbiAgICBfc2hvdyhfaW5pdFNlbnRlbmNlLCBkYXRhQXJyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFsbChyYW5kb21BcGhvcmlzbSwgZGF0YUFycikge1xuICAgIGNvbnNvbGUuZGlyKHJhbmRvbUFwaG9yaXNtKTtcbiAgICBfc2hvdyhyYW5kb21BcGhvcmlzbSwgZGF0YUFycik7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJ0KHJhbmRvbUFwaG9yaXNtLCBkYXRhQXJyKSB7XG4gICAgdmFyIG5vZGVzO1xuXG4gICAgaWYgKCFkYXRhQXJyIHx8IGRhdGFBcnIubGVuZ3RoID09PSAwKSB7XG4gICAgICByYW5kb21BcGhvcmlzbSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBub2RlcyA9IGRhdGFBcnIucmVkdWNlKGZ1bmN0aW9uIG5vZGVHZW5lcmF0b3IocmVzdWx0LCBkYXRhKSB7XG4gICAgICAgIHJlc3VsdC5pbnNlcnRCZWZvcmUoY3JlYXRlTGkoZGF0YSksIHJlc3VsdC5maXJzdENoaWxkKTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSwgZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpKTsgLy8gUFVOQ0hMSU5FOiBicmlsbGlhbnQgYXJyLnJlZHVjZSgpICsgZG9jdW1lbnRGcmFnbWVudFxuXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmFwcGVuZENoaWxkKG5vZGVzKTsgLy8gYWRkIGl0IHRvIERPTVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIHZhciByb290ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcblxuICAgIHdoaWxlIChyb290Lmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgcm9vdC5yZW1vdmVDaGlsZChyb290LmZpcnN0Q2hpbGQpOyAvLyB0aGUgYmVzdCB3YXkgdG8gY2xlYW4gY2hpbGROb2Rlc1xuICAgIH1cbiAgfVxuXG5cbiAgLyogcHJpdmF0ZSBtZXRob2RzICovXG5cbiAgZnVuY3Rpb24gX3Nob3coc2VudGVuY2VGdW5jLCBkYXRhQXJyKSB7XG4gICAgaWYgKCFkYXRhQXJyIHx8IGRhdGFBcnIubGVuZ3RoID09PSAwKSB7XG4gICAgICBzZW50ZW5jZUZ1bmMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgX3Nob3dSZWZyZXNoKGRhdGFBcnIpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9zaG93UmVmcmVzaChkYXRhQXJyKSB7XG4gICAgdmFyIHJlc3VsdCA9IF9jbGFzc2lmeURhdGEoZGF0YUFycik7XG5cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmFwcGVuZENoaWxkKHJlc3VsdCk7IC8vIGFkZCBpdCB0byBET01cbiAgfVxuXG4gIGZ1bmN0aW9uIF9jbGFzc2lmeURhdGEoZGF0YUFycikge1xuICAgIC8vIHVzZSBmcmFnbWVudCB0byByZWR1Y2UgRE9NIG9wZXJhdGVcbiAgICB2YXIgdW5maXNoaWVkID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIHZhciBmaW5pc2hlZCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB2YXIgZnVzaW9uID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgLy8gcHV0IHRoZSBmaW5pc2hlZCBpdGVtIHRvIHRoZSBib3R0b21cbiAgICBkYXRhQXJyLmZvckVhY2goZnVuY3Rpb24gY2xhc3NpZnkoZGF0YSkge1xuICAgICAgaWYgKGRhdGEuZmluaXNoZWQpIHtcbiAgICAgICAgZmluaXNoZWQuaW5zZXJ0QmVmb3JlKGNyZWF0ZUxpKGRhdGEpLCBmaW5pc2hlZC5maXJzdENoaWxkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVuZmlzaGllZC5pbnNlcnRCZWZvcmUoY3JlYXRlTGkoZGF0YSksIHVuZmlzaGllZC5maXJzdENoaWxkKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBmdXNpb24uYXBwZW5kQ2hpbGQodW5maXNoaWVkKTtcbiAgICBmdXNpb24uYXBwZW5kQ2hpbGQoZmluaXNoZWQpO1xuXG4gICAgcmV0dXJuIGZ1c2lvbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9pbml0U2VudGVuY2UoKSB7XG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnV2VsY29tZX4sIHRyeSB0byBhZGQgeW91ciBmaXJzdCB0by1kbyBsaXN0IDogKScpO1xuXG4gICAgc2VudGVuY2VHZW5lcmF0b3IodGV4dCk7XG4gIH1cblxuICBmdW5jdGlvbiBzZW50ZW5jZUdlbmVyYXRvcih0ZXh0KSB7XG4gICAgdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICB2YXIgdGV4dE5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0ZXh0KTtcblxuICAgIGxpLmFwcGVuZENoaWxkKHRleHROb2RlKTtcbiAgICBsaS5jbGFzc05hbWUgPSAnYXBob3Jpc20nO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuYXBwZW5kQ2hpbGQobGkpO1xuICB9XG5cblxuICAvKiBpbnRlcmZhY2UgKi9cbiAgcmV0dXJuIHtcbiAgICBpbml0OiBpbml0LFxuICAgIGFsbDogYWxsLFxuICAgIHBhcnQ6IHBhcnQsXG4gICAgY2xlYXI6IGNsZWFyLFxuICAgIHNlbnRlbmNlR2VuZXJhdG9yOiBzZW50ZW5jZUdlbmVyYXRvclxuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBnZW5lcmFsO1xuIl19
