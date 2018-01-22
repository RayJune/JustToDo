'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _generator = require('./generator');

var _generator2 = _interopRequireDefault(_generator);

var _dbFail = require('../eventHandler/dbFail');

var _dbFail2 = _interopRequireDefault(_dbFail);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function addEvents() {
  window.alert('Your browser doesn\'t support a stable version of IndexedDB. We will offer you the without indexedDB mode');
  (0, _generator2.default)(_dbFail2.default);
}

exports.default = addEvents;
//# sourceMappingURL=dbFail.js.map