'use strict';
var addEvents = (function dbFailGenerator() {
  var addEventsGenerator = require('../dbGeneral/addEventsGenerator');
  var eventsHandler = require('../dbFail/eventsHandler');

  return function handler() {
    window.alert('Your browser doesn\'t support a stable version of IndexedDB. We will offer you the without indexedDB mode');
    addEventsGenerator(eventsHandler);
  };
}());

module.exports = addEvents;
