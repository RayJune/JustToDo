'use strict';
// use module pattern
var myIndexedDB = (function handleIndexedDB() {
  /* 初始化db用到的函数 */

  function init(dbConfig, initCallback) {
    // 首先检测浏览器indexedDB可用性
    if (!window.indexedDB) {
      window.alert('Your browser doesn\'t support a stable version of IndexedDB. Such and such feature will not be available.');
      return 0;
    }
    if (initCallback) {
      openDB(dbConfig, initCallback);  // 启动indexedDB
    }

    return 0;
  }

  function openDB(dbConfig, openDBCallback) {
    var request = indexedDB.open(dbConfig.name, dbConfig.version); // 打开数据库

    request.onerror = function error() {
      console.log('indexDB加载失败');
    };
    // 异步处理成功后才能获取到
    request.onsuccess = function success(e) {
      myIndexedDB.db = e.target.result;
      myIndexedDB.userId = getId();
      if (openDBCallback) {
        openDBCallback();
      }
    };

    request.onupgradeneeded = function schemaChanged(e) { // 在我们请求打开的数据库的版本号和已经存在的数据库版本号不一致的时候调用。
      myIndexedDB.db = e.target.result;
      if (!myIndexedDB.db.objectStoreNames.contains('user')) {
        // 在这里可以设置键值，也可以是auto
        var store = myIndexedDB.db.createObjectStore('user', { keyPath: 'id', autoIncrement: true }); // 创建db
      }
      // 在这里新建好一个数据库demo
      store.add(dbConfig.dataDemo);
    };
  }

  // private method

  function handleTransaction(whetherWrite) {
    var transaction;
    if (whetherWrite) {
      transaction = myIndexedDB.db.transaction(['user'], 'readwrite');
    } else {
      transaction = myIndexedDB.db.transaction(['user']);
    }
    return transaction.objectStore('user');
  }

  function rangeToAll() {
    return IDBKeyRange.lowerBound(0, true);
  }

  // 获取当前的ID值，openDB中要用
  function getId() {
    var storeHander = handleTransaction(true);
    var range = rangeToAll();

    storeHander.openCursor(range, 'next').onsuccess = function get(e) {
      var cursor = e.target.result;

      if (cursor) {
        cursor.continue();
        myIndexedDB.userId = cursor.value.id;
      } else {
        console.log('现在的id为:' + myIndexedDB.userId);
      }
    };
  }

  /* 操作数据库用到的函数 CRUD */

  // Create 增加
  // 添加一个数据到数据库中
  function createOneData(newData, createOneDataCallback, callbackParaArr) {
    // 添加list数据到数据库中
    var storeHander = handleTransaction(true);
    var addOpt = storeHander.add(newData);
    addOpt.onerror = function error() {
      console.log('添加到数据库失败');
    };
    addOpt.onsuccess = function success() {
      console.log('添加到数据库成功');
      if (createOneDataCallback) { // 如果传入回调函数，则数据库添加成功后调用回调函数
        if (!callbackParaArr) {
          createOneDataCallback();
        } else {
          createOneDataCallback.apply(null, callbackParaArr);
        }
      }
    };
  }

  // Retrieve: 读取
  // 根据一个index值读取数据库的一个数据，并在读取后调用回调函数
  function retrieveOneData(index, retrieveOneDataCallback, callbackParaArr) {
    var storeHander = handleTransaction(false);
    var getDataIndex = storeHander.get(index);  // 在数据库中获取到相应的对象数值

    getDataIndex.onerror = function getDataIndexError() {
      console.log('查找数据失败');
    };
    getDataIndex.onsuccess = function getDataIndexSuccess() {
      console.log('查找数据成功');
      if (!callbackParaArr) {
        retrieveOneDataCallback(getDataIndex.result);  // 获取数据成功后调用回调函数
      } else {
        callbackParaArr.unshift(getDataIndex.result); // 将获取到的数据添加到数组头
        retrieveOneDataCallback.apply(null, callbackParaArr);
      }
    };
  }

  // 根据传入的条件，读取 未/已 完成的数据，并在读取后调用回调函数
  function retrieveDataWhetherDone(whether, key, retrieveDataWhetherDoneCallback, callbackParaArr) {
    var dataArr = []; // 用数组来存储每一条符合要求的数据，最后再统一加入文档节点
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
      } else if (retrieveDataWhetherDoneCallback) {
        if (!callbackParaArr) {
          retrieveDataWhetherDoneCallback(dataArr);  // 将符合条件的li数据整合为数组传入回调函数
        } else {
          callbackParaArr.unshift(dataArr);
          retrieveDataWhetherDoneCallback.apply(null, callbackParaArr);
        }
      }
    };
  }

  // 获取数据库的所有数据
  function retrieveAllData(retrieveAllDataCallback, callbackParaArr) {
    var storeHander = handleTransaction(true);
    var range = rangeToAll();
    var allDataArr = [];

    storeHander.openCursor(range, 'next').onsuccess = function getAllData(e) {
      var cursor = e.target.result;

      if (cursor) {
        allDataArr.push(cursor.value);
        cursor.continue();
      } else if (retrieveAllDataCallback) {
        if (!callbackParaArr) {
          retrieveAllDataCallback(allDataArr);  // 此时数据装载完毕，执行回调函数
        } else {
          callbackParaArr.unshift(allDataArr);
          retrieveAllDataCallback.apply(null, callbackParaArr);
        }
      }
    };
  }

  // Update: 更新
  // 更新一个数据同步到数据库中
  function updateDate(changedData, updateDateCallback, callbackParaArr) {
    var storeHander = handleTransaction(true);

    console.log(changedData);
    var putStore = storeHander.put(changedData);
    putStore.onerror = function putStoreError() {
      console.log('修改数据失败');
    };
    putStore.onsuccess = function putStoreSuccess() {
      console.log('修改数据成功');
      if (updateDateCallback) {
        if (!callbackParaArr) {
          updateDateCallback();
        } else {
          updateDateCallback.apply(null, callbackParaArr);
        }
      }
    };
  }

  // Delete 删除

  // 删除数据库中的一个数据
  function deleteOneData(dataId, deleteOneDataCallback, callbackParaArr) {
    var storeHander = handleTransaction(true);
    var deleteOpt = storeHander.delete(dataId); // 将当前选中li的数据从数据库中删除

    deleteOpt.onerror = function error() {
      console.log('删除' + dataId + '到数据库失败');
    };
    deleteOpt.onsuccess = function success() {
      console.log('删除' + dataId +  '到数据库成功');
      if (deleteOneDataCallback) {
        if (!callbackParaArr) {
          deleteOneDataCallback();
        } else {
          deleteOneDataCallback.apply(callbackParaArr);
        }
      }
    };
  }

  // 删除数据库中的所有数据
  function deleteAllData(deleteAllDataCallback, callbackParaArr) {
    var storeHander = handleTransaction(true);
    var range = rangeToAll();

    storeHander.openCursor(range, 'next').onsuccess = function deleteData(e) {
      var cursor = e.target.result;
      var requestDel;

      if (cursor) {
        requestDel = cursor.delete();
        requestDel.onsuccess = function success() {
          console.log('删除数据成功');
        };
        requestDel.onerror = function error() {
          console.log('删除全部数据失败');
        };
        cursor.continue();
      } else if (deleteAllDataCallback) {
        if (!callbackParaArr) {
          deleteAllDataCallback();
        } else {
          deleteAllDataCallback.apply(null, this);
        }
      }
    };
  }


  /* public interface */
  return {
    init: init,
    createOneData: createOneData,
    retrieveOneData: retrieveOneData,
    retrieveDataWhetherDone: retrieveDataWhetherDone,
    retrieveAllData: retrieveAllData,
    updateDate: updateDate,
    deleteOneData: deleteOneData,
    deleteAllData: deleteAllData
  };
}());

module.exports = myIndexedDB;
