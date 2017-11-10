'use strict';
(function goToDo() {
  var DB = require('indexeddb-crud'); // import module
  var dbConfig = { // config db parameters
    name: 'justToDo',
    version: '6',
    key: 'id',
    storeName: 'user'
  };
  dbConfig.dataDemo = { // config data structure
    id: 0,
    event: 0,
    finished: true,
    date: 0
  };

  // open DB, and when DB open succeed, invoke initial function
  DB.init(dbConfig, addEventListeners);


  /* common use functions */

  // when db is opened succeed, add EventListeners
  function addEventListeners() {
    var myUl = document.querySelector('#myUl');

    show(); // show data
    // add all eventListener
    myUl.addEventListener('click', liClickDelegationHandler, false);
    myUl.addEventListener('click', xClickDelagationHandler, false);
    document.querySelector('#add').addEventListener('click', addList, false);
    document.addEventListener('keydown', enterEventHandler, true);
    document.querySelector('#done').addEventListener('click', showDone, false);
    document.querySelector('#todo').addEventListener('click', showTodo, false);
    document.querySelector('#show').addEventListener('click', show, false);
    document.querySelector('#clear').addEventListener('click', clear, false);
  }

  // get all data from DB and show it
  function show() {
    resetNodes(); // reset dom first
    DB.getAll(refreshNodes); // pass callback to it
  }

  // reset all nodes (just reset dom tempory, not db)
  function resetNodes() {
    var root = document.querySelector('#myUl');

    while (root.hasChildNodes()) {
      root.removeChild(root.firstChild); // this is the best way to clean childNodes
    }
  }

  // refresh lists of node, and show it
  function refreshNodes(dataArr) {
    // use fragment to reduce DOM operating
    var unfishiedFragment = document.createDocumentFragment();
    var finishedFragment = document.createDocumentFragment();
    var fragment = document.createDocumentFragment();

    // put the finished item to the bottom
    dataArr.map(function manageData(data) {
      if (data.finished) {
        finishedFragment.insertBefore(createNode(data), finishedFragment.firstChild);
      } else {
        unfishiedFragment.insertBefore(createNode(data), unfishiedFragment.firstChild);
      }
    });

    fragment.appendChild(unfishiedFragment);
    fragment.appendChild(finishedFragment);
    document.querySelector('#myUl').appendChild(fragment); // operate DOM
    console.log('Refresh list, and show succeed');
  }

  // accept a data, and return a li node
  function createNode(data) {
    var li = document.createElement('li');

    decorateLi(li, data); // decorate li

    return li; // return a li node
  }

  // add span [x] to li's tail
  function addXToLi(li, id) {
    var span = document.createElement('span');
    var x = document.createTextNode('\u00D7'); // unicode -> x

    span.appendChild(x);
    span.className = 'close'; // add style
    setDataProperty(span, 'data-x', id); // add property to span (data-x), for xClickDelagationHandler
    li.appendChild(span);
  }

  function decorateLi(li, data) {
    var textDate = document.createTextNode(data.userDate + ': ');
    var textWrap = document.createElement('span');
    var text = document.createTextNode(' ' + data.event);

    // wrap node
    textWrap.appendChild(text);
    li.appendChild(textDate);
    li.appendChild(textWrap);
    if (data.finished) {  // add css-style to it (according to it's data.finished value)
      li.classList.add('checked');
    }
    setDataProperty(li, 'data-id', data.id); // add property to li (data-id)，for  liClickDelegationHandler
    addXToLi(li, data.id); // add span [x] to li's tail
  }

  function setDataProperty(target, name, data) {
    target.setAttribute(name, data);
  }

  /* add's event handler */

  // add one new list
  function addList() {
    var inputValue = document.querySelector('#myInput').value;
    var parent = document.querySelector('#myUl');
    var newNodeData;
    var newNode;

    if (inputValue === '') {
      alert('please input a real data~');
      return false;
    }
    newNodeData = integrateNewNodeData(inputValue); // integrate a NewNode data
    newNode = createNode(newNodeData);  // generate a new li node
    parent.insertBefore(newNode, parent.firstChild);
    inputValue = '';  // reset input'values
    DB.add(newNodeData);  // add to DB

    return 0;
  }

  function integrateNewNodeData(value) {
    // return integrated data
    return {
      id: DB.getNewDataKey(),
      event: value,
      finished: false,
      userDate: getNewDate('yyyy年MM月dd日 hh:mm')
    };
  }


  /* enter's event handler */

  function enterEventHandler(e) {
    if (e.keyCode === 13) {
      addList();
    }
  }


  /* li's event handler */

  // use event-delegation
  function liClickDelegationHandler(e) {
    var thisLi = e.target;
    var dataId;

    if (thisLi.getAttribute('data-id')) {
      dataId = parseInt(thisLi.getAttribute('data-id'), 10); // use previously stored data
      DB.get(dataId, switchLi, [thisLi]); // pass switchLi and param [thisLi] as callback
    }
  }

  function switchLi(data, thisLi) {
    thisLi.finished = !data.finished; // switch
    if (thisLi.finished) {
      thisLi.classList.add('checked');
    } else {
      thisLi.classList.remove('checked');
    }
    data.finished = thisLi.finished;  // toggle data.finished
    DB.update(data, show); // update DB
  }


  /* [x]'s event handler */

  // use event-delegation, too
  function xClickDelagationHandler(e) {
    var dataId;

    if (e.target.className === 'close') {
      // use previously stored data
      dataId = parseInt(e.target.getAttribute('data-x'), 10);
      deleteList(dataId);
    }
  }

  function deleteList(dataId) {
    DB.delete(dataId, show); // delete in DB and show list again
  }


  /* show whether done event handler */

  function showWhetherDone(whether) {
    var condition = 'finished'; // set 'finished' as condition

    resetNodes(); // reset nodes firstly
    DB.getWhether(whether, condition, refreshNodes); // pass callback function
    console.log('Aha, show data succeed');
  }

  // show item done
  function showDone() {
    showWhetherDone(true);
  }

  // show item todo
  function showTodo() {
    showWhetherDone(false);
  }


  /* clear's event handler */

  function clear() {
    resetNodes(); // clear nodes visually
    DB.clear(); // clear data indeed
  }


  /* other function */

  // Format date
  function getNewDate(fmt) {
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
}());
