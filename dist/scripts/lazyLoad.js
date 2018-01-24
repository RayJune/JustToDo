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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9jbGVhckNoaWxkTm9kZXMuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkZhaWwvYWRkRXZlbnRzLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJGYWlsL2V2ZW50c0hhbmRsZXIuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkZhaWwvcmVmcmVzaC5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2RiR2VuZXJhbC9hZGRFdmVudHNHZW5lcmF0b3IuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkdlbmVyYWwvZXZlbnRzSGFuZGxlckdlbmVyYWwuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkdlbmVyYWwvcmVmcmVzaEdlbmVyYWwuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9nZXRGb3JtYXREYXRlLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvdGVtcGxldGUvaXRlbUdlbmVyYXRvci5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL3RlbXBsZXRlL3NlbnRlbmNlR2VuZXJhdG9yLmpzIiwic3JjL3NjcmlwdHMvd2l0aG91dERCLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7QUNBQSxTQUFTLGVBQVQsQ0FBeUIsSUFBekIsRUFBK0I7QUFDN0IsU0FBTyxLQUFLLGFBQUwsRUFBUCxFQUE2QjtBQUFFO0FBQzdCLFNBQUssV0FBTCxDQUFpQixLQUFLLFVBQXRCO0FBQ0Q7QUFDRDtBQUNEOztrQkFFYyxlOzs7Ozs7Ozs7QUNQZjs7OztBQUNBOzs7Ozs7QUFFQSxTQUFTLFNBQVQsR0FBcUI7QUFDbkIsU0FBTyxLQUFQLENBQWEsMkdBQWI7QUFDQTtBQUNEOztrQkFFYyxTOzs7Ozs7Ozs7QUNSZjs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7O0FBRUEsSUFBTSxnQkFBaUIsWUFBTTtBQUMzQixNQUFJLE1BQU0sQ0FBVixDQUQyQixDQUNkOztBQUViLFdBQVMsR0FBVCxH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RUFBNkI7QUFDM0IsYUFBUyxDQUFDLE9BQUQsQ0FBVDtBQUNEO0FBQ0QsTUFBTSxXQUFXLFNBQVMsRUFBRSxXQUFXLE1BQWIsRUFBVCxDQUFqQjs7QUFFQSxTQUFPLFNBQVMsSUFBVCxFQUFQO0FBQ0Q7O2tCQUVjLGE7Ozs7Ozs7O0FDWmYsU0FBUyxpQkFBVCxDQUEyQixJQUEzQixFQUFpQztBQUMvQixNQUFNLFdBQVcsV0FBVyxTQUFYLENBQXFCLEVBQXRDO0FBQ0EsTUFBTSxXQUFXLFNBQVMsRUFBRSxVQUFVLElBQVosRUFBVCxDQUFqQjs7QUFFQSxTQUFPLFNBQVMsSUFBVCxFQUFQO0FBQ0Q7O2tCQUVjLGlCOzs7OztBQ1BmOzs7Ozs7QUFFQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJmdW5jdGlvbiBjbGVhckNoaWxkTm9kZXMocm9vdCkge1xuICB3aGlsZSAocm9vdC5oYXNDaGlsZE5vZGVzKCkpIHsgLy8gb3Igcm9vdC5maXJzdENoaWxkIG9yIHJvb3QubGFzdENoaWxkXG4gICAgcm9vdC5yZW1vdmVDaGlsZChyb290LmZpcnN0Q2hpbGQpO1xuICB9XG4gIC8vIG9yIHJvb3QuaW5uZXJIVE1MID0gJydcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xlYXJDaGlsZE5vZGVzO1xuIiwiaW1wb3J0IGFkZEV2ZW50c0dlbmVyYXRvciBmcm9tICcuLi9kYkdlbmVyYWwvYWRkRXZlbnRzR2VuZXJhdG9yJztcbmltcG9ydCBldmVudHNIYW5kbGVyIGZyb20gJy4uL2RiRmFpbC9ldmVudHNIYW5kbGVyJztcblxuZnVuY3Rpb24gYWRkRXZlbnRzKCkge1xuICB3aW5kb3cuYWxlcnQoJ1lvdXIgYnJvd3NlciBkb2VzblxcJ3Qgc3VwcG9ydCBhIHN0YWJsZSB2ZXJzaW9uIG9mIEluZGV4ZWREQi4gV2Ugd2lsbCBvZmZlciB5b3UgdGhlIHdpdGhvdXQgaW5kZXhlZERCIG1vZGUnKTtcbiAgYWRkRXZlbnRzR2VuZXJhdG9yKGV2ZW50c0hhbmRsZXIpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBhZGRFdmVudHM7XG4iLCJpbXBvcnQgUmVmcmVzaCBmcm9tICcuLi9kYkZhaWwvcmVmcmVzaCc7XG5pbXBvcnQgR2VuZXJhbCBmcm9tICcuLi9kYkdlbmVyYWwvZXZlbnRzSGFuZGxlckdlbmVyYWwnO1xuaW1wb3J0IGl0ZW1HZW5lcmF0b3IgZnJvbSAnLi4vdGVtcGxldGUvaXRlbUdlbmVyYXRvcic7XG5cbmNvbnN0IGV2ZW50c0hhbmRsZXIgPSAoKCkgPT4ge1xuICBsZXQgX2lkID0gMDsgLy8gc28gdGhlIGZpcnN0IGl0ZW0ncyBpZCBpcyAxXG5cbiAgZnVuY3Rpb24gYWRkKCkge1xuICAgIGNvbnN0IGlucHV0VmFsdWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5wdXQnKS52YWx1ZTtcblxuICAgIGlmIChpbnB1dFZhbHVlID09PSAnJykge1xuICAgICAgd2luZG93LmFsZXJ0KCdwbGVhc2UgaW5wdXQgYSByZWFsIGRhdGF+Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFkZEhhbmRsZXIoaW5wdXRWYWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYWRkSGFuZGxlcihpbnB1dFZhbHVlKSB7XG4gICAgY29uc3QgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG5cbiAgICBfcmVtb3ZlUmFuZG9tKGxpc3QpO1xuICAgIF9pZCArPSAxO1xuICAgIGNvbnN0IG5ld0RhdGEgPSBHZW5lcmFsLmRhdGFHZW5lcmF0b3IoX2lkLCBpbnB1dFZhbHVlKTtcbiAgICBsaXN0Lmluc2VydEJlZm9yZShpdGVtR2VuZXJhdG9yKG5ld0RhdGEpLCBsaXN0LmZpcnN0Q2hpbGQpOyAvLyBwdXNoIG5ld0xpIHRvIGZpcnN0XG4gICAgR2VuZXJhbC5yZXNldElucHV0KCk7XG4gIH1cblxuICBmdW5jdGlvbiBfcmVtb3ZlUmFuZG9tKGxpc3QpIHtcbiAgICBjb25zdCBsaXN0SXRlbXMgPSBsaXN0LmNoaWxkTm9kZXM7XG5cbiAgICBbLi4ubGlzdEl0ZW1zXS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICBpZiAoaXRlbS5jbGFzc0xpc3QuY29udGFpbnMoJ2FwaG9yaXNtJykpIHtcbiAgICAgICAgbGlzdC5yZW1vdmVDaGlsZChpdGVtKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICAvLyBvciB1c2UgZm9yLi4uaW5cbiAgLy8gZm9yIChjb25zdCBpbmRleCBpbiBsaXN0SXRlbXMpIHtcbiAgLy8gICBpZiAobGlzdEl0ZW1zLmhhc093blByb3BlcnR5KGluZGV4KSkge1xuICAvLyAgICAgaWYgKGxpc3RJdGVtc1tpbmRleF0uY2xhc3NMaXN0LmNvbnRhaW5zKCdhcGhvcmlzbScpKSB7XG4gIC8vICAgICAgIGxpc3QucmVtb3ZlQ2hpbGQobGlzdEl0ZW1zW2luZGV4XSk7XG4gIC8vICAgICB9XG4gIC8vICAgfVxuICAvLyB9XG5cbiAgZnVuY3Rpb24gZW50ZXJBZGQoZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzKSB7XG4gICAgICBhZGQoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzaG93QWxsKCkge1xuICAgIGNvbnN0IGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgIGNvbnN0IGxpc3RJdGVtcyA9IGxpc3QuY2hpbGROb2RlcztcblxuICAgIFsuLi5saXN0SXRlbXNdLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgIF93aGV0aGVyQXBwZWFyKGl0ZW0sIHRydWUpO1xuICAgICAgaWYgKGl0ZW0uY2xhc3NMaXN0LmNvbnRhaW5zKCdmaW5pc2hlZCcpKSB7XG4gICAgICAgIGxpc3QucmVtb3ZlQ2hpbGQoaXRlbSk7XG4gICAgICAgIGxpc3QuYXBwZW5kQ2hpbGQoaXRlbSk7IC8vIFBVTkNITElORTogZHJvcCBkb25lIGl0ZW1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qIGVzbGludC1kaXNhYmxlIG5vLXBhcmFtLXJlYXNzaWduICAqL1xuICBmdW5jdGlvbiBfd2hldGhlckFwcGVhcihlbGVtZW50LCB3aGV0aGVyKSB7XG4gICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gd2hldGhlciA/ICdibG9jaycgOiAnbm9uZSc7IC8vIEZJWE1FOiBlc2xpbnQgZXJyb3JcbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIG5vLXBhcmFtLXJlYXNzaWduICAqL1xuXG4gIGZ1bmN0aW9uIGNsaWNrTGkoZSkge1xuICAgIGNvbnN0IHRhcmdldExpID0gZS50YXJnZXQ7XG4gICAgLy8gdXNlIGV2ZW50IGRlbGVnYXRpb25cblxuICAgIGlmICh0YXJnZXRMaS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSkge1xuICAgICAgdGFyZ2V0TGkuY2xhc3NMaXN0LnRvZ2dsZSgnZmluaXNoZWQnKTtcbiAgICAgIHNob3dBbGwoKTtcbiAgICB9XG4gIH1cblxuICAvLyBsaSdzIFt4XSdzIGRlbGV0ZVxuICBmdW5jdGlvbiByZW1vdmVMaShlKSB7XG4gICAgaWYgKGUudGFyZ2V0LmNsYXNzTmFtZSA9PT0gJ2Nsb3NlJykgeyAvLyB1c2UgZXZlbnQgZGVsZWdhdGlvblxuICAgICAgX3JlbW92ZUxpSGFuZGxlcihlLnRhcmdldCk7XG4gICAgICBfYWRkUmFuZG9tKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX3JlbW92ZUxpSGFuZGxlcihlbGVtZW50KSB7XG4gICAgLy8gdXNlIHByZXZpb3VzbHkgc3RvcmVkIGRhdGFcbiAgICBjb25zdCBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgICBjb25zdCBsaXN0SXRlbXMgPSBsaXN0LmNoaWxkTm9kZXM7XG4gICAgY29uc3QgaWQgPSBlbGVtZW50LnBhcmVudE5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyk7XG5cbiAgICB0cnkge1xuICAgICAgWy4uLmxpc3RJdGVtc10uZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICBpZiAoaXRlbS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSA9PT0gaWQpIHtcbiAgICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGl0ZW0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5sb2coJ1dyb25nIGlkLCBub3QgZm91bmQgaW4gRE9NIHRyZWUnKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX2FkZFJhbmRvbSgpIHtcbiAgICBjb25zdCBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcblxuICAgIGlmICghbGlzdC5oYXNDaGlsZE5vZGVzKCkgfHwgX2FsbERpc2FwcGVhcihsaXN0KSkge1xuICAgICAgUmVmcmVzaC5yYW5kb20oKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfYWxsRGlzYXBwZWFyKGxpc3QpIHtcbiAgICBjb25zdCBsaXN0SXRlbXMgPSBsaXN0LmNoaWxkTm9kZXM7XG5cbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmV2ZXJ5LmNhbGwobGlzdEl0ZW1zLCBpdGVtID0+IGl0ZW0uc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dJbml0KCkge1xuICAgIFJlZnJlc2guaW5pdCgpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0RvbmUoKSB7XG4gICAgX3Nob3dXaGV0aGVyRG9uZSh0cnVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dUb2RvKCkge1xuICAgIF9zaG93V2hldGhlckRvbmUoZmFsc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3Nob3dXaGV0aGVyRG9uZSh3aGV0aGVyRG9uZSkge1xuICAgIGNvbnN0IGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgIGNvbnN0IGxpc3RJdGVtcyA9IGxpc3QuY2hpbGROb2RlcztcblxuICAgIF9yZW1vdmVSYW5kb20obGlzdCk7XG4gICAgWy4uLmxpc3RJdGVtc10uZm9yRWFjaCgoaXRlbSkgPT4geyAvLyBGSVhNRTogZXNsaW50IGVycm9yXG4gICAgICBpdGVtLmNsYXNzTGlzdC5jb250YWlucygnZmluaXNoZWQnKSA/IF93aGV0aGVyQXBwZWFyKGl0ZW0sIHdoZXRoZXJEb25lKSA6IF93aGV0aGVyQXBwZWFyKGl0ZW0sICF3aGV0aGVyRG9uZSk7XG4gICAgfSk7XG4gICAgX2FkZFJhbmRvbSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0NsZWFyRG9uZSgpIHtcbiAgICBjb25zdCBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgICBjb25zdCBsaXN0SXRlbXMgPSBsaXN0LmNoaWxkTm9kZXM7XG5cbiAgICBfcmVtb3ZlUmFuZG9tKGxpc3QpO1xuICAgIFsuLi5saXN0SXRlbXNdLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgIGlmIChpdGVtLmNsYXNzTGlzdC5jb250YWlucygnZmluaXNoZWQnKSkge1xuICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGl0ZW0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIF9hZGRSYW5kb20oKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dDbGVhcigpIHtcbiAgICBSZWZyZXNoLmNsZWFyKCk7IC8vIGNsZWFyIG5vZGVzIHZpc3VhbGx5XG4gICAgUmVmcmVzaC5yYW5kb20oKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYWRkLFxuICAgIGVudGVyQWRkLFxuICAgIGNsaWNrTGksXG4gICAgcmVtb3ZlTGksXG4gICAgc2hvd0luaXQsXG4gICAgc2hvd0FsbCxcbiAgICBzaG93RG9uZSxcbiAgICBzaG93VG9kbyxcbiAgICBzaG93Q2xlYXJEb25lLFxuICAgIHNob3dDbGVhcixcbiAgfTtcbn0pKCk7XG5cbmV4cG9ydCBkZWZhdWx0IGV2ZW50c0hhbmRsZXI7XG4iLCJpbXBvcnQgR2VuZXJhbCBmcm9tICcuLi9kYkdlbmVyYWwvcmVmcmVzaEdlbmVyYWwnO1xuXG5jb25zdCBSZWZyZXNoID0gKCgpID0+IHtcbiAgZnVuY3Rpb24gcmFuZG9tQXBob3Jpc20oKSB7XG4gICAgY29uc3QgYXBob3Jpc21zID0gW1xuICAgICAgJ1llc3RlcmRheSBZb3UgU2FpZCBUb21vcnJvdycsXG4gICAgICAnV2h5IGFyZSB3ZSBoZXJlPycsXG4gICAgICAnQWxsIGluLCBvciBub3RoaW5nJyxcbiAgICAgICdZb3UgTmV2ZXIgVHJ5LCBZb3UgTmV2ZXIgS25vdycsXG4gICAgICAnVGhlIHVuZXhhbWluZWQgbGlmZSBpcyBub3Qgd29ydGggbGl2aW5nLiAtLSBTb2NyYXRlcycsXG4gICAgICAnVGhlcmUgaXMgb25seSBvbmUgdGhpbmcgd2Ugc2F5IHRvIGxhenk6IE5PVCBUT0RBWScsXG4gICAgXTtcbiAgICBjb25zdCByYW5kb21JbmRleCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFwaG9yaXNtcy5sZW5ndGgpO1xuICAgIGNvbnN0IHRleHQgPSBhcGhvcmlzbXNbcmFuZG9tSW5kZXhdO1xuXG4gICAgR2VuZXJhbC5zZW50ZW5jZUhhbmRsZXIodGV4dCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGluaXQ6IEdlbmVyYWwuaW5pdCxcbiAgICBjbGVhcjogR2VuZXJhbC5jbGVhcixcbiAgICByYW5kb206IHJhbmRvbUFwaG9yaXNtLFxuICB9O1xufSkoKTtcblxuZXhwb3J0IGRlZmF1bHQgUmVmcmVzaDtcbiIsImZ1bmN0aW9uIGFkZEV2ZW50c0dlbmVyYXRvcihoYW5kbGVyKSB7XG4gIGhhbmRsZXIuc2hvd0luaXQoKTtcbiAgLy8gYWRkIGFsbCBldmVudExpc3RlbmVyXG4gIGNvbnN0IGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gIGxpc3QuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLmNsaWNrTGksIGZhbHNlKTtcbiAgbGlzdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIucmVtb3ZlTGksIGZhbHNlKTtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZXIuZW50ZXJBZGQsIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FkZCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5hZGQsIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dEb25lJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dEb25lLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93VG9kbycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93VG9kbywgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0FsbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93QWxsLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93Q2xlYXJEb25lJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dDbGVhckRvbmUsIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dDbGVhcicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93Q2xlYXIsIGZhbHNlKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYWRkRXZlbnRzR2VuZXJhdG9yO1xuIiwiaW1wb3J0IGdldEZvcm1hdERhdGUgZnJvbSAnLi4vZ2V0Rm9ybWF0RGF0ZSc7XG5cbmNvbnN0IGV2ZW50c0hhbmRsZXJHZW5lcmFsID0gKCgpID0+IHtcbiAgZnVuY3Rpb24gcmVzZXRJbnB1dCgpIHtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5wdXQnKS52YWx1ZSA9ICcnO1xuICB9XG5cbiAgZnVuY3Rpb24gZGF0YUdlbmVyYXRvcihrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiBrZXksXG4gICAgICBldmVudDogdmFsdWUsXG4gICAgICBmaW5pc2hlZDogZmFsc2UsXG4gICAgICBkYXRlOiBnZXRGb3JtYXREYXRlKCdNTeaciGRk5pelaGg6bW0nKSxcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICByZXNldElucHV0LFxuICAgIGRhdGFHZW5lcmF0b3IsXG4gIH07XG59KSgpO1xuXG5leHBvcnQgZGVmYXVsdCBldmVudHNIYW5kbGVyR2VuZXJhbDtcbiIsImltcG9ydCBpdGVtR2VuZXJhdG9yIGZyb20gJy4uL3RlbXBsZXRlL2l0ZW1HZW5lcmF0b3InO1xuaW1wb3J0IHNlbnRlbmNlR2VuZXJhdG9yIGZyb20gJy4uL3RlbXBsZXRlL3NlbnRlbmNlR2VuZXJhdG9yJztcbmltcG9ydCBjbGVhckNoaWxkTm9kZXMgZnJvbSAnLi4vY2xlYXJDaGlsZE5vZGVzJztcblxuY29uc3QgcmVmcmVzaEdlbmVyYWwgPSAoKCkgPT4ge1xuICBmdW5jdGlvbiBpbml0KGRhdGFBcnIpIHtcbiAgICBfc2hvdyhkYXRhQXJyLCBfaW5pdFNlbnRlbmNlLCBfcmVuZGVyQWxsKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zaG93KGRhdGFBcnIsIHNob3dTZW50ZW5jZUZ1bmMsIGdlbmVyYXRlRnVuYykge1xuICAgIGlmICghZGF0YUFyciB8fCBkYXRhQXJyLmxlbmd0aCA9PT0gMCkge1xuICAgICAgc2hvd1NlbnRlbmNlRnVuYygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmlubmVySFRNTCA9IGdlbmVyYXRlRnVuYyhkYXRhQXJyKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfaW5pdFNlbnRlbmNlKCkge1xuICAgIGNvbnN0IHRleHQgPSAnV2VsY29tZX4sIHRyeSB0byBhZGQgeW91ciBmaXJzdCB0by1kbyBsaXN0IDogKSc7XG5cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmlubmVySFRNTCA9IHNlbnRlbmNlR2VuZXJhdG9yKHRleHQpO1xuICB9XG5cbiAgZnVuY3Rpb24gYWxsKHJhbmRvbUFwaG9yaXNtLCBkYXRhQXJyKSB7XG4gICAgX3Nob3coZGF0YUFyciwgcmFuZG9tQXBob3Jpc20sIF9yZW5kZXJBbGwpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3JlbmRlckFsbChkYXRhQXJyKSB7XG4gICAgY29uc3QgY2xhc3NpZmllZERhdGEgPSBfY2xhc3NpZnlEYXRhKGRhdGFBcnIpO1xuXG4gICAgcmV0dXJuIGl0ZW1HZW5lcmF0b3IoY2xhc3NpZmllZERhdGEpO1xuICB9XG5cbiAgZnVuY3Rpb24gX2NsYXNzaWZ5RGF0YShkYXRhQXJyKSB7XG4gICAgY29uc3QgZmluaXNoZWQgPSBbXTtcbiAgICBjb25zdCB1bmZpc2hpZWQgPSBbXTtcblxuICAgIC8vIHB1dCB0aGUgZmluaXNoZWQgaXRlbSB0byB0aGUgYm90dG9tXG4gICAgZGF0YUFyci5mb3JFYWNoKGRhdGEgPT4gKGRhdGEuZmluaXNoZWQgPyBmaW5pc2hlZC51bnNoaWZ0KGRhdGEpIDogdW5maXNoaWVkLnVuc2hpZnQoZGF0YSkpKTtcblxuICAgIHJldHVybiB1bmZpc2hpZWQuY29uY2F0KGZpbmlzaGVkKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnQocmFuZG9tQXBob3Jpc20sIGRhdGFBcnIpIHtcbiAgICBfc2hvdyhkYXRhQXJyLCByYW5kb21BcGhvcmlzbSwgX3JlbmRlclBhcnQpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3JlbmRlclBhcnQoZGF0YUFycikge1xuICAgIHJldHVybiBpdGVtR2VuZXJhdG9yKGRhdGFBcnIucmV2ZXJzZSgpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIGNsZWFyQ2hpbGROb2Rlcyhkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbnRlbmNlSGFuZGxlcih0ZXh0KSB7XG4gICAgY29uc3QgcmVuZGVyZWQgPSBzZW50ZW5jZUdlbmVyYXRvcih0ZXh0KTtcblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuaW5uZXJIVE1MID0gcmVuZGVyZWQ7XG4gIH1cblxuXG4gIHJldHVybiB7XG4gICAgaW5pdCxcbiAgICBhbGwsXG4gICAgcGFydCxcbiAgICBjbGVhcixcbiAgICBzZW50ZW5jZUhhbmRsZXIsXG4gIH07XG59KSgpO1xuXG5leHBvcnQgZGVmYXVsdCByZWZyZXNoR2VuZXJhbDtcbiIsImZ1bmN0aW9uIGdldEZvcm1hdERhdGUoZm10KSB7XG4gIGNvbnN0IG5ld0RhdGUgPSBuZXcgRGF0ZSgpO1xuICBjb25zdCBvID0ge1xuICAgICd5Kyc6IG5ld0RhdGUuZ2V0RnVsbFllYXIoKSxcbiAgICAnTSsnOiBuZXdEYXRlLmdldE1vbnRoKCkgKyAxLFxuICAgICdkKyc6IG5ld0RhdGUuZ2V0RGF0ZSgpLFxuICAgICdoKyc6IG5ld0RhdGUuZ2V0SG91cnMoKSxcbiAgICAnbSsnOiBuZXdEYXRlLmdldE1pbnV0ZXMoKSxcbiAgfTtcbiAgbGV0IG5ld2ZtdCA9IGZtdDtcblxuICBPYmplY3Qua2V5cyhvKS5mb3JFYWNoKChrKSA9PiB7XG4gICAgaWYgKG5ldyBSZWdFeHAoYCgke2t9KWApLnRlc3QobmV3Zm10KSkge1xuICAgICAgaWYgKGsgPT09ICd5KycpIHtcbiAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoYCR7b1trXX1gKS5zdWJzdHIoNCAtIFJlZ0V4cC4kMS5sZW5ndGgpKTtcbiAgICAgIH0gZWxzZSBpZiAoayA9PT0gJ1MrJykge1xuICAgICAgICBsZXQgbGVucyA9IFJlZ0V4cC4kMS5sZW5ndGg7XG4gICAgICAgIGxlbnMgPSBsZW5zID09PSAxID8gMyA6IGxlbnM7XG4gICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKGAwMCR7b1trXX1gKS5zdWJzdHIoKGAke29ba119YCkubGVuZ3RoIC0gMSwgbGVucykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoUmVnRXhwLiQxLmxlbmd0aCA9PT0gMSkgPyAob1trXSkgOiAoKGAwMCR7b1trXX1gKS5zdWJzdHIoKGAke29ba119YCkubGVuZ3RoKSkpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIC8vIGZvciAoY29uc3QgayBpbiBvKSB7XG4gIC8vICAgaWYgKG5ldyBSZWdFeHAoYCgke2t9KWApLnRlc3QobmV3Zm10KSkge1xuICAvLyAgICAgaWYgKGsgPT09ICd5KycpIHtcbiAgLy8gICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoYCR7b1trXX1gKS5zdWJzdHIoNCAtIFJlZ0V4cC4kMS5sZW5ndGgpKTtcbiAgLy8gICAgIH0gZWxzZSBpZiAoayA9PT0gJ1MrJykge1xuICAvLyAgICAgICBsZXQgbGVucyA9IFJlZ0V4cC4kMS5sZW5ndGg7XG4gIC8vICAgICAgIGxlbnMgPSBsZW5zID09PSAxID8gMyA6IGxlbnM7XG4gIC8vICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKGAwMCR7b1trXX1gKS5zdWJzdHIoKGAke29ba119YCkubGVuZ3RoIC0gMSwgbGVucykpO1xuICAvLyAgICAgfSBlbHNlIHtcbiAgLy8gICAgICAgbmV3Zm10ID0gbmV3Zm10LnJlcGxhY2UoUmVnRXhwLiQxLCAoUmVnRXhwLiQxLmxlbmd0aCA9PT0gMSkgPyAob1trXSkgOiAoKGAwMCR7b1trXX1gKS5zdWJzdHIoKGAke29ba119YCkubGVuZ3RoKSkpO1xuICAvLyAgICAgfVxuICAvLyAgIH1cbiAgLy8gfVxuXG4gIHJldHVybiBuZXdmbXQ7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGdldEZvcm1hdERhdGU7XG4iLCJmdW5jdGlvbiBpdGVtR2VuZXJhdG9yKGRhdGFBcnIpIHtcbiAgY29uc3QgdGVtcGxhdGUgPSBIYW5kbGViYXJzLnRlbXBsYXRlcy5saTtcbiAgbGV0IHJlc3VsdCA9IGRhdGFBcnI7XG5cbiAgaWYgKCFBcnJheS5pc0FycmF5KGRhdGFBcnIpKSB7XG4gICAgcmVzdWx0ID0gW2RhdGFBcnJdO1xuICB9XG4gIGNvbnN0IHJlbmRlcmVkID0gdGVtcGxhdGUoeyBsaXN0SXRlbXM6IHJlc3VsdCB9KTtcblxuICByZXR1cm4gcmVuZGVyZWQudHJpbSgpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBpdGVtR2VuZXJhdG9yO1xuIiwiZnVuY3Rpb24gc2VudGVuY2VHZW5lcmF0b3IodGV4dCkge1xuICBjb25zdCB0ZW1wbGF0ZSA9IEhhbmRsZWJhcnMudGVtcGxhdGVzLmxpO1xuICBjb25zdCByZW5kZXJlZCA9IHRlbXBsYXRlKHsgc2VudGVuY2U6IHRleHQgfSk7XG5cbiAgcmV0dXJuIHJlbmRlcmVkLnRyaW0oKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgc2VudGVuY2VHZW5lcmF0b3I7XG4iLCJpbXBvcnQgYWRkRXZlbnRzIGZyb20gJy4vdXRsaXMvZGJGYWlsL2FkZEV2ZW50cyc7XG5cbmFkZEV2ZW50cygpO1xuIl19
