'use strict';
var eventHandler = (function handlerGenerator() {
  function _whetherSuccess(whetherSuccess) {
    console.log(whetherSuccess);

    function _whetherSuccessHandler(whether) {
      var DB;
      var refresh = require('./refresh.js');
      var createLi = require('./createLi');

      if (whether) {
        DB = require('indexeddb-crud');
        console.log('get db');
      }

      function add() {
        var inputValue = document.querySelector('#input').value;
        var list;
        var newData;
        var newLi;

        if (inputValue === '') {
          alert('please input a real data~');
          return 0;
        }
        _ifEmpty();
        newData = _integrateNewData(inputValue);
        newLi = createLi(newData);
        list = document.querySelector('#list');
        list.insertBefore(newLi, list.firstChild); // push newLi to first
        document.querySelector('#input').value = '';  // reset input's values

        if (whether) {
          DB.addItem(newData);
        }

        return 0;
      }

      function enterAdd(e) {
        if (e.keyCode === 13) {
          add();
        }
      }

      // li's [x]'s delete
      function removeLi(e) {
        var id;

        if (e.target.className === 'close') { // use event delegation
          // use previously stored data
          refresh.disappear(e.target.parentNode);

          if (whether) {
            id = parseInt(e.target.getAttribute('data-x'), 10);
            DB.removeItem(id, showAll);
          }
        }
      }

      function showInit() {
        refresh.clear();

        whether ? DB.getAll(refresh.init) : refresh.init();
      }

      function showAll() {
        if (whether) {
          refresh.clear();
          DB.getAll(refresh.all);
        } else {
          Array.prototype.forEach.call(document.querySelectorAll('#list li'), function appearAll(element) {
            refresh.appear(element);
          });
        }
      }

      function showClear() {
        refresh.clear(); // clear nodes visually
        refresh.random();

        if (whether) {
          DB.clear(); // clear data indeed
        }
      }

      function showDone() {
        _showWhetherDone(true);
      }

      function showTodo() {
        _showWhetherDone(false);
      }

      function clickLi(e) {
        var id;
        var targetLi = e.target;
        // use event delegation

        if (targetLi.getAttribute('data-id')) {
          if (whether) {
            id = parseInt(targetLi.getAttribute('data-id'), 10); // use previously stored data-id attribute
            DB.getItem(id, _switchLi, [targetLi]); // pass _switchLi and param [e.target] as callback
          } else {
            _switchLi(void 0, targetLi);
          }
        }
      }


      /* private methods */
      function _ifEmpty() {
        var list = document.querySelector('#list');

        if (list.firstChild.className === 'aphorism') {
          list.removeChild(list.firstChild);
        }
      }

      function _integrateNewData(value) {
        return {
          id: whether ? DB.getNewKey() : 233,
          event: value,
          finished: false,
          userDate: _getNewDate('yyyy年MM月dd日 hh:mm')
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

      function _showWhetherDone(whetherDone) {
        var condition = 'finished';
        var listItems;

        if (whether) {
          refresh.clear();
          DB.getConditionItem(condition, whetherDone, refresh.part);
        } else {
          listItems = document.querySelectorAll('#list li');
          Array.prototype.forEach.call(listItems, function whetherDoneAppear(element) {
            if (whetherDone) {
              element.classList.contains(condition) ? refresh.appear(element) : refresh.disappear(element);
            } else {
              element.classList.contains(condition) ? refresh.disappear(element) : refresh.appear(element);
            }
          });
          listItems = document.querySelectorAll('#list li');
        }
      }

      function _switchLi(data, targetLi) {
        targetLi.classList.toggle('finished');

        if (whether) {
          data.finished = !data.finished;  // toggle data.finished
          DB.updateItem(data, showAll);
        }
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
    }

    return _whetherSuccessHandler(whetherSuccess);
  }

  return {
    success: _whetherSuccess(true),
    fail: _whetherSuccess(false)
  };
}());

module.exports = eventHandler;
