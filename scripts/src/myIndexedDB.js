'use strict';
// use module pattern
var handleIndexedDB = (function handleIndexedDB() {
  /* initial indexedDB functions */

  // two private property
  var userID;
  var dbResult;

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
    // callback
    request.onsuccess = function success(e) {
      dbResult = e.target.result;
      getId();
      if (callback) {
        callback();
      }
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

  // set now id value to userId (the private property) 
  function getId() {
    var storeHander = handleTransaction(true);
    var range = rangeToAll();

    storeHander.openCursor(range, 'next').onsuccess = function get(e) {
      var cursor = e.target.result;

      if (cursor) {
        cursor.continue();
        userID = cursor.value.id;
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
      console.log('Great, get data succeed');
    };
    getDataIndex.onsuccess = function getDataIndexSuccess() {
      console.log('Pity, get data faild');
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
      console.log('delete ' + index + 'faild');
    };
    deleteOpt.onsuccess = function success() {
      console.log('delete' + index +  'succeed');
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
  function getPresentId() {
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
