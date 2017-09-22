// 创建MyIndexedDB '类'
function MyIndexedDB(cfg) { 
  this.init = function initDB(func) {
    // 首先检测浏览器indexedDB可用性
    if (!window.indexedDB) {
      window.alert('Your browser doesn\'t support a stable version of IndexedDB. Such and such feature will not be available.');
      return 0;
    }

    var request = indexedDB.open(cfg.dbname, cfg.dbVersion); // 打开数据库

    request.onerror = function error() {
      console.log('indexDB加载失败');
    };
    // 异步处理成功后才能获取到
    request.onsuccess = function success(event) {
      this.db = event.target.result;
      this.userId = (function getId() {
        var transaction = this.db.transaction(['user'], 'readwrite'); // FIXME: Cannot read property 'transaction' of undefined
        var storeHander = transaction.objectStore('user');
        var range = IDBKeyRange.lowerBound(0);
    
        storeHander.openCursor(range, 'next').onsuccess = function get(e) {
          var cursor = e.target.result;
    
          if (cursor) {
            cursor.continue();
            this.userId = cursor.value.id;
          } else {
            console.log('现在的id为:' + this.userId);
          }
        }
      }());
      func();  // 配置数据库，并在数据库调用成功后开始添加事件处理函数
    };

    request.onupgradeneeded = function schemaChanged(event) { // 在我们请求打开的数据库的版本号和已经存在的数据库版本号不一致的时候调用。
      this.db = event.target.result;
      if (!this.db.objectStoreNames.contains('user')) {
        // 在这里可以设置键值，也可以是auto
        var store = this.db.createObjectStore('user', { keyPath: 'id', autoIncrement: true }); // 创建db
      }
      // 在这里新建好一个数据库demo
      store.add({
        id: 0,
        userEvent: 0,
        finished: true,
        date: 0
      });
    };
    return 0;
  };

  /* 操作数据库用到的函数 CRUD */

  // Create 增加
  // 添加一个数据到数据库中
  this.createOneDataToDB = function createOneDataToDB(newData) {
    // 添加list数据到数据库中
    var transaction = this.db.transaction(['user'], 'readwrite');
    var storeHander = transaction.objectStore('user');
    var addOpt = storeHander.add(newData);
    addOpt.onerror = function error() {
      console.log('添加到数据库失败');
    };
    addOpt.onsuccess = function success() {
      console.log('添加到数据库成功');
      console.log('您添加的数据为：' + newData.userDate + ':  ' + newData.userEvent); // 打印一下写入的数据
    };
  };

  // Retrieve: 读取
  // 根据一个index值读取数据库的一个数据，并在读取后调用回调函数
  this.retrieveOneDataFromDB = function retrieveOneDataFromDB(index, func, that) {
    var transaction = this.db.transaction(['user']);
    var storeHander = transaction.objectStore('user');
    var getDataIndex = storeHander.get(index);  // 在数据库中获取到相应的对象数值

    getDataIndex.onerror = function getDataIndexError() {
      console.log('查找数据失败');
    };
    getDataIndex.onsuccess = function getDataIndexSuccess() {
      console.log('查找数据成功');
      func(getDataIndex.result, that);  // 获取数据成功后调用回调函数
    };
  };

  // 根据传入的条件，读取 未/已 完成的数据，并在读取后调用回调函数
  this.retrieveDataWhetherDoneFromDB = function retrieveDataWhetherDoneFromDB(whether, func) {
    var dataArr = []; // 用数组来存储每一条符合要求的数据，最后再统一加入文档节点
    var transaction = this.db.transaction(['user'], 'readwrite');
    var storeHander = transaction.objectStore('user');
    var range = IDBKeyRange.lowerBound(0, true);

    storeHander.openCursor(range, 'next').onsuccess = function showWhetherDoneData(e) {
      var cursor = e.target.result;

      if (cursor) {
        if (whether) {
          if (cursor.value.finished) {
            dataArr.push(cursor.value);
          }
        } else if (!whether) {
          if (!cursor.value.finished) {
            dataArr.push(cursor.value);
          }
        }
        cursor.continue();
      } else {
        func(dataArr);  // 将符合条件的li数据整合为数组传入回调函数
      }
    };
  };

  // 获取数据库的所有数据
  this.retrieveAllDataFromDB = function retrieveAllDataFromDB(refresh) {
    var transaction = this.db.transaction(['user'], 'readwrite');
    var storeHander = transaction.objectStore('user');
    var range = IDBKeyRange.lowerBound(0, true);
    var allDataArr = [];

    storeHander.openCursor(range, 'next').onsuccess = function getAllData(e) {
      var cursor = e.target.result;

      if (cursor) {
        allDataArr.push(cursor.value);
        cursor.continue();
      } else {
        refresh(allDataArr);  // 此时数据装载完毕，执行回调函数
      }
    };
  };

  // Update: 更新
  // 更新一个数据同步到数据库中
  this.updateDateInDB = function updateDateInDB(changedData) {
    var transaction;
    var storeHander;
    transaction = this.db.transaction(['user'], 'readwrite');
    storeHander = transaction.objectStore('user');

    console.log(changedData);
    var putStore = storeHander.put(changedData);
    putStore.onerror = function putStoreError() {
      console.log('修改数据失败');
    };
    putStore.onsuccess = function putStoreSuccess() {
      console.log('修改数据成功');
    };
  };

  // Delete 删除

  // 删除数据库中的一个数据
  this.deleteOneDataInDB = function deleteOneDataInDB(dataId) {
    var transaction = this.db.transaction(['user'], 'readwrite');
    var storeHander = transaction.objectStore('user');
    var deleteOpt = storeHander.delete(dataId); // 将当前选中li的数据从数据库中删除

    deleteOpt.onerror = function error() {
      console.log('删除' + dataId + '到数据库失败');
    };
    deleteOpt.onsuccess = function success() {
      console.log('删除' + dataId +  '到数据库成功');
    };
  };

  // 删除数据库中的所有数据
  this.deleteAllDataInDB = function deleteAllDataInDB() {
    var transaction = this.db.transaction(['user'], 'readwrite');
    var storeHander = transaction.objectStore('user');
    var range = IDBKeyRange.lowerBound(0, true);

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
      }
    };
  };
}
