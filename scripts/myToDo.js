// 处理浏览器兼容性
(function myToDo() {
  /* 配置数据库，并在数据库调用成功后开始添加事件处理函数  */

  // 首先检测浏览器indexedDB可用性
  if (!window.indexedDB) {
    window.alert('Your browser doesn\'t support a stable version of IndexedDB. Such and such feature will not be available.');
    return false;
  }

  var cfg = {
    dbname: 'justToDo',
    dbVersion: '1'
  };
  var db;
  var userId;
  var request = indexedDB.open(cfg.dbname, cfg.dbVersion); // 打开数据库

  request.onerror = function error() {
    console.log('indexDB加载失败');
  };
  // 异步处理成功后才能获取到
  request.onsuccess = function success(event) {
    db = event.target.result;
    showData(); // 将数据展示
    userId = getId();
    // 添加事件处理函数
    document.getElementById('add').addEventListener('click', addOneList, false);
    document.addEventListener('keydown', handleEnterEvent, true);
    document.querySelector('#myUl').addEventListener('click', handleLiClickDelagation, false);
    document.querySelector('#myUl').addEventListener('click', handleXClickDelagation, false);
    document.getElementById('done').addEventListener('click', showDataDone, false);
    document.getElementById('todo').addEventListener('click', showDataTodo, false);
    document.getElementById('all').addEventListener('click', showData, false);
    document.getElementById('delete').addEventListener('click', deleteAllData, false);
  };

  request.onupgradeneeded = function schemaChanged(event) { // 在我们请求打开的数据库的版本号和已经存在的数据库版本号不一致的时候调用。
    db = event.target.result;
    if (!db.objectStoreNames.contains('user')) {
      // 在这里可以设置键值，也可以是auto
      var store = db.createObjectStore('user', { keyPath: 'id', autoIncrement: true }); // 创建db
    }
    // 在这里新建好一个数据库demo
    store.add({
      id: 0,
      userEvent: 0,
      finished: true,
      date: 0
    });
  };

  // 获取当前的ID值
  function getId() {
    var transaction = db.transaction(['user'], 'readwrite');
    var storeHander = transaction.objectStore('user');
    var range = IDBKeyRange.lowerBound(0);

    storeHander.openCursor(range, 'next').onsuccess = function get(e) {
      var cursor = e.target.result;

      if (cursor) {
        cursor.continue();
        userId = cursor.value.id;
      } else {
        console.log('现在的id为:' + userId);
      }
    };
  }


  /* 操作数据库用到的函数 CRUD */

  // Create 增加
  // 添加一个数据到数据库中
  function createOneDataToDB(newData) {
    // 添加list数据到数据库中
    var transaction = db.transaction(['user'], 'readwrite');
    var storeHander = transaction.objectStore('user');
    var addOpt = storeHander.add(newData);
    addOpt.onerror = function error() {
      console.log('添加到数据库失败');
    };
    addOpt.onsuccess = function success() {
      console.log('添加到数据库成功');
      console.log('您添加的数据为：' + newData.userDate + ':  ' + newData.userEvent); // 打印一下写入的数据
    };
  }

  // Retrieve: 读取
  // 根据一个index值读取数据库的一个数据，并在读取后调用回调函数
  function retrieveOneDataFromDB(index, func, that) {
    var transaction = db.transaction(['user']);
    var storeHander = transaction.objectStore('user');
    var getDataIndex = storeHander.get(index);  // 在数据库中获取到相应的对象数值

    getDataIndex.onerror = function getDataIndexError() {
      console.log('查找数据失败');
    };
    getDataIndex.onsuccess = function getDataIndexSuccess() {
      console.log('查找数据成功');
      func(getDataIndex.result, that);  // 获取数据成功后调用回调函数
    };
  }

  // 根据传入的条件，读取 未/已 完成的数据，并在读取后调用回调函数
  function retrieveDataWhetherDoneFromDB(whether, func) {
    var dataArr = []; // 用数组来存储每一条符合要求的数据，最后再统一加入文档节点
    var transaction = db.transaction(['user'], 'readwrite');
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
  }

  // 获取数据库的所有数据
  function retrieveAllDataFromDB(refresh) {
    var transaction = db.transaction(['user'], 'readwrite');
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
  }

  // Update: 更新
  // 更新一个数据同步到数据库中
  function updateDateInDB(changedData) {
    var transaction;
    var storeHander;
    transaction = db.transaction(['user'], 'readwrite');
    storeHander = transaction.objectStore('user');

    console.log(changedData);
    var putStore = storeHander.put(changedData);
    putStore.onerror = function putStoreError() {
      console.log('修改数据失败');
    };
    putStore.onsuccess = function putStoreSuccess() {
      console.log('修改数据成功');
    };
  }

  // Delete 删除

  // 删除数据库中的一个数据
  function deleteOneDataInDB(dataId) {
    var transaction = db.transaction(['user'], 'readwrite');
    var storeHander = transaction.objectStore('user');
    var deleteOpt = storeHander.delete(dataId); // 将当前选中li的数据从数据库中删除

    deleteOpt.onerror = function error() {
      console.log('删除' + dataId + '到数据库失败');
    };
    deleteOpt.onsuccess = function success() {
      console.log('删除' + dataId +  '到数据库成功');
    };
  }

  // 删除数据库中的所有数据
  function deleteAllDataInDB() {
    var transaction = request.result.transaction(['user'], 'readwrite');
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
  }


  /* 经常调用的函数  */

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
    retrieveAllDataFromDB(refreshNodes); // 向retrieveAllDataFromDB传入回调函数
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

    userId++;
    if (value === '') {
      alert('请亲传入数据后重新提交~');
      return false;
    }
    // 整合为一个完整的数据
    newNodeData = {
      id: userId,
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
    createOneDataToDB(newNodeData);
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
  function handleLiClickDelagation(e) {
    var that = e.target;

    if (that.getAttribute('data-index')) {
      var dataIndex = parseInt(that.getAttribute('data-index'), 10); // 获得对应id值, 并转化为数字，方便查询
      retrieveOneDataFromDB(dataIndex, switchLi, that);
    }
  }

  function switchLi(data, that) {
    that.finished = !data.finished; // 切换
    if (that.finished) {  // 添加样式
      that.classList.add('checked');
    } else {
      that.classList.remove('checked');
    }

    data.finished = that.finished;  // 修改数据

    // 把数据同步到数据库
    updateDateInDB(data);
  }


  /* li上[x]点击的事件处理函数（删除这一条list）  */

  function handleXClickDelagation(e) {
    if (e.target.className === 'close') {
      var nodeId = parseInt(e.target.getAttribute('data-x'), 10); // 取得之前设置的自定义属性，保存的就是数据库中对应的id
      deleteOneData(nodeId);
    }
  }

  function deleteOneData(nodeId) {
    deleteOneDataInDB(nodeId); // 从数据库中删除
    // 方式1： 如果考虑到数据库调用有点慢，选择先隐藏当前li
    /*
    var li = document.querySelectorAll('li');
    var i = li.length - 1; // 因为一般用户会删除较新的节点
    var newNodeId = String(nodeId);
    while (li[i].getAttribute('data-index') !== newNodeId) {
      i--;
    }
    li[i].style.display = 'none';
    */

    // 方式2： 对数据库的速度很有信心，就直接展示
    showData(); // 从修改后的数据库中重新展示list

    // 方式3：对数据库的速度没有信心，加一个setTimeout
    // setTimeout(showData, 100);
  }


  /* 显示所有 已/未 完成list的事件处理函数  */

  function showWhetherDone(whether) {
    resetNodes();   // 先重置ul列表
    retrieveDataWhetherDoneFromDB(whether, refreshNodes); // 从数据库中获取数据并用回调函数来展示
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
    deleteAllDataInDB();  // 从数据库中删除，真正的删除数据
  }
  return 0;
}());
