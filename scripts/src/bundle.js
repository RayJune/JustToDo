(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
// use module pattern
var handleIndexedDB = (function handleIndexedDB() {
  /* initial indexedDB functions */

  // two private property

  var dbResult;
  var userID;

  function init(dbConfig, callback) {
    // firstly inspect browser's support for indexedDB
    if (!window.indexedDB) {
      window.alert('Your browser doesn\'t support a stable version of IndexedDB. Such and such feature will not be available.');
      return 0;
    }
    if (callback) {
      openDB(dbConfig, callback);  // while it's ok, oepn it
    }

    return 0;
  }

  function openDB(dbConfig, callback) {
    var request = indexedDB.open(dbConfig.name, dbConfig.version); // open indexedDB

    request.onerror = function error() {
      console.log('fail to load indexedDB');
    };
    request.onsuccess = function success(e) {
      dbResult = e.target.result;
      getId(callback);
    };

    // When you create a new database or increase the version number of an existing database 
    // (by specifying a higher version number than you did previously, when Opening a database
    request.onupgradeneeded = function schemaChanged(e) {
      dbResult = e.target.result;
      if (!dbResult.objectStoreNames.contains('user')) {
        // set id as keyPath
        var store = dbResult.createObjectStore('user', { keyPath: 'id', autoIncrement: true }); // 创建db
      }
      // add a new db demo
      store.add(dbConfig.dataDemo);
    };
  }

  /* two private method */

  function handleTransaction(whetherWrite) {
    var transaction;
    if (whetherWrite) {
      transaction = dbResult.transaction(['user'], 'readwrite');
    } else {
      transaction = dbResult.transaction(['user']);
    }
    return transaction.objectStore('user');
  }

  function rangeToAll() {
    return IDBKeyRange.lowerBound(0, true);
  }

  // set now id value to userID (the private property) 

  function getId(callback) {
    var storeHander = handleTransaction(true);
    var range = rangeToAll();

    storeHander.openCursor(range, 'next').onsuccess = function (e) {
      var cursor = e.target.result;

      if (cursor) {
        cursor.continue();
        userID = cursor.value.id;
      } else {
        console.log('now id is:' +  userID);
        callback();
      }
    };
  }


  /* CRUD */

  // Create 
  function createOneData(newData, callback, callbackParaArr) {
    var storeHander = handleTransaction(true);
    var addOpt = storeHander.add(newData);
    addOpt.onerror = function error() {
      console.log('Pity, failed to add one data to indexedDB');
    };
    addOpt.onsuccess = function success() {
      console.log('Bravo, success to add one data to indexedDB');
      if (callback) { // if has callback been input, execute it 
        if (!callbackParaArr) {
          callback();
        } else {
          callback.apply(null, callbackParaArr); // it has callback's parameters been input, get it
        }
      }
    };
  }

  // Retrieve

  // retrieve one data
  function retrieveOneData(index, callback, callbackParaArr) {
    var storeHander = handleTransaction(false);
    var getDataIndex = storeHander.get(index);  // get it by index

    getDataIndex.onerror = function getDataIndexError() {
      console.log('Pity, get data faild');
    };
    getDataIndex.onsuccess = function getDataIndexSuccess() {
      console.log('Great, get data succeed');
      if (!callbackParaArr) {
        callback(getDataIndex.result);
      } else {
        callbackParaArr.unshift(getDataIndex.result);
        callback.apply(null, callbackParaArr);
      }
    };
  }

  // retrieve eligible data (boolean condition)
  function retrieveDataWhetherDone(whether, key, callback, callbackParaArr) {
    var dataArr = []; // use an array to storage eligible data
    var storeHander = handleTransaction(true);
    var range = rangeToAll();

    storeHander.openCursor(range, 'next').onsuccess = function showWhetherDoneData(e) {
      var cursor = e.target.result;

      if (cursor) {
        if (whether) {
          if (cursor.value[key]) {
            dataArr.push(cursor.value);
          }
        } else if (!whether) {
          if (!cursor.value[key]) {
            dataArr.push(cursor.value);
          }
        }
        cursor.continue();
      } else if (callback) {
        if (!callbackParaArr) {
          callback(dataArr);  // put the eligible array to callback as parameter
        } else {
          callbackParaArr.unshift(dataArr);
          callback.apply(null, callbackParaArr);
        }
      }
    };
  }

  // retrieve all
  function retrieveAllData(callback, callbackParaArr) {
    var storeHander = handleTransaction(true);
    var range = rangeToAll();
    var allDataArr = [];

    storeHander.openCursor(range, 'next').onsuccess = function getAllData(e) {
      var cursor = e.target.result;

      if (cursor) {
        allDataArr.push(cursor.value);
        cursor.continue();
      } else if (callback) {
        if (!callbackParaArr) {
          callback(allDataArr);
        } else {
          callbackParaArr.unshift(allDataArr);
          callback.apply(null, callbackParaArr);
        }
      }
    };
  }

  // Update one
  function updateOneDate(changedData, callback, callbackParaArr) {
    var storeHander = handleTransaction(true);

    console.log(changedData);
    var putStore = storeHander.put(changedData);
    putStore.onerror = function putStoreError() {
      console.log('Pity, modify failed');
    };
    putStore.onsuccess = function putStoreSuccess() {
      console.log('Aha, modify succeed');
      if (callback) {
        if (!callbackParaArr) {
          callback();
        } else {
          callback.apply(null, callbackParaArr);
        }
      }
    };
  }

  // Delete 

  // delete one
  function deleteOneData(index, callback, callbackParaArr) {
    var storeHander = handleTransaction(true);
    var deleteOpt = storeHander.delete(index); // 将当前选中li的数据从数据库中删除

    deleteOpt.onerror = function error() {
      console.log('delete:' + index + '~faild');
    };
    deleteOpt.onsuccess = function success() {
      console.log('delete:' + index +  '~succeed');
      if (callback) {
        if (!callbackParaArr) {
          callback();
        } else {
          callback.apply(callbackParaArr);
        }
      }
    };
  }

  // delete all
  function deleteAllData(callback, callbackParaArr) {
    var storeHander = handleTransaction(true);
    var range = rangeToAll();

    storeHander.openCursor(range, 'next').onsuccess = function deleteData(e) {
      var cursor = e.target.result;
      var requestDel;

      if (cursor) {
        requestDel = cursor.delete();
        requestDel.onsuccess = function success() {
          console.log('Great, delete all data succeed');
        };
        requestDel.onerror = function error() {
          console.log('Pity, delete all data faild');
        };
        cursor.continue();
      } else if (callback) {
        if (!callbackParaArr) {
          callback();
        } else {
          callback.apply(null, this);
        }
      }
    };
  }

  // get present id
  // use closure to keep userID
  function getPresentId() {
    userID++;
    return userID;
  }

  /* public interface */
  return {
    init: init,
    createOneData: createOneData,
    retrieveOneData: retrieveOneData,
    retrieveDataWhetherDone: retrieveDataWhetherDone,
    retrieveAllData: retrieveAllData,
    updateOneDate: updateOneDate,
    deleteOneData: deleteOneData,
    deleteAllData: deleteAllData,
    getPresentId: getPresentId
  };
}());

module.exports = handleIndexedDB;

},{}],2:[function(require,module,exports){
'use strict';
(function goToDo() {
  var DB = require('indexeddb-crud'); // 导入模块并重命名
  var dbConfig = {  // 创建数据库配置参数
    name: 'justToDo',
    version: '1'
  };
  dbConfig.dataDemo = { // 配置想要的数据结构存入数据库
    id: 0,
    userEvent: 0,
    finished: true,
    date: 0
  };

  DB.init(dbConfig, addEventListeners); // 启动indexedDB，并调用展示数据函数、添加所有事件处理的函数


  /* 经常调用的函数  */

  // 数据库启动完成后显示数据，以及添加事件处理函数
  function addEventListeners() {
    showData(); // 将数据展示
    // 添加事件处理函数
    var myUl = document.querySelector('#myUl');
    myUl.addEventListener('click', handleLiClickDelegation, false);
    myUl.addEventListener('click', handleXClickDelagation, false);
    document.getElementById('add').addEventListener('click', addOneList, false);
    document.addEventListener('keydown', handleEnterEvent, true);
    document.getElementById('done').addEventListener('click', showDataDone, false);
    document.getElementById('todo').addEventListener('click', showDataTodo, false);
    document.getElementById('all').addEventListener('click', showData, false);
    document.getElementById('delete').addEventListener('click', deleteAllData, false);
  }

  // 重置所有节点为0
  function resetNodes() { // 重置ul为0
    var root = document.querySelector('#myUl');

    while (root.hasChildNodes()) {
      root.removeChild(root.firstChild); // 这是最快的清除所有子节点的方法
    }
  }

  // showData同时也是all的事件处理函数
  function showData() { // 取出并展示所有list数据
    resetNodes(); // 先重置ul
    DB.retrieveAllData(refreshNodes); // 向retrieveAllData传入回调函数
    // 这样数据库一旦数据查询完毕/数据装在到数组中，就调用refreshNodes来展示数据
  }

  function refreshNodes(dataArr) { // 刷新一组节点，并展示出来
    var fragment = document.createDocumentFragment();  // 利用fragment来包裹li们，这样可以将多次DOM操作减少为一次DOM操作
    var i;
    var len = dataArr.length;

    for (i = 0; i < len; i++) {
      fragment.insertBefore(refreshOneNode(dataArr[i]), fragment.firstChild); // 每一个新加入的元素都排在最前面
    }
    // 将fragment添加到DOM中，因为运用了fragment，所以只用操纵这一次DOM就好
    document.querySelector('#myUl').appendChild(fragment);
    console.log('刷新，并展示DOM完毕');
  }

  function refreshOneNode(data) { // 刷新一个list节点，并返回一个fragment
    var textDate = document.createTextNode(data.userDate + ': ');
    var textWrap = document.createElement('span');
    var text = document.createTextNode(' ' + data.userEvent);
    var li = document.createElement('li');
    var span;
    var x;

    // 包装节点
    textWrap.appendChild(text);
    li.appendChild(textDate);
    li.appendChild(textWrap);

    // 根据完成的情况来确定是否添加完成样式
    if (data.finished) {
      li.classList.add('checked');
    }

    // 给每个li后面加上关闭按钮，并添加【x】删除事件
    span = document.createElement('span');
    x = document.createTextNode('\u00D7'); // unicode下的【x】
    span.className = 'close';
    span.appendChild(x);

    // 为每个[x]添加data-x属性值，方便对span[x]添加事件处理函数（准确的说是事件代理）
    span.setAttribute('data-x', data.id);
    li.appendChild(span);

    // 为每个节点添加data-index属性值，方便对li添加事件处理函数（准确的说是事件代理）
    if (!li.getAttribute('data-index')) {
      li.setAttribute('data-index', data.id);
    }
    return li;  // 返回创建的节点，进行进一步操作
  }


  /* add的事件处理函数  */

  // 添加一条新list数据
  function addOneList() {
    // 首先获取输入框中的数据
    var input = document.querySelector('#myInput');
    var value = input.value;
    var date = getNewDate('yyyy年MM月dd日 hh:mm');
    var newNodeData;
    var newNode;
    var parent = document.querySelector('#myUl');
    var dataId = DB.getPresentId();

    if (value === '') {
      alert('请亲传入数据后重新提交~');
      return false;
    }
    // 整合为一个完整的数据
    newNodeData = {
      id: dataId,
      userEvent: value,
      finished: false,
      userDate: date
    };

    // 添加节点
    newNode = refreshOneNode(newNodeData);
    newNode.setAttribute('data-index', newNodeData.id);
    parent.insertBefore(newNode, parent.firstChild);

    // 重置输入框为0
    input.value = '';

    // 将新节点的数据添加到数据库中
    DB.createOneData(newNodeData);
    return 0;
  }

  // 格式化日期，用来格式化li中的日期显示
  function getNewDate(fmt) {
    var newDate = new Date();
    var newfmt = fmt;
    var o = {
      'y+': newDate.getFullYear(),
      'M+': newDate.getMonth() + 1, // 月份
      'd+': newDate.getDate(), // 日
      'h+': newDate.getHours(), // 小时
      'm+': newDate.getMinutes() // 分
    };

    for (var k in o) {
      if (new RegExp('(' + k + ')').test(newfmt)) {
        if (k === 'y+') {
          newfmt = newfmt.replace(RegExp.$1, ('' + o[k]).substr(4 - RegExp.$1.length));
        } else if (k === 'S+') {
          var lens = RegExp.$1.length;
          lens = lens === 1 ? 3 : lens;
          newfmt = newfmt.replace(RegExp.$1, ('00' + o[k]).substr(('' + o[k]).length - 1, lens));
        } else {
          newfmt = newfmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
        }
      }
    }

    return newfmt;
  }


  /* 添加回车键触发list的事件处理函数  */

  function handleEnterEvent(e) {
    if (e.keyCode === 13) {
      addOneList();
    }
  }


  /* 点击li的事件处理函数  */

  // 利用事件代理，将本来绑定在每个li上的事件处理函数绑定在ul上
  function handleLiClickDelegation(e) {
    var thisLi = e.target;

    if (thisLi.getAttribute('data-index')) {
      var dataIndex = parseInt(thisLi.getAttribute('data-index'), 10); // 获得对应id值, 并转化为数字，方便查询
      DB.retrieveOneData(dataIndex, switchLi, [thisLi]);
    }
  }

  function switchLi(data, thisLi) {
    console.log(data);
    thisLi.finished = !data.finished; // 切换
    if (thisLi.finished) {  // 添加样式
      thisLi.classList.add('checked');
    } else {
      thisLi.classList.remove('checked');
    }
    data.finished = thisLi.finished;  // 修改数据

    // 把数据同步到数据库
    DB.updateOneDate(data);
  }


  /* li上[x]点击的事件处理函数（删除这一条list）  */

  function handleXClickDelagation(e) {
    if (e.target.className === 'close') {
      var nodeId = parseInt(e.target.getAttribute('data-x'), 10); // 取得之前设置的自定义属性，保存的就是数据库中对应的id
      deleteOneData(nodeId);
    }
  }

  function deleteOneData(nodeId) {
    DB.deleteOneData(nodeId); // 从数据库中删除，并在删除后调用
    showData(); // 从修改后的数据库中重新展示list
  }

  /* 显示所有 已/未 完成list的事件处理函数  */

  function showWhetherDone(whether) {
    var key = 'finished'; // 设置key为finished
    resetNodes();   // 先重置ul列表
    DB.retrieveDataWhetherDone(whether, key, refreshNodes); // 从数据库中获取数据并用回调函数来展示
    console.log('显示数据完毕');
  }

  // 显示所有已完成的list
  function showDataDone() {
    showWhetherDone(true);
  }

  // 显示所有未完成的list
  function showDataTodo() {
    showWhetherDone(false);
  }

  /* 删除所有数据的事件处理函数  */

  // 删除所有list数据
  function deleteAllData() {
    resetNodes();         // 重置DOM节点，先从视觉上删除
    DB.deleteAllData();  // 从数据库中删除，真正的删除数据
  }
}());

},{"indexeddb-crud":1}]},{},[2]);
