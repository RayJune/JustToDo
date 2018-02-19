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

  function clickLi(_ref) {
    var target = _ref.target;

    // use event delegation
    if (target.getAttribute('data-id')) {
      target.classList.toggle('finished');
      showAll();
    }
  }

  // li's [x]'s delete
  function removeLi(_ref2) {
    var target = _ref2.target;

    if (target.className === 'close') {
      // use event delegation
      _removeLiHandler(target);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9jbGVhckNoaWxkTm9kZXMuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkZhaWwvYWRkRXZlbnRzLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJGYWlsL2V2ZW50c0hhbmRsZXIuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkZhaWwvcmVmcmVzaC5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2RiR2VuZXJhbC9hZGRFdmVudHNHZW5lcmF0b3IuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkdlbmVyYWwvZXZlbnRzSGFuZGxlckdlbmVyYWwuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkdlbmVyYWwvcmVmcmVzaEdlbmVyYWwuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9nZXRGb3JtYXREYXRlLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvdGVtcGxldGUvaXRlbUdlbmVyYXRvci5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL3RlbXBsZXRlL3NlbnRlbmNlR2VuZXJhdG9yLmpzIiwic3JjL3NjcmlwdHMvd2l0aG91dERCLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7QUNBQSxTQUFTLGVBQVQsQ0FBeUIsSUFBekIsRUFBK0I7QUFDN0IsU0FBTyxLQUFLLGFBQUwsRUFBUCxFQUE2QjtBQUFFO0FBQzdCLFNBQUssV0FBTCxDQUFpQixLQUFLLFVBQXRCO0FBQ0Q7QUFDRDtBQUNEOztrQkFFYyxlOzs7Ozs7Ozs7QUNQZjs7OztBQUNBOzs7Ozs7QUFFQSxTQUFTLFNBQVQsR0FBcUI7QUFDbkIsU0FBTyxLQUFQLENBQWEsMkdBQWI7QUFDQTtBQUNEOztrQkFFYyxTOzs7Ozs7Ozs7QUNSZjs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7O0FBRUEsSUFBTSxnQkFBaUIsWUFBTTtBQUMzQixNQUFJLE1BQU0sQ0FBVixDQUQyQixDQUNkOztBQUViLFdBQVMsR0FBVCxH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QVMsQ0FBQyxPQUFELENBQVQ7QUFDRDtBQUNELE1BQU0sV0FBVyxTQUFTLEVBQUUsV0FBVyxNQUFiLEVBQVQsQ0FBakI7O0FBRUEsU0FBTyxTQUFTLElBQVQsRUFBUDtBQUNEOztrQkFFYyxhOzs7Ozs7OztBQ1pmLFNBQVMsaUJBQVQsQ0FBMkIsSUFBM0IsRUFBaUM7QUFDL0IsTUFBTSxXQUFXLFdBQVcsU0FBWCxDQUFxQixFQUF0QztBQUNBLE1BQU0sV0FBVyxTQUFTLEVBQUUsVUFBVSxJQUFaLEVBQVQsQ0FBakI7O0FBRUEsU0FBTyxTQUFTLElBQVQsRUFBUDtBQUNEOztrQkFFYyxpQjs7Ozs7QUNQZjs7Ozs7O0FBRUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZnVuY3Rpb24gY2xlYXJDaGlsZE5vZGVzKHJvb3QpIHtcbiAgd2hpbGUgKHJvb3QuaGFzQ2hpbGROb2RlcygpKSB7IC8vIG9yIHJvb3QuZmlyc3RDaGlsZCBvciByb290Lmxhc3RDaGlsZFxuICAgIHJvb3QucmVtb3ZlQ2hpbGQocm9vdC5maXJzdENoaWxkKTtcbiAgfVxuICAvLyBvciByb290LmlubmVySFRNTCA9ICcnXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsZWFyQ2hpbGROb2RlcztcbiIsImltcG9ydCBhZGRFdmVudHNHZW5lcmF0b3IgZnJvbSAnLi4vZGJHZW5lcmFsL2FkZEV2ZW50c0dlbmVyYXRvcic7XG5pbXBvcnQgZXZlbnRzSGFuZGxlciBmcm9tICcuLi9kYkZhaWwvZXZlbnRzSGFuZGxlcic7XG5cbmZ1bmN0aW9uIGFkZEV2ZW50cygpIHtcbiAgd2luZG93LmFsZXJ0KCdZb3VyIGJyb3dzZXIgZG9lc25cXCd0IHN1cHBvcnQgYSBzdGFibGUgdmVyc2lvbiBvZiBJbmRleGVkREIuIFdlIHdpbGwgb2ZmZXIgeW91IHRoZSB3aXRob3V0IGluZGV4ZWREQiBtb2RlJyk7XG4gIGFkZEV2ZW50c0dlbmVyYXRvcihldmVudHNIYW5kbGVyKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYWRkRXZlbnRzO1xuIiwiaW1wb3J0IFJlZnJlc2ggZnJvbSAnLi4vZGJGYWlsL3JlZnJlc2gnO1xuaW1wb3J0IEdlbmVyYWwgZnJvbSAnLi4vZGJHZW5lcmFsL2V2ZW50c0hhbmRsZXJHZW5lcmFsJztcbmltcG9ydCBpdGVtR2VuZXJhdG9yIGZyb20gJy4uL3RlbXBsZXRlL2l0ZW1HZW5lcmF0b3InO1xuXG5jb25zdCBldmVudHNIYW5kbGVyID0gKCgpID0+IHtcbiAgbGV0IF9pZCA9IDA7IC8vIHNvIHRoZSBmaXJzdCBpdGVtJ3MgaWQgaXMgMVxuXG4gIGZ1bmN0aW9uIGFkZCgpIHtcbiAgICBjb25zdCBpbnB1dFZhbHVlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWU7XG5cbiAgICBpZiAoaW5wdXRWYWx1ZSA9PT0gJycpIHtcbiAgICAgIHdpbmRvdy5hbGVydCgncGxlYXNlIGlucHV0IGEgcmVhbCBkYXRhficpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhZGRIYW5kbGVyKGlucHV0VmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZEhhbmRsZXIoaW5wdXRWYWx1ZSkge1xuICAgIGNvbnN0IGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gICAgX3JlbW92ZVJhbmRvbShsaXN0KTtcbiAgICBfaWQgKz0gMTtcbiAgICBjb25zdCBuZXdEYXRhID0gR2VuZXJhbC5kYXRhR2VuZXJhdG9yKF9pZCwgaW5wdXRWYWx1ZSk7XG4gICAgbGlzdC5pbnNlcnRCZWZvcmUoaXRlbUdlbmVyYXRvcihuZXdEYXRhKSwgbGlzdC5maXJzdENoaWxkKTsgLy8gcHVzaCBuZXdMaSB0byBmaXJzdFxuICAgIEdlbmVyYWwucmVzZXRJbnB1dCgpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3JlbW92ZVJhbmRvbShsaXN0KSB7XG4gICAgY29uc3QgbGlzdEl0ZW1zID0gbGlzdC5jaGlsZE5vZGVzO1xuXG4gICAgWy4uLmxpc3RJdGVtc10uZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgaWYgKGl0ZW0uY2xhc3NMaXN0LmNvbnRhaW5zKCdhcGhvcmlzbScpKSB7XG4gICAgICAgIGxpc3QucmVtb3ZlQ2hpbGQoaXRlbSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgLy8gb3IgdXNlIGZvci4uLmluXG4gIC8vIGZvciAoY29uc3QgaW5kZXggaW4gbGlzdEl0ZW1zKSB7XG4gIC8vICAgaWYgKGxpc3RJdGVtcy5oYXNPd25Qcm9wZXJ0eShpbmRleCkpIHtcbiAgLy8gICAgIGlmIChsaXN0SXRlbXNbaW5kZXhdLmNsYXNzTGlzdC5jb250YWlucygnYXBob3Jpc20nKSkge1xuICAvLyAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGxpc3RJdGVtc1tpbmRleF0pO1xuICAvLyAgICAgfVxuICAvLyAgIH1cbiAgLy8gfVxuXG4gIGZ1bmN0aW9uIGVudGVyQWRkKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgYWRkKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0FsbCgpIHtcbiAgICBjb25zdCBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgICBjb25zdCBsaXN0SXRlbXMgPSBsaXN0LmNoaWxkTm9kZXM7XG5cbiAgICBbLi4ubGlzdEl0ZW1zXS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICBfd2hldGhlckFwcGVhcihpdGVtLCB0cnVlKTtcbiAgICAgIGlmIChpdGVtLmNsYXNzTGlzdC5jb250YWlucygnZmluaXNoZWQnKSkge1xuICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGl0ZW0pO1xuICAgICAgICBsaXN0LmFwcGVuZENoaWxkKGl0ZW0pOyAvLyBQVU5DSExJTkU6IGRyb3AgZG9uZSBpdGVtXG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKiBlc2xpbnQtZGlzYWJsZSBuby1wYXJhbS1yZWFzc2lnbiAgKi9cbiAgZnVuY3Rpb24gX3doZXRoZXJBcHBlYXIoZWxlbWVudCwgd2hldGhlcikge1xuICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IHdoZXRoZXIgPyAnYmxvY2snIDogJ25vbmUnOyAvLyBGSVhNRTogZXNsaW50IGVycm9yXG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBuby1wYXJhbS1yZWFzc2lnbiAgKi9cblxuICBmdW5jdGlvbiBjbGlja0xpKHsgdGFyZ2V0IH0pIHtcbiAgICAvLyB1c2UgZXZlbnQgZGVsZWdhdGlvblxuICAgIGlmICh0YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJykpIHtcbiAgICAgIHRhcmdldC5jbGFzc0xpc3QudG9nZ2xlKCdmaW5pc2hlZCcpO1xuICAgICAgc2hvd0FsbCgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGxpJ3MgW3hdJ3MgZGVsZXRlXG4gIGZ1bmN0aW9uIHJlbW92ZUxpKHsgdGFyZ2V0IH0pIHtcbiAgICBpZiAodGFyZ2V0LmNsYXNzTmFtZSA9PT0gJ2Nsb3NlJykgeyAvLyB1c2UgZXZlbnQgZGVsZWdhdGlvblxuICAgICAgX3JlbW92ZUxpSGFuZGxlcih0YXJnZXQpO1xuICAgICAgX2FkZFJhbmRvbSgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9yZW1vdmVMaUhhbmRsZXIoZWxlbWVudCkge1xuICAgIC8vIHVzZSBwcmV2aW91c2x5IHN0b3JlZCBkYXRhXG4gICAgY29uc3QgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgY29uc3QgbGlzdEl0ZW1zID0gbGlzdC5jaGlsZE5vZGVzO1xuICAgIGNvbnN0IGlkID0gZWxlbWVudC5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpO1xuXG4gICAgdHJ5IHtcbiAgICAgIFsuLi5saXN0SXRlbXNdLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgaWYgKGl0ZW0uZ2V0QXR0cmlidXRlKCdkYXRhLWlkJykgPT09IGlkKSB7XG4gICAgICAgICAgbGlzdC5yZW1vdmVDaGlsZChpdGVtKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdXcm9uZyBpZCwgbm90IGZvdW5kIGluIERPTSB0cmVlJyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9hZGRSYW5kb20oKSB7XG4gICAgY29uc3QgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG5cbiAgICBpZiAoIWxpc3QuaGFzQ2hpbGROb2RlcygpIHx8IF9hbGxEaXNhcHBlYXIobGlzdCkpIHtcbiAgICAgIFJlZnJlc2gucmFuZG9tKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX2FsbERpc2FwcGVhcihsaXN0KSB7XG4gICAgY29uc3QgbGlzdEl0ZW1zID0gbGlzdC5jaGlsZE5vZGVzO1xuXG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5ldmVyeS5jYWxsKGxpc3RJdGVtcywgaXRlbSA9PiBpdGVtLnN0eWxlLmRpc3BsYXkgPT09ICdub25lJyk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93SW5pdCgpIHtcbiAgICBSZWZyZXNoLmluaXQoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dEb25lKCkge1xuICAgIF9zaG93V2hldGhlckRvbmUodHJ1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93VG9kbygpIHtcbiAgICBfc2hvd1doZXRoZXJEb25lKGZhbHNlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zaG93V2hldGhlckRvbmUod2hldGhlckRvbmUpIHtcbiAgICBjb25zdCBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgICBjb25zdCBsaXN0SXRlbXMgPSBsaXN0LmNoaWxkTm9kZXM7XG5cbiAgICBfcmVtb3ZlUmFuZG9tKGxpc3QpO1xuICAgIFsuLi5saXN0SXRlbXNdLmZvckVhY2goKGl0ZW0pID0+IHsgLy8gRklYTUU6IGVzbGludCBlcnJvclxuICAgICAgaXRlbS5jbGFzc0xpc3QuY29udGFpbnMoJ2ZpbmlzaGVkJykgPyBfd2hldGhlckFwcGVhcihpdGVtLCB3aGV0aGVyRG9uZSkgOiBfd2hldGhlckFwcGVhcihpdGVtLCAhd2hldGhlckRvbmUpO1xuICAgIH0pO1xuICAgIF9hZGRSYW5kb20oKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dDbGVhckRvbmUoKSB7XG4gICAgY29uc3QgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgY29uc3QgbGlzdEl0ZW1zID0gbGlzdC5jaGlsZE5vZGVzO1xuXG4gICAgX3JlbW92ZVJhbmRvbShsaXN0KTtcbiAgICBbLi4ubGlzdEl0ZW1zXS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICBpZiAoaXRlbS5jbGFzc0xpc3QuY29udGFpbnMoJ2ZpbmlzaGVkJykpIHtcbiAgICAgICAgbGlzdC5yZW1vdmVDaGlsZChpdGVtKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBfYWRkUmFuZG9tKCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93Q2xlYXIoKSB7XG4gICAgUmVmcmVzaC5jbGVhcigpOyAvLyBjbGVhciBub2RlcyB2aXN1YWxseVxuICAgIFJlZnJlc2gucmFuZG9tKCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGFkZCxcbiAgICBlbnRlckFkZCxcbiAgICBjbGlja0xpLFxuICAgIHJlbW92ZUxpLFxuICAgIHNob3dJbml0LFxuICAgIHNob3dBbGwsXG4gICAgc2hvd0RvbmUsXG4gICAgc2hvd1RvZG8sXG4gICAgc2hvd0NsZWFyRG9uZSxcbiAgICBzaG93Q2xlYXIsXG4gIH07XG59KSgpO1xuXG5leHBvcnQgZGVmYXVsdCBldmVudHNIYW5kbGVyO1xuIiwiaW1wb3J0IEdlbmVyYWwgZnJvbSAnLi4vZGJHZW5lcmFsL3JlZnJlc2hHZW5lcmFsJztcblxuY29uc3QgUmVmcmVzaCA9ICgoKSA9PiB7XG4gIGZ1bmN0aW9uIHJhbmRvbUFwaG9yaXNtKCkge1xuICAgIGNvbnN0IGFwaG9yaXNtcyA9IFtcbiAgICAgICdZZXN0ZXJkYXkgWW91IFNhaWQgVG9tb3Jyb3cnLFxuICAgICAgJ1doeSBhcmUgd2UgaGVyZT8nLFxuICAgICAgJ0FsbCBpbiwgb3Igbm90aGluZycsXG4gICAgICAnWW91IE5ldmVyIFRyeSwgWW91IE5ldmVyIEtub3cnLFxuICAgICAgJ1RoZSB1bmV4YW1pbmVkIGxpZmUgaXMgbm90IHdvcnRoIGxpdmluZy4gLS0gU29jcmF0ZXMnLFxuICAgICAgJ1RoZXJlIGlzIG9ubHkgb25lIHRoaW5nIHdlIHNheSB0byBsYXp5OiBOT1QgVE9EQVknLFxuICAgIF07XG4gICAgY29uc3QgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcGhvcmlzbXMubGVuZ3RoKTtcbiAgICBjb25zdCB0ZXh0ID0gYXBob3Jpc21zW3JhbmRvbUluZGV4XTtcblxuICAgIEdlbmVyYWwuc2VudGVuY2VIYW5kbGVyKHRleHQpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpbml0OiBHZW5lcmFsLmluaXQsXG4gICAgY2xlYXI6IEdlbmVyYWwuY2xlYXIsXG4gICAgcmFuZG9tOiByYW5kb21BcGhvcmlzbSxcbiAgfTtcbn0pKCk7XG5cbmV4cG9ydCBkZWZhdWx0IFJlZnJlc2g7XG4iLCJmdW5jdGlvbiBhZGRFdmVudHNHZW5lcmF0b3IoaGFuZGxlcikge1xuICBoYW5kbGVyLnNob3dJbml0KCk7XG4gIC8vIGFkZCBhbGwgZXZlbnRMaXN0ZW5lclxuICBjb25zdCBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcblxuICBsaXN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5jbGlja0xpLCBmYWxzZSk7XG4gIGxpc3QuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnJlbW92ZUxpLCBmYWxzZSk7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVyLmVudGVyQWRkLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhZGQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuYWRkLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93RG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93RG9uZSwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd1RvZG8nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd1RvZG8sIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dBbGwnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0FsbCwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0NsZWFyRG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93Q2xlYXJEb25lLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93Q2xlYXInKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0NsZWFyLCBmYWxzZSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFkZEV2ZW50c0dlbmVyYXRvcjtcbiIsImltcG9ydCBnZXRGb3JtYXREYXRlIGZyb20gJy4uL2dldEZvcm1hdERhdGUnO1xuXG5jb25zdCBldmVudHNIYW5kbGVyR2VuZXJhbCA9ICgoKSA9PiB7XG4gIGZ1bmN0aW9uIHJlc2V0SW5wdXQoKSB7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWUgPSAnJztcbiAgfVxuXG4gIGZ1bmN0aW9uIGRhdGFHZW5lcmF0b3Ioa2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiB7XG4gICAgICBpZDoga2V5LFxuICAgICAgZXZlbnQ6IHZhbHVlLFxuICAgICAgZmluaXNoZWQ6IGZhbHNlLFxuICAgICAgZGF0ZTogZ2V0Rm9ybWF0RGF0ZSgnTU3mnIhkZOaXpWhoOm1tJyksXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcmVzZXRJbnB1dCxcbiAgICBkYXRhR2VuZXJhdG9yLFxuICB9O1xufSkoKTtcblxuZXhwb3J0IGRlZmF1bHQgZXZlbnRzSGFuZGxlckdlbmVyYWw7XG4iLCJpbXBvcnQgaXRlbUdlbmVyYXRvciBmcm9tICcuLi90ZW1wbGV0ZS9pdGVtR2VuZXJhdG9yJztcbmltcG9ydCBzZW50ZW5jZUdlbmVyYXRvciBmcm9tICcuLi90ZW1wbGV0ZS9zZW50ZW5jZUdlbmVyYXRvcic7XG5pbXBvcnQgY2xlYXJDaGlsZE5vZGVzIGZyb20gJy4uL2NsZWFyQ2hpbGROb2Rlcyc7XG5cbmNvbnN0IHJlZnJlc2hHZW5lcmFsID0gKCgpID0+IHtcbiAgZnVuY3Rpb24gaW5pdChkYXRhQXJyKSB7XG4gICAgX3Nob3coZGF0YUFyciwgX2luaXRTZW50ZW5jZSwgX3JlbmRlckFsbCk7XG4gIH1cblxuICBmdW5jdGlvbiBfc2hvdyhkYXRhQXJyLCBzaG93U2VudGVuY2VGdW5jLCBnZW5lcmF0ZUZ1bmMpIHtcbiAgICBpZiAoIWRhdGFBcnIgfHwgZGF0YUFyci5sZW5ndGggPT09IDApIHtcbiAgICAgIHNob3dTZW50ZW5jZUZ1bmMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5pbm5lckhUTUwgPSBnZW5lcmF0ZUZ1bmMoZGF0YUFycik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX2luaXRTZW50ZW5jZSgpIHtcbiAgICBjb25zdCB0ZXh0ID0gJ1dlbGNvbWV+LCB0cnkgdG8gYWRkIHlvdXIgZmlyc3QgdG8tZG8gbGlzdCA6ICknO1xuXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5pbm5lckhUTUwgPSBzZW50ZW5jZUdlbmVyYXRvcih0ZXh0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFsbChyYW5kb21BcGhvcmlzbSwgZGF0YUFycikge1xuICAgIF9zaG93KGRhdGFBcnIsIHJhbmRvbUFwaG9yaXNtLCBfcmVuZGVyQWxsKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9yZW5kZXJBbGwoZGF0YUFycikge1xuICAgIGNvbnN0IGNsYXNzaWZpZWREYXRhID0gX2NsYXNzaWZ5RGF0YShkYXRhQXJyKTtcblxuICAgIHJldHVybiBpdGVtR2VuZXJhdG9yKGNsYXNzaWZpZWREYXRhKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9jbGFzc2lmeURhdGEoZGF0YUFycikge1xuICAgIGNvbnN0IGZpbmlzaGVkID0gW107XG4gICAgY29uc3QgdW5maXNoaWVkID0gW107XG5cbiAgICAvLyBwdXQgdGhlIGZpbmlzaGVkIGl0ZW0gdG8gdGhlIGJvdHRvbVxuICAgIGRhdGFBcnIuZm9yRWFjaChkYXRhID0+IChkYXRhLmZpbmlzaGVkID8gZmluaXNoZWQudW5zaGlmdChkYXRhKSA6IHVuZmlzaGllZC51bnNoaWZ0KGRhdGEpKSk7XG5cbiAgICByZXR1cm4gdW5maXNoaWVkLmNvbmNhdChmaW5pc2hlZCk7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJ0KHJhbmRvbUFwaG9yaXNtLCBkYXRhQXJyKSB7XG4gICAgX3Nob3coZGF0YUFyciwgcmFuZG9tQXBob3Jpc20sIF9yZW5kZXJQYXJ0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9yZW5kZXJQYXJ0KGRhdGFBcnIpIHtcbiAgICByZXR1cm4gaXRlbUdlbmVyYXRvcihkYXRhQXJyLnJldmVyc2UoKSk7XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICBjbGVhckNoaWxkTm9kZXMoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKSk7XG4gIH1cblxuICBmdW5jdGlvbiBzZW50ZW5jZUhhbmRsZXIodGV4dCkge1xuICAgIGNvbnN0IHJlbmRlcmVkID0gc2VudGVuY2VHZW5lcmF0b3IodGV4dCk7XG5cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmlubmVySFRNTCA9IHJlbmRlcmVkO1xuICB9XG5cblxuICByZXR1cm4ge1xuICAgIGluaXQsXG4gICAgYWxsLFxuICAgIHBhcnQsXG4gICAgY2xlYXIsXG4gICAgc2VudGVuY2VIYW5kbGVyLFxuICB9O1xufSkoKTtcblxuZXhwb3J0IGRlZmF1bHQgcmVmcmVzaEdlbmVyYWw7XG4iLCJmdW5jdGlvbiBnZXRGb3JtYXREYXRlKGZtdCkge1xuICBjb25zdCBuZXdEYXRlID0gbmV3IERhdGUoKTtcbiAgY29uc3QgbyA9IHtcbiAgICAneSsnOiBuZXdEYXRlLmdldEZ1bGxZZWFyKCksXG4gICAgJ00rJzogbmV3RGF0ZS5nZXRNb250aCgpICsgMSxcbiAgICAnZCsnOiBuZXdEYXRlLmdldERhdGUoKSxcbiAgICAnaCsnOiBuZXdEYXRlLmdldEhvdXJzKCksXG4gICAgJ20rJzogbmV3RGF0ZS5nZXRNaW51dGVzKCksXG4gIH07XG4gIGxldCBuZXdmbXQgPSBmbXQ7XG5cbiAgT2JqZWN0LmtleXMobykuZm9yRWFjaCgoaykgPT4ge1xuICAgIGlmIChuZXcgUmVnRXhwKGAoJHtrfSlgKS50ZXN0KG5ld2ZtdCkpIHtcbiAgICAgIGlmIChrID09PSAneSsnKSB7XG4gICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKGAke29ba119YCkuc3Vic3RyKDQgLSBSZWdFeHAuJDEubGVuZ3RoKSk7XG4gICAgICB9IGVsc2UgaWYgKGsgPT09ICdTKycpIHtcbiAgICAgICAgbGV0IGxlbnMgPSBSZWdFeHAuJDEubGVuZ3RoO1xuICAgICAgICBsZW5zID0gbGVucyA9PT0gMSA/IDMgOiBsZW5zO1xuICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChgMDAke29ba119YCkuc3Vic3RyKChgJHtvW2tdfWApLmxlbmd0aCAtIDEsIGxlbnMpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKFJlZ0V4cC4kMS5sZW5ndGggPT09IDEpID8gKG9ba10pIDogKChgMDAke29ba119YCkuc3Vic3RyKChgJHtvW2tdfWApLmxlbmd0aCkpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICAvLyBmb3IgKGNvbnN0IGsgaW4gbykge1xuICAvLyAgIGlmIChuZXcgUmVnRXhwKGAoJHtrfSlgKS50ZXN0KG5ld2ZtdCkpIHtcbiAgLy8gICAgIGlmIChrID09PSAneSsnKSB7XG4gIC8vICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKGAke29ba119YCkuc3Vic3RyKDQgLSBSZWdFeHAuJDEubGVuZ3RoKSk7XG4gIC8vICAgICB9IGVsc2UgaWYgKGsgPT09ICdTKycpIHtcbiAgLy8gICAgICAgbGV0IGxlbnMgPSBSZWdFeHAuJDEubGVuZ3RoO1xuICAvLyAgICAgICBsZW5zID0gbGVucyA9PT0gMSA/IDMgOiBsZW5zO1xuICAvLyAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChgMDAke29ba119YCkuc3Vic3RyKChgJHtvW2tdfWApLmxlbmd0aCAtIDEsIGxlbnMpKTtcbiAgLy8gICAgIH0gZWxzZSB7XG4gIC8vICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKFJlZ0V4cC4kMS5sZW5ndGggPT09IDEpID8gKG9ba10pIDogKChgMDAke29ba119YCkuc3Vic3RyKChgJHtvW2tdfWApLmxlbmd0aCkpKTtcbiAgLy8gICAgIH1cbiAgLy8gICB9XG4gIC8vIH1cblxuICByZXR1cm4gbmV3Zm10O1xufVxuXG5leHBvcnQgZGVmYXVsdCBnZXRGb3JtYXREYXRlO1xuIiwiZnVuY3Rpb24gaXRlbUdlbmVyYXRvcihkYXRhQXJyKSB7XG4gIGNvbnN0IHRlbXBsYXRlID0gSGFuZGxlYmFycy50ZW1wbGF0ZXMubGk7XG4gIGxldCByZXN1bHQgPSBkYXRhQXJyO1xuXG4gIGlmICghQXJyYXkuaXNBcnJheShkYXRhQXJyKSkge1xuICAgIHJlc3VsdCA9IFtkYXRhQXJyXTtcbiAgfVxuICBjb25zdCByZW5kZXJlZCA9IHRlbXBsYXRlKHsgbGlzdEl0ZW1zOiByZXN1bHQgfSk7XG5cbiAgcmV0dXJuIHJlbmRlcmVkLnRyaW0oKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgaXRlbUdlbmVyYXRvcjtcbiIsImZ1bmN0aW9uIHNlbnRlbmNlR2VuZXJhdG9yKHRleHQpIHtcbiAgY29uc3QgdGVtcGxhdGUgPSBIYW5kbGViYXJzLnRlbXBsYXRlcy5saTtcbiAgY29uc3QgcmVuZGVyZWQgPSB0ZW1wbGF0ZSh7IHNlbnRlbmNlOiB0ZXh0IH0pO1xuXG4gIHJldHVybiByZW5kZXJlZC50cmltKCk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHNlbnRlbmNlR2VuZXJhdG9yO1xuIiwiaW1wb3J0IGFkZEV2ZW50cyBmcm9tICcuL3V0bGlzL2RiRmFpbC9hZGRFdmVudHMnO1xuXG5hZGRFdmVudHMoKTtcbiJdfQ==
