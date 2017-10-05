'use strict';
(function goToDo() {
  var DB = require('indexeddb-crud'); // 导入模块并重命名
  var dbConfig = { // 创建数据库配置参数
    name: 'justToDo',
    version: '6',
    key: 'id',
    storeName: 'user'
  };
  dbConfig.dataDemo = { // 配置想要的数据结构存入数据库
    id: 0,
    event: 0,
    finished: true,
    date: 0
  };

  DB.init(dbConfig, addEventListeners); // 启动indexedDB，并调用展示数据函数、添加所有事件处理的函数


  /* 经常调用的函数 */

  // 数据库启动完成后显示数据，以及添加事件处理函数
  function addEventListeners() {
    var myUl = document.querySelector('#myUl');

    show(); // 将数据展示
    // 添加事件处理函数
    myUl.addEventListener('click', handleLiClickDelegation, false);
    myUl.addEventListener('click', handleXClickDelagation, false);
    document.querySelector('#add').addEventListener('click', addList, false);
    document.addEventListener('keydown', handleEnterEvent, true);
    document.querySelector('#done').addEventListener('click', showDone, false);
    document.querySelector('#todo').addEventListener('click', showTodo, false);
    document.querySelector('#all').addEventListener('click', show, false);
    document.querySelector('#delete').addEventListener('click', clear, false);
  }

  // 重置所有节点为0
  function resetNodes() { // 重置ul为0
    var root = document.querySelector('#myUl');

    while (root.hasChildNodes()) {
      root.removeChild(root.firstChild); // 这是最快的清除所有子节点的方法
    }
  }

  // show同时也是all的事件处理函数
  function show() { // 取出并展示所有list数据
    resetNodes(); // 先重置ul
    DB.getAll(refreshNodes); // 向retrieveAllData传入回调函数
    // 这样数据库一旦数据查询完毕/数据装在到数组中，就调用refreshNodes来展示数据
  }

  function refreshNodes(dataArr) { // 刷新一组节点，并展示出来
    var fragmentUnfishied = document.createDocumentFragment(); // 利用fragment来包裹li们，这样可以将多次DOM操作减少为一次DOM操作
    var fragmentFinished = document.createDocumentFragment();
    var fragment = document.createDocumentFragment();
    var i;
    var len = dataArr.length;

    // 将已完成的 list 沉入列表下方
    for (i = 0; i < len; i++) {
      if (dataArr[i].finished) {
        fragmentFinished.insertBefore(refreshOneNode(dataArr[i]), fragmentFinished.firstChild); // 每一个新加入的元素都排在最前面
      } else {
        fragmentUnfishied.insertBefore(refreshOneNode(dataArr[i]), fragmentUnfishied.firstChild); // 每一个新加入的元素都排在最前面
      }
    }
    fragment.appendChild(fragmentUnfishied);
    fragment.appendChild(fragmentFinished);
    // 将fragment添加到DOM中，因为运用了fragment，所以只用操纵这一次DOM就好
    document.querySelector('#myUl').appendChild(fragment);
    console.log('刷新，并展示数据完毕');
  }

  function refreshOneNode(data) { // 刷新一个list节点，并返回一个fragment
    var textDate = document.createTextNode(data.userDate + ': ');
    var textWrap = document.createElement('span');
    var text = document.createTextNode(' ' + data.event);
    var li = document.createElement('li');

    // 包装节点
    textWrap.appendChild(text);
    li.appendChild(textDate);
    li.appendChild(textWrap);
    // 在li的末尾添加span [x]
    addX(li, data.id);
    decorateLi(li, data.finished, data.id);

    return li; // 返回创建的节点，进行进一步操作
  }

  // 给一个li节点添加 span 【x】
  function addX(li, id) {
    var span;
    var x;

    // 给每个li后面加上关闭按钮
    span = document.createElement('span');
    x = document.createTextNode('\u00D7'); // unicode下的【x】
    span.className = 'close';
    span.appendChild(x);
    // 为每个[x]添加data-x属性值，方便对span[x]添加事件处理函数（准确的说是事件代理）
    span.setAttribute('data-x', id);
    li.appendChild(span);
  }

  function decorateLi(li, finished, id) {
    // 根据完成的情况来确定是否添加完成样式
    if (finished) {
      li.classList.add('checked');
    }
    // 为每个节点添加data-id属性值，方便对li添加事件处理函数（准确的说是事件代理）
    if (!li.getAttribute('data-id')) {
      li.setAttribute('data-id', id);
    }
  }

  /* add的事件处理函数 */

  // 添加一条新list数据
  function addList() {
    var newNode;
    var parent = document.querySelector('#myUl');
    var newNodeData = integrateNewNodeData();

    // 向DOM中添加节点
    newNode = refreshOneNode(newNodeData);
    newNode.setAttribute('data-id', newNodeData.id);
    parent.insertBefore(newNode, parent.firstChild);
    // 将新节点的数据添加到数据库中
    DB.add(newNodeData);
  }

  function integrateNewNodeData() {
    var input = document.querySelector('#myInput');
    var value = input.value;
    var date = getNewDate('yyyy年MM月dd日 hh:mm');

    if (value === '') {
      alert('请亲传入数据后重新提交~');
      return false;
    }
    input.value = '';
    // 返回组装好的数据
    return {
      id: DB.getKey(),
      event: value,
      finished: false,
      userDate: date
    };
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


  /* 添加回车键触发list的事件处理函数 */

  function handleEnterEvent(e) {
    if (e.keyCode === 13) {
      addList();
    }
  }


  /* 点击li的事件处理函数 */

  // 利用事件代理，将本来绑定在每个li上的事件处理函数绑定在ul上
  function handleLiClickDelegation(e) {
    var thisLi = e.target;
    var dataId;

    if (thisLi.getAttribute('data-id')) {
      dataId = parseInt(thisLi.getAttribute('data-id'), 10); // 获得对应id值, 并转化为数字，方便查询
      DB.get(dataId, switchLi, [thisLi]); // 获得DB的值，并传入回调函数 switchLi，以及参数 thisLi
    }
  }

  function switchLi(data, thisLi) {
    thisLi.finished = !data.finished; // 切换
    if (thisLi.finished) { // 添加样式
      thisLi.classList.add('checked');
    } else {
      thisLi.classList.remove('checked');
    }
    data.finished = thisLi.finished; // 修改数据
    // 把数据同步到数据库
    DB.update(data, show); // 数据库修改完成后刷新列表，将完成的数据沉入列表下方
  }


  /* li上[x]点击的事件处理函数（删除这一条list） */

  function handleXClickDelagation(e) {
    var dataId;

    if (e.target.className === 'close') {
      dataId = parseInt(e.target.getAttribute('data-x'), 10); // 取得之前设置的自定义属性，保存的就是数据库中对应的id
      deleteList(dataId);
    }
  }

  function deleteList(dataId) {
    DB.delete(dataId); // 从数据库中删除，并在删除后调用
    show(); // 从修改后的数据库中重新展示list
  }

  /* 显示所有 已/未 完成list的事件处理函数 */

  function showWhetherDone(whether) {
    var key = 'finished'; // 设置key为finished

    resetNodes(); // 先重置ul列表
    DB.getWhether(whether, key, refreshNodes); // 从数据库中获取数据并用回调函数来展示
    console.log('显示数据完毕');
  }

  // 显示所有已完成的list
  function showDone() {
    showWhetherDone(true);
  }

  // 显示所有未完成的list
  function showTodo() {
    showWhetherDone(false);
  }

  /* 删除所有数据的事件处理函数 */

  // 删除所有list数据
  function clear() {
    resetNodes(); // 重置DOM节点，先从视觉上删除
    DB.clear(); // 从数据库中删除，真正的删除数据
  }
}());
