(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
var IndexedDBHandler = function IndexedDBHandler(config, openSuccessCallback, openFailCallback) {
  var _that;

  /* init indexedDB */
  // firstly inspect browser's support for indexedDB
  if (!window.indexedDB) {
    window.alert('Your browser doesn\'t support a stable version of IndexedDB. We will offer you the without indexedDB mode');
    if (openFailCallback) {
      openFailCallback(); // PUNCHLINE: offer without-DB handler
    }
    return 0;
  }
  _that = this;
  /* private propeties */
  _that._db;
  _that._presentKey = 0;
  _that._key = config.key;
  _that._storeName = config.storeName;
  _openHandler();

  function _openHandler() {
    var openRequest = window.indexedDB.open(config.name, config.version); // open indexedDB

    // an onblocked event is fired until they are closed or reloaded
    openRequest.onblocked = function blockedSchemeUp() {
    // If some other tab is loaded with the database, then it needs to be closed before we can proceed.
      window.alert('Please close all other tabs with this site open');
    };

    // Creating or updating the version of the database
    openRequest.onupgradeneeded = function schemaUp(e) {
    // All other databases have been closed. Set everything up.
      _that._db = e.target.result;
      console.log('onupgradeneeded in');
      if (!(_that._db.objectStoreNames.contains(_that._storeName))) {
        _createStoreHandler();
      }
    };

    openRequest.onsuccess = function openSuccess(e) {
      _that._db = e.target.result;
      console.log('\u2713 open storeName = ' + _that._storeName + ' indexedDB objectStore success');
      _getPresentKey();
    };

    openRequest.onerror = function openError(e) {
    // window.alert('Pity, fail to load indexedDB. We will offer you the without indexedDB mode');
      window.alert('Something is wrong with indexedDB, for more information, checkout console');
      console.log(e.target.error);
    };
  }

  // set present key value to _that._presentKey (the private property)
  function _getPresentKey() {
    _getAllRequest().onsuccess = function getAllSuccess(e) {
      var cursor = e.target.result;

      if (cursor) {
        _that._presentKey = cursor.value.id;
        cursor.continue();
      } else {
        console.log('\u2713 now objectSotre = ' + _that._storeName + ' \'s key = ' +  _that._presentKey); // initial value is 0
        if (openSuccessCallback) {
          openSuccessCallback();
          console.log('\u2713 openSuccessCallback finished');
        }
      }
    };
  }

  function _createStoreHandler() {
    var objectStore = _that._db.createObjectStore(_that._storeName, { keyPath: _that._key, autoIncrement: true });

    // Use transaction oncomplete to make sure the objectStore creation is
    objectStore.transaction.oncomplete = function addinitialData() {
      var addRequest;

      console.log('create ' + _that._storeName + '\'s objectStore succeed');
      if (config.initialData) {
        addRequest = function addRequestGenerator(data) {
          _transactionGenerator().add(data);
        };
        // Store initial values in the newly created objectStore.
        try {
          JSON.parse(JSON.stringify(config.initialData)).forEach(function addEveryInitialData(data, index) {
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

  function _transactionGenerator() {
    return _that._db.transaction([_that._storeName], 'readwrite').objectStore(_that._storeName);
  }

  function _getAllRequest() {
    return _transactionGenerator().openCursor(IDBKeyRange.lowerBound(1), 'next');
  }
};

IndexedDBHandler.prototype = (function prototypeGenerator() {
  function _whetherWriteTransaction(whetherWrite) {
    var transaction;
    console.dir(this);
    if (whetherWrite) {
      transaction = this._db.transaction([this._storeName], 'readwrite');
    } else {
      transaction = this._db.transaction([this._storeName]);
    }

    return transaction.objectStore(this._storeName);
  }

  function _getAllRequest() {
    return _whetherWriteTransaction(true).openCursor(IDBKeyRange.lowerBound(1), 'next');
  }

  function getLength() {
    return this._presentKey;
  }

  function getNewKey() {
    this._presentKey += 1;

    return this._presentKey;
  }

  /* CRUD */

  function addItem(newData, successCallback) {
    var addRequest = _whetherWriteTransaction(true).add(newData);

    addRequest.onsuccess = function addSuccess() {
      console.log('\u2713 add ' + this._key + ' = ' + newData[this._key] + ' data succeed :)');
      if (successCallback) {
        successCallback(newData);
      }
    };
  }

  function getItem(key, successCallback) {
    var getRequest = _whetherWriteTransaction(false).get(parseInt(key, 10));  // get it by index

    getRequest.onsuccess = function getSuccess() {
      console.log('\u2713 get '  + this._key + ' = ' + key + ' data success :)');
      if (successCallback) {
        successCallback(getRequest.result);
      }
    };
  }

  // get conditional data (boolean condition)
  function getConditionItem(condition, whether, successCallback) {
    var result = []; // use an array to storage eligible data

    _getAllRequest().onsuccess = function getAllSuccess(e) {
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

    _getAllRequest().onsuccess = function getAllSuccess(e) {
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

  function removeItem(key, successCallback) {
    var deleteRequest = _whetherWriteTransaction(true).delete(key);

    deleteRequest.onsuccess = function deleteSuccess() {
      console.log('\u2713 remove ' + this._key + ' = ' + key + ' data success :)');
      if (successCallback) {
        successCallback(key);
      }
    };
  }

  function removeConditionItem(condition, whether, successCallback) {
    _getAllRequest().onsuccess = function getAllSuccess(e) {
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
      } else if (successCallback) {
        successCallback();
      }
    };
  }

  function clear(successCallback) {
    _getAllRequest().onsuccess = function getAllSuccess(e) {
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

  // update one
  function updateItem(newData, successCallback) {
    var putRequest = _whetherWriteTransaction(true).put(newData);

    putRequest.onsuccess = function putSuccess() {
      console.log('\u2713 update ' + this._key + ' = ' + newData[this._key] + ' data success :)');
      if (successCallback) {
        successCallback(newData);
      }
    };
  }

  return {
    constructor: IndexedDBHandler,
    /* public interface */
    getLength: getLength,
    getNewKey: getNewKey,
    getItem: getItem,
    getConditionItem: getConditionItem,
    getAll: getAll,
    addItem: addItem,
    removeItem: removeItem,
    removeConditionItem: removeConditionItem,
    clear: clear,
    updateItem: updateItem
  };
}());


module.exports = IndexedDBHandler;


},{}],2:[function(require,module,exports){
'use strict';
module.exports = {
  name: 'JustToDo',
  version: '18',
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
  version: '17',
  key: 'id',
  storeName: 'list',
  initialData: [
    { id: 0, event: 'JustDemo', finished: true, date: 0 }
  ]
};

},{}],4:[function(require,module,exports){
'use strict';
module.exports = (function init() {
  var DB = require('indexeddb-crud');
  var listDBConfig = require('./db/listConfig.js');
  var aphorismConfig = require('./db/aphorismConfig.js');
  var addEvents = require('./utlis/addEvents.js');
  // open DB, and when DB open succeed, invoke initial function
  var aphorismDBHandler = new DB(aphorismConfig, a);
  var listDBHandler = new DB(listDBConfig, addEvents.dbSuccess, addEvents.dbFail);

  function a() {
    console.log('yep');
  }
  return {
    aphorismDBHandler,
    listDBHandler
  };
}());

},{"./db/aphorismConfig.js":2,"./db/listConfig.js":3,"./utlis/addEvents.js":5,"indexeddb-crud":1}],5:[function(require,module,exports){
'use strict';
module.exports = (function addEventsGenerator() {
  function _whetherSuccess(whetherSuccess) {
    function _whetherSuccessHandler(whether) {
      var list;
      var eventHandler = require('./eventHandler/eventHandler.js');
      var handler = whether ? eventHandler.dbSuccess : eventHandler.dbFail;

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

    return function addEvents() {
      _whetherSuccessHandler(whetherSuccess);
    };
  }

  return {
    dbSuccess: _whetherSuccess(true),
    dbFail: _whetherSuccess(false)
  };
}());

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

      _whetherAppear(element, true);
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
        element.classList.contains('finished') ? _whetherAppear(element, true) : _whetherAppear(element, false);
      } else {
        element.classList.contains('finished') ? _whetherAppear(element, false) : _whetherAppear(element, true);
      }
    });
    _removeRandom();
    general.ifEmpty.addRandom();
  }

  function _whetherAppear(element, whether) {
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
  var DB = require('../../main.js').listDBHandler;
  var refresh = require('../refresh/refresh.js').dbSuccess;
  var createLi = require('../createLi.js');
  var general = require('./general.js');

  function add() {
    var list;
    var newData;
    var newLi;
    var inputValue = document.querySelector('#input').value;

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

},{"../../main.js":4,"../createLi.js":6,"../refresh/refresh.js":14,"./general.js":10}],9:[function(require,module,exports){
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
  var DB = require('../../main.js').aphorismDBHandler;
  var general = require('./general.js');

  console.log('refresh sccess in');
  // open DB, and when DB open succeed, invoke initial function
  function randomAphorism() {
    var randomIndex = Math.floor(Math.random() * DB.getLength());

    console.dir(DB);
    console.log(DB.getLength());
    console.log(randomIndex);
    DB.getItem(randomIndex, general.sentenceGenerator);
  }

  /* interface */
  return {
    init: general.init,
    all: general.all.bind(null, randomAphorism),  // PUNCHLINE: use bind to pass paramter
    part: general.part.bind(null, randomAphorism),
    clear: general.clear,
    random: randomAphorism
  };
}());

},{"../../main.js":4,"./general.js":13}],13:[function(require,module,exports){
'use strict';
var general = (function generalGenerator() {
  var createLi = require('../createLi.js');

  function init(dataArr) {
    _show(_initSentence, dataArr);
  }

  function all(randomAphorism, dataArr) {
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
    var text = 'Welcome~, try to add your first to-do list : )';

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW5kZXhlZGRiLWNydWQvaW5kZXhlZGRiLWNydWQuanMiLCJzcmMvc2NyaXB0cy9kYi9hcGhvcmlzbUNvbmZpZy5qcyIsInNyYy9zY3JpcHRzL2RiL2xpc3RDb25maWcuanMiLCJzcmMvc2NyaXB0cy9tYWluLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvYWRkRXZlbnRzLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvY3JlYXRlTGkuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9ldmVudEhhbmRsZXIvZGJGYWlsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZXZlbnRIYW5kbGVyL2RiU3VjY2Vzcy5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2V2ZW50SGFuZGxlci9ldmVudEhhbmRsZXIuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9ldmVudEhhbmRsZXIvZ2VuZXJhbC5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL3JlZnJlc2gvZGJGYWlsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvcmVmcmVzaC9kYlN1Y2Nlc3MuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9yZWZyZXNoL2dlbmVyYWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcbnZhciBJbmRleGVkREJIYW5kbGVyID0gZnVuY3Rpb24gSW5kZXhlZERCSGFuZGxlcihjb25maWcsIG9wZW5TdWNjZXNzQ2FsbGJhY2ssIG9wZW5GYWlsQ2FsbGJhY2spIHtcbiAgdmFyIF90aGF0O1xuXG4gIC8qIGluaXQgaW5kZXhlZERCICovXG4gIC8vIGZpcnN0bHkgaW5zcGVjdCBicm93c2VyJ3Mgc3VwcG9ydCBmb3IgaW5kZXhlZERCXG4gIGlmICghd2luZG93LmluZGV4ZWREQikge1xuICAgIHdpbmRvdy5hbGVydCgnWW91ciBicm93c2VyIGRvZXNuXFwndCBzdXBwb3J0IGEgc3RhYmxlIHZlcnNpb24gb2YgSW5kZXhlZERCLiBXZSB3aWxsIG9mZmVyIHlvdSB0aGUgd2l0aG91dCBpbmRleGVkREIgbW9kZScpO1xuICAgIGlmIChvcGVuRmFpbENhbGxiYWNrKSB7XG4gICAgICBvcGVuRmFpbENhbGxiYWNrKCk7IC8vIFBVTkNITElORTogb2ZmZXIgd2l0aG91dC1EQiBoYW5kbGVyXG4gICAgfVxuICAgIHJldHVybiAwO1xuICB9XG4gIF90aGF0ID0gdGhpcztcbiAgLyogcHJpdmF0ZSBwcm9wZXRpZXMgKi9cbiAgX3RoYXQuX2RiO1xuICBfdGhhdC5fcHJlc2VudEtleSA9IDA7XG4gIF90aGF0Ll9rZXkgPSBjb25maWcua2V5O1xuICBfdGhhdC5fc3RvcmVOYW1lID0gY29uZmlnLnN0b3JlTmFtZTtcbiAgX29wZW5IYW5kbGVyKCk7XG5cbiAgZnVuY3Rpb24gX29wZW5IYW5kbGVyKCkge1xuICAgIHZhciBvcGVuUmVxdWVzdCA9IHdpbmRvdy5pbmRleGVkREIub3Blbihjb25maWcubmFtZSwgY29uZmlnLnZlcnNpb24pOyAvLyBvcGVuIGluZGV4ZWREQlxuXG4gICAgLy8gYW4gb25ibG9ja2VkIGV2ZW50IGlzIGZpcmVkIHVudGlsIHRoZXkgYXJlIGNsb3NlZCBvciByZWxvYWRlZFxuICAgIG9wZW5SZXF1ZXN0Lm9uYmxvY2tlZCA9IGZ1bmN0aW9uIGJsb2NrZWRTY2hlbWVVcCgpIHtcbiAgICAvLyBJZiBzb21lIG90aGVyIHRhYiBpcyBsb2FkZWQgd2l0aCB0aGUgZGF0YWJhc2UsIHRoZW4gaXQgbmVlZHMgdG8gYmUgY2xvc2VkIGJlZm9yZSB3ZSBjYW4gcHJvY2VlZC5cbiAgICAgIHdpbmRvdy5hbGVydCgnUGxlYXNlIGNsb3NlIGFsbCBvdGhlciB0YWJzIHdpdGggdGhpcyBzaXRlIG9wZW4nKTtcbiAgICB9O1xuXG4gICAgLy8gQ3JlYXRpbmcgb3IgdXBkYXRpbmcgdGhlIHZlcnNpb24gb2YgdGhlIGRhdGFiYXNlXG4gICAgb3BlblJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24gc2NoZW1hVXAoZSkge1xuICAgIC8vIEFsbCBvdGhlciBkYXRhYmFzZXMgaGF2ZSBiZWVuIGNsb3NlZC4gU2V0IGV2ZXJ5dGhpbmcgdXAuXG4gICAgICBfdGhhdC5fZGIgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICBjb25zb2xlLmxvZygnb251cGdyYWRlbmVlZGVkIGluJyk7XG4gICAgICBpZiAoIShfdGhhdC5fZGIub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucyhfdGhhdC5fc3RvcmVOYW1lKSkpIHtcbiAgICAgICAgX2NyZWF0ZVN0b3JlSGFuZGxlcigpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBvcGVuUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBvcGVuU3VjY2VzcyhlKSB7XG4gICAgICBfdGhhdC5fZGIgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBvcGVuIHN0b3JlTmFtZSA9ICcgKyBfdGhhdC5fc3RvcmVOYW1lICsgJyBpbmRleGVkREIgb2JqZWN0U3RvcmUgc3VjY2VzcycpO1xuICAgICAgX2dldFByZXNlbnRLZXkoKTtcbiAgICB9O1xuXG4gICAgb3BlblJlcXVlc3Qub25lcnJvciA9IGZ1bmN0aW9uIG9wZW5FcnJvcihlKSB7XG4gICAgLy8gd2luZG93LmFsZXJ0KCdQaXR5LCBmYWlsIHRvIGxvYWQgaW5kZXhlZERCLiBXZSB3aWxsIG9mZmVyIHlvdSB0aGUgd2l0aG91dCBpbmRleGVkREIgbW9kZScpO1xuICAgICAgd2luZG93LmFsZXJ0KCdTb21ldGhpbmcgaXMgd3Jvbmcgd2l0aCBpbmRleGVkREIsIGZvciBtb3JlIGluZm9ybWF0aW9uLCBjaGVja291dCBjb25zb2xlJyk7XG4gICAgICBjb25zb2xlLmxvZyhlLnRhcmdldC5lcnJvcik7XG4gICAgfTtcbiAgfVxuXG4gIC8vIHNldCBwcmVzZW50IGtleSB2YWx1ZSB0byBfdGhhdC5fcHJlc2VudEtleSAodGhlIHByaXZhdGUgcHJvcGVydHkpXG4gIGZ1bmN0aW9uIF9nZXRQcmVzZW50S2V5KCkge1xuICAgIF9nZXRBbGxSZXF1ZXN0KCkub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0QWxsU3VjY2VzcyhlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIF90aGF0Ll9wcmVzZW50S2V5ID0gY3Vyc29yLnZhbHVlLmlkO1xuICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIG5vdyBvYmplY3RTb3RyZSA9ICcgKyBfdGhhdC5fc3RvcmVOYW1lICsgJyBcXCdzIGtleSA9ICcgKyAgX3RoYXQuX3ByZXNlbnRLZXkpOyAvLyBpbml0aWFsIHZhbHVlIGlzIDBcbiAgICAgICAgaWYgKG9wZW5TdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICBvcGVuU3VjY2Vzc0NhbGxiYWNrKCk7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgb3BlblN1Y2Nlc3NDYWxsYmFjayBmaW5pc2hlZCcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9jcmVhdGVTdG9yZUhhbmRsZXIoKSB7XG4gICAgdmFyIG9iamVjdFN0b3JlID0gX3RoYXQuX2RiLmNyZWF0ZU9iamVjdFN0b3JlKF90aGF0Ll9zdG9yZU5hbWUsIHsga2V5UGF0aDogX3RoYXQuX2tleSwgYXV0b0luY3JlbWVudDogdHJ1ZSB9KTtcblxuICAgIC8vIFVzZSB0cmFuc2FjdGlvbiBvbmNvbXBsZXRlIHRvIG1ha2Ugc3VyZSB0aGUgb2JqZWN0U3RvcmUgY3JlYXRpb24gaXNcbiAgICBvYmplY3RTdG9yZS50cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gYWRkaW5pdGlhbERhdGEoKSB7XG4gICAgICB2YXIgYWRkUmVxdWVzdDtcblxuICAgICAgY29uc29sZS5sb2coJ2NyZWF0ZSAnICsgX3RoYXQuX3N0b3JlTmFtZSArICdcXCdzIG9iamVjdFN0b3JlIHN1Y2NlZWQnKTtcbiAgICAgIGlmIChjb25maWcuaW5pdGlhbERhdGEpIHtcbiAgICAgICAgYWRkUmVxdWVzdCA9IGZ1bmN0aW9uIGFkZFJlcXVlc3RHZW5lcmF0b3IoZGF0YSkge1xuICAgICAgICAgIF90cmFuc2FjdGlvbkdlbmVyYXRvcigpLmFkZChkYXRhKTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gU3RvcmUgaW5pdGlhbCB2YWx1ZXMgaW4gdGhlIG5ld2x5IGNyZWF0ZWQgb2JqZWN0U3RvcmUuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShjb25maWcuaW5pdGlhbERhdGEpKS5mb3JFYWNoKGZ1bmN0aW9uIGFkZEV2ZXJ5SW5pdGlhbERhdGEoZGF0YSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGFkZFJlcXVlc3QoZGF0YSkuc3VjY2VzcyA9IGZ1bmN0aW9uIGFkZEluaXRpYWxTdWNjZXNzKCkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnYWRkIGluaXRpYWwgZGF0YVsnICsgaW5kZXggKyAnXSBzdWNjZXNzZWQnKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgd2luZG93LmFsZXJ0KCdwbGVhc2Ugc2V0IGNvcnJlY3QgaW5pdGlhbCBhcnJheSBvYmplY3QgZGF0YSA6KScpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBfdHJhbnNhY3Rpb25HZW5lcmF0b3IoKSB7XG4gICAgcmV0dXJuIF90aGF0Ll9kYi50cmFuc2FjdGlvbihbX3RoYXQuX3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKS5vYmplY3RTdG9yZShfdGhhdC5fc3RvcmVOYW1lKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9nZXRBbGxSZXF1ZXN0KCkge1xuICAgIHJldHVybiBfdHJhbnNhY3Rpb25HZW5lcmF0b3IoKS5vcGVuQ3Vyc29yKElEQktleVJhbmdlLmxvd2VyQm91bmQoMSksICduZXh0Jyk7XG4gIH1cbn07XG5cbkluZGV4ZWREQkhhbmRsZXIucHJvdG90eXBlID0gKGZ1bmN0aW9uIHByb3RvdHlwZUdlbmVyYXRvcigpIHtcbiAgZnVuY3Rpb24gX3doZXRoZXJXcml0ZVRyYW5zYWN0aW9uKHdoZXRoZXJXcml0ZSkge1xuICAgIHZhciB0cmFuc2FjdGlvbjtcbiAgICBjb25zb2xlLmRpcih0aGlzKTtcbiAgICBpZiAod2hldGhlcldyaXRlKSB7XG4gICAgICB0cmFuc2FjdGlvbiA9IHRoaXMuX2RiLnRyYW5zYWN0aW9uKFt0aGlzLl9zdG9yZU5hbWVdLCAncmVhZHdyaXRlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRyYW5zYWN0aW9uID0gdGhpcy5fZGIudHJhbnNhY3Rpb24oW3RoaXMuX3N0b3JlTmFtZV0pO1xuICAgIH1cblxuICAgIHJldHVybiB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZSh0aGlzLl9zdG9yZU5hbWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gX2dldEFsbFJlcXVlc3QoKSB7XG4gICAgcmV0dXJuIF93aGV0aGVyV3JpdGVUcmFuc2FjdGlvbih0cnVlKS5vcGVuQ3Vyc29yKElEQktleVJhbmdlLmxvd2VyQm91bmQoMSksICduZXh0Jyk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRMZW5ndGgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ByZXNlbnRLZXk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXROZXdLZXkoKSB7XG4gICAgdGhpcy5fcHJlc2VudEtleSArPSAxO1xuXG4gICAgcmV0dXJuIHRoaXMuX3ByZXNlbnRLZXk7XG4gIH1cblxuICAvKiBDUlVEICovXG5cbiAgZnVuY3Rpb24gYWRkSXRlbShuZXdEYXRhLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICB2YXIgYWRkUmVxdWVzdCA9IF93aGV0aGVyV3JpdGVUcmFuc2FjdGlvbih0cnVlKS5hZGQobmV3RGF0YSk7XG5cbiAgICBhZGRSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGFkZFN1Y2Nlc3MoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBhZGQgJyArIHRoaXMuX2tleSArICcgPSAnICsgbmV3RGF0YVt0aGlzLl9rZXldICsgJyBkYXRhIHN1Y2NlZWQgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKG5ld0RhdGEpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBnZXRJdGVtKGtleSwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIGdldFJlcXVlc3QgPSBfd2hldGhlcldyaXRlVHJhbnNhY3Rpb24oZmFsc2UpLmdldChwYXJzZUludChrZXksIDEwKSk7ICAvLyBnZXQgaXQgYnkgaW5kZXhcblxuICAgIGdldFJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0U3VjY2VzcygpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcXHUyNzEzIGdldCAnICArIHRoaXMuX2tleSArICcgPSAnICsga2V5ICsgJyBkYXRhIHN1Y2Nlc3MgOiknKTtcbiAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKGdldFJlcXVlc3QucmVzdWx0KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLy8gZ2V0IGNvbmRpdGlvbmFsIGRhdGEgKGJvb2xlYW4gY29uZGl0aW9uKVxuICBmdW5jdGlvbiBnZXRDb25kaXRpb25JdGVtKGNvbmRpdGlvbiwgd2hldGhlciwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHJlc3VsdCA9IFtdOyAvLyB1c2UgYW4gYXJyYXkgdG8gc3RvcmFnZSBlbGlnaWJsZSBkYXRhXG5cbiAgICBfZ2V0QWxsUmVxdWVzdCgpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIGdldEFsbFN1Y2Nlc3MoZSkge1xuICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICBpZiAod2hldGhlcikge1xuICAgICAgICAgIGlmIChjdXJzb3IudmFsdWVbY29uZGl0aW9uXSkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goY3Vyc29yLnZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIXdoZXRoZXIpIHtcbiAgICAgICAgICBpZiAoIWN1cnNvci52YWx1ZVtjb25kaXRpb25dKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChjdXJzb3IudmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgIH0gZWxzZSBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXN1bHQpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBnZXRBbGwoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgX2dldEFsbFJlcXVlc3QoKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRBbGxTdWNjZXNzKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goY3Vyc29yLnZhbHVlKTtcbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBnZXQgYWxsIGRhdGEgc3VjY2VzcyA6KScpO1xuICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlSXRlbShrZXksIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIHZhciBkZWxldGVSZXF1ZXN0ID0gX3doZXRoZXJXcml0ZVRyYW5zYWN0aW9uKHRydWUpLmRlbGV0ZShrZXkpO1xuXG4gICAgZGVsZXRlUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBkZWxldGVTdWNjZXNzKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgcmVtb3ZlICcgKyB0aGlzLl9rZXkgKyAnID0gJyArIGtleSArICcgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhrZXkpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmVDb25kaXRpb25JdGVtKGNvbmRpdGlvbiwgd2hldGhlciwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgX2dldEFsbFJlcXVlc3QoKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBnZXRBbGxTdWNjZXNzKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgaWYgKHdoZXRoZXIpIHtcbiAgICAgICAgICBpZiAoY3Vyc29yLnZhbHVlW2NvbmRpdGlvbl0pIHtcbiAgICAgICAgICAgIGN1cnNvci5kZWxldGUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIXdoZXRoZXIpIHtcbiAgICAgICAgICBpZiAoIWN1cnNvci52YWx1ZVtjb25kaXRpb25dKSB7XG4gICAgICAgICAgICBjdXJzb3IuZGVsZXRlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfSBlbHNlIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgIF9nZXRBbGxSZXF1ZXN0KCkub25zdWNjZXNzID0gZnVuY3Rpb24gZ2V0QWxsU3VjY2VzcyhlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuXG4gICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgIGN1cnNvci5kZWxldGUoKTtcbiAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygnXFx1MjcxMyBjbGVhciBhbGwgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soJ2NsZWFyIGFsbCBkYXRhIHN1Y2Nlc3MnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyB1cGRhdGUgb25lXG4gIGZ1bmN0aW9uIHVwZGF0ZUl0ZW0obmV3RGF0YSwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHB1dFJlcXVlc3QgPSBfd2hldGhlcldyaXRlVHJhbnNhY3Rpb24odHJ1ZSkucHV0KG5ld0RhdGEpO1xuXG4gICAgcHV0UmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiBwdXRTdWNjZXNzKCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcdTI3MTMgdXBkYXRlICcgKyB0aGlzLl9rZXkgKyAnID0gJyArIG5ld0RhdGFbdGhpcy5fa2V5XSArICcgZGF0YSBzdWNjZXNzIDopJyk7XG4gICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhuZXdEYXRhKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBjb25zdHJ1Y3RvcjogSW5kZXhlZERCSGFuZGxlcixcbiAgICAvKiBwdWJsaWMgaW50ZXJmYWNlICovXG4gICAgZ2V0TGVuZ3RoOiBnZXRMZW5ndGgsXG4gICAgZ2V0TmV3S2V5OiBnZXROZXdLZXksXG4gICAgZ2V0SXRlbTogZ2V0SXRlbSxcbiAgICBnZXRDb25kaXRpb25JdGVtOiBnZXRDb25kaXRpb25JdGVtLFxuICAgIGdldEFsbDogZ2V0QWxsLFxuICAgIGFkZEl0ZW06IGFkZEl0ZW0sXG4gICAgcmVtb3ZlSXRlbTogcmVtb3ZlSXRlbSxcbiAgICByZW1vdmVDb25kaXRpb25JdGVtOiByZW1vdmVDb25kaXRpb25JdGVtLFxuICAgIGNsZWFyOiBjbGVhcixcbiAgICB1cGRhdGVJdGVtOiB1cGRhdGVJdGVtXG4gIH07XG59KCkpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gSW5kZXhlZERCSGFuZGxlcjtcblxuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG5hbWU6ICdKdXN0VG9EbycsXG4gIHZlcnNpb246ICcxOCcsXG4gIGtleTogJ2lkJyxcbiAgc3RvcmVOYW1lOiAnYXBob3Jpc20nLFxuICBpbml0aWFsRGF0YTogW1xuICAgIHtcbiAgICAgIFwiaWRcIjogMSxcbiAgICAgIFwiY29udGVudFwiOiBcIldlbGNvbWV+LCB0cnkgdG8gYWRkIHlvdXIgZmlyc3QgdG8tZG8gbGlzdCA6IClcIlxuICAgIH0sXG4gICAge1xuICAgICAgXCJpZFwiOiAyLFxuICAgICAgXCJjb250ZW50XCI6IFwiWWVzdGVyZGF5IFlvdSBTYWlkIFRvbW9ycm93XCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwiaWRcIjogMyxcbiAgICAgIFwiY29udGVudFwiOiBcIldoeSBhcmUgd2UgaGVyZT9cIlxuICAgIH0sXG4gICAge1xuICAgICAgXCJpZFwiOiA0LFxuICAgICAgXCJjb250ZW50XCI6IFwiQWxsIGluLCBvciBub3RoaW5nXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwiaWRcIjogNSxcbiAgICAgIFwiY29udGVudFwiOiBcIllvdSBOZXZlciBUcnksIFlvdSBOZXZlciBLbm93XCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwiaWRcIjogNixcbiAgICAgIFwiY29udGVudFwiOiBcIlRoZSB1bmV4YW1pbmVkIGxpZmUgaXMgbm90IHdvcnRoIGxpdmluZy4gLS0gU29jcmF0ZXNcIlxuICAgIH1cbiAgXVxufTtcbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0ge1xuICBuYW1lOiAnSnVzdFRvRG8nLFxuICB2ZXJzaW9uOiAnMTcnLFxuICBrZXk6ICdpZCcsXG4gIHN0b3JlTmFtZTogJ2xpc3QnLFxuICBpbml0aWFsRGF0YTogW1xuICAgIHsgaWQ6IDAsIGV2ZW50OiAnSnVzdERlbW8nLCBmaW5pc2hlZDogdHJ1ZSwgZGF0ZTogMCB9XG4gIF1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiBpbml0KCkge1xuICB2YXIgREIgPSByZXF1aXJlKCdpbmRleGVkZGItY3J1ZCcpO1xuICB2YXIgbGlzdERCQ29uZmlnID0gcmVxdWlyZSgnLi9kYi9saXN0Q29uZmlnLmpzJyk7XG4gIHZhciBhcGhvcmlzbUNvbmZpZyA9IHJlcXVpcmUoJy4vZGIvYXBob3Jpc21Db25maWcuanMnKTtcbiAgdmFyIGFkZEV2ZW50cyA9IHJlcXVpcmUoJy4vdXRsaXMvYWRkRXZlbnRzLmpzJyk7XG4gIC8vIG9wZW4gREIsIGFuZCB3aGVuIERCIG9wZW4gc3VjY2VlZCwgaW52b2tlIGluaXRpYWwgZnVuY3Rpb25cbiAgdmFyIGFwaG9yaXNtREJIYW5kbGVyID0gbmV3IERCKGFwaG9yaXNtQ29uZmlnLCBhKTtcbiAgdmFyIGxpc3REQkhhbmRsZXIgPSBuZXcgREIobGlzdERCQ29uZmlnLCBhZGRFdmVudHMuZGJTdWNjZXNzLCBhZGRFdmVudHMuZGJGYWlsKTtcblxuICBmdW5jdGlvbiBhKCkge1xuICAgIGNvbnNvbGUubG9nKCd5ZXAnKTtcbiAgfVxuICByZXR1cm4ge1xuICAgIGFwaG9yaXNtREJIYW5kbGVyLFxuICAgIGxpc3REQkhhbmRsZXJcbiAgfTtcbn0oKSk7XG4iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiBhZGRFdmVudHNHZW5lcmF0b3IoKSB7XG4gIGZ1bmN0aW9uIF93aGV0aGVyU3VjY2Vzcyh3aGV0aGVyU3VjY2Vzcykge1xuICAgIGZ1bmN0aW9uIF93aGV0aGVyU3VjY2Vzc0hhbmRsZXIod2hldGhlcikge1xuICAgICAgdmFyIGxpc3Q7XG4gICAgICB2YXIgZXZlbnRIYW5kbGVyID0gcmVxdWlyZSgnLi9ldmVudEhhbmRsZXIvZXZlbnRIYW5kbGVyLmpzJyk7XG4gICAgICB2YXIgaGFuZGxlciA9IHdoZXRoZXIgPyBldmVudEhhbmRsZXIuZGJTdWNjZXNzIDogZXZlbnRIYW5kbGVyLmRiRmFpbDtcblxuICAgICAgaGFuZGxlci5zaG93SW5pdCgpO1xuICAgICAgLy8gYWRkIGFsbCBldmVudExpc3RlbmVyXG4gICAgICBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgICAgIGxpc3QuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLmNsaWNrTGksIGZhbHNlKTtcbiAgICAgIGxpc3QuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnJlbW92ZUxpLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlci5lbnRlckFkZCwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FkZCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5hZGQsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93RG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93RG9uZSwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dUb2RvJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dUb2RvLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0FsbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93QWxsLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0NsZWFyJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dDbGVhciwgZmFsc2UpO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBhZGRFdmVudHMoKSB7XG4gICAgICBfd2hldGhlclN1Y2Nlc3NIYW5kbGVyKHdoZXRoZXJTdWNjZXNzKTtcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBkYlN1Y2Nlc3M6IF93aGV0aGVyU3VjY2Vzcyh0cnVlKSxcbiAgICBkYkZhaWw6IF93aGV0aGVyU3VjY2VzcyhmYWxzZSlcbiAgfTtcbn0oKSk7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgY3JlYXRlTGkgPSAoZnVuY3Rpb24gbGlHZW5lcmF0b3IoKSB7XG4gIGZ1bmN0aW9uIF9kZWNvcmF0ZUxpKGxpLCBkYXRhKSB7XG4gICAgdmFyIHRleHREYXRlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YS5kYXRlICsgJzogJyk7XG4gICAgdmFyIHRleHRXcmFwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJyAnICsgZGF0YS5ldmVudCk7XG5cbiAgICAvLyB3cmFwIGFzIGEgbm9kZVxuICAgIHRleHRXcmFwLmFwcGVuZENoaWxkKHRleHQpO1xuICAgIGxpLmFwcGVuZENoaWxkKHRleHREYXRlKTtcbiAgICBsaS5hcHBlbmRDaGlsZCh0ZXh0V3JhcCk7XG4gICAgaWYgKGRhdGEuZmluaXNoZWQpIHsgIC8vIGFkZCBjc3Mtc3R5bGUgdG8gaXQgKGFjY29yZGluZyB0byBpdCdzIGRhdGEuZmluaXNoZWQgdmFsdWUpXG4gICAgICBsaS5jbGFzc0xpc3QuYWRkKCdmaW5pc2hlZCcpOyAvLyBhZGQgc3R5bGVcbiAgICB9XG4gICAgX2FkZFgobGkpOyAvLyBhZGQgc3BhbiBbeF0gdG8gbGkncyB0YWlsXG4gICAgX3NldERhdGFQcm9wZXJ0eShsaSwgJ2RhdGEtaWQnLCBkYXRhLmlkKTsgLy8gYWRkIHByb3BlcnR5IHRvIGxpIChkYXRhLWlkKe+8jGZvciAgY2xpY2tMaVxuICB9XG5cbiAgZnVuY3Rpb24gX2FkZFgobGkpIHtcbiAgICB2YXIgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICB2YXIgeCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCdcXHUwMEQ3Jyk7IC8vIHVuaWNvZGUgLT4geFxuXG4gICAgc3Bhbi5hcHBlbmRDaGlsZCh4KTtcbiAgICBzcGFuLmNsYXNzTmFtZSA9ICdjbG9zZSc7IC8vIGFkZCBzdHlsZVxuICAgIGxpLmFwcGVuZENoaWxkKHNwYW4pO1xuICB9XG5cbiAgZnVuY3Rpb24gX3NldERhdGFQcm9wZXJ0eSh0YXJnZXQsIG5hbWUsIGRhdGEpIHtcbiAgICB0YXJnZXQuc2V0QXR0cmlidXRlKG5hbWUsIGRhdGEpO1xuICB9XG5cblxuICByZXR1cm4gZnVuY3Rpb24gY3JlYXRlKGRhdGEpIHtcbiAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuXG4gICAgX2RlY29yYXRlTGkobGksIGRhdGEpOyAvLyBkZWNvcmF0ZSBsaVxuXG4gICAgcmV0dXJuIGxpO1xuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVMaTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBkYkZhaWwgPSAoZnVuY3Rpb24gZGJGYWlsR2VuZXJhdG9yKCkge1xuICB2YXIgcmVmcmVzaCA9IHJlcXVpcmUoJy4uL3JlZnJlc2gvcmVmcmVzaC5qcycpLmRiRmFpbDtcbiAgdmFyIGNyZWF0ZUxpID0gcmVxdWlyZSgnLi4vY3JlYXRlTGkuanMnKTtcbiAgdmFyIGdlbmVyYWwgPSByZXF1aXJlKCcuL2dlbmVyYWwuanMnKTtcbiAgdmFyIF9pZCA9IDA7IC8vIHNvIHRoZSBmaXJzdCBpdGVtJ3MgaWQgaXMgMVxuXG4gIGZ1bmN0aW9uIGFkZCgpIHtcbiAgICB2YXIgaW5wdXRWYWx1ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNpbnB1dCcpLnZhbHVlO1xuICAgIHZhciBsaXN0O1xuICAgIHZhciBuZXdEYXRhO1xuICAgIHZhciBuZXdMaTtcblxuICAgIGlmIChpbnB1dFZhbHVlID09PSAnJykge1xuICAgICAgd2luZG93LmFsZXJ0KCdwbGVhc2UgaW5wdXQgYSByZWFsIGRhdGF+Jyk7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgX3JlbW92ZVJhbmRvbSgpO1xuICAgIF9pZCArPSAxO1xuICAgIG5ld0RhdGEgPSBnZW5lcmFsLmRhdGFHZW5lcmF0b3IoX2lkLCBpbnB1dFZhbHVlKTtcbiAgICBuZXdMaSA9IGNyZWF0ZUxpKG5ld0RhdGEpO1xuICAgIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgIGxpc3QuaW5zZXJ0QmVmb3JlKG5ld0xpLCBsaXN0LmZpcnN0Q2hpbGQpOyAvLyBwdXNoIG5ld0xpIHRvIGZpcnN0XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWUgPSAnJzsgIC8vIHJlc2V0IGlucHV0J3MgdmFsdWVzXG5cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9yZW1vdmVSYW5kb20oKSB7XG4gICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgIHZhciBsaXN0SXRlbXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjbGlzdCBsaScpO1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMobGlzdEl0ZW1zKTtcblxuICAgIHJldHVybiBrZXlzLmZvckVhY2goZnVuY3Rpb24gdGVzdEV2ZXJ5SXRlbShpbmRleCkge1xuICAgICAgaWYgKGxpc3RJdGVtc1trZXlzW2luZGV4XV0uY2xhc3NMaXN0LmNvbnRhaW5zKCdhcGhvcmlzbScpKSB7XG4gICAgICAgIGxpc3QucmVtb3ZlQ2hpbGQobGlzdEl0ZW1zW2tleXNbaW5kZXhdXSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBlbnRlckFkZChlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgIGFkZCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsaWNrTGkoZSkge1xuICAgIHZhciB0YXJnZXRMaSA9IGUudGFyZ2V0O1xuICAgIC8vIHVzZSBldmVudCBkZWxlZ2F0aW9uXG5cbiAgICBpZiAodGFyZ2V0TGkuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJykpIHtcbiAgICAgIF90b2dnbGVMaSh0YXJnZXRMaSk7XG4gICAgICBzaG93QWxsKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX3RvZ2dsZUxpKHRhcmdldExpKSB7XG4gICAgdGFyZ2V0TGkuY2xhc3NMaXN0LnRvZ2dsZSgnZmluaXNoZWQnKTtcbiAgfVxuXG4gIC8vIGxpJ3MgW3hdJ3MgZGVsZXRlXG4gIGZ1bmN0aW9uIHJlbW92ZUxpKGUpIHtcbiAgICB2YXIgaWQ7XG4gICAgdmFyIERPTUluZGV4O1xuICAgIHZhciBsaXN0O1xuICAgIHZhciBsaXN0SXRlbXM7XG5cbiAgICBpZiAoZS50YXJnZXQuY2xhc3NOYW1lID09PSAnY2xvc2UnKSB7IC8vIHVzZSBldmVudCBkZWxlZ2F0aW9uXG4gICAgICAvLyB1c2UgcHJldmlvdXNseSBzdG9yZWQgZGF0YVxuICAgICAgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgICBsaXN0SXRlbXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjbGlzdCBsaScpO1xuICAgICAgaWQgPSBlLnRhcmdldC5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpO1xuICAgICAgRE9NSW5kZXggPSBfZ2V0RE9NSW5kZXgoaWQpO1xuICAgICAgbGlzdC5yZW1vdmVDaGlsZChsaXN0SXRlbXNbRE9NSW5kZXhdKTtcbiAgICAgIGdlbmVyYWwuaWZFbXB0eS5hZGRSYW5kb20oKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfZ2V0RE9NSW5kZXgoaWQpIHtcbiAgICB2YXIgaTtcbiAgICB2YXIgbGlzdEl0ZW1zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2xpc3QgbGknKTtcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGxpc3RJdGVtcyk7XG5cbiAgICBmb3IgKGkgaW4ga2V5cykge1xuICAgICAgaWYgKGxpc3RJdGVtc1trZXlzW2ldXS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSA9PT0gaWQpIHtcbiAgICAgICAgcmV0dXJuIGtleXNbaV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuICdXcm9uZyBpZCwgbm90IGZvdW5kIGluIERPTSB0cmVlJztcbiAgfVxuXG4gIGdlbmVyYWwuaWZFbXB0eS5hZGRSYW5kb20gPSBmdW5jdGlvbiBhZGRSYW5kb20oKSB7XG4gICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gICAgaWYgKCFsaXN0LmZpcnN0Q2hpbGQgfHwgX2lzQWxsTm9uZSgpKSB7XG4gICAgICByZWZyZXNoLnJhbmRvbSgpO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBfaXNBbGxOb25lKCkge1xuICAgIHZhciBsaXN0SXRlbXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjbGlzdCBsaScpO1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMobGlzdEl0ZW1zKTtcblxuICAgIHJldHVybiBrZXlzLmV2ZXJ5KGZ1bmN0aW9uIHRlc3RFdmVyeUl0ZW0oaW5kZXgpIHtcbiAgICAgIHJldHVybiBsaXN0SXRlbXNba2V5c1tpbmRleF1dLnN0eWxlLmRpc3BsYXkgPT09ICdub25lJztcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dJbml0KCkge1xuICAgIHJlZnJlc2guY2xlYXIoKTtcbiAgICByZWZyZXNoLmluaXQoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dBbGwoKSB7XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjbGlzdCBsaScpKTtcblxuICAgIGtleXMuZm9yRWFjaChmdW5jdGlvbiBhcHBlYXJBbGwoaW5kZXgpIHtcbiAgICAgIHZhciBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgICAgIHZhciBsaXN0SXRlbXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjbGlzdCBsaScpO1xuICAgICAgdmFyIGVsZW1lbnQgPSBsaXN0SXRlbXNba2V5c1tpbmRleF1dO1xuXG4gICAgICBfd2hldGhlckFwcGVhcihlbGVtZW50LCB0cnVlKTtcbiAgICAgIGlmIChlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucygnZmluaXNoZWQnKSkge1xuICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGxpc3QuY2hpbGROb2Rlc1trZXlzW2luZGV4XV0pO1xuICAgICAgICBsaXN0LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0NsZWFyKCkge1xuICAgIHJlZnJlc2guY2xlYXIoKTsgLy8gY2xlYXIgbm9kZXMgdmlzdWFsbHlcbiAgICByZWZyZXNoLnJhbmRvbSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0RvbmUoKSB7XG4gICAgX3Nob3dXaGV0aGVyRG9uZSh0cnVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dUb2RvKCkge1xuICAgIF9zaG93V2hldGhlckRvbmUoZmFsc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3Nob3dXaGV0aGVyRG9uZSh3aGV0aGVyRG9uZSkge1xuICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2xpc3QgbGknKSwgZnVuY3Rpb24gd2hldGhlckRvbmVBcHBlYXIoZWxlbWVudCkge1xuICAgICAgaWYgKHdoZXRoZXJEb25lKSB7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdmaW5pc2hlZCcpID8gX3doZXRoZXJBcHBlYXIoZWxlbWVudCwgdHJ1ZSkgOiBfd2hldGhlckFwcGVhcihlbGVtZW50LCBmYWxzZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucygnZmluaXNoZWQnKSA/IF93aGV0aGVyQXBwZWFyKGVsZW1lbnQsIGZhbHNlKSA6IF93aGV0aGVyQXBwZWFyKGVsZW1lbnQsIHRydWUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIF9yZW1vdmVSYW5kb20oKTtcbiAgICBnZW5lcmFsLmlmRW1wdHkuYWRkUmFuZG9tKCk7XG4gIH1cblxuICBmdW5jdGlvbiBfd2hldGhlckFwcGVhcihlbGVtZW50LCB3aGV0aGVyKSB7XG4gICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gd2hldGhlciA/ICdibG9jaycgOiAnbm9uZSc7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGFkZDogYWRkLFxuICAgIGVudGVyQWRkOiBlbnRlckFkZCxcbiAgICBjbGlja0xpOiBjbGlja0xpLFxuICAgIHJlbW92ZUxpOiByZW1vdmVMaSxcbiAgICBzaG93SW5pdDogc2hvd0luaXQsXG4gICAgc2hvd0FsbDogc2hvd0FsbCxcbiAgICBzaG93Q2xlYXI6IHNob3dDbGVhcixcbiAgICBzaG93RG9uZTogc2hvd0RvbmUsXG4gICAgc2hvd1RvZG86IHNob3dUb2RvXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRiRmFpbDtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBkYlN1Y2Nlc3MgPSAoZnVuY3Rpb24gZGJTdWNjZXNzR2VuZXJhdG9yKCkge1xuICB2YXIgREIgPSByZXF1aXJlKCcuLi8uLi9tYWluLmpzJykubGlzdERCSGFuZGxlcjtcbiAgdmFyIHJlZnJlc2ggPSByZXF1aXJlKCcuLi9yZWZyZXNoL3JlZnJlc2guanMnKS5kYlN1Y2Nlc3M7XG4gIHZhciBjcmVhdGVMaSA9IHJlcXVpcmUoJy4uL2NyZWF0ZUxpLmpzJyk7XG4gIHZhciBnZW5lcmFsID0gcmVxdWlyZSgnLi9nZW5lcmFsLmpzJyk7XG5cbiAgZnVuY3Rpb24gYWRkKCkge1xuICAgIHZhciBsaXN0O1xuICAgIHZhciBuZXdEYXRhO1xuICAgIHZhciBuZXdMaTtcbiAgICB2YXIgaW5wdXRWYWx1ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNpbnB1dCcpLnZhbHVlO1xuXG4gICAgaWYgKGlucHV0VmFsdWUgPT09ICcnKSB7XG4gICAgICB3aW5kb3cuYWxlcnQoJ3BsZWFzZSBpbnB1dCBhIHJlYWwgZGF0YX4nKTtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBnZW5lcmFsLmlmRW1wdHkucmVtb3ZlSW5pdCgpO1xuICAgIG5ld0RhdGEgPSBnZW5lcmFsLmRhdGFHZW5lcmF0b3IoREIuZ2V0TmV3S2V5KCksIGlucHV0VmFsdWUpO1xuICAgIG5ld0xpID0gY3JlYXRlTGkobmV3RGF0YSk7XG4gICAgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgbGlzdC5pbnNlcnRCZWZvcmUobmV3TGksIGxpc3QuZmlyc3RDaGlsZCk7IC8vIHB1c2ggbmV3TGkgdG8gZmlyc3RcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5wdXQnKS52YWx1ZSA9ICcnOyAgLy8gcmVzZXQgaW5wdXQncyB2YWx1ZXNcbiAgICBEQi5hZGRJdGVtKG5ld0RhdGEpO1xuXG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICBmdW5jdGlvbiBlbnRlckFkZChlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgIGFkZCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsaWNrTGkoZSkge1xuICAgIHZhciBpZDtcbiAgICB2YXIgdGFyZ2V0TGkgPSBlLnRhcmdldDtcbiAgICAvLyB1c2UgZXZlbnQgZGVsZWdhdGlvblxuXG4gICAgaWYgKCF0YXJnZXRMaS5jbGFzc0xpc3QuY29udGFpbnMoJ2FwaG9yaXNtJykpIHtcbiAgICAgIGlmICh0YXJnZXRMaS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSkge1xuICAgICAgICB0YXJnZXRMaS5jbGFzc0xpc3QudG9nZ2xlKCdmaW5pc2hlZCcpOyAvLyB0b2dnbGUgYXBwZWFyYW5jZVxuICAgICAgICBpZCA9IHBhcnNlSW50KHRhcmdldExpLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpLCAxMCk7IC8vIHVzZSBwcmV2aW91c2x5IHN0b3JlZCBkYXRhLWlkIGF0dHJpYnV0ZVxuICAgICAgICBEQi5nZXRJdGVtKGlkLCBfdG9nZ2xlTGkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIGxpJ3MgW3hdJ3MgZGVsZXRlXG4gIGZ1bmN0aW9uIHJlbW92ZUxpKGUpIHtcbiAgICB2YXIgaWQ7XG5cbiAgICBpZiAoZS50YXJnZXQuY2xhc3NOYW1lID09PSAnY2xvc2UnKSB7IC8vIHVzZSBldmVudCBkZWxlZ2F0aW9uXG4gICAgICAvLyB1c2UgcHJldmlvdXNseSBzdG9yZWQgZGF0YVxuICAgICAgaWQgPSBwYXJzZUludChlLnRhcmdldC5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpLCAxMCk7XG4gICAgICBEQi5yZW1vdmVJdGVtKGlkLCBzaG93QWxsKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzaG93SW5pdCgpIHtcbiAgICByZWZyZXNoLmNsZWFyKCk7XG4gICAgREIuZ2V0QWxsKHJlZnJlc2guaW5pdCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93QWxsKCkge1xuICAgIHJlZnJlc2guY2xlYXIoKTtcbiAgICBEQi5nZXRBbGwocmVmcmVzaC5hbGwpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0NsZWFyKCkge1xuICAgIHJlZnJlc2guY2xlYXIoKTsgLy8gY2xlYXIgbm9kZXMgdmlzdWFsbHlcbiAgICByZWZyZXNoLnJhbmRvbSgpO1xuICAgIERCLmNsZWFyKCk7IC8vIGNsZWFyIGRhdGEgaW5kZWVkXG4gIH1cblxuICBmdW5jdGlvbiBzaG93RG9uZSgpIHtcbiAgICBfc2hvd1doZXRoZXJEb25lKHRydWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd1RvZG8oKSB7XG4gICAgX3Nob3dXaGV0aGVyRG9uZShmYWxzZSk7XG4gIH1cblxuICBmdW5jdGlvbiBfc2hvd1doZXRoZXJEb25lKHdoZXRoZXJEb25lKSB7XG4gICAgdmFyIGNvbmRpdGlvbiA9ICdmaW5pc2hlZCc7XG5cbiAgICByZWZyZXNoLmNsZWFyKCk7XG4gICAgREIuZ2V0Q29uZGl0aW9uSXRlbShjb25kaXRpb24sIHdoZXRoZXJEb25lLCByZWZyZXNoLnBhcnQpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3RvZ2dsZUxpKGRhdGEpIHtcbiAgICBkYXRhLmZpbmlzaGVkID0gIWRhdGEuZmluaXNoZWQ7XG4gICAgREIudXBkYXRlSXRlbShkYXRhLCBzaG93QWxsKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYWRkOiBhZGQsXG4gICAgZW50ZXJBZGQ6IGVudGVyQWRkLFxuICAgIGNsaWNrTGk6IGNsaWNrTGksXG4gICAgcmVtb3ZlTGk6IHJlbW92ZUxpLFxuICAgIHNob3dJbml0OiBzaG93SW5pdCxcbiAgICBzaG93QWxsOiBzaG93QWxsLFxuICAgIHNob3dDbGVhcjogc2hvd0NsZWFyLFxuICAgIHNob3dEb25lOiBzaG93RG9uZSxcbiAgICBzaG93VG9kbzogc2hvd1RvZG9cbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZGJTdWNjZXNzO1xuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gaGFuZGxlckdlbmVyYXRvcigpIHtcbiAgdmFyIGRiU3VjY2VzcyA9IHJlcXVpcmUoJy4vZGJTdWNjZXNzLmpzJyk7XG4gIHZhciBkYkZhaWwgPSByZXF1aXJlKCcuL2RiRmFpbC5qcycpO1xuXG4gIHJldHVybiB7XG4gICAgZGJTdWNjZXNzOiBkYlN1Y2Nlc3MsXG4gICAgZGJGYWlsOiBkYkZhaWxcbiAgfTtcbn0oKSk7XG4iLCJ2YXIgZ2VuZXJhbCA9IChmdW5jdGlvbiBnZW5lcmFsR2VuZXJhdG9yKCkge1xuICB2YXIgaWZFbXB0eSA9IHtcbiAgICByZW1vdmVJbml0OiBmdW5jdGlvbiByZW1vdmVJbml0KCkge1xuICAgICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gICAgICBpZiAobGlzdC5maXJzdENoaWxkLmNsYXNzTmFtZSA9PT0gJ2FwaG9yaXNtJykge1xuICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGxpc3QuZmlyc3RDaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIGRhdGFHZW5lcmF0b3Ioa2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiB7XG4gICAgICBpZDoga2V5LFxuICAgICAgZXZlbnQ6IHZhbHVlLFxuICAgICAgZmluaXNoZWQ6IGZhbHNlLFxuICAgICAgZGF0ZTogX2dldE5ld0RhdGUoJ3l5eXnlubRNTeaciGRk5pelIGhoOm1tJylcbiAgICB9O1xuICB9XG5cbiAgLy8gRm9ybWF0IGRhdGVcbiAgZnVuY3Rpb24gX2dldE5ld0RhdGUoZm10KSB7XG4gICAgdmFyIG5ld0RhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIHZhciBuZXdmbXQgPSBmbXQ7XG4gICAgdmFyIG8gPSB7XG4gICAgICAneSsnOiBuZXdEYXRlLmdldEZ1bGxZZWFyKCksXG4gICAgICAnTSsnOiBuZXdEYXRlLmdldE1vbnRoKCkgKyAxLFxuICAgICAgJ2QrJzogbmV3RGF0ZS5nZXREYXRlKCksXG4gICAgICAnaCsnOiBuZXdEYXRlLmdldEhvdXJzKCksXG4gICAgICAnbSsnOiBuZXdEYXRlLmdldE1pbnV0ZXMoKVxuICAgIH07XG4gICAgdmFyIGxlbnM7XG5cbiAgICBmb3IgKHZhciBrIGluIG8pIHtcbiAgICAgIGlmIChuZXcgUmVnRXhwKCcoJyArIGsgKyAnKScpLnRlc3QobmV3Zm10KSkge1xuICAgICAgICBpZiAoayA9PT0gJ3krJykge1xuICAgICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKCcnICsgb1trXSkuc3Vic3RyKDQgLSBSZWdFeHAuJDEubGVuZ3RoKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoayA9PT0gJ1MrJykge1xuICAgICAgICAgIGxlbnMgPSBSZWdFeHAuJDEubGVuZ3RoO1xuICAgICAgICAgIGxlbnMgPSBsZW5zID09PSAxID8gMyA6IGxlbnM7XG4gICAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoJzAwJyArIG9ba10pLnN1YnN0cigoJycgKyBvW2tdKS5sZW5ndGggLSAxLCBsZW5zKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoUmVnRXhwLiQxLmxlbmd0aCA9PT0gMSkgPyAob1trXSkgOiAoKCcwMCcgKyBvW2tdKS5zdWJzdHIoKCcnICsgb1trXSkubGVuZ3RoKSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld2ZtdDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaWZFbXB0eTogaWZFbXB0eSxcbiAgICBkYXRhR2VuZXJhdG9yOiBkYXRhR2VuZXJhdG9yXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdlbmVyYWw7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiBkYkZhaWxHZW5lcmF0b3IoKSB7XG4gIHZhciBnZW5lcmFsID0gcmVxdWlyZSgnLi9nZW5lcmFsLmpzJyk7XG5cbiAgZnVuY3Rpb24gcmFuZG9tQXBob3Jpc20oKSB7XG4gICAgdmFyIGFwaG9yaXNtcyA9IFtcbiAgICAgICdZZXN0ZXJkYXkgWW91IFNhaWQgVG9tb3Jyb3cnLFxuICAgICAgJ1doeSBhcmUgd2UgaGVyZT8nLFxuICAgICAgJ0FsbCBpbiwgb3Igbm90aGluZycsXG4gICAgICAnWW91IE5ldmVyIFRyeSwgWW91IE5ldmVyIEtub3cnLFxuICAgICAgJ1RoZSB1bmV4YW1pbmVkIGxpZmUgaXMgbm90IHdvcnRoIGxpdmluZy4gLS0gU29jcmF0ZXMnXG4gICAgXTtcbiAgICB2YXIgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcGhvcmlzbXMubGVuZ3RoKTtcbiAgICB2YXIgdGV4dCA9IGFwaG9yaXNtc1tyYW5kb21JbmRleF07XG5cbiAgICBnZW5lcmFsLnNlbnRlbmNlR2VuZXJhdG9yKHRleHQpO1xuICB9XG5cbiAgLyogaW50ZXJmYWNlICovXG4gIHJldHVybiB7XG4gICAgaW5pdDogZ2VuZXJhbC5pbml0LFxuICAgIGFsbDogZ2VuZXJhbC5hbGwuYmluZChudWxsLCByYW5kb21BcGhvcmlzbSksXG4gICAgcGFydDogZ2VuZXJhbC5wYXJ0LmJpbmQobnVsbCwgcmFuZG9tQXBob3Jpc20pLFxuICAgIGNsZWFyOiBnZW5lcmFsLmNsZWFyLFxuICAgIHJhbmRvbTogcmFuZG9tQXBob3Jpc21cbiAgfTtcbn0oKSk7XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uIGRiU3VjY2Vzc0dlbmVyYXRvcigpIHtcbiAgdmFyIERCID0gcmVxdWlyZSgnLi4vLi4vbWFpbi5qcycpLmFwaG9yaXNtREJIYW5kbGVyO1xuICB2YXIgZ2VuZXJhbCA9IHJlcXVpcmUoJy4vZ2VuZXJhbC5qcycpO1xuXG4gIGNvbnNvbGUubG9nKCdyZWZyZXNoIHNjY2VzcyBpbicpO1xuICAvLyBvcGVuIERCLCBhbmQgd2hlbiBEQiBvcGVuIHN1Y2NlZWQsIGludm9rZSBpbml0aWFsIGZ1bmN0aW9uXG4gIGZ1bmN0aW9uIHJhbmRvbUFwaG9yaXNtKCkge1xuICAgIHZhciByYW5kb21JbmRleCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIERCLmdldExlbmd0aCgpKTtcblxuICAgIGNvbnNvbGUuZGlyKERCKTtcbiAgICBjb25zb2xlLmxvZyhEQi5nZXRMZW5ndGgoKSk7XG4gICAgY29uc29sZS5sb2cocmFuZG9tSW5kZXgpO1xuICAgIERCLmdldEl0ZW0ocmFuZG9tSW5kZXgsIGdlbmVyYWwuc2VudGVuY2VHZW5lcmF0b3IpO1xuICB9XG5cbiAgLyogaW50ZXJmYWNlICovXG4gIHJldHVybiB7XG4gICAgaW5pdDogZ2VuZXJhbC5pbml0LFxuICAgIGFsbDogZ2VuZXJhbC5hbGwuYmluZChudWxsLCByYW5kb21BcGhvcmlzbSksICAvLyBQVU5DSExJTkU6IHVzZSBiaW5kIHRvIHBhc3MgcGFyYW10ZXJcbiAgICBwYXJ0OiBnZW5lcmFsLnBhcnQuYmluZChudWxsLCByYW5kb21BcGhvcmlzbSksXG4gICAgY2xlYXI6IGdlbmVyYWwuY2xlYXIsXG4gICAgcmFuZG9tOiByYW5kb21BcGhvcmlzbVxuICB9O1xufSgpKTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBnZW5lcmFsID0gKGZ1bmN0aW9uIGdlbmVyYWxHZW5lcmF0b3IoKSB7XG4gIHZhciBjcmVhdGVMaSA9IHJlcXVpcmUoJy4uL2NyZWF0ZUxpLmpzJyk7XG5cbiAgZnVuY3Rpb24gaW5pdChkYXRhQXJyKSB7XG4gICAgX3Nob3coX2luaXRTZW50ZW5jZSwgZGF0YUFycik7XG4gIH1cblxuICBmdW5jdGlvbiBhbGwocmFuZG9tQXBob3Jpc20sIGRhdGFBcnIpIHtcbiAgICBfc2hvdyhyYW5kb21BcGhvcmlzbSwgZGF0YUFycik7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJ0KHJhbmRvbUFwaG9yaXNtLCBkYXRhQXJyKSB7XG4gICAgdmFyIG5vZGVzO1xuXG4gICAgaWYgKCFkYXRhQXJyIHx8IGRhdGFBcnIubGVuZ3RoID09PSAwKSB7XG4gICAgICByYW5kb21BcGhvcmlzbSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBub2RlcyA9IGRhdGFBcnIucmVkdWNlKGZ1bmN0aW9uIG5vZGVHZW5lcmF0b3IocmVzdWx0LCBkYXRhKSB7XG4gICAgICAgIHJlc3VsdC5pbnNlcnRCZWZvcmUoY3JlYXRlTGkoZGF0YSksIHJlc3VsdC5maXJzdENoaWxkKTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSwgZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpKTsgLy8gUFVOQ0hMSU5FOiBicmlsbGlhbnQgYXJyLnJlZHVjZSgpICsgZG9jdW1lbnRGcmFnbWVudFxuXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmFwcGVuZENoaWxkKG5vZGVzKTsgLy8gYWRkIGl0IHRvIERPTVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIHZhciByb290ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcblxuICAgIHdoaWxlIChyb290Lmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgcm9vdC5yZW1vdmVDaGlsZChyb290LmZpcnN0Q2hpbGQpOyAvLyB0aGUgYmVzdCB3YXkgdG8gY2xlYW4gY2hpbGROb2Rlc1xuICAgIH1cbiAgfVxuXG5cbiAgLyogcHJpdmF0ZSBtZXRob2RzICovXG5cbiAgZnVuY3Rpb24gX3Nob3coc2VudGVuY2VGdW5jLCBkYXRhQXJyKSB7XG4gICAgaWYgKCFkYXRhQXJyIHx8IGRhdGFBcnIubGVuZ3RoID09PSAwKSB7XG4gICAgICBzZW50ZW5jZUZ1bmMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgX3Nob3dSZWZyZXNoKGRhdGFBcnIpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9zaG93UmVmcmVzaChkYXRhQXJyKSB7XG4gICAgdmFyIHJlc3VsdCA9IF9jbGFzc2lmeURhdGEoZGF0YUFycik7XG5cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmFwcGVuZENoaWxkKHJlc3VsdCk7IC8vIGFkZCBpdCB0byBET01cbiAgfVxuXG4gIGZ1bmN0aW9uIF9jbGFzc2lmeURhdGEoZGF0YUFycikge1xuICAgIC8vIHVzZSBmcmFnbWVudCB0byByZWR1Y2UgRE9NIG9wZXJhdGVcbiAgICB2YXIgdW5maXNoaWVkID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIHZhciBmaW5pc2hlZCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB2YXIgZnVzaW9uID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgLy8gcHV0IHRoZSBmaW5pc2hlZCBpdGVtIHRvIHRoZSBib3R0b21cbiAgICBkYXRhQXJyLmZvckVhY2goZnVuY3Rpb24gY2xhc3NpZnkoZGF0YSkge1xuICAgICAgaWYgKGRhdGEuZmluaXNoZWQpIHtcbiAgICAgICAgZmluaXNoZWQuaW5zZXJ0QmVmb3JlKGNyZWF0ZUxpKGRhdGEpLCBmaW5pc2hlZC5maXJzdENoaWxkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVuZmlzaGllZC5pbnNlcnRCZWZvcmUoY3JlYXRlTGkoZGF0YSksIHVuZmlzaGllZC5maXJzdENoaWxkKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBmdXNpb24uYXBwZW5kQ2hpbGQodW5maXNoaWVkKTtcbiAgICBmdXNpb24uYXBwZW5kQ2hpbGQoZmluaXNoZWQpO1xuXG4gICAgcmV0dXJuIGZ1c2lvbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9pbml0U2VudGVuY2UoKSB7XG4gICAgdmFyIHRleHQgPSAnV2VsY29tZX4sIHRyeSB0byBhZGQgeW91ciBmaXJzdCB0by1kbyBsaXN0IDogKSc7XG5cbiAgICBzZW50ZW5jZUdlbmVyYXRvcih0ZXh0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbnRlbmNlR2VuZXJhdG9yKHRleHQpIHtcbiAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgIHZhciB0ZXh0Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQpO1xuXG4gICAgbGkuYXBwZW5kQ2hpbGQodGV4dE5vZGUpO1xuICAgIGxpLmNsYXNzTmFtZSA9ICdhcGhvcmlzbSc7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5hcHBlbmRDaGlsZChsaSk7XG4gIH1cblxuXG4gIC8qIGludGVyZmFjZSAqL1xuICByZXR1cm4ge1xuICAgIGluaXQ6IGluaXQsXG4gICAgYWxsOiBhbGwsXG4gICAgcGFydDogcGFydCxcbiAgICBjbGVhcjogY2xlYXIsXG4gICAgc2VudGVuY2VHZW5lcmF0b3I6IHNlbnRlbmNlR2VuZXJhdG9yXG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdlbmVyYWw7XG4iXX0=
