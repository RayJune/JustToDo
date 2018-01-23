'use strict';
var addEvents = (function dbSuccessGenerator() {
  var addEventsGenerator = require('../dbGeneral/addEventsGenerator');
  var eventsHandler = require('../dbSuccess/eventsHandler');

  return function handler() {
    addEventsGenerator(eventsHandler);
  };
}());

module.exports = addEvents;
