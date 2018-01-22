'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _generator = require('./generator');

var _generator2 = _interopRequireDefault(_generator);

var _dbSuccess = require('../eventHandler/dbSuccess');

var _dbSuccess2 = _interopRequireDefault(_dbSuccess);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function addEvents() {
  (0, _generator2.default)(_dbSuccess2.default);
}

exports.default = addEvents;
//# sourceMappingURL=dbSuccess.js.map