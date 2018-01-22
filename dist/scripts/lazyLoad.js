(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
var addEvents = (function dbFailGenerator() {
  var eventHandler = require('../eventHandler/dbFail');
  var generator = require('./generator');

  return function handler() {
    window.alert('Your browser doesn\'t support a stable version of IndexedDB. We will offer you the without indexedDB mode');
    generator(eventHandler);
  };
}());

module.exports = addEvents;

},{"../eventHandler/dbFail":4,"./generator":2}],2:[function(require,module,exports){
'use strict';
function generator(handler) {
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
  document.querySelector('#showClearDone').addEventListener('click', handler.showClearDone, false);
  document.querySelector('#showClear').addEventListener('click', handler.showClear, false);
}

module.exports = generator;

},{}],3:[function(require,module,exports){
'use strict';
function clearChildNodes(root) {
  while (root.hasChildNodes()) { // or root.firstChild or root.lastChild
    root.removeChild(root.firstChild);
  }
  // or root.innerHTML = ''
}

module.exports = clearChildNodes;

},{}],4:[function(require,module,exports){
'use strict';
var eventHandler = (function dbFailGenerator() {
  var refresh = require('../refresh/dbFail');
  var itemGenerator = require('../templete/itemGenerator');
  var general = require('./general');
  var _id = 0; // so the first item's id is 1
  var _forEach = Array.prototype.forEach; // simplify

  function add() {
    var inputValue = document.querySelector('#input').value;

    if (inputValue === '') {
      window.alert('please input a real data~');
    } else {
      addHandler(inputValue);
    }
  }

  function addHandler(inputValue) {
    var newData;
    var list = document.querySelector('#list');

    _removeRandom(list);
    _id += 1;
    newData = general.dataGenerator(_id, inputValue);
    list.insertBefore(itemGenerator(newData), list.firstChild); // push newLi to first
    general.resetInput();
  }

  function _removeRandom(list) {
    var listItems = list.childNodes;

    _forEach.call(listItems, function whetherHasRandom(item) {
      if (item.classList.contains('aphorism')) {
        list.removeChild(item);
      }
    });
    // or use for...in
    // for (var index in listItems) {
    //   if (listItems.hasOwnProperty(index)) {
    //     if (listItems[index].classList.contains('aphorism')) {
    //       list.removeChild(listItems[index]);
    //     }
    //   }
    // }
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
      targetLi.classList.toggle('finished');
      showAll();
    }
  }

  // li's [x]'s delete
  function removeLi(e) {
    if (e.target.className === 'close') { // use event delegation
      _removeLiHandler(e.target);
      general.ifEmpty.addRandom();
    }
  }

  function _removeLiHandler(element) {
    // use previously stored data
    var list = document.querySelector('#list');
    var listItems = list.childNodes;
    var id = element.parentNode.getAttribute('data-id');

    try {
      _forEach.call(listItems, function whetherHasRandom(item) {
        if (item.getAttribute('data-id') === id) {
          list.removeChild(item);
        }
      });
    } catch (error) {
      console.log('Wrong id, not found in DOM tree');
      throw new Error(error);
    }
  }

  // for Semantic
  general.ifEmpty.addRandom = function addRandom() {
    var list = document.querySelector('#list');

    if (!list.hasChildNodes() || _allDisappear(list)) {
      refresh.random();
    }
  };

  function _allDisappear(list) {
    var listItems = list.childNodes;

    return Array.prototype.every.call(listItems, function whetherHasRandom(item) {
      return item.style.display === 'none';
    });
  }

  function showInit() {
    refresh.init();
  }

  function showAll() {
    var list = document.querySelector('#list');
    var listItems = list.childNodes;

    _forEach.call(listItems, function appearAll(item) {
      _whetherAppear(item, true);
      if (item.classList.contains('finished')) {
        list.removeChild(item);
        list.appendChild(item); // PUNCHLINE: drop done item
      }
    });
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
    _forEach.call(listItems, function whetherDoneAppear(item) {
      item.classList.contains('finished') ? _whetherAppear(item, whetherDone) : _whetherAppear(item, !whetherDone);
    });
    general.ifEmpty.addRandom();
  }

  function _whetherAppear(element, whether) {
    element.style.display = whether ? 'block' : 'none';
  }

  function showClearDone() {
    var list = document.querySelector('#list');
    var listItems = list.childNodes;

    _removeRandom(list);
    _forEach.call(listItems, function clearDoneItems(item) {
      if (item.classList.contains('finished')) {
        list.removeChild(item);
      }
    });
    general.ifEmpty.addRandom();
  }

  function showClear() {
    refresh.clear(); // clear nodes visually
    refresh.random();
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
}());

module.exports = eventHandler;

},{"../refresh/dbFail":7,"../templete/itemGenerator":9,"./general":5}],5:[function(require,module,exports){
'use strict';
var general = (function generalGenerator() {
  var getFormatDate = require('../getFormatDate');

  var ifEmpty = {
    removeInit: function removeInit() {
      var list = document.querySelector('#list');

      if (list.firstChild.className === 'aphorism') {
        list.removeChild(list.firstChild);
      }
    }
  };

  function resetInput() {
    document.querySelector('#input').value = '';
  }

  function dataGenerator(key, value) {
    return {
      id: key,
      event: value,
      finished: false,
      date: getFormatDate('MM月dd日hh:mm') + ' '
    };
  }

  return {
    ifEmpty: ifEmpty,
    resetInput: resetInput,
    dataGenerator: dataGenerator
  };
}());

module.exports = general;

},{"../getFormatDate":6}],6:[function(require,module,exports){
'use strict';
function getFormatDate(fmt) {
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

module.exports = getFormatDate;

},{}],7:[function(require,module,exports){
'use strict';
var refresh = (function dbFailGenerator() {
  var general = require('./general');

  function randomAphorism() {
    var aphorisms = [
      'Yesterday You Said Tomorrow',
      'Why are we here?',
      'All in, or nothing',
      'You Never Try, You Never Know',
      'The unexamined life is not worth living. -- Socrates',
      'There is only one thing we say to lazy: NOT TODAY'
    ];
    var randomIndex = Math.floor(Math.random() * aphorisms.length);
    var text = aphorisms[randomIndex];

    general.sentenceHandler(text);
  }

  return {
    init: general.init,
    all: general.all.bind(null, randomAphorism),
    part: general.part.bind(null, randomAphorism),
    clear: general.clear,
    random: randomAphorism
  };
}());

module.exports = refresh;

},{"./general":8}],8:[function(require,module,exports){
'use strict';
var general = (function generalGenerator() {
  var itemGenerator = require('../templete/itemGenerator');
  var sentenceGenerator = require('../templete/sentenceGenerator');
  var clearChildNodes = require('../clearChildNodes');

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

    document.querySelector('#list').innerHTML = sentenceGenerator(text);
  }

  function all(randomAphorism, dataArr) {
    _show(dataArr, randomAphorism, _renderAll);
  }

  function _renderAll(dataArr) {
    var classifiedData = _classifyData(dataArr);

    return itemGenerator(classifiedData);
  }

  function _classifyData(dataArr) {
    var finished = [];
    var unfishied = [];

    // put the finished item to the bottom
    dataArr.forEach(function classify(data) {
      data.finished ? finished.push(data) : unfishied.push(data);
    });

    return unfishied.concat(finished);
  }

  function part(randomAphorism, dataArr) {
    _show(dataArr, randomAphorism, _renderPart);
  }

  function _renderPart(dataArr) {
    return itemGenerator(dataArr);
  }

  function clear() {
    clearChildNodes(document.querySelector('#list'));
  }

  function sentenceHandler(text) {
    var rendered = sentenceGenerator(text);

    document.querySelector('#list').innerHTML = rendered;
  }


  return {
    init: init,
    all: all,
    part: part,
    clear: clear,
    sentenceHandler: sentenceHandler
  };
}());

module.exports = general;

},{"../clearChildNodes":3,"../templete/itemGenerator":9,"../templete/sentenceGenerator":10}],9:[function(require,module,exports){
'use strict';
function itemGenerator(dataArr) {
  var result = dataArr;
  var rendered;
  var template = Handlebars.templates.li;

  if (!Array.isArray(dataArr)) {
    result = [dataArr];
  }
  rendered = template({listItems: result});

  return rendered.trim();
}

module.exports = itemGenerator;

},{}],10:[function(require,module,exports){
'use strict';
function sentenceGenerator(text) {
  var template = Handlebars.templates.li;
  var rendered = template({"sentence": text});

  return rendered.trim();
}

module.exports = sentenceGenerator;

},{}],11:[function(require,module,exports){
'use strict';
(function withoutDB() {
  var addEvents = require('./utlis/addEvents/dbFail');

  addEvents();
}());

},{"./utlis/addEvents/dbFail":1}]},{},[11])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9hZGRFdmVudHMvZGJGYWlsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvYWRkRXZlbnRzL2dlbmVyYXRvci5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2NsZWFyQ2hpbGROb2Rlcy5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2V2ZW50SGFuZGxlci9kYkZhaWwuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9ldmVudEhhbmRsZXIvZ2VuZXJhbC5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2dldEZvcm1hdERhdGUuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9yZWZyZXNoL2RiRmFpbC5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL3JlZnJlc2gvZ2VuZXJhbC5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL3RlbXBsZXRlL2l0ZW1HZW5lcmF0b3IuanMiLCJzcmMvc2NyaXB0cy91dGxpcy90ZW1wbGV0ZS9zZW50ZW5jZUdlbmVyYXRvci5qcyIsInNyYy9zY3JpcHRzL3dpdGhvdXREQi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG52YXIgYWRkRXZlbnRzID0gKGZ1bmN0aW9uIGRiRmFpbEdlbmVyYXRvcigpIHtcbiAgdmFyIGV2ZW50SGFuZGxlciA9IHJlcXVpcmUoJy4uL2V2ZW50SGFuZGxlci9kYkZhaWwnKTtcbiAgdmFyIGdlbmVyYXRvciA9IHJlcXVpcmUoJy4vZ2VuZXJhdG9yJyk7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGhhbmRsZXIoKSB7XG4gICAgd2luZG93LmFsZXJ0KCdZb3VyIGJyb3dzZXIgZG9lc25cXCd0IHN1cHBvcnQgYSBzdGFibGUgdmVyc2lvbiBvZiBJbmRleGVkREIuIFdlIHdpbGwgb2ZmZXIgeW91IHRoZSB3aXRob3V0IGluZGV4ZWREQiBtb2RlJyk7XG4gICAgZ2VuZXJhdG9yKGV2ZW50SGFuZGxlcik7XG4gIH07XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFkZEV2ZW50cztcbiIsIid1c2Ugc3RyaWN0JztcbmZ1bmN0aW9uIGdlbmVyYXRvcihoYW5kbGVyKSB7XG4gIHZhciBsaXN0O1xuXG4gIGhhbmRsZXIuc2hvd0luaXQoKTtcbiAgLy8gYWRkIGFsbCBldmVudExpc3RlbmVyXG4gIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICBsaXN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5jbGlja0xpLCBmYWxzZSk7XG4gIGxpc3QuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnJlbW92ZUxpLCBmYWxzZSk7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVyLmVudGVyQWRkLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhZGQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuYWRkLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93RG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93RG9uZSwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd1RvZG8nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd1RvZG8sIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dBbGwnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0FsbCwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0NsZWFyRG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93Q2xlYXJEb25lLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93Q2xlYXInKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0NsZWFyLCBmYWxzZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2VuZXJhdG9yO1xuIiwiJ3VzZSBzdHJpY3QnO1xuZnVuY3Rpb24gY2xlYXJDaGlsZE5vZGVzKHJvb3QpIHtcbiAgd2hpbGUgKHJvb3QuaGFzQ2hpbGROb2RlcygpKSB7IC8vIG9yIHJvb3QuZmlyc3RDaGlsZCBvciByb290Lmxhc3RDaGlsZFxuICAgIHJvb3QucmVtb3ZlQ2hpbGQocm9vdC5maXJzdENoaWxkKTtcbiAgfVxuICAvLyBvciByb290LmlubmVySFRNTCA9ICcnXG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2xlYXJDaGlsZE5vZGVzO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGV2ZW50SGFuZGxlciA9IChmdW5jdGlvbiBkYkZhaWxHZW5lcmF0b3IoKSB7XG4gIHZhciByZWZyZXNoID0gcmVxdWlyZSgnLi4vcmVmcmVzaC9kYkZhaWwnKTtcbiAgdmFyIGl0ZW1HZW5lcmF0b3IgPSByZXF1aXJlKCcuLi90ZW1wbGV0ZS9pdGVtR2VuZXJhdG9yJyk7XG4gIHZhciBnZW5lcmFsID0gcmVxdWlyZSgnLi9nZW5lcmFsJyk7XG4gIHZhciBfaWQgPSAwOyAvLyBzbyB0aGUgZmlyc3QgaXRlbSdzIGlkIGlzIDFcbiAgdmFyIF9mb3JFYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2g7IC8vIHNpbXBsaWZ5XG5cbiAgZnVuY3Rpb24gYWRkKCkge1xuICAgIHZhciBpbnB1dFZhbHVlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWU7XG5cbiAgICBpZiAoaW5wdXRWYWx1ZSA9PT0gJycpIHtcbiAgICAgIHdpbmRvdy5hbGVydCgncGxlYXNlIGlucHV0IGEgcmVhbCBkYXRhficpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhZGRIYW5kbGVyKGlucHV0VmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZEhhbmRsZXIoaW5wdXRWYWx1ZSkge1xuICAgIHZhciBuZXdEYXRhO1xuICAgIHZhciBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcblxuICAgIF9yZW1vdmVSYW5kb20obGlzdCk7XG4gICAgX2lkICs9IDE7XG4gICAgbmV3RGF0YSA9IGdlbmVyYWwuZGF0YUdlbmVyYXRvcihfaWQsIGlucHV0VmFsdWUpO1xuICAgIGxpc3QuaW5zZXJ0QmVmb3JlKGl0ZW1HZW5lcmF0b3IobmV3RGF0YSksIGxpc3QuZmlyc3RDaGlsZCk7IC8vIHB1c2ggbmV3TGkgdG8gZmlyc3RcbiAgICBnZW5lcmFsLnJlc2V0SW5wdXQoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9yZW1vdmVSYW5kb20obGlzdCkge1xuICAgIHZhciBsaXN0SXRlbXMgPSBsaXN0LmNoaWxkTm9kZXM7XG5cbiAgICBfZm9yRWFjaC5jYWxsKGxpc3RJdGVtcywgZnVuY3Rpb24gd2hldGhlckhhc1JhbmRvbShpdGVtKSB7XG4gICAgICBpZiAoaXRlbS5jbGFzc0xpc3QuY29udGFpbnMoJ2FwaG9yaXNtJykpIHtcbiAgICAgICAgbGlzdC5yZW1vdmVDaGlsZChpdGVtKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyBvciB1c2UgZm9yLi4uaW5cbiAgICAvLyBmb3IgKHZhciBpbmRleCBpbiBsaXN0SXRlbXMpIHtcbiAgICAvLyAgIGlmIChsaXN0SXRlbXMuaGFzT3duUHJvcGVydHkoaW5kZXgpKSB7XG4gICAgLy8gICAgIGlmIChsaXN0SXRlbXNbaW5kZXhdLmNsYXNzTGlzdC5jb250YWlucygnYXBob3Jpc20nKSkge1xuICAgIC8vICAgICAgIGxpc3QucmVtb3ZlQ2hpbGQobGlzdEl0ZW1zW2luZGV4XSk7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgIH1cbiAgICAvLyB9XG4gIH1cblxuICBmdW5jdGlvbiBlbnRlckFkZChlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgIGFkZCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsaWNrTGkoZSkge1xuICAgIHZhciB0YXJnZXRMaSA9IGUudGFyZ2V0O1xuICAgIC8vIHVzZSBldmVudCBkZWxlZ2F0aW9uXG5cbiAgICBpZiAodGFyZ2V0TGkuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJykpIHtcbiAgICAgIHRhcmdldExpLmNsYXNzTGlzdC50b2dnbGUoJ2ZpbmlzaGVkJyk7XG4gICAgICBzaG93QWxsKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gbGkncyBbeF0ncyBkZWxldGVcbiAgZnVuY3Rpb24gcmVtb3ZlTGkoZSkge1xuICAgIGlmIChlLnRhcmdldC5jbGFzc05hbWUgPT09ICdjbG9zZScpIHsgLy8gdXNlIGV2ZW50IGRlbGVnYXRpb25cbiAgICAgIF9yZW1vdmVMaUhhbmRsZXIoZS50YXJnZXQpO1xuICAgICAgZ2VuZXJhbC5pZkVtcHR5LmFkZFJhbmRvbSgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9yZW1vdmVMaUhhbmRsZXIoZWxlbWVudCkge1xuICAgIC8vIHVzZSBwcmV2aW91c2x5IHN0b3JlZCBkYXRhXG4gICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgIHZhciBsaXN0SXRlbXMgPSBsaXN0LmNoaWxkTm9kZXM7XG4gICAgdmFyIGlkID0gZWxlbWVudC5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpO1xuXG4gICAgdHJ5IHtcbiAgICAgIF9mb3JFYWNoLmNhbGwobGlzdEl0ZW1zLCBmdW5jdGlvbiB3aGV0aGVySGFzUmFuZG9tKGl0ZW0pIHtcbiAgICAgICAgaWYgKGl0ZW0uZ2V0QXR0cmlidXRlKCdkYXRhLWlkJykgPT09IGlkKSB7XG4gICAgICAgICAgbGlzdC5yZW1vdmVDaGlsZChpdGVtKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdXcm9uZyBpZCwgbm90IGZvdW5kIGluIERPTSB0cmVlJyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGZvciBTZW1hbnRpY1xuICBnZW5lcmFsLmlmRW1wdHkuYWRkUmFuZG9tID0gZnVuY3Rpb24gYWRkUmFuZG9tKCkge1xuICAgIHZhciBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcblxuICAgIGlmICghbGlzdC5oYXNDaGlsZE5vZGVzKCkgfHwgX2FsbERpc2FwcGVhcihsaXN0KSkge1xuICAgICAgcmVmcmVzaC5yYW5kb20oKTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gX2FsbERpc2FwcGVhcihsaXN0KSB7XG4gICAgdmFyIGxpc3RJdGVtcyA9IGxpc3QuY2hpbGROb2RlcztcblxuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuZXZlcnkuY2FsbChsaXN0SXRlbXMsIGZ1bmN0aW9uIHdoZXRoZXJIYXNSYW5kb20oaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0uc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0luaXQoKSB7XG4gICAgcmVmcmVzaC5pbml0KCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93QWxsKCkge1xuICAgIHZhciBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgICB2YXIgbGlzdEl0ZW1zID0gbGlzdC5jaGlsZE5vZGVzO1xuXG4gICAgX2ZvckVhY2guY2FsbChsaXN0SXRlbXMsIGZ1bmN0aW9uIGFwcGVhckFsbChpdGVtKSB7XG4gICAgICBfd2hldGhlckFwcGVhcihpdGVtLCB0cnVlKTtcbiAgICAgIGlmIChpdGVtLmNsYXNzTGlzdC5jb250YWlucygnZmluaXNoZWQnKSkge1xuICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGl0ZW0pO1xuICAgICAgICBsaXN0LmFwcGVuZENoaWxkKGl0ZW0pOyAvLyBQVU5DSExJTkU6IGRyb3AgZG9uZSBpdGVtXG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93RG9uZSgpIHtcbiAgICBfc2hvd1doZXRoZXJEb25lKHRydWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd1RvZG8oKSB7XG4gICAgX3Nob3dXaGV0aGVyRG9uZShmYWxzZSk7XG4gIH1cblxuICBmdW5jdGlvbiBfc2hvd1doZXRoZXJEb25lKHdoZXRoZXJEb25lKSB7XG4gICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgIHZhciBsaXN0SXRlbXMgPSBsaXN0LmNoaWxkTm9kZXM7XG5cbiAgICBfcmVtb3ZlUmFuZG9tKGxpc3QpO1xuICAgIF9mb3JFYWNoLmNhbGwobGlzdEl0ZW1zLCBmdW5jdGlvbiB3aGV0aGVyRG9uZUFwcGVhcihpdGVtKSB7XG4gICAgICBpdGVtLmNsYXNzTGlzdC5jb250YWlucygnZmluaXNoZWQnKSA/IF93aGV0aGVyQXBwZWFyKGl0ZW0sIHdoZXRoZXJEb25lKSA6IF93aGV0aGVyQXBwZWFyKGl0ZW0sICF3aGV0aGVyRG9uZSk7XG4gICAgfSk7XG4gICAgZ2VuZXJhbC5pZkVtcHR5LmFkZFJhbmRvbSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3doZXRoZXJBcHBlYXIoZWxlbWVudCwgd2hldGhlcikge1xuICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IHdoZXRoZXIgPyAnYmxvY2snIDogJ25vbmUnO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0NsZWFyRG9uZSgpIHtcbiAgICB2YXIgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgdmFyIGxpc3RJdGVtcyA9IGxpc3QuY2hpbGROb2RlcztcblxuICAgIF9yZW1vdmVSYW5kb20obGlzdCk7XG4gICAgX2ZvckVhY2guY2FsbChsaXN0SXRlbXMsIGZ1bmN0aW9uIGNsZWFyRG9uZUl0ZW1zKGl0ZW0pIHtcbiAgICAgIGlmIChpdGVtLmNsYXNzTGlzdC5jb250YWlucygnZmluaXNoZWQnKSkge1xuICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGl0ZW0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGdlbmVyYWwuaWZFbXB0eS5hZGRSYW5kb20oKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dDbGVhcigpIHtcbiAgICByZWZyZXNoLmNsZWFyKCk7IC8vIGNsZWFyIG5vZGVzIHZpc3VhbGx5XG4gICAgcmVmcmVzaC5yYW5kb20oKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYWRkOiBhZGQsXG4gICAgZW50ZXJBZGQ6IGVudGVyQWRkLFxuICAgIGNsaWNrTGk6IGNsaWNrTGksXG4gICAgcmVtb3ZlTGk6IHJlbW92ZUxpLFxuICAgIHNob3dJbml0OiBzaG93SW5pdCxcbiAgICBzaG93QWxsOiBzaG93QWxsLFxuICAgIHNob3dEb25lOiBzaG93RG9uZSxcbiAgICBzaG93VG9kbzogc2hvd1RvZG8sXG4gICAgc2hvd0NsZWFyRG9uZTogc2hvd0NsZWFyRG9uZSxcbiAgICBzaG93Q2xlYXI6IHNob3dDbGVhclxuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBldmVudEhhbmRsZXI7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgZ2VuZXJhbCA9IChmdW5jdGlvbiBnZW5lcmFsR2VuZXJhdG9yKCkge1xuICB2YXIgZ2V0Rm9ybWF0RGF0ZSA9IHJlcXVpcmUoJy4uL2dldEZvcm1hdERhdGUnKTtcblxuICB2YXIgaWZFbXB0eSA9IHtcbiAgICByZW1vdmVJbml0OiBmdW5jdGlvbiByZW1vdmVJbml0KCkge1xuICAgICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gICAgICBpZiAobGlzdC5maXJzdENoaWxkLmNsYXNzTmFtZSA9PT0gJ2FwaG9yaXNtJykge1xuICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGxpc3QuZmlyc3RDaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIHJlc2V0SW5wdXQoKSB7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWUgPSAnJztcbiAgfVxuXG4gIGZ1bmN0aW9uIGRhdGFHZW5lcmF0b3Ioa2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiB7XG4gICAgICBpZDoga2V5LFxuICAgICAgZXZlbnQ6IHZhbHVlLFxuICAgICAgZmluaXNoZWQ6IGZhbHNlLFxuICAgICAgZGF0ZTogZ2V0Rm9ybWF0RGF0ZSgnTU3mnIhkZOaXpWhoOm1tJykgKyAnICdcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpZkVtcHR5OiBpZkVtcHR5LFxuICAgIHJlc2V0SW5wdXQ6IHJlc2V0SW5wdXQsXG4gICAgZGF0YUdlbmVyYXRvcjogZGF0YUdlbmVyYXRvclxuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBnZW5lcmFsO1xuIiwiJ3VzZSBzdHJpY3QnO1xuZnVuY3Rpb24gZ2V0Rm9ybWF0RGF0ZShmbXQpIHtcbiAgdmFyIG5ld0RhdGUgPSBuZXcgRGF0ZSgpO1xuICB2YXIgbmV3Zm10ID0gZm10O1xuICB2YXIgbyA9IHtcbiAgICAneSsnOiBuZXdEYXRlLmdldEZ1bGxZZWFyKCksXG4gICAgJ00rJzogbmV3RGF0ZS5nZXRNb250aCgpICsgMSxcbiAgICAnZCsnOiBuZXdEYXRlLmdldERhdGUoKSxcbiAgICAnaCsnOiBuZXdEYXRlLmdldEhvdXJzKCksXG4gICAgJ20rJzogbmV3RGF0ZS5nZXRNaW51dGVzKClcbiAgfTtcbiAgdmFyIGxlbnM7XG5cbiAgZm9yICh2YXIgayBpbiBvKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJygnICsgayArICcpJykudGVzdChuZXdmbXQpKSB7XG4gICAgICBpZiAoayA9PT0gJ3krJykge1xuICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsICgnJyArIG9ba10pLnN1YnN0cig0IC0gUmVnRXhwLiQxLmxlbmd0aCkpO1xuICAgICAgfSBlbHNlIGlmIChrID09PSAnUysnKSB7XG4gICAgICAgIGxlbnMgPSBSZWdFeHAuJDEubGVuZ3RoO1xuICAgICAgICBsZW5zID0gbGVucyA9PT0gMSA/IDMgOiBsZW5zO1xuICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsICgnMDAnICsgb1trXSkuc3Vic3RyKCgnJyArIG9ba10pLmxlbmd0aCAtIDEsIGxlbnMpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKFJlZ0V4cC4kMS5sZW5ndGggPT09IDEpID8gKG9ba10pIDogKCgnMDAnICsgb1trXSkuc3Vic3RyKCgnJyArIG9ba10pLmxlbmd0aCkpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmV3Zm10O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldEZvcm1hdERhdGU7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgcmVmcmVzaCA9IChmdW5jdGlvbiBkYkZhaWxHZW5lcmF0b3IoKSB7XG4gIHZhciBnZW5lcmFsID0gcmVxdWlyZSgnLi9nZW5lcmFsJyk7XG5cbiAgZnVuY3Rpb24gcmFuZG9tQXBob3Jpc20oKSB7XG4gICAgdmFyIGFwaG9yaXNtcyA9IFtcbiAgICAgICdZZXN0ZXJkYXkgWW91IFNhaWQgVG9tb3Jyb3cnLFxuICAgICAgJ1doeSBhcmUgd2UgaGVyZT8nLFxuICAgICAgJ0FsbCBpbiwgb3Igbm90aGluZycsXG4gICAgICAnWW91IE5ldmVyIFRyeSwgWW91IE5ldmVyIEtub3cnLFxuICAgICAgJ1RoZSB1bmV4YW1pbmVkIGxpZmUgaXMgbm90IHdvcnRoIGxpdmluZy4gLS0gU29jcmF0ZXMnLFxuICAgICAgJ1RoZXJlIGlzIG9ubHkgb25lIHRoaW5nIHdlIHNheSB0byBsYXp5OiBOT1QgVE9EQVknXG4gICAgXTtcbiAgICB2YXIgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcGhvcmlzbXMubGVuZ3RoKTtcbiAgICB2YXIgdGV4dCA9IGFwaG9yaXNtc1tyYW5kb21JbmRleF07XG5cbiAgICBnZW5lcmFsLnNlbnRlbmNlSGFuZGxlcih0ZXh0KTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaW5pdDogZ2VuZXJhbC5pbml0LFxuICAgIGFsbDogZ2VuZXJhbC5hbGwuYmluZChudWxsLCByYW5kb21BcGhvcmlzbSksXG4gICAgcGFydDogZ2VuZXJhbC5wYXJ0LmJpbmQobnVsbCwgcmFuZG9tQXBob3Jpc20pLFxuICAgIGNsZWFyOiBnZW5lcmFsLmNsZWFyLFxuICAgIHJhbmRvbTogcmFuZG9tQXBob3Jpc21cbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVmcmVzaDtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBnZW5lcmFsID0gKGZ1bmN0aW9uIGdlbmVyYWxHZW5lcmF0b3IoKSB7XG4gIHZhciBpdGVtR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vdGVtcGxldGUvaXRlbUdlbmVyYXRvcicpO1xuICB2YXIgc2VudGVuY2VHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi90ZW1wbGV0ZS9zZW50ZW5jZUdlbmVyYXRvcicpO1xuICB2YXIgY2xlYXJDaGlsZE5vZGVzID0gcmVxdWlyZSgnLi4vY2xlYXJDaGlsZE5vZGVzJyk7XG5cbiAgZnVuY3Rpb24gaW5pdChkYXRhQXJyKSB7XG4gICAgX3Nob3coZGF0YUFyciwgX2luaXRTZW50ZW5jZSwgX3JlbmRlckFsbCk7XG4gIH1cblxuICBmdW5jdGlvbiBfc2hvdyhkYXRhQXJyLCBzaG93U2VudGVuY2VGdW5jLCBnZW5lcmF0ZUZ1bmMpIHtcbiAgICBpZiAoIWRhdGFBcnIgfHwgZGF0YUFyci5sZW5ndGggPT09IDApIHtcbiAgICAgIHNob3dTZW50ZW5jZUZ1bmMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5pbm5lckhUTUwgPSBnZW5lcmF0ZUZ1bmMoZGF0YUFycik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX2luaXRTZW50ZW5jZSgpIHtcbiAgICB2YXIgdGV4dCA9ICdXZWxjb21lfiwgdHJ5IHRvIGFkZCB5b3VyIGZpcnN0IHRvLWRvIGxpc3QgOiApJztcblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuaW5uZXJIVE1MID0gc2VudGVuY2VHZW5lcmF0b3IodGV4dCk7XG4gIH1cblxuICBmdW5jdGlvbiBhbGwocmFuZG9tQXBob3Jpc20sIGRhdGFBcnIpIHtcbiAgICBfc2hvdyhkYXRhQXJyLCByYW5kb21BcGhvcmlzbSwgX3JlbmRlckFsbCk7XG4gIH1cblxuICBmdW5jdGlvbiBfcmVuZGVyQWxsKGRhdGFBcnIpIHtcbiAgICB2YXIgY2xhc3NpZmllZERhdGEgPSBfY2xhc3NpZnlEYXRhKGRhdGFBcnIpO1xuXG4gICAgcmV0dXJuIGl0ZW1HZW5lcmF0b3IoY2xhc3NpZmllZERhdGEpO1xuICB9XG5cbiAgZnVuY3Rpb24gX2NsYXNzaWZ5RGF0YShkYXRhQXJyKSB7XG4gICAgdmFyIGZpbmlzaGVkID0gW107XG4gICAgdmFyIHVuZmlzaGllZCA9IFtdO1xuXG4gICAgLy8gcHV0IHRoZSBmaW5pc2hlZCBpdGVtIHRvIHRoZSBib3R0b21cbiAgICBkYXRhQXJyLmZvckVhY2goZnVuY3Rpb24gY2xhc3NpZnkoZGF0YSkge1xuICAgICAgZGF0YS5maW5pc2hlZCA/IGZpbmlzaGVkLnB1c2goZGF0YSkgOiB1bmZpc2hpZWQucHVzaChkYXRhKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB1bmZpc2hpZWQuY29uY2F0KGZpbmlzaGVkKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnQocmFuZG9tQXBob3Jpc20sIGRhdGFBcnIpIHtcbiAgICBfc2hvdyhkYXRhQXJyLCByYW5kb21BcGhvcmlzbSwgX3JlbmRlclBhcnQpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3JlbmRlclBhcnQoZGF0YUFycikge1xuICAgIHJldHVybiBpdGVtR2VuZXJhdG9yKGRhdGFBcnIpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgY2xlYXJDaGlsZE5vZGVzKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2VudGVuY2VIYW5kbGVyKHRleHQpIHtcbiAgICB2YXIgcmVuZGVyZWQgPSBzZW50ZW5jZUdlbmVyYXRvcih0ZXh0KTtcblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuaW5uZXJIVE1MID0gcmVuZGVyZWQ7XG4gIH1cblxuXG4gIHJldHVybiB7XG4gICAgaW5pdDogaW5pdCxcbiAgICBhbGw6IGFsbCxcbiAgICBwYXJ0OiBwYXJ0LFxuICAgIGNsZWFyOiBjbGVhcixcbiAgICBzZW50ZW5jZUhhbmRsZXI6IHNlbnRlbmNlSGFuZGxlclxuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBnZW5lcmFsO1xuIiwiJ3VzZSBzdHJpY3QnO1xuZnVuY3Rpb24gaXRlbUdlbmVyYXRvcihkYXRhQXJyKSB7XG4gIHZhciByZXN1bHQgPSBkYXRhQXJyO1xuICB2YXIgcmVuZGVyZWQ7XG4gIHZhciB0ZW1wbGF0ZSA9IEhhbmRsZWJhcnMudGVtcGxhdGVzLmxpO1xuXG4gIGlmICghQXJyYXkuaXNBcnJheShkYXRhQXJyKSkge1xuICAgIHJlc3VsdCA9IFtkYXRhQXJyXTtcbiAgfVxuICByZW5kZXJlZCA9IHRlbXBsYXRlKHtsaXN0SXRlbXM6IHJlc3VsdH0pO1xuXG4gIHJldHVybiByZW5kZXJlZC50cmltKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXRlbUdlbmVyYXRvcjtcbiIsIid1c2Ugc3RyaWN0JztcbmZ1bmN0aW9uIHNlbnRlbmNlR2VuZXJhdG9yKHRleHQpIHtcbiAgdmFyIHRlbXBsYXRlID0gSGFuZGxlYmFycy50ZW1wbGF0ZXMubGk7XG4gIHZhciByZW5kZXJlZCA9IHRlbXBsYXRlKHtcInNlbnRlbmNlXCI6IHRleHR9KTtcblxuICByZXR1cm4gcmVuZGVyZWQudHJpbSgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNlbnRlbmNlR2VuZXJhdG9yO1xuIiwiJ3VzZSBzdHJpY3QnO1xuKGZ1bmN0aW9uIHdpdGhvdXREQigpIHtcbiAgdmFyIGFkZEV2ZW50cyA9IHJlcXVpcmUoJy4vdXRsaXMvYWRkRXZlbnRzL2RiRmFpbCcpO1xuXG4gIGFkZEV2ZW50cygpO1xufSgpKTtcbiJdfQ==
