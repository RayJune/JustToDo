'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _addEventsGenerator = require('../dbGeneral/addEventsGenerator');

var _addEventsGenerator2 = _interopRequireDefault(_addEventsGenerator);

var _eventsHandler = require('../dbFail/eventsHandler');

var _eventsHandler2 = _interopRequireDefault(_eventsHandler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function addEvents() {
  window.alert('Your browser doesn\'t support a stable version of IndexedDB. We will offer you the without indexedDB mode');
  (0, _addEventsGenerator2.default)(_eventsHandler2.default);
}

exports.default = addEvents;
//# sourceMappingURL=addEvents.js.map