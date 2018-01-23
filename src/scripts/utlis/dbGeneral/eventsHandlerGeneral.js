'use strict';
var eventsHandlerGeneral = (function generalGenerator() {
  var getFormatDate = require('../getFormatDate');

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
    resetInput: resetInput,
    dataGenerator: dataGenerator
  };
}());

module.exports = eventsHandlerGeneral;
