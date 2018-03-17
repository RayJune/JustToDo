(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
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

exports.default = {
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

},{"../dbFail/refresh":4,"../dbGeneral/eventsHandlerGeneral":6,"../templete/itemGenerator":9}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _refreshGeneral = require('../dbGeneral/refreshGeneral');

var _refreshGeneral2 = _interopRequireDefault(_refreshGeneral);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function randomAphorism() {
  var aphorisms = ['Yesterday You Said Tomorrow', 'Why are we here?', 'All in, or nothing', 'You Never Try, You Never Know', 'The unexamined life is not worth living. -- Socrates', 'There is only one thing we say to lazy: NOT TODAY'];
  var randomIndex = Math.floor(Math.random() * aphorisms.length);
  var text = aphorisms[randomIndex];

  _refreshGeneral2.default.sentenceHandler(text);
}

exports.default = {
  init: _refreshGeneral2.default.init,
  clear: _refreshGeneral2.default.clear,
  random: randomAphorism
};

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

exports.default = {
  resetInput: resetInput,
  dataGenerator: dataGenerator
};

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

exports.default = {
  init: init,
  all: all,
  part: part,
  clear: clear,
  sentenceHandler: sentenceHandler
};

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9jbGVhckNoaWxkTm9kZXMuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkZhaWwvYWRkRXZlbnRzLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJGYWlsL2V2ZW50c0hhbmRsZXIuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkZhaWwvcmVmcmVzaC5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2RiR2VuZXJhbC9hZGRFdmVudHNHZW5lcmF0b3IuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkdlbmVyYWwvZXZlbnRzSGFuZGxlckdlbmVyYWwuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkdlbmVyYWwvcmVmcmVzaEdlbmVyYWwuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9nZXRGb3JtYXREYXRlLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvdGVtcGxldGUvaXRlbUdlbmVyYXRvci5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL3RlbXBsZXRlL3NlbnRlbmNlR2VuZXJhdG9yLmpzIiwic3JjL3NjcmlwdHMvd2l0aG91dERCLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7QUNBQSxTQUFTLGVBQVQsQ0FBeUIsSUFBekIsRUFBK0I7QUFDN0IsU0FBTyxLQUFLLGFBQUwsRUFBUCxFQUE2QjtBQUFFO0FBQzdCLFNBQUssV0FBTCxDQUFpQixLQUFLLFVBQXRCO0FBQ0Q7QUFDRDtBQUNEOztrQkFFYyxlOzs7Ozs7Ozs7QUNQZjs7OztBQUNBOzs7Ozs7QUFFQSxTQUFTLFNBQVQsR0FBcUI7QUFDbkIsU0FBTyxLQUFQLENBQWEsMkdBQWI7QUFDQTtBQUNEOztrQkFFYyxTOzs7Ozs7Ozs7QUNSZjs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7O0FBRUEsSUFBSSxNQUFNLENBQVYsQyxDQUFhOztBQUViLFNBQVMsR0FBVCxHQUFlO0FBQ2IsTUFBTSxhQUFhLFNBQVMsYUFB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RUEsU0FBTyxTQUFTLElBQVQsRUFBUDtBQUNEOztrQkFFYyxpQjs7Ozs7QUNQZjs7Ozs7O0FBRUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfXJldHVybiBlfSkoKSIsImZ1bmN0aW9uIGNsZWFyQ2hpbGROb2Rlcyhyb290KSB7XG4gIHdoaWxlIChyb290Lmhhc0NoaWxkTm9kZXMoKSkgeyAvLyBvciByb290LmZpcnN0Q2hpbGQgb3Igcm9vdC5sYXN0Q2hpbGRcbiAgICByb290LnJlbW92ZUNoaWxkKHJvb3QuZmlyc3RDaGlsZCk7XG4gIH1cbiAgLy8gb3Igcm9vdC5pbm5lckhUTUwgPSAnJ1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGVhckNoaWxkTm9kZXM7XG4iLCJpbXBvcnQgYWRkRXZlbnRzR2VuZXJhdG9yIGZyb20gJy4uL2RiR2VuZXJhbC9hZGRFdmVudHNHZW5lcmF0b3InO1xuaW1wb3J0IGV2ZW50c0hhbmRsZXIgZnJvbSAnLi4vZGJGYWlsL2V2ZW50c0hhbmRsZXInO1xuXG5mdW5jdGlvbiBhZGRFdmVudHMoKSB7XG4gIHdpbmRvdy5hbGVydCgnWW91ciBicm93c2VyIGRvZXNuXFwndCBzdXBwb3J0IGEgc3RhYmxlIHZlcnNpb24gb2YgSW5kZXhlZERCLiBXZSB3aWxsIG9mZmVyIHlvdSB0aGUgd2l0aG91dCBpbmRleGVkREIgbW9kZScpO1xuICBhZGRFdmVudHNHZW5lcmF0b3IoZXZlbnRzSGFuZGxlcik7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFkZEV2ZW50cztcbiIsImltcG9ydCBSZWZyZXNoIGZyb20gJy4uL2RiRmFpbC9yZWZyZXNoJztcbmltcG9ydCBHZW5lcmFsIGZyb20gJy4uL2RiR2VuZXJhbC9ldmVudHNIYW5kbGVyR2VuZXJhbCc7XG5pbXBvcnQgaXRlbUdlbmVyYXRvciBmcm9tICcuLi90ZW1wbGV0ZS9pdGVtR2VuZXJhdG9yJztcblxubGV0IF9pZCA9IDA7IC8vIHNvIHRoZSBmaXJzdCBpdGVtJ3MgaWQgaXMgMVxuXG5mdW5jdGlvbiBhZGQoKSB7XG4gIGNvbnN0IGlucHV0VmFsdWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5wdXQnKS52YWx1ZTtcblxuICBpZiAoaW5wdXRWYWx1ZSA9PT0gJycpIHtcbiAgICB3aW5kb3cuYWxlcnQoJ3BsZWFzZSBpbnB1dCBhIHJlYWwgZGF0YX4nKTtcbiAgfSBlbHNlIHtcbiAgICBhZGRIYW5kbGVyKGlucHV0VmFsdWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFkZEhhbmRsZXIoaW5wdXRWYWx1ZSkge1xuICBjb25zdCBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcblxuICBfcmVtb3ZlUmFuZG9tKGxpc3QpO1xuICBfaWQgKz0gMTtcbiAgY29uc3QgbmV3RGF0YSA9IEdlbmVyYWwuZGF0YUdlbmVyYXRvcihfaWQsIGlucHV0VmFsdWUpO1xuICBsaXN0Lmluc2VydEJlZm9yZShpdGVtR2VuZXJhdG9yKG5ld0RhdGEpLCBsaXN0LmZpcnN0Q2hpbGQpOyAvLyBwdXNoIG5ld0xpIHRvIGZpcnN0XG4gIEdlbmVyYWwucmVzZXRJbnB1dCgpO1xufVxuXG5mdW5jdGlvbiBfcmVtb3ZlUmFuZG9tKGxpc3QpIHtcbiAgY29uc3QgbGlzdEl0ZW1zID0gbGlzdC5jaGlsZE5vZGVzO1xuXG4gIFsuLi5saXN0SXRlbXNdLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICBpZiAoaXRlbS5jbGFzc0xpc3QuY29udGFpbnMoJ2FwaG9yaXNtJykpIHtcbiAgICAgIGxpc3QucmVtb3ZlQ2hpbGQoaXRlbSk7XG4gICAgfVxuICB9KTtcbn1cbi8vIG9yIHVzZSBmb3IuLi5pblxuLy8gZm9yIChjb25zdCBpbmRleCBpbiBsaXN0SXRlbXMpIHtcbi8vICAgaWYgKGxpc3RJdGVtcy5oYXNPd25Qcm9wZXJ0eShpbmRleCkpIHtcbi8vICAgICBpZiAobGlzdEl0ZW1zW2luZGV4XS5jbGFzc0xpc3QuY29udGFpbnMoJ2FwaG9yaXNtJykpIHtcbi8vICAgICAgIGxpc3QucmVtb3ZlQ2hpbGQobGlzdEl0ZW1zW2luZGV4XSk7XG4vLyAgICAgfVxuLy8gICB9XG4vLyB9XG5cbmZ1bmN0aW9uIGVudGVyQWRkKGUpIHtcbiAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICBhZGQoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzaG93QWxsKCkge1xuICBjb25zdCBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgY29uc3QgbGlzdEl0ZW1zID0gbGlzdC5jaGlsZE5vZGVzO1xuXG4gIFsuLi5saXN0SXRlbXNdLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICBfd2hldGhlckFwcGVhcihpdGVtLCB0cnVlKTtcbiAgICBpZiAoaXRlbS5jbGFzc0xpc3QuY29udGFpbnMoJ2ZpbmlzaGVkJykpIHtcbiAgICAgIGxpc3QucmVtb3ZlQ2hpbGQoaXRlbSk7XG4gICAgICBsaXN0LmFwcGVuZENoaWxkKGl0ZW0pOyAvLyBQVU5DSExJTkU6IGRyb3AgZG9uZSBpdGVtXG4gICAgfVxuICB9KTtcbn1cblxuLyogZXNsaW50LWRpc2FibGUgbm8tcGFyYW0tcmVhc3NpZ24gICovXG5mdW5jdGlvbiBfd2hldGhlckFwcGVhcihlbGVtZW50LCB3aGV0aGVyKSB7XG4gIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IHdoZXRoZXIgPyAnYmxvY2snIDogJ25vbmUnOyAvLyBGSVhNRTogZXNsaW50IGVycm9yXG59XG4vKiBlc2xpbnQtZW5hYmxlIG5vLXBhcmFtLXJlYXNzaWduICAqL1xuXG5mdW5jdGlvbiBjbGlja0xpKHsgdGFyZ2V0IH0pIHtcbiAgLy8gdXNlIGV2ZW50IGRlbGVnYXRpb25cbiAgaWYgKHRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSkge1xuICAgIHRhcmdldC5jbGFzc0xpc3QudG9nZ2xlKCdmaW5pc2hlZCcpO1xuICAgIHNob3dBbGwoKTtcbiAgfVxufVxuXG4vLyBsaSdzIFt4XSdzIGRlbGV0ZVxuZnVuY3Rpb24gcmVtb3ZlTGkoeyB0YXJnZXQgfSkge1xuICBpZiAodGFyZ2V0LmNsYXNzTmFtZSA9PT0gJ2Nsb3NlJykgeyAvLyB1c2UgZXZlbnQgZGVsZWdhdGlvblxuICAgIF9yZW1vdmVMaUhhbmRsZXIodGFyZ2V0KTtcbiAgICBfYWRkUmFuZG9tKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX3JlbW92ZUxpSGFuZGxlcihlbGVtZW50KSB7XG4gIC8vIHVzZSBwcmV2aW91c2x5IHN0b3JlZCBkYXRhXG4gIGNvbnN0IGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICBjb25zdCBsaXN0SXRlbXMgPSBsaXN0LmNoaWxkTm9kZXM7XG4gIGNvbnN0IGlkID0gZWxlbWVudC5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpO1xuXG4gIHRyeSB7XG4gICAgWy4uLmxpc3RJdGVtc10uZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgaWYgKGl0ZW0uZ2V0QXR0cmlidXRlKCdkYXRhLWlkJykgPT09IGlkKSB7XG4gICAgICAgIGxpc3QucmVtb3ZlQ2hpbGQoaXRlbSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5sb2coJ1dyb25nIGlkLCBub3QgZm91bmQgaW4gRE9NIHRyZWUnKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3IpO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9hZGRSYW5kb20oKSB7XG4gIGNvbnN0IGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gIGlmICghbGlzdC5oYXNDaGlsZE5vZGVzKCkgfHwgX2FsbERpc2FwcGVhcihsaXN0KSkge1xuICAgIFJlZnJlc2gucmFuZG9tKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX2FsbERpc2FwcGVhcihsaXN0KSB7XG4gIGNvbnN0IGxpc3RJdGVtcyA9IGxpc3QuY2hpbGROb2RlcztcblxuICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmV2ZXJ5LmNhbGwobGlzdEl0ZW1zLCBpdGVtID0+IGl0ZW0uc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnKTtcbn1cblxuZnVuY3Rpb24gc2hvd0luaXQoKSB7XG4gIFJlZnJlc2guaW5pdCgpO1xufVxuXG5mdW5jdGlvbiBzaG93RG9uZSgpIHtcbiAgX3Nob3dXaGV0aGVyRG9uZSh0cnVlKTtcbn1cblxuZnVuY3Rpb24gc2hvd1RvZG8oKSB7XG4gIF9zaG93V2hldGhlckRvbmUoZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBfc2hvd1doZXRoZXJEb25lKHdoZXRoZXJEb25lKSB7XG4gIGNvbnN0IGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICBjb25zdCBsaXN0SXRlbXMgPSBsaXN0LmNoaWxkTm9kZXM7XG5cbiAgX3JlbW92ZVJhbmRvbShsaXN0KTtcbiAgWy4uLmxpc3RJdGVtc10uZm9yRWFjaCgoaXRlbSkgPT4geyAvLyBGSVhNRTogZXNsaW50IGVycm9yXG4gICAgaXRlbS5jbGFzc0xpc3QuY29udGFpbnMoJ2ZpbmlzaGVkJykgPyBfd2hldGhlckFwcGVhcihpdGVtLCB3aGV0aGVyRG9uZSkgOiBfd2hldGhlckFwcGVhcihpdGVtLCAhd2hldGhlckRvbmUpO1xuICB9KTtcbiAgX2FkZFJhbmRvbSgpO1xufVxuXG5mdW5jdGlvbiBzaG93Q2xlYXJEb25lKCkge1xuICBjb25zdCBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgY29uc3QgbGlzdEl0ZW1zID0gbGlzdC5jaGlsZE5vZGVzO1xuXG4gIF9yZW1vdmVSYW5kb20obGlzdCk7XG4gIFsuLi5saXN0SXRlbXNdLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICBpZiAoaXRlbS5jbGFzc0xpc3QuY29udGFpbnMoJ2ZpbmlzaGVkJykpIHtcbiAgICAgIGxpc3QucmVtb3ZlQ2hpbGQoaXRlbSk7XG4gICAgfVxuICB9KTtcbiAgX2FkZFJhbmRvbSgpO1xufVxuXG5mdW5jdGlvbiBzaG93Q2xlYXIoKSB7XG4gIFJlZnJlc2guY2xlYXIoKTsgLy8gY2xlYXIgbm9kZXMgdmlzdWFsbHlcbiAgUmVmcmVzaC5yYW5kb20oKTtcbn1cblxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGFkZCxcbiAgZW50ZXJBZGQsXG4gIGNsaWNrTGksXG4gIHJlbW92ZUxpLFxuICBzaG93SW5pdCxcbiAgc2hvd0FsbCxcbiAgc2hvd0RvbmUsXG4gIHNob3dUb2RvLFxuICBzaG93Q2xlYXJEb25lLFxuICBzaG93Q2xlYXIsXG59O1xuIiwiaW1wb3J0IEdlbmVyYWwgZnJvbSAnLi4vZGJHZW5lcmFsL3JlZnJlc2hHZW5lcmFsJztcblxuZnVuY3Rpb24gcmFuZG9tQXBob3Jpc20oKSB7XG4gIGNvbnN0IGFwaG9yaXNtcyA9IFtcbiAgICAnWWVzdGVyZGF5IFlvdSBTYWlkIFRvbW9ycm93JyxcbiAgICAnV2h5IGFyZSB3ZSBoZXJlPycsXG4gICAgJ0FsbCBpbiwgb3Igbm90aGluZycsXG4gICAgJ1lvdSBOZXZlciBUcnksIFlvdSBOZXZlciBLbm93JyxcbiAgICAnVGhlIHVuZXhhbWluZWQgbGlmZSBpcyBub3Qgd29ydGggbGl2aW5nLiAtLSBTb2NyYXRlcycsXG4gICAgJ1RoZXJlIGlzIG9ubHkgb25lIHRoaW5nIHdlIHNheSB0byBsYXp5OiBOT1QgVE9EQVknLFxuICBdO1xuICBjb25zdCByYW5kb21JbmRleCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFwaG9yaXNtcy5sZW5ndGgpO1xuICBjb25zdCB0ZXh0ID0gYXBob3Jpc21zW3JhbmRvbUluZGV4XTtcblxuICBHZW5lcmFsLnNlbnRlbmNlSGFuZGxlcih0ZXh0KTtcbn1cblxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGluaXQ6IEdlbmVyYWwuaW5pdCxcbiAgY2xlYXI6IEdlbmVyYWwuY2xlYXIsXG4gIHJhbmRvbTogcmFuZG9tQXBob3Jpc20sXG59O1xuIiwiZnVuY3Rpb24gYWRkRXZlbnRzR2VuZXJhdG9yKGhhbmRsZXIpIHtcbiAgaGFuZGxlci5zaG93SW5pdCgpO1xuICAvLyBhZGQgYWxsIGV2ZW50TGlzdGVuZXJcbiAgY29uc3QgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG5cbiAgbGlzdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuY2xpY2tMaSwgZmFsc2UpO1xuICBsaXN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5yZW1vdmVMaSwgZmFsc2UpO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlci5lbnRlckFkZCwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWRkJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLmFkZCwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0RvbmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0RvbmUsIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dUb2RvJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dUb2RvLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93QWxsJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dBbGwsIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dDbGVhckRvbmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0NsZWFyRG9uZSwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0NsZWFyJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dDbGVhciwgZmFsc2UpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBhZGRFdmVudHNHZW5lcmF0b3I7XG4iLCJpbXBvcnQgZ2V0Rm9ybWF0RGF0ZSBmcm9tICcuLi9nZXRGb3JtYXREYXRlJztcblxuZnVuY3Rpb24gcmVzZXRJbnB1dCgpIHtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWUgPSAnJztcbn1cblxuZnVuY3Rpb24gZGF0YUdlbmVyYXRvcihrZXksIHZhbHVlKSB7XG4gIHJldHVybiB7XG4gICAgaWQ6IGtleSxcbiAgICBldmVudDogdmFsdWUsXG4gICAgZmluaXNoZWQ6IGZhbHNlLFxuICAgIGRhdGU6IGdldEZvcm1hdERhdGUoJ01N5pyIZGTml6VoaDptbScpLFxuICB9O1xufVxuXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgcmVzZXRJbnB1dCxcbiAgZGF0YUdlbmVyYXRvcixcbn07XG4iLCJpbXBvcnQgaXRlbUdlbmVyYXRvciBmcm9tICcuLi90ZW1wbGV0ZS9pdGVtR2VuZXJhdG9yJztcbmltcG9ydCBzZW50ZW5jZUdlbmVyYXRvciBmcm9tICcuLi90ZW1wbGV0ZS9zZW50ZW5jZUdlbmVyYXRvcic7XG5pbXBvcnQgY2xlYXJDaGlsZE5vZGVzIGZyb20gJy4uL2NsZWFyQ2hpbGROb2Rlcyc7XG5cbmZ1bmN0aW9uIGluaXQoZGF0YUFycikge1xuICBfc2hvdyhkYXRhQXJyLCBfaW5pdFNlbnRlbmNlLCBfcmVuZGVyQWxsKTtcbn1cblxuZnVuY3Rpb24gX3Nob3coZGF0YUFyciwgc2hvd1NlbnRlbmNlRnVuYywgZ2VuZXJhdGVGdW5jKSB7XG4gIGlmICghZGF0YUFyciB8fCBkYXRhQXJyLmxlbmd0aCA9PT0gMCkge1xuICAgIHNob3dTZW50ZW5jZUZ1bmMoKTtcbiAgfSBlbHNlIHtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmlubmVySFRNTCA9IGdlbmVyYXRlRnVuYyhkYXRhQXJyKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfaW5pdFNlbnRlbmNlKCkge1xuICBjb25zdCB0ZXh0ID0gJ1dlbGNvbWV+LCB0cnkgdG8gYWRkIHlvdXIgZmlyc3QgdG8tZG8gbGlzdCA6ICknO1xuXG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuaW5uZXJIVE1MID0gc2VudGVuY2VHZW5lcmF0b3IodGV4dCk7XG59XG5cbmZ1bmN0aW9uIGFsbChyYW5kb21BcGhvcmlzbSwgZGF0YUFycikge1xuICBfc2hvdyhkYXRhQXJyLCByYW5kb21BcGhvcmlzbSwgX3JlbmRlckFsbCk7XG59XG5cbmZ1bmN0aW9uIF9yZW5kZXJBbGwoZGF0YUFycikge1xuICBjb25zdCBjbGFzc2lmaWVkRGF0YSA9IF9jbGFzc2lmeURhdGEoZGF0YUFycik7XG5cbiAgcmV0dXJuIGl0ZW1HZW5lcmF0b3IoY2xhc3NpZmllZERhdGEpO1xufVxuXG5mdW5jdGlvbiBfY2xhc3NpZnlEYXRhKGRhdGFBcnIpIHtcbiAgY29uc3QgZmluaXNoZWQgPSBbXTtcbiAgY29uc3QgdW5maXNoaWVkID0gW107XG5cbiAgLy8gcHV0IHRoZSBmaW5pc2hlZCBpdGVtIHRvIHRoZSBib3R0b21cbiAgZGF0YUFyci5mb3JFYWNoKGRhdGEgPT4gKGRhdGEuZmluaXNoZWQgPyBmaW5pc2hlZC51bnNoaWZ0KGRhdGEpIDogdW5maXNoaWVkLnVuc2hpZnQoZGF0YSkpKTtcblxuICByZXR1cm4gdW5maXNoaWVkLmNvbmNhdChmaW5pc2hlZCk7XG59XG5cbmZ1bmN0aW9uIHBhcnQocmFuZG9tQXBob3Jpc20sIGRhdGFBcnIpIHtcbiAgX3Nob3coZGF0YUFyciwgcmFuZG9tQXBob3Jpc20sIF9yZW5kZXJQYXJ0KTtcbn1cblxuZnVuY3Rpb24gX3JlbmRlclBhcnQoZGF0YUFycikge1xuICByZXR1cm4gaXRlbUdlbmVyYXRvcihkYXRhQXJyLnJldmVyc2UoKSk7XG59XG5cbmZ1bmN0aW9uIGNsZWFyKCkge1xuICBjbGVhckNoaWxkTm9kZXMoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKSk7XG59XG5cbmZ1bmN0aW9uIHNlbnRlbmNlSGFuZGxlcih0ZXh0KSB7XG4gIGNvbnN0IHJlbmRlcmVkID0gc2VudGVuY2VHZW5lcmF0b3IodGV4dCk7XG5cbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5pbm5lckhUTUwgPSByZW5kZXJlZDtcbn1cblxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGluaXQsXG4gIGFsbCxcbiAgcGFydCxcbiAgY2xlYXIsXG4gIHNlbnRlbmNlSGFuZGxlcixcbn07XG4iLCJmdW5jdGlvbiBnZXRGb3JtYXREYXRlKGZtdCkge1xuICBjb25zdCBuZXdEYXRlID0gbmV3IERhdGUoKTtcbiAgY29uc3QgbyA9IHtcbiAgICAneSsnOiBuZXdEYXRlLmdldEZ1bGxZZWFyKCksXG4gICAgJ00rJzogbmV3RGF0ZS5nZXRNb250aCgpICsgMSxcbiAgICAnZCsnOiBuZXdEYXRlLmdldERhdGUoKSxcbiAgICAnaCsnOiBuZXdEYXRlLmdldEhvdXJzKCksXG4gICAgJ20rJzogbmV3RGF0ZS5nZXRNaW51dGVzKCksXG4gIH07XG4gIGxldCBuZXdmbXQgPSBmbXQ7XG5cbiAgT2JqZWN0LmtleXMobykuZm9yRWFjaCgoaykgPT4ge1xuICAgIGlmIChuZXcgUmVnRXhwKGAoJHtrfSlgKS50ZXN0KG5ld2ZtdCkpIHtcbiAgICAgIGlmIChrID09PSAneSsnKSB7XG4gICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKGAke29ba119YCkuc3Vic3RyKDQgLSBSZWdFeHAuJDEubGVuZ3RoKSk7XG4gICAgICB9IGVsc2UgaWYgKGsgPT09ICdTKycpIHtcbiAgICAgICAgbGV0IGxlbnMgPSBSZWdFeHAuJDEubGVuZ3RoO1xuICAgICAgICBsZW5zID0gbGVucyA9PT0gMSA/IDMgOiBsZW5zO1xuICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChgMDAke29ba119YCkuc3Vic3RyKChgJHtvW2tdfWApLmxlbmd0aCAtIDEsIGxlbnMpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKFJlZ0V4cC4kMS5sZW5ndGggPT09IDEpID8gKG9ba10pIDogKChgMDAke29ba119YCkuc3Vic3RyKChgJHtvW2tdfWApLmxlbmd0aCkpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICAvLyBmb3IgKGNvbnN0IGsgaW4gbykge1xuICAvLyAgIGlmIChuZXcgUmVnRXhwKGAoJHtrfSlgKS50ZXN0KG5ld2ZtdCkpIHtcbiAgLy8gICAgIGlmIChrID09PSAneSsnKSB7XG4gIC8vICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKGAke29ba119YCkuc3Vic3RyKDQgLSBSZWdFeHAuJDEubGVuZ3RoKSk7XG4gIC8vICAgICB9IGVsc2UgaWYgKGsgPT09ICdTKycpIHtcbiAgLy8gICAgICAgbGV0IGxlbnMgPSBSZWdFeHAuJDEubGVuZ3RoO1xuICAvLyAgICAgICBsZW5zID0gbGVucyA9PT0gMSA/IDMgOiBsZW5zO1xuICAvLyAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsIChgMDAke29ba119YCkuc3Vic3RyKChgJHtvW2tdfWApLmxlbmd0aCAtIDEsIGxlbnMpKTtcbiAgLy8gICAgIH0gZWxzZSB7XG4gIC8vICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKFJlZ0V4cC4kMS5sZW5ndGggPT09IDEpID8gKG9ba10pIDogKChgMDAke29ba119YCkuc3Vic3RyKChgJHtvW2tdfWApLmxlbmd0aCkpKTtcbiAgLy8gICAgIH1cbiAgLy8gICB9XG4gIC8vIH1cblxuICByZXR1cm4gbmV3Zm10O1xufVxuXG5leHBvcnQgZGVmYXVsdCBnZXRGb3JtYXREYXRlO1xuIiwiZnVuY3Rpb24gaXRlbUdlbmVyYXRvcihkYXRhQXJyKSB7XG4gIGNvbnN0IHRlbXBsYXRlID0gSGFuZGxlYmFycy50ZW1wbGF0ZXMubGk7XG4gIGxldCByZXN1bHQgPSBkYXRhQXJyO1xuXG4gIGlmICghQXJyYXkuaXNBcnJheShkYXRhQXJyKSkge1xuICAgIHJlc3VsdCA9IFtkYXRhQXJyXTtcbiAgfVxuICBjb25zdCByZW5kZXJlZCA9IHRlbXBsYXRlKHsgbGlzdEl0ZW1zOiByZXN1bHQgfSk7XG5cbiAgcmV0dXJuIHJlbmRlcmVkLnRyaW0oKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgaXRlbUdlbmVyYXRvcjtcbiIsImZ1bmN0aW9uIHNlbnRlbmNlR2VuZXJhdG9yKHRleHQpIHtcbiAgY29uc3QgdGVtcGxhdGUgPSBIYW5kbGViYXJzLnRlbXBsYXRlcy5saTtcbiAgY29uc3QgcmVuZGVyZWQgPSB0ZW1wbGF0ZSh7IHNlbnRlbmNlOiB0ZXh0IH0pO1xuXG4gIHJldHVybiByZW5kZXJlZC50cmltKCk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHNlbnRlbmNlR2VuZXJhdG9yO1xuIiwiaW1wb3J0IGFkZEV2ZW50cyBmcm9tICcuL3V0bGlzL2RiRmFpbC9hZGRFdmVudHMnO1xuXG5hZGRFdmVudHMoKTtcbiJdfQ==
