(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
module.exports = (function addEventsDBFail() {
  var eventHandler = require('../eventHandler/dbFail.js');
  var general = require('./general.js');

  return function addEvents() {
    window.alert('Your browser doesn\'t support a stable version of IndexedDB. We will offer you the without indexedDB mode');
    general(eventHandler);
  };
}());

},{"../eventHandler/dbFail.js":4,"./general.js":2}],2:[function(require,module,exports){
module.exports = function addEventsGenerator(handler) {
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
};

},{}],3:[function(require,module,exports){
module.exports = function clearChildNodes(root) {
  while (root.hasChildNodes()) { // or root.firstChild or root.lastChild
    root.removeChild(root.firstChild);
  }
  // or root.innerHTML = ''
};

},{}],4:[function(require,module,exports){
'use strict';
var dbFail = (function dbFailGenerator() {
  var refresh = require('../refresh/dbFail');
  var liGenerator = require('../liGenerator.js');
  var general = require('./general.js');
  var _id = 0; // so the first item's id is 1
  var _forEach = Array.prototype.forEach; // simplify

  function add() {
    var inputValue = document.querySelector('#input').value;
    var newData;
    var list;

    if (inputValue === '') {
      window.alert('please input a real data~');
      return 0;
    }
    list = document.querySelector('#list');
    _removeRandom(list);
    _id += 1;
    newData = general.dataGenerator(_id, inputValue);
    list.insertBefore(liGenerator(newData), list.firstChild); // push newLi to first
    document.querySelector('#input').value = '';  // reset input's values

    return 0;
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
    refresh.clear();
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

module.exports = dbFail;

},{"../liGenerator.js":6,"../refresh/dbFail":7,"./general.js":5}],5:[function(require,module,exports){
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
      date: _getNewDate('MM月dd日hh:mm') + ' '
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

},{}],6:[function(require,module,exports){
'use strict';
var liGenerator = (function liGenerator() {
  function _decorateLi(li, data) {
    var text = document.createTextNode(' ' + data.event);
    var textDate = document.createTextNode(data.date + ': ');
    var textWrap = document.createElement('span');

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

module.exports = liGenerator;

},{}],7:[function(require,module,exports){
module.exports = (function dbFailGenerator() {
  var general = require('./general.js');

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


},{"./general.js":8}],8:[function(require,module,exports){
'use strict';
var general = (function generalGenerator() {
  var liGenerator = require('../liGenerator.js');
  var clearChildNodes = require('../clearChildNodes.js');

  function init(dataArr) {
    _show(_initSentence, _showAll, dataArr);
  }

  function _show(showSentenceFunc, showFunc, dataArr) {
    if (!dataArr || dataArr.length === 0) {
      showSentenceFunc();
    } else {
      showFunc(dataArr);
    }
  }

  function _initSentence() {
    var text = 'Welcome~, try to add your first to-do list : )';

    sentenceHandler(text);
  }

  function _showAll(dataArr) {
    var result = _classifyData(dataArr);

    document.querySelector('#list').appendChild(result); // add it to DOM
  }

  function _classifyData(dataArr) {
    // PUNCHLINE: use fragment to reduce DOM operate
    var unfishied = document.createDocumentFragment();
    var finished = document.createDocumentFragment();
    var mix = document.createDocumentFragment();

    // put the finished item to the bottom
    dataArr.forEach(function classify(data) {
      if (data.finished) {
        finished.insertBefore(liGenerator(data), finished.firstChild);
      } else {
        unfishied.insertBefore(liGenerator(data), unfishied.firstChild);
      }
    });
    mix.appendChild(unfishied);
    mix.appendChild(finished);

    return mix;
  }

  function all(randomAphorism, dataArr) {
    _show(randomAphorism, _showAll, dataArr);
  }

  function part(randomAphorism, dataArr) {
    _show(randomAphorism, _showpart, dataArr);
  }

  function _showpart(dataArr) {
    var nodes = dataArr.reduce(function nodeGenerator(result, data) {
      result.insertBefore(liGenerator(data), result.firstChild);

      return result;
    }, document.createDocumentFragment()); // PUNCHLINE: brilliant arr.reduce() + documentFragment

    document.querySelector('#list').appendChild(nodes); // add it to DOM
  }

  function clear() {
    clearChildNodes(document.querySelector('#list'));
  }

  function sentenceHandler(text) {
    var li = document.createElement('li');
    var textNode = document.createTextNode(text);

    li.appendChild(textNode);
    li.className = 'aphorism';
    document.querySelector('#list').appendChild(li);
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

},{"../clearChildNodes.js":3,"../liGenerator.js":6}],9:[function(require,module,exports){
'use strict';
(function withoutDB() {
  var addEvents = require('./utlis/addEvents/dbFail.js');

  addEvents();
}());

},{"./utlis/addEvents/dbFail.js":1}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9hZGRFdmVudHMvZGJGYWlsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvYWRkRXZlbnRzL2dlbmVyYWwuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9jbGVhckNoaWxkTm9kZXMuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9ldmVudEhhbmRsZXIvZGJGYWlsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZXZlbnRIYW5kbGVyL2dlbmVyYWwuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9saUdlbmVyYXRvci5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL3JlZnJlc2gvZGJGYWlsLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvcmVmcmVzaC9nZW5lcmFsLmpzIiwic3JjL3NjcmlwdHMvd2l0aG91dERCLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiBhZGRFdmVudHNEQkZhaWwoKSB7XG4gIHZhciBldmVudEhhbmRsZXIgPSByZXF1aXJlKCcuLi9ldmVudEhhbmRsZXIvZGJGYWlsLmpzJyk7XG4gIHZhciBnZW5lcmFsID0gcmVxdWlyZSgnLi9nZW5lcmFsLmpzJyk7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGFkZEV2ZW50cygpIHtcbiAgICB3aW5kb3cuYWxlcnQoJ1lvdXIgYnJvd3NlciBkb2VzblxcJ3Qgc3VwcG9ydCBhIHN0YWJsZSB2ZXJzaW9uIG9mIEluZGV4ZWREQi4gV2Ugd2lsbCBvZmZlciB5b3UgdGhlIHdpdGhvdXQgaW5kZXhlZERCIG1vZGUnKTtcbiAgICBnZW5lcmFsKGV2ZW50SGFuZGxlcik7XG4gIH07XG59KCkpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBhZGRFdmVudHNHZW5lcmF0b3IoaGFuZGxlcikge1xuICB2YXIgbGlzdDtcblxuICBoYW5kbGVyLnNob3dJbml0KCk7XG4gIC8vIGFkZCBhbGwgZXZlbnRMaXN0ZW5lclxuICBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgbGlzdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuY2xpY2tMaSwgZmFsc2UpO1xuICBsaXN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5yZW1vdmVMaSwgZmFsc2UpO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlci5lbnRlckFkZCwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWRkJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLmFkZCwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0RvbmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0RvbmUsIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dUb2RvJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dUb2RvLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93QWxsJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dBbGwsIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dDbGVhckRvbmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIuc2hvd0NsZWFyRG9uZSwgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0NsZWFyJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dDbGVhciwgZmFsc2UpO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY2xlYXJDaGlsZE5vZGVzKHJvb3QpIHtcbiAgd2hpbGUgKHJvb3QuaGFzQ2hpbGROb2RlcygpKSB7IC8vIG9yIHJvb3QuZmlyc3RDaGlsZCBvciByb290Lmxhc3RDaGlsZFxuICAgIHJvb3QucmVtb3ZlQ2hpbGQocm9vdC5maXJzdENoaWxkKTtcbiAgfVxuICAvLyBvciByb290LmlubmVySFRNTCA9ICcnXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGRiRmFpbCA9IChmdW5jdGlvbiBkYkZhaWxHZW5lcmF0b3IoKSB7XG4gIHZhciByZWZyZXNoID0gcmVxdWlyZSgnLi4vcmVmcmVzaC9kYkZhaWwnKTtcbiAgdmFyIGxpR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vbGlHZW5lcmF0b3IuanMnKTtcbiAgdmFyIGdlbmVyYWwgPSByZXF1aXJlKCcuL2dlbmVyYWwuanMnKTtcbiAgdmFyIF9pZCA9IDA7IC8vIHNvIHRoZSBmaXJzdCBpdGVtJ3MgaWQgaXMgMVxuICB2YXIgX2ZvckVhY2ggPSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaDsgLy8gc2ltcGxpZnlcblxuICBmdW5jdGlvbiBhZGQoKSB7XG4gICAgdmFyIGlucHV0VmFsdWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5wdXQnKS52YWx1ZTtcbiAgICB2YXIgbmV3RGF0YTtcbiAgICB2YXIgbGlzdDtcblxuICAgIGlmIChpbnB1dFZhbHVlID09PSAnJykge1xuICAgICAgd2luZG93LmFsZXJ0KCdwbGVhc2UgaW5wdXQgYSByZWFsIGRhdGF+Jyk7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgX3JlbW92ZVJhbmRvbShsaXN0KTtcbiAgICBfaWQgKz0gMTtcbiAgICBuZXdEYXRhID0gZ2VuZXJhbC5kYXRhR2VuZXJhdG9yKF9pZCwgaW5wdXRWYWx1ZSk7XG4gICAgbGlzdC5pbnNlcnRCZWZvcmUobGlHZW5lcmF0b3IobmV3RGF0YSksIGxpc3QuZmlyc3RDaGlsZCk7IC8vIHB1c2ggbmV3TGkgdG8gZmlyc3RcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5wdXQnKS52YWx1ZSA9ICcnOyAgLy8gcmVzZXQgaW5wdXQncyB2YWx1ZXNcblxuICAgIHJldHVybiAwO1xuICB9XG5cbiAgZnVuY3Rpb24gX3JlbW92ZVJhbmRvbShsaXN0KSB7XG4gICAgdmFyIGxpc3RJdGVtcyA9IGxpc3QuY2hpbGROb2RlcztcblxuICAgIF9mb3JFYWNoLmNhbGwobGlzdEl0ZW1zLCBmdW5jdGlvbiB3aGV0aGVySGFzUmFuZG9tKGl0ZW0pIHtcbiAgICAgIGlmIChpdGVtLmNsYXNzTGlzdC5jb250YWlucygnYXBob3Jpc20nKSkge1xuICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGl0ZW0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8vIG9yIHVzZSBmb3IuLi5pblxuICAgIC8vIGZvciAodmFyIGluZGV4IGluIGxpc3RJdGVtcykge1xuICAgIC8vICAgaWYgKGxpc3RJdGVtcy5oYXNPd25Qcm9wZXJ0eShpbmRleCkpIHtcbiAgICAvLyAgICAgaWYgKGxpc3RJdGVtc1tpbmRleF0uY2xhc3NMaXN0LmNvbnRhaW5zKCdhcGhvcmlzbScpKSB7XG4gICAgLy8gICAgICAgbGlzdC5yZW1vdmVDaGlsZChsaXN0SXRlbXNbaW5kZXhdKTtcbiAgICAvLyAgICAgfVxuICAgIC8vICAgfVxuICAgIC8vIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGVudGVyQWRkKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgYWRkKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY2xpY2tMaShlKSB7XG4gICAgdmFyIHRhcmdldExpID0gZS50YXJnZXQ7XG4gICAgLy8gdXNlIGV2ZW50IGRlbGVnYXRpb25cblxuICAgIGlmICh0YXJnZXRMaS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSkge1xuICAgICAgdGFyZ2V0TGkuY2xhc3NMaXN0LnRvZ2dsZSgnZmluaXNoZWQnKTtcbiAgICAgIHNob3dBbGwoKTtcbiAgICB9XG4gIH1cblxuICAvLyBsaSdzIFt4XSdzIGRlbGV0ZVxuICBmdW5jdGlvbiByZW1vdmVMaShlKSB7XG4gICAgaWYgKGUudGFyZ2V0LmNsYXNzTmFtZSA9PT0gJ2Nsb3NlJykgeyAvLyB1c2UgZXZlbnQgZGVsZWdhdGlvblxuICAgICAgX3JlbW92ZUxpSGFuZGxlcihlLnRhcmdldCk7XG4gICAgICBnZW5lcmFsLmlmRW1wdHkuYWRkUmFuZG9tKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX3JlbW92ZUxpSGFuZGxlcihlbGVtZW50KSB7XG4gICAgLy8gdXNlIHByZXZpb3VzbHkgc3RvcmVkIGRhdGFcbiAgICB2YXIgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgdmFyIGxpc3RJdGVtcyA9IGxpc3QuY2hpbGROb2RlcztcbiAgICB2YXIgaWQgPSBlbGVtZW50LnBhcmVudE5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyk7XG5cbiAgICB0cnkge1xuICAgICAgX2ZvckVhY2guY2FsbChsaXN0SXRlbXMsIGZ1bmN0aW9uIHdoZXRoZXJIYXNSYW5kb20oaXRlbSkge1xuICAgICAgICBpZiAoaXRlbS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKSA9PT0gaWQpIHtcbiAgICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGl0ZW0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5sb2coJ1dyb25nIGlkLCBub3QgZm91bmQgaW4gRE9NIHRyZWUnKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgLy8gZm9yIFNlbWFudGljXG4gIGdlbmVyYWwuaWZFbXB0eS5hZGRSYW5kb20gPSBmdW5jdGlvbiBhZGRSYW5kb20oKSB7XG4gICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gICAgaWYgKCFsaXN0Lmhhc0NoaWxkTm9kZXMoKSB8fCBfYWxsRGlzYXBwZWFyKGxpc3QpKSB7XG4gICAgICByZWZyZXNoLnJhbmRvbSgpO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBfYWxsRGlzYXBwZWFyKGxpc3QpIHtcbiAgICB2YXIgbGlzdEl0ZW1zID0gbGlzdC5jaGlsZE5vZGVzO1xuXG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5ldmVyeS5jYWxsKGxpc3RJdGVtcywgZnVuY3Rpb24gd2hldGhlckhhc1JhbmRvbShpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS5zdHlsZS5kaXNwbGF5ID09PSAnbm9uZSc7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93SW5pdCgpIHtcbiAgICByZWZyZXNoLmNsZWFyKCk7XG4gICAgcmVmcmVzaC5pbml0KCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93QWxsKCkge1xuICAgIHZhciBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgICB2YXIgbGlzdEl0ZW1zID0gbGlzdC5jaGlsZE5vZGVzO1xuXG4gICAgX2ZvckVhY2guY2FsbChsaXN0SXRlbXMsIGZ1bmN0aW9uIGFwcGVhckFsbChpdGVtKSB7XG4gICAgICBfd2hldGhlckFwcGVhcihpdGVtLCB0cnVlKTtcbiAgICAgIGlmIChpdGVtLmNsYXNzTGlzdC5jb250YWlucygnZmluaXNoZWQnKSkge1xuICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGl0ZW0pO1xuICAgICAgICBsaXN0LmFwcGVuZENoaWxkKGl0ZW0pOyAvLyBQVU5DSExJTkU6IGRyb3AgZG9uZSBpdGVtXG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93RG9uZSgpIHtcbiAgICBfc2hvd1doZXRoZXJEb25lKHRydWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd1RvZG8oKSB7XG4gICAgX3Nob3dXaGV0aGVyRG9uZShmYWxzZSk7XG4gIH1cblxuICBmdW5jdGlvbiBfc2hvd1doZXRoZXJEb25lKHdoZXRoZXJEb25lKSB7XG4gICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgIHZhciBsaXN0SXRlbXMgPSBsaXN0LmNoaWxkTm9kZXM7XG5cbiAgICBfcmVtb3ZlUmFuZG9tKGxpc3QpO1xuICAgIF9mb3JFYWNoLmNhbGwobGlzdEl0ZW1zLCBmdW5jdGlvbiB3aGV0aGVyRG9uZUFwcGVhcihpdGVtKSB7XG4gICAgICBpdGVtLmNsYXNzTGlzdC5jb250YWlucygnZmluaXNoZWQnKSA/IF93aGV0aGVyQXBwZWFyKGl0ZW0sIHdoZXRoZXJEb25lKSA6IF93aGV0aGVyQXBwZWFyKGl0ZW0sICF3aGV0aGVyRG9uZSk7XG4gICAgfSk7XG4gICAgZ2VuZXJhbC5pZkVtcHR5LmFkZFJhbmRvbSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3doZXRoZXJBcHBlYXIoZWxlbWVudCwgd2hldGhlcikge1xuICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IHdoZXRoZXIgPyAnYmxvY2snIDogJ25vbmUnO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0NsZWFyRG9uZSgpIHtcbiAgICB2YXIgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgdmFyIGxpc3RJdGVtcyA9IGxpc3QuY2hpbGROb2RlcztcblxuICAgIF9yZW1vdmVSYW5kb20obGlzdCk7XG4gICAgX2ZvckVhY2guY2FsbChsaXN0SXRlbXMsIGZ1bmN0aW9uIGNsZWFyRG9uZUl0ZW1zKGl0ZW0pIHtcbiAgICAgIGlmIChpdGVtLmNsYXNzTGlzdC5jb250YWlucygnZmluaXNoZWQnKSkge1xuICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGl0ZW0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGdlbmVyYWwuaWZFbXB0eS5hZGRSYW5kb20oKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dDbGVhcigpIHtcbiAgICByZWZyZXNoLmNsZWFyKCk7IC8vIGNsZWFyIG5vZGVzIHZpc3VhbGx5XG4gICAgcmVmcmVzaC5yYW5kb20oKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYWRkOiBhZGQsXG4gICAgZW50ZXJBZGQ6IGVudGVyQWRkLFxuICAgIGNsaWNrTGk6IGNsaWNrTGksXG4gICAgcmVtb3ZlTGk6IHJlbW92ZUxpLFxuICAgIHNob3dJbml0OiBzaG93SW5pdCxcbiAgICBzaG93QWxsOiBzaG93QWxsLFxuICAgIHNob3dEb25lOiBzaG93RG9uZSxcbiAgICBzaG93VG9kbzogc2hvd1RvZG8sXG4gICAgc2hvd0NsZWFyRG9uZTogc2hvd0NsZWFyRG9uZSxcbiAgICBzaG93Q2xlYXI6IHNob3dDbGVhclxuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBkYkZhaWw7XG4iLCJ2YXIgZ2VuZXJhbCA9IChmdW5jdGlvbiBnZW5lcmFsR2VuZXJhdG9yKCkge1xuICB2YXIgaWZFbXB0eSA9IHtcbiAgICByZW1vdmVJbml0OiBmdW5jdGlvbiByZW1vdmVJbml0KCkge1xuICAgICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gICAgICBpZiAobGlzdC5maXJzdENoaWxkLmNsYXNzTmFtZSA9PT0gJ2FwaG9yaXNtJykge1xuICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGxpc3QuZmlyc3RDaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIGRhdGFHZW5lcmF0b3Ioa2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiB7XG4gICAgICBpZDoga2V5LFxuICAgICAgZXZlbnQ6IHZhbHVlLFxuICAgICAgZmluaXNoZWQ6IGZhbHNlLFxuICAgICAgZGF0ZTogX2dldE5ld0RhdGUoJ01N5pyIZGTml6VoaDptbScpICsgJyAnXG4gICAgfTtcbiAgfVxuXG4gIC8vIEZvcm1hdCBkYXRlXG4gIGZ1bmN0aW9uIF9nZXROZXdEYXRlKGZtdCkge1xuICAgIHZhciBuZXdEYXRlID0gbmV3IERhdGUoKTtcbiAgICB2YXIgbmV3Zm10ID0gZm10O1xuICAgIHZhciBvID0ge1xuICAgICAgJ3krJzogbmV3RGF0ZS5nZXRGdWxsWWVhcigpLFxuICAgICAgJ00rJzogbmV3RGF0ZS5nZXRNb250aCgpICsgMSxcbiAgICAgICdkKyc6IG5ld0RhdGUuZ2V0RGF0ZSgpLFxuICAgICAgJ2grJzogbmV3RGF0ZS5nZXRIb3VycygpLFxuICAgICAgJ20rJzogbmV3RGF0ZS5nZXRNaW51dGVzKClcbiAgICB9O1xuICAgIHZhciBsZW5zO1xuXG4gICAgZm9yICh2YXIgayBpbiBvKSB7XG4gICAgICBpZiAobmV3IFJlZ0V4cCgnKCcgKyBrICsgJyknKS50ZXN0KG5ld2ZtdCkpIHtcbiAgICAgICAgaWYgKGsgPT09ICd5KycpIHtcbiAgICAgICAgICBuZXdmbXQgPSBuZXdmbXQucmVwbGFjZShSZWdFeHAuJDEsICgnJyArIG9ba10pLnN1YnN0cig0IC0gUmVnRXhwLiQxLmxlbmd0aCkpO1xuICAgICAgICB9IGVsc2UgaWYgKGsgPT09ICdTKycpIHtcbiAgICAgICAgICBsZW5zID0gUmVnRXhwLiQxLmxlbmd0aDtcbiAgICAgICAgICBsZW5zID0gbGVucyA9PT0gMSA/IDMgOiBsZW5zO1xuICAgICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKCcwMCcgKyBvW2tdKS5zdWJzdHIoKCcnICsgb1trXSkubGVuZ3RoIC0gMSwgbGVucykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ld2ZtdCA9IG5ld2ZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKFJlZ0V4cC4kMS5sZW5ndGggPT09IDEpID8gKG9ba10pIDogKCgnMDAnICsgb1trXSkuc3Vic3RyKCgnJyArIG9ba10pLmxlbmd0aCkpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZXdmbXQ7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGlmRW1wdHk6IGlmRW1wdHksXG4gICAgZGF0YUdlbmVyYXRvcjogZGF0YUdlbmVyYXRvclxuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBnZW5lcmFsO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGxpR2VuZXJhdG9yID0gKGZ1bmN0aW9uIGxpR2VuZXJhdG9yKCkge1xuICBmdW5jdGlvbiBfZGVjb3JhdGVMaShsaSwgZGF0YSkge1xuICAgIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJyAnICsgZGF0YS5ldmVudCk7XG4gICAgdmFyIHRleHREYXRlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YS5kYXRlICsgJzogJyk7XG4gICAgdmFyIHRleHRXcmFwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuXG4gICAgLy8gd3JhcCBhcyBhIG5vZGVcbiAgICB0ZXh0V3JhcC5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICBsaS5hcHBlbmRDaGlsZCh0ZXh0RGF0ZSk7XG4gICAgbGkuYXBwZW5kQ2hpbGQodGV4dFdyYXApO1xuICAgIGlmIChkYXRhLmZpbmlzaGVkKSB7ICAvLyBhZGQgY3NzLXN0eWxlIHRvIGl0IChhY2NvcmRpbmcgdG8gaXQncyBkYXRhLmZpbmlzaGVkIHZhbHVlKVxuICAgICAgbGkuY2xhc3NMaXN0LmFkZCgnZmluaXNoZWQnKTsgLy8gYWRkIHN0eWxlXG4gICAgfVxuICAgIF9hZGRYKGxpKTsgLy8gYWRkIHNwYW4gW3hdIHRvIGxpJ3MgdGFpbFxuICAgIF9zZXREYXRhUHJvcGVydHkobGksICdkYXRhLWlkJywgZGF0YS5pZCk7IC8vIGFkZCBwcm9wZXJ0eSB0byBsaSAoZGF0YS1pZCnvvIxmb3IgIGNsaWNrTGlcbiAgfVxuXG4gIGZ1bmN0aW9uIF9hZGRYKGxpKSB7XG4gICAgdmFyIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgdmFyIHggPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnXFx1MDBENycpOyAvLyB1bmljb2RlIC0+IHhcblxuICAgIHNwYW4uYXBwZW5kQ2hpbGQoeCk7XG4gICAgc3Bhbi5jbGFzc05hbWUgPSAnY2xvc2UnOyAvLyBhZGQgc3R5bGVcbiAgICBsaS5hcHBlbmRDaGlsZChzcGFuKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zZXREYXRhUHJvcGVydHkodGFyZ2V0LCBuYW1lLCBkYXRhKSB7XG4gICAgdGFyZ2V0LnNldEF0dHJpYnV0ZShuYW1lLCBkYXRhKTtcbiAgfVxuXG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGNyZWF0ZShkYXRhKSB7XG4gICAgdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcblxuICAgIF9kZWNvcmF0ZUxpKGxpLCBkYXRhKTsgLy8gZGVjb3JhdGUgbGlcblxuICAgIHJldHVybiBsaTtcbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gbGlHZW5lcmF0b3I7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiBkYkZhaWxHZW5lcmF0b3IoKSB7XG4gIHZhciBnZW5lcmFsID0gcmVxdWlyZSgnLi9nZW5lcmFsLmpzJyk7XG5cbiAgZnVuY3Rpb24gcmFuZG9tQXBob3Jpc20oKSB7XG4gICAgdmFyIGFwaG9yaXNtcyA9IFtcbiAgICAgICdZZXN0ZXJkYXkgWW91IFNhaWQgVG9tb3Jyb3cnLFxuICAgICAgJ1doeSBhcmUgd2UgaGVyZT8nLFxuICAgICAgJ0FsbCBpbiwgb3Igbm90aGluZycsXG4gICAgICAnWW91IE5ldmVyIFRyeSwgWW91IE5ldmVyIEtub3cnLFxuICAgICAgJ1RoZSB1bmV4YW1pbmVkIGxpZmUgaXMgbm90IHdvcnRoIGxpdmluZy4gLS0gU29jcmF0ZXMnLFxuICAgICAgJ1RoZXJlIGlzIG9ubHkgb25lIHRoaW5nIHdlIHNheSB0byBsYXp5OiBOT1QgVE9EQVknXG4gICAgXTtcbiAgICB2YXIgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcGhvcmlzbXMubGVuZ3RoKTtcbiAgICB2YXIgdGV4dCA9IGFwaG9yaXNtc1tyYW5kb21JbmRleF07XG5cbiAgICBnZW5lcmFsLnNlbnRlbmNlSGFuZGxlcih0ZXh0KTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaW5pdDogZ2VuZXJhbC5pbml0LFxuICAgIGFsbDogZ2VuZXJhbC5hbGwuYmluZChudWxsLCByYW5kb21BcGhvcmlzbSksXG4gICAgcGFydDogZ2VuZXJhbC5wYXJ0LmJpbmQobnVsbCwgcmFuZG9tQXBob3Jpc20pLFxuICAgIGNsZWFyOiBnZW5lcmFsLmNsZWFyLFxuICAgIHJhbmRvbTogcmFuZG9tQXBob3Jpc21cbiAgfTtcbn0oKSk7XG5cbiIsIid1c2Ugc3RyaWN0JztcbnZhciBnZW5lcmFsID0gKGZ1bmN0aW9uIGdlbmVyYWxHZW5lcmF0b3IoKSB7XG4gIHZhciBsaUdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL2xpR2VuZXJhdG9yLmpzJyk7XG4gIHZhciBjbGVhckNoaWxkTm9kZXMgPSByZXF1aXJlKCcuLi9jbGVhckNoaWxkTm9kZXMuanMnKTtcblxuICBmdW5jdGlvbiBpbml0KGRhdGFBcnIpIHtcbiAgICBfc2hvdyhfaW5pdFNlbnRlbmNlLCBfc2hvd0FsbCwgZGF0YUFycik7XG4gIH1cblxuICBmdW5jdGlvbiBfc2hvdyhzaG93U2VudGVuY2VGdW5jLCBzaG93RnVuYywgZGF0YUFycikge1xuICAgIGlmICghZGF0YUFyciB8fCBkYXRhQXJyLmxlbmd0aCA9PT0gMCkge1xuICAgICAgc2hvd1NlbnRlbmNlRnVuYygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzaG93RnVuYyhkYXRhQXJyKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfaW5pdFNlbnRlbmNlKCkge1xuICAgIHZhciB0ZXh0ID0gJ1dlbGNvbWV+LCB0cnkgdG8gYWRkIHlvdXIgZmlyc3QgdG8tZG8gbGlzdCA6ICknO1xuXG4gICAgc2VudGVuY2VIYW5kbGVyKHRleHQpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3Nob3dBbGwoZGF0YUFycikge1xuICAgIHZhciByZXN1bHQgPSBfY2xhc3NpZnlEYXRhKGRhdGFBcnIpO1xuXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5hcHBlbmRDaGlsZChyZXN1bHQpOyAvLyBhZGQgaXQgdG8gRE9NXG4gIH1cblxuICBmdW5jdGlvbiBfY2xhc3NpZnlEYXRhKGRhdGFBcnIpIHtcbiAgICAvLyBQVU5DSExJTkU6IHVzZSBmcmFnbWVudCB0byByZWR1Y2UgRE9NIG9wZXJhdGVcbiAgICB2YXIgdW5maXNoaWVkID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIHZhciBmaW5pc2hlZCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB2YXIgbWl4ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgLy8gcHV0IHRoZSBmaW5pc2hlZCBpdGVtIHRvIHRoZSBib3R0b21cbiAgICBkYXRhQXJyLmZvckVhY2goZnVuY3Rpb24gY2xhc3NpZnkoZGF0YSkge1xuICAgICAgaWYgKGRhdGEuZmluaXNoZWQpIHtcbiAgICAgICAgZmluaXNoZWQuaW5zZXJ0QmVmb3JlKGxpR2VuZXJhdG9yKGRhdGEpLCBmaW5pc2hlZC5maXJzdENoaWxkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVuZmlzaGllZC5pbnNlcnRCZWZvcmUobGlHZW5lcmF0b3IoZGF0YSksIHVuZmlzaGllZC5maXJzdENoaWxkKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBtaXguYXBwZW5kQ2hpbGQodW5maXNoaWVkKTtcbiAgICBtaXguYXBwZW5kQ2hpbGQoZmluaXNoZWQpO1xuXG4gICAgcmV0dXJuIG1peDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFsbChyYW5kb21BcGhvcmlzbSwgZGF0YUFycikge1xuICAgIF9zaG93KHJhbmRvbUFwaG9yaXNtLCBfc2hvd0FsbCwgZGF0YUFycik7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJ0KHJhbmRvbUFwaG9yaXNtLCBkYXRhQXJyKSB7XG4gICAgX3Nob3cocmFuZG9tQXBob3Jpc20sIF9zaG93cGFydCwgZGF0YUFycik7XG4gIH1cblxuICBmdW5jdGlvbiBfc2hvd3BhcnQoZGF0YUFycikge1xuICAgIHZhciBub2RlcyA9IGRhdGFBcnIucmVkdWNlKGZ1bmN0aW9uIG5vZGVHZW5lcmF0b3IocmVzdWx0LCBkYXRhKSB7XG4gICAgICByZXN1bHQuaW5zZXJ0QmVmb3JlKGxpR2VuZXJhdG9yKGRhdGEpLCByZXN1bHQuZmlyc3RDaGlsZCk7XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSwgZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpKTsgLy8gUFVOQ0hMSU5FOiBicmlsbGlhbnQgYXJyLnJlZHVjZSgpICsgZG9jdW1lbnRGcmFnbWVudFxuXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5hcHBlbmRDaGlsZChub2Rlcyk7IC8vIGFkZCBpdCB0byBET01cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIGNsZWFyQ2hpbGROb2Rlcyhkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbnRlbmNlSGFuZGxlcih0ZXh0KSB7XG4gICAgdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICB2YXIgdGV4dE5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0ZXh0KTtcblxuICAgIGxpLmFwcGVuZENoaWxkKHRleHROb2RlKTtcbiAgICBsaS5jbGFzc05hbWUgPSAnYXBob3Jpc20nO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuYXBwZW5kQ2hpbGQobGkpO1xuICB9XG5cblxuICByZXR1cm4ge1xuICAgIGluaXQ6IGluaXQsXG4gICAgYWxsOiBhbGwsXG4gICAgcGFydDogcGFydCxcbiAgICBjbGVhcjogY2xlYXIsXG4gICAgc2VudGVuY2VIYW5kbGVyOiBzZW50ZW5jZUhhbmRsZXJcbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZ2VuZXJhbDtcbiIsIid1c2Ugc3RyaWN0JztcbihmdW5jdGlvbiB3aXRob3V0REIoKSB7XG4gIHZhciBhZGRFdmVudHMgPSByZXF1aXJlKCcuL3V0bGlzL2FkZEV2ZW50cy9kYkZhaWwuanMnKTtcblxuICBhZGRFdmVudHMoKTtcbn0oKSk7XG4iXX0=
