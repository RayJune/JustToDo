(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
function clearChildNodes(root) {
  while (root.hasChildNodes()) {
    // or root.firstChild or root.lastChild
    root.removeChild(root.firstChild);
  }
  // or root.innerHTML = ''
}

exports.default = clearChildNodes;

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _addEventsGenerator = require('../dbGeneral/addEventsGenerator');

var _addEventsGenerator2 = _interopRequireDefault(_addEventsGenerator);

var _eventsHandler = require('../dbFail/eventsHandler');

var _eventsHandler2 = _interopRequireDefault(_eventsHandler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function addEvents() {
  window.alert('Your browser doesn\'t support a stable version of IndexedDB. We will offer you the without indexedDB mode');
  (0, _addEventsGenerator2.default)(_eventsHandler2.default);
}

exports.default = addEvents;

},{"../dbFail/eventsHandler":3,"../dbGeneral/addEventsGenerator":5}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _refresh = require('../dbFail/refresh');

var _refresh2 = _interopRequireDefault(_refresh);

var _eventsHandlerGeneral = require('../dbGeneral/eventsHandlerGeneral');

var _eventsHandlerGeneral2 = _interopRequireDefault(_eventsHandlerGeneral);

var _itemGenerator = require('../templete/itemGenerator');

var _itemGenerator2 = _interopRequireDefault(_itemGenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var eventsHandler = function () {
  var _id = 0; // so the first item's id is 1

  function add() {
    var inputValue = document.querySelector('#input').value;

    if (inputValue === '') {
      window.alert('please input a real data~');
    } else {
      addHandler(inputValue);
    }
  }

  function addHandler(inputValue) {
    var list = document.querySelector('#list');

    _removeRandom(list);
    _id += 1;
    var newData = _eventsHandlerGeneral2.default.dataGenerator(_id, inputValue);
    list.insertBefore((0, _itemGenerator2.default)(newData), list.firstChild); // push newLi to first
    _eventsHandlerGeneral2.default.resetInput();
  }

  function _removeRandom(list) {
    var listItems = list.childNodes;

    [].concat(_toConsumableArray(listItems)).forEach(function (item) {
      if (item.classList.contains('aphorism')) {
        list.removeChild(item);
      }
    });
  }
  // or use for...in
  // for (const index in listItems) {
  //   if (listItems.hasOwnProperty(index)) {
  //     if (listItems[index].classList.contains('aphorism')) {
  //       list.removeChild(listItems[index]);
  //     }
  //   }
  // }

  function enterAdd(e) {
    if (e.keyCode === 13) {
      add();
    }
  }

  function showAll() {
    var list = document.querySelector('#list');
    var listItems = list.childNodes;

    [].concat(_toConsumableArray(listItems)).forEach(function (item) {
      _whetherAppear(item, true);
      if (item.classList.contains('finished')) {
        list.removeChild(item);
        list.appendChild(item); // PUNCHLINE: drop done item
      }
    });
  }

  /* eslint-disable no-param-reassign  */
  function _whetherAppear(element, whether) {
    element.style.display = whether ? 'block' : 'none'; // FIXME: eslint error
  }
  /* eslint-enable no-param-reassign  */

  function clickLi(e) {
    var targetLi = e.target;
    // use event delegation

    if (targetLi.getAttribute('data-id')) {
      targetLi.classList.toggle('finished');
      showAll();
    }
  }

  // li's [x]'s delete
  function removeLi(e) {
    if (e.target.className === 'close') {
      // use event delegation
      _removeLiHandler(e.target);
      _addRandom();
    }
  }

  function _removeLiHandler(element) {
    // use previously stored data
    var list = document.querySelector('#list');
    var listItems = list.childNodes;
    var id = element.parentNode.getAttribute('data-id');

    try {
      [].concat(_toConsumableArray(listItems)).forEach(function (item) {
        if (item.getAttribute('data-id') === id) {
          list.removeChild(item);
        }
      });
    } catch (error) {
      console.log('Wrong id, not found in DOM tree');
      throw new Error(error);
    }
  }

  function _addRandom() {
    var list = document.querySelector('#list');

    if (!list.hasChildNodes() || _allDisappear(list)) {
      _refresh2.default.random();
    }
  }

  function _allDisappear(list) {
    var listItems = list.childNodes;

    return Array.prototype.every.call(listItems, function (item) {
      return item.style.display === 'none';
    });
  }

  function showInit() {
    _refresh2.default.init();
  }

  function showDone() {
    _showWhetherDone(true);
  }

  function showTodo() {
    _showWhetherDone(false);
  }

  function _showWhetherDone(whetherDone) {
    var list = document.querySelector('#list');
    var listItems = list.childNodes;

    _removeRandom(list);
    [].concat(_toConsumableArray(listItems)).forEach(function (item) {
      // FIXME: eslint error
      item.classList.contains('finished') ? _whetherAppear(item, whetherDone) : _whetherAppear(item, !whetherDone);
    });
    _addRandom();
  }

  function showClearDone() {
    var list = document.querySelector('#list');
    var listItems = list.childNodes;

    _removeRandom(list);
    [].concat(_toConsumableArray(listItems)).forEach(function (item) {
      if (item.classList.contains('finished')) {
        list.removeChild(item);
      }
    });
    _addRandom();
  }

  function showClear() {
    _refresh2.default.clear(); // clear nodes visually
    _refresh2.default.random();
  }

  return {
    add: add,
    enterAdd: enterAdd,
    clickLi: clickLi,
    removeLi: removeLi,
    showInit: showInit,
    showAll: showAll,
    showDone: showDone,
    showTodo: showTodo,
    showClearDone: showClearDone,
    showClear: showClear
  };
}();

exports.default = eventsHandler;

},{"../dbFail/refresh":4,"../dbGeneral/eventsHandlerGeneral":6,"../templete/itemGenerator":9}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _refreshGeneral = require('../dbGeneral/refreshGeneral');

var _refreshGeneral2 = _interopRequireDefault(_refreshGeneral);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Refresh = function () {
  function randomAphorism() {
    var aphorisms = ['Yesterday You Said Tomorrow', 'Why are we here?', 'All in, or nothing', 'You Never Try, You Never Know', 'The unexamined life is not worth living. -- Socrates', 'There is only one thing we say to lazy: NOT TODAY'];
    var randomIndex = Math.floor(Math.random() * aphorisms.length);
    var text = aphorisms[randomIndex];

    _refreshGeneral2.default.sentenceHandler(text);
  }

  return {
    init: _refreshGeneral2.default.init,
    clear: _refreshGeneral2.default.clear,
    random: randomAphorism
  };
}();

exports.default = Refresh;

},{"../dbGeneral/refreshGeneral":7}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
function addEventsGenerator(handler) {
  handler.showInit();
  // add all eventListener
  var list = document.querySelector('#list');
  list.addEventListener('click', handler.clickLi, false);
  list.addEventListener('click', handler.removeLi, false);
  document.addEventListener('keydown', handler.enterAdd, false);
  document.querySelector('#add').addEventListener('click', handler.add, false);
  document.querySelector('#showDone').addEventListener('click', handler.showDone, false);
  document.querySelector('#showTodo').addEventListener('click', handler.showTodo, false);
  document.querySelector('#showAll').addEventListener('click', handler.showAll, false);
  document.querySelector('#showClearDone').addEventListener('click', handler.showClearDone, false);
  document.querySelector('#showClear').addEventListener('click', handler.showClear, false);
}

exports.default = addEventsGenerator;

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getFormatDate = require('../getFormatDate');

var _getFormatDate2 = _interopRequireDefault(_getFormatDate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var eventsHandlerGeneral = function () {
  function resetInput() {
    document.querySelector('#input').value = '';
  }

  function dataGenerator(key, value) {
    return {
      id: key,
      event: value,
      finished: false,
      date: (0, _getFormatDate2.default)('MM月dd日hh:mm')
    };
  }

  return {
    resetInput: resetInput,
    dataGenerator: dataGenerator
  };
}();

exports.default = eventsHandlerGeneral;

},{"../getFormatDate":8}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _itemGenerator = require('../templete/itemGenerator');

var _itemGenerator2 = _interopRequireDefault(_itemGenerator);

var _sentenceGenerator = require('../templete/sentenceGenerator');

var _sentenceGenerator2 = _interopRequireDefault(_sentenceGenerator);

var _clearChildNodes = require('../clearChildNodes');

var _clearChildNodes2 = _interopRequireDefault(_clearChildNodes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var refreshGeneral = function () {
  function init(dataArr) {
    _show(dataArr, _initSentence, _renderAll);
  }

  function _show(dataArr, showSentenceFunc, generateFunc) {
    if (!dataArr || dataArr.length === 0) {
      showSentenceFunc();
    } else {
      document.querySelector('#list').innerHTML = generateFunc(dataArr);
    }
  }

  function _initSentence() {
    var text = 'Welcome~, try to add your first to-do list : )';

    document.querySelector('#list').innerHTML = (0, _sentenceGenerator2.default)(text);
  }

  function all(randomAphorism, dataArr) {
    _show(dataArr, randomAphorism, _renderAll);
  }

  function _renderAll(dataArr) {
    var classifiedData = _classifyData(dataArr);

    return (0, _itemGenerator2.default)(classifiedData);
  }

  function _classifyData(dataArr) {
    var finished = [];
    var unfishied = [];

    // put the finished item to the bottom
    dataArr.forEach(function (data) {
      return data.finished ? finished.unshift(data) : unfishied.unshift(data);
    });

    return unfishied.concat(finished);
  }

  function part(randomAphorism, dataArr) {
    _show(dataArr, randomAphorism, _renderPart);
  }

  function _renderPart(dataArr) {
    return (0, _itemGenerator2.default)(dataArr.reverse());
  }

  function clear() {
    (0, _clearChildNodes2.default)(document.querySelector('#list'));
  }

  function sentenceHandler(text) {
    var rendered = (0, _sentenceGenerator2.default)(text);

    document.querySelector('#list').innerHTML = rendered;
  }

  return {
    init: init,
    all: all,
    part: part,
    clear: clear,
    sentenceHandler: sentenceHandler
  };
}();

exports.default = refreshGeneral;

},{"../clearChildNodes":1,"../templete/itemGenerator":9,"../templete/sentenceGenerator":10}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
function getFormatDate(fmt) {
  var newDate = new Date();
  var o = {
    'y+': newDate.getFullYear(),
    'M+': newDate.getMonth() + 1,
    'd+': newDate.getDate(),
    'h+': newDate.getHours(),
    'm+': newDate.getMinutes()
  };
  var newfmt = fmt;

  Object.keys(o).forEach(function (k) {
    if (new RegExp('(' + k + ')').test(newfmt)) {
      if (k === 'y+') {
        newfmt = newfmt.replace(RegExp.$1, ('' + o[k]).substr(4 - RegExp.$1.length));
      } else if (k === 'S+') {
        var lens = RegExp.$1.length;
        lens = lens === 1 ? 3 : lens;
        newfmt = newfmt.replace(RegExp.$1, ('00' + o[k]).substr(('' + o[k]).length - 1, lens));
      } else {
        newfmt = newfmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length));
      }
    }
  });
  // for (const k in o) {
  //   if (new RegExp(`(${k})`).test(newfmt)) {
  //     if (k === 'y+') {
  //       newfmt = newfmt.replace(RegExp.$1, (`${o[k]}`).substr(4 - RegExp.$1.length));
  //     } else if (k === 'S+') {
  //       let lens = RegExp.$1.length;
  //       lens = lens === 1 ? 3 : lens;
  //       newfmt = newfmt.replace(RegExp.$1, (`00${o[k]}`).substr((`${o[k]}`).length - 1, lens));
  //     } else {
  //       newfmt = newfmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : ((`00${o[k]}`).substr((`${o[k]}`).length)));
  //     }
  //   }
  // }

  return newfmt;
}

exports.default = getFormatDate;

},{}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
function itemGenerator(dataArr) {
  var template = Handlebars.templates.li;
  var result = dataArr;

  if (!Array.isArray(dataArr)) {
    result = [dataArr];
  }
  var rendered = template({ listItems: result });

  return rendered.trim();
}

exports.default = itemGenerator;

},{}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
function sentenceGenerator(text) {
  var template = Handlebars.templates.li;
  var rendered = template({ sentence: text });

  return rendered.trim();
}

exports.default = sentenceGenerator;

},{}],11:[function(require,module,exports){
'use strict';

var _addEvents = require('./utlis/dbFail/addEvents');

var _addEvents2 = _interopRequireDefault(_addEvents);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _addEvents2.default)();

},{"./utlis/dbFail/addEvents":2}]},{},[11])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9jbGVhckNoaWxkTm9kZXMuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkZhaWwvYWRkRXZlbnRzLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJGYWlsL2V2ZW50c0hhbmRsZXIuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkZhaWwvcmVmcmVzaC5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2RiR2VuZXJhbC9hZGRFdmVudHNHZW5lcmF0b3IuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkdlbmVyYWwvZXZlbnRzSGFuZGxlckdlbmVyYWwuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkdlbmVyYWwvcmVmcmVzaEdlbmVyYWwuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9nZXRGb3JtYXREYXRlLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvdGVtcGxldGUvaXRlbUdlbmVyYXRvci5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL3RlbXBsZXRlL3NlbnRlbmNlR2VuZXJhdG9yLmpzIiwic3JjL3NjcmlwdHMvd2l0aG91dERCLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7QUNBQSxTQUFTLGVBQVQsQ0FBeUIsSUFBekIsRUFBK0I7QUFDN0IsU0FBTyxLQUFLLGFBQUwsRUFBUCxFQUE2QjtBQUFFO0FBQzdCLFNBQUssV0FBTCxDQUFpQixLQUFLLFVBQXRCO0FBQ0Q7QUFDRDtBQUNEOztrQkFFYyxlOzs7Ozs7Ozs7QUNQZjs7OztBQUNBOzs7Ozs7QUFFQSxTQUFTLFNBQVQsR0FBcUI7QUFDbkIsU0FBTyxLQUFQLENBQWEsMkdBQWI7QUFDQTtBQUNEOztrQkFFYyxTOzs7Ozs7Ozs7QUNSZjs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7O0FBRUEsSUFBTSxnQkFBaUIsWUFBTTtBQUMzQixNQUFJLE1BQU0sQ0FBVixDQUQyQixDQUNkOztBQUViLFdBQVMsR0FBVCxH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QTZCO0FBQzNCLGFBQVMsQ0FBQyxPQUFELENBQVQ7QUFDRDtBQUNELE1BQU0sV0FBVyxTQUFTLEVBQUUsV0FBVyxNQUFiLEVBQVQsQ0FBakI7O0FBRUEsU0FBTyxTQUFTLElBQVQsRUFBUDtBQUNEOztrQkFFYyxhOzs7Ozs7OztBQ1pmLFNBQVMsaUJBQVQsQ0FBMkIsSUFBM0IsRUFBaUM7QUFDL0IsTUFBTSxXQUFXLFdBQVcsU0FBWCxDQUFxQixFQUF0QztBQUNBLE1BQU0sV0FBVyxTQUFTLEVBQUUsVUFBVSxJQUFaLEVBQVQsQ0FBakI7O0FBRUEsU0FBTyxTQUFTLElBQVQsRUFBUDtBQUNEOztrQkFFYyxpQjs7Ozs7QUNQZjs7Ozs7O0FBRUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZnVuY3Rpb24gY2xlYXJDaGlsZE5vZGVzKHJvb3QpIHtcbiAgd2hpbGUgKHJvb3QuaGFzQ2hpbGROb2RlcygpKSB7IC8vIG9yIHJvb3QuZmlyc3RDaGlsZCBvciByb290Lmxhc3RDaGlsZFxuICAgIHJvb3QucmVtb3ZlQ2hpbGQocm9vdC5maXJzdENoaWxkKTtcbiAgfVxuICAvLyBvciByb290LmlubmVySFRNTCA9ICcnXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsZWFyQ2hpbGROb2RlcztcbiIsImltcG9ydCBhZGRFdmVudHNHZW5lcmF0b3IgZnJvbSAnLi4vZGJHZW5lcmFsL2FkZEV2ZW50c0dlbmVyYXRvcic7XG5pbXBvcnQgZXZlbnRzSGFuZGxlciBmcm9tICcuLi9kYkZhaWwvZXZlbnRzSGFuZGxlcic7XG5cbmZ1bmN0aW9uIGFkZEV2ZW50cygpIHtcbiAgd2luZG93LmFsZXJ0KCdZb3VyIGJyb3dzZXIgZG9lc25cXCd0IHN1cHBvcnQgYSBzdGFibGUgdmVyc2lvbiBvZiBJbmRleGVkREIuIFdlIHdpbGwgb2ZmZXIgeW91IHRoZSB3aXRob3V0IGluZGV4ZWREQiBtb2RlJyk7XG4gIGFkZEV2ZW50c0dlbmVyYXRvcihldmVudHNIYW5kbGVyKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYWRkRXZlbnRzO1xuIiwiaW1wb3J0IFJlZnJlc2ggZnJvbSAnLi4vZGJGYWlsL3JlZnJlc2gnO1xuaW1wb3J0IEdlbmVyYWwgZnJvbSAnLi4vZGJHZW5lcmFsL2V2ZW50c0hhbmRsZXJHZW5lcmFsJztcbmltcG9ydCBpdGVtR2VuZXJhdG9yIGZyb20gJy4uL3RlbXBsZXRlL2l0ZW1HZW5lcmF0b3InO1xuXG5jb25zdCBldmVudHNIYW5kbGVyID0gKCgpID0+IHtcbiAgbGV0IF9pZCA9IDA7IC8vIHNvIHRoZSBmaXJzdCBpdGVtJ3MgaWQgaXMgMVxuXG4gIGZ1bmN0aW9uIGFkZCgpIHtcbiAgICBjb25zdCBpbnB1dFZhbHVlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWU7XG5cbiAgICBpZiAoaW5wdXRWYWx1ZSA9PT0gJycpIHtcbiAgICAgIHdpbmRvdy5hbGVydCgncGxlYXNlIGlucHV0IGEgcmVhbCBkYXRhficpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhZGRIYW5kbGVyKGlucHV0VmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZEhhbmRsZXIoaW5wdXRWYWx1ZSkge1xuICAgIGNvbnN0IGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gICAgX3JlbW92ZVJhbmRvbShsaXN0KTtcbiAgICBfaWQgKz0gMTtcbiAgICBjb25zdCBuZXdEYXRhID0gR2VuZXJhbC5kYXRhR2VuZXJhdG9yKF9pZCwgaW5wdXRWYWx1ZSk7XG4gICAgbGlzdC5pbnNlcnRCZWZvcmUoaXRlbUdlbmVyYXRvcihuZXdEYXRhKSwgbGlzdC5maXJzdENoaWxkKTsgLy8gcHVzaCBuZXdMaSB0byBmaXJzdFxuICAgIEdlbmVyYWwucmVzZXRJbnB1dCgpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3JlbW92ZVJhbmRvbShsaXN0KSB7XG4gICAgY29uc3QgbGlzdEl0ZW1zID0gbGlzdC5jaGlsZE5vZGVzO1xuXG4gICAgWy4uLmxpc3RJdGVtc10uZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgaWYgKGl0ZW0uY2xhc3NMaXN0LmNvbnRhaW5zKCdhcGhvcmlzbScpKSB7XG4gICAgICAgIGxpc3QucmVtb3ZlQ2hpbGQoaXRlbSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgLy8gb3IgdXNlIGZvci4uLmluXG4gIC8vIGZvciAoY29uc3QgaW5kZXggaW4gbGlzdEl0ZW1zKSB7XG4gIC8vICAgaWYgKGxpc3RJdGVtcy5oYXNPd25Qcm9wZXJ0eShpbmRleCkpIHtcbiAgLy8gICAgIGlmIChsaXN0SXRlbXNbaW5kZXhdLmNsYXNzTGlzdC5jb250YWlucygnYXBob3Jpc20nKSkge1xuICAvLyAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGxpc3RJdGVtc1tpbmRleF0pO1xuICAvLyAgICAgfVxuICAvLyAgIH1cbiAgLy8gfVxuXG4gIGZ1bmN0aW9uIGVudGVyQWRkKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgYWRkKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0FsbCgpIHtcbiAgICBjb25zdCBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgICBjb25zdCBsaXN0SXRlbXMgPSBsaXN0LmNoaWxkTm9kZXM7XG5cbiAgICBbLi4ubGlzdEl0ZW1zXS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICBfd2hldGhlckFwcGVhcihpdGVtLCB0cnVlKTtcbiAgICAgIGlmIChpdGVtLmNsYXNzTGlzdC5jb250YWlucygnZmluaXNoZWQnKSkge1xuICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGl0ZW0pO1xuICAgICAgICBsaXN0LmFwcGVuZENoaWxkKGl0ZW0pOyAvLyBQVU5DSExJTkU6IGRyb3AgZG9uZSBpdGVtXG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKiBlc2xpbnQtZGlzYWJsZSBuby1wYXJhbS1yZWFzc2lnbiAgKi9cbiAgZnVuY3Rpb24gX3doZXRoZXJBcHBlYXIoZWxlbWVudCwgd2hldGhlcikge1xuICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IHdoZXRoZXIgPyAnYmxvY2snIDogJ25vbmUnOyAvLyBGSVhNRTogZXNsaW50IGVycm9yXG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBuby1wYXJhbS1yZWFzc2lnbiAgKi9cblxuICBmdW5jdGlvbiBjbGlja0xpKGUpIHtcbiAgICBjb25zdCB0YXJnZXRMaSA9IGUudGFyZ2V0O1xuICAgIC8vIHVzZSBldmVudCBkZWxlZ2F0aW9uXG5cbiAgICBpZiAodGFyZ2V0TGkuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJykpIHtcbiAgICAgIHRhcmdldExpLmNsYXNzTGlzdC50b2dnbGUoJ2ZpbmlzaGVkJyk7XG4gICAgICBzaG93QWxsKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gbGkncyBbeF0ncyBkZWxldGVcbiAgZnVuY3Rpb24gcmVtb3ZlTGkoZSkge1xuICAgIGlmIChlLnRhcmdldC5jbGFzc05hbWUgPT09ICdjbG9zZScpIHsgLy8gdXNlIGV2ZW50IGRlbGVnYXRpb25cbiAgICAgIF9yZW1vdmVMaUhhbmRsZXIoZS50YXJnZXQpO1xuICAgICAgX2FkZFJhbmRvbSgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9yZW1vdmVMaUhhbmRsZXIoZWxlbWVudCkge1xuICAgIC8vIHVzZSBwcmV2aW91c2x5IHN0b3JlZCBkYXRhXG4gICAgY29uc3QgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgY29uc3QgbGlzdEl0ZW1zID0gbGlzdC5jaGlsZE5vZGVzO1xuICAgIGNvbnN0IGlkID0gZWxlbWVudC5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpO1xuXG4gICAgdHJ5IHtcbiAgICAgIFsuLi5saXN0SXRlbXNdLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgaWYgKGl0ZW0uZ2V0QXR0cmlidXRlKCdkYXRhLWlkJykgPT09IGlkKSB7XG4gICAgICAgICAgbGlzdC5yZW1vdmVDaGlsZChpdGVtKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdXcm9uZyBpZCwgbm90IGZvdW5kIGluIERPTSB0cmVlJyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9hZGRSYW5kb20oKSB7XG4gICAgY29uc3QgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG5cbiAgICBpZiAoIWxpc3QuaGFzQ2hpbGROb2RlcygpIHx8IF9hbGxEaXNhcHBlYXIobGlzdCkpIHtcbiAgICAgIFJlZnJlc2gucmFuZG9tKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX2FsbERpc2FwcGVhcihsaXN0KSB7XG4gICAgY29uc3QgbGlzdEl0ZW1zID0gbGlzdC5jaGlsZE5vZGVzO1xuXG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5ldmVyeS5jYWxsKGxpc3RJdGVtcywgaXRlbSA9PiBpdGVtLnN0eWxlLmRpc3BsYXkgPT09ICdub25lJyk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93SW5pdCgpIHtcbiAgICBSZWZyZXNoLmluaXQoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dEb25lKCkge1xuICAgIF9zaG93V2hldGhlckRvbmUodHJ1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93VG9kbygpIHtcbiAgICBfc2hvd1doZXRoZXJEb25lKGZhbHNlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zaG93V2hldGhlckRvbmUod2hldGhlckRvbmUpIHtcbiAgICBjb25zdCBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgICBjb25zdCBsaXN0SXRlbXMgPSBsaXN0LmNoaWxkTm9kZXM7XG5cbiAgICBfcmVtb3ZlUmFuZG9tKGxpc3QpO1xuICAgIFsuLi5saXN0SXRlbXNdLmZvckVhY2goKGl0ZW0pID0+IHsgLy8gRklYTUU6IGVzbGludCBlcnJvclxuICAgICAgaXRlbS5jbGFzc0xpc3QuY29udGFpbnMoJ2ZpbmlzaGVkJykgPyBfd2hldGhlckFwcGVhcihpdGVtLCB3aGV0aGVyRG9uZSkgOiBfd2hldGhlckFwcGVhcihpdGVtLCAhd2hldGhlckRvbmUpO1xuICAgIH0pO1xuICAgIF9hZGRSYW5kb20oKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dDbGVhckRvbmUoKSB7XG4gICAgY29uc3QgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgY29uc3QgbGlzdEl0ZW1zID0gbGlzdC5jaGlsZE5vZGVzO1xuXG4gICAgX3JlbW92ZVJhbmRvbShsaXN0KTtcbiAgICBbLi4ubGlzdEl0ZW1zXS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICBpZiAoaXRlbS5jbGFzc0xpc3QuY29udGFpbnMoJ2ZpbmlzaGVkJykpIHtcbiAgICAgICAgbGlzdC5yZW1vdmVDaGlsZChpdGVtKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBfYWRkUmFuZG9tKCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93Q2xlYXIoKSB7XG4gICAgUmVmcmVzaC5jbGVhcigpOyAvLyBjbGVhciBub2RlcyB2aXN1YWxseVxuICAgIFJlZnJlc2gucmFuZG9tKCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGFkZCxcbiAgICBlbnRlckFkZCxcbiAgICBjbGlja0xpLFxuICAgIHJlbW92ZUxpLFxuICAgIHNob3dJbml0LFxuICAgIHNob3dBbGwsXG4gICAgc2hvd0RvbmUsXG4gICAgc2hvd1RvZG8sXG4gICAgc2hvd0NsZWFyRG9uZSxcbiAgICBzaG93Q2xlYXIsXG4gIH07XG59KSgpO1xuXG5leHBvcnQgZGVmYXVsdCBldmVudHNIYW5kbGVyO1xuIiwiaW1wb3J0IEdlbmVyYWwgZnJvbSAnLi4vZGJHZW5lcmFsL3JlZnJlc2hHZW5lcmFsJztcblxuY29uc3QgUmVmcmVzaCA9ICgoKSA9PiB7XG4gIGZ1bmN0aW9uIHJhbmRvbUFwaG9yaXNtKCkge1xuICAgIGNvbnN0IGFwaG9yaXNtcyA9IFtcbiAgICAgICdZZXN0ZXJkYXkgWW91IFNhaWQgVG9tb3Jyb3cnLFxuICAgICAgJ1doeSBhcmUgd2UgaGVyZT8nLFxuICAgICAgJ0FsbCBpbiwgb3Igbm90aGluZycsXG4gICAgICAnWW91IE5ldmVyIFRyeSwgWW91IE5ldmVyIEtub3cnLFxuICAgICAgJ1RoZSB1bmV4YW1pbmVkIGxpZmUgaXMgbm90IHdvcnRoIGxpdmluZy4gLS0gU29jcmF0ZXMnLFxuICAgICAgJ1RoZXJlIGlzIG9ubHkgb25lIHRoaW5nIHdlIHNheSB0byBsYXp5OiBOT1QgVE9EQVknLFxuICAgIF07XG4gICAgY29uc3QgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcGhvcmlzbXMubGVuZ3RoKTtcbiAgICBjb25zdCB0ZXh0ID0gYXBob3Jpc21zW3JhbmRvbUluZGV4XTtcblxuICAgIEdlbmVyYWwuc2VudGVuY2VIYW5kbGVyKHRleHQpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpbml0OiBHZW5lcmFsLmluaXQsXG4gICAgY2xlYXI6IEdlbmVyYWwuY2xlYXIsXG4gICAgcmFuZG9tOiByYW5kb21BcGhvcmlzbSxcbiAgfTtcbn0pKCk7XG5cbmV4cG9ydCBkZWZhdWx0IFJlZnJlc2g7XG4iLCJmdW5jdGlvbiBhZGRFdmVudHNHZW5lcmF0b3IoaGFuZGxlcikge1xuICBoYW5kbGVyLnNob3dJbml0KCk7XG4gIC8vIGFkZCBhbGwgZXZlbnRMaXN0ZW5lclxuICBjb25zdCBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgbGlzdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuY2xpY2tMaSwgZmFsc2UpO1xuICBsaXN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5yZW1vdmVMaSwgZmFsc2UpO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlci5lbnRlckFkZCwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWRkJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLmFkZCwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0RvbmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0RvbmUsIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dUb2RvJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dUb2RvLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93QWxsJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dBbGwsIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dDbGVhckRvbmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0NsZWFyRG9uZSwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0NsZWFyJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dDbGVhciwgZmFsc2UpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBhZGRFdmVudHNHZW5lcmF0b3I7XG4iLCJpbXBvcnQgZ2V0Rm9ybWF0RGF0ZSBmcm9tICcuLi9nZXRGb3JtYXREYXRlJztcblxuY29uc3QgZXZlbnRzSGFuZGxlckdlbmVyYWwgPSAoKCkgPT4ge1xuICBmdW5jdGlvbiByZXNldElucHV0KCkge1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNpbnB1dCcpLnZhbHVlID0gJyc7XG4gIH1cblxuICBmdW5jdGlvbiBkYXRhR2VuZXJhdG9yKGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IGtleSxcbiAgICAgIGV2ZW50OiB2YWx1ZSxcbiAgICAgIGZpbmlzaGVkOiBmYWxzZSxcbiAgICAgIGRhdGU6IGdldEZvcm1hdERhdGUoJ01N5pyIZGTml6VoaDptbScpLFxuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHJlc2V0SW5wdXQsXG4gICAgZGF0YUdlbmVyYXRvcixcbiAgfTtcbn0pKCk7XG5cbmV4cG9ydCBkZWZhdWx0IGV2ZW50c0hhbmRsZXJHZW5lcmFsO1xuIiwiaW1wb3J0IGl0ZW1HZW5lcmF0b3IgZnJvbSAnLi4vdGVtcGxldGUvaXRlbUdlbmVyYXRvcic7XG5pbXBvcnQgc2VudGVuY2VHZW5lcmF0b3IgZnJvbSAnLi4vdGVtcGxldGUvc2VudGVuY2VHZW5lcmF0b3InO1xuaW1wb3J0IGNsZWFyQ2hpbGROb2RlcyBmcm9tICcuLi9jbGVhckNoaWxkTm9kZXMnO1xuXG5jb25zdCByZWZyZXNoR2VuZXJhbCA9ICgoKSA9PiB7XG4gIGZ1bmN0aW9uIGluaXQoZGF0YUFycikge1xuICAgIF9zaG93KGRhdGFBcnIsIF9pbml0U2VudGVuY2UsIF9yZW5kZXJBbGwpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3Nob3coZGF0YUFyciwgc2hvd1NlbnRlbmNlRnVuYywgZ2VuZXJhdGVGdW5jKSB7XG4gICAgaWYgKCFkYXRhQXJyIHx8IGRhdGFBcnIubGVuZ3RoID09PSAwKSB7XG4gICAgICBzaG93U2VudGVuY2VGdW5jKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuaW5uZXJIVE1MID0gZ2VuZXJhdGVGdW5jKGRhdGFBcnIpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9pbml0U2VudGVuY2UoKSB7XG4gICAgY29uc3QgdGV4dCA9ICdXZWxjb21lfiwgdHJ5IHRvIGFkZCB5b3VyIGZpcnN0IHRvLWRvIGxpc3QgOiApJztcblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuaW5uZXJIVE1MID0gc2VudGVuY2VHZW5lcmF0b3IodGV4dCk7XG4gIH1cblxuICBmdW5jdGlvbiBhbGwocmFuZG9tQXBob3Jpc20sIGRhdGFBcnIpIHtcbiAgICBfc2hvdyhkYXRhQXJyLCByYW5kb21BcGhvcmlzbSwgX3JlbmRlckFsbCk7XG4gIH1cblxuICBmdW5jdGlvbiBfcmVuZGVyQWxsKGRhdGFBcnIpIHtcbiAgICBjb25zdCBjbGFzc2lmaWVkRGF0YSA9IF9jbGFzc2lmeURhdGEoZGF0YUFycik7XG5cbiAgICByZXR1cm4gaXRlbUdlbmVyYXRvcihjbGFzc2lmaWVkRGF0YSk7XG4gIH1cblxuICBmdW5jdGlvbiBfY2xhc3NpZnlEYXRhKGRhdGFBcnIpIHtcbiAgICBjb25zdCBmaW5pc2hlZCA9IFtdO1xuICAgIGNvbnN0IHVuZmlzaGllZCA9IFtdO1xuXG4gICAgLy8gcHV0IHRoZSBmaW5pc2hlZCBpdGVtIHRvIHRoZSBib3R0b21cbiAgICBkYXRhQXJyLmZvckVhY2goZGF0YSA9PiAoZGF0YS5maW5pc2hlZCA/IGZpbmlzaGVkLnVuc2hpZnQoZGF0YSkgOiB1bmZpc2hpZWQudW5zaGlmdChkYXRhKSkpO1xuXG4gICAgcmV0dXJuIHVuZmlzaGllZC5jb25jYXQoZmluaXNoZWQpO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFydChyYW5kb21BcGhvcmlzbSwgZGF0YUFycikge1xuICAgIF9zaG93KGRhdGFBcnIsIHJhbmRvbUFwaG9yaXNtLCBfcmVuZGVyUGFydCk7XG4gIH1cblxuICBmdW5jdGlvbiBfcmVuZGVyUGFydChkYXRhQXJyKSB7XG4gICAgcmV0dXJuIGl0ZW1HZW5lcmF0b3IoZGF0YUFyci5yZXZlcnNlKCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgY2xlYXJDaGlsZE5vZGVzKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2VudGVuY2VIYW5kbGVyKHRleHQpIHtcbiAgICBjb25zdCByZW5kZXJlZCA9IHNlbnRlbmNlR2VuZXJhdG9yKHRleHQpO1xuXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5pbm5lckhUTUwgPSByZW5kZXJlZDtcbiAgfVxuXG5cbiAgcmV0dXJuIHtcbiAgICBpbml0LFxuICAgIGFsbCxcbiAgICBwYXJ0LFxuICAgIGNsZWFyLFxuICAgIHNlbnRlbmNlSGFuZGxlcixcbiAgfTtcbn0pKCk7XG5cbmV4cG9ydCBkZWZhdWx0IHJlZnJlc2hHZW5lcmFsO1xuIiwiZnVuY3Rpb24gZ2V0Rm9ybWF0RGF0ZShmbXQpIHtcbiAgY29uc3QgbmV3RGF0ZSA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IG8gPSB7XG4gICAgJ3krJzogbmV3RGF0ZS5nZXRGdWxsWWVhcigpLFxuICAgICdNKyc6IG5ld0RhdGUuZ2V0TW9udGgoKSArIDEsXG4gICAgJ2QrJzogbmV3RGF0ZS5nZXREYXRlKCksXG4gICAgJ2grJzogbmV3RGF0ZS5nZXRIb3VycygpLFxuICAgICdtKyc6IG5ld0RhdGUuZ2V0TWludXRlcygpLFxuICB9O1xuICBsZXQgbmV3Zm10ID0gZm10O1xuXG4gIE9iamVjdC5rZXlzKG8pLmZvckVhY2goKGspID0+IHtcbiAgICBpZiAobmV3IFJlZ0V4cChgKCR7a30pYCkudGVzdChuZXdmbXQpKSB7XG4gICAgICBpZiAoayA9PT0gJ3krJykge1xuICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChgJHtvW2tdfWApLnN1YnN0cig0IC0gUmVnRXhwLiQxLmxlbmd0aCkpO1xuICAgICAgfSBlbHNlIGlmIChrID09PSAnUysnKSB7XG4gICAgICAgIGxldCBsZW5zID0gUmVnRXhwLiQxLmxlbmd0aDtcbiAgICAgICAgbGVucyA9IGxlbnMgPT09IDEgPyAzIDogbGVucztcbiAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoYDAwJHtvW2tdfWApLnN1YnN0cigoYCR7b1trXX1gKS5sZW5ndGggLSAxLCBsZW5zKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChSZWdFeHAuJDEubGVuZ3RoID09PSAxKSA/IChvW2tdKSA6ICgoYDAwJHtvW2tdfWApLnN1YnN0cigoYCR7b1trXX1gKS5sZW5ndGgpKSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgLy8gZm9yIChjb25zdCBrIGluIG8pIHtcbiAgLy8gICBpZiAobmV3IFJlZ0V4cChgKCR7a30pYCkudGVzdChuZXdmbXQpKSB7XG4gIC8vICAgICBpZiAoayA9PT0gJ3krJykge1xuICAvLyAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChgJHtvW2tdfWApLnN1YnN0cig0IC0gUmVnRXhwLiQxLmxlbmd0aCkpO1xuICAvLyAgICAgfSBlbHNlIGlmIChrID09PSAnUysnKSB7XG4gIC8vICAgICAgIGxldCBsZW5zID0gUmVnRXhwLiQxLmxlbmd0aDtcbiAgLy8gICAgICAgbGVucyA9IGxlbnMgPT09IDEgPyAzIDogbGVucztcbiAgLy8gICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoYDAwJHtvW2tdfWApLnN1YnN0cigoYCR7b1trXX1gKS5sZW5ndGggLSAxLCBsZW5zKSk7XG4gIC8vICAgICB9IGVsc2Uge1xuICAvLyAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChSZWdFeHAuJDEubGVuZ3RoID09PSAxKSA/IChvW2tdKSA6ICgoYDAwJHtvW2tdfWApLnN1YnN0cigoYCR7b1trXX1gKS5sZW5ndGgpKSk7XG4gIC8vICAgICB9XG4gIC8vICAgfVxuICAvLyB9XG5cbiAgcmV0dXJuIG5ld2ZtdDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZ2V0Rm9ybWF0RGF0ZTtcbiIsImZ1bmN0aW9uIGl0ZW1HZW5lcmF0b3IoZGF0YUFycikge1xuICBjb25zdCB0ZW1wbGF0ZSA9IEhhbmRsZWJhcnMudGVtcGxhdGVzLmxpO1xuICBsZXQgcmVzdWx0ID0gZGF0YUFycjtcblxuICBpZiAoIUFycmF5LmlzQXJyYXkoZGF0YUFycikpIHtcbiAgICByZXN1bHQgPSBbZGF0YUFycl07XG4gIH1cbiAgY29uc3QgcmVuZGVyZWQgPSB0ZW1wbGF0ZSh7IGxpc3RJdGVtczogcmVzdWx0IH0pO1xuXG4gIHJldHVybiByZW5kZXJlZC50cmltKCk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGl0ZW1HZW5lcmF0b3I7XG4iLCJmdW5jdGlvbiBzZW50ZW5jZUdlbmVyYXRvcih0ZXh0KSB7XG4gIGNvbnN0IHRlbXBsYXRlID0gSGFuZGxlYmFycy50ZW1wbGF0ZXMubGk7XG4gIGNvbnN0IHJlbmRlcmVkID0gdGVtcGxhdGUoeyBzZW50ZW5jZTogdGV4dCB9KTtcblxuICByZXR1cm4gcmVuZGVyZWQudHJpbSgpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBzZW50ZW5jZUdlbmVyYXRvcjtcbiIsImltcG9ydCBhZGRFdmVudHMgZnJvbSAnLi91dGxpcy9kYkZhaWwvYWRkRXZlbnRzJztcblxuYWRkRXZlbnRzKCk7XG4iXX0=
