'use strict';
var show = (function showGenerator() {
  var createNode = require('./createNode.js');

  function init(dataArr) {
    _refresh(dataArr, _initSentence);
  }

  function all(dataArr) {
    _refresh(dataArr, randomAphorism);
  }

  function part(dataArr) {
    if (dataArr.length === 0) {
      randomAphorism();
    } else {
      var nodes = dataArr.reduce(function nodeGenerator(result, data) {
        result.insertBefore(createNode(data), result.firstChild);

        return result;
      }, document.createDocumentFragment());

      document.querySelector('#list').appendChild(nodes); // add it to DOM
    }
  }

  function clear() {
    var root = document.querySelector('#list');

    while (root.hasChildNodes()) {
      root.removeChild(root.firstChild); // the best way to clean childNodes
    }
  }

  function randomAphorism() {
    var aphorisms = [
      'Yesterday You Said Tomorrow',
      'Why are we here?',
      'All in, or nothing',
      'You Never Try, You Never Know',
      'The unexamined life is not worth living. -- Socrates'
    ];
    var randomIndex = Math.floor(Math.random() * aphorisms.length);
    var text = document.createTextNode(aphorisms[randomIndex]);

    _sentenceGenerator(text);
  }


  /* private methods */

  function _refresh(dataArr, sentenceFunc) {
    if (dataArr.length === 0) {
      sentenceFunc();
    } else {
      _refreshShow(dataArr);
    }
  }

  function _refreshShow(dataArr) {
    var result = _classifyData(dataArr);

    document.querySelector('#list').appendChild(result); // add it to DOM
  }

  function _classifyData(dataArr) {
    // use fragment to reduce DOM operate
    var unfishied = document.createDocumentFragment();
    var finished = document.createDocumentFragment();
    var fusion = document.createDocumentFragment();

    // put the finished item to the bottom
    dataArr.forEach(function classify(data) {
      if (data.finished) {
        finished.insertBefore(createNode(data), finished.firstChild);
      } else {
        unfishied.insertBefore(createNode(data), unfishied.firstChild);
      }
    });
    fusion.appendChild(unfishied);
    fusion.appendChild(finished);

    return fusion;
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


  /* interface */
  return {
    init: init,
    all: all,
    part: part,
    clear: clear,
    random: randomAphorism
  };
}());

module.exports = show;
