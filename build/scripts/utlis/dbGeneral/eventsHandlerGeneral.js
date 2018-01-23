'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getFormatDate = require('../getFormatDate');

var _getFormatDate2 = _interopRequireDefault(_getFormatDate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var eventsHandlerGeneral = function () {
  function resetInput() {
    document.querySelector('#input').value = '';
  }

  function dataGenerator(key, value) {
    return {
      id: key,
      event: value,
      finished: false,
      date: (0, _getFormatDate2.default)('MM月dd日hh:mm')
    };
  }

  return {
    resetInput: resetInput,
    dataGenerator: dataGenerator
  };
}();

exports.default = eventsHandlerGeneral;
//# sourceMappingURL=eventsHandlerGeneral.js.map