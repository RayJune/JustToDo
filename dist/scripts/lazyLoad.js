(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
function clearChildNodes(root) {
  while (root.hasChildNodes()) { // or root.firstChild or root.lastChild
    root.removeChild(root.firstChild);
  }
  // or root.innerHTML = ''
}

module.exports = clearChildNodes;

},{}],2:[function(require,module,exports){
'use strict';
var addEvents = (function dbFailGenerator() {
  var addEventsGenerator = require('../dbGeneral/addEventsGenerator');
  var eventsHandler = require('../dbFail/eventsHandler');

  return function handler() {
    window.alert('Your browser doesn\'t support a stable version of IndexedDB. We will offer you the without indexedDB mode');
    addEventsGenerator(eventsHandler);
  };
}());

module.exports = addEvents;

},{"../dbFail/eventsHandler":3,"../dbGeneral/addEventsGenerator":5}],3:[function(require,module,exports){
'use strict';
var eventsHandler = (function dbFailGenerator() {
  var refresh = require('../dbFail/refresh');
  var general = require('../dbGeneral/refreshGeneral');
  var itemGenerator = require('../templete/itemGenerator');
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
      _addRandom();
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

  function _addRandom() {
    var list = document.querySelector('#list');

    if (!list.hasChildNodes() || _allDisappear(list)) {
      refresh.random();
    }
  }

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
    _addRandom();
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
    _addRandom();
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

module.exports = eventsHandler;

},{"../dbFail/refresh":4,"../dbGeneral/refreshGeneral":6,"../templete/itemGenerator":7}],4:[function(require,module,exports){
'use strict';
var refresh = (function dbFailGenerator() {
  var general = require('../dbGeneral/refreshGeneral');

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
    clear: general.clear,
    random: randomAphorism
  };
}());

module.exports = refresh;

},{"../dbGeneral/refreshGeneral":6}],5:[function(require,module,exports){
'use strict';
function addEventsGenerator(handler) {
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

module.exports = addEventsGenerator;

},{}],6:[function(require,module,exports){
'use strict';
var refreshGeneral = (function generalGenerator() {
  var sentenceGenerator = require('../templete/sentenceGenerator');
  var itemGenerator = require('../templete/itemGenerator');
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
      data.finished ? finished.unshift(data) : unfishied.unshift(data);
    });

    return unfishied.concat(finished);
  }

  function part(randomAphorism, dataArr) {
    _show(dataArr, randomAphorism, _renderPart);
  }

  function _renderPart(dataArr) {
    return itemGenerator(dataArr.reverse());
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

module.exports = refreshGeneral;

},{"../clearChildNodes":1,"../templete/itemGenerator":7,"../templete/sentenceGenerator":8}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
'use strict';
function sentenceGenerator(text) {
  var template = Handlebars.templates.li;
  var rendered = template({"sentence": text});

  return rendered.trim();
}

module.exports = sentenceGenerator;

},{}],9:[function(require,module,exports){
'use strict';
(function withoutDB() {
  var addEvents = require('./utlis/dbFail/addEvents');

  addEvents();
}());

},{"./utlis/dbFail/addEvents":2}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9jbGVhckNoaWxkTm9kZXMuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkZhaWwvYWRkRXZlbnRzLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvZGJGYWlsL2V2ZW50c0hhbmRsZXIuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkZhaWwvcmVmcmVzaC5qcyIsInNyYy9zY3JpcHRzL3V0bGlzL2RiR2VuZXJhbC9hZGRFdmVudHNHZW5lcmF0b3IuanMiLCJzcmMvc2NyaXB0cy91dGxpcy9kYkdlbmVyYWwvcmVmcmVzaEdlbmVyYWwuanMiLCJzcmMvc2NyaXB0cy91dGxpcy90ZW1wbGV0ZS9pdGVtR2VuZXJhdG9yLmpzIiwic3JjL3NjcmlwdHMvdXRsaXMvdGVtcGxldGUvc2VudGVuY2VHZW5lcmF0b3IuanMiLCJzcmMvc2NyaXB0cy93aXRob3V0REIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcbmZ1bmN0aW9uIGNsZWFyQ2hpbGROb2Rlcyhyb290KSB7XG4gIHdoaWxlIChyb290Lmhhc0NoaWxkTm9kZXMoKSkgeyAvLyBvciByb290LmZpcnN0Q2hpbGQgb3Igcm9vdC5sYXN0Q2hpbGRcbiAgICByb290LnJlbW92ZUNoaWxkKHJvb3QuZmlyc3RDaGlsZCk7XG4gIH1cbiAgLy8gb3Igcm9vdC5pbm5lckhUTUwgPSAnJ1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsZWFyQ2hpbGROb2RlcztcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBhZGRFdmVudHMgPSAoZnVuY3Rpb24gZGJGYWlsR2VuZXJhdG9yKCkge1xuICB2YXIgYWRkRXZlbnRzR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vZGJHZW5lcmFsL2FkZEV2ZW50c0dlbmVyYXRvcicpO1xuICB2YXIgZXZlbnRzSGFuZGxlciA9IHJlcXVpcmUoJy4uL2RiRmFpbC9ldmVudHNIYW5kbGVyJyk7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGhhbmRsZXIoKSB7XG4gICAgd2luZG93LmFsZXJ0KCdZb3VyIGJyb3dzZXIgZG9lc25cXCd0IHN1cHBvcnQgYSBzdGFibGUgdmVyc2lvbiBvZiBJbmRleGVkREIuIFdlIHdpbGwgb2ZmZXIgeW91IHRoZSB3aXRob3V0IGluZGV4ZWREQiBtb2RlJyk7XG4gICAgYWRkRXZlbnRzR2VuZXJhdG9yKGV2ZW50c0hhbmRsZXIpO1xuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBhZGRFdmVudHM7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgZXZlbnRzSGFuZGxlciA9IChmdW5jdGlvbiBkYkZhaWxHZW5lcmF0b3IoKSB7XG4gIHZhciByZWZyZXNoID0gcmVxdWlyZSgnLi4vZGJGYWlsL3JlZnJlc2gnKTtcbiAgdmFyIGdlbmVyYWwgPSByZXF1aXJlKCcuLi9kYkdlbmVyYWwvcmVmcmVzaEdlbmVyYWwnKTtcbiAgdmFyIGl0ZW1HZW5lcmF0b3IgPSByZXF1aXJlKCcuLi90ZW1wbGV0ZS9pdGVtR2VuZXJhdG9yJyk7XG4gIHZhciBfaWQgPSAwOyAvLyBzbyB0aGUgZmlyc3QgaXRlbSdzIGlkIGlzIDFcbiAgdmFyIF9mb3JFYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2g7IC8vIHNpbXBsaWZ5XG5cbiAgZnVuY3Rpb24gYWRkKCkge1xuICAgIHZhciBpbnB1dFZhbHVlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0JykudmFsdWU7XG5cbiAgICBpZiAoaW5wdXRWYWx1ZSA9PT0gJycpIHtcbiAgICAgIHdpbmRvdy5hbGVydCgncGxlYXNlIGlucHV0IGEgcmVhbCBkYXRhficpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhZGRIYW5kbGVyKGlucHV0VmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZEhhbmRsZXIoaW5wdXRWYWx1ZSkge1xuICAgIHZhciBuZXdEYXRhO1xuICAgIHZhciBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcblxuICAgIF9yZW1vdmVSYW5kb20obGlzdCk7XG4gICAgX2lkICs9IDE7XG4gICAgbmV3RGF0YSA9IGdlbmVyYWwuZGF0YUdlbmVyYXRvcihfaWQsIGlucHV0VmFsdWUpO1xuICAgIGxpc3QuaW5zZXJ0QmVmb3JlKGl0ZW1HZW5lcmF0b3IobmV3RGF0YSksIGxpc3QuZmlyc3RDaGlsZCk7IC8vIHB1c2ggbmV3TGkgdG8gZmlyc3RcbiAgICBnZW5lcmFsLnJlc2V0SW5wdXQoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9yZW1vdmVSYW5kb20obGlzdCkge1xuICAgIHZhciBsaXN0SXRlbXMgPSBsaXN0LmNoaWxkTm9kZXM7XG5cbiAgICBfZm9yRWFjaC5jYWxsKGxpc3RJdGVtcywgZnVuY3Rpb24gd2hldGhlckhhc1JhbmRvbShpdGVtKSB7XG4gICAgICBpZiAoaXRlbS5jbGFzc0xpc3QuY29udGFpbnMoJ2FwaG9yaXNtJykpIHtcbiAgICAgICAgbGlzdC5yZW1vdmVDaGlsZChpdGVtKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyBvciB1c2UgZm9yLi4uaW5cbiAgICAvLyBmb3IgKHZhciBpbmRleCBpbiBsaXN0SXRlbXMpIHtcbiAgICAvLyAgIGlmIChsaXN0SXRlbXMuaGFzT3duUHJvcGVydHkoaW5kZXgpKSB7XG4gICAgLy8gICAgIGlmIChsaXN0SXRlbXNbaW5kZXhdLmNsYXNzTGlzdC5jb250YWlucygnYXBob3Jpc20nKSkge1xuICAgIC8vICAgICAgIGxpc3QucmVtb3ZlQ2hpbGQobGlzdEl0ZW1zW2luZGV4XSk7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgIH1cbiAgICAvLyB9XG4gIH1cblxuICBmdW5jdGlvbiBlbnRlckFkZChlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgIGFkZCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsaWNrTGkoZSkge1xuICAgIHZhciB0YXJnZXRMaSA9IGUudGFyZ2V0O1xuICAgIC8vIHVzZSBldmVudCBkZWxlZ2F0aW9uXG5cbiAgICBpZiAodGFyZ2V0TGkuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJykpIHtcbiAgICAgIHRhcmdldExpLmNsYXNzTGlzdC50b2dnbGUoJ2ZpbmlzaGVkJyk7XG4gICAgICBzaG93QWxsKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gbGkncyBbeF0ncyBkZWxldGVcbiAgZnVuY3Rpb24gcmVtb3ZlTGkoZSkge1xuICAgIGlmIChlLnRhcmdldC5jbGFzc05hbWUgPT09ICdjbG9zZScpIHsgLy8gdXNlIGV2ZW50IGRlbGVnYXRpb25cbiAgICAgIF9yZW1vdmVMaUhhbmRsZXIoZS50YXJnZXQpO1xuICAgICAgX2FkZFJhbmRvbSgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9yZW1vdmVMaUhhbmRsZXIoZWxlbWVudCkge1xuICAgIC8vIHVzZSBwcmV2aW91c2x5IHN0b3JlZCBkYXRhXG4gICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgIHZhciBsaXN0SXRlbXMgPSBsaXN0LmNoaWxkTm9kZXM7XG4gICAgdmFyIGlkID0gZWxlbWVudC5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpO1xuXG4gICAgdHJ5IHtcbiAgICAgIF9mb3JFYWNoLmNhbGwobGlzdEl0ZW1zLCBmdW5jdGlvbiB3aGV0aGVySGFzUmFuZG9tKGl0ZW0pIHtcbiAgICAgICAgaWYgKGl0ZW0uZ2V0QXR0cmlidXRlKCdkYXRhLWlkJykgPT09IGlkKSB7XG4gICAgICAgICAgbGlzdC5yZW1vdmVDaGlsZChpdGVtKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdXcm9uZyBpZCwgbm90IGZvdW5kIGluIERPTSB0cmVlJyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9hZGRSYW5kb20oKSB7XG4gICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuXG4gICAgaWYgKCFsaXN0Lmhhc0NoaWxkTm9kZXMoKSB8fCBfYWxsRGlzYXBwZWFyKGxpc3QpKSB7XG4gICAgICByZWZyZXNoLnJhbmRvbSgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9hbGxEaXNhcHBlYXIobGlzdCkge1xuICAgIHZhciBsaXN0SXRlbXMgPSBsaXN0LmNoaWxkTm9kZXM7XG5cbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmV2ZXJ5LmNhbGwobGlzdEl0ZW1zLCBmdW5jdGlvbiB3aGV0aGVySGFzUmFuZG9tKGl0ZW0pIHtcbiAgICAgIHJldHVybiBpdGVtLnN0eWxlLmRpc3BsYXkgPT09ICdub25lJztcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dJbml0KCkge1xuICAgIHJlZnJlc2guaW5pdCgpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0FsbCgpIHtcbiAgICB2YXIgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gICAgdmFyIGxpc3RJdGVtcyA9IGxpc3QuY2hpbGROb2RlcztcblxuICAgIF9mb3JFYWNoLmNhbGwobGlzdEl0ZW1zLCBmdW5jdGlvbiBhcHBlYXJBbGwoaXRlbSkge1xuICAgICAgX3doZXRoZXJBcHBlYXIoaXRlbSwgdHJ1ZSk7XG4gICAgICBpZiAoaXRlbS5jbGFzc0xpc3QuY29udGFpbnMoJ2ZpbmlzaGVkJykpIHtcbiAgICAgICAgbGlzdC5yZW1vdmVDaGlsZChpdGVtKTtcbiAgICAgICAgbGlzdC5hcHBlbmRDaGlsZChpdGVtKTsgLy8gUFVOQ0hMSU5FOiBkcm9wIGRvbmUgaXRlbVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0RvbmUoKSB7XG4gICAgX3Nob3dXaGV0aGVyRG9uZSh0cnVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dUb2RvKCkge1xuICAgIF9zaG93V2hldGhlckRvbmUoZmFsc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gX3Nob3dXaGV0aGVyRG9uZSh3aGV0aGVyRG9uZSkge1xuICAgIHZhciBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKTtcbiAgICB2YXIgbGlzdEl0ZW1zID0gbGlzdC5jaGlsZE5vZGVzO1xuXG4gICAgX3JlbW92ZVJhbmRvbShsaXN0KTtcbiAgICBfZm9yRWFjaC5jYWxsKGxpc3RJdGVtcywgZnVuY3Rpb24gd2hldGhlckRvbmVBcHBlYXIoaXRlbSkge1xuICAgICAgaXRlbS5jbGFzc0xpc3QuY29udGFpbnMoJ2ZpbmlzaGVkJykgPyBfd2hldGhlckFwcGVhcihpdGVtLCB3aGV0aGVyRG9uZSkgOiBfd2hldGhlckFwcGVhcihpdGVtLCAhd2hldGhlckRvbmUpO1xuICAgIH0pO1xuICAgIF9hZGRSYW5kb20oKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF93aGV0aGVyQXBwZWFyKGVsZW1lbnQsIHdoZXRoZXIpIHtcbiAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSB3aGV0aGVyID8gJ2Jsb2NrJyA6ICdub25lJztcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dDbGVhckRvbmUoKSB7XG4gICAgdmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpO1xuICAgIHZhciBsaXN0SXRlbXMgPSBsaXN0LmNoaWxkTm9kZXM7XG5cbiAgICBfcmVtb3ZlUmFuZG9tKGxpc3QpO1xuICAgIF9mb3JFYWNoLmNhbGwobGlzdEl0ZW1zLCBmdW5jdGlvbiBjbGVhckRvbmVJdGVtcyhpdGVtKSB7XG4gICAgICBpZiAoaXRlbS5jbGFzc0xpc3QuY29udGFpbnMoJ2ZpbmlzaGVkJykpIHtcbiAgICAgICAgbGlzdC5yZW1vdmVDaGlsZChpdGVtKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBfYWRkUmFuZG9tKCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93Q2xlYXIoKSB7XG4gICAgcmVmcmVzaC5jbGVhcigpOyAvLyBjbGVhciBub2RlcyB2aXN1YWxseVxuICAgIHJlZnJlc2gucmFuZG9tKCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGFkZDogYWRkLFxuICAgIGVudGVyQWRkOiBlbnRlckFkZCxcbiAgICBjbGlja0xpOiBjbGlja0xpLFxuICAgIHJlbW92ZUxpOiByZW1vdmVMaSxcbiAgICBzaG93SW5pdDogc2hvd0luaXQsXG4gICAgc2hvd0FsbDogc2hvd0FsbCxcbiAgICBzaG93RG9uZTogc2hvd0RvbmUsXG4gICAgc2hvd1RvZG86IHNob3dUb2RvLFxuICAgIHNob3dDbGVhckRvbmU6IHNob3dDbGVhckRvbmUsXG4gICAgc2hvd0NsZWFyOiBzaG93Q2xlYXJcbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZXZlbnRzSGFuZGxlcjtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciByZWZyZXNoID0gKGZ1bmN0aW9uIGRiRmFpbEdlbmVyYXRvcigpIHtcbiAgdmFyIGdlbmVyYWwgPSByZXF1aXJlKCcuLi9kYkdlbmVyYWwvcmVmcmVzaEdlbmVyYWwnKTtcblxuICBmdW5jdGlvbiByYW5kb21BcGhvcmlzbSgpIHtcbiAgICB2YXIgYXBob3Jpc21zID0gW1xuICAgICAgJ1llc3RlcmRheSBZb3UgU2FpZCBUb21vcnJvdycsXG4gICAgICAnV2h5IGFyZSB3ZSBoZXJlPycsXG4gICAgICAnQWxsIGluLCBvciBub3RoaW5nJyxcbiAgICAgICdZb3UgTmV2ZXIgVHJ5LCBZb3UgTmV2ZXIgS25vdycsXG4gICAgICAnVGhlIHVuZXhhbWluZWQgbGlmZSBpcyBub3Qgd29ydGggbGl2aW5nLiAtLSBTb2NyYXRlcycsXG4gICAgICAnVGhlcmUgaXMgb25seSBvbmUgdGhpbmcgd2Ugc2F5IHRvIGxhenk6IE5PVCBUT0RBWSdcbiAgICBdO1xuICAgIHZhciByYW5kb21JbmRleCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFwaG9yaXNtcy5sZW5ndGgpO1xuICAgIHZhciB0ZXh0ID0gYXBob3Jpc21zW3JhbmRvbUluZGV4XTtcblxuICAgIGdlbmVyYWwuc2VudGVuY2VIYW5kbGVyKHRleHQpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpbml0OiBnZW5lcmFsLmluaXQsXG4gICAgY2xlYXI6IGdlbmVyYWwuY2xlYXIsXG4gICAgcmFuZG9tOiByYW5kb21BcGhvcmlzbVxuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWZyZXNoO1xuIiwiJ3VzZSBzdHJpY3QnO1xuZnVuY3Rpb24gYWRkRXZlbnRzR2VuZXJhdG9yKGhhbmRsZXIpIHtcbiAgdmFyIGxpc3Q7XG5cbiAgaGFuZGxlci5zaG93SW5pdCgpO1xuICAvLyBhZGQgYWxsIGV2ZW50TGlzdGVuZXJcbiAgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0Jyk7XG4gIGxpc3QuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLmNsaWNrTGksIGZhbHNlKTtcbiAgbGlzdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXIucmVtb3ZlTGksIGZhbHNlKTtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZXIuZW50ZXJBZGQsIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FkZCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5hZGQsIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dEb25lJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dEb25lLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93VG9kbycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93VG9kbywgZmFsc2UpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2hvd0FsbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93QWxsLCBmYWxzZSk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzaG93Q2xlYXJEb25lJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVyLnNob3dDbGVhckRvbmUsIGZhbHNlKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nob3dDbGVhcicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlci5zaG93Q2xlYXIsIGZhbHNlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhZGRFdmVudHNHZW5lcmF0b3I7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgcmVmcmVzaEdlbmVyYWwgPSAoZnVuY3Rpb24gZ2VuZXJhbEdlbmVyYXRvcigpIHtcbiAgdmFyIHNlbnRlbmNlR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vdGVtcGxldGUvc2VudGVuY2VHZW5lcmF0b3InKTtcbiAgdmFyIGl0ZW1HZW5lcmF0b3IgPSByZXF1aXJlKCcuLi90ZW1wbGV0ZS9pdGVtR2VuZXJhdG9yJyk7XG4gIHZhciBjbGVhckNoaWxkTm9kZXMgPSByZXF1aXJlKCcuLi9jbGVhckNoaWxkTm9kZXMnKTtcblxuICBmdW5jdGlvbiBpbml0KGRhdGFBcnIpIHtcbiAgICBfc2hvdyhkYXRhQXJyLCBfaW5pdFNlbnRlbmNlLCBfcmVuZGVyQWxsKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zaG93KGRhdGFBcnIsIHNob3dTZW50ZW5jZUZ1bmMsIGdlbmVyYXRlRnVuYykge1xuICAgIGlmICghZGF0YUFyciB8fCBkYXRhQXJyLmxlbmd0aCA9PT0gMCkge1xuICAgICAgc2hvd1NlbnRlbmNlRnVuYygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGlzdCcpLmlubmVySFRNTCA9IGdlbmVyYXRlRnVuYyhkYXRhQXJyKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfaW5pdFNlbnRlbmNlKCkge1xuICAgIHZhciB0ZXh0ID0gJ1dlbGNvbWV+LCB0cnkgdG8gYWRkIHlvdXIgZmlyc3QgdG8tZG8gbGlzdCA6ICknO1xuXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QnKS5pbm5lckhUTUwgPSBzZW50ZW5jZUdlbmVyYXRvcih0ZXh0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFsbChyYW5kb21BcGhvcmlzbSwgZGF0YUFycikge1xuICAgIF9zaG93KGRhdGFBcnIsIHJhbmRvbUFwaG9yaXNtLCBfcmVuZGVyQWxsKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9yZW5kZXJBbGwoZGF0YUFycikge1xuICAgIHZhciBjbGFzc2lmaWVkRGF0YSA9IF9jbGFzc2lmeURhdGEoZGF0YUFycik7XG5cbiAgICByZXR1cm4gaXRlbUdlbmVyYXRvcihjbGFzc2lmaWVkRGF0YSk7XG4gIH1cblxuICBmdW5jdGlvbiBfY2xhc3NpZnlEYXRhKGRhdGFBcnIpIHtcbiAgICB2YXIgZmluaXNoZWQgPSBbXTtcbiAgICB2YXIgdW5maXNoaWVkID0gW107XG5cbiAgICAvLyBwdXQgdGhlIGZpbmlzaGVkIGl0ZW0gdG8gdGhlIGJvdHRvbVxuICAgIGRhdGFBcnIuZm9yRWFjaChmdW5jdGlvbiBjbGFzc2lmeShkYXRhKSB7XG4gICAgICBkYXRhLmZpbmlzaGVkID8gZmluaXNoZWQudW5zaGlmdChkYXRhKSA6IHVuZmlzaGllZC51bnNoaWZ0KGRhdGEpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHVuZmlzaGllZC5jb25jYXQoZmluaXNoZWQpO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFydChyYW5kb21BcGhvcmlzbSwgZGF0YUFycikge1xuICAgIF9zaG93KGRhdGFBcnIsIHJhbmRvbUFwaG9yaXNtLCBfcmVuZGVyUGFydCk7XG4gIH1cblxuICBmdW5jdGlvbiBfcmVuZGVyUGFydChkYXRhQXJyKSB7XG4gICAgcmV0dXJuIGl0ZW1HZW5lcmF0b3IoZGF0YUFyci5yZXZlcnNlKCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgY2xlYXJDaGlsZE5vZGVzKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2VudGVuY2VIYW5kbGVyKHRleHQpIHtcbiAgICB2YXIgcmVuZGVyZWQgPSBzZW50ZW5jZUdlbmVyYXRvcih0ZXh0KTtcblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0JykuaW5uZXJIVE1MID0gcmVuZGVyZWQ7XG4gIH1cblxuXG4gIHJldHVybiB7XG4gICAgaW5pdDogaW5pdCxcbiAgICBhbGw6IGFsbCxcbiAgICBwYXJ0OiBwYXJ0LFxuICAgIGNsZWFyOiBjbGVhcixcbiAgICBzZW50ZW5jZUhhbmRsZXI6IHNlbnRlbmNlSGFuZGxlclxuICB9O1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWZyZXNoR2VuZXJhbDtcbiIsIid1c2Ugc3RyaWN0JztcbmZ1bmN0aW9uIGl0ZW1HZW5lcmF0b3IoZGF0YUFycikge1xuICB2YXIgcmVzdWx0ID0gZGF0YUFycjtcbiAgdmFyIHJlbmRlcmVkO1xuICB2YXIgdGVtcGxhdGUgPSBIYW5kbGViYXJzLnRlbXBsYXRlcy5saTtcblxuICBpZiAoIUFycmF5LmlzQXJyYXkoZGF0YUFycikpIHtcbiAgICByZXN1bHQgPSBbZGF0YUFycl07XG4gIH1cbiAgcmVuZGVyZWQgPSB0ZW1wbGF0ZSh7bGlzdEl0ZW1zOiByZXN1bHR9KTtcblxuICByZXR1cm4gcmVuZGVyZWQudHJpbSgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGl0ZW1HZW5lcmF0b3I7XG4iLCIndXNlIHN0cmljdCc7XG5mdW5jdGlvbiBzZW50ZW5jZUdlbmVyYXRvcih0ZXh0KSB7XG4gIHZhciB0ZW1wbGF0ZSA9IEhhbmRsZWJhcnMudGVtcGxhdGVzLmxpO1xuICB2YXIgcmVuZGVyZWQgPSB0ZW1wbGF0ZSh7XCJzZW50ZW5jZVwiOiB0ZXh0fSk7XG5cbiAgcmV0dXJuIHJlbmRlcmVkLnRyaW0oKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZW50ZW5jZUdlbmVyYXRvcjtcbiIsIid1c2Ugc3RyaWN0JztcbihmdW5jdGlvbiB3aXRob3V0REIoKSB7XG4gIHZhciBhZGRFdmVudHMgPSByZXF1aXJlKCcuL3V0bGlzL2RiRmFpbC9hZGRFdmVudHMnKTtcblxuICBhZGRFdmVudHMoKTtcbn0oKSk7XG4iXX0=
