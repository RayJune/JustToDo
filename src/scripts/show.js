'use strict';
var show = (function showGenerator() {
  var createNode = require('./createNode.js');

  // init show
  function init(db) {
    clear();
    db.getAll(_refreshInit);
  }

  // clear all nodes (just clear DOM, not db)
  function clear() {
    var root = document.querySelector('#list');

    while (root.hasChildNodes()) {
      root.removeChild(root.firstChild); // the best way to clean childNodes
    }
  }

  function _refreshInit(dataArr) {
    _refresh(dataArr, _initSentence);
  }

  function _refresh(dataArr, sentenceFunc) {
    if (dataArr.length === 0) {
      sentenceFunc();
    } else {
      _refreshPart(dataArr);
    }
  }

  function _initSentence() {
    var text = document.createTextNode('Welcome~, try to add your first to-do list : )');

    _sentenceGenerator(text);
  }

  function _sentenceGenerator(text) {
    var li = document.createElement('li');

    li.appendChild(text);
    li.className = 'aphorism';
    document.querySelector('#list').appendChild(li);
  }

  function _refreshPart(dataArr) {
    // use fragment to reduce DOM operate
    var unfishied = document.createDocumentFragment();
    var finished = document.createDocumentFragment();
    var fusion = document.createDocumentFragment();

    // put the finished item to the bottom
    dataArr.forEach(function classifyData(data) {
      if (data.finished) {
        console.log(createNode(data));
        finished.insertBefore(createNode(data), finished.firstChild);
      } else {
        unfishied.insertBefore(createNode(data), unfishied.firstChild);
      }
    });
    fusion.appendChild(unfishied);
    fusion.appendChild(finished);
    document.querySelector('#list').appendChild(fusion); // add it to DOM
    console.log('refresh list, and show succeed');
  }

  // get all data from DB and show it
  function all(db) {
    clear();
    db.getAll(_refreshAll);
  }

  function _refreshAll(dataArr) {
    _refresh(dataArr, randomAphorism);
  }

  function randomAphorism() {
    var aphorisms = [
      'Yesterday You Said Tomorrow',
      'Why are we here?',
      'All in, or nothing',
      'You Never Try, You Never Know',
      'The unexamined life is not worth living. -- Socrates'
    ];
    var randomIndex = Math.floor(Math.random() * (aphorisms.length + 1));
    var text = document.createTextNode(aphorisms[randomIndex]);

    _sentenceGenerator(text);
  }

  return {
    init: init,
    all: all,
    clear: clear,
    random: randomAphorism
  };
}());

module.exports = show;
