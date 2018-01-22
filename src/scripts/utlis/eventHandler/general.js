'use strict';
var general = (function generalGenerator() {
  var getFormatDate = require('../getFormatDate');

  var ifEmpty = {
    removeInit: function removeInit() {
      var list = document.querySelector('#list');

      if (list.firstChild.className === 'aphorism') {
        list.removeChild(list.firstChild);
      }
    }
  };

  function resetInput() {
    document.querySelector('#input').value = '';
  }

  function dataGenerator(key, value) {
    return {
      id: key,
      event: value,
      finished: false,
      date: getFormatDate('MM月dd日hh:mm') + ' '
    };
  }

  return {
    ifEmpty: ifEmpty,
    resetInput: resetInput,
    dataGenerator: dataGenerator
  };
}());

module.exports = general;
